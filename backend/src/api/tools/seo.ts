import { Router, Request, Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '../../lib/supabase';
import { runAiWorkflow } from '../../lib/aiWorkflow';
import { resolveWorkflow } from '../../lib/workflows';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { buildSeoWorkflowContext } from '../../lib/workflows/context/seoContext';
import { fetchPageSpeedInsights } from '../../lib/seo/pageSpeed';
import { fetchCruxInsights } from '../../lib/seo/crux';
import { ResolvedWorkflow } from '../../lib/workflows/types';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';
import { getFirecrawlApiKey } from '../../lib/config';

const router = Router();

type SeoCollectedPage = {
  url: string;
  metadata: Record<string, any>;
  markdown: string;
  links: string[];
};

type SeoCollectionResult = {
  operation: 'scrape' | 'crawl';
  pages: SeoCollectedPage[];
  limit: number;
};

type SeoHealthStatus = 'strong' | 'needs_work' | 'critical' | 'insufficient_data';

type SeoAuditSnapshot = {
  pillars: Array<{
    name: string;
    status: SeoHealthStatus;
    rationale: string;
  }>;
  topPriorities: Array<{
    title: string;
    owner: 'Founder' | 'Marketer' | 'Developer';
    impact: 'High' | 'Medium' | 'Low';
    effort: 'High' | 'Medium' | 'Low';
    evidence: string;
    action: string;
  }>;
  schemaRecommendations: string[];
  evidenceSources: Array<{
    label: string;
    source: string;
    fetchedAt?: string;
    detail: string;
  }>;
};

const SEO_REPORT_SECTIONS = [
  'SEO Health Snapshot',
  'SEO Audit Overview',
  'Top 3 Priority Fixes',
  'Technical Findings',
  'Performance And Core Web Vitals',
  'Content And Intent',
  'Social Preview Metadata',
  'Developer Fix List',
  'Marketing Next Steps',
  'Evidence Sources',
];

const SEO_SECTION_ALIASES: Record<string, string[]> = {
  'SEO Health Snapshot': ['scorecard', 'health snapshot', 'seo scorecard', 'seo health'],
  'SEO Audit Overview': ['overview', 'audit overview', 'executive overview', 'seo overview', 'summary'],
  'Top 3 Priority Fixes': ['top priorities', 'priority fixes', 'prioritized fixes', 'prioritized recommendations'],
  'Technical Findings': ['technical seo findings', 'technical seo', 'technical audit', 'technical findings'],
  'Performance And Core Web Vitals': ['performance', 'core web vitals', 'performance and core web vitals', 'pagespeed', 'lighthouse'],
  'Content And Intent': ['content', 'content strategy', 'search intent', 'content and intent', 'intent'],
  'Social Preview Metadata': ['social metadata', 'social preview', 'open graph', 'twitter card', 'social preview metadata'],
  'Developer Fix List': ['developer fixes', 'developer checklist', 'technical action list', 'dev fix list'],
  'Marketing Next Steps': ['marketing actions', 'quick wins', 'next steps', 'immediate actions', 'marketing next steps'],
  'Evidence Sources': ['sources', 'evidence', 'data sources', 'citations'],
};

function normalizeHeading(value: string): string {
  return value
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractMarkdownSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const matches = [...markdown.matchAll(/^#{1,3}\s+(.+?)\s*$/gim)];

  matches.forEach((match, index) => {
    const title = match[1].trim();
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || markdown.length : markdown.length;
    sections[normalizeHeading(title)] = markdown.substring(start, end).trim();
  });

  return sections;
}

function getSectionBody(sections: Record<string, string>, section: string): string | null {
  const aliases = [section, ...(SEO_SECTION_ALIASES[section] || [])].map(normalizeHeading);
  for (const alias of aliases) {
    if (sections[alias]?.trim()) return sections[alias].trim();
  }
  return null;
}

function truncateList(values: string[], max = 5): string {
  return values.filter(Boolean).slice(0, max).join('; ') || 'NOT_FOUND';
}

function describePresence(value: unknown): string {
  return value ? 'Present' : 'NOT_FOUND';
}

function statusLabel(status: SeoHealthStatus): string {
  const labels: Record<SeoHealthStatus, string> = {
    strong: 'Strong',
    needs_work: 'Needs Work',
    critical: 'Critical',
    insufficient_data: 'Insufficient Data',
  };
  return labels[status];
}

function scorePerformanceStatus(score: number | null | undefined): SeoHealthStatus {
  if (typeof score !== 'number') return 'insufficient_data';
  if (score < 50) return 'critical';
  if (score < 75) return 'needs_work';
  return 'strong';
}

function worstStatus(statuses: SeoHealthStatus[]): SeoHealthStatus {
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('needs_work')) return 'needs_work';
  if (statuses.includes('insufficient_data')) return 'insufficient_data';
  return 'strong';
}

function inferSchemaRecommendations(seoContext: ReturnType<typeof buildSeoWorkflowContext>): string[] {
  const text = [
    seoContext.pageTitle,
    seoContext.metadata.description,
    ...seoContext.contentSignals.headings.h1,
    ...seoContext.contentSignals.headings.h2,
  ].filter(Boolean).join(' ').toLowerCase();
  const schema = new Set<string>(['Organization', 'WebSite', 'BreadcrumbList']);

  if (/rental|rent|property|listing|landlord|tenant|real estate|apartment|condo/.test(text)) {
    schema.add('LocalBusiness');
    schema.add('RealEstateAgent');
    schema.add('Offer');
  }
  if (/faq|question|how|what|where|when/.test(text)) {
    schema.add('FAQPage');
  }

  return [...schema];
}

function buildSeoAuditSnapshot(seoContext: ReturnType<typeof buildSeoWorkflowContext>): SeoAuditSnapshot {
  const pageSpeed = seoContext.performanceSignals.pageSpeed;
  const crux = seoContext.performanceSignals.crux;
  const mobile = pageSpeed.find((item) => item.strategy === 'mobile');
  const desktop = pageSpeed.find((item) => item.strategy === 'desktop');
  const performanceStatus = worstStatus([
    scorePerformanceStatus(mobile?.scores.performance),
    desktop ? scorePerformanceStatus(desktop.scores.performance) : 'strong',
    crux?.available && crux.coreWebVitalsAssessment === 'needs_work' ? 'needs_work' : 'strong',
  ]);
  const technicalStatus = seoContext.technicalSignals.indexability === 'noindex'
    ? 'critical'
    : (!seoContext.technicalSignals.hasCanonical || !seoContext.technicalSignals.hasMetaDescription ? 'needs_work' : 'strong');
  const h1Count = seoContext.contentSignals.headings.h1.length;
  const contentStatus = seoContext.contentSignals.wordCount < 500 || h1Count === 0 || h1Count > 2 ? 'needs_work' : 'strong';
  const linkingStatus = seoContext.contentSignals.internalLinks < 5 ? 'needs_work' : 'strong';
  const socialStatus = seoContext.technicalSignals.hasOpenGraph && seoContext.technicalSignals.hasTwitterCard ? 'strong' : 'needs_work';
  const trustStatus = /trust|verified|review|secure|guarantee|testimonial|customer|proof/i.test(seoContext.contentSignals.selectedMarkdownExcerpt)
    ? 'strong'
    : 'needs_work';

  const topPriorities: SeoAuditSnapshot['topPriorities'] = [];
  if (performanceStatus !== 'strong') {
    topPriorities.push({
      title: 'Improve mobile performance before scaling SEO traffic',
      owner: 'Developer',
      impact: 'High',
      effort: 'Medium',
      evidence: `Google PageSpeed Insights reports mobile performance ${mobile?.scores.performance ?? 'INSUFFICIENT_DATA'} and desktop performance ${desktop?.scores.performance ?? 'INSUFFICIENT_DATA'}.`,
      action: 'Reduce unused JavaScript, optimize hero/media assets, defer non-critical scripts, and retest with PageSpeed after changes.',
    });
  }
  if (contentStatus !== 'strong') {
    topPriorities.push({
      title: 'Clarify the primary page intent and heading hierarchy',
      owner: 'Marketer',
      impact: 'High',
      effort: 'Low',
      evidence: `Detected H1 headings: ${truncateList(seoContext.contentSignals.headings.h1, 4)}.`,
      action: 'Use one clear primary H1 and separate secondary audience journeys into supporting sections or pages.',
    });
  }
  if (linkingStatus !== 'strong') {
    topPriorities.push({
      title: 'Strengthen internal linking to high-value pages',
      owner: 'Founder',
      impact: 'Medium',
      effort: 'Low',
      evidence: `${seoContext.contentSignals.internalLinks} internal links were detected across ${seoContext.crawledPageCount} collected page(s).`,
      action: 'Add contextual links to listing, signup, trust, pricing, location, or conversion pages from relevant homepage sections.',
    });
  }
  if (topPriorities.length < 3 && technicalStatus !== 'strong') {
    topPriorities.push({
      title: 'Clean up metadata and indexability basics',
      owner: 'Developer',
      impact: 'High',
      effort: 'Low',
      evidence: `Canonical: ${seoContext.metadata.canonical || 'NOT_FOUND'}; meta description: ${describePresence(seoContext.metadata.description)}; robots: ${seoContext.metadata.robots || 'NOT_FOUND'}.`,
      action: 'Confirm each important page has unique title, meta description, canonical, robots directive, and crawlable rendering.',
    });
  }
  if (topPriorities.length < 3 && trustStatus !== 'strong') {
    topPriorities.push({
      title: 'Add stronger trust and conversion evidence',
      owner: 'Marketer',
      impact: 'Medium',
      effort: 'Low',
      evidence: 'The collected page copy did not strongly surface trust terms such as reviews, verification, guarantees, or testimonials.',
      action: 'Add concise proof near the top of the page: verification process, customer proof, safety details, or founder/company credibility.',
    });
  }
  while (topPriorities.length < 3) {
    topPriorities.push({
      title: 'Preserve current SEO fundamentals while improving depth',
      owner: 'Founder',
      impact: 'Medium',
      effort: 'Low',
      evidence: 'Indexability, social metadata, and basic crawlability are present in the structured context.',
      action: 'Use the next content sprint to add more specific landing pages, FAQs, and internal links around the most valuable user journeys.',
    });
  }

  return {
    pillars: [
      { name: 'Technical SEO', status: technicalStatus, rationale: technicalStatus === 'strong' ? 'Indexability, canonical, and metadata basics are mostly present.' : 'Metadata or indexability signals need QA before relying on organic growth.' },
      { name: 'Performance', status: performanceStatus, rationale: `Based on Google PageSpeed Insights mobile ${mobile?.scores.performance ?? 'INSUFFICIENT_DATA'}, desktop ${desktop?.scores.performance ?? 'INSUFFICIENT_DATA'}, and CrUX real-user data ${crux?.available ? crux.coreWebVitalsAssessment : 'INSUFFICIENT_DATA'}.` },
      { name: 'Content Intent', status: contentStatus, rationale: contentStatus === 'strong' ? 'The page has enough crawlable content and a workable heading structure.' : 'The page intent or heading structure needs clearer focus.' },
      { name: 'Internal Linking', status: linkingStatus, rationale: `${seoContext.contentSignals.internalLinks} internal links detected in the collected page set.` },
      { name: 'Social Preview', status: socialStatus, rationale: socialStatus === 'strong' ? 'Open Graph and Twitter metadata are present.' : 'Social preview metadata is incomplete or missing.' },
      { name: 'Trust Signals', status: trustStatus, rationale: trustStatus === 'strong' ? 'Trust or credibility language appears in the collected page copy.' : 'Trust proof is not strongly visible in the collected copy.' },
    ],
    topPriorities: topPriorities.slice(0, 3),
    schemaRecommendations: inferSchemaRecommendations(seoContext),
    evidenceSources: [
      {
        label: 'Crawler evidence',
        source: 'Firecrawl markdown, metadata, and links',
        detail: `${seoContext.crawledPageCount} page(s), ${seoContext.contentSignals.wordCount} words, ${seoContext.contentSignals.internalLinks} internal links.`,
      },
      ...pageSpeed.map((item) => ({
        label: `${item.strategy} performance evidence`,
        source: item.sourceLabel,
        fetchedAt: item.fetchedAt,
        detail: `${item.requestedUrl} | ${item.sourceUrl}`,
      })),
      ...(crux ? [{
        label: 'Real-user Core Web Vitals evidence',
        source: crux.sourceLabel,
        fetchedAt: crux.fetchedAt,
        detail: `${crux.scope} data for ${crux.normalizedOrigin || crux.requestedUrl}; collection period ${crux.collectionPeriod.firstDate || 'unknown'} to ${crux.collectionPeriod.lastDate || 'unknown'}; ${crux.sourceUrl}`,
      }] : []),
    ],
  };
}

function fallbackSeoSection(section: string, seoContext: ReturnType<typeof buildSeoWorkflowContext>, snapshot: SeoAuditSnapshot): string {
  const pageList = seoContext.crawledPages
    .slice(0, 3)
    .map((page, index) => `${index + 1}. ${page.title || page.url}`)
    .join('\n');
  const pageSpeed = seoContext.performanceSignals.pageSpeed;
  const crux = seoContext.performanceSignals.crux;
  const missing = seoContext.missingData.length ? seoContext.missingData.join(', ') : 'none detected in structured context';
  const h1s = truncateList(seoContext.contentSignals.headings.h1, 6);
  const h2s = truncateList(seoContext.contentSignals.headings.h2, 8);
  const performanceOpportunities = pageSpeed
    .flatMap((item) => item.opportunities.map((opportunity) => `${item.strategy}: ${opportunity}`))
    .slice(0, 6);
  const diagnostics = pageSpeed
    .flatMap((item) => item.diagnostics.map((diagnostic) => `${item.strategy}: ${diagnostic}`))
    .slice(0, 4);

  switch (section) {
    case 'SEO Health Snapshot':
      return [
        '| Pillar | Status | Why It Matters |',
        '|---|---|---|',
        ...snapshot.pillars.map((pillar) => `| ${pillar.name} | ${statusLabel(pillar.status)} | ${pillar.rationale} |`),
      ].join('\n');
    case 'SEO Audit Overview':
      return [
        `- **Scope:** ${seoContext.crawledPageCount} page${seoContext.crawledPageCount === 1 ? '' : 's'} were analyzed from ${seoContext.url}, with ${seoContext.contentSignals.wordCount} total words in the collected content sample.`,
        `- **Current SEO posture:** The page set is ${seoContext.technicalSignals.indexability}, has ${seoContext.technicalSignals.hasMetaDescription ? 'a meta description' : 'no detected meta description'}, and has ${seoContext.technicalSignals.hasCanonical ? 'a canonical URL' : 'no detected canonical URL'}.`,
        `- **Main evidence:**\n${pageList || '1. No crawl page titles were available.'}`,
        `- **Primary risk area:** ${missing === 'none detected in structured context' ? 'The structured metadata baseline is mostly present; review performance, content clarity, and conversion-page hierarchy next.' : `The structured context is missing ${missing}, which should be reviewed before launch or major campaign traffic.`}`,
      ].join('\n');
    case 'Top 3 Priority Fixes':
      return snapshot.topPriorities.map((priority, index) => [
        `### ${index + 1}. ${priority.title}`,
        `- **Owner:** ${priority.owner}`,
        `- **Impact / Effort:** ${priority.impact} impact / ${priority.effort} effort`,
        `- **Evidence:** ${priority.evidence}`,
        `- **Action:** ${priority.action}`,
      ].join('\n')).join('\n\n');
    case 'Technical Findings':
      return [
        `- **Title tag:** ${seoContext.metadata.title || 'NOT_FOUND'}${seoContext.metadata.title ? ' - this gives search engines a clear page topic and should remain concise around the main rental/search value proposition.' : ' - add a descriptive title before relying on organic traffic.'}`,
        `- **Meta description:** ${describePresence(seoContext.metadata.description)}${seoContext.metadata.description ? ` - "${seoContext.metadata.description}"` : ' - write a benefit-led snippet for better search-result clarity.'}`,
        `- **Canonical and robots:** Canonical is ${seoContext.metadata.canonical || 'NOT_FOUND'}; robots is ${seoContext.metadata.robots || 'NOT_FOUND'}. This means indexability appears ${seoContext.technicalSignals.indexability}, but canonical consistency should be checked across crawled pages.`,
        `- **Heading structure:** Detected H1s: ${h1s}. Multiple or awkwardly concatenated H1s should be reviewed because they can blur the page's primary topic.`,
        `- **Missing structured fields:** ${missing}. Treat these as the first technical QA checklist before publishing SEO changes.`,
      ].join('\n');
    case 'Performance And Core Web Vitals':
      return pageSpeed.length
        ? [
          ...pageSpeed.map((item) => (
            `- **${item.strategy}:** ${item.available ? `Performance ${item.scores.performance ?? 'INSUFFICIENT_DATA'}, SEO ${item.scores.seo ?? 'INSUFFICIENT_DATA'}, Accessibility ${item.scores.accessibility ?? 'INSUFFICIENT_DATA'}, Best Practices ${item.scores.bestPractices ?? 'INSUFFICIENT_DATA'}. Lab LCP is ${item.labMetrics.largestContentfulPaint || 'INSUFFICIENT_DATA'}, FCP is ${item.labMetrics.firstContentfulPaint || 'INSUFFICIENT_DATA'}, and CLS is ${item.labMetrics.cumulativeLayoutShift || 'INSUFFICIENT_DATA'}. Source: ${item.sourceLabel}, fetched ${item.fetchedAt}, ${item.sourceUrl}.` : `INSUFFICIENT_DATA${item.error ? ` - ${item.error}` : ''}. Source: ${item.sourceLabel}, fetched ${item.fetchedAt}.`}`
          )),
          performanceOpportunities.length ? `- **Highest-impact opportunities:** ${performanceOpportunities.join('; ')}.` : '- **Highest-impact opportunities:** PageSpeed did not return specific opportunity titles in the structured payload.',
          diagnostics.length ? `- **Diagnostics to inspect:** ${diagnostics.join('; ')}.` : '- **Diagnostics to inspect:** No additional diagnostics were available in the structured payload.',
          crux?.available
            ? `- **Real-user CrUX evidence:** Chrome UX Report ${crux.scope} data shows Core Web Vitals assessment as ${crux.coreWebVitalsAssessment}. P75 LCP is ${crux.metrics.largestContentfulPaint.p75 ?? 'INSUFFICIENT_DATA'} ms, INP is ${crux.metrics.interactionToNextPaint.p75 ?? 'INSUFFICIENT_DATA'} ms, CLS is ${crux.metrics.cumulativeLayoutShift.p75 ?? 'INSUFFICIENT_DATA'}, and FCP is ${crux.metrics.firstContentfulPaint.p75 ?? 'INSUFFICIENT_DATA'} ms for the collection period ${crux.collectionPeriod.firstDate || 'unknown'} to ${crux.collectionPeriod.lastDate || 'unknown'}.`
            : `- **Real-user CrUX evidence:** INSUFFICIENT_DATA${crux?.error ? ` - ${crux.error}` : ''}.`,
        ].join('\n')
        : '- PageSpeed Insights data was unavailable for this run.';
    case 'Content And Intent':
      return [
        `- **Likely search intent:** Based on the title and headings, the page targets people looking for verified rentals and property owners who want to list or manage rental space. This creates a dual-intent homepage, so sections should clearly separate renter and property-owner journeys.`,
        `- **Heading evidence:** H1s include ${h1s}. H2s include ${h2s}. The topic coverage is useful, but the primary H1 should make the main organic landing-page intent unmistakable.`,
        `- **Content depth:** ${seoContext.contentSignals.wordCount} words were collected across ${seoContext.crawledPageCount} page${seoContext.crawledPageCount === 1 ? '' : 's'}. That is enough for a homepage-level audit, but deeper location, listing, and trust content may be needed for competitive rental keywords.`,
        `- **Linking:** ${seoContext.contentSignals.internalLinks} internal links and ${seoContext.contentSignals.externalLinks} external links were detected. Internal links should guide users toward listings, listing submission, trust/verification details, and high-value location pages.`,
      ].join('\n');
    case 'Social Preview Metadata':
      return [
        `- **Open Graph:** ${describePresence(seoContext.technicalSignals.hasOpenGraph)}. OG title is ${seoContext.metadata.ogTitle || 'NOT_FOUND'} and OG description is ${seoContext.metadata.ogDescription || 'NOT_FOUND'}.`,
        `- **Twitter card:** ${describePresence(seoContext.technicalSignals.hasTwitterCard)}. Twitter title is ${seoContext.metadata.twitterTitle || 'NOT_FOUND'} and Twitter description is ${seoContext.metadata.twitterDescription || 'NOT_FOUND'}.`,
        `- **Preview image:** ${seoContext.metadata.ogImage || 'NOT_FOUND'}. Use a clear branded image that communicates verified rentals or property-listing value, not just a generic logo.`,
        '- **Recommendation:** Keep social preview copy aligned with the search snippet so users see the same promise from Google, Facebook, LinkedIn, and messaging apps.',
      ].join('\n');
    case 'Developer Fix List':
      return [
        '- Reduce unused JavaScript and defer non-critical scripts flagged by PageSpeed before adding more analytics, widgets, or heavy UI effects.',
        '- Confirm each crawled page has a unique title, meta description, canonical URL, robots directive, Open Graph image, and Twitter card.',
        `- Add JSON-LD schema where appropriate: ${snapshot.schemaRecommendations.join(', ')}.`,
        '- Retest mobile and desktop PageSpeed after every performance fix and store the before/after result with the task history.',
      ].join('\n');
    case 'Marketing Next Steps':
      return [
        '- Rewrite or QA the primary H1 so it reads naturally and states the main rental-search value proposition.',
        '- Add a short trust/verification paragraph near the top of the page if it is not already visible in the rendered page.',
        '- Add internal links from the homepage to the most important listing, landlord, trust, and location pages.',
        '- Draft FAQ content that answers the highest-friction user questions and supports the recommended FAQPage schema when appropriate.',
        '- Create or improve supporting landing pages for the clearest commercial intents found in the page copy.',
      ].join('\n');
    case 'Evidence Sources':
      return snapshot.evidenceSources.map((source) => (
        `- **${source.label}:** ${source.source}${source.fetchedAt ? `, fetched ${source.fetchedAt}` : ''}. ${source.detail}`
      )).join('\n');
    default:
      return '- INSUFFICIENT_DATA';
  }
}

function normalizeSeoReport(summary: string, seoContext: ReturnType<typeof buildSeoWorkflowContext>, snapshot: SeoAuditSnapshot): string {
  const cleaned = summary
    .replace(/^#\s+.*$/gim, '')
    .replace(/^#+.*(Final Verdict|Conclusion|Verdict|Takeaways|Summary).*$/gim, '')
    .trim();
  const extractedSections = extractMarkdownSections(cleaned);

  return SEO_REPORT_SECTIONS.map((section) => {
    const body = getSectionBody(extractedSections, section) || fallbackSeoSection(section, seoContext, snapshot);
    return `## ${section}\n\n${body.trim()}`;
  }).join('\n\n');
}

function getDocumentUrl(doc: any, fallbackUrl: string): string {
  return (
    doc?.metadata?.sourceURL ||
    doc?.metadata?.sourceUrl ||
    doc?.metadata?.url ||
    doc?.url ||
    fallbackUrl
  );
}

function normalizePage(doc: any, fallbackUrl: string): SeoCollectedPage {
  return {
    url: getDocumentUrl(doc, fallbackUrl),
    metadata: doc?.metadata || {},
    markdown: doc?.markdown || '',
    links: Array.isArray(doc?.links) ? doc.links : [],
  };
}

async function scrapeSeoPage(app: FirecrawlApp, url: string): Promise<SeoCollectionResult> {
  const scrapeResponse = await app.scrape(url, {
    formats: ['markdown', 'links'],
    waitFor: 1000,
  }) as any;

  if (!scrapeResponse || (!scrapeResponse.markdown && !scrapeResponse.success)) {
    throw new Error(scrapeResponse?.error || 'Failed to extract page details');
  }

  return {
    operation: 'scrape',
    pages: [normalizePage(scrapeResponse, url)],
    limit: 1,
  };
}

async function collectSeoPages(app: FirecrawlApp, url: string, workflow: ResolvedWorkflow): Promise<SeoCollectionResult> {
  if (workflow.mode === 'quick') {
    return scrapeSeoPage(app, url);
  }

  const limit = workflow.mode === 'standard'
    ? 3
    : Math.max(10, workflow.budget.maxScrapes || 50);

  const crawlResponse = await app.crawl(url, {
    limit,
    maxDiscoveryDepth: workflow.mode === 'deep' ? 5 : 2,
    crawlEntireDomain: workflow.mode === 'deep',
    allowExternalLinks: false,
    scrapeOptions: {
      formats: ['markdown', 'links'],
      waitFor: 1000,
    },
    pollInterval: 2,
    timeout: workflow.mode === 'deep' ? 300 : 120,
  } as any) as any;

  const crawlPages = Array.isArray(crawlResponse?.data)
    ? crawlResponse.data.map((doc: any) => normalizePage(doc, url)).filter((page: SeoCollectedPage) => page.markdown || Object.keys(page.metadata).length > 0)
    : [];

  if (crawlPages.length > 0) {
    return {
      operation: 'crawl',
      pages: crawlPages.slice(0, limit),
      limit,
    };
  }

  console.warn(`[BACKGROUND] SEO crawl returned no page data for ${url}; falling back to single-page scrape.`);
  return scrapeSeoPage(app, url);
}

router.post('/seo', async (req: Request, res: Response) => {
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
      workflowId: 'seo-analyzer',
      requestedMode: mode,
    });
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'seo-analyzer',
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
          type: 'seo-analyzer',
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

        const app = new FirecrawlApp({ apiKey: firecrawlKey });

        console.log(`[BACKGROUND] Extracting SEO data for: ${safeUrl} (Task: ${taskId}) mode=${workflow.mode}`);

        const seoCollection = await collectSeoPages(app, safeUrl, workflow);
        const primaryPage = seoCollection.pages[0];
        const metadata = primaryPage?.metadata || {};
        const pageSpeed = await Promise.all([
          fetchPageSpeedInsights(safeUrl, 'mobile'),
          ...(workflow.mode === 'standard' || workflow.mode === 'deep' ? [fetchPageSpeedInsights(safeUrl, 'desktop')] : []),
        ]);
        const crux = workflow.mode === 'quick' ? null : await fetchCruxInsights(safeUrl);
        const seoContext = buildSeoWorkflowContext({
          url: safeUrl,
          metadata,
          markdown: primaryPage?.markdown || '',
          links: primaryPage?.links || [],
          pages: seoCollection.pages,
          pageSpeed,
          crux,
          budget: workflow.budget,
        });

        console.log(
          `[BACKGROUND] SEO context prepared (Task: ${taskId}) mode=${workflow.mode} ` +
          `firecrawl=${seoCollection.operation}:${seoCollection.pages.length}/${seoCollection.limit} ` +
          `wordCount=${seoContext.contentSignals.wordCount} ` +
          `markdownChars=${seoContext.contentSignals.selectedMarkdownExcerpt.length} ` +
          `pageSpeed=${pageSpeed.map((item) => `${item.strategy}:${item.available ? 'ok' : 'missing'}`).join(',')} ` +
          `crux=${crux?.available ? `${crux.scope}:ok` : 'missing'}`
        );

        const auditSnapshot = buildSeoAuditSnapshot(seoContext);
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
            payload: {
              ...seoContext,
              auditSnapshot,
            },
          });
        } catch (masErr: any) {
          console.error("MAS Service Critical Error:", masErr);
          if (taskId) {
            await supabase.from('tasks').update({ status: 'failed', result: { error: 'The AI agent service is currently unavailable. Please try again later.' } }).eq('id', taskId);
          }
          return;
        }

        const normalizedSummary = normalizeSeoReport(masResult.summary, seoContext, auditSnapshot);
        const resultData = {
          summary: normalizedSummary,
          metadata: metadata,
          seoContext,
          auditSnapshot,
          logoUrl: seoContext.brandAsset.logoUrl,
          ogImage: metadata.ogImage || metadata['og:image'] || metadata.image || null,
          title: `SEO Audit - ${seoContext.pageTitle}`,
          usage: {
            workflowId: workflow.id,
            mode: workflow.mode,
            modelPolicy: workflow.modelPolicy,
            firecrawlAccess: workflow.firecrawlAccess,
            tokens: masResult.tokens,
            adkToolCalls: masResult.toolCalls,
            backendFirecrawlCalls: 1,
            backendFirecrawlOperation: seoCollection.operation,
            pagesScraped: seoCollection.pages.length,
            pageLimit: seoCollection.limit,
            pageSpeedCalls: pageSpeed.length,
            cruxCalls: workflow.mode === 'quick' ? 0 : 1
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
    console.error('SEO Analysis Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize SEO analysis' });
  }
});

export default router;
