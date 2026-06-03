import { PageSpeedSummary } from '../../seo/pageSpeed';
import { CruxSummary } from '../../seo/crux';

type FirecrawlSeoContextInput = {
  url: string;
  metadata?: Record<string, any>;
  markdown?: string;
  links?: string[];
  pages?: SeoPageInput[];
  pageSpeed?: PageSpeedSummary[];
  crux?: CruxSummary | null;
  budget?: {
    maxInputChars?: number;
  };
};

type SeoPageInput = {
  url: string;
  metadata?: Record<string, any>;
  markdown?: string;
  links?: string[];
};

export type SeoWorkflowContext = {
  url: string;
  pageTitle: string;
  crawledPageCount: number;
  metadata: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    robots: string | null;
    language: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
  };
  technicalSignals: {
    indexability: 'indexable' | 'noindex' | 'unknown';
    hasCanonical: boolean;
    hasMetaDescription: boolean;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
  };
  contentSignals: {
    wordCount: number;
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
    };
    internalLinks: number;
    externalLinks: number;
    selectedMarkdownExcerpt: string;
  };
  crawledPages: Array<{
    url: string;
    title: string | null;
    description: string | null;
    canonical: string | null;
    wordCount: number;
    headings: {
      h1: string[];
      h2: string[];
    };
    selectedMarkdownExcerpt: string;
  }>;
  performanceSignals: {
    pageSpeed: PageSpeedSummary[];
    crux: CruxSummary | null;
    coreWebVitalsAvailable: boolean;
    realUserCoreWebVitalsAvailable: boolean;
  };
  brandAsset: {
    logoUrl: string | null;
    source: 'metadata' | 'not_detected';
  };
  sourceOfTruth: {
    technicalFacts: 'firecrawl_metadata';
    contentFacts: 'firecrawl_markdown';
    performanceFacts: 'pagespeed_insights';
    realUserPerformanceFacts: 'chrome_ux_report';
  };
  missingData: string[];
};

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const match = value.find((item) => typeof item === 'string' && item.trim());
      if (match) return match.trim();
    }
  }
  return null;
}

function extractHeadings(markdown: string, level: number, limit: number): string[] {
  const pattern = new RegExp(`^#{${level}}\\s+(.+)$`, 'gim');
  const headings: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown)) && headings.length < limit) {
    headings.push(match[1].replace(/\s+/g, ' ').trim());
  }

  return headings;
}

