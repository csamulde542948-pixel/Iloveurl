import { Router, Request, Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '../../lib/supabase';
import { runAiWorkflow } from '../../lib/aiWorkflow';
import { resolveWorkflow } from '../../lib/workflows';
import { buildSummaryWorkflowContext } from '../../lib/workflows/context/summaryContext';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';
import { getFirecrawlApiKey } from '../../lib/config';

const router = Router();

const SUMMARY_REPORT_SECTIONS = [
  'Source Snapshot',
  'Executive Summary',
  'Key Points',
  'Important Details',
  'Why It Matters',
  'Actionable Takeaways',
  'Limits And Missing Context',
  'FAQ',
];

const SUMMARY_SECTION_ALIASES: Record<string, string[]> = {
  'Source Snapshot': ['source', 'source snapshot', 'metadata'],
  'Executive Summary': ['summary', 'executive summary', 'overview'],
  'Key Points': ['key insights', 'main points', 'key points', 'takeaways'],
  'Important Details': ['evidence', 'important details', 'supporting details', 'details'],
  'Why It Matters': ['why it matters', 'implications', 'importance'],
  'Actionable Takeaways': ['actions', 'action items', 'actionable takeaways', 'next steps'],
  'Limits And Missing Context': ['limitations', 'missing context', 'limits and missing context'],
  'FAQ': ['faq', 'questions'],
};

function normalizeHeading(value: string): string {
  return value.replace(/[#*_`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const matches = [...markdown.matchAll(/^#{1,3}\s+(.+?)\s*$/gim)];

  matches.forEach((match, index) => {
    const title = normalizeHeading(match[1]);
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || markdown.length : markdown.length;
    sections[title] = markdown.substring(start, end).trim();
  });

  if (Object.keys(sections).length > 0) return sections;

  const lines = markdown.split('\n');
  let currentTitle: string | null = null;
  let currentBody: string[] = [];
  const knownHeadings = new Map<string, string>();
  Object.entries(SUMMARY_SECTION_ALIASES).forEach(([section, aliases]) => {
    [section, ...aliases].forEach((alias) => knownHeadings.set(normalizeHeading(alias), section));
  });

  const flush = () => {
    if (currentTitle) {
      sections[normalizeHeading(currentTitle)] = currentBody.join('\n').trim();
    }
  };

  lines.forEach((line) => {
    const maybeHeading = knownHeadings.get(normalizeHeading(line));
    if (maybeHeading) {
      flush();
      currentTitle = maybeHeading;
      currentBody = [];
    } else if (currentTitle) {
      currentBody.push(line);
    }
  });
  flush();

  return sections;
}

function sectionBody(sections: Record<string, string>, section: string): string | null {
  const aliases = [section, ...(SUMMARY_SECTION_ALIASES[section] || [])].map(normalizeHeading);
  for (const alias of aliases) {
    if (sections[alias]?.trim()) return sections[alias].trim();
  }
  return null;
}

function sourceTypeLabel(sourceType: string): string {
  return sourceType.replace(/_/g, ' ');
}

function keyEvidence(summaryContext: ReturnType<typeof buildSummaryWorkflowContext>, limit = 5): string[] {
  return summaryContext.contentSignals.keyLines
    .filter((line) => line && line !== summaryContext.title)
    .slice(0, limit);
}

function inferMainSummary(summaryContext: ReturnType<typeof buildSummaryWorkflowContext>): string {
  const evidence = keyEvidence(summaryContext, 3);

  if (evidence.length === 0) {
    return `This ${sourceTypeLabel(summaryContext.sourceType)} is titled "${summaryContext.title}", but the extracted page did not provide enough clean body text for a confident narrative summary.`;
  }

  if (summaryContext.sourceType === 'article') {
    return evidence.join(' ');
  }

  return `This ${sourceTypeLabel(summaryContext.sourceType)} focuses on "${summaryContext.title}". ${evidence.join(' ')}`;
}

function fallbackSummarySection(section: string, summaryContext: ReturnType<typeof buildSummaryWorkflowContext>): string {
  const evidence = keyEvidence(summaryContext, 6);
  const firstEvidence = evidence[0] || summaryContext.title;
  const headings = [...summaryContext.contentSignals.headings.h1, ...summaryContext.contentSignals.headings.h2]
    .filter(Boolean)
    .slice(0, 8);

  switch (section) {
    case 'Source Snapshot':
      return [
        `- **Title:** ${summaryContext.title}`,
        `- **Source type:** ${summaryContext.sourceType}`,
        `- **URL:** ${summaryContext.url}`,
        `- **Readable content:** ${summaryContext.contentSignals.wordCount} words`,
      ].join('\n');
    case 'Executive Summary':
      return inferMainSummary(summaryContext);
    case 'Key Points':
      return evidence.slice(0, 5).map((line) => `- ${line}`).join('\n') || '- INSUFFICIENT_DATA';
    case 'Important Details':
      return [
        `- **Detected headings:** ${headings.join('; ') || 'NOT_FOUND'}`,
        `- **Author:** ${summaryContext.metadata.author || 'NOT_FOUND'}`,
        `- **Published:** ${summaryContext.metadata.publishedTime || 'NOT_FOUND'}`,
        `- **Most specific extracted detail:** ${firstEvidence || 'INSUFFICIENT_DATA'}`,
      ].join('\n');
    case 'Why It Matters':
      if (summaryContext.sourceType === 'article') {
        return '- This is useful as a fast briefing because it identifies the core event, the known status, and what remains unresolved without requiring the reader to scan the full article.';
      }
      if (summaryContext.sourceType === 'documentation') {
        return '- This is useful as a technical briefing because it highlights what the page explains and what a reader may need to implement or investigate next.';
      }
      if (summaryContext.sourceType === 'landing_page') {
        return '- This is useful as a business briefing because it distills the offer, positioning, and user-facing message from the page.';
      }
      return '- This summary helps the reader understand the source quickly, decide whether the full page is worth reading, and reuse the material in another workflow.';
    case 'Actionable Takeaways':
      return [
        '- Use the Executive Summary for a fast briefing.',
        '- Verify any critical names, dates, numbers, or claims against the original source before citing them.',
        '- Use the Key Points section as the basis for a short email, social post, note, or follow-up research task.',
      ].join('\n');
    case 'Limits And Missing Context':
      return summaryContext.qualitySignals.missingData.length
        ? `- Missing or weak source data: ${summaryContext.qualitySignals.missingData.join(', ')}.`
        : '- No major extraction gaps were detected from the structured context.';
    case 'FAQ':
      return [
        `- **What is this source about?** ${inferMainSummary(summaryContext)}`,
        '- **What should I verify before sharing?** Verify names, dates, numbers, locations, and any unresolved claims against the original URL.',
      ].join('\n');
    default:
      return '- INSUFFICIENT_DATA';
  }
}

function normalizeSummaryReport(summary: string, summaryContext: ReturnType<typeof buildSummaryWorkflowContext>): string {
  const cleaned = summary.replace(/^#\s+.*$/gim, '').trim();
  const sections = extractSections(cleaned);

  return SUMMARY_REPORT_SECTIONS.map((section) => {
    const body = sectionBody(sections, section) || fallbackSummarySection(section, summaryContext);
    return `## ${section}\n\n${body.trim()}`;
  }).join('\n\n');
}

// Endpoint to summarize any readable URL
router.post('/summarize', async (req: Request, res: Response) => {
  const { url, userId, model, mode } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const validatedUrl = validatePublicHttpUrl(url);
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  let taskId: string | null = null;

  try {
    const workflow = resolveWorkflow({
      workflowId: 'article-summary',
      requestedMode: mode,
    });
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'article-summary',
      userId,
      mode: workflow.mode,
      metadata: { url: safeUrl },
    });
    if (!auth.ok) return;

    // 0. Initialize Task in Supabase (Immediate UX feedback)
    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: auth.userId,
          type: 'article-summary',
          status: 'processing',
          payload: { url: safeUrl, mode: workflow.mode, credits: auth.credits },
        }
      ])
      .select('id')
      .single();

    if (!initialError && initialTask) {
      taskId = initialTask.id;
    }

    // --- IMMEDIATE RESPONSE ---
    res.status(202).json({ taskId });

    // --- BACKGROUND PROCESSING ---
    (async () => {
      try {
        const firecrawlKey = getFirecrawlApiKey();

        if (!firecrawlKey) {
          if (taskId) {
            await supabase.from('tasks').update({ status: 'failed', result: { error: 'Firecrawl API key is not configured' } }).eq('id', taskId);
          }
          return;
        }

        const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });

        console.log(`[BACKGROUND] Summarizing URL for: ${safeUrl} (Task: ${taskId}) mode=${workflow.mode}`);

        // 1. Scrape content using Firecrawl
        const scrapeResponse = (await firecrawl.scrape(safeUrl, {
          formats: ['markdown'],
        })) as any;

        if (!scrapeResponse || (!scrapeResponse.markdown && !scrapeResponse.success)) {
          if (taskId) {
            await supabase.from('tasks').update({ status: 'failed', result: { error: scrapeResponse?.error || 'Failed to extract content' } }).eq('id', taskId);
          }
          return;
        }

        const content = scrapeResponse.markdown || '';

        if (!content || content.length < 100) {
          if (taskId) {
            await supabase.from('tasks').update({ status: 'failed', result: { error: 'The page does not contain enough readable content to summarize.' } }).eq('id', taskId);
          }
          return;
        }

        const summaryContext = buildSummaryWorkflowContext({
          url: safeUrl,
          metadata: scrapeResponse.metadata || {},
          markdown: content,
          budget: workflow.budget,
        });

        console.log(
          `[BACKGROUND] Summary context prepared (Task: ${taskId}) ` +
          `type=${summaryContext.sourceType} words=${summaryContext.contentSignals.wordCount} ` +
          `excerptChars=${summaryContext.contentSignals.selectedMarkdownExcerpt.length}`
        );

        let masResult;

        try {
          masResult = await runAiWorkflow({
            url: safeUrl,
            tool_type: workflow.toolType,
            workflow_id: workflow.id,
            mode: workflow.mode,
            firecrawl_access: workflow.firecrawlAccess,
            budget: workflow.budget,
            task_id: taskId,
            user_id: auth.userId,
            model,
            payload: summaryContext,
          });
        } catch (masErr: any) {
          console.error("MAS Service Critical Error:", masErr);
          if (taskId) {
            await supabase.from('tasks').update({ status: 'failed', result: { error: 'The AI agent service is currently unavailable. Please try again later.' } }).eq('id', taskId);
          }
          return;
        }

        const normalizedSummary = normalizeSummaryReport(masResult.summary, summaryContext);
        const resultData = {
          summary: normalizedSummary,
          title: `Summary - ${summaryContext.title}`,
          url: safeUrl,
          summaryContext,
          usage: {
            workflowId: workflow.id,
            mode: workflow.mode,
            modelPolicy: workflow.modelPolicy,
            firecrawlAccess: workflow.firecrawlAccess,
            tokens: masResult.tokens,
            adkToolCalls: masResult.toolCalls,
            backendFirecrawlCalls: 1
          }
        };

        // Update the task in Supabase
        if (taskId) {
          await completeToolRunTask({
            taskId,
            result: resultData,
            userId: auth.userId,
            toolType: workflow.toolType,
            mode: workflow.mode,
            credits: auth.credits,
            metadata: { url: safeUrl, workflowId: workflow.id },
          });
        }
        console.log(`[BACKGROUND] Task ${taskId} completed successfully.`);
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Task ${taskId}:`, err);
        if (taskId) {
          await supabase
            .from('tasks')
            .update({ status: 'failed', result: { error: err.message || 'Internal background error' } })
            .eq('id', taskId);
        }
      }
    })();
  } catch (err: any) {
    console.error('Summarization Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize summarization' });
  }
});

export default router;
