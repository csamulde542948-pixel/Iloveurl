import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ToolCard, ToolCategory } from "../components/tool-card";
import { Button } from "../components/ui/button";

const categoryCopy: Record<ToolCategory, { label: string; kicker: string; description: string; bg: string; color: string }> = {
  career: {
    label: "Career Tools",
    kicker: "Apply smarter",
    description: "Turn role pages and profile links into polished application assets.",
    bg: "bg-[#4F46E5]",
    color: "text-[#4F46E5]",
  },
  content: {
    label: "Content Tools",
    kicker: "Read, learn, reuse",
    description: "Compress pages into summaries, notes, transcripts, and study-ready outputs.",
    bg: "bg-[#0EA5E9]",
    color: "text-[#0284C7]",
  },
  design: {
    label: "Brand & Design",
    kicker: "Extract visual systems",
    description: "Understand a website's look, language, positioning, and identity signals.",
    bg: "bg-[#8B5CF6]",
    color: "text-[#6D28D9]",
  },
  research: {
    label: "Research Tools",
    kicker: "Audit and inspect",
    description: "Analyze pages for search, technical signals, source quality, and comparison work.",
    bg: "bg-[#10B981]",
    color: "text-[#047857]",
  },
  quick: {
    label: "Quick Tools",
    kicker: "Small jobs, fast",
    description: "Clean, shorten, tag, preview, and convert links without heavyweight workflows.",
    bg: "bg-[#F59E0B]",
    color: "text-[#B45309]",
  },
};

const toolGroups: Array<{
  category: ToolCategory;
  tools: Array<{ title: string; description: string; toolId?: string; badge?: string }>;
}> = [
  {
    category: "career",
    tools: [
      { title: "Cover Letter Generator", description: "Create a personalized cover letter.", toolId: "cover-letter" },
      { title: "Resume Match", description: "Match your resume to a job URL.", toolId: "resume" },
      { title: "Interview Prep Pack", description: "Questions, answer angles, and practice plan.", toolId: "interview-prep" },
      { title: "AI Social Post", description: "Generate viral content from URL.", toolId: "social-post", badge: "SOON" },
      { title: "Role Fit Scorecard", description: "Match score and gap analysis.", badge: "SOON" },
    ],
  },
  {
    category: "content",
    tools: [
      { title: "Article Summarizer", description: "Extract key insights instantly.", toolId: "article-summary" },
      { title: "Study Notes Gen", description: "Outlines, flashcards, and review notes.", toolId: "study-notes" },
      { title: "URL to Transcribe", description: "Transcripts from YouTube, Facebook, Instagram, and TikTok.", toolId: "podcast-script", badge: "PREMIUM" },
      { title: "URL to Presentation", description: "Transform content to slides.", toolId: "presentation", badge: "SOON" },
      { title: "URL to Mind Map", description: "Visualize hierarchy structure.", toolId: "mind-map", badge: "SOON" },
      { title: "Clean Reading PDF", description: "Ad-free reading mode PDF.", badge: "SOON" },
    ],
  },
  {
    category: "design",
    tools: [
      { title: "Brand Analyzer", description: "Extract palette, typography, and brand signals.", toolId: "brand-analyzer" },
      { title: "GEO AI Audit", description: "Optimize AI engine visibility.", toolId: "geo-audit", badge: "SOON" },
      { title: "Sales Battlecard", description: "Competitive prospect brief.", badge: "SOON" },
    ],
  },
  {
    category: "research",
    tools: [
      { title: "SEO Analyzer", description: "Technical and content audit for performance.", toolId: "seo-analyzer" },
      { title: "Cross-Article Comparison", description: "Compare multiple news or research sources.", toolId: "cross-article" },
      { title: "Chat with URL", description: "Interact with any webpage.", toolId: "chat-url", badge: "SOON" },
      { title: "Broken Link Checker", description: "Scan for dead ends.", toolId: "broken-links", badge: "SOON" },
      { title: "Tech Profiler", description: "Discover tech stack.", toolId: "tech-profiler", badge: "SOON" },
    ],
  },
  {
    category: "quick",
    tools: [
      { title: "URL Shortener", description: "Shorten links.", toolId: "url-shortener" },
      { title: "QR Code", description: "Scannable QR codes.", toolId: "qr-code" },
      { title: "Link Preview", description: "Visualize Open Graph.", toolId: "link-preview" },
      { title: "Meta Tags", description: "Optimize SEO tags.", toolId: "meta-tags" },
      { title: "API Quickstart Sheet", description: "Summarize library READMEs.", badge: "SOON" },
      { title: "Changelog Digest", description: "Highlights from release notes.", badge: "SOON" },
    ],
  },
];