function countWords(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[#>*_`~\-\[\]().,!?:;]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1).length;
}

function summarizeLinks(url: string, links: string[] = []): { internalLinks: number; externalLinks: number } {
  let internalLinks = 0;
  let externalLinks = 0;

  try {
    const base = new URL(url);
    const uniqueLinks = [...new Set(links)];

    uniqueLinks.forEach((link) => {
      try {
        const parsed = new URL(link, url);
        if (parsed.hostname === base.hostname) internalLinks += 1;
        else externalLinks += 1;
      } catch {
        // Ignore malformed links from scraper output.
      }
    });
  } catch {
    return { internalLinks: 0, externalLinks: 0 };
  }

  return { internalLinks, externalLinks };
}

function getIndexability(robots: string | null): SeoWorkflowContext['technicalSignals']['indexability'] {
  if (!robots) return 'unknown';
  return /noindex/i.test(robots) ? 'noindex' : 'indexable';
}

function extractLogoUrl(metadata: Record<string, any>): string | null {
  return firstString(
    metadata.logo,
    metadata.logoUrl,
    metadata.brandLogo,
    metadata.favicon,
    metadata.icon,
    metadata.appleTouchIcon,
    metadata['apple-touch-icon'],
    metadata.ogImage,
    metadata['og:image'],
    metadata.image,
    metadata.twitterImage,
    metadata['twitter:image']
  );
}

function normalizePages(input: FirecrawlSeoContextInput): SeoPageInput[] {
  const pages = input.pages?.length
    ? input.pages
    : [{
      url: input.url,
      metadata: input.metadata,
      markdown: input.markdown,
      links: input.links,
    }];

  return pages.filter((page) => page.markdown || Object.keys(page.metadata || {}).length > 0);
}

export function buildSeoWorkflowContext(input: FirecrawlSeoContextInput): SeoWorkflowContext {
  const pages = normalizePages(input);
  const homepage = pages[0] || { url: input.url, metadata: input.metadata || {}, markdown: input.markdown || '', links: input.links || [] };
  const metadata = homepage.metadata || {};
  const maxInputChars = Math.max(3000, Math.min(input.budget?.maxInputChars || 8000, 40000));
  const pageTitle = firstString(metadata.title, metadata.ogTitle, metadata['og:title']) || new URL(input.url).hostname;
  const description = firstString(metadata.description, metadata.metaDescription, metadata.ogDescription, metadata['og:description']);
  const canonical = firstString(metadata.canonical, metadata.canonicalUrl, metadata.url);
  const robots = firstString(metadata.robots, metadata['robots']);
  const ogTitle = firstString(metadata.ogTitle, metadata['og:title']);
  const ogDescription = firstString(metadata.ogDescription, metadata['og:description']);
  const ogImage = firstString(metadata.ogImage, metadata['og:image'], metadata.image);
  const twitterTitle = firstString(metadata.twitterTitle, metadata['twitter:title']);
  const twitterDescription = firstString(metadata.twitterDescription, metadata['twitter:description']);
  const pageSpeed = input.pageSpeed || [];
  const crux = input.crux || null;
  const logoUrl = extractLogoUrl(metadata);

  const crawledPages = pages.map((page) => {
    const pageMetadata = page.metadata || {};
    const pageMarkdown = page.markdown || '';
    const excerptBudget = Math.max(1200, Math.floor(maxInputChars / Math.max(pages.length, 1)));

    return {
      url: page.url,
      title: firstString(pageMetadata.title, pageMetadata.ogTitle, pageMetadata['og:title']),
      description: firstString(pageMetadata.description, pageMetadata.metaDescription, pageMetadata.ogDescription, pageMetadata['og:description']),
      canonical: firstString(pageMetadata.canonical, pageMetadata.canonicalUrl, pageMetadata.url),
      wordCount: countWords(pageMarkdown),
      headings: {
        h1: extractHeadings(pageMarkdown, 1, 3),
        h2: extractHeadings(pageMarkdown, 2, 6),
      },
      selectedMarkdownExcerpt: pageMarkdown.substring(0, excerptBudget),
    };
  });

  const combinedMarkdown = crawledPages
    .map((page) => `URL: ${page.url}\nTitle: ${page.title || 'Untitled'}\n\n${page.selectedMarkdownExcerpt}`)
    .join('\n\n---\n\n')
    .substring(0, maxInputChars);

  const aggregateLinks = pages.flatMap((page) => page.links || []);
  const { internalLinks, externalLinks } = summarizeLinks(input.url, aggregateLinks);
  const aggregateMarkdown = pages.map((page) => page.markdown || '').join('\n');

  const missingData: string[] = [];
  if (!pageTitle) missingData.push('title');
  if (!description) missingData.push('metaDescription');
  if (!canonical) missingData.push('canonical');
  if (!robots) missingData.push('robots');
  if (!ogTitle && !ogDescription && !ogImage) missingData.push('openGraph');
  if (!twitterTitle && !twitterDescription) missingData.push('twitterCard');
  if (!pageSpeed.some((summary) => summary.available)) missingData.push('pageSpeedInsights');
  if (!crux?.available) missingData.push('chromeUxReport');

  return {
    url: input.url,
    pageTitle,
    crawledPageCount: crawledPages.length,
    metadata: {
      title: firstString(metadata.title),
      description,
      canonical,
      robots,
      language: firstString(metadata.language, metadata.lang),
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
    },
    technicalSignals: {
      indexability: getIndexability(robots),
      hasCanonical: Boolean(canonical),
      hasMetaDescription: Boolean(description),
      hasOpenGraph: Boolean(ogTitle || ogDescription || ogImage),
      hasTwitterCard: Boolean(twitterTitle || twitterDescription),
    },
    contentSignals: {
      wordCount: crawledPages.reduce((sum, page) => sum + page.wordCount, 0),
      headings: {
        h1: extractHeadings(aggregateMarkdown, 1, 8),
        h2: extractHeadings(aggregateMarkdown, 2, 16),
        h3: extractHeadings(aggregateMarkdown, 3, 16),
      },
      internalLinks,
      externalLinks,
      selectedMarkdownExcerpt: combinedMarkdown,
    },
    crawledPages,
    performanceSignals: {
      pageSpeed,
      crux,
      coreWebVitalsAvailable: pageSpeed.some((summary) => summary.fieldMetrics.source !== 'none') || Boolean(crux?.available),
      realUserCoreWebVitalsAvailable: Boolean(crux?.available),
    },
    brandAsset: {
      logoUrl,
      source: logoUrl ? 'metadata' : 'not_detected',
    },
    sourceOfTruth: {
      technicalFacts: 'firecrawl_metadata',
      contentFacts: 'firecrawl_markdown',
      performanceFacts: 'pagespeed_insights',
      realUserPerformanceFacts: 'chrome_ux_report',
    },
    missingData,
  };
}
