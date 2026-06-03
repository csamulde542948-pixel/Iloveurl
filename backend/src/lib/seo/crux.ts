export type CruxScope = 'url' | 'origin';

export type CruxMetricSummary = {
  p75: number | null;
  unit: 'ms' | 'score';
  rating: 'good' | 'needs_improvement' | 'poor' | 'insufficient_data';
  goodPercent: number | null;
  needsImprovementPercent: number | null;
  poorPercent: number | null;
};

export type CruxSummary = {
  source: 'chrome_ux_report';
  sourceLabel: 'Chrome UX Report';
  sourceUrl: string;
  requestedUrl: string;
  normalizedOrigin: string | null;
  fetchedAt: string;
  available: boolean;
  scope: CruxScope;
  collectionPeriod: {
    firstDate: string | null;
    lastDate: string | null;
  };
  metrics: {
    largestContentfulPaint: CruxMetricSummary;
    cumulativeLayoutShift: CruxMetricSummary;
    interactionToNextPaint: CruxMetricSummary;
    firstContentfulPaint: CruxMetricSummary;
  };
  coreWebVitalsAssessment: 'pass' | 'needs_work' | 'insufficient_data';
  error?: string;
};

const CRUX_API = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

function cruxApiKey(): string | undefined {
  return process.env.CRUX_API_KEY || process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;
}

function originFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return null;
  }
}

function evidenceUrl(url: string): string {
  return `https://developer.chrome.com/docs/crux?utm_source=iloveurl#chrome-ux-report`;
}

function emptyMetric(unit: 'ms' | 'score' = 'ms'): CruxMetricSummary {
  return {
    p75: null,
    unit,
    rating: 'insufficient_data',
    goodPercent: null,
    needsImprovementPercent: null,
    poorPercent: null,
  };
}

function dateToString(value: any): string | null {
  if (!value || typeof value !== 'object') return null;
  const year = value.year;
  const month = value.month;
  const day = value.day;
  if (!year || !month || !day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function histogramDensity(metric: any, index: number): number | null {
  const density = metric?.histogram?.[index]?.density;
  return typeof density === 'number' ? Math.round(density * 1000) / 10 : null;
}

function rateMetric(metricId: string, p75: number | null): CruxMetricSummary['rating'] {
  if (typeof p75 !== 'number') return 'insufficient_data';

  if (metricId === 'largest_contentful_paint') {
    if (p75 <= 2500) return 'good';
    if (p75 <= 4000) return 'needs_improvement';
    return 'poor';
  }

  if (metricId === 'interaction_to_next_paint') {
    if (p75 <= 200) return 'good';
    if (p75 <= 500) return 'needs_improvement';
    return 'poor';
  }

  if (metricId === 'cumulative_layout_shift') {
    if (p75 <= 0.1) return 'good';
    if (p75 <= 0.25) return 'needs_improvement';
    return 'poor';
  }

  if (metricId === 'first_contentful_paint') {
    if (p75 <= 1800) return 'good';
    if (p75 <= 3000) return 'needs_improvement';
    return 'poor';
  }

  return 'insufficient_data';
}

function metricSummary(metrics: any, metricId: string, unit: 'ms' | 'score' = 'ms'): CruxMetricSummary {
  const metric = metrics?.[metricId];
  const p75 = typeof metric?.percentiles?.p75 === 'number' ? metric.percentiles.p75 : null;

  return {
    p75,
    unit,
    rating: rateMetric(metricId, p75),
    goodPercent: histogramDensity(metric, 0),
    needsImprovementPercent: histogramDensity(metric, 1),
    poorPercent: histogramDensity(metric, 2),
  };
}

function assessCoreWebVitals(metrics: CruxSummary['metrics']): CruxSummary['coreWebVitalsAssessment'] {
  const coreRatings = [
    metrics.largestContentfulPaint.rating,
    metrics.cumulativeLayoutShift.rating,
    metrics.interactionToNextPaint.rating,
  ];

  if (coreRatings.some((rating) => rating === 'insufficient_data')) return 'insufficient_data';
  return coreRatings.every((rating) => rating === 'good') ? 'pass' : 'needs_work';
}

function emptyCruxSummary(url: string, scope: CruxScope, error?: string): CruxSummary {
  return {
    source: 'chrome_ux_report',
    sourceLabel: 'Chrome UX Report',
    sourceUrl: evidenceUrl(url),
    requestedUrl: url,
    normalizedOrigin: originFromUrl(url),
    fetchedAt: new Date().toISOString(),
    available: false,
    scope,
    collectionPeriod: {
      firstDate: null,
      lastDate: null,
    },
    metrics: {
      largestContentfulPaint: emptyMetric('ms'),
      cumulativeLayoutShift: emptyMetric('score'),
      interactionToNextPaint: emptyMetric('ms'),
      firstContentfulPaint: emptyMetric('ms'),
    },
    coreWebVitalsAssessment: 'insufficient_data',
    error,
  };
}

async function queryCrux(url: string, scope: CruxScope, timeoutMs = 30000): Promise<CruxSummary> {
  const key = cruxApiKey();
  if (!key) return emptyCruxSummary(url, scope, 'CRUX_API_KEY or PAGESPEED_API_KEY is not configured');

  const origin = originFromUrl(url);
  const body = scope === 'url'
    ? { url }
    : origin ? { origin } : { url };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${CRUX_API}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return emptyCruxSummary(url, scope, `CrUX failed: ${response.status} ${response.statusText}`);
    }

    const json = await response.json() as any;
    const metrics = {
      largestContentfulPaint: metricSummary(json.record?.metrics, 'largest_contentful_paint', 'ms'),
      cumulativeLayoutShift: metricSummary(json.record?.metrics, 'cumulative_layout_shift', 'score'),
      interactionToNextPaint: metricSummary(json.record?.metrics, 'interaction_to_next_paint', 'ms'),
      firstContentfulPaint: metricSummary(json.record?.metrics, 'first_contentful_paint', 'ms'),
    };

    return {
      source: 'chrome_ux_report',
      sourceLabel: 'Chrome UX Report',
      sourceUrl: evidenceUrl(url),
      requestedUrl: url,
      normalizedOrigin: origin,
      fetchedAt: new Date().toISOString(),
      available: true,
      scope,
      collectionPeriod: {
        firstDate: dateToString(json.record?.collectionPeriod?.firstDate),
        lastDate: dateToString(json.record?.collectionPeriod?.lastDate),
      },
      metrics,
      coreWebVitalsAssessment: assessCoreWebVitals(metrics),
    };
  } catch (error: any) {
    return emptyCruxSummary(url, scope, error?.name === 'AbortError' ? 'CrUX request timed out' : error?.message || 'CrUX request failed');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCruxInsights(url: string): Promise<CruxSummary> {
  const urlResult = await queryCrux(url, 'url');
  if (urlResult.available) return urlResult;

  const origin = originFromUrl(url);
  if (!origin) return urlResult;

  const originResult = await queryCrux(url, 'origin');
  return originResult.available ? originResult : urlResult;
}
