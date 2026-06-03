import os
import asyncio
import uuid
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Google ADK 2.1.0 Imports
from google.adk.agents import Agent, SequentialAgent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams
from google.genai import types

# Load environment variables
load_dotenv()

# Configure standard logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("xenia")

app = FastAPI(title="iLoveURL AI Multi-Agent Service")

# --- MAS Schemas ---
class TransformationRequest(BaseModel):
    url: str
    tool_type: str
    payload: dict
    workflow_id: Optional[str] = None
    mode: str = "standard"
    firecrawl_access: str = "disabled"
    budget: Dict[str, Any] = {}
    user_id: Optional[str] = None
    task_id: Optional[str] = None
    model: Optional[str] = None

# Initialize Session Service
session_service = InMemorySessionService()
APP_NAME = "iLoveURL-MAS"

# Initialize Firecrawl MCP Toolset
FIRECRAWL_KEY = os.getenv("FIRECRAWL_API_KEY")
firecrawl_tools = None
if FIRECRAWL_KEY:
    firecrawl_tools = [
        McpToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=f"https://mcp.firecrawl.dev/{FIRECRAWL_KEY}/v2/mcp",
            ),
        )
    ]

# --- Agent Factory ---

VALID_MODES = {"quick", "standard", "deep"}
VALID_FIRECRAWL_ACCESS = {"disabled", "limited", "full_deep"}


def normalize_mode(mode: str) -> str:
    return mode if mode in VALID_MODES else "standard"


def normalize_firecrawl_access(firecrawl_access: str) -> str:
    return firecrawl_access if firecrawl_access in VALID_FIRECRAWL_ACCESS else "disabled"


def select_model_id(request: TransformationRequest) -> str:
    mode = normalize_mode(request.mode)
    if mode == "quick":
        return os.getenv("AI_QUICK_MODEL", "deepseek/deepseek-v4-flash")
    return request.model or os.getenv("AI_MODEL", "deepseek/deepseek-v4-pro")


def get_firecrawl_tools_for_agent(agent_role: str, firecrawl_access: str):
    access = normalize_firecrawl_access(firecrawl_access)
    if access == "disabled":
        return []
    if agent_role != "researcher":
        return []
    return firecrawl_tools or []


def build_tool_policy_instruction(mode: str, firecrawl_access: str, budget: Dict[str, Any]) -> str:
    access = normalize_firecrawl_access(firecrawl_access)
    normalized_mode = normalize_mode(mode)
    budget_json = json.dumps(budget or {}, ensure_ascii=False)

    if access == "disabled":
        return f"""
            WORKFLOW MODE: {normalized_mode}
            FIRECRAWL ACCESS: disabled.
            A backend Firecrawl ingestion step has already been performed.
            Use the provided Context Data JSON as the source of truth.
            Do not attempt external web access. If required data is absent, write INSUFFICIENT_DATA or NOT_FOUND.
            WORKFLOW BUDGET: {budget_json}
        """

    return f"""
        WORKFLOW MODE: {normalized_mode}
        FIRECRAWL ACCESS: {access}.
        Tool access is allowed only when the provided Context Data JSON is insufficient.
        Use the fewest Firecrawl calls possible and respect this workflow budget: {budget_json}
    """


