import * as React from "react";
import { DashboardLayout } from "./dashboard-layout";
import { useAuth } from "../../components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { 
  BarChart3, 
  Clock, 
  Link as LinkIcon, 
  FileText,
  Plus,
  History as HistoryIcon,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { UsageMeter } from "../../components/dashboard/usage-meter";
import { toast } from "sonner";
import { Skeleton } from "../../components/ui/skeleton";

export function DashboardOverview() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = React.useState<any[]>([]);
  const [credits, setCredits] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) return;

    const fetchHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const response = await fetch(`${apiUrl}/api/tasks/history/${user.id}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });
        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        setHistory(data);
        const creditsResponse = await fetch(`${apiUrl}/api/credits/me`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });
        if (creditsResponse.ok) setCredits(await creditsResponse.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, session?.access_token]);

  const totalUrls = history.length;
  const totalDocs = history.filter(h => ["cover-letter", "resume", "article-summary", "seo-analyzer", "brand-analyzer"].includes(h.type)).length;
  const recentTasks = history.slice(0, 5);
  const monthlyAllowance = credits?.monthly_allowance || 50;
  const topupRemaining = credits?.topup_credits_remaining || 0;
  const monthlyRemaining = Math.max((credits?.credits_remaining || 0) - topupRemaining, 0);
  const monthlyUsed = Math.max(monthlyAllowance - monthlyRemaining, 0);

  const stats = [
    { name: "Total Processed", value: totalUrls.toString(), icon: LinkIcon, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "Documents", value: totalDocs.toString(), icon: FileText, iconColor: "text-purple-500", bg: "bg-purple-50" },
    { name: "Credits Left", value: credits?.credits_remaining?.toString() || "", icon: BarChart3, iconColor: "text-orange-500", bg: "bg-orange-50" },
    { name: "Efficiency", value: "98%", icon: Clock, iconColor: "text-green-500", bg: "bg-green-50" },
  ];

  const getToolDisplayName = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 md:space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-display text-primary leading-tight">
              Welcome back, <span className="font-bold lowercase">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-[15px] text-gray-light mt-1 font-medium">
              Here's what's happening with your URLs today.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/')} 
            className="h-12 w-full rounded-full px-8 shadow-[0_4px_0_0_#CFCFCF] sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> TRANSFORM NEW URL
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat) => (
            <Card key={stat.name} className="overflow-hidden rounded-[24px] border-2 border-border-color/50 shadow-sm transition-all hover:shadow-md md:rounded-3xl">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.iconColor || stat.color)} />
                  </div>
                  <div>
                    <p className="text-[12px] font-extrabold uppercase tracking-wider text-nav-text/60">
                      {stat.name}
                    </p>
                    {loading ? (
                      <Skeleton className="mt-2 h-7 w-16 rounded-xl" />
                    ) : (
                      <p className="text-[24px] font-bold text-gray-text">
                        {stat.value}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <Card className="overflow-hidden rounded-[28px] border-2 border-border-color/50 shadow-sm md:rounded-[32px] lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-color/50 p-5 md:p-8">
              <CardTitle className="flex items-center gap-3 text-[15px] font-bold uppercase tracking-wide md:text-[18px]">
                <Clock className="w-5 h-5 text-primary" />
                Recent Transformations
              </CardTitle>
              <Link to="/dashboard/history" className="text-[12px] font-bold text-primary hover:underline">VIEW ALL</Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-20 flex justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : recentTasks.length > 0 ? (
                <div className="divide-y divide-border-color/50">
                  {recentTasks.map((task) => (
                    <Link 
                      key={task.id} 
                      to={`/tool/${task.type}?taskId=${task.id}`}
                      className="group flex items-center justify-between p-4 transition-colors hover:bg-gray-50/50 md:p-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                          {task.status === 'processing' ? (
                            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                          ) : (
                            <FileText className={`w-5 h-5 ${task.status === 'completed' ? 'text-gray-400 group-hover:text-primary' : 'text-red-400'} transition-colors`} />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-gray-text flex items-center gap-2">
                            {getToolDisplayName(task.type)}
                            {task.status === 'processing' && (
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Processing</span>
                            )}
                            {task.status === 'failed' && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Failed</span>
                            )}
                          </p>
                          <p className="text-[12px] text-gray-light truncate max-w-[200px] md:max-w-[400px]">{task.payload?.url}</p>
                          {task.status === 'failed' && task.result?.error && (
                            <p className="text-[11px] text-red-500 font-semibold truncate max-w-[200px] md:max-w-[400px]" title={task.result.errorDetail || task.result.error}>
                              {task.result.error}
                            </p>
                          )}
                        </div>
                      </div>
                      {task.status === 'completed' ? (
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                      ) : (
                        <div className="w-5 h-5" />
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 p-10 text-center md:p-20">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                    <HistoryIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-text">No activity yet</h3>
                    <p className="text-[14px] text-gray-light max-w-xs mx-auto">
                      Start transforming URLs to see your history here.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/')} className="rounded-full">EXPLORE TOOLS</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border-2 border-border-color/50 bg-primary/5 shadow-sm md:rounded-[32px]">
            <CardHeader className="border-b border-border-color/50 p-5 md:p-8">
              <CardTitle className="text-[18px] font-bold uppercase tracking-wide">Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-5 md:p-8">
              {loading ? (
                <>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-28 rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <Skeleton className="h-3 w-36" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-nav-text/60">Current Plan</p>
                    <p className="text-[20px] font-black text-primary uppercase">{credits?.plan_key || "Free"} Tier</p>
                  </div>
                  
                  <div className="space-y-4">
                    <UsageMeter
                      used={monthlyUsed}
                      limit={monthlyAllowance}
                      label="Monthly Credits Used"
                    />
                  </div>
                </>
              )}

              <Link to="/dashboard/billing">
                <Button className="w-full rounded-full shadow-[0_4px_0_0_#CFCFCF] h-12 uppercase font-bold tracking-wider">
                  Manage Credits
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
