"use client";

import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  label?: string;
  fullScreen?: boolean;
  className?: string;
};

export function LoadingSpinner({
  label = "Chargement en cours...",
  fullScreen = false,
  className
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-slate-600",
        fullScreen && "min-h-screen",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