function CategoryHeader({ category, count }: { category: ToolCategory; count: number }) {
  const item = categoryCopy[category];

  return (
    <div className="mb-5 rounded-[24px] border-2 border-border-color bg-white p-4 shadow-[0_6px_0_0_#CFCFCF] md:mb-6 md:rounded-[28px] md:p-6 md:shadow-[0_8px_0_0_#CFCFCF]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-3 md:gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-gray-950 ${item.bg} shadow-[0_4px_0_0_#CFCFCF] md:h-14 md:w-14`}>
            <span className="text-[18px] font-black text-white">{count}</span>
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[2px] ${item.color}`}>{item.kicker}</p>
            <h2 className="mt-2 font-display text-[24px] lowercase leading-none text-gray-950 md:text-[34px]">{item.label}</h2>
            <p className="mt-3 max-w-2xl text-[14px] font-semibold leading-relaxed text-gray-500">{item.description}</p>
          </div>
        </div>
        <div className="w-fit rounded-full border-2 border-border-color bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[1px] text-primary shadow-[0_3px_0_0_#CFCFCF]">
          {count} tools
        </div>
      </div>
    </div>
  );
}

export function ToolsPage() {
  const readyCount = toolGroups.flatMap((group) => group.tools).filter((tool) => tool.badge !== "SOON").length;

  return (
    <main className="min-h-screen bg-[#F8F9FC] px-4 pb-20 pt-24 sm:px-5 md:px-10 md:pb-24 md:pt-28">
      <div className="mx-auto max-w-[1440px]">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[2px] text-primary no-underline transition hover:opacity-70">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>

        <section className="mb-10 overflow-hidden rounded-[28px] border-2 border-border-color bg-white p-5 shadow-[0_8px_0_0_#CFCFCF] md:mb-14 md:rounded-[36px] md:p-10 md:shadow-[0_10px_0_0_#CFCFCF]">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/50">tool library</p>
              <h1 className="mt-4 max-w-4xl font-display text-[38px] lowercase leading-[0.9] text-primary sm:text-[44px] md:text-[72px]">
                every workflow starts with a link.
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] font-semibold leading-relaxed text-gray-500">
                Browse the full iLoveURL tool library. Ready tools are available now; planned tools show where the product is going next.
              </p>
            </div>
            <div className="rounded-[28px] border-2 border-border-color bg-[#F8F9FC] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_4px_0_0_var(--brand-primary-shadow)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[28px] font-black leading-none text-gray-950">{readyCount}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">working tools now</p>
                </div>
              </div>
              <Link to="/pricing">
                <Button className="mt-5 w-full rounded-full">View Plans</Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="space-y-10 md:space-y-14">
          {toolGroups.map((group) => (
            <section key={group.category}>
              <CategoryHeader category={group.category} count={group.tools.length} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
                {group.tools.map((tool) => (
                  <ToolCard
                    key={`${group.category}-${tool.title}`}
                    title={tool.title}
                    description={tool.description}
                    toolId={tool.toolId}
                    badge={tool.badge}
                    category={group.category}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
