import * as React from "react";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { Briefcase, FileText, Palette, Search, Zap } from "lucide-react";

export type ToolCategory = "career" | "content" | "design" | "research" | "quick";

interface CategoryBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  category?: ToolCategory;
  showIcon?: boolean;
}

const categoryConfig: Record<
  ToolCategory,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    textColor: string;
  }
> = {
  career: {
    label: "Career Tools",
    icon: Briefcase,
    bgColor: "bg-[#7C3AED]/12",
    textColor: "text-[#7C3AED]",
  },
  content: {
    label: "Content Tools",
    icon: FileText,
    bgColor: "bg-[#0EA5E9]/12",
    textColor: "text-[#0EA5E9]",
  },
  design: {
    label: "Brand & Design",
    icon: Palette,
    bgColor: "bg-[#F97316]/12",
    textColor: "text-[#F97316]",
  },
  research: {
    label: "Research Tools",
    icon: Search,
    bgColor: "bg-[#10B981]/12",
    textColor: "text-[#10B981]",
  },
  quick: {
    label: "Quick Tools",
    icon: Zap,
    bgColor: "bg-[#F59E0B]/12",
    textColor: "text-[#F59E0B]",
  },
};

const CategoryBadge = React.forwardRef<HTMLDivElement, CategoryBadgeProps>(
  ({ className, category = "quick", showIcon = true, ...props }, ref) => {
    const config = categoryConfig[category] || categoryConfig.quick;
    const Icon = config.icon;

    return (
      <Badge
        ref={ref}
        variant="secondary"
        className={cn(
          "gap-2 px-[10px] py-1 border-0 rounded-[20px]",
          config.bgColor,
          config.textColor,
          className
        )}
        {...props}
      >
        {showIcon && <Icon className="w-4 h-4" />}
        <span className="text-xs font-extrabold uppercase tracking-wide">{config.label}</span>
      </Badge>
    );
  }
);

CategoryBadge.displayName = "CategoryBadge";

export { CategoryBadge };
