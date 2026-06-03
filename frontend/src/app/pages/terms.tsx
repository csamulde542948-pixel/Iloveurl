import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  Bot,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileSignature,
  Gavel,
  Globe,
  Mail,
  Scale,
  ShieldAlert,
  UserCheck,
  Zap,
} from "lucide-react";
import { cn } from "../components/ui/utils";

type TermsSection = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  body: React.ReactNode;
};

const effectiveDate = "May 31, 2026";
const legalEmail = "legal@iloveurl.com";
const privacyEmail = "privacy@iloveurl.com";

const sections: TermsSection[] = [
  {
    id: "acceptance",
    title: "1. Agreement to These Terms",
    icon: UserCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    body: (
      <>
        <p>
          These Terms of Service govern your access to and use of iLoveURL, including iLoveURL.space, URL processing
          tools, AI-generated reports, saved profiles, dashboards, subscriptions, payment pages, exports, and related
          services. By creating an account, clicking a button to process a URL, purchasing a plan, or otherwise using
          iLoveURL, you agree to these Terms.
        </p>
        <p>
          If you use iLoveURL for a company, school, client, or other organization, you represent that you have authority
          to bind that organization. If you do not agree to these Terms, do not use the service.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "2. What iLoveURL Provides",
    icon: Zap,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    body: (
      <>
        <p>
          iLoveURL is a URL-to-output productivity platform. Depending on the selected tool, iLoveURL may transform URLs,
          public webpages, uploaded resumes, pasted context, media links, metadata, screenshots, performance data, and
          other source material into summaries, SEO audits, brand reports, study notes, transcripts, cover letters,
          resume match reports, interview prep packs, QR codes, short links, meta tags, comparison reports, and other
          generated outputs.
        </p>
        <p>
          Some features are experimental, unreleased, in beta, or available only on certain plans. We may add, remove,
          suspend, limit, rename, or modify tools as the product evolves.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "3. Accounts and Eligibility",
    icon: ShieldAlert,
    color: "text-orange-600",
    bg: "bg-orange-50",
    body: (
      <>
        <p>
          You must provide accurate account information and keep your credentials secure. You are responsible for all
          activity under your account, including URL submissions, generated outputs, subscriptions, uploaded files, and
          saved profile data.
        </p>
        <ul>
          <li>You must be at least 13 years old or the minimum age required in your jurisdiction.</li>
          <li>You may not share paid accounts, bypass limits, resell access, or create accounts to evade enforcement.</li>
          <li>You must promptly notify us if you suspect unauthorized account access.</li>
          <li>We may require verification before granting access to sensitive account, billing, or privacy requests.</li>
        </ul>
      </>
    ),
  },
  {
    id: "user-content",
    title: "4. Your Content and Permissions",
    icon: FileSignature,
    color: "text-purple-600",
    bg: "bg-purple-50",
    body: (
      <>
        <p>
          You retain ownership of content you submit to iLoveURL, including URLs, pasted text, uploaded files, resume
          content, job post context, prompts, and other materials. You also retain whatever rights you have in outputs
          generated for you, subject to third-party rights, applicable law, and these Terms.
        </p>
        <p>
          You grant iLoveURL a non-exclusive, worldwide, royalty-free license to host, copy, process, transmit, display,
          transform, and create derivative works from your submitted content solely as necessary to provide, secure,
          troubleshoot, improve, and support the service.
        </p>
        <p>
          You represent that you have all rights, licenses, permissions, and lawful bases needed to submit any URL,
          file, resume, article, media link, third-party information, or personal data to iLoveURL.
        </p>
      </>
    ),
  },
  {
    id: "ai-outputs",
    title: "5. AI Outputs and Verification",
    icon: Bot,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    body: (
      <>
        <p>
          iLoveURL uses automation, scraping, retrieval, structured workflows, AI models, and third-party APIs to generate
          outputs. Outputs may be incomplete, inaccurate, outdated, offensive, biased, non-compliant, non-unique, or
          unsuitable for your intended use.
        </p>
        <ul>
          <li>You are responsible for reviewing, verifying, editing, and approving outputs before relying on or publishing them.</li>
          <li>Career, resume, cover letter, and interview prep outputs are informational drafting aids, not employment guarantees.</li>
          <li>SEO, brand, marketing, and business outputs are analytical aids, not professional legal, financial, tax, medical, or investment advice.</li>
          <li>You may not represent AI-generated content as human-created where doing so would be deceptive, unlawful, or against platform rules.</li>
          <li>You must not use outputs to create fake reviews, fraudulent claims, impersonation, deceptive ads, or misleading endorsements.</li>
        </ul>
      </>
    ),
  },
  {
    id: "url-responsibility",
    title: "6. URL, Scraping, and Third-Party Site Responsibility",
    icon: Globe,
    color: "text-green-600",
    bg: "bg-green-50",
    body: (
      <>
        <p>
          You are responsible for the URLs you submit and for your use of content obtained from third-party websites.
          iLoveURL may use providers such as Firecrawl, SocialKit, Google PageSpeed Insights, Chrome UX Report, AI model
          providers, and rendering tools to process selected URLs.
        </p>
        <ul>
          <li>Do not submit URLs or content you are not authorized to process.</li>
          <li>Do not use iLoveURL to bypass paywalls, authentication, robots restrictions, access controls, rate limits, or technical protection measures.</li>
          <li>Do not use iLoveURL to copy, redistribute, or commercialize third-party content in violation of law or the third party's terms.</li>
          <li>Some websites may block, restrict, or provide incomplete data to automated tools; outputs may therefore be incomplete.</li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "7. Acceptable Use",
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50",
    body: (
      <>
        <p>You agree not to use iLoveURL to:</p>
        <ul>
          <li>violate laws, regulations, third-party rights, platform terms, or contractual obligations;</li>
          <li>process illegal, exploitative, abusive, harassing, hateful, sexually exploitative, or violent material;</li>
          <li>upload malware, phishing material, credential harvesters, malicious scripts, or harmful code;</li>
          <li>collect, infer, publish, or misuse sensitive personal data without lawful authority;</li>
          <li>generate spam, deceptive marketing, fake reviews, fake testimonials, impersonation, scams, or fraud;</li>
          <li>reverse engineer, scrape, overload, probe, attack, or interfere with iLoveURL systems or provider systems;</li>
          <li>circumvent credits, usage limits, plan restrictions, authentication, storage limits, or security controls;</li>
          <li>resell, sublicense, or provide managed access to iLoveURL without written permission.</li>
        </ul>
        <p>We may suspend or terminate access, remove content, block requests, or report abuse if we believe these rules are violated.</p>
      </>
    ),
  },
  {
    id: "plans",
    title: "8. Plans, Credits, Subscriptions, and Payments",
    icon: CreditCard,
    color: "text-violet-600",
    bg: "bg-violet-50",
    body: (
      <>
        <p>
          iLoveURL may offer free plans, paid subscriptions, credit packs, premium exports, and team plans. Plan features,
          usage allowances, model access, tool access, export rights, credit costs, and pricing may vary.
        </p>
        <ul>
          <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
          <li>Payment processing may be handled by Polar or other payment providers. Their terms and privacy policies apply to payment details.</li>
          <li>Credits may be consumed when a task starts, when a provider call is made, or when an output is completed, depending on the tool design.</li>
          <li>Failed, cancelled, abusive, unsupported, or partially completed requests may not always be refundable if provider costs were incurred.</li>
          <li>We may correct pricing errors, prevent fraudulent purchases, and adjust plan entitlements for future billing periods.</li>
        </ul>
        <p>
          Unless a separate written policy says otherwise, subscription fees are non-refundable except where required by
          law, where we choose to grant a courtesy refund, or where the pricing page expressly states a refund window.
        </p>
      </>
    ),
  },
  {
    id: "exports",
    title: "9. Downloads, Exports, and Pro Features",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    body: (
      <>
        <p>
          Some outputs may be exportable as PDF, Markdown, JSON, PPTX, image, QR asset, short link, or other file types.
          Export availability may depend on your plan, provider availability, browser, file size, or tool status.
        </p>
        <p>
          You are responsible for checking exported files before use. We do not guarantee that exports will preserve all
          formatting, meet a third-party platform requirement, pass ATS systems, improve SEO rankings, produce employment
          outcomes, or be accepted by any institution, employer, marketplace, or platform.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "10. Privacy and Data Protection",
    icon: ShieldAlert,
    color: "text-blue-600",
    bg: "bg-blue-50",
    body: (
      <>
        <p>
          Our Privacy Policy explains how we collect, use, store, and disclose personal data. By using iLoveURL, you
          acknowledge that personal data may be processed as described in the Privacy Policy.
        </p>
        <p>
          If you submit personal data about another person, you represent that you have a valid legal basis or consent to
          do so. For privacy questions, contact <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "11. iLoveURL Intellectual Property",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    body: (
      <>
        <p>
          iLoveURL and its licensors own the service, software, design, workflows, prompts, templates, branding,
          interface, infrastructure, documentation, and other platform materials. These Terms do not transfer ownership
          of iLoveURL intellectual property to you.
        </p>
        <p>
          You may not copy, modify, distribute, sell, lease, reverse engineer, extract prompts from, benchmark at scale,
          or create competing services using iLoveURL confidential or proprietary materials except as permitted by law or
          written permission.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "12. Third-Party Services",
    icon: Globe,
    color: "text-slate-600",
    bg: "bg-slate-100",
    body: (
      <>
        <p>
          iLoveURL may depend on third-party services for hosting, database, authentication, storage, scraping, AI model
          routing, transcript extraction, analytics, payments, performance analysis, document rendering, and other
          functionality. We are not responsible for third-party services, websites, content, outages, policies, pricing,
          rate limits, moderation decisions, or errors.
        </p>
        <p>
          If a third-party provider changes, limits, suspends, or discontinues a service, iLoveURL may modify or disable
          affected features without liability.
        </p>
      </>
    ),
  },
  {
    id: "beta",
    title: "13. Beta, Experimental, and Unreleased Features",
    icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    body: (
      <>
        <p>
          Some tools may be labeled beta, soon, experimental, internal, preview, or unreleased. These features may be
          unstable, incomplete, inaccurate, unavailable, or subject to stricter limits. You use them at your own risk.
        </p>
        <p>
          We may collect additional operational feedback and error data for beta features to improve reliability, subject
          to our Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "14. Suspension and Termination",
    icon: Gavel,
    color: "text-red-600",
    bg: "bg-red-50",
    body: (
      <>
        <p>
          We may suspend, limit, or terminate your access to iLoveURL if we reasonably believe you violated these Terms,
          created risk for other users, caused provider abuse, failed to pay, violated law, or used the service in a way
          that could harm iLoveURL, third parties, or the public.
        </p>
        <p>
          You may stop using iLoveURL at any time. Account deletion, subscription cancellation, and data deletion are
          governed by the product settings, payment provider rules, retention requirements, and our Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "warranty",
    title: "15. Disclaimers",
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    body: (
      <>
        <p>
          iLoveURL is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, we disclaim
          all warranties, whether express, implied, statutory, or otherwise, including warranties of merchantability,
          fitness for a particular purpose, non-infringement, accuracy, availability, and uninterrupted operation.
        </p>
        <p>
          We do not warrant that outputs will be accurate, lawful for your use, original, complete, secure, accepted by
          third parties, or free of harmful, biased, or incorrect content.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "16. Limitation of Liability",
    icon: Scale,
    color: "text-gray-700",
    bg: "bg-gray-100",
    body: (
      <>
        <p>
          To the maximum extent permitted by law, iLoveURL will not be liable for indirect, incidental, special,
          consequential, exemplary, or punitive damages, or for lost profits, lost revenue, lost data, business
          interruption, reputational harm, employment outcomes, SEO ranking changes, third-party enforcement, or provider
          outages.
        </p>
        <p>
          To the maximum extent permitted by law, our total liability for any claim relating to iLoveURL will not exceed
          the greater of: (a) the amount you paid to iLoveURL in the three months before the event giving rise to the
          claim; or (b) USD 100 or its local currency equivalent.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "17. Indemnity",
    icon: ShieldAlert,
    color: "text-rose-600",
    bg: "bg-rose-50",
    body: (
      <p>
        You agree to defend, indemnify, and hold harmless iLoveURL and its owners, operators, employees, contractors,
        agents, service providers, and affiliates from claims, damages, liabilities, losses, and expenses arising from
        your content, your use of outputs, your violation of these Terms, your violation of law, your infringement of
        third-party rights, your submitted URLs or files, or your misuse of the service.
      </p>
    ),
  },
  {
    id: "law",
    title: "18. Governing Law and Disputes",
    icon: Gavel,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    body: (
      <>
        <p>
          Unless mandatory consumer protection law provides otherwise, these Terms are governed by the laws of the
          Republic of the Philippines, without regard to conflict-of-law rules.
        </p>
        <p>
          Before filing a formal claim, you agree to contact us at <a href={`mailto:${legalEmail}`}>{legalEmail}</a> and
          attempt to resolve the dispute informally for at least 30 days. If informal resolution fails, disputes will be
          brought before the courts or appropriate dispute resolution venue with jurisdiction under applicable law.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "19. Changes to These Terms",
    icon: FileSignature,
    color: "text-purple-600",
    bg: "bg-purple-50",
    body: (
      <>
        <p>
          We may update these Terms from time to time. We will post the updated Terms with a new effective date. If a
          change materially affects your rights or obligations, we will provide additional notice where required.
        </p>
        <p>
          Continued use of iLoveURL after updated Terms become effective means you accept the updated Terms. If you do
          not agree, you must stop using the service and cancel any paid plan before the next billing cycle.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "20. Contact",
    icon: Mail,
    color: "text-blue-600",
    bg: "bg-blue-50",
    body: (
      <p>
        For legal notices, questions, or disputes, contact <a href={`mailto:${legalEmail}`}>{legalEmail}</a>. For privacy
        requests, contact <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>. Mailing address and registered business
        details should be added before public launch or after business registration is finalized.
      </p>
    ),
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function TermsPage() {
  const highlights = [
    "You keep rights to your inputs and generated outputs.",
    "AI outputs must be reviewed before use.",
    "Paid plans, credits, and exports can have limits.",
    "Illegal scraping, fraud, impersonation, and abuse are prohibited.",
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <section className="relative overflow-hidden bg-gray-950 px-5 pb-24 pt-32 md:px-10">
        <div className="absolute right-0 top-0 h-[520px] w-[520px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-orange-500/10 blur-[100px]" />

        <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 text-center md:text-left lg:grid-cols-2">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white/60 no-underline transition hover:bg-white/10">
              <ChevronRight className="h-3 w-3 rotate-180" /> Back to iLoveURL
            </Link>
            <h1 className="font-display text-[48px] leading-[0.9] text-white md:text-[72px]">
              Terms of <span className="text-primary">Service</span>
            </h1>
            <p className="max-w-2xl text-[17px] font-medium leading-relaxed text-white/60 md:text-[19px]">
              A fuller operating agreement for iLoveURL’s URL processing, AI generation, uploads, saved profiles,
              subscriptions, credits, exports, and third-party provider workflows.
            </p>
            <p className="text-[13px] font-bold text-white/40">Effective date: {effectiveDate}</p>
          </div>

          <div className="space-y-5 rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm md:p-10">
            <h3 className="text-[14px] font-black uppercase tracking-[3px] text-primary">Agreement Highlights</h3>
            {highlights.map((text) => (
              <div key={text} className="flex items-center gap-4 text-white/80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-[15px] font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-10 max-w-[1440px] px-5 md:px-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {sections.slice(0, 10).map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-border-color/50 bg-white p-4 text-center shadow-sm transition hover:border-primary/30"
            >
              <section.icon className={cn("h-5 w-5", section.color)} />
              <span className="text-[10px] font-black uppercase tracking-wider text-nav-text">{section.title.replace(/^\d+\.\s*/, "")}</span>
            </button>
          ))}
        </div>

        <main className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <Card id={section.id} key={section.id} className="scroll-mt-28 rounded-[36px] border-2 border-border-color/50 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:p-9">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", section.bg)}>
                  <section.icon className={cn("h-7 w-7", section.color)} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[4px] text-nav-text/20">
                  Section {section.title.split(".")[0]}
                </span>
              </div>
              <h2 className="mb-4 text-[24px] font-black text-gray-text">{section.title.replace(/^\d+\.\s*/, "")}</h2>
              <div className="terms-copy space-y-4 text-[15px] font-medium leading-[1.8] text-gray-light">
                {section.body}
              </div>
            </Card>
          ))}
        </main>

        <div className="mt-16 rounded-[48px] border-2 border-border-color/50 bg-white p-10 text-center md:p-12">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="font-display text-[30px] text-primary">Questions before launch?</h2>
            <p className="text-[15px] font-medium leading-relaxed text-gray-light">
              These documents are written for the current iLoveURL product direction. Before public launch, have local
              counsel review your registered business name, address, refund policy, consumer terms, tax obligations, and
              jurisdiction-specific requirements.
            </p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={`mailto:${legalEmail}`}>
              <Button className="h-12 rounded-full px-8 text-[12px] font-bold uppercase tracking-widest">Email Legal</Button>
            </a>
            <Link to="/privacy">
              <Button variant="outline" className="h-12 rounded-full bg-white px-8 text-[12px] font-bold uppercase tracking-widest">View Privacy Policy</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
