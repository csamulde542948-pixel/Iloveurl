import type { Request, Response } from 'express';
import { supabase } from './supabase';
import { rejectSpoofedUser, resolveTrustedUserId } from './authGuard';

type Mode = 'quick' | 'standard' | 'deep';

type CreditPolicy = {
  label: string;
  requiresAuth: boolean;
  allowGuest: boolean;
  requiresPaidPlan?: boolean;
  requiredPlans?: string[];
  costs: Partial<Record<Mode, number>> & { default: number };
};

type CreditTopUpPack = {
  key: string;
  label: string;
  credits: number;
  priceCents: number;
  checkoutUrl: string;
};

const PAID_PLAN_KEYS = new Set(['starter', 'pro', 'pro-plus']);

const CREDIT_POLICIES: Record<string, CreditPolicy> = {
  'url-cleaner': { label: 'URL Cleaner', requiresAuth: false, allowGuest: true, costs: { default: 0 } },
  'utm-manager': { label: 'UTM Manager', requiresAuth: false, allowGuest: true, costs: { default: 0 } },
  'meta-tags': { label: 'Meta Tags', requiresAuth: false, allowGuest: true, costs: { default: 0 } },
  'link-preview': { label: 'Link Preview', requiresAuth: false, allowGuest: true, costs: { default: 0 } },

  'url-shortener': { label: 'URL Shortener', requiresAuth: false, allowGuest: true, costs: { default: 0 } },
  'qr-code': { label: 'QR Code', requiresAuth: false, allowGuest: true, costs: { default: 0 } },
  'podcast-script': {
    label: 'URL to Transcribe',
    requiresAuth: true,
    allowGuest: false,
    requiresPaidPlan: true,
    requiredPlans: ['starter', 'pro', 'pro-plus'],
    costs: { default: 20 },
  },

  'article-summary': { label: 'URL Summarizer', requiresAuth: true, allowGuest: false, costs: { quick: 4, standard: 6, deep: 12, default: 6 } },
  'study-notes': { label: 'Study Notes', requiresAuth: true, allowGuest: false, costs: { quick: 6, standard: 8, deep: 16, default: 8 } },
  'brand-analyzer': { label: 'Brand Analyzer', requiresAuth: true, allowGuest: false, costs: { quick: 25, standard: 25, deep: 25, default: 25 } },
  'seo-analyzer': { label: 'SEO Analyzer', requiresAuth: true, allowGuest: false, costs: { quick: 25, standard: 25, deep: 30, default: 25 } },
  'cross-article': { label: 'Cross Article Comparison', requiresAuth: true, allowGuest: false, costs: { quick: 10, standard: 15, deep: 30, default: 15 } },
  presentation: { label: 'URL to Presentation', requiresAuth: true, allowGuest: false, costs: { quick: 25, standard: 35, deep: 70, default: 35 } },
  resume: { label: 'Resume Matcher', requiresAuth: true, allowGuest: false, costs: { quick: 10, standard: 10, deep: 20, default: 10 } },
  'cover-letter': { label: 'Cover Letter', requiresAuth: true, allowGuest: false, costs: { quick: 8, standard: 10, deep: 20, default: 10 } },
  'interview-prep': { label: 'Interview Prep', requiresAuth: true, allowGuest: false, costs: { quick: 10, standard: 14, deep: 28, default: 14 } },
};

export function normalizeCreditMode(mode: unknown): Mode {
  return mode === 'quick' || mode === 'deep' ? mode : 'standard';
}

export function getToolCreditCost(toolType: string, mode?: unknown): number {
  const policy = CREDIT_POLICIES[toolType];
  if (!policy) return 1;
  const normalized = normalizeCreditMode(mode);
  return policy.costs[normalized] ?? policy.costs.default;
}

export function getCreditPolicy(toolType: string): CreditPolicy {
  return CREDIT_POLICIES[toolType] || {
    label: toolType,
    requiresAuth: true,
    allowGuest: false,
    costs: { default: 1 },
  };
}

export function isCreditEnforcementEnabled(): boolean {
  return process.env.CREDIT_ENFORCEMENT_ENABLED === 'true';
}

