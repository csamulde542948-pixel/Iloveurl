import * as React from "react";
import { DashboardSidebar } from "../../components/dashboard/sidebar";
import { cn } from "../../components/ui/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 md:h-screen md:overflow-hidden">
      <DashboardSidebar />
      <main className={cn("min-w-0 flex-1 pb-24 pt-20 md:overflow-y-auto md:pb-0 md:pt-24", className)}>
        <div className="mx-auto max-w-[1440px] p-4 sm:p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
