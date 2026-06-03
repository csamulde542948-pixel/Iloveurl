export function getFirecrawlApiKey(): string {
  return process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWLER_API_KEY || '';
}

export function hasAiServiceConfig(): boolean {
  return Boolean(process.env.AI_SERVICE_URL || process.env.AI_MODEL || process.env.AI_QUICK_MODEL);
}
