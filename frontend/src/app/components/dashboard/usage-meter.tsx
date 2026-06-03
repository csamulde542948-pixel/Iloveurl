import * as React from "react";
import { Progress } from "../ui/progress";
import { cn } from "../ui/utils";

interface UsageMeterProps {
  used: number;
  limit: number;
  label?: string;
  className?: string;
}

export function UsageMeter({ used, limit, label = "Plan Usage", className }: UsageMeterProps) {
  const safeLimit = Math.max(limit, 1);
  const safeUsed = Math.max(used, 0);
  const percentage = Math.min(Math.round((safeUsed / safeLimit) * 100), 100);
  
  // Determine color based on usage percentage
  let progressColor = "bg-primary";
  if (percentage > 90) progressColor = "bg-destructive";
  else if (percentage > 70) progressColor = "bg-orange-500";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-nav-text/60">
          {label}
        </span>
        <span className="text-[12px] font-bold text-primary">
          {safeUsed} / {limit}
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" indicatorClassName={progressColor} />
      <p className="text-[10px] text-gray-light font-medium uppercase tracking-tight">
        {percentage}% of your monthly limit used
      </p>
    </div>
  );
}