export async function getCreditSummary(userId: string) {
  const { data, error } = await supabase
    .from('user_credit_balances')
    .select('user_id, plan_key, monthly_allowance, credits_remaining, topup_credits_remaining, period_started_at, period_ends_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function hasPaidPlanAccess(userId: string): Promise<boolean> {
  const summary = await getCreditSummary(userId);
  return PAID_PLAN_KEYS.has(String(summary?.plan_key || '').toLowerCase());
}

export function getCreditTopUpPacks(): CreditTopUpPack[] {
  return [
    {
      key: 'boost-100',
      label: 'Boost 100',
      credits: 100,
      priceCents: 500,
      checkoutUrl: process.env.POLAR_TOPUP_100_CHECKOUT_URL || '',
    },
    {
      key: 'boost-300',
      label: 'Boost 300',
      credits: 300,
      priceCents: 1200,
      checkoutUrl: process.env.POLAR_TOPUP_300_CHECKOUT_URL || '',
    },
    {
      key: 'boost-1000',
      label: 'Boost 1000',
      credits: 1000,
      priceCents: 3000,
      checkoutUrl: process.env.POLAR_TOPUP_1000_CHECKOUT_URL || '',
    },
  ];
}

export function publicCreditTopUpPacks() {
  return getCreditTopUpPacks().map((pack) => ({
    key: pack.key,
    label: pack.label,
    credits: pack.credits,
    priceCents: pack.priceCents,
    checkoutConfigured: !!pack.checkoutUrl,
  }));
}

export function getCreditTopUpCheckoutUrl(packKey: string) {
  return getCreditTopUpPacks().find((pack) => pack.key === packKey)?.checkoutUrl || '';
}

export async function getCreditLedger(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('id, tool_type, mode, credits, direction, reason, balance_after, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) throw error;
  return data || [];
}

export async function getCreditTopUpHistory(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('credit_topup_purchases')
    .select('id, pack_key, credits, amount_cents, currency, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) throw error;
  return data || [];
}

async function spendCredits(input: {
  userId: string;
  toolType: string;
  mode: Mode;
  credits: number;
  taskId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.rpc('iloveurl_spend_credits', {
    p_user_id: input.userId,
    p_tool_type: input.toolType,
    p_mode: input.mode,
    p_credits: input.credits,
    p_task_id: input.taskId || null,
    p_metadata: input.metadata || {},
  });

  if (error) throw error;
  return data as {
    ok: boolean;
    credits_remaining?: number;
    credits_required?: number;
    message?: string;
  };
}

async function hasExistingDebit(taskId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('task_id', taskId)
    .eq('direction', 'debit')
    .eq('reason', 'tool_run')
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
}

async function ensureSufficientCredits(userId: string, credits: number) {
  if (credits <= 0) {
    return { ok: true, creditsRemaining: null };
  }

  const summary = await getCreditSummary(userId);
  const creditsRemaining = summary?.credits_remaining ?? 50;

  if (creditsRemaining < credits) {
    return { ok: false, creditsRemaining };
  }

  return { ok: true, creditsRemaining };
}

export async function chargeSuccessfulToolRun(input: {
  userId?: string | null;
  toolType: string;
  mode?: unknown;
  credits: number;
  taskId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!input.userId || input.credits <= 0 || !isCreditEnforcementEnabled()) {
    return { ok: true, skipped: true };
  }

  if (input.taskId && await hasExistingDebit(input.taskId)) {
    return { ok: true, skipped: true, duplicate: true };
  }

  return spendCredits({
    userId: input.userId,
    toolType: input.toolType,
    mode: normalizeCreditMode(input.mode),
    credits: input.credits,
    taskId: input.taskId,
    metadata: {
      ...(input.metadata || {}),
      charged_after_success: true,
    },
  });
}

export async function completeToolRunTask(input: {
  taskId?: string | null;
  result: unknown;
  userId?: string | null;
  toolType: string;
  mode?: unknown;
  credits: number;
  metadata?: Record<string, unknown>;
}) {
  if (!input.taskId) return;

  await chargeSuccessfulToolRun({
    userId: input.userId,
    toolType: input.toolType,
    mode: input.mode,
    credits: input.credits,
    taskId: input.taskId,
    metadata: input.metadata,
  });

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'completed', result: input.result })
    .eq('id', input.taskId);

  if (error) throw error;
}

export async function authorizeToolRequest(
  req: Request,
  res: Response,
  input: {
    toolType: string;
    userId?: string | null;
    mode?: unknown;
    taskId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<{ ok: true; userId: string | null; credits: number; mode: Mode } | { ok: false }> {
  if (rejectSpoofedUser(req, res, input.userId)) return { ok: false };

  const policy = getCreditPolicy(input.toolType);
  const trustedUserId = resolveTrustedUserId(req, input.userId);
  const mode = normalizeCreditMode(input.mode);
  const credits = getToolCreditCost(input.toolType, mode);

  if (!trustedUserId && !policy.allowGuest) {
    res.status(401).json({
      error: `${policy.label} requires a signed-in account.`,
      code: 'AUTH_REQUIRED',
      creditsRequired: credits,
    });
    return { ok: false };
  }

  if (policy.requiresAuth && !req.authUserId) {
    res.status(401).json({
      error: `${policy.label} requires a verified session.`,
      code: 'AUTH_REQUIRED',
      creditsRequired: credits,
    });
    return { ok: false };
  }

  if (policy.requiresPaidPlan && trustedUserId) {
    const hasAccess = await hasPaidPlanAccess(trustedUserId);

    if (!hasAccess) {
      res.status(403).json({
        error: `${policy.label} is available on Starter, Pro, and Pro+ plans.`,
        code: 'PLAN_REQUIRED',
        requiredPlans: policy.requiredPlans || ['starter', 'pro', 'pro-plus'],
        creditsRequired: credits,
      });
      return { ok: false };
    }
  }

  if (!trustedUserId || credits <= 0 || !isCreditEnforcementEnabled()) {
    return { ok: true, userId: trustedUserId, credits, mode };
  }

  const creditCheck = await ensureSufficientCredits(trustedUserId, credits);

  if (!creditCheck.ok) {
    res.status(402).json({
      error: 'Not enough credits for this tool.',
      code: 'INSUFFICIENT_CREDITS',
      creditsRequired: credits,
      creditsRemaining: creditCheck.creditsRemaining ?? 0,
    });
    return { ok: false };
  }

  return { ok: true, userId: trustedUserId, credits, mode };
}

export function publicCreditPolicies() {
  return Object.fromEntries(
    Object.entries(CREDIT_POLICIES).map(([toolType, policy]) => [
      toolType,
      {
        label: policy.label,
        requiresAuth: policy.requiresAuth,
        allowGuest: policy.allowGuest,
        requiresPaidPlan: !!policy.requiresPaidPlan,
        requiredPlans: policy.requiredPlans || [],
        costs: policy.costs,
      },
    ]),
  );
}