def get_orchestrated_agent(tool_type: str, model_id: str, mode: str = "standard", firecrawl_access: str = "disabled", budget: Optional[Dict[str, Any]] = None):
    model_name = f"openrouter/{model_id}" if not model_id.startswith("openrouter/") else model_id
    ai_model = LiteLlm(model=model_name)
    workflow_budget = budget or {}
    max_output_words = int(workflow_budget.get("maxOutputWords") or 750)
    tool_policy = build_tool_policy_instruction(mode, firecrawl_access, workflow_budget)
    researcher_tools = get_firecrawl_tools_for_agent("researcher", firecrawl_access)

    if tool_type == "seo-analyzer":
        seo_researcher = Agent(
            name="seo_researcher",
            instruction=f"""You are a Senior Technical SEO Auditor.
            {tool_policy}
            SOURCE-OF-TRUTH RULES:
            - Firecrawl metadata and markdown-derived SeoWorkflowContext are authoritative for page facts.
            - crawledPages contains the exact pages inspected by the backend workflow.
            - auditSnapshot contains deterministic product judgments: qualitative health statuses, top priorities, owners, impact, effort, schema recommendations, and evidence sources.
            - Quick mode is a single-page scrape. Standard mode is a backend-controlled crawl capped at 3 pages. Deep mode may include a broader backend crawl.
            - PageSpeed Insights performanceSignals are authoritative for Lighthouse and Core Web Vitals facts.
            - Chrome UX Report / CrUX performanceSignals are authoritative for real-user Core Web Vitals when available.
            - When discussing PageSpeed, cite Google PageSpeed Insights from performanceSignals/auditSnapshot evidenceSources.
            - When discussing CrUX, explain that it is real-user Chrome experience data and cite Chrome UX Report from performanceSignals/auditSnapshot evidenceSources.
            - Do not invent tags, headings, canonical URLs, robots directives, links, or word counts.
            - Do not invent performance scores or Core Web Vitals. If PageSpeed is unavailable, write INSUFFICIENT_DATA.
            - If a field is missing, write NOT_FOUND or INSUFFICIENT_DATA.
            - In quick and standard modes, use only Context Data JSON and never request extra crawling.

            ANALYZE:
            1. Title and meta description
            2. Canonical and robots/indexability
            3. Heading hierarchy
            4. Open Graph and Twitter card completeness
            5. Content depth and search intent signals across crawledPages
            6. Internal/external link signals
            7. PageSpeed/Lighthouse and Core Web Vitals signals when available
            8. Chrome UX Report real-user Core Web Vitals when available
            9. auditSnapshot priorities and evidence sources

            Output structured JSON notes only:
            {{
              "technical_findings": [...],
              "content_findings": [...],
              "critical_issues": [...],
              "warnings": [...],
              "passes": [...],
              "opportunities": [...]
            }}

            NO NUMERIC SCORES.""",
            model=ai_model,
            tools=researcher_tools,
            output_key="technical_audit"
        )
        seo_strategist = Agent(
            name="seo_strategist",
            instruction="""You are a Senior SEO Strategist.
            Use technical_audit and Context Data JSON to prioritize what matters for organic visibility.
            Do not invent target keywords or search volume. Infer likely intent only from provided page copy.
            Treat PageSpeed performanceSignals as technical SEO/UX evidence, not as a complete ranking diagnosis.

            Output strategic JSON notes:
            {
              "search_intent": "...|INSUFFICIENT_DATA",
              "priority_order": [...],
              "recommended_fixes": [...],
              "content_opportunities": [...],
              "risk_notes": [...]
            }

            NO NUMERIC SCORES.""",
            model=ai_model,
            output_key="strategic_audit"
        )
        seo_editor = Agent(
            name="seo_editor",
            instruction=f"""You are a Senior SEO Report Architect.
            Synthesize the available audit notes and Context Data JSON into a professional SEO audit with enough detail to be useful to a founder, marketer, or developer.

            Critical rules:
            - Do not add facts not present in notes or Context Data JSON.
            - Use qualitative labels only: Critical, Warning, Pass, Opportunity.
            - No numeric scores.
            - Keep recommendations actionable and ordered by impact.
            - Treat auditSnapshot as authoritative for statuses, owners, impact, effort, and top priority ordering.
            - Do not add a top-level title, report date, analyst name, appendix, final verdict, or conclusion section.
            - Output exactly the required H2 sections below, in this exact order.
            - Each section must contain 3-6 useful bullets or short paragraphs.
            - Do not merely repeat raw facts. Explain what each fact means, why it matters, and the recommended action.
            - Use the crawledPages evidence to discuss page-level patterns in standard and deep mode.
            - Include PageSpeed and CrUX source attribution when referencing performance numbers.

            Required Markdown structure:
            ## SEO Health Snapshot
            ## SEO Audit Overview
            ## Top 3 Priority Fixes
            ## Technical Findings
            ## Performance And Core Web Vitals
            ## Content And Intent
            ## Social Preview Metadata
            ## Developer Fix List
            ## Marketing Next Steps
            ## Evidence Sources

            Target length: 850-{max_output_words} words.""",
            model=ai_model,
            output_key="final_report"
        )
        if normalize_mode(mode) == "quick":
            return SequentialAgent(
                name="seo_mas",
                sub_agents=[seo_researcher, seo_editor]
            )

        return SequentialAgent(
            name="seo_mas",
            sub_agents=[seo_researcher, seo_strategist, seo_editor]
        )

    elif tool_type == "brand-analyzer":
        brand_strategy = Agent(
            name="brand_strategy_analyst",
            instruction=f"""You are a Senior Brand Strategist for iLoveURL.
            {tool_policy}
            SOURCE-OF-TRUTH RULES:
            - Firecrawl branding data in Context Data JSON is authoritative for visual facts.
            - Do not override detected colors, fonts, logos, screenshots, or visual assets.
            - Treat Firecrawl markdown-derived messagingSignals as authoritative copy evidence.
            - Do not invent claims, audiences, taglines, CTAs, colors, fonts, or logos.
            - If data is missing, write NOT_DETECTABLE or INSUFFICIENT_DATA.

            TASK:
            Interpret the provided BrandWorkflowContext into a strategy brief.
            If workflow mode is deep, review messagingSignals.additionalPages as supporting evidence.
            Focus on visual identity meaning, verbal identity, positioning, audience, CTA quality,
            visual-verbal coherence, risks, opportunities, and recommendations.

            OUTPUT structured JSON notes only:
            {{
              "brand_name": "...",
              "visual_facts_source": "firecrawl_branding",
              "messaging_facts_source": "firecrawl_markdown",
              "visual_identity": {{
                "colors": [...],
                "typography": [...],
                "logo": "...|NOT_DETECTABLE",
                "atmosphere": "..."
              }},
              "verbal_identity": {{
                "voice": [...],
                "tone": "...",
                "core_value_proposition": "...|INSUFFICIENT_DATA",
                "audience": "...|INSUFFICIENT_DATA",
                "cta_observations": [...]
              }},
              "brand_coherence": "...",
              "strategic_risks": [...],
              "recommendations": [...],
              "brand_archetype": "..."
            }}

            NO NUMERIC SCORES.""",
            model=ai_model,
            tools=researcher_tools,
            output_key="brand_strategy"
        )
        brand_report = Agent(
            name="brand_report_writer",
            instruction=f"""You are a Creative Director and Brand Report Architect.
            Synthesize brand_strategy into a polished Brand Identity report.

            Critical rules:
            - Firecrawl branding remains the source of truth for visual facts.
            - Do not add colors, fonts, logos, assets, CTAs, or claims not present in brand_strategy or Context Data.
            - Do not add report dates, analyst names, confidence percentages, or metadata headers unless provided in Context Data.
            - Use NOT_DETECTABLE or INSUFFICIENT_DATA when evidence is missing.
            - Focus on interpretation, coherence, positioning, and actionable recommendations.
            - Be concise. Do not restate every extracted fact unless it supports a strategic point.
            - Prefer compact paragraphs and short bullets.

            Required Markdown structure:
            ## Brand Identity Overview
            ## Visual Identity
            Include a Color Palette table if colors were detected.
            ## Verbal Identity
            ## Brand Coherence Matrix
            ## Strategic Recommendations
            ## Brand Archetype Signal

            Use descriptive status tiers only, not numeric scores.
            Target length: 550-{max_output_words} words.""",
            model=ai_model,
            output_key="final_report"
        )

        return SequentialAgent(
            name="brand_mas",
            sub_agents=[brand_strategy, brand_report]
        )

    elif tool_type == "article-summary":
        summary_analyst = Agent(
            name="summary_analyst",
            instruction=f"""You are a senior research summarizer for iLoveURL.
            {tool_policy}
            SOURCE-OF-TRUTH RULES:
            - SummaryWorkflowContext metadata and contentSignals are authoritative.
            - Do not invent author, publication date, claims, numbers, quotes, or source details.
            - Treat selectedMarkdownExcerpt and keyLines as evidence from the source.
            - Use only content that directly explains the article/page topic.
            - Ignore navigation, ads, recommendations, author bio boxes, contact text, correction policies, editorial policy, cookie/privacy text, and footer boilerplate.
            - If a line is about the publisher's process rather than the page topic, exclude it from key points and details.
            - If the source is generic, documentation, landing page, report, article, or job post, adapt the explanation to that source type.
            - If context is missing, write NOT_FOUND or INSUFFICIENT_DATA.

            TASK:
            Extract the source's thesis, key points, supporting details, audience relevance, and practical takeaways.
            Keep notes concise, relevant, and evidence-based.

            Output structured JSON notes only:
            {{
              "source_type": "...",
              "main_thesis": "...|INSUFFICIENT_DATA",
              "key_points": [...],
              "important_details": [...],
              "why_it_matters": "...",
              "actionable_takeaways": [...],
              "missing_context": [...],
              "faq": [
                {{"question": "...", "answer": "..."}}
              ]
            }}

            Do not use long direct quotes.""",
            model=ai_model,
            output_key="summary_notes"
        )
        summary_writer = Agent(
            name="summary_writer",
            instruction=f"""You are a professional summary report writer.
            Use summary_notes when available and Context Data JSON to produce a clean general-purpose URL summary.

            Critical rules:
            - Do not add facts not present in summary_notes or Context Data JSON.
            - In quick mode, summary_notes may be absent; use Context Data JSON directly.
            - Prioritize topic relevance over mechanical extraction. Do not include boilerplate, contact policies, correction policies, privacy/cookie text, recommendations, or unrelated site navigation.
            - If summary_notes accidentally include off-topic publisher boilerplate, omit it from the final report.
            - Do not include a report date, analyst name, conclusion, or final verdict section.
            - Output exactly the required H2 sections below, in this exact order.
            - Use natural, readable paragraphs and bullets. Use bullets whenever they make the read-only document easier to scan, especially for key points, details, limits, and takeaways.
            - The structure should be consistent, but the writing should not feel robotic or over-templated.
            - Explain what the source says, why it matters, and what a reader should remember.

            Required Markdown structure:
            ## Source Snapshot
            ## Executive Summary
            ## Key Points
            ## Important Details
            ## Why It Matters
            ## Actionable Takeaways
            ## Limits And Missing Context
            ## FAQ

            Target length: 500-{max_output_words} words.""",
            model=ai_model,
            output_key="final_report"
        )

        return SequentialAgent(
            name="summary_mas",
            sub_agents=[summary_analyst, summary_writer]
        )

    elif tool_type == "study-notes":
        study_writer = Agent(
            name="study_notes_writer",
            instruction=f"""You are an expert learning designer for iLoveURL.
            {tool_policy}
            SOURCE-OF-TRUTH RULES:
            - Use only Context Data JSON as source evidence.
            - Do not invent concepts, definitions, dates, claims, formulas, or quiz answers.
            - If a learning item cannot be supported by source evidence, write INSUFFICIENT_DATA.

            TASK:
            Create study notes that help a learner understand, review, and test themselves on the source.
            Keep the output practical and organized.

            Required Markdown structure:
            ## Learning Overview
            ## Core Concepts
            ## Structured Notes
            ## Concept Map Guide
            ## Flashcard Review
            ## Quiz Yourself
            ## Review Plan

            Rules:
            - Use concise bullets.
            - Include quiz answers.
            - Explain relationships between concepts when possible.
            - Target length: 650-{max_output_words} words.""",
            model=ai_model,
            output_key="final_report"
        )

        return SequentialAgent(
            name="study_notes_mas",
            sub_agents=[study_writer]
        )

    elif tool_type == "cross-article":
        comparison_writer = Agent(
            name="cross_article_comparison_writer",
            instruction=f"""You are a senior research editor for iLoveURL.
            {tool_policy}
            SOURCE-OF-TRUTH RULES:
            - Context Data JSON contains multiple scraped article excerpts and metadata.
            - Use only the provided article evidence. Do not invent claims, publication dates, authors, quotes, sources, or facts.
            - Treat article titles, URLs, descriptions, metadata, and markdownExcerpt as source evidence.
            - If sources cover different topics or have weak overlap, say that clearly instead of forcing a comparison.
            - Ignore navigation, cookie notices, related links, ads, footers, publisher policies, and boilerplate.
            - Do not decide which source is politically or morally correct unless the evidence directly supports a factual contradiction.

            TASK:
            Compare the articles side by side for a founder, marketer, researcher, or reader who wants to understand:
            what the sources agree on, where they differ, what each source uniquely contributes, what may be missing,
            and what the reader should verify before sharing or citing.

            Required Markdown structure:
            ## Comparison Snapshot
            ## Shared Facts
            ## Key Differences
            ## Source-By-Source View
            ## Unique Claims Or Angles
            ## Evidence Quality And Missing Context
            ## What To Verify Before Sharing
            ## Reader Takeaway

            Rules:
            - Use bullets and compact tables where helpful.
            - Mention each source by source number or title.
            - In Key Differences, separate framing differences from factual contradictions.
            - In Source-By-Source View, include 2-4 bullets per readable source.
            - If a fact appears in only one source, label it as single-source.
            - Target length: 750-{max_output_words} words.""",
            model=ai_model,
            output_key="final_report"
        )

        return SequentialAgent(
            name="cross_article_mas",
            sub_agents=[comparison_writer]
        )

    elif tool_type == "presentation":
        presentation_writer = Agent(
            name="presentation_deck_writer",
            instruction=f"""You are a senior presentation strategist and deck designer for iLoveURL.
            {tool_policy}
            SOURCE-OF-TRUTH RULES:
            - Use only Context Data JSON as source evidence.
            - Do not invent claims, numbers, quotes, customers, product features, research findings, or source visuals.
            - Context Data JSON includes a suggested theme, target slide count, key lines, headings, and visual inputs.
            - If a slide needs a visual that is not available from the source, describe it as a visual direction, not as an existing asset.
            - Do not imply stock images or generated visuals came from the URL.
            - If source evidence is weak, write INSUFFICIENT_DATA and design around what is known.

            TASK:
            Turn the URL into a presentation-ready deck plan that a founder, marketer, or developer can use immediately.
            The output should feel like a real deck brief, not a generic article summary.
            Use one main idea per slide, short bullets, and specific speaker notes grounded in the source.

            Required Markdown structure:
            ## Deck Strategy
            ## Visual Direction
            ## Slide Plan
            ## Speaker Notes
            ## Source And Evidence Notes

            Rules:
            - In Deck Strategy, include audience, deck goal, recommended theme, and narrative arc.
            - In Visual Direction, choose only from the approved theme in Context Data JSON unless there is a strong evidence-based reason.
            - In Slide Plan, create 6-9 slides depending on available source depth.
            - For each slide, include title, role, 2-4 bullets, and visual direction.
            - In Speaker Notes, include concise notes for each slide.
            - Target length: 750-{max_output_words} words.""",
            model=ai_model,
            output_key="final_report"
        )

        return SequentialAgent(
            name="presentation_mas",
            sub_agents=[presentation_writer]
        )

    elif tool_type == "resume":
        resume_writer = Agent(
            name="resume_match_writer",
            instruction=f"""You are a senior resume strategist for iLoveURL.
            {tool_policy}
            SOURCE-OF-TRUTH RULES:
            - Context Data JSON contains a job post and the user's existing resume text.
            - Do not invent employers, roles, dates, degrees, certifications, tools, skills, metrics, awards, or achievements.
            - Only treat a skill or keyword as supported if it appears in the resume text or is directly evidenced by the resume text.
            - If the job asks for something missing from the resume, mark it as a gap or "user detail needed".
            - Do not claim the user has experience with unsupported requirements.

            TASK:
            Match the existing resume to the job URL and produce practical, truthful improvements.
            Focus on how to tailor the resume for this specific role while preserving factual integrity.

            Required Markdown structure:
            ## Job Snapshot
            ## Match Summary
            ## Strong Matches
            ## Gaps And Risks
            ## ATS Keywords
            ## Recommended Resume Edits
            ## Optimized Resume Draft
            ## Truthfulness Notes

            Rules:
            - Use clear bullets where they improve scanning.
            - In ATS Keywords, split supported keywords from unsupported keywords.
            - In Recommended Resume Edits, rewrite bullets only when the resume provides enough evidence.
            - In Optimized Resume Draft, include only sections that can be supported by the resume text.
            - Target length: 750-{max_output_words} words.""",
            model=ai_model,
            output_key="final_report"
        )

        return SequentialAgent(
            name="resume_match_mas",
            sub_agents=[resume_writer]
        )

    elif tool_type == "interview-prep":
        interview_coach = Agent(
            name="interview_prep_coach",
            instruction=f"""You are a senior interview coach for iLoveURL.
            {tool_policy}
            SOURCE-OF-TRUTH RULES:
            - Context Data JSON contains a job post and the user's existing resume text.
            - Do not invent company facts, role requirements, candidate experience, employers, dates, tools, metrics, certifications, or achievements.
            - Only treat a strength as candidate-supported if it appears in the resume text or is directly evidenced by it.
            - If a strong answer needs missing candidate detail, write USER_DETAIL_NEEDED instead of fabricating it.
            - Keep the pack practical and usable for a real interview.

            TASK:
            Create an interview preparation pack for this specific job and candidate.
            Help the user understand what the interviewer is likely to test, how to answer truthfully,
            what resume evidence to bring forward, and what gaps to prepare for.

            Required Markdown structure:
            ## Role Snapshot
            ## What The Interview Will Likely Test
            ## Candidate Talking Points
            ## Practice Questions And Answer Angles
            ## Behavioral STAR Stories To Prepare
            ## Technical Or Role-Specific Drill
            ## Questions To Ask The Interviewer
            ## Gaps To Prepare For
            ## 30-Minute Practice Plan

            Rules:
            - Use bullets and numbered questions for scanning.
            - Provide 8-12 practice questions total.
            - For each question, include a concise answer angle grounded in the resume or mark USER_DETAIL_NEEDED.
            - Include at least 3 behavioral questions and 3 role-specific questions.
            - Keep STAR stories as story prompts, not fabricated stories.
            - Target length: 850-{max_output_words} words.""",
            model=ai_model,
            output_key="final_report"
        )

        return SequentialAgent(
            name="interview_prep_mas",
            sub_agents=[interview_coach]
        )

    else:
        return Agent(
            name="general_synthesis_agent",
            instruction=f"Transform the content for tool: {tool_type} into a professional A4 document. Use descriptive scoring only.",
            model=ai_model,
            output_key="final_report"
        )

