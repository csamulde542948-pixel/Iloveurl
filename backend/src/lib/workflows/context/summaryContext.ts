type SummaryContextInput = {
  url: string;
  metadata?: Record<string, any>;
  markdown: string;
  budget?: {
    maxInputChars?: number;
  };
};

export type SummaryWorkflowContext = {
  url: string;
  title: string;
  sourceType: 'article' | 'documentation' | 'landing_page' | 'report' | 'job_post' | 'generic_webpage';
  metadata: {
    title: string | null;
    description: string | null;
    author: string | null;
    publishedTime: string | null;
    modifiedTime: string | null;
    siteName: string | null;
    language: string | null;
  };
  contentSignals: {
    wordCount: number;
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
    };
    keyLines: string[];
    selectedMarkdownExcerpt: string;
  };
  qualitySignals: {
    hasEnoughReadableContent: boolean;
    missingData: string[];
  };
  sourceOfTruth: {
    metadata: 'firecrawl_metadata';
    content: 'firecrawl_markdown';
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

function extractHeadings(markdown: string, level: number, limit: number): string[] {
  const pattern = new RegExp(`^#{${level}}\\s+(.+)$`, 'gim');
  const headings: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown)) && headings.length < limit) {
    headings.push(cleanMarkdownText(match[1]));
  }

  return headings;
}

function cleanMarkdownText(value: string): string {
  return value
    .replace(/\u200b/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[`*_~[\]()]/g, '')
    .replace(/\\#/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMarkdownLines(markdown: string): string[] {
  return markdown
    .split('\n')
    .map((line) => cleanMarkdownText(line.replace(/^[#>*\-\s]+/, '')))
    .filter((line) => line.length >= 45 && line.length <= 240);
}

function uniqueStrings(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }

  return result;
}

function isJunkLine(line: string, title: string): boolean {
  const normalized = line.toLowerCase().trim();
  const normalizedTitle = title.toLowerCase().trim();

  if (!normalized) return true;
  if (normalized === normalizedTitle) return true;
  if (/^(skip to main content|main content|content area|more for you|advertisement|recommended|read more|related|share this|sign up|subscribe|latest stories|also read|contact us|about us|privacy|terms)$/i.test(line)) return true;
  if (/fetch the complete documentation index|llms\.txt|discover all available pages/i.test(line)) return true;
  if (/^(\[?\s*)?[\u200b\s]*(architecture|patterns|integrations|overview|quickstart)(\s*\]?)?$/i.test(line)) return true;
  if (/^from\s+\w+(\.\w+)+\s+import\s+/i.test(line)) return true;
  if (/^(image|video|photo|copyright|all rights reserved)\b/i.test(line)) return true;
  if (/cookies?|privacy policy|terms of use|editorial team|formal reports|queries if they are justified|cover sensible issues|principles of neutrality|remove any contents|report about any issues|dedicated editorial|fact[-\s]?check policy|correction policy|disclaimer/i.test(line)) return true;
  if (/^(follow us|share|facebook|twitter|linkedin|instagram|pinterest|whatsapp|telegram)$/i.test(line)) return true;
  return false;
}

function cleanHeadingList(headings: string[], title: string, limit: number): string[] {
  return uniqueStrings(headings.filter((heading) => !isJunkLine(heading, title)), limit);
}

function buildCleanExcerpt(markdown: string, title: string, maxInputChars: number): string {
  const cleanedLines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !isJunkLine(cleanMarkdownText(line.replace(/^[#>*\-\s]+/, '')), title));

  const excerpt = cleanedLines.join('\n').substring(0, maxInputChars);
  return excerpt || markdown.substring(0, maxInputChars);
}

function countWords(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[#>*_`~\-\[\]().,!?:;]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1).length;
}

function inferSourceType(markdown: string, metadata: Record<string, any>): SummaryWorkflowContext['sourceType'] {
  const text = [
    metadata.title,
    metadata.description,
    metadata.ogType,
    metadata['og:type'],
    markdown.substring(0, 3000),
  ].filter(Boolean).join(' ').toLowerCase();

  const explicitOgType = String(metadata.ogType || metadata['og:type'] || '').toLowerCase();
  if (/article|blog|news/.test(explicitOgType)) return 'article';
  if (/job posting|job post|job opening|apply now|responsibilities include|required qualifications|preferred qualifications|salary range|employment type|full[-\s]?time|part[-\s]?time/.test(text)) return 'job_post';
  if (/docs|documentation|api reference|quickstart|installation|guide/.test(text)) return 'documentation';
  if (/whitepaper|report|study|survey|findings|research/.test(text)) return 'report';
  if (/article|blog|published|author|newsletter|opinion|biography|born|known for/.test(text)) return 'article';
  if (/pricing|features|customers|cta|get started|sign up|book a demo/.test(text)) return 'landing_page';
  return 'generic_webpage';
}

export function buildSummaryWorkflowContext(input: SummaryContextInput): SummaryWorkflowContext {
  const metadata = input.metadata || {};
  const markdown = input.markdown || '';
  const maxInputChars = Math.max(3000, Math.min(input.budget?.maxInputChars || 12000, 30000));
  const title = firstString(metadata.title, metadata.ogTitle, metadata['og:title']) || new URL(input.url).hostname;
  const description = firstString(metadata.description, metadata.metaDescription, metadata.ogDescription, metadata['og:description']);
  const author = firstString(metadata.author, metadata.articleAuthor, metadata['article:author']);
  const publishedTime = firstString(metadata.publishedTime, metadata.articlePublishedTime, metadata['article:published_time'], metadata.date);
  const modifiedTime = firstString(metadata.modifiedTime, metadata.articleModifiedTime, metadata['article:modified_time']);
  const wordCount = countWords(markdown);
  const keyLines = uniqueStrings(
    extractMarkdownLines(markdown).filter((line) => !isJunkLine(line, title)),
    10
  );

  const missingData: string[] = [];
  if (!title) missingData.push('title');
  if (!description) missingData.push('description');
  if (!author) missingData.push('author');
  if (!publishedTime) missingData.push('publishedTime');
  if (wordCount < 100) missingData.push('readableContent');

  return {
    url: input.url,
    title,
    sourceType: inferSourceType(markdown, metadata),
    metadata: {
      title: firstString(metadata.title),
      description,
      author,
      publishedTime,
      modifiedTime,
      siteName: firstString(metadata.siteName, metadata.ogSiteName, metadata['og:site_name']),
      language: firstString(metadata.language, metadata.lang),
    },
    contentSignals: {
      wordCount,
      headings: {
        h1: cleanHeadingList(extractHeadings(markdown, 1, 12), title, 6),
        h2: cleanHeadingList(extractHeadings(markdown, 2, 18), title, 12),
        h3: cleanHeadingList(extractHeadings(markdown, 3, 18), title, 12),
      },
      keyLines,
      selectedMarkdownExcerpt: buildCleanExcerpt(markdown, title, maxInputChars),
    },
    qualitySignals: {
      hasEnoughReadableContent: wordCount >= 100,
      missingData,
    },
    sourceOfTruth: {
      metadata: 'firecrawl_metadata',
      content: 'firecrawl_markdown',
    },
  };
}
