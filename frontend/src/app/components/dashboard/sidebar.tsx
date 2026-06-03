import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../ui/utils";
import { 
  LayoutDashboard, 
  History, 
  FileText,
  Settings, 
  CreditCard, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../auth-provider";
import { UsageMeter } from "./usage-meter";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface SidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { signOut, user, session, loading: authLoading } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const [loadingCredits, setLoadingCredits] = React.useState(true);
  const [creditSummary, setCreditSummary] = React.useState<{
    plan_key: string;
    monthly_allowance: number;
    credits_remaining: number;
    topup_credits_remaining?: number;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadCreditSummary() {
      if (!session?.access_token) {
        setCreditSummary(null);
        setLoadingCredits(authLoading);
        return;
      }

      try {
        setLoadingCredits(true);
        const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const response = await fetch(`${api}/api/credits/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!response.ok) throw new Error("Could not load credit summary.");
        const data = await response.json();
        if (!cancelled) setCreditSummary(data);
      } catch {
        if (!cancelled) setCreditSummary(null);
      } finally {
        if (!cancelled) setLoadingCredits(false);
      }
    }

    loadCreditSummary();
    return () => {
      cancelled = true;
    };
  }, [authLoading, session?.access_token]);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "History", href: "/dashboard/history", icon: History },
    { name: "Resume", href: "/dashboard/resume", icon: FileText },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const monthlyAllowance = creditSummary?.monthly_allowance || 50;
  const totalRemaining = creditSummary?.credits_remaining ?? 50;
  const topupRemaining = creditSummary?.topup_credits_remaining || 0;
  const monthlyRemaining = Math.max(totalRemaining - topupRemaining, 0);
  const monthlyUsed = Math.max(monthlyAllowance - monthlyRemaining, 0);

  return (
    <aside 
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 flex rounded-[26px] border-2 border-border-color bg-white/95 shadow-[0_8px_0_0_#CFCFCF] backdrop-blur transition-all duration-300 md:relative md:inset-auto md:z-auto md:flex-col md:rounded-none md:border-0 md:border-r md:shadow-none md:pt-24",
        collapsed ? "md:w-20" : "md:w-64",
        className
      )}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-28 z-10 hidden rounded-full border border-border-color bg-white p-1 shadow-sm transition-colors hover:text-primary md:block"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="grid w-full grid-cols-5 gap-1 p-2 md:mt-4 md:flex md:flex-1 md:flex-col md:space-y-1 md:px-3 md:p-0">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "group flex min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2.5 no-underline transition-all md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3",
              isActive(item.href)
                ? "bg-primary/5 text-primary shadow-sm"
                : "text-nav-text hover:bg-gray-50 hover:text-primary"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 shrink-0",
              isActive(item.href) ? "text-primary" : "text-gray-400 group-hover:text-primary"
            )} />
            <span className={cn(
              "max-w-full truncate text-[9px] font-black uppercase tracking-[0.5px] md:text-[14px] md:font-bold md:tracking-wide",
              collapsed && "md:hidden"
            )}>
                {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer / Usage & Profile */}
      <div className="hidden space-y-6 border-t border-border-color p-4 md:block">
        {!collapsed && loadingCredits && (
          <div className="space-y-3 px-2">
            <div className="flex items-end justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        )}

        {!collapsed && !loadingCredits && (
          <UsageMeter
            used={monthlyUsed}
            limit={monthlyAllowance}
            label={`${creditSummary?.plan_key || "Free"} Usage`}
            className="px-2"
          />
        )}

        <div className={cn("flex flex-col gap-2", collapsed && "items-center")}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 mb-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-[12px] font-bold text-gray-500 uppercase">
                  {user?.email?.[0] ?? "U"}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-gray-text truncate">
                  {user?.email?.split('@')[0]}
                </span>
                <span className="text-[11px] text-gray-light truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className={cn(
              "w-full justify-start gap-3 text-nav-text hover:text-destructive hover:bg-destructive/5 rounded-xl",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-[13px] font-bold uppercase tracking-wide">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
