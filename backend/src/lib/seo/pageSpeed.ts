export type PageSpeedStrategy = 'mobile' | 'desktop';

export type PageSpeedSummary = {
  strategy: PageSpeedStrategy;
  source: 'pagespeed_insights';
  sourceLabel: 'Google PageSpeed Insights';
  sourceUrl: string;
  requestedUrl: string;
  fetchedAt: string;
  available: boolean;
  scores: {
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
  };
  labMetrics: {
    firstContentfulPaint: string | null;
    largestContentfulPaint: string | null;
    totalBlockingTime: string | null;
    cumulativeLayoutShift: string | null;
    speedIndex: string | null;
  };
  fieldMetrics: {
    source: 'url' | 'origin' | 'none';
    largestContentfulPaint: string | null;
    cumulativeLayoutShift: string | null;
    interactionToNextPaint: string | null;
    firstContentfulPaint: string | null;
  };
  opportunities: string[];
  diagnostics: string[];
  error?: string;
};

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function scoreToPercent(score: unknown): number | null {
  return typeof score === 'number' ? Math.round(score * 100) : null;
}

function displayValue(audits: any, auditId: string): string | null {
  const value = audits?.[auditId]?.displayValue;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function fieldMetricValue(experience: any, metricId: string): string | null {
  const metric = experience?.metrics?.[metricId];
  if (!metric) return null;
  if (typeof metric.percentile === 'number') return String(metric.percentile);
  return null;
}

function collectAuditTitles(audits: any, type: 'opportunity' | 'diagnostic', limit = 6): string[] {
  if (!audits || typeof audits !== 'object') return [];

  return Object.values(audits)
    .filter((audit: any) => audit?.details?.type === type && typeof audit.title === 'string')
    .filter((audit: any) => typeof audit.score !== 'number' || audit.score < 0.9)
    .map((audit: any) => audit.title.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function buildPageSpeedUrl(url: string, strategy: PageSpeedStrategy): string {
  const params = new URLSearchParams({
    url,
    strategy,
    category: 'performance',
  });

  params.append('category', 'seo');
  params.append('category', 'accessibility');
  params.append('category', 'best-practices');

  const key = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;
  if (key) params.set('key', key);

  return `${PAGESPEED_API}?${params.toString()}`;
}

function buildPageSpeedEvidenceUrl(url: string): string {
  return `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}`;
}

export async function fetchPageSpeedInsights(
  url: string,
  strategy: PageSpeedStrategy = 'mobile',
  timeoutMs = 45000
): Promise<PageSpeedSummary> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildPageSpeedUrl(url, strategy), {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return emptyPageSpeedSummary(strategy, url, `PageSpeed failed: ${response.status} ${response.statusText}`);
    }

    const json = await response.json() as any;
    const audits = json.lighthouseResult?.audits || {};
    const categories = json.lighthouseResult?.categories || {};
    const urlExperience = json.loadingExperience;
    const originExperience = json.originLoadingExperience;
    const fieldSource = urlExperience?.metrics ? 'url' : originExperience?.metrics ? 'origin' : 'none';
    const fieldExperience = fieldSource === 'url' ? urlExperience : fieldSource === 'origin' ? originExperience : null;

    return {
      strategy,
      source: 'pagespeed_insights',
      sourceLabel: 'Google PageSpeed Insights',
      sourceUrl: buildPageSpeedEvidenceUrl(url),
      requestedUrl: url,
      fetchedAt: new Date().toISOString(),
      available: true,
      scores: {
        performance: scoreToPercent(categories.performance?.score),
        seo: scoreToPercent(categories.seo?.score),
        accessibility: scoreToPercent(categories.accessibility?.score),
        bestPractices: scoreToPercent(categories['best-practices']?.score),
      },
      labMetrics: {
        firstContentfulPaint: displayValue(audits, 'first-contentful-paint'),
        largestContentfulPaint: displayValue(audits, 'largest-contentful-paint'),
        totalBlockingTime: displayValue(audits, 'total-blocking-time'),
        cumulativeLayoutShift: displayValue(audits, 'cumulative-layout-shift'),
        speedIndex: displayValue(audits, 'speed-index'),
      },
      fieldMetrics: {
        source: fieldSource,
        largestContentfulPaint: fieldMetricValue(fieldExperience, 'LARGEST_CONTENTFUL_PAINT_MS'),
        cumulativeLayoutShift: fieldMetricValue(fieldExperience, 'CUMULATIVE_LAYOUT_SHIFT_SCORE'),
        interactionToNextPaint: fieldMetricValue(fieldExperience, 'INTERACTION_TO_NEXT_PAINT'),
        firstContentfulPaint: fieldMetricValue(fieldExperience, 'FIRST_CONTENTFUL_PAINT_MS'),
      },
      opportunities: collectAuditTitles(audits, 'opportunity'),
      diagnostics: collectAuditTitles(audits, 'diagnostic'),
    };
  } catch (error: any) {
    return emptyPageSpeedSummary(strategy, url, error?.name === 'AbortError' ? 'PageSpeed request timed out' : error?.message || 'PageSpeed request failed');
  } finally {
    clearTimeout(timeout);
  }
}

export function emptyPageSpeedSummary(strategy: PageSpeedStrategy, url = '', error?: string): PageSpeedSummary {
  return {
    strategy,
    source: 'pagespeed_insights',
    sourceLabel: 'Google PageSpeed Insights',
    sourceUrl: url ? buildPageSpeedEvidenceUrl(url) : 'https://pagespeed.web.dev/',
    requestedUrl: url,
    fetchedAt: new Date().toISOString(),
    available: false,
    scores: {
      performance: null,
      seo: null,
      accessibility: null,
      bestPractices: null,
    },
    labMetrics: {
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      totalBlockingTime: null,
      cumulativeLayoutShift: null,
      speedIndex: null,
    },
    fieldMetrics: {
      source: 'none',
      largestContentfulPaint: null,
      cumulativeLayoutShift: null,
      interactionToNextPaint: null,
      firstContentfulPaint: null,
    },
    opportunities: [],
    diagnostics: [],
    error,
  };
}
