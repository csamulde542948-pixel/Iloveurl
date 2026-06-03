type FirecrawlBrandContextInput = {
  url: string;
  metadata?: Record<string, any>;
  branding?: Record<string, any>;
  markdown?: string;
  screenshots?: string[];
  additionalPages?: Array<{
    url: string;
    title?: string;
    markdown?: string;
  }>;
  budget?: {
    maxInputChars?: number;
    maxScreenshots?: number;
  };
};

export type BrandWorkflowContext = {
  url: string;
  brandName: string;
  metadata: Record<string, any>;
  factQuality: {
    logoConfidence: 'detected' | 'not_detectable';
    colorConfidence: 'detected' | 'not_detectable';
    typographyConfidence: 'detected' | 'not_detectable';
    copyConfidence: 'detected' | 'thin';
    contextBudget: {
      markdownChars: number;
      screenshots: number;
    };
  };
  visualIdentity: {
    logoUrl: string | null;
    colors: string[];
    typography: string[];
    screenshots: string[];
  };
  messagingSignals: {
    heroCopy: string | null;
    ctas: string[];
    valuePropositions: string[];
    audienceSignals: string[];
    selectedMarkdownExcerpt: string;
    additionalPages: Array<{
      url: string;
      title?: string;
      selectedMarkdownExcerpt: string;
    }>;
  };
  sourceOfTruth: {
    visualFacts: 'firecrawl_branding';
    messagingFacts: 'firecrawl_markdown';
  };
  missingData: {
    missingVisualData: string[];
    missingMessagingData: string[];
    notDetectable: string[];
  };
};

const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const BRAND_NAME_SEPARATORS = [' | ', ' - ', ' · ', ' : ', ' – ', ' Â· ', ' â€“ '];

function uniqueStrings(values: unknown[], limit?: number): string[] {
  const strings = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
  const unique = [...new Set(strings)];
  return typeof limit === 'number' ? unique.slice(0, limit) : unique;
}

function extractCleanBrandName(url: string, title?: string, brandingName?: string): string {
  if (brandingName) return brandingName;
  if (!title) return new URL(url).hostname;

  for (const separator of BRAND_NAME_SEPARATORS) {
    if (title.includes(separator)) {
      const parts = title.split(separator).map((part) => part.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts[parts.length - 1].length <= parts[0].length ? parts[parts.length - 1] : parts[0];
      }
    }
  }

  return title;
}

function extractColors(colorsObj: any): string[] {
  if (!colorsObj) return [];

  const colors: unknown[] = [];
  if (colorsObj.primary) colors.push(colorsObj.primary);
  if (colorsObj.secondary) colors.push(colorsObj.secondary);
  if (colorsObj.accent) colors.push(colorsObj.accent);
  if (colorsObj.background) colors.push(colorsObj.background);
  if (Array.isArray(colorsObj.palette)) colors.push(...colorsObj.palette);

  return uniqueStrings(colors).filter((color) => HEX_COLOR_PATTERN.test(color));
}

function extractFonts(fonts: any, typography: any): string[] {
  const allFonts: unknown[] = [];
  const processFont = (font: any) => {
    if (typeof font === 'string') allFonts.push(font);
    else if (font && typeof font === 'object' && font.family) allFonts.push(font.family);
  };

  if (Array.isArray(fonts)) fonts.forEach(processFont);
  else if (fonts) processFont(fonts);
  if (typography && Array.isArray(typography.families)) typography.families.forEach(processFont);

  return uniqueStrings(allFonts, 5);
}

function stringLooksLikeImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('data:image/');
}

function extractStringUrl(value: any): string | null {
  if (typeof value === 'string' && stringLooksLikeImageUrl(value)) return value;
  if (!value || typeof value !== 'object') return null;

  for (const key of ['url', 'src', 'href']) {
    if (typeof value[key] === 'string' && stringLooksLikeImageUrl(value[key])) {
      return value[key];
    }
  }

  return null;
}

function extractLogoUrl(branding: any): string | null {
  const directCandidates = [
    branding?.images?.logo,
    branding?.logo,
    branding?.logos?.[0],
    branding?.assets?.logo,
    branding?.brand?.logo,
  ];

  for (const candidate of directCandidates) {
    const url = extractStringUrl(candidate);
    if (url) return url;
  }

  if (branding && typeof branding === 'object') {
    for (const [key, value] of Object.entries(branding)) {
      if (key.toLowerCase().includes('logo')) {
        const url = extractStringUrl(value);
        if (url) return url;
        if (Array.isArray(value)) {
          for (const item of value) {
            const nestedUrl = extractStringUrl(item);
            if (nestedUrl) return nestedUrl;
          }
        }
      }
    }
  }

  return null;
}

