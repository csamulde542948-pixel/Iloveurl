import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../components/auth-provider";
import { CheckCircle2, CreditCard, ExternalLink, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type BillingCycle = "monthly" | "annual";

const paymentPlans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 9,
    annualPrice: 90,
    credits: 200,
    description: "For light personal URL workflows.",
    monthlyCheckoutUrl: import.meta.env.VITE_POLAR_STARTER_MONTHLY_CHECKOUT_URL || "",
    annualCheckoutUrl: import.meta.env.VITE_POLAR_STARTER_ANNUAL_CHECKOUT_URL || "",
    features: ["200 monthly credits", "Full core tools", "Saved history", "Standard support"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 19,
    annualPrice: 190,
    credits: 500,
    description: "For freelancers, consultants, and founders.",
    monthlyCheckoutUrl: import.meta.env.VITE_POLAR_PRO_MONTHLY_CHECKOUT_URL || "",
    annualCheckoutUrl: import.meta.env.VITE_POLAR_PRO_ANNUAL_CHECKOUT_URL || "",
    features: ["500 monthly credits", "Faster processing", "Extended history", "Better export workflows"],
  },
  {
    id: "pro-plus",
    name: "Pro+",
    monthlyPrice: 49,
    annualPrice: 490,
    credits: 2000,
    description: "For heavy solo and professional URL workflows.",
    monthlyCheckoutUrl: import.meta.env.VITE_POLAR_PRO_PLUS_MONTHLY_CHECKOUT_URL || "",
    annualCheckoutUrl: import.meta.env.VITE_POLAR_PRO_PLUS_ANNUAL_CHECKOUT_URL || "",
    features: ["2,000 monthly credits", "Higher workflow limits", "Priority processing", "Priority support"],
  },
];

function getPlanPrice(plan: typeof paymentPlans[number], billingCycle: BillingCycle) {
  return billingCycle === "annual" ? `$${plan.annualPrice}` : `$${plan.monthlyPrice}`;
}

function getPlanPeriod(billingCycle: BillingCycle) {
  return billingCycle === "annual" ? "per year" : "per month";
}

function getPolarCheckoutUrl(plan: typeof paymentPlans[number], billingCycle: BillingCycle) {
  return billingCycle === "annual" ? plan.annualCheckoutUrl : plan.monthlyCheckoutUrl;
}

function getAnnualSavings(plan: typeof paymentPlans[number]) {
  return plan.monthlyPrice * 2;
}

function withPolarCustomerParams(checkoutUrl: string, user?: User | null) {
  if (!checkoutUrl) return "";

  try {
    const url = new URL(checkoutUrl);
    if (user?.email) url.searchParams.set("customer_email", user.email);
    if (user?.id) url.searchParams.set("reference_id", user.id);

    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name;
    if (fullName) url.searchParams.set("customer_name", fullName);

    return url.toString();
  } catch {
    return "";
  }
}

