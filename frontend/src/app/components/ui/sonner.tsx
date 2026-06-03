"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ toastOptions, richColors: _richColors, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      {...props}
      theme={theme as ToasterProps["theme"]}
      richColors={false}
      className="toaster group"
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        closeButton: toastOptions?.closeButton ?? props.closeButton,
        classNames: {
          ...toastOptions?.classNames,
          toast:
            "group toast flex min-h-0 w-[min(92vw,390px)] items-center gap-3 rounded-xl border-0 bg-green-50 px-5 py-4 font-[var(--font-body)] text-gray-950 shadow-[0_4px_0_0_#16A34A] outline-none transition-all",
          content: "min-w-0 flex-1 text-gray-950",
          icon:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-current shadow-[0_2px_0_0_rgba(0,0,0,0.18)]",
          title:
            "font-[var(--font-display)] text-[18px] font-normal lowercase leading-none tracking-normal !text-gray-950",
          description:
            "mt-1 text-[12px] font-black leading-relaxed !text-gray-950",
          actionButton:
            "rounded-xl bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[1px] text-current shadow-[0_3px_0_0_rgba(0,0,0,0.2)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none",
          cancelButton:
            "rounded-xl border-2 border-current/20 bg-transparent px-4 py-2 text-[11px] font-black uppercase tracking-[1px] text-current shadow-none",
          closeButton:
            "rounded-xl border-0 bg-white text-current shadow-[0_3px_0_0_rgba(0,0,0,0.2)] transition-all active:translate-y-1 active:shadow-none",
          success:
            "bg-green-50 text-gray-950 shadow-[0_4px_0_0_#16A34A]",
          info:
            "bg-green-50 text-gray-950 shadow-[0_4px_0_0_#16A34A]",
          loading:
            "bg-green-50 text-gray-950 shadow-[0_4px_0_0_#16A34A]",
          error:
            "bg-red-50 text-gray-950 shadow-[0_4px_0_0_#DC2626]",
          warning:
            "bg-amber-50 text-gray-950 shadow-[0_4px_0_0_#D97706]",
        },
      }}
    />
  );
};

export { Toaster };
