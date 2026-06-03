import { Card } from "../components/ui/card";
import { Link } from "react-router-dom";
import {
  Bot,
  ChevronRight,
  Cookie,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  Mail,
  Scale,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { cn } from "../components/ui/utils";

type PrivacySection = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  body: React.ReactNode;
};

const lastUpdated = "May 31, 2026";
const privacyEmail = "privacy@iloveurl.com";
const legalEmail = "legal@iloveurl.com";

const sections: PrivacySection[] = [
  {
    id: "scope",
    title: "1. Scope and Controller",
    icon: Scale,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    body: (
      <>
        <p>
          This Privacy Policy explains how iLoveURL, accessible through iLoveURL.space and related product pages, collects,
          uses, stores, discloses, and protects personal data when you use our URL-to-output tools, account dashboard,
          payment pages, document exports, resume profile features, and related services.
        </p>
        <p>
          For purposes of the Philippine Data Privacy Act of 2012 and similar privacy laws, iLoveURL is the personal
          information controller for account, billing, product usage, and support data that we collect directly from you.
          Certain third-party infrastructure and AI providers act as processors or independent controllers depending on
          their role and applicable law.
        </p>
        <p>
          If you use iLoveURL on behalf of a company, school, client, or other organization, you represent that you have
          authority to provide any personal data, URLs, files, resumes, job posts, or other materials submitted through
          the service.
        </p>
      </>
    ),
  },
  {
    id: "data-collected",
    title: "2. Personal Data We Collect",
    icon: UserCircle,
    color: "text-blue-600",
    bg: "bg-blue-50",
    body: (
      <>
        <p>We collect personal data only when it is reasonably necessary for operating iLoveURL or improving your experience.</p>
        <ul>
          <li><strong>Account data:</strong> name, email address, user ID, profile image, authentication metadata, and login events.</li>
          <li><strong>Submitted URLs:</strong> URLs you process, source domains, scraped page metadata, article text, job descriptions, public website content, media transcript requests, and related technical context.</li>
          <li><strong>User files and profile content:</strong> uploaded resumes, pasted resume text, saved resume profiles, generated cover letters, resume match reports, interview prep packs, PDFs, DOCX-derived text, and exported documents.</li>
          <li><strong>Generated outputs:</strong> summaries, brand reports, SEO audits, study notes, QR codes, short links, meta tags, comparison reports, transcripts, presentation drafts, and task history.</li>
          <li><strong>Payment and subscription data:</strong> selected plan, Polar subscription identifiers, transaction status, payment events, invoice-related information, and plan entitlement records. We do not intentionally store full card numbers.</li>
          <li><strong>Usage and device data:</strong> IP address, browser, device type, approximate region, timestamps, tool used, selected mode, processing status, errors, token usage, Firecrawl calls, SocialKit calls, and other operational logs.</li>
          <li><strong>Support communications:</strong> messages, attachments, screenshots, feedback, and any contact information you provide when requesting help.</li>
        </ul>
        <p>
          Some URLs or documents may contain personal data about you or third parties. You are responsible for ensuring
          that you have the right to submit that material to iLoveURL.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Personal Data",
    icon: Bot,
    color: "text-purple-600",
    bg: "bg-purple-50",
    body: (
      <>
        <p>We process data for legitimate product, contractual, security, and compliance purposes, including to:</p>
        <ul>
          <li>provide URL processing, scraping, AI analysis, transcript extraction, document generation, exports, and dashboard history;</li>
          <li>authenticate users, maintain accounts, save resume profiles, and attach generated tasks to the correct user;</li>
          <li>route requests through the proper workflow mode, provider, model, or tool engine;</li>
          <li>monitor performance, troubleshoot failed jobs, prevent abuse, detect security incidents, and enforce usage limits;</li>
          <li>process subscriptions, credits, billing events, upgrades, cancellations, refunds, and payment-related support;</li>
          <li>respond to support requests, legal requests, privacy requests, and product feedback;</li>
          <li>improve product quality, prompts, workflows, cost controls, and user experience using aggregated or de-identified usage signals where reasonably possible.</li>
        </ul>
        <p>
          We do not use private resume uploads, saved resume profiles, or generated career documents to train foundation
          AI models. If we later introduce optional product-improvement training using identifiable customer content, we
          will provide clear notice and obtain consent where required.
        </p>
      </>
    ),
  },
  {
    id: "ai-processing",
    title: "4. AI and URL Processing",
    icon: Globe,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    body: (
      <>
        <p>
          iLoveURL works by retrieving information from URLs and transforming that information into structured outputs.
          Depending on the tool, we may send submitted URLs, extracted page text, screenshots, metadata, uploaded files,
          transcripts, or structured context to third-party services for processing.
        </p>
        <ul>
          <li><strong>Firecrawl</strong> may be used to scrape, crawl, extract metadata, capture screenshots, and convert websites into structured content.</li>
          <li><strong>OpenRouter, DeepSeek, Google ADK, or other model providers</strong> may receive prompts, extracted context, and selected user-provided content to generate outputs.</li>
          <li><strong>Google PageSpeed Insights and Chrome UX Report</strong> may be used for SEO and performance evidence.</li>
          <li><strong>SocialKit</strong> may be used to retrieve transcripts or media data from supported YouTube, Facebook, Instagram, or TikTok URLs.</li>
          <li><strong>Presenton or presentation-rendering services</strong> may be used to create or preview presentation files when enabled.</li>
        </ul>
        <p>
          AI-generated outputs can be incomplete, inaccurate, outdated, biased, or unsuitable for your purpose. You should
          independently verify outputs before relying on them for employment, legal, financial, academic, business, SEO,
          medical, safety, or publication decisions.
        </p>
      </>
    ),
  },
  {
    id: "legal-bases",
    title: "5. Legal Bases for Processing",
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    body: (
      <>
        <p>Depending on your location and the data involved, we rely on one or more of the following legal bases:</p>
        <ul>
          <li><strong>Contract:</strong> to provide the tools, accounts, subscriptions, exports, saved profiles, and support you request.</li>
          <li><strong>Consent:</strong> for optional communications, optional saved profile features, certain cookies, or other processing where consent is required.</li>
          <li><strong>Legitimate interests:</strong> to secure the platform, improve workflows, prevent abuse, debug errors, and maintain service reliability.</li>
          <li><strong>Legal obligation:</strong> to comply with tax, accounting, payment, consumer protection, privacy, or lawful request obligations.</li>
          <li><strong>Vital or public interests:</strong> only where strictly necessary and recognized by applicable law.</li>
        </ul>
        <p>
          We aim to follow the privacy principles of transparency, legitimate purpose, and proportionality when processing
          personal data.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "6. Service Providers and Disclosures",
    icon: Database,
    color: "text-orange-600",
    bg: "bg-orange-50",
    body: (
      <>
        <p>We do not sell your personal data. We may share personal data only as reasonably necessary with:</p>
        <ul>
          <li>hosting, database, storage, authentication, and logging providers such as Supabase or deployment infrastructure;</li>
          <li>AI, scraping, media transcript, presentation, performance, and analytics providers needed to operate a selected tool;</li>
          <li>payment processors such as Polar for subscription checkout, billing, fraud prevention, and dispute handling;</li>
          <li>professional advisers, auditors, legal counsel, or compliance vendors under confidentiality duties;</li>
          <li>law enforcement, regulators, courts, or other parties when we reasonably believe disclosure is legally required or necessary to protect rights, safety, security, or service integrity;</li>
          <li>a successor entity if iLoveURL is involved in a merger, acquisition, financing, reorganization, sale of assets, or similar business transaction.</li>
        </ul>
        <p>
          Third-party services process data under their own terms and privacy policies. We choose providers based on
          product need, reliability, and reasonable security expectations, but we do not control every downstream practice.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "7. Retention and Deletion",
    icon: Database,
    color: "text-slate-600",
    bg: "bg-slate-100",
    body: (
      <>
        <p>We retain personal data for as long as needed to provide the service, comply with law, resolve disputes, enforce agreements, and maintain security.</p>
        <ul>
          <li><strong>Task history and generated results:</strong> retained while your account is active unless deleted by you or removed under our retention process.</li>
          <li><strong>Uploaded resumes and saved resume profiles:</strong> retained until you delete them, replace them, close your account, or request deletion, subject to backups and legal requirements.</li>
          <li><strong>Short links, QR records, and campaign-style outputs:</strong> may remain active until deleted, disabled, expired, or abused.</li>
          <li><strong>Operational logs:</strong> retained for a limited period for debugging, security, audit, abuse prevention, and billing reconciliation.</li>
          <li><strong>Payment records:</strong> retained as required for accounting, tax, fraud prevention, subscription management, and dispute handling.</li>
        </ul>
        <p>
          Deletion from active systems may not immediately remove data from encrypted backups, logs, provider records, or
          legally required archives, but we will restrict further active processing where required.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "8. Security Measures",
    icon: Lock,
    color: "text-green-600",
    bg: "bg-green-50",
    body: (
      <>
        <p>
          We use reasonable technical and organizational safeguards designed to protect personal data against unauthorized
          access, alteration, disclosure, or destruction. These safeguards may include encrypted connections, protected
          database access, restricted service keys, row-level security where applicable, storage controls, provider access
          management, and operational monitoring.
        </p>
        <p>
          No internet service is completely secure. You are responsible for using strong credentials, protecting your
          account, avoiding submission of unnecessary sensitive data, and notifying us immediately if you suspect
          unauthorized access.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "9. Cookies and Similar Technologies",
    icon: Cookie,
    color: "text-amber-600",
    bg: "bg-amber-50",
    body: (
      <>
        <p>
          We may use cookies, local storage, session storage, analytics events, and similar technologies to keep you
          signed in, remember interface preferences, store local resume file references, measure product usage, improve
          performance, and prevent abuse.
        </p>
        <p>
          You can control cookies through your browser settings. Blocking cookies or local storage may prevent login,
          dashboard history, payment flow, saved resume features, and certain tools from working correctly.
        </p>
      </>
    ),
  },
  {
    id: "international",
    title: "10. International Transfers",
    icon: Globe,
    color: "text-sky-600",
    bg: "bg-sky-50",
    body: (
      <>
        <p>
          iLoveURL may process and store data in countries other than your country of residence, including through global
          cloud, AI, payment, analytics, and security providers. These countries may have data protection laws different
          from those in your jurisdiction.
        </p>
        <p>
          Where required, we use appropriate safeguards such as contractual protections, provider security commitments,
          and access controls to support lawful international processing.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "11. Your Privacy Rights",
    icon: ShieldCheck,
    color: "text-lime-600",
    bg: "bg-lime-50",
    body: (
      <>
        <p>Depending on where you live, you may have rights to:</p>
        <ul>
          <li>request access to personal data we hold about you;</li>
          <li>correct inaccurate or incomplete data;</li>
          <li>request deletion, anonymization, or blocking of data;</li>
          <li>object to or restrict certain processing;</li>
          <li>withdraw consent where processing is based on consent;</li>
          <li>request a portable copy of certain data;</li>
          <li>file a complaint with a privacy authority, including the Philippine National Privacy Commission where applicable.</li>
        </ul>
        <p>
          To exercise rights, email <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>. We may ask you to verify your
          identity and account ownership before acting on a request.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "12. Children and Minors",
    icon: UserCircle,
    color: "text-rose-600",
    bg: "bg-rose-50",
    body: (
      <>
        <p>
          iLoveURL is not intended for children under 13 years old, or under the minimum digital consent age in your
          jurisdiction. We do not knowingly collect personal data from children without proper consent.
        </p>
        <p>
          If you believe a child submitted personal data to iLoveURL, contact us and we will take reasonable steps to
          delete the data where required.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "13. Changes to This Policy",
    icon: FileText,
    color: "text-violet-600",
    bg: "bg-violet-50",
    body: (
      <>
        <p>
          We may update this Privacy Policy as iLoveURL evolves. We will post the updated version with a new effective
          date. If changes materially affect how we process personal data, we will provide additional notice where
          required by law.
        </p>
        <p>
          We will not quietly expand our use of previously collected personal data in a materially more permissive way
          without providing appropriate notice and obtaining consent where required.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "14. Contact",
    icon: Mail,
    color: "text-blue-600",
    bg: "bg-blue-50",
    body: (
      <>
        <p>For privacy questions, requests, or complaints, contact:</p>
        <p>
          <strong>Privacy:</strong> <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a><br />
          <strong>Legal:</strong> <a href={`mailto:${legalEmail}`}>{legalEmail}</a><br />
          <strong>Operator:</strong> iLoveURL<br />
          <strong>Mailing address:</strong> To be added before public launch.
        </p>
      </>
    ),
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      <section className="relative overflow-hidden bg-primary px-5 pb-20 pt-32 text-center md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.14),transparent_45%)]" />
        <div className="relative z-10 mx-auto max-w-4xl space-y-5">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white no-underline transition hover:bg-white/20">
            <ChevronRight className="h-3 w-3 rotate-180" /> Back to iLoveURL
          </Link>
          <h1 className="font-display text-[42px] leading-tight text-white md:text-[64px]">Privacy Policy</h1>
          <p className="mx-auto max-w-2xl text-[16px] font-medium leading-relaxed text-white/80 md:text-[18px]">
            A product-specific explanation of how iLoveURL handles URLs, AI prompts, uploaded files, saved resume profiles,
            task history, subscriptions, and third-party processing.
          </p>
          <p className="text-[13px] font-bold text-white/60">Effective date: {lastUpdated}</p>
        </div>
      </section>

      <div className="mx-auto mt-12 grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:mt-20 md:px-10 lg:grid-cols-12">
        <aside className="hidden h-fit lg:sticky lg:top-24 lg:col-span-3 lg:block">
          <div className="space-y-2 rounded-3xl border-2 border-border-color/50 bg-white p-5 shadow-sm">
            <p className="mb-4 px-2 text-[11px] font-black uppercase tracking-[2px] text-nav-text/40">On this page</p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[13px] font-bold text-nav-text transition hover:bg-primary/5 hover:text-primary"
              >
                <section.icon className={cn("h-4 w-4", section.color)} />
                <span className="truncate">{section.title.replace(/^\d+\.\s*/, "")}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-primary/10 bg-primary/5 p-6">
            <h4 className="text-[14px] font-bold text-primary">Privacy contact</h4>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-gray-500">Send privacy requests or concerns to our privacy inbox.</p>
            <a href={`mailto:${privacyEmail}`} className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-primary hover:opacity-70">
              {privacyEmail} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </aside>

        <main className="space-y-8 lg:col-span-9">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { title: "No personal data sale", desc: "We do not sell your personal data.", icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50" },
              { title: "AI-aware notice", desc: "We explain model, scraping, transcript, and performance providers.", icon: Bot, color: "text-purple-600", bg: "bg-purple-50" },
              { title: "User control", desc: "You can request access, correction, deletion, and other rights.", icon: Lock, color: "text-blue-600", bg: "bg-blue-50" },
            ].map((item) => (
              <div key={item.title} className="rounded-[28px] border-2 border-border-color/50 bg-white p-5 text-center shadow-sm">
                <div className={cn("mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl", item.bg)}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
                </div>
                <h3 className="text-[14px] font-black uppercase tracking-[1px] text-gray-950">{item.title}</h3>
                <p className="mt-2 text-[12px] font-semibold leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          {sections.map((section) => (
            <Card id={section.id} key={section.id} className="scroll-mt-28 overflow-hidden rounded-[36px] border-2 border-border-color/50 bg-white shadow-sm">
              <div className="grid gap-6 p-7 md:grid-cols-[180px_1fr] md:p-10">
                <div>
                  <div className={cn("mb-4 flex h-14 w-14 items-center justify-center rounded-2xl", section.bg)}>
                    <section.icon className={cn("h-7 w-7", section.color)} />
                  </div>
                  <h2 className="text-[20px] font-black leading-tight text-gray-950">{section.title}</h2>
                </div>
                <div className="privacy-copy space-y-4 text-[15px] font-medium leading-[1.8] text-gray-600">
                  {section.body}
                </div>
              </div>
            </Card>
          ))}
        </main>
      </div>
    </div>
  );
}
