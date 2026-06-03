import { supabase } from './supabase';

type JsonRecord = Record<string, unknown>;
type PlanKey = 'starter' | 'pro' | 'pro-plus';

const PLAN_ALLOWANCES: Record<PlanKey, number> = {
  starter: 200,
  pro: 500,
  'pro-plus': 2000,
};

const SUBSCRIPTION_CREDIT_GRANT_EVENTS = new Set(['subscription.active']);
const SUBSCRIPTION_SYNC_EVENTS = new Set([
  'subscription.created',
  'subscription.active',
  'subscription.updated',
  'subscription.uncanceled',
  'subscription.canceled',
  'subscription.past_due',
  'subscription.revoked',
  'order.paid',
]);

function toPlainJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function envList(name: string) {
  return (process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' ? (value as JsonRecord) : {};
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false;
}

function asDateString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function isUuid(value: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function idMatchesPlan(plan: PlanKey, ids: Array<string | null>) {
  const envNames = [
    `POLAR_${plan.replace('-', '_').toUpperCase()}_PRODUCT_IDS`,
    `POLAR_${plan.replace('-', '_').toUpperCase()}_PRICE_IDS`,
  ];
  const configuredIds = new Set(envNames.flatMap(envList));
  return ids.some((id) => !!id && configuredIds.has(id));
}

function configuredTopUpPacks() {
  return [
    { key: 'boost-100', credits: 100, env: 'POLAR_TOPUP_100_PRODUCT_IDS' },
    { key: 'boost-300', credits: 300, env: 'POLAR_TOPUP_300_PRODUCT_IDS' },
    { key: 'boost-1000', credits: 1000, env: 'POLAR_TOPUP_1000_PRODUCT_IDS' },
    { key: 'boost-100', credits: 100, env: 'POLAR_TOPUP_100_PRICE_IDS' },
    { key: 'boost-300', credits: 300, env: 'POLAR_TOPUP_300_PRICE_IDS' },
    { key: 'boost-1000', credits: 1000, env: 'POLAR_TOPUP_1000_PRICE_IDS' },
  ];
}

function inferTopUpPack(data: JsonRecord): { key: string; credits: number } | null {
  const product = asRecord(data.product);
  const metadata = asRecord(data.metadata);
  const productId = asString(data.productId) || asString(data.product_id) || asString(product.id);
  const productPriceId = asString(data.productPriceId) || asString(data.product_price_id);
  const metadataPack = asString(metadata.pack_key);

  if (metadataPack) {
    const explicitPack = {
      'boost-100': 100,
      'boost-300': 300,
      'boost-1000': 1000,
    }[metadataPack];
    if (explicitPack) return { key: metadataPack, credits: explicitPack };
  }

  const candidateIds = [productId, productPriceId];
  for (const pack of configuredTopUpPacks()) {
    const ids = new Set(envList(pack.env));
    if (candidateIds.some((id) => id && ids.has(id))) return { key: pack.key, credits: pack.credits };
  }

  const productName = asString(product.name)?.toLowerCase() || '';
  if (productName.includes('1000')) return { key: 'boost-1000', credits: 1000 };
  if (productName.includes('300')) return { key: 'boost-300', credits: 300 };
  if (productName.includes('100')) return { key: 'boost-100', credits: 100 };

  return null;
}

function inferPlanKey(data: JsonRecord): PlanKey | null {
  const product = asRecord(data.product);
  const metadata = asRecord(data.metadata);
  const productId = asString(data.productId) || asString(data.product_id) || asString(product.id);
  const productPriceId = asString(data.productPriceId) || asString(data.product_price_id);
  const metadataPlan = asString(metadata.plan_key) || asString(metadata.plan);

  if (metadataPlan === 'starter' || metadataPlan === 'pro' || metadataPlan === 'pro-plus') {
    return metadataPlan;
  }

  const candidateIds = [productId, productPriceId];
  if (idMatchesPlan('pro-plus', candidateIds)) return 'pro-plus';
  if (idMatchesPlan('pro', candidateIds)) return 'pro';
  if (idMatchesPlan('starter', candidateIds)) return 'starter';

  const productName = asString(product.name)?.toLowerCase() || '';
  if (productName.includes('pro+') || productName.includes('pro plus')) return 'pro-plus';
  if (productName.includes('starter')) return 'starter';
  if (productName.includes('pro')) return 'pro';

  const defaultPlan = asString(process.env.POLAR_DEFAULT_PLAN_KEY);
  if (defaultPlan === 'starter' || defaultPlan === 'pro' || defaultPlan === 'pro-plus') {
    return defaultPlan;
  }

  return null;
}

function extractUserId(data: JsonRecord): string | null {
  const metadata = asRecord(data.metadata);
  const customer = asRecord(data.customer);
  const customerMetadata = asRecord(customer.metadata);

  return (
    asString(metadata.reference_id) ||
    asString(metadata.user_id) ||
    asString(data.externalCustomerId) ||
    asString(data.external_customer_id) ||
    asString(customer.externalId) ||
    asString(customer.external_id) ||
    asString(customerMetadata.reference_id) ||
    asString(customerMetadata.user_id)
  );
}

function extractSubscriptionId(data: JsonRecord): string | null {
  const subscription = asRecord(data.subscription);
  return asString(data.subscriptionId) || asString(data.subscription_id) || asString(subscription.id) || asString(data.id);
}

function extractCustomerId(data: JsonRecord): string | null {
  const customer = asRecord(data.customer);
  return asString(data.customerId) || asString(data.customer_id) || asString(customer.id);
}

async function markBillingEvent(input: {
  providerEventId: string;
  eventType: string;
  userId: string | null;
  payload: unknown;
}) {
  const { data, error } = await supabase
    .from('billing_events')
    .insert({
      provider: 'polar',
      provider_event_id: input.providerEventId,
      event_type: input.eventType,
      user_id: input.userId,
      payload: toPlainJson(input.payload),
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { duplicate: true, id: null };
    }
    throw error;
  }

  return { duplicate: false, id: data.id as string };
}

async function finishBillingEvent(id: string, input: { processed: boolean; error?: string | null }) {
  const { error } = await supabase
    .from('billing_events')
    .update({
      processed: input.processed,
      processing_error: input.error || null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

async function syncSubscription(input: {
  userId: string;
  planKey: PlanKey;
  data: JsonRecord;
  eventType: string;
}) {
  const providerSubscriptionId = extractSubscriptionId(input.data);
  if (!providerSubscriptionId) return;

  const metadata = asRecord(input.data.metadata);
  const currentPeriodStart = asDateString(input.data.currentPeriodStart) || asDateString(input.data.current_period_start);
  const currentPeriodEnd = asDateString(input.data.currentPeriodEnd) || asDateString(input.data.current_period_end);

  const { error } = await supabase.from('billing_subscriptions').upsert(
    {
      user_id: input.userId,
      provider: 'polar',
      provider_customer_id: extractCustomerId(input.data),
      provider_subscription_id: providerSubscriptionId,
      plan_key: input.planKey,
      status: asString(input.data.status) || input.eventType,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: asBoolean(input.data.cancelAtPeriodEnd) || asBoolean(input.data.cancel_at_period_end),
      metadata: {
        ...toPlainJson(metadata),
        polar_event_type: input.eventType,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider,provider_subscription_id' },
  );

  if (error) throw error;
}

async function grantMonthlyCredits(input: {
  userId: string;
  planKey: PlanKey;
  data: JsonRecord;
  eventType: string;
}) {
  const allowance = PLAN_ALLOWANCES[input.planKey];
  const periodStartedAt =
    asDateString(input.data.currentPeriodStart) ||
    asDateString(input.data.current_period_start) ||
    new Date().toISOString();
  const periodEndsAt =
    asDateString(input.data.currentPeriodEnd) ||
    asDateString(input.data.current_period_end) ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: balance, error: balanceError } = await supabase
    .from('user_credit_balances')
    .upsert(
      {
        user_id: input.userId,
        plan_key: input.planKey,
        monthly_allowance: allowance,
        credits_remaining: allowance,
        period_started_at: periodStartedAt,
        period_ends_at: periodEndsAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('credits_remaining')
    .single();

  if (balanceError) throw balanceError;

  const { error: ledgerError } = await supabase.from('credit_ledger').insert({
    user_id: input.userId,
    tool_type: 'billing',
    mode: 'standard',
    credits: allowance,
    direction: 'credit',
    reason: input.eventType === 'order.paid' ? 'polar_order_paid' : 'polar_subscription_active',
    balance_after: balance?.credits_remaining ?? allowance,
    metadata: {
      provider: 'polar',
      plan_key: input.planKey,
      event_type: input.eventType,
      subscription_id: extractSubscriptionId(input.data),
      customer_id: extractCustomerId(input.data),
    },
  });

  if (ledgerError) throw ledgerError;
}

async function grantTopUpCredits(input: {
  userId: string;
  packKey: string;
  credits: number;
  data: JsonRecord;
  eventType: string;
}) {
  const { data, error } = await supabase.rpc('iloveurl_grant_credits', {
    p_user_id: input.userId,
    p_credits: input.credits,
    p_reason: 'polar_credit_topup',
    p_metadata: {
      provider: 'polar',
      pack_key: input.packKey,
      event_type: input.eventType,
      order_id: asString(input.data.id),
      checkout_id: asString(input.data.checkoutId) || asString(input.data.checkout_id),
      customer_id: extractCustomerId(input.data),
    },
    p_pack_key: input.packKey,
    p_provider: 'polar',
    p_provider_order_id: asString(input.data.id),
    p_provider_checkout_id: asString(input.data.checkoutId) || asString(input.data.checkout_id),
    p_amount_cents: typeof input.data.totalAmount === 'number' ? input.data.totalAmount : typeof input.data.total_amount === 'number' ? input.data.total_amount : null,
    p_currency: asString(input.data.currency),
  });

  if (error) throw error;
  return data;
}

export async function processPolarWebhookEvent(event: unknown, providerEventId: string) {
  const eventRecord = asRecord(event);
  const eventType = asString(eventRecord.type) || 'unknown';
  const data = asRecord(eventRecord.data);
  const userId = extractUserId(data);
  const billingEvent = await markBillingEvent({
    providerEventId,
    eventType,
    userId: isUuid(userId) ? userId : null,
    payload: event,
  });

  if (billingEvent.duplicate) {
    return { status: 'duplicate' };
  }

  if (!billingEvent.id) {
    return { status: 'ignored' };
  }

  try {
    if (!SUBSCRIPTION_SYNC_EVENTS.has(eventType)) {
      await finishBillingEvent(billingEvent.id, { processed: true });
      return { status: 'ignored', eventType };
    }

    if (!isUuid(userId)) {
      await finishBillingEvent(billingEvent.id, {
        processed: false,
        error: 'Missing or invalid user reference_id in Polar metadata.',
      });
      return { status: 'missing_user_reference', eventType };
    }

    const topUpPack = eventType === 'order.paid' ? inferTopUpPack(data) : null;
    if (topUpPack) {
      await grantTopUpCredits({
        userId,
        packKey: topUpPack.key,
        credits: topUpPack.credits,
        data,
        eventType,
      });
      await finishBillingEvent(billingEvent.id, { processed: true });
      return { status: 'processed_topup', eventType, packKey: topUpPack.key };
    }

    const planKey = inferPlanKey(data);
    if (!planKey) {
      await finishBillingEvent(billingEvent.id, {
        processed: false,
        error: 'Could not infer iLoveURL plan from Polar product, price, or metadata.',
      });
      return { status: 'missing_plan_mapping', eventType };
    }

    await syncSubscription({ userId, planKey, data, eventType });

    if (SUBSCRIPTION_CREDIT_GRANT_EVENTS.has(eventType)) {
      await grantMonthlyCredits({ userId, planKey, data, eventType });
    }

    await finishBillingEvent(billingEvent.id, { processed: true });
    return { status: 'processed', eventType, planKey };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Polar billing error.';
    await finishBillingEvent(billingEvent.id, { processed: false, error: message });
    throw error;
  }
}
