import * as React from "react";
import { Card } from "./ui/card";
import { cn } from "./ui/utils";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "./ui/skeleton";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Clock3,
  Code2,
  Crown,
  FileCheck2,
  FileSearch,
  FileText,
  GraduationCap,
  Link2,
  Map,
  MessageSquareText,
  Mic2,
  Network,
  Palette,
  Presentation,
  QrCode,
  ScanSearch,
  SearchCheck,
  Share2,
  Sparkles,
  Tags,
  Trophy,
  UsersRound,
  WandSparkles,
} from "lucide-react";

export type ToolCategory = "career" | "content" | "design" | "research" | "quick";

interface ToolCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  category?: ToolCategory;
  href?: string;
  badge?: string;
  toolId?: string;
  isLoading?: boolean;
}

const categoryConfig: Record<ToolCategory, { bg: string; soft: string; text: string; border: string; dot: string }> = {
  career: { bg: "bg-[#4F46E5]", soft: "bg-[#4F46E5]/[0.06]", text: "text-[#4F46E5]", border: "border-[#4F46E5]/15", dot: "bg-[#4F46E5]" },
  content: { bg: "bg-[#0EA5E9]", soft: "bg-sky-50", text: "text-[#0284C7]", border: "border-sky-100", dot: "bg-[#0EA5E9]" },
  design: { bg: "bg-[#8B5CF6]", soft: "bg-violet-50", text: "text-[#6D28D9]", border: "border-violet-100", dot: "bg-[#8B5CF6]" },
  research: { bg: "bg-[#10B981]", soft: "bg-emerald-50", text: "text-[#047857]", border: "border-emerald-100", dot: "bg-[#10B981]" },
  quick: { bg: "bg-[#F59E0B]", soft: "bg-amber-50", text: "text-[#B45309]", border: "border-amber-100", dot: "bg-[#F59E0B]" },
};

const toolIconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "cover-letter": FileCheck2,
  resume: BriefcaseBusiness,
  "interview-prep": UsersRound,
  "article-summary": FileText,
  "study-notes": GraduationCap,
  presentation: Presentation,
  "slide-deck": Presentation,
  "mind-map": Network,
  "podcast-script": Mic2,
  "brand-analyzer": Palette,
  "seo-analyzer": SearchCheck,
  "url-shortener": Link2,
  "qr-code": QrCode,
  "link-preview": Share2,
  "meta-tags": Tags,
  "utm-manager": Map,
  "url-cleaner": WandSparkles,
  "social-post": MessageSquareText,
  "geo-audit": Bot,
  "chat-url": MessageSquareText,
  "broken-links": ScanSearch,
  "tech-profiler": Code2,
  "sitemap-gen": Map,
  "cross-article": FileSearch,
};

function fallbackIcon(title: string) {
  if (/interview/i.test(title)) return UsersRound;
  if (/role fit|scorecard/i.test(title)) return Trophy;
  if (/battlecard|competitive/i.test(title)) return Trophy;
  if (/comparison/i.test(title)) return FileSearch;
  if (/api|quickstart/i.test(title)) return Code2;
  if (/changelog/i.test(title)) return FileText;
  return Sparkles;
}

function GeneratedToolIcon({ title, toolId, category, disabled }: { title: string; toolId?: string; category: ToolCategory; disabled: boolean }) {
  const config = categoryConfig[category] || categoryConfig.quick;
  const Icon = (toolId && toolIconMap[toolId]) || fallbackIcon(title);

  return (
    <div className={cn("relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] border-2 border-gray-950 bg-white shadow-[0_5px_0_0_#CFCFCF] sm:h-24 sm:w-24 sm:rounded-[26px] sm:shadow-[0_6px_0_0_#CFCFCF]", disabled && "grayscale")}>
      <div className={cn("absolute inset-0", disabled ? "bg-gray-100" : config.bg)} />
      <div className="relative flex h-full w-full items-center justify-center text-white">
        <Icon className="h-10 w-10 drop-shadow-sm sm:h-12 sm:w-12" strokeWidth={2.4} />
      </div>
    </div>
  );
}

const ToolCard = React.forwardRef<HTMLDivElement, ToolCardProps>(
  ({ className, title, description, icon, category = "quick", href, badge = "NEW", toolId, isLoading, onClick, ...props }, ref) => {
    const config = categoryConfig[category] || categoryConfig.quick;
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isLoading || badge === "SOON") return;
      if (toolId) {
        navigate(`/tool/${toolId}`);
      } else if (onClick) {
        onClick(e);
      }
    };

    if (isLoading) {
      return <ToolCardSkeleton category={category} />;
    }

    const isSoon = badge === "SOON";
    const isPremium = badge === "PREMIUM";
    const cardContent = (
      <Card
        ref={ref}
          className={cn(
          "group relative cursor-pointer overflow-hidden rounded-[24px] border-2 border-border-color bg-white shadow-[0_6px_0_0_#CFCFCF] transition-all duration-200 break-inside-avoid sm:rounded-[28px] sm:shadow-[0_8px_0_0_#CFCFCF]",
          isSoon
            ? "cursor-default opacity-70 shadow-[0_8px_0_0_#E5E7EB]"
            : "hover:-translate-y-1 hover:shadow-[0_12px_0_0_var(--brand-primary-shadow)] active:translate-y-2 active:shadow-none",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
            <div className={cn("shrink-0 transition-transform duration-300", !isSoon && "group-hover:-translate-y-1")}>
              <GeneratedToolIcon title={title} toolId={toolId} category={category} disabled={isSoon} />
            </div>
            {badge && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[1px]",
                  isSoon
                    ? "bg-gray-100 text-gray-400"
                    : isPremium
                      ? "border border-primary/20 bg-primary text-white shadow-[0_3px_0_0_var(--brand-primary-shadow)]"
                      : "bg-primary/5 text-primary"
                )}
              >
                {isSoon && <Clock3 className="h-3 w-3" />}
                {isPremium && <Crown className="h-3 w-3" />}
                {badge}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", isSoon ? "bg-gray-300" : config.dot)} />
              <span className={cn("text-[10px] font-black uppercase tracking-[1.5px]", isSoon ? "text-gray-300" : config.text)}>
                {category}
              </span>
            </div>
            <h3 className="text-[18px] font-black leading-tight text-gray-950 transition-colors group-hover:text-primary sm:text-[20px]">{title}</h3>
            {description && (
              <p className="mt-2 min-h-[40px] text-[13px] font-semibold leading-relaxed text-gray-500 line-clamp-2 sm:min-h-[42px] sm:text-[14px]">
                {description}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 sm:mt-5">
              <span className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-300">
                {isSoon ? "planned" : "ready"}
              </span>
              {isSoon ? (
                <span className="text-[11px] font-black uppercase tracking-[1px] text-gray-300">Soon</span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[1px] text-primary">
                  Open
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );

    if (href && !isSoon) {
      return (
        <a href={href} className="block no-underline">
          {cardContent}
        </a>
      );
    }

    return cardContent;
  }
);

function ToolCardSkeleton({ category }: { category: ToolCategory }) {
  const config = categoryConfig[category] || categoryConfig.quick;

  return (
    <Card className={cn("rounded-[28px] border p-5", config.border)}>
      <div className="mb-5 flex items-start justify-between">
        <Skeleton className="h-24 w-24 rounded-[24px]" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="mt-5 border-t border-gray-100 pt-4">
        <Skeleton className="h-3 w-20" />
      </div>
    </Card>
  );
}

ToolCard.displayName = "ToolCard";

export { ToolCard, ToolCardSkeleton };
