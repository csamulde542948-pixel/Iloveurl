import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Link as LinkIcon,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

const principles = [
  {
    title: "URL-first workflows",
    description: "Every tool starts from a link and turns that source into a focused output.",
    icon: LinkIcon,
  },
  {
    title: "Evidence over decoration",
    description: "Outputs should be grounded in retrieved page data, metadata, transcripts, screenshots, or user-provided files.",
    icon: Search,
  },
  {
    title: "Useful before fancy",
    description: "The MVP prioritizes working reports, exports, tracking links, QR tools, and career workflows before broad automation.",
    icon: Wrench,
  },
];

const activeAreas = [
  "Brand and visual identity analysis",
  "SEO and performance-oriented audits",
  "Article and source summarization",
  "Study notes and comparison workflows",
  "Resume matching, cover letters, and interview prep",
  "Short links, QR codes, metadata, previews, and URL utilities",
];

const stack = [
  {
    title: "Firecrawl ingestion",
    description: "Used to retrieve and structure web page content for many URL-based workflows.",
  },
  {
    title: "AI workflow engine",
    description: "Uses mode-based model routing and structured prompts to balance quality and cost.",
  },
  {
    title: "Supabase persistence",
    description: "Stores tasks, user history, saved resume data, and link analytics foundations.",
  },
  {
    title: "Short-domain tracking",
    description: "Powers short links and QR scan tracking through the ilvu.site redirect domain.",
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-24 pt-24 md:pt-32">
      <section className="px-5 md:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/50">About iLoveURL</p>
              <h1 className="mt-4 max-w-4xl font-display text-[48px] lowercase leading-[0.9] text-primary md:text-[78px]">
                turn links into useful outputs.
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] font-semibold leading-relaxed text-gray-600">
                iLoveURL is an early-stage URL-to-output workspace. Paste a URL, choose a workflow, and get a practical result such as a summary, brand report, SEO audit, resume match, QR code, or short tracked link.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/tools">
                  <Button className="rounded-full px-8">
                    Explore Tools <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" className="rounded-full bg-white px-8">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="rounded-[40px] border-2 border-border-color bg-white p-6 shadow-[0_8px_0_0_#CFCFCF] md:p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gray-950 bg-primary text-white shadow-[0_4px_0_0_#CFCFCF]">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">Current stage</p>
              <h2 className="mt-3 text-[32px] font-display lowercase leading-none text-gray-950">mvp in active build.</h2>
              <p className="mt-4 text-[14px] font-semibold leading-relaxed text-gray-500">
                The product is being finalized tool by tool. Some features are live, some are experimental, and some planned tools are intentionally held back until their output quality is strong enough.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="mt-14 px-5 md:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-3">
          {principles.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="rounded-[32px] border-2 border-border-color bg-white p-6 shadow-[0_6px_0_0_#CFCFCF]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[18px] font-black text-gray-950">{item.title}</h3>
                <p className="mt-3 text-[14px] font-semibold leading-relaxed text-gray-500">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-14 px-5 md:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="rounded-[40px] border-2 border-border-color bg-gray-950 p-7 text-white shadow-[0_8px_0_0_#CFCFCF] md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-white/35">What we are solving</p>
            <h2 className="mt-3 text-[38px] font-display lowercase leading-none">web pages are full of reusable context.</h2>
            <p className="mt-5 text-[15px] font-semibold leading-relaxed text-white/65">
              People constantly copy links into other tools, ask for summaries, rebuild notes, inspect metadata, write application documents, or share links in campaigns. iLoveURL is meant to reduce that repeated manual work.
            </p>
            <div className="mt-7 rounded-[28px] bg-white/8 p-5">
              <p className="text-[12px] font-bold leading-relaxed text-white/70">
                The goal is not to claim that every URL can become anything perfectly. The goal is to make common URL workflows faster, clearer, and easier to repeat.
              </p>
            </div>
          </Card>

          <Card className="rounded-[40px] border-2 border-border-color bg-white p-7 shadow-[0_8px_0_0_#CFCFCF] md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">Active MVP areas</p>
            <h2 className="mt-3 text-[34px] font-display lowercase leading-none text-gray-950">what iLoveURL handles today.</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {activeAreas.map((area) => (
                <div key={area} className="flex gap-3 rounded-[22px] bg-gray-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-[13px] font-bold leading-relaxed text-gray-700">{area}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-14 px-5 md:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">How it works</p>
            <h2 className="mt-2 text-[36px] font-display lowercase leading-none text-gray-950">the simple version.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              { title: "Paste", description: "Start with a URL, social video link, or job page.", icon: LinkIcon },
              { title: "Extract", description: "Retrieve useful page content, metadata, screenshots, or transcript context.", icon: ClipboardList },
              { title: "Generate", description: "Use the selected workflow to create a focused output.", icon: FileText },
              { title: "Export", description: "Save, copy, download, or revisit the result from history.", icon: ShieldCheck },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="rounded-[30px] border-2 border-border-color bg-white p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[28px] font-display text-primary/25">{index + 1}</span>
                  </div>
                  <h3 className="text-[18px] font-black text-gray-950">{step.title}</h3>
                  <p className="mt-3 text-[13px] font-semibold leading-relaxed text-gray-500">{step.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-14 px-5 md:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_1fr]">
          <Card className="rounded-[40px] border-2 border-border-color bg-white p-7 shadow-[0_8px_0_0_#CFCFCF] md:p-9">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">Privacy posture</p>
            <h2 className="mt-3 text-[32px] font-display lowercase leading-none text-gray-950">clear promises, not magic words.</h2>
            <p className="mt-5 text-[14px] font-semibold leading-relaxed text-gray-500">
              iLoveURL stores task history and generated outputs for signed-in users so they can revisit their work. The product uses third-party services to retrieve URLs, run AI workflows, process files, and generate outputs. The Privacy Policy explains this in detail.
            </p>
            <Link to="/privacy">
              <Button variant="outline" className="mt-6 rounded-full bg-white">
                Read Privacy Policy
              </Button>
            </Link>
          </Card>

          <Card className="rounded-[40px] border-2 border-border-color bg-white p-7 shadow-[0_8px_0_0_#CFCFCF] md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">Technical stack</p>
            <h2 className="mt-3 text-[32px] font-display lowercase leading-none text-gray-950">built from practical parts.</h2>
            <div className="mt-6 space-y-4">
              {stack.map((item) => (
                <div key={item.title} className="rounded-[22px] border border-gray-100 bg-gray-50 p-4">
                  <h3 className="text-[14px] font-black text-gray-950">{item.title}</h3>
                  <p className="mt-2 text-[13px] font-semibold leading-relaxed text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-16 px-5 md:px-10">
        <Card className="mx-auto max-w-[1100px] rounded-[44px] border-2 border-border-color bg-primary p-8 text-center text-white shadow-[0_8px_0_0_#CFCFCF] md:p-12">
          <h2 className="font-display text-[38px] lowercase leading-none md:text-[52px]">try a real workflow.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] font-semibold leading-relaxed text-white/75">
            The best way to understand iLoveURL is to paste a link and see the output. Start with a live MVP tool and decide from the result.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/tools">
              <Button className="rounded-full bg-white px-8 text-primary hover:bg-white/90">Browse Tools</Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" className="rounded-full border-white/25 bg-white/10 px-8 text-white hover:bg-white/15">
                Create Free Account
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
