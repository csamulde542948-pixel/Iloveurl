import * as React from "react";
import { cn } from "./ui/utils";
import { Container } from "./container";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  noPadding?: boolean;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    { className, containerSize = "lg", noPadding = false, children, ...props },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className={cn(!noPadding && "py-16 md:py-24", className)}
        {...props}
      >
        <Container size={containerSize}>{children}</Container>
      </section>
    );
  }
);

Section.displayName = "Section";

export { Section };
