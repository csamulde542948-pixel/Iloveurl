export type SocialPlatform = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

export type TranscriptSegment = {
  text: string;
  start?: number;
  duration?: number;
  timestamp?: string;
};

export type SocialTranscriptResult = {
  platform: SocialPlatform;
  sourceUrl: string;
  transcript: string;
  transcriptSegments: TranscriptSegment[];
  wordCount: number;
  segmentCount: number;
  raw: Record<string, any>;
};

const PLATFORM_HOST_PATTERNS: Array<{
  platform: SocialPlatform;
  matches: (hostname: string) => boolean;
}> = [
  {
    platform: 'youtube',
    matches: (hostname) =>
      hostname === 'youtube.com' ||
      hostname.endsWith('.youtube.com') ||
      hostname === 'youtu.be' ||
      hostname === 'youtube-nocookie.com' ||
      hostname.endsWith('.youtube-nocookie.com'),
  },
  {
    platform: 'facebook',
    matches: (hostname) =>
      hostname === 'facebook.com' ||
      hostname.endsWith('.facebook.com') ||
      hostname === 'fb.watch' ||
      hostname.endsWith('.fb.watch'),
  },
  {
    platform: 'instagram',
    matches: (hostname) =>
      hostname === 'instagram.com' ||
      hostname.endsWith('.instagram.com') ||
      hostname === 'instagr.am' ||
      hostname.endsWith('.instagr.am'),
  },
  {
    platform: 'tiktok',
    matches: (hostname) =>
      hostname === 'tiktok.com' ||
      hostname.endsWith('.tiktok.com') ||
      hostname === 'vm.tiktok.com' ||
      hostname === 'vt.tiktok.com',
  },
];

export function detectSocialPlatform(inputUrl: string): SocialPlatform | null {
  try {
    const parsedUrl = new URL(inputUrl);
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
    return PLATFORM_HOST_PATTERNS.find((entry) => entry.matches(hostname))?.platform || null;
  } catch {
    return null;
  }
}

function normalizeTranscriptSegments(value: unknown): TranscriptSegment[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((segment) => {
      if (!segment || typeof segment !== 'object') return null;
      const item = segment as Record<string, any>;
      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!text) return null;

      return {
        text,
        start: typeof item.start === 'number' ? item.start : undefined,
        duration: typeof item.duration === 'number' ? item.duration : undefined,
        timestamp: typeof item.timestamp === 'string' ? item.timestamp : undefined,
      };
    })
    .filter(Boolean) as TranscriptSegment[];
}

function estimateWordCount(transcript: string): number {
  return transcript.trim().split(/\s+/).filter(Boolean).length;
}

export async function fetchSocialTranscript(params: {
  url: string;
  platform: SocialPlatform;
  accessKey: string;
  cache?: boolean;
  cacheTtl?: number;
}): Promise<SocialTranscriptResult> {
  const baseUrl = (process.env.SOCIALKIT_API_URL || 'https://api.socialkit.dev').replace(/\/$/, '');
  const endpoint = new URL(`${baseUrl}/${params.platform}/transcript`);
  endpoint.searchParams.set('url', params.url);
  endpoint.searchParams.set('cache', String(params.cache ?? true));
  endpoint.searchParams.set('cache_ttl', String(params.cacheTtl ?? 2592000));

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'x-access-key': params.accessKey,
      'accept': 'application/json',
    },
  });

  const payload = await response.json().catch(() => ({})) as Record<string, any>;

  if (!response.ok || payload.success === false) {
    const message =
      payload.error ||
      payload.message ||
      `SocialKit transcript request failed with status ${response.status}`;
    throw new Error(message);
  }

  const data = (payload.data || payload) as Record<string, any>;
  const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';
  const transcriptSegments = normalizeTranscriptSegments(data.transcriptSegments);

  if (!transcript && transcriptSegments.length === 0) {
    throw new Error('No transcript was returned for this media URL.');
  }

  const normalizedTranscript = transcript || transcriptSegments.map((segment) => segment.text).join(' ').trim();

  return {
    platform: params.platform,
    sourceUrl: typeof data.url === 'string' ? data.url : params.url,
    transcript: normalizedTranscript,
    transcriptSegments,
    wordCount: typeof data.wordCount === 'number' ? data.wordCount : estimateWordCount(normalizedTranscript),
    segmentCount: typeof data.segments === 'number' ? data.segments : transcriptSegments.length,
    raw: data,
  };
}