function PolarCheckoutButton({
  checkoutUrl,
  disabled,
}: {
  checkoutUrl: string;
  disabled: boolean;
}) {
  if (!checkoutUrl) {
    return (
      <div className="rounded-[24px] border-2 border-dashed border-border-color bg-gray-50 p-5 text-center">
        <p className="text-[12px] font-black uppercase tracking-[1.5px] text-gray-400">Polar setup required</p>
        <p className="mt-2 text-[13px] font-semibold leading-relaxed text-gray-500">
          Add the Polar checkout link for this tier to enable checkout.
        </p>
      </div>
    );
  }

  return (
    <a href={disabled ? undefined : checkoutUrl} aria-disabled={disabled}>
      <Button size="lg" className="h-14 w-full rounded-full" disabled={disabled}>
        Subscribe Now
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
    </a>
  );
}

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const selectedPlanId = searchParams.get("plan") || "pro";
  const billingCycle: BillingCycle = searchParams.get("billing") === "annual" ? "annual" : "monthly";
  const [selectedPlan, setSelectedPlan] = useState(() => paymentPlans.find((plan) => plan.id === selectedPlanId) || paymentPlans[1]);
  const selectedPlanPrice = getPlanPrice(selectedPlan, billingCycle);
  const selectedPlanPeriod = getPlanPeriod(billingCycle);
  const selectedAnnualSavings = getAnnualSavings(selectedPlan);
  const selectedPolarCheckoutUrl = useMemo(
    () => withPolarCustomerParams(getPolarCheckoutUrl(selectedPlan, billingCycle), user),
    [billingCycle, selectedPlan, user],
  );

  return (
    <div className="min-h-screen bg-background pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-5 md:px-10">
        <div className="mb-10 max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/50">secure checkout</p>
          <h1 className="mt-3 font-display text-[38px] lowercase leading-[0.9] text-primary sm:text-[42px] md:text-[64px]">
            upgrade with polar.
          </h1>
          <p className="mt-5 text-[16px] font-semibold leading-relaxed text-gray-500">
            Choose your iLoveURL plan and complete checkout through Polar. Subscriptions include monthly credits for AI, scraping, transcript, and export workflows.
          </p>
          {billingCycle === "annual" && (
            <p className="mt-3 inline-flex rounded-full bg-primary/[0.08] px-4 py-2 text-[12px] font-black uppercase tracking-[1px] text-primary">
              Annual billing selected: save ${selectedAnnualSavings}/year
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:gap-8">
          <div className="space-y-5">
            {paymentPlans.map((plan) => {
              const active = selectedPlan.id === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full rounded-[26px] border-2 bg-white p-4 text-left transition-all sm:p-6 md:rounded-[32px] ${
                    active
                      ? "border-primary shadow-[0_8px_0_0_var(--brand-primary-shadow)]"
                      : "border-border-color shadow-[0_8px_0_0_#CFCFCF] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#CFCFCF]"
                  }`}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-gray-950 ${active ? "bg-primary" : "bg-gray-100"}`}>
                          <Sparkles className={`h-5 w-5 ${active ? "text-white" : "text-gray-400"}`} />
                        </div>
                        <div>
                          <h2 className="font-display text-[24px] lowercase leading-none text-gray-950 sm:text-[26px]">{plan.name}</h2>
                          <p className="mt-1 text-[12px] font-black uppercase tracking-[1px] text-gray-400">{plan.description}</p>
                        </div>
                      </div>
                      <ul className="mt-5 grid gap-2 md:grid-cols-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-[13px] font-bold text-gray-600">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="font-display text-[38px] leading-none text-primary sm:text-[42px]">{getPlanPrice(plan, billingCycle)}</p>
                      <p className="mt-1 text-[12px] font-black uppercase tracking-[1px] text-gray-400">{getPlanPeriod(billingCycle)}</p>
                      <p className="mt-3 text-[13px] font-black text-gray-950">{plan.credits.toLocaleString()} credits/month</p>
                      {billingCycle === "annual" && (
                        <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[1px] text-emerald-600">
                          Save ${getAnnualSavings(plan)}/year
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Card className="h-fit rounded-[28px] border-2 border-border-color bg-white p-5 shadow-[0_8px_0_0_#CFCFCF] md:rounded-[36px] md:p-6 md:shadow-[0_10px_0_0_#CFCFCF]">
            <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-gray-50 pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">checkout summary</p>
                <h2 className="mt-2 font-display text-[28px] lowercase leading-none text-gray-950 md:text-[32px]">{selectedPlan.name}</h2>
                <p className="mt-2 text-[13px] font-bold text-gray-500">{selectedPlan.description}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-gray-950 bg-primary text-white shadow-[0_4px_0_0_#CFCFCF]">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            <div className="mb-6 rounded-[28px] bg-gray-50 p-5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-[13px] font-black uppercase tracking-[1px] text-gray-400">Due today</span>
                <div className="text-right">
                  <p className="font-display text-[36px] leading-none text-primary md:text-[40px]">{selectedPlanPrice}</p>
                  <p className="text-[11px] font-black uppercase tracking-[1px] text-gray-400">{selectedPlanPeriod}</p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-[11px] font-black uppercase tracking-[1px] text-gray-400">Included credits</p>
                <p className="mt-1 text-[24px] font-black text-gray-950">{selectedPlan.credits.toLocaleString()} credits/month</p>
                {billingCycle === "annual" && (
                  <p className="mt-2 text-[12px] font-black text-emerald-600">
                    You save ${selectedAnnualSavings} compared with monthly billing.
                  </p>
                )}
              </div>
            </div>

            {!user && (
              <div className="mb-5 rounded-[24px] border-2 border-amber-100 bg-amber-50 p-4">
                <p className="text-[12px] font-black uppercase tracking-[1px] text-amber-700">Sign in required</p>
                <p className="mt-1 text-[13px] font-semibold text-amber-800">
                  Sign in before checkout so the subscription can be attached to your iLoveURL account.
                </p>
                <Link to="/signin">
                  <Button variant="outline" className="mt-3 h-10 rounded-full bg-white text-[11px] font-black uppercase">
                    Sign in
                  </Button>
                </Link>
              </div>
            )}

            <PolarCheckoutButton checkoutUrl={selectedPolarCheckoutUrl} disabled={!user} />

            <div className="mt-6 grid gap-3">
              <div className="flex items-start gap-3 rounded-[20px] bg-primary/[0.04] p-4">
                <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-[12px] font-bold leading-relaxed text-gray-600">
                  Payment details are handled by Polar. iLoveURL stores only the account, plan, subscription status, and entitlement data needed to provide the service.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-[20px] bg-emerald-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                <p className="text-[12px] font-bold leading-relaxed text-gray-600">
                  Webhooks will sync active subscriptions, renewals, cancellations, and credit entitlements before paid access is enforced.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
