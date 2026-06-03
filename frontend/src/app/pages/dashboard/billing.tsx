import * as React from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "./dashboard-layout";
import { useAuth } from "../../components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { 
  ArrowUpRight,
  CreditCard, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  ShieldCheck,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "../../components/ui/skeleton";

type CreditSummary = {
  plan_key: string;
  monthly_allowance: number;
  credits_remaining: number;
  topup_credits_remaining?: number;
  period_ends_at: string | null;
};

type CreditPolicyResponse = {
  enforcementEnabled: boolean;
  policies: Record<string, { label: string; costs: Record<string, number>; requiresAuth: boolean; allowGuest: boolean }>;
  topUpPacks: Array<{ key: string; label: string; credits: number; priceCents: number; checkoutConfigured: boolean }>;
};

type CreditLedgerResponse = {
  ledger: Array<{
    id: string;
    tool_type: string;
    credits: number;
    direction: "debit" | "credit";
    reason: string;
    balance_after: number;
    created_at: string;
  }>;
};

export function DashboardBilling() {
  const { session } = useAuth();
  const [creditSummary, setCreditSummary] = React.useState<CreditSummary | null>(null);
  const [creditPolicy, setCreditPolicy] = React.useState<CreditPolicyResponse | null>(null);
  const [creditLedger, setCreditLedger] = React.useState<CreditLedgerResponse["ledger"]>([]);
  const [loadingCredits, setLoadingCredits] = React.useState(true);
  const [checkoutLoading, setCheckoutLoading] = React.useState<string | null>(null);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      credits: "50 credits / mo",
      description: "Best for trying the product.",
      features: ["Basic URL tools access", "Standard queue", "Limited history", "No credit card required"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$19",
      credits: "500 credits / mo",
      description: "For freelancers, consultants, and founders.",
      features: ["Faster processing", "Extended history", "Better export workflows", "Premium AI workflows"],
      popular: true
    }
  ];

  React.useEffect(() => {
    let cancelled = false;
    const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const authHeaders = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;

    async function loadCredits() {
      try {
        const [summaryRes, policyRes, ledgerRes] = await Promise.all([
          fetch(`${api}/api/credits/me`, { headers: authHeaders }),
          fetch(`${api}/api/credits/policy`),
          fetch(`${api}/api/credits/ledger`, { headers: authHeaders }),
        ]);

        if (!summaryRes.ok) throw new Error("Could not load credit balance.");
        if (!policyRes.ok) throw new Error("Could not load credit policy.");

        const [summary, policy] = await Promise.all([
          summaryRes.json(),
          policyRes.json(),
        ]);
        const ledger = ledgerRes.ok ? await ledgerRes.json() : { ledger: [] };

        if (!cancelled) {
          setCreditSummary(summary);
          setCreditPolicy(policy);
          setCreditLedger(ledger.ledger || []);
        }
      } catch (error: any) {
        if (!cancelled) toast.error(error.message || "Could not load credits.");
      } finally {
        if (!cancelled) setLoadingCredits(false);
      }
    }

    loadCredits();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const monthlyRemaining = Math.max((creditSummary?.credits_remaining || 0) - (creditSummary?.topup_credits_remaining || 0), 0);
  const activePlan = creditSummary?.plan_key || "free";

  const startTopUpCheckout = async (packKey: string) => {
    const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
    setCheckoutLoading(packKey);
    try {
      const response = await fetch(`${api}/api/credits/topups/${packKey}/checkout`, {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Credit top-up checkout is not available yet.");
      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      toast.error(error.message || "Could not start credit top-up checkout.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-display text-primary leading-tight">Plans & <span className="font-bold">Billing</span></h1>
          <p className="text-[15px] text-gray-light mt-1 font-medium">Manage your subscription and billing information.</p>
        </div>

        <Card className="overflow-hidden rounded-[28px] border-2 border-gray-950 bg-white shadow-[0_8px_0_0_#CFCFCF] md:rounded-[36px]">
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[1fr_320px]">
            <div className="p-6 md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">credit balance</p>
              <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  {loadingCredits ? (
                    <Skeleton className="h-14 w-36 rounded-2xl" />
                  ) : (
                    <p className="font-display text-[46px] lowercase leading-none text-primary md:text-[56px]">
                      {(creditSummary?.credits_remaining || 0).toLocaleString()}
                    </p>
                  )}
                  <p className="mt-2 text-[13px] font-black uppercase tracking-[1px] text-gray-400">credits available</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border-2 border-border-color bg-gray-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[1px] text-gray-400">monthly</p>
                    {loadingCredits ? <Skeleton className="mt-2 h-7 w-16 rounded-xl" /> : <p className="mt-1 text-[24px] font-black text-gray-950">{monthlyRemaining.toLocaleString()}</p>}
                  </div>
                  <div className="rounded-[24px] border-2 border-border-color bg-primary/[0.05] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[1px] text-primary/50">top-up</p>
                    {loadingCredits ? <Skeleton className="mt-2 h-7 w-16 rounded-xl" /> : <p className="mt-1 text-[24px] font-black text-gray-950">{(creditSummary?.topup_credits_remaining || 0).toLocaleString()}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t-2 border-border-color bg-primary/[0.04] p-6 lg:border-l-2 lg:border-t-0">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">current plan</p>
              {loadingCredits ? (
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-8 w-28 rounded-xl" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <p className="mt-3 text-[28px] font-display lowercase text-gray-950">{activePlan}</p>
                  <p className="mt-2 text-[13px] font-bold text-gray-500">
                    {(creditSummary?.monthly_allowance || 0).toLocaleString()} monthly credits
                  </p>
                  {creditSummary?.period_ends_at && (
                    <p className="mt-4 text-[12px] font-bold text-gray-400">
                      Resets {new Date(creditSummary.period_ends_at).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-2 border-border-color/60 bg-white shadow-sm md:rounded-[32px]">
          <CardHeader className="border-b border-border-color/50 p-6">
            <CardTitle className="text-[18px] font-bold uppercase tracking-wide">Credit Top-Ups</CardTitle>
            <CardDescription>Extra credits are spent after monthly credits and are designed to carry over.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 sm:p-6 md:grid-cols-3">
            {loadingCredits && !creditPolicy ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-[28px] border-2 border-border-color bg-white p-5 shadow-[0_5px_0_0_#CFCFCF]">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-4 h-10 w-24 rounded-xl" />
                <Skeleton className="mt-2 h-3 w-16" />
                <Skeleton className="mt-5 h-6 w-14" />
                <Skeleton className="mt-4 h-11 w-full rounded-full" />
              </div>
            )) : (creditPolicy?.topUpPacks || []).map((pack) => (
              <div key={pack.key} className="rounded-[28px] border-2 border-border-color bg-white p-5 shadow-[0_5px_0_0_#CFCFCF]">
                <p className="text-[10px] font-black uppercase tracking-[1.5px] text-primary/40">{pack.label}</p>
                <p className="mt-3 text-[34px] font-display leading-none text-primary">{pack.credits.toLocaleString()}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[1px] text-gray-400">credits</p>
                <p className="mt-4 text-[18px] font-black text-gray-950">${(pack.priceCents / 100).toFixed(0)}</p>
                <Button
                  className="mt-4 h-11 w-full rounded-full"
                  disabled={!pack.checkoutConfigured || checkoutLoading === pack.key}
                  onClick={() => startTopUpCheckout(pack.key)}
                >
                  {checkoutLoading === pack.key ? <Loader2 className="h-4 w-4 animate-spin" /> : pack.checkoutConfigured ? "Buy Credits" : "Coming Soon"}
                  {pack.checkoutConfigured && checkoutLoading !== pack.key && <ArrowUpRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={cn(
                "relative overflow-hidden rounded-[28px] border-2 shadow-sm md:rounded-[32px]",
                activePlan === plan.id ? "border-border-color/50 bg-white" : "border-primary/20 bg-primary/5",
                plan.popular && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[2px] px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="border-b border-border-color/50 p-5 md:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <CardTitle className="text-[24px] font-black uppercase tracking-tight text-gray-text">{plan.name}</CardTitle>
                    <CardDescription className="text-[14px] mt-1">{plan.description}</CardDescription>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[32px] font-black text-primary">{plan.price}</span>
                    <span className="text-[14px] text-gray-light font-bold">/mo</span>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[1px] text-primary/50">{plan.credits}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 p-5 md:space-y-8 md:p-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-[14px] font-medium text-gray-text">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {loadingCredits ? (
                  <Skeleton className="h-12 w-full rounded-full" />
                ) : activePlan === plan.id ? (
                  <div className="w-full p-4 rounded-2xl bg-gray-50 border border-border-color flex items-center justify-center gap-2 text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                    Current Plan
                  </div>
                ) : (
                  <Link to="/payment?plan=pro&billing=monthly">
                    <Button className="w-full rounded-full shadow-[0_4px_0_0_#CFCFCF] h-12 uppercase font-bold tracking-wider gap-2">
                      Upgrade to Pro <Zap className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-2 border-border-color/50 rounded-[32px] overflow-hidden shadow-sm">
          <CardHeader className="p-8 border-b border-border-color/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gray-50 text-gray-text">
                <CreditCard className="w-5 h-5" />
              </div>
              <CardTitle className="text-[18px] font-bold uppercase tracking-wide">Billing Provider</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8">
             <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gray-950 bg-primary text-white shadow-[0_4px_0_0_#CFCFCF]">
                 <ShieldCheck className="h-6 w-6" />
               </div>
               <p className="max-w-lg text-[14px] text-gray-light font-medium">
                 Subscriptions are handled securely through Polar. Payment method updates, invoices, and cancellation flows should be managed from the Polar customer portal after billing is fully connected.
               </p>
               <Link to="/pricing">
                 <Button variant="outline" className="rounded-full gap-2 bg-white">
                   View pricing <ArrowRight className="w-4 h-4" />
                 </Button>
               </Link>
             </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border-color/50 rounded-[32px] overflow-hidden shadow-sm">
          <CardHeader className="p-8 border-b border-border-color/50">
            <CardTitle className="text-[18px] font-bold uppercase tracking-wide">Recent Credit Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingCredits ? (
              <div className="divide-y divide-border-color/50">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 p-5">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : creditLedger.length ? (
              <div className="divide-y divide-border-color/50">
                {creditLedger.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <p className="text-[13px] font-black uppercase tracking-[1px] text-gray-800">{item.reason.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-[12px] font-bold text-gray-400">{item.tool_type} • {new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[18px] font-black ${item.direction === "credit" ? "text-emerald-600" : "text-gray-950"}`}>
                        {item.direction === "credit" ? "+" : "-"}{item.credits}
                      </p>
                      <p className="text-[11px] font-bold text-gray-400">after {item.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-[14px] font-bold text-gray-400">No credit activity yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
