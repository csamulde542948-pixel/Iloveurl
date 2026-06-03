import type { NextFunction, Request, Response } from 'express';
import { supabase } from './supabase';

function bearerToken(req: Request): string | null {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function attachAuthUser(req: Request, _res: Response, next: NextFunction) {
  const token = bearerToken(req);
  if (!token) return next();

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      req.authUser = data.user;
      req.authUserId = data.user.id;
    }
  } catch (error) {
    console.warn('Could not verify Supabase auth token:', error);
  }

  return next();
}

export function resolveTrustedUserId(req: Request, claimedUserId?: string | null): string | null {
  const cleanClaim = typeof claimedUserId === 'string' && claimedUserId.trim() ? claimedUserId.trim() : null;
  if (req.authUserId) return req.authUserId;
  return cleanClaim;
}

export function rejectSpoofedUser(req: Request, res: Response, claimedUserId?: string | null): boolean {
  const cleanClaim = typeof claimedUserId === 'string' && claimedUserId.trim() ? claimedUserId.trim() : null;
  if (!cleanClaim) return false;

  if (!req.authUserId) {
    res.status(401).json({
      error: 'Sign in again before using this tool.',
      code: 'AUTH_REQUIRED',
    });
    return true;
  }

  if (cleanClaim !== req.authUserId) {
    res.status(403).json({
      error: 'This request is signed in as a different user.',
      code: 'USER_MISMATCH',
    });
    return true;
  }

  return false;
}
