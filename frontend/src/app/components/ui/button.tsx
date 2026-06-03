import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase transition-all disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-0 cursor-pointer active:translate-y-1",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--brand-primary-shadow)] active:shadow-none hover:brightness-105",
        destructive:
          "bg-destructive text-white shadow-[0_4px_0_0_var(--destructive-shadow)] active:shadow-none hover:brightness-105",
        outline:
          "border-2 border-[#CFCFCF] bg-transparent text-primary shadow-[0_4px_0_0_#CFCFCF] active:shadow-none hover:brightness-95",
        secondary:
          "bg-white text-primary shadow-[0_4px_0_0_#88879F] active:shadow-none hover:bg-[#c8f040]",
        ghost:
          "bg-transparent text-primary shadow-none hover:bg-primary/8 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline shadow-none active:translate-y-0",
      },
      size: {
        default: "h-12 px-6 text-[15px] rounded-xl",
        sm: "h-9 px-4 text-[13px] rounded-[10px] shadow-[0_3px_0_0_var(--brand-primary-shadow)]",
        lg: "h-12 px-6 text-[15px] rounded-xl",
        icon: "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
