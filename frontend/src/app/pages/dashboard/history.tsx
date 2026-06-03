import * as React from "react";
import { DashboardLayout } from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { 
  History as HistoryIcon,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Eye,
  Trash2,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../components/auth-provider";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "../../components/ui/skeleton";

export function DashboardHistory() {
  const [search, setSearch] = React.useState("");
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user, session } = useAuth();

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
      } catch (error) {
        console.error(error);
        toast.error("Could not load your history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, session?.access_token]);

  const filteredHistory = history.filter(item => 
    item.payload?.url?.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase())
  );

  const getToolDisplayName = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getModeDisplay = (item: any) => {
    return item.result?.usage?.mode || item.payload?.mode || "n/a";
  };

  const getCreditsUsed = (item: any) => {
    const credits = Number(item.credits_used ?? 0);
    return Number.isFinite(credits) ? credits : 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-display text-primary leading-tight">Transformation <span className="font-bold">History</span></h1>
          <p className="text-[15px] text-gray-light mt-1 font-medium">Manage and export your previously processed documents.</p>
        </div>

        <Card className="overflow-hidden rounded-[28px] border-2 border-border-color/50 shadow-sm md:rounded-[32px]">
          <CardHeader className="border-b border-border-color/50 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative w-full flex-1 md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search by URL or tool name..." 
                  className="pl-11 h-12 rounded-full border-border-color bg-gray-50/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Button variant="outline" size="sm" className="h-10 rounded-full px-4 gap-2">
                  <Filter className="w-4 h-4" /> Filter
                </Button>
                <Button variant="outline" size="sm" className="h-10 rounded-full px-4 gap-2">
                  <ArrowUpDown className="w-4 h-4" /> Sort
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <>
              <div className="space-y-3 p-4 md:hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="rounded-[24px] border border-border-color/60 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-7 w-32 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                    <Skeleton className="mt-4 h-4 w-full" />
                    <div className="mt-4 flex justify-end gap-2">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
              <table className="hidden w-full border-collapse text-left md:table">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-border-color/50">
                    {["Date", "Tool", "Mode", "Credits", "Source URL", "Status", "Actions"].map((heading) => (
                      <th key={heading} className="px-8 py-4 text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/60 text-left last:text-right">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-8 py-5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-8 py-5"><Skeleton className="h-7 w-28 rounded-full" /></td>
                      <td className="px-8 py-5"><Skeleton className="h-7 w-20 rounded-full" /></td>
                      <td className="px-8 py-5"><Skeleton className="h-7 w-16 rounded-full" /></td>
                      <td className="px-8 py-5"><Skeleton className="h-4 w-64" /></td>
                      <td className="px-8 py-5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <Skeleton className="h-9 w-9 rounded-full" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            ) : (
              <>
              <div className="space-y-3 p-4 md:hidden">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-border-color/60 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[1px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                        <p className="mt-1 text-[16px] font-black text-primary">{getToolDisplayName(item.type)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black capitalize ${item.status === 'completed' ? 'bg-green-50 text-green-600' : item.status === 'processing' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 break-all text-[12px] font-semibold leading-relaxed text-gray-500">{item.payload?.url}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-50 px-3 py-1 text-[11px] font-black lowercase text-gray-500">{getModeDisplay(item)}</span>
                      <span className="rounded-full bg-primary/5 px-3 py-1 text-[11px] font-black text-primary">{getCreditsUsed(item)} credits</span>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      {item.status === 'completed' ? (
                        <Link to={`/tool/${item.type}?taskId=${item.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-gray-50 text-gray-500 hover:text-primary" title="View Result">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-200" disabled>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <a href={item.payload?.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-gray-50 text-gray-500 hover:text-primary" title="Open Source">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-gray-50 text-gray-500 hover:text-destructive" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <table className="hidden w-full border-collapse text-left md:table">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-border-color/50">
                    <th className="px-8 py-4 text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/60">Date</th>
                    <th className="px-8 py-4 text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/60">Tool</th>
                    <th className="px-8 py-4 text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/60">Mode</th>
                    <th className="px-8 py-4 text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/60">Credits</th>
                    <th className="px-8 py-4 text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/60">Source URL</th>
                    <th className="px-8 py-4 text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/60">Status</th>
                    <th className="px-8 py-4 text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text/60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-5 text-[14px] font-bold text-gray-text">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/10">
                          {getToolDisplayName(item.type)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-[12px] font-black lowercase tracking-wide border border-gray-100">
                          {getModeDisplay(item)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex min-w-12 items-center justify-center rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[12px] font-black text-primary">
                          {getCreditsUsed(item)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[14px] text-gray-light font-medium truncate max-w-[250px]">
                        {item.payload?.url}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {item.status === 'processing' ? (
                            <Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
                          )}
                          <span className={`text-[13px] font-bold capitalize ${item.status === 'completed' ? 'text-green-600' : item.status === 'processing' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {item.status}
                          </span>
                        </div>
                        {item.status === 'failed' && item.result?.error && (
                          <p className="mt-1 max-w-[220px] truncate text-[11px] font-semibold text-red-500" title={item.result.errorDetail || item.result.error}>
                            {item.result.error}
                          </p>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === 'completed' ? (
                            <Link to={`/tool/${item.type}?taskId=${item.id}`}>
                              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-gray-50 text-gray-500 hover:text-primary" title="View Result">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-gray-200 cursor-not-allowed" disabled>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <a href={item.payload?.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-gray-50 text-gray-500 hover:text-primary" title="Open Source">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-gray-50 text-gray-500 hover:text-destructive" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
            
            {!loading && filteredHistory.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mx-auto">
                  <HistoryIcon className="w-8 h-8" />
                </div>
                <p className="text-gray-light font-medium">No transformation history found.</p>
                <Link to="/">
                  <Button variant="outline" className="rounded-full mt-4">Start Transforming</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
