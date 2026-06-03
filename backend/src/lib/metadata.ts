import FirecrawlApp from '@mendable/firecrawl-js';
import { getFirecrawlApiKey } from './config';

export type UrlMetadata = {
  title: string;
  description: string;
  image: string;
  siteName: string;
  url: string;
  type: string;
  author: string;
  keywords: string;
  favicon: string;
  canonical: string;
  twitterCard: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  raw: Record<string, any>;
};

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const match = value.find((item) => typeof item === 'string' && item.trim());
      if (match) return match.trim();
    }
  }
  return '';
}

export function makeAbsoluteUrl(value: string, base: string): string {
  if (!value) return '';
  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
}

export function normalizeMetadata(metadata: Record<string, any>, sourceUrl: string): UrlMetadata {
  const hostname = new URL(sourceUrl).hostname;
  const image = makeAbsoluteUrl(firstString(metadata.image, metadata.ogImage, metadata['og:image'], metadata.twitterImage, metadata['twitter:image']), sourceUrl);
  const favicon = makeAbsoluteUrl(firstString(metadata.favicon, metadata.icon), sourceUrl) || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  const title = firstString(metadata.title, metadata.ogTitle, metadata['og:title'], metadata.twitterTitle, metadata['twitter:title']);
  const description = firstString(metadata.description, metadata.metaDescription, metadata.ogDescription, metadata['og:description'], metadata.twitterDescription, metadata['twitter:description']);

  return {
    title,
    description,
    image,
    siteName: firstString(metadata.siteName, metadata.ogSiteName, metadata['og:site_name'], hostname),
    url: firstString(metadata.ogUrl, metadata['og:url'], metadata.url) || sourceUrl,
    type: firstString(metadata.ogType, metadata['og:type']) || 'website',
    author: firstString(metadata.author, metadata.articleAuthor, metadata['article:author']),
    keywords: firstString(metadata.keywords),
    favicon,
    canonical: firstString(metadata.canonical, metadata.canonicalUrl),
    twitterCard: firstString(metadata.twitterCard, metadata['twitter:card']),
    ogTitle: firstString(metadata.ogTitle, metadata['og:title']),
    ogDescription: firstString(metadata.ogDescription, metadata['og:description']),
    ogImage: image,
    raw: metadata,
  };
}

export async function scrapeUrlMetadata(sourceUrl: string): Promise<UrlMetadata> {
  const apiKey = getFirecrawlApiKey();
  if (!apiKey) throw new Error('Firecrawl API key not configured');

  const app = new FirecrawlApp({ apiKey });
  const scrapeResponse = (await app.scrape(sourceUrl, {
    formats: ['markdown'],
  })) as any;

  if (!scrapeResponse || (!scrapeResponse.metadata && !scrapeResponse.success)) {
    throw new Error(scrapeResponse?.error || 'Failed to scrape URL');
  }

  return normalizeMetadata(scrapeResponse.metadata || {}, sourceUrl);
}
