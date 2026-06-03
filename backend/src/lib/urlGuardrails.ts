import { Request, Response } from 'express';

const DEFAULT_BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
]);

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
];

export type UrlValidationResult =
  | { ok: true; url: string; parsed: URL }
  | { ok: false; error: string };

export function validatePublicHttpUrl(input: unknown, options: {
  fieldName?: string;
  allowedHostPatterns?: RegExp[];
  blockedHosts?: string[];
} = {}): UrlValidationResult {
  const fieldName = options.fieldName || 'URL';

  if (typeof input !== 'string' || !input.trim()) {
    return { ok: false, error: `${fieldName} is required.` };
  }

  const raw = input.trim();
  if (raw.length > 2048) {
    return { ok: false, error: `${fieldName} is too long.` };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: `${fieldName} must be a valid URL starting with http:// or https://.` };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: `${fieldName} must use http:// or https://.` };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: `${fieldName} cannot include embedded credentials.` };
  }

  const hostname = parsed.hostname.toLowerCase();
  const blockedHosts = new Set([...DEFAULT_BLOCKED_HOSTS, ...(options.blockedHosts || []).map((host) => host.toLowerCase())]);
  const allowPrivateUrls = process.env.ALLOW_PRIVATE_URLS === 'true';

  if (!allowPrivateUrls) {
    if (blockedHosts.has(hostname) || hostname.endsWith('.local')) {
      return { ok: false, error: `${fieldName} must be a public website URL.` };
    }

    if (PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(hostname))) {
      return { ok: false, error: `${fieldName} cannot point to a private network address.` };
    }

    if (hostname.startsWith('[') || hostname.includes(':')) {
      return { ok: false, error: `${fieldName} cannot use a private or local network address.` };
    }
  }

  if (options.allowedHostPatterns?.length) {
    const allowed = options.allowedHostPatterns.some((pattern) => pattern.test(hostname));
    if (!allowed) {
      return { ok: false, error: `${fieldName} is not supported for this tool.` };
    }
  }

  parsed.hash = '';
  return { ok: true, url: parsed.toString(), parsed };
}

export function sendUrlValidationError(
  res: Response,
  result: UrlValidationResult
): result is { ok: false; error: string } {
  if (result.ok) return false;
  res.status(400).json({ error: result.error });
  return true;
}

export function requestOrigin(req: Request) {
  return `${req.protocol}://${req.get('host')}`;
}
