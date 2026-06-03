import * as React from "react";
import { cn } from "./ui/utils";
import { Heart } from "lucide-react";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizeClasses = {
  sm: {
    base: "text-xl",
    suffix: "text-[12px]",
  },
  md: {
    base: "text-3xl",
    suffix: "text-[14px]",
  },
  lg: {
    base: "text-5xl",
    suffix: "text-[20px]",
  },
};

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", showTagline = false, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
        <div className="flex items-baseline gap-0">
          <span className={cn("font-display font-black lowercase text-primary tracking-tighter", sizeClasses[size].base)}>
            iLoveURL
          </span>
          <span className={cn("font-display font-medium text-primary opacity-70", sizeClasses[size].suffix)}>
            .space
          </span>
        </div>
        {showTagline && (
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Any URL. Anything.
          </p>
        )}
      </div>
    );
  }
);

Logo.displayName = "Logo";

export { Logo };
