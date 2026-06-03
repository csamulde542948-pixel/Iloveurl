import express, { Request, Response } from 'express';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { processPolarWebhookEvent } from '../lib/billing';

const router = express.Router();

router.post('/polar/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const secret = process.env.POLAR_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[polar] Missing POLAR_WEBHOOK_SECRET.');
    res.status(500).json({ error: 'Polar webhook is not configured.' });
    return;
  }

  try {
    const event = validateEvent(req.body, req.headers as Record<string, string>, secret);
    const providerEventId = String(req.headers['webhook-id'] || `${event.type}:${Date.now()}`);
    const result = await processPolarWebhookEvent(event, providerEventId);

    res.status(202).json({ received: true, ...result });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.warn('[polar] Invalid webhook signature.');
      res.status(403).json({ error: 'Invalid webhook signature.' });
      return;
    }

    console.error('[polar] Webhook processing failed:', error);
    res.status(500).json({ error: 'Polar webhook processing failed.' });
  }
});

export default router;
