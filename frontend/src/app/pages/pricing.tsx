import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ArrowRight, Check, HelpCircle, ShieldCheck, Sparkles, X, Zap } from "lucide-react";

type BillingCycle = "monthly" | "annual";

const pricingPlans = [
  {
    id: "free",
    name: "Free",
    bestFor: "Best for trying the product",
    monthlyPrice: 0,
    credits: 50,
    cta: "Get started free",
    badge: "",
    note: "Use this to test the basic workflow before upgrading.",
    features: ["Basic URL tools access", "50 credits/month", "Standard queue", "Limited history"],
  },
  {
    id: "starter",
    name: "Starter",
    bestFor: "Best for light personal use",
    monthlyPrice: 9,
    credits: 200,
    cta: "Choose Starter",
    badge: "",
    note: "Good for occasional summaries, QR, metadata, and light AI workflows.",
    features: ["Full core tools", "200 credits/month", "Saved history", "Standard support"],
  },
  {
    id: "pro",
    name: "Pro",
    bestFor: "Best for freelancers and founders",
    monthlyPrice: 19,
    credits: 500,
    cta: "Choose Pro",
    badge: "Most Popular",
    note: "Best default plan for regular AI, SEO, brand, and career workflows.",
    features: ["500 credits/month", "Faster processing", "Extended history", "Better export workflows"],
  },
  {
    id: "pro-plus",
    name: "Pro+",
    bestFor: "Best for heavy solo and professional use",
    monthlyPrice: 49,
    credits: 2000,
    cta: "Choose Pro+",
    badge: "",
    note: "More credits and higher workflow limits for users who run iLoveURL heavily.",
    features: ["2,000 credits/month", "Higher workflow limits", "Priority processing", "Priority support"],
  },
];

const comparisonRows = [
  { group: "Usage", label: "Monthly credits", values: ["50", "200", "500", "2,000"] },
  { group: "Usage", label: "Queue priority", values: ["Standard", "Standard", "Faster", "Priority"] },
  { group: "Credits", label: "Credit reset", values: ["Monthly", "Monthly", "Monthly", "Monthly"] },
  { group: "Credits", label: "Deep / premium runs", values: ["No", "Limited", "Yes", "Yes"] },
  { group: "Limits", label: "Workflow limits", values: ["Basic", "Standard", "Higher", "Highest self-serve"] },
  { group: "Collaboration", label: "Admin controls", values: ["No", "No", "No", "No"] },
  { group: "Support", label: "Support level", values: ["Community", "Standard", "Standard", "Priority"] },
  { group: "Exports", label: "Export options", values: ["Basic", "Core", "Enhanced", "Advanced"] },
];

const faqs = [
  {
    q: "How do credits work?",
    a: "Credits are the usage unit for iLoveURL. As the backend is finalized, each tool action or output generation event should consume credits based on workflow cost, model use, scraping, transcript extraction, and exports.",
  },
  {
    q: "Do unused credits roll over?",
    a: "For the launch pricing model, included monthly credits reset each billing cycle. If you add separate credit packs later, those can have a different rollover or expiry rule.",
  },
  {
    q: "Can I upgrade anytime?",
    a: "Yes. Users should be able to upgrade or downgrade anytime. Production billing should sync Polar subscription status before changing credits or entitlements.",
  },
  {
    q: "What happens when I run out?",
    a: "The product should ask users to upgrade, wait for the next monthly reset, or buy a credit pack once credit packs are released.",
  },
  {
    q: "Why is Pro the default recommendation?",
    a: "Pro has enough credits for regular AI workflows without pushing solo users into Pro+. It is the cleanest fit for founders, freelancers, marketers, and job seekers.",
  },
];

function priceFor(plan: typeof pricingPlans[number], billingCycle: BillingCycle) {
  if (plan.monthlyPrice === null) return "Custom";
  if (plan.monthlyPrice === 0) return "$0";
  if (billingCycle === "monthly") return `$${plan.monthlyPrice}`;
  return `$${plan.monthlyPrice * 10}`;
}