function extractMetadataBrandAsset(metadata: any): string | null {
  const candidates = [
    metadata?.logo,
    metadata?.favicon,
    metadata?.icon,
    metadata?.image,
    metadata?.ogImage,
    metadata?.['og:image'],
    metadata?.twitterImage,
    metadata?.['twitter:image'],
  ];

  for (const candidate of candidates) {
    const url = extractStringUrl(candidate);
    if (url) return url;
  }

  return null;
}

function extractMarkdownLines(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .filter((line) => line.length >= 3 && line.length <= 180);
}

function extractHeroCopy(markdown: string): string | null {
  const lines = extractMarkdownLines(markdown);
  return lines[0] || null;
}

function extractCtas(markdown: string): string[] {
  const ctaPattern = /\b(get started|start|try|sign up|book|schedule|contact|learn more|request|download|subscribe|join|buy|shop|discover)\b/i;
  return uniqueStrings(extractMarkdownLines(markdown).filter((line) => ctaPattern.test(line)), 5);
}

function extractValueProps(markdown: string): string[] {
  const signalPattern = /\b(save|grow|automate|simplify|faster|better|powerful|trusted|secure|scale|convert|create|manage|optimize|transform)\b/i;
  return uniqueStrings(extractMarkdownLines(markdown).filter((line) => signalPattern.test(line)), 5);
}

function extractAudienceSignals(markdown: string): string[] {
  const audiencePattern = /\b(for|teams|creators|marketers|developers|founders|students|businesses|agencies|professionals|companies)\b/i;
  return uniqueStrings(extractMarkdownLines(markdown).filter((line) => audiencePattern.test(line)), 5);
}

function buildMissingData(colors: string[], typography: string[], logoUrl: string | null, heroCopy: string | null, ctas: string[]): BrandWorkflowContext['missingData'] {
  const missingVisualData: string[] = [];
  const missingMessagingData: string[] = [];
  const notDetectable: string[] = [];

  if (!colors.length) missingVisualData.push('colors');
  if (!typography.length) missingVisualData.push('typography');
  if (!logoUrl) missingVisualData.push('logo');
  if (!heroCopy) missingMessagingData.push('heroCopy');
  if (!ctas.length) missingMessagingData.push('ctas');

  notDetectable.push(...missingVisualData, ...missingMessagingData);

  return { missingVisualData, missingMessagingData, notDetectable };
}

export function buildBrandWorkflowContext(input: FirecrawlBrandContextInput): BrandWorkflowContext {
  const metadata = input.metadata || {};
  const rawBranding = input.branding || {};
  const markdown = input.markdown || '';
  const additionalPages = input.additionalPages || [];
  const markdownCharBudget = Math.max(2000, Math.min(input.budget?.maxInputChars || 6000, 25000));
  const screenshots = (input.screenshots || []).filter(Boolean);
  const additionalPageBudget = Math.max(0, markdownCharBudget - 6000);
  const additionalPageExcerptBudget = additionalPages.length
    ? Math.max(1500, Math.floor(additionalPageBudget / additionalPages.length))
    : 0;
  const brandName = extractCleanBrandName(input.url, metadata.title, rawBranding.name);
  const logoUrl = extractLogoUrl(rawBranding) || extractMetadataBrandAsset(metadata);
  const colors = extractColors(rawBranding?.colors);
  const typography = extractFonts(rawBranding?.fonts, rawBranding?.typography);
  const heroCopy = extractHeroCopy(markdown);
  const ctas = extractCtas(markdown);
  const valuePropositions = extractValueProps(markdown);
  const audienceSignals = extractAudienceSignals(markdown);

  return {
    url: input.url,
    brandName,
    metadata,
    factQuality: {
      logoConfidence: logoUrl ? 'detected' : 'not_detectable',
      colorConfidence: colors.length ? 'detected' : 'not_detectable',
      typographyConfidence: typography.length ? 'detected' : 'not_detectable',
      copyConfidence: heroCopy || ctas.length || valuePropositions.length ? 'detected' : 'thin',
      contextBudget: {
        markdownChars: Math.min(markdown.length, markdownCharBudget),
        screenshots: screenshots.length,
      },
    },
    visualIdentity: {
      logoUrl,
      colors,
      typography,
      screenshots,
    },
    messagingSignals: {
      heroCopy,
      ctas,
      valuePropositions,
      audienceSignals,
      selectedMarkdownExcerpt: markdown.substring(0, markdownCharBudget),
      additionalPages: additionalPages.map((page) => ({
        url: page.url,
        title: page.title,
        selectedMarkdownExcerpt: (page.markdown || '').substring(0, additionalPageExcerptBudget),
      })),
    },
    sourceOfTruth: {
      visualFacts: 'firecrawl_branding',
      messagingFacts: 'firecrawl_markdown',
    },
    missingData: buildMissingData(colors, typography, logoUrl, heroCopy, ctas),
  };
}
