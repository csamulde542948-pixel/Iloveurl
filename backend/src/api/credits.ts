import { Router, Request, Response } from 'express';
import {
  getCreditLedger,
  getCreditSummary,
  getCreditTopUpCheckoutUrl,
  getCreditTopUpHistory,
  publicCreditPolicies,
  publicCreditTopUpPacks,
} from '../lib/credits';

const router = Router();

router.get('/policy', (_req: Request, res: Response) => {
  res.json({
    enforcementEnabled: process.env.CREDIT_ENFORCEMENT_ENABLED === 'true',
    freeMonthlyCredits: 50,
    policies: publicCreditPolicies(),
    topUpPacks: publicCreditTopUpPacks(),
  });
});

router.get('/me', async (req: Request, res: Response) => {
  if (!req.authUserId) {
    return res.status(401).json({
      error: 'Sign in to view your credits.',
      code: 'AUTH_REQUIRED',
    });
  }

  try {
    const summary = await getCreditSummary(req.authUserId);
    res.json(summary || {
      user_id: req.authUserId,
      plan_key: 'free',
      monthly_allowance: 50,
      credits_remaining: 50,
      topup_credits_remaining: 0,
      period_started_at: null,
      period_ends_at: null,
    });
  } catch (error: any) {
    console.error('Credit summary error:', error);
    res.status(500).json({ error: 'Could not load credit balance.' });
  }
});

router.get('/ledger', async (req: Request, res: Response) => {
  if (!req.authUserId) {
    return res.status(401).json({
      error: 'Sign in to view your credit activity.',
      code: 'AUTH_REQUIRED',
    });
  }

  try {
    const limit = Number(req.query.limit || 20);
    const [ledger, topups] = await Promise.all([
      getCreditLedger(req.authUserId, limit),
      getCreditTopUpHistory(req.authUserId, limit),
    ]);
    res.json({ ledger, topups });
  } catch (error: any) {
    console.error('Credit ledger error:', error);
    res.status(500).json({ error: 'Could not load credit activity.' });
  }
});

router.post('/topups/:packKey/checkout', async (req: Request, res: Response) => {
  if (!req.authUserId) {
    return res.status(401).json({
      error: 'Sign in before buying credit top-ups.',
      code: 'AUTH_REQUIRED',
    });
  }

  const packKey = Array.isArray(req.params.packKey) ? req.params.packKey[0] : req.params.packKey;
  const checkoutUrl = getCreditTopUpCheckoutUrl(packKey);
  if (!checkoutUrl) {
    return res.status(404).json({
      error: 'This credit top-up pack is not configured yet.',
      code: 'TOPUP_NOT_CONFIGURED',
    });
  }

  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('customer_email', req.authUser?.email || '');
    url.searchParams.set('reference_id', req.authUserId);
    url.searchParams.set('metadata[pack_key]', packKey);
    url.searchParams.set('metadata[user_id]', req.authUserId);

    res.json({ checkoutUrl: url.toString() });
  } catch {
    res.status(500).json({
      error: 'Credit top-up checkout link is invalid.',
      code: 'TOPUP_CHECKOUT_INVALID',
    });
  }
});

export default router;
