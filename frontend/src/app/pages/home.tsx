import { ToolCard } from "../components/tool-card";
import { Button } from "../components/ui/button";
import { ChevronDown, Link as LinkIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import heroBg from "../../imports/hero-iloveurl.png";

import { toast } from "sonner";

const categoryCopy = {
  career: {
    label: "Career Tools",
    kicker: "Apply smarter",
    description: "Turn role pages and profile links into polished application assets.",
    color: "text-[#4F46E5]",
    bg: "bg-[#4F46E5]",
  },
  content: {
    label: "Content Tools",
    kicker: "Read, learn, reuse",
    description: "Compress pages into summaries, notes, slides, and study-ready outputs.",
    color: "text-[#0284C7]",
    bg: "bg-[#0EA5E9]",
  },
  design: {
    label: "Brand & Design",
    kicker: "Extract visual systems",
    description: "Understand a website's look, language, positioning, and identity signals.",
    color: "text-[#6D28D9]",
    bg: "bg-[#8B5CF6]",
  },
  research: {
    label: "Research Tools",
    kicker: "Audit and inspect",
    description: "Analyze pages for search, performance, technical signals, and source quality.",
    color: "text-[#047857]",
    bg: "bg-[#10B981]",
  },
  quick: {
    label: "Quick Tools",
    kicker: "Small jobs, fast",
    description: "Clean, shorten, tag, preview, and convert links without heavyweight workflows.",
    color: "text-[#B45309]",
    bg: "bg-[#F59E0B]",
  },
};

const socialVideoHostPatterns = [
  /(^|\.)youtube\.com$/,
  /(^|\.)youtu\.be$/,
  /(^|\.)facebook\.com$/,
  /(^|\.)fb\.watch$/,
  /(^|\.)instagram\.com$/,
  /(^|\.)tiktok\.com$/,
  /(^|\.)vm\.tiktok\.com$/,
];

function CategoryHeader({ category, count }: { category: keyof typeof categoryCopy; count: number }) {
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

export function HomePage() {
  const [selectedTool, setSelectedTool] = useState("article-summary");
  const [url, setUrl] = useState("");
  const [urlsTransformed, setUrlsTransformed] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const api = import.meta.env.VITE_API_URL || "http://localhost:8080";

    fetch(`${api}/api/tasks/stats/summary`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.urlsTransformed === "number") {
          setUrlsTransformed(data.urlsTransformed);
        }
      })
      .catch(() => {
        if (!cancelled) setUrlsTransformed(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const transformedCounter = useMemo(() => {
    if (urlsTransformed === null) return "loading";
    if (urlsTransformed >= 1000) {
      return `${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(urlsTransformed)}+`;
    }
    return urlsTransformed.toLocaleString();
  }, [urlsTransformed]);

  const tools = [
    { value: "cover-letter", label: "Cover Letter Generator" },
    { value: "resume", label: "Resume Match" },
    { value: "interview-prep", label: "Interview Prep Pack" },
    { value: "article-summary", label: "Article Summarizer" },
    { value: "study-notes", label: "Study Notes Gen" },
    { value: "presentation", label: "URL to Presentation" },
    { value: "brand-analyzer", label: "Brand Analyzer" },
    { value: "seo-analyzer", label: "SEO Analyzer" },
    { value: "url-shortener", label: "URL Shortener" },
    { value: "qr-code", label: "QR Code Generator" },
    { value: "link-preview", label: "Link Preview" },
    { value: "meta-tags", label: "Meta Tags Generator" },
    { value: "utm-manager", label: "UTM Link Manager" },
    { value: "url-cleaner", label: "URL Cleaner" },
    { value: "social-post", label: "AI Social Post" },
    { value: "mind-map", label: "URL to Mind Map" },
    { value: "podcast-script", label: "URL to Transcribe" },
    { value: "geo-audit", label: "GEO AI Audit" },
    { value: "chat-url", label: "Chat with URL" },
    { value: "broken-links", label: "Broken Link Checker" },
    { value: "tech-profiler", label: "Tech Profiler" },
    { value: "cross-article", label: "Cross-Article Comparison" },
    { value: "sitemap-gen", label: "Sitemap Generator" },
    { value: "slide-deck", label: "URL to Slide Deck" },
  ];

  const handleSubmit = () => {
    if (!url) {
      toast.error("Paste a URL first", {
        description: "Start with a public page such as https://example.com.",
        duration: 5200,
      });
      return;
    }
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        toast.error("Check the URL", {
          description: "The URL must use http:// or https://.",
          duration: 5200,
        });
        return;
      }
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local") || /^10\.|^172\.(1[6-9]|2\d|3[0-1])\.|^192\.168\./.test(hostname)) {
        toast.error("Check the URL", {
          description: "Please enter a public website URL. Localhost and private network URLs are blocked.",
          duration: 5200,
        });
        return;
      }
      if (selectedTool === "podcast-script" && !socialVideoHostPatterns.some((pattern) => pattern.test(hostname))) {
        toast.error("Unsupported video URL", {
          description: "URL to Transcribe currently supports YouTube, Facebook, Instagram, and TikTok links.",
          duration: 6200,
        });
        return;
      }
    } catch {
      toast.error("Check the URL", {
        description: "Please enter a valid URL starting with http:// or https://.",
        duration: 5200,
      });
      return;
    }
    navigate(`/tool/${selectedTool}?url=${encodeURIComponent(url)}`);
  };

  const featuredTools = [
    tools.find(t => t.value === 'article-summary'),
    tools.find(t => t.value === 'brand-analyzer'),
    tools.find(t => t.value === 'seo-analyzer'),
    tools.find(t => t.value === 'resume'),
    tools.find(t => t.value === 'podcast-script'),
    tools.find(t => t.value === 'url-shortener'),
    tools.find(t => t.value === 'qr-code'),
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  const workingTools = [
    { title: "Article Summarizer", description: "Turn readable pages into clean executive summaries.", toolId: "article-summary", category: "content" as const },
    { title: "Brand Analyzer", description: "Extract visual identity, positioning, and brand signals.", toolId: "brand-analyzer", category: "design" as const },
    { title: "SEO Analyzer", description: "Audit metadata, content, performance, and Core Web Vitals.", toolId: "seo-analyzer", category: "research" as const },
    { title: "Resume Match", description: "Compare your resume against a job URL.", toolId: "resume", category: "career" as const },
    { title: "Interview Prep Pack", description: "Practice questions and answer angles from a job URL.", toolId: "interview-prep", category: "career" as const },
    { title: "Cross-Article Comparison", description: "Compare 2-4 articles side by side.", toolId: "cross-article", category: "research" as const },
    { title: "Study Notes Gen", description: "Create notes and review material from a source.", toolId: "study-notes", category: "content" as const },
    { title: "URL to Transcribe", description: "Extract transcripts from supported social video URLs.", toolId: "podcast-script", category: "content" as const, badge: "PREMIUM" },
    { title: "URL Shortener", description: "Create cleaner short links.", toolId: "url-shortener", category: "quick" as const },
    { title: "QR Code", description: "Generate scannable QR codes.", toolId: "qr-code", category: "quick" as const },
    { title: "Link Preview", description: "Preview social card metadata.", toolId: "link-preview", category: "quick" as const },
    { title: "Meta Tags", description: "Generate SEO and social meta tags.", toolId: "meta-tags", category: "quick" as const },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative flex min-h-[780px] w-full flex-col items-center justify-center overflow-hidden border-b border-border-color bg-white px-4 pb-24 sm:px-5 md:min-h-screen md:px-10 md:pb-0">
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center md:bg-[center_right]"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_44%,rgba(255,255,255,0.16)_82%)] md:bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.82)_40%,rgba(255,255,255,0.06)_76%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center">
          <div className="w-full max-w-2xl space-y-5 pt-24 text-center md:space-y-8 md:pt-16 md:text-left">
            <h1 className="px-2 font-display text-[40px] lowercase leading-[0.9] tracking-normal text-primary sm:text-[48px] md:px-0 md:text-[72px]">transform any link</h1>
            <p className="mx-auto max-w-[560px] px-2 text-[15px] font-semibold leading-[1.55] text-gray-900 md:mx-0 md:px-0 md:text-[18px]">
              A comprehensive toolkit for the modern web. Paste any URL and get cover letters, summaries, brand analysis, and more.
            </p>

            <div className="relative z-10 mx-auto mb-5 mt-6 flex max-w-2xl flex-col justify-center gap-3 sm:flex-row md:mx-0 md:mb-8 md:mt-8 md:justify-start">
              <Link to="/signup"><Button size="lg" className="w-full">GET STARTED</Button></Link>
              <Link to="/signin"><Button size="lg" variant="outline" className="w-full bg-white">I ALREADY HAVE AN ACCOUNT</Button></Link>
            </div>

            <div className="mx-auto max-w-2xl space-y-3 md:mx-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="h-14 min-w-0 flex-1 rounded-full border-2 border-border-color bg-white px-5 text-[14px] font-bold shadow-[0_4px_0_0_#CFCFCF] focus:border-primary focus:outline-none sm:px-6 sm:text-[15px]" />
                <Button size="lg" onClick={handleSubmit} className="h-14 shrink-0 rounded-full px-5 text-[12px] shadow-[0_4px_0_0_#CFCFCF] sm:px-8 sm:text-[15px]">START</Button>
              </div>

              <div className="pt-4">
                <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[2px] text-primary/45 md:text-left">featured tools</p>
                <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0 md:justify-start">
                  {featuredTools.map((t) => {
                    const active = selectedTool === t.value;
                    return (
                      <Button
                    key={t.value}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={`h-8 shrink-0 rounded-full border border-primary/20 text-[11px] ${
                      active ? "shadow-[0_3px_0_0_var(--brand-primary-shadow)]" : "bg-white/70 hover:bg-primary/5"
                    }`}
                    onClick={() => setSelectedTool(t.value)}
                  >
                    {t.label}
                    {t.value === "podcast-script" && (
                      <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.5px] text-white">
                        Premium
                      </span>
                    )}
                  </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll down CTA */}
        <div className="relative z-10 mb-8 mt-auto md:mb-12">
          <Button variant="outline" className="gap-2 bg-white rounded-full px-6 h-12 shadow-[0_4px_0_0_#CFCFCF]" onClick={() => document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' })}>
            VIEW WORKING TOOLS <ChevronDown className="w-4 h-4 animate-bounce" />
          </Button>
        </div>

        {/* Fixed Stats Counter */}
        <div className="fixed bottom-4 left-4 right-4 z-[35] flex justify-center md:bottom-6 md:left-auto md:right-6 md:z-[60] md:block">
          <div className="inline-flex h-11 max-w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-[11px] font-bold uppercase tracking-[0.5px] text-white shadow-[0_4px_0_0_var(--brand-primary-shadow)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none md:h-12 md:px-5 md:text-[12px]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary shadow-[0_2px_0_0_#88879F]">
              <LinkIcon className="h-3 w-3" />
            </span>
            <span><span className="font-black">{transformedCounter}</span> URLs Transformed</span>
          </div>
        </div>
      </section>

      {/* Working Tools Section */}
      <section id="tools-section" className="bg-white px-4 py-16 sm:px-5 md:px-10 md:py-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/50">working tools</p>
              <h2 className="mt-3 font-display text-[34px] lowercase leading-[0.9] text-gray-950 md:text-[58px]">
                start with what already works.
              </h2>
              <p className="mt-5 text-[16px] font-semibold leading-relaxed text-gray-500">
                These tools are active in the MVP today. The full library and planned workflows live on the dedicated tools page.
              </p>
            </div>
            <Link to="/tools">
              <Button variant="outline" className="rounded-full bg-white">
                Browse Full Library
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {workingTools.map((tool) => (
              <ToolCard
                key={tool.toolId}
                title={tool.title}
                description={tool.description}
                toolId={tool.toolId}
                category={tool.category}
                badge={tool.badge}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Full tool library moved to /tools */}
      <section id="legacy-tools-section" className="hidden">
        <div className="max-w-[1440px] mx-auto space-y-12">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/50">tool library</p>
            <h2 className="mt-3 text-[38px] md:text-[56px] font-display lowercase text-gray-950 leading-[0.9]">
              choose the workflow that matches your link.
            </h2>
            <p className="mt-5 text-[16px] font-semibold leading-relaxed text-gray-500">
              Each tool starts from a URL, then turns it into a focused output for work, learning, research, or sharing.
            </p>
          </div>

          <div className="space-y-14">
            <div>
              <CategoryHeader category="career" count={5} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <ToolCard 
                  title="Cover Letter Generator" 
                  description="Create a personalized cover letter."
                  toolId="cover-letter" 
                  category="career" 
                />
                <ToolCard title="Resume Match" description="Match your resume to a job URL."
                  toolId="resume" category="career" />
                <ToolCard title="AI Social Post" description="Generate viral content from URL."
                  badge="SOON" toolId="social-post" category="career" />
                <ToolCard title="Interview Prep Pack" description="Questions, answer angles, and practice plan."
                  toolId="interview-prep" category="career" />
                <ToolCard title="Role Fit Scorecard" description="Match score & gap analysis."
                  badge="SOON" category="career" />
              </div>
            </div>
            <div>
              <CategoryHeader category="content" count={6} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <ToolCard 
                  title="Article Summarizer" 
                  description="Extract key insights instantly."
                  toolId="article-summary" 
                  category="content" 
                />
                <ToolCard 
                  title="URL to Presentation" 
                  description="Transform content to slides."
                  badge="SOON"
                  toolId="presentation" 
                  category="content" 
                />
                <ToolCard 
                  title="URL to Mind Map" 
                  description="Visualize hierarchy structure."
                  badge="SOON"
                  toolId="mind-map" 
                  category="content" 
                />
                <ToolCard 
                  title="URL to Transcribe" 
                  description="Extract transcripts from YouTube, Facebook, Instagram, and TikTok."
                  toolId="podcast-script" 
                  badge="PREMIUM"
                  category="content" 
                />
                <ToolCard title="Clean Reading PDF" description="Ad-free reading mode PDF."
                  badge="SOON" category="content" />
                <ToolCard title="Study Notes Gen" description="Outlines & flashcards from URL."
                  toolId="study-notes" category="content" />
              </div>
            </div>
            <div>
              <CategoryHeader category="design" count={3} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <ToolCard 
                  title="Brand Analyzer" 
                  description="Extract palettes/typography."
                  toolId="brand-analyzer" 
                  category="design" 
                />
                <ToolCard title="GEO AI Audit" description="Optimize AI engine visibility."
                  badge="SOON" toolId="geo-audit" category="design" />
                <ToolCard title="Sales Battlecard" description="Competitive prospect brief."
                  badge="SOON" category="design" />
              </div>
            </div>
            <div>
              <CategoryHeader category="research" count={5} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <ToolCard 
                  title="SEO Analyzer" 
                  description="Technical audit for performance."
                  toolId="seo-analyzer" 
                  category="research" 
                />
                <ToolCard title="Chat with URL" description="Interact with any webpage."
                  badge="SOON" toolId="chat-url" category="research" />
                <ToolCard title="Broken Link Checker" description="Scan for dead ends."
                  badge="SOON" toolId="broken-links" category="research" />
                <ToolCard title="Tech Profiler" description="Discover tech stack."
                  badge="SOON" toolId="tech-profiler" category="research" />
                <ToolCard title="Cross-Article Comparison" description="Compare multiple news sources."
                  toolId="cross-article" category="research" />
              </div>
            </div>
            <div>
              <CategoryHeader category="quick" count={6} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <ToolCard 
                  title="URL Shortener" 
                  description="Shorten links."
                  toolId="url-shortener" 
                  category="quick" 
                />
                <ToolCard 
                  title="QR Code" 
                  description="Scannable QR codes."
                  toolId="qr-code" 
                  category="quick" 
                />
                <ToolCard title="Link Preview" description="Visualize Open Graph."
                  toolId="link-preview" category="quick" />
                <ToolCard 
                  title="Meta Tags" 
                  description="Optimize SEO tags."
                  toolId="meta-tags" 
                  category="quick" 
                />
                <ToolCard title="API Quickstart Sheet" description="Summarize library READMEs."
                  badge="SOON" category="quick" />
                <ToolCard title="Changelog Digest" description="Highlights from release notes."
                  badge="SOON" category="quick" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request a Tool Section */}
      <section className="border-t border-border-color bg-primary/5 px-4 py-16 sm:px-5 md:px-10 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-[28px] border-2 border-border-color bg-white p-6 shadow-[0_8px_0_0_#CFCFCF] md:rounded-3xl md:p-12">
            <h2 className="text-[24px] font-bold text-primary mb-4">Can't find the tool you need?</h2>
            <p className="text-[15px] text-gray-light mb-8 max-w-lg mx-auto">
              We're constantly expanding our toolkit. Tell us what you'd like to see next, and we'll work to build it for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input 
                type="text" 
                placeholder="What tool do you need?" 
                className="flex-1 h-14 px-6 border-2 border-border-color rounded-full bg-white shadow-inner focus:outline-none focus:border-primary"
              />
              <Button size="lg" className="h-14 px-8 rounded-full shadow-[0_4px_0_0_#CFCFCF]">REQUEST</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
