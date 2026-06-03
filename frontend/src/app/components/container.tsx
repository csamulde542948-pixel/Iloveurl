import * as React from "react";
import { cn } from "./ui/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[1400px]",
  full: "max-w-full",
};

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "lg", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mx-auto px-6 w-full", sizeClasses[size], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

export { Container };