# --- API Endpoints ---

@app.post("/transform")
async def transform_url(request: TransformationRequest):
    async def log_generator():
        try:
            request.mode = normalize_mode(request.mode)
            request.firecrawl_access = normalize_firecrawl_access(request.firecrawl_access)
            selected_model_id = select_model_id(request)
            agent = get_orchestrated_agent(
                request.tool_type,
                selected_model_id,
                mode=request.mode,
                firecrawl_access=request.firecrawl_access,
                budget=request.budget
            )

            runner = Runner(
                app_name=APP_NAME,
                agent=agent,
                session_service=session_service,
                auto_create_session=True
            )

            workflow_id = request.workflow_id or request.tool_type
            mas_input = (
                f"Target URL: {request.url}\n"
                f"Workflow ID: {workflow_id}\n"
                f"Mode: {request.mode}\n"
                f"Firecrawl Access: {request.firecrawl_access}\n"
                f"Context Data JSON:\n{json.dumps(request.payload, ensure_ascii=False)}"
            )
            user_id = request.user_id or "anonymous-user"
            session_id = str(uuid.uuid4())
            new_message = types.Content(role="user", parts=[types.Part(text=mas_input)])

            yield json.dumps({"type": "log", "content": f"INITIALIZING ENGINE | SESSION: {session_id}"}) + "\n"
            yield json.dumps({"type": "log", "content": f"TOOL: {request.tool_type} | MODEL: {selected_model_id}"}) + "\n"
            yield json.dumps({"type": "log", "content": f"WORKFLOW: {workflow_id} | MODE: {request.mode} | FIRECRAWL_ACCESS: {request.firecrawl_access}"}) + "\n"
            yield json.dumps({"type": "log", "content": f"INPUT PAYLOAD: {json.dumps(request.payload)[:500]}..."}) + "\n"

            total_prompt_tokens = 0
            total_completion_tokens = 0

            # Iterate runner events for EXHAUSTIVE logging
            try:
                for event in runner.run(user_id=user_id, session_id=session_id, new_message=new_message):
                    # 1. Agent Transition
                    if hasattr(event, 'agent_name') and event.agent_name:
                        yield json.dumps({"type": "log", "content": f"AGENT_START: {event.agent_name}"}) + "\n"

                    # 2. Raw Model Monologue / Reasoning
                    if hasattr(event, 'text') and event.text:
                        # Yielding text chunks for real-time thought visibility
                        yield json.dumps({"type": "thought", "agent": getattr(event, 'agent_name', 'unknown'), "content": event.text}) + "\n"

                    # 3. Tool Execution Details
                    if hasattr(event, 'tool_call') and event.tool_call:
                        call = event.tool_call.function
                        yield json.dumps({
                            "type": "tool_call",
                            "agent": getattr(event, 'agent_name', 'unknown'),
                            "tool": call.name,
                            "args": call.arguments
                        }) + "\n"

                    # 4. Structured Output / Step Completion
                    if hasattr(event, 'step_output') and event.step_output:
                        yield json.dumps({
                            "type": "step_complete",
                            "agent": getattr(event, 'agent_name', 'unknown'),
                            "output": event.step_output
                        }) + "\n"

                    # 5. Metadata / Tokens
                    if hasattr(event, 'usage_metadata') and event.usage_metadata:
                        u = event.usage_metadata
                        p = getattr(u, 'prompt_token_count', 0)
                        c = getattr(u, 'candidates_token_count', 0)
                        total_prompt_tokens += p
                        total_completion_tokens += c
                        yield json.dumps({
                            "type": "usage",
                            "turn_tokens": p + c,
                            "prompt": p,
                            "completion": c,
                            "total": total_prompt_tokens + total_completion_tokens
                        }) + "\n"

                    # 6. Errors
                    if hasattr(event, 'error') and event.error:
                        yield json.dumps({"type": "error", "content": str(event.error)}) + "\n"

            except Exception as run_err:
                yield json.dumps({"type": "error", "content": f"CHAIN CRITICAL: {run_err}"}) + "\n"

            # Final Summary Retrieval
            session = await session_service.get_session(app_name=APP_NAME, user_id=user_id, session_id=session_id)
            final_report = session.state.get("final_report") if session else None

            if not final_report:
                yield json.dumps({"type": "log", "content": "PRIMARY CHAIN EMPTY | TRIGGERING FALLBACK..."}) + "\n"
                try:
                    fallback_model = selected_model_id if "v4-pro" not in selected_model_id else "deepseek/deepseek-chat"
                    ai_model = LiteLlm(model=f"openrouter/{fallback_model}")
                    response = await ai_model.generate_content(
                        f"Finalize analysis for {request.tool_type}. "
                        f"Use this JSON payload only: {json.dumps(request.payload, ensure_ascii=False)}"
                    )
                    final_report = response.text if hasattr(response, 'text') else str(response)
                except Exception as fe:
                    final_report = f"# System Error\n\nFallback failed: {fe}"

            # Yield Final Deliverable
            yield json.dumps({
                "type": "result",
                "content": {
                    "summary": final_report,
                    "tokens": total_prompt_tokens + total_completion_tokens,
                    "data": session.state if session else {}
                }
            }) + "\n"

        except Exception as e:
            yield json.dumps({"type": "error", "content": f"TRANSFORM FAILURE: {str(e)}"}) + "\n"

    return StreamingResponse(log_generator(), media_type="application/x-ndjson")

@app.get("/health")
def health():
    return {"status": "ok", "engine": "google-adk", "version": "2.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8081")))