function creditsFor(plan: typeof pricingPlans[number]) {
  return plan.credits === null ? "Custom" : plan.credits.toLocaleString();
}

function annualSavingsFor(plan: typeof pricingPlans[number]) {
  if (plan.monthlyPrice === null || plan.monthlyPrice === 0) return null;
  return plan.monthlyPrice * 2;
}

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const planNames = pricingPlans.map((plan) => plan.name);

  return (
    <div className="min-h-screen bg-background pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-5 md:px-10">
        <section className="mb-12 text-center">
          <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/50">Pricing</p>
          <h1 className="mx-auto mt-4 max-w-4xl font-display text-[38px] lowercase leading-[0.9] text-primary sm:text-[44px] md:text-[72px]">
            simple credit-based pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] font-semibold leading-relaxed text-gray-500">
            Start free, upgrade when you need more credits, faster workflows, and higher usage limits.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[1px] text-gray-500 sm:gap-3 sm:text-[12px]">
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">No credit card required for Free</span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">Upgrade or downgrade anytime</span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">Credits reset monthly on paid plans</span>
          </div>

          <div className="mx-auto mt-8 inline-flex rounded-full border-2 border-border-color bg-white p-1.5 shadow-[0_5px_0_0_#CFCFCF]">
            {(["monthly", "annual"] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`h-10 rounded-full px-5 text-[12px] font-black uppercase tracking-[1px] transition ${
                  billingCycle === cycle ? "bg-primary text-white shadow-[0_3px_0_0_var(--brand-primary-shadow)]" : "text-gray-400 hover:text-primary"
                }`}
              >
                {cycle === "monthly" ? "Monthly" : "Annual"}
              </button>
            ))}
          </div>
          {billingCycle === "annual" && (
            <p className="mt-3 text-[12px] font-bold text-primary">Save about 17% with annual billing: pay for 10 months and get 12 months of credits.</p>
          )}
        </section>

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
          {pricingPlans.map((plan) => {
            const isFree = plan.id === "free";
            const isPro = plan.id === "pro";
            const period = billingCycle === "monthly" ? "/mo" : "/yr";
            const annualSavings = annualSavingsFor(plan);
            const ctaHref = isFree ? "/signup" : `/payment?plan=${plan.id}&billing=${billingCycle}`;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col overflow-hidden rounded-[28px] border-2 bg-white p-0 transition md:rounded-[34px] ${
                  isPro
                    ? "border-primary shadow-[0_12px_0_0_var(--brand-primary-shadow)] xl:-mt-4"
                    : "border-border-color shadow-[0_8px_0_0_#CFCFCF]"
                } ${isFree ? "bg-gray-50/70" : ""}`}
              >
                {plan.badge && (
                  <div className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[1px] text-white shadow-sm ${isPro ? "bg-primary" : "bg-gray-950"}`}>
                    {plan.badge}
                  </div>
                )}

                <div className="border-b-2 border-gray-50 p-5">
                  <p className="pr-20 text-[10px] font-black uppercase tracking-[1.5px] text-primary/45">{plan.bestFor}</p>
                  <h3 className="mt-3 font-display text-[28px] lowercase leading-none text-gray-950 md:text-[30px]">{plan.name}</h3>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="font-display text-[42px] leading-none text-primary md:text-[48px]">{priceFor(plan, billingCycle)}</span>
                    <span className="pb-2 text-[12px] font-black uppercase tracking-[1px] text-gray-400">{isFree ? "/mo" : period}</span>
                  </div>
                  {billingCycle === "annual" && annualSavings && (
                    <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[1px] text-emerald-600">
                      Save ${annualSavings}/year
                    </p>
                  )}
                  <div className="mt-5 rounded-[24px] bg-primary/[0.05] p-4">
                    <p className="text-[34px] font-black leading-none text-gray-950 md:text-[38px]">{creditsFor(plan)}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[1.5px] text-primary/50">credits per month</p>
                  </div>
                </div>

                <div className="flex-1 p-5">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-[13px] font-bold leading-snug text-gray-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto border-t-2 border-gray-50 p-5">
                  <Link to={ctaHref}>
                    <Button
                      variant={isPro ? "default" : "outline"}
                      className={`w-full rounded-full ${!isPro ? "bg-white" : ""}`}
                      size="lg"
                    >
                      {plan.cta}
                      {!isFree && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </Link>
                  <p className="mt-4 min-h-[48px] text-[11px] font-bold leading-relaxed text-gray-400">{plan.note}</p>
                </div>
              </Card>
            );
          })}
        </section>

        <section className="mb-14 rounded-[30px] border-2 border-primary/15 bg-primary/[0.04] p-5 text-center">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 md:flex-row">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
              <Zap className="h-5 w-5" />
            </div>
            <p className="text-[14px] font-black leading-relaxed text-gray-800">
              1 credit = 1 tool action or output generation event. High-cost workflows can consume more credits when they use premium AI, crawling, transcript extraction, or exports.
            </p>
          </div>
        </section>

        <section className="mb-16 overflow-hidden rounded-[28px] border-2 border-border-color bg-white shadow-[0_8px_0_0_#CFCFCF] md:rounded-[36px]">
          <div className="border-b-2 border-gray-50 p-6">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">feature comparison</p>
            <h2 className="mt-2 text-[32px] font-display lowercase leading-none text-gray-950">compare the plans</h2>
          </div>
          <div className="overflow-x-auto">
            <p className="border-b border-gray-100 bg-gray-50 px-5 py-3 text-[10px] font-black uppercase tracking-[1.5px] text-gray-400 md:hidden">
              Swipe sideways to compare all plans
            </p>
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[1.5px] text-gray-400">Feature</th>
                  {planNames.map((name) => (
                    <th key={name} className="px-5 py-4 text-[11px] font-black uppercase tracking-[1.5px] text-gray-700">{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr key={`${row.group}-${row.label}`} className="border-t border-gray-100">
                    <td className="px-5 py-4">
                      <p className="text-[9px] font-black uppercase tracking-[1.5px] text-primary/40">{row.group}</p>
                      <p className="mt-1 text-[13px] font-black text-gray-900">{row.label}</p>
                    </td>
                    {row.values.map((value, valueIndex) => (
                      <td key={`${row.label}-${valueIndex}`} className="px-5 py-4 text-[13px] font-bold text-gray-600">
                        {value === "No" ? (
                          <span className="inline-flex items-center gap-1 text-gray-300"><X className="h-4 w-4" /> No</span>
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/50">FAQ</p>
            <h2 className="mt-2 text-[32px] font-display lowercase text-gray-950">pricing details</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <Card key={faq.q} className="rounded-[28px] border-2 border-border-color/50 bg-white p-6">
                <div className="mb-3 flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <h4 className="text-[16px] font-black leading-snug text-gray-text">{faq.q}</h4>
                </div>
                <p className="text-[14px] font-semibold leading-[1.7] text-gray-light">{faq.a}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-[30px] border-2 border-border-color bg-gray-950 p-6 text-center text-white shadow-[0_8px_0_0_#CFCFCF] md:rounded-[40px] md:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-[32px] lowercase leading-none md:text-[38px]">start free and scale as your workflows grow.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] font-semibold leading-relaxed text-white/60">
            The page is ready for the 5-plan credit model. Next, connect plan credits to backend entitlement checks before public paid launch.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/signup">
              <Button className="rounded-full px-8">Get Started Free</Button>
            </Link>
            <Link to="/tools">
              <Button variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 text-white hover:bg-white/20">
                Browse Tools
              </Button>
            </Link>
          </div>
        </section>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-primary/10 bg-primary/[0.04] p-5 text-center md:flex-row md:text-left">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <p className="max-w-3xl text-[13px] font-bold leading-relaxed text-gray-600">
            Launch note: this is now the public pricing promise. The next engineering step is to enforce monthly credits, plan access, and tool credit costs in the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
