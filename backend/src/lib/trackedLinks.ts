import { Request } from 'express';
import { createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { supabase } from './supabase';

type LinkSource = 'short_link' | 'qr_code';

export function buildShortUrl(req: Request, slug: string) {
  const baseUrl = process.env.SHORT_URL_BASE || `${req.protocol}://${req.get('host')}/s`;
  return `${baseUrl.replace(/\/$/, '')}/${slug}`;
}

export async function createTrackedLink(input: {
  originalUrl: string;
  userId?: string | null;
  source: LinkSource;
  metadata?: Record<string, unknown>;
}) {
  const slug = nanoid(Number(process.env.SHORT_SLUG_LENGTH) || 6);
  const row = {
    slug,
    original_url: input.originalUrl,
    user_id: input.userId || null,
    source: input.source,
    metadata: input.metadata || {},
  };

  const { data, error } = await supabase.from('short_urls').insert([row]).select().single();
  if (!error && data) return { slug, data };

  // Backward-compatible fallback for older short_urls schemas.
  const fallback = await supabase
    .from('short_urls')
    .insert([{ slug, original_url: input.originalUrl, user_id: input.userId || null }])
    .select()
    .single();

  if (fallback.error) throw fallback.error;
  return { slug, data: fallback.data };
}

function detectDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  return 'Other';
}

function detectOs(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('linux')) return 'Linux';
  return 'Other';
}

function hashVisitor(ip: string, userAgent: string) {
  return createHash('sha256')
    .update(`${ip}|${userAgent}|${process.env.ANALYTICS_HASH_SALT || 'iloveurl'}`)
    .digest('hex');
}

export async function recordLinkEvent(req: Request, shortUrlId: string, slug: string) {
  const userAgent = req.get('user-agent') || '';
  const referrer = req.get('referer') || req.get('referrer') || null;
  const forwardedFor = req.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || req.ip || req.socket.remoteAddress || '';

  await supabase.from('short_url_click_events').insert([
    {
      short_url_id: shortUrlId,
      slug,
      referrer,
      user_agent: userAgent,
      visitor_hash: hashVisitor(ip, userAgent),
      device_type: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOs(userAgent),
    },
  ]);
}

export async function getLinkAnalytics(slug: string) {
  const { data: link, error: linkError } = await supabase
    .from('short_urls')
    .select('id, slug, original_url, clicks, created_at')
    .eq('slug', slug)
    .single();

  if (linkError || !link) {
    return { error: linkError || new Error('Short link not found'), analytics: null };
  }

  const { data: events, error: eventsError } = await supabase
    .from('short_url_click_events')
    .select('created_at, referrer, device_type, browser, os, visitor_hash')
    .eq('slug', slug)
    .order('created_at', { ascending: false })
    .limit(500);

  if (eventsError || !events) {
    return {
      error: null,
      analytics: {
        slug,
        originalUrl: link.original_url,
        totalClicks: link.clicks || 0,
        uniqueVisitors: null,
        referrers: [],
        devices: [],
        browsers: [],
        recentEvents: [],
        eventsAvailable: false,
      },
    };
  }

  const countBy = (key: 'referrer' | 'device_type' | 'browser' | 'os') => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const label = (event[key] || (key === 'referrer' ? 'Direct / unknown' : 'Other')) as string;
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
  };

  return {
    error: null,
    analytics: {
      slug,
      originalUrl: link.original_url,
      totalClicks: link.clicks || events.length,
      uniqueVisitors: new Set(events.map((event) => event.visitor_hash).filter(Boolean)).size,
      referrers: countBy('referrer').slice(0, 6),
      devices: countBy('device_type'),
      browsers: countBy('browser').slice(0, 5),
      operatingSystems: countBy('os').slice(0, 5),
      recentEvents: events.slice(0, 10),
      eventsAvailable: true,
    },
  };
}
