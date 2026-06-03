type PresentationContextInput = {
  url: string;
  metadata?: Record<string, any>;
  markdown: string;
  screenshot?: string | null;
  budget?: {
    maxInputChars?: number;
  };
};

export type PresentationWorkflowContext = {
  url: string;
  title: string;
  sourceType: 'article' | 'documentation' | 'landing_page' | 'report' | 'generic_webpage';
  audience: 'founder' | 'marketer' | 'developer' | 'general';
  suggestedTheme: 'Founder Brief' | 'Research Brief' | 'Training Deck' | 'Product Pitch' | 'Minimal Report';
  metadata: {
    title: string | null;
    description: string | null;
    siteName: string | null;
    image: string | null;
    screenshot: string | null;
  };
  contentSignals: {
    wordCount: number;
    headings: string[];
    keyLines: string[];
    selectedMarkdownExcerpt: string;
  };
  visualInputs: {
    availableSourceImages: string[];
    sourceScreenshot: string | null;
    visualPriority: string[];
  };
  deckConstraints: {
    targetSlides: number;
    maxBulletsPerSlide: number;
    requireSpeakerNotes: boolean;
    requireVisualDirection: boolean;
  };
  sourceOfTruth: {
    metadata: 'firecrawl_metadata';
    content: 'firecrawl_markdown';
    visuals: 'firecrawl_metadata_or_screenshot';
  };
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

function cleanMarkdownText(value: string): string {
  return value
    .replace(/\u200b/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[`*_~[\]()]/g, '')
    .replace(/\\#/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

function isJunkLine(line: string, title: string): boolean {
  const normalized = line.toLowerCase().trim();
  if (!normalized) return true;
  if (normalized === title.toLowerCase().trim()) return true;
  if (/^(skip to main content|main content|more for you|advertisement|recommended|read more|related|share this|sign up|subscribe|latest stories|contact us|about us|privacy|terms)$/i.test(line)) return true;
  if (/cookies?|privacy policy|terms of use|editorial policy|correction policy|disclaimer|all rights reserved|follow us|newsletter/i.test(line)) return true;
  if (/fetch the complete documentation index|llms\.txt|discover all available pages/i.test(line)) return true;
  return false;
}

function extractHeadings(markdown: string, title: string): string[] {
  const headings: string[] = [];
  const pattern = /^#{1,3}\s+(.+)$/gim;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown)) && headings.length < 14) {
    const heading = cleanMarkdownText(match[1]);
    if (!isJunkLine(heading, title) && !headings.some((item) => item.toLowerCase() === heading.toLowerCase())) {
      headings.push(heading);
    }
  }

  return headings;
}

function extractKeyLines(markdown: string, title: string): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];

  markdown
    .split('\n')
    .map((line) => cleanMarkdownText(line.replace(/^[#>*\-\s]+/, '')))
    .filter((line) => line.length >= 45 && line.length <= 260)
    .filter((line) => !isJunkLine(line, title))
    .forEach((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      lines.push(line);
    });

  return lines.slice(0, 18);
}

function countWords(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[#>*_`~\-\[\]().,!?:;]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1).length;
}

function buildCleanExcerpt(markdown: string, title: string, maxInputChars: number): string {
  const cleanedLines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isJunkLine(cleanMarkdownText(line.replace(/^[#>*\-\s]+/, '')), title));

  const excerpt = cleanedLines.join('\n').substring(0, maxInputChars);
  return excerpt || markdown.substring(0, maxInputChars);
}

function inferSourceType(markdown: string, metadata: Record<string, any>): PresentationWorkflowContext['sourceType'] {
  const text = [
    metadata.title,
    metadata.description,
    metadata.ogType,
    metadata['og:type'],
    markdown.substring(0, 3000),
  ].filter(Boolean).join(' ').toLowerCase();

  const explicitOgType = String(metadata.ogType || metadata['og:type'] || '').toLowerCase();
  if (/article|blog|news/.test(explicitOgType)) return 'article';
  if (/docs|documentation|api reference|quickstart|installation|guide/.test(text)) return 'documentation';
  if (/whitepaper|report|study|survey|findings|research/.test(text)) return 'report';
  if (/pricing|features|customers|cta|get started|sign up|book a demo|product|platform/.test(text)) return 'landing_page';
  return 'generic_webpage';
}

function inferAudience(sourceType: PresentationWorkflowContext['sourceType'], markdown: string): PresentationWorkflowContext['audience'] {
  const text = markdown.substring(0, 4000).toLowerCase();
  if (sourceType === 'documentation' || /api|sdk|developer|code|integration/.test(text)) return 'developer';
  if (/seo|marketing|campaign|growth|brand|content|audience|conversion/.test(text)) return 'marketer';
  if (/pricing|market|revenue|startup|founder|strategy|investor|business/.test(text)) return 'founder';
  return 'general';
}

function inferTheme(sourceType: PresentationWorkflowContext['sourceType'], audience: PresentationWorkflowContext['audience']): PresentationWorkflowContext['suggestedTheme'] {
  if (sourceType === 'documentation' || audience === 'developer') return 'Training Deck';
  if (sourceType === 'report') return 'Research Brief';
  if (sourceType === 'landing_page' || audience === 'founder') return 'Product Pitch';
  if (sourceType === 'article') return 'Founder Brief';
  return 'Minimal Report';
}

function metadataImage(metadata: Record<string, any>): string | null {
  return firstString(
    metadata.ogImage,
    metadata['og:image'],
    metadata.twitterImage,
    metadata['twitter:image'],
    metadata.image,
    metadata.imageUrl
  );
}

export function buildPresentationWorkflowContext(input: PresentationContextInput): PresentationWorkflowContext {
  const metadata = input.metadata || {};
  const markdown = input.markdown || '';
  const maxInputChars = Math.max(4000, Math.min(input.budget?.maxInputChars || 14000, 32000));
  const title = firstString(metadata.title, metadata.ogTitle, metadata['og:title']) || new URL(input.url).hostname;
  const sourceType = inferSourceType(markdown, metadata);
  const audience = inferAudience(sourceType, markdown);
  const suggestedTheme = inferTheme(sourceType, audience);
  const image = metadataImage(metadata);
  const screenshot = input.screenshot || null;

  return {
    url: input.url,
    title,
    sourceType,
    audience,
    suggestedTheme,
    metadata: {
      title: firstString(metadata.title),
      description: firstString(metadata.description, metadata.metaDescription, metadata.ogDescription, metadata['og:description']),
      siteName: firstString(metadata.siteName, metadata.ogSiteName, metadata['og:site_name']),
      image,
      screenshot,
    },
    contentSignals: {
      wordCount: countWords(markdown),
      headings: extractHeadings(markdown, title),
      keyLines: extractKeyLines(markdown, title),
      selectedMarkdownExcerpt: buildCleanExcerpt(markdown, title, maxInputChars),
    },
    visualInputs: {
      availableSourceImages: [image].filter(Boolean) as string[],
      sourceScreenshot: screenshot,
      visualPriority: [
        'Use source/OG image or page screenshot when relevant.',
        'Use charts, diagrams, and comparison layouts for extracted facts.',
        'Use licensed stock imagery only in future image-enabled versions.',
        'Never imply external stock images came from the source URL.',
      ],
    },
    deckConstraints: {
      targetSlides: sourceType === 'documentation' ? 8 : 7,
      maxBulletsPerSlide: 4,
      requireSpeakerNotes: true,
      requireVisualDirection: true,
    },
    sourceOfTruth: {
      metadata: 'firecrawl_metadata',
      content: 'firecrawl_markdown',
      visuals: 'firecrawl_metadata_or_screenshot',
    },
  };
}
