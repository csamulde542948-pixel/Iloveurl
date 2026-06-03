import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-nav-text placeholder:font-medium selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-border-color flex h-12 w-full min-w-0 rounded-xl border-2 px-4 py-2.5 text-[15px] font-semibold bg-white transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary",
        "aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
