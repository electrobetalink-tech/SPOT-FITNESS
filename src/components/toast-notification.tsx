"use client";

import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastNotificationData {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastNotificationData;
  onClose: (id: string) => void;
}

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-orange-200 bg-orange-50 text-orange-900"
};

const variantIcons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle
};

export function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  const Icon = variantIcons[toast.variant];

  return (
    <article className={`w-full rounded-lg border p-4 shadow-sm ${variantStyles[toast.variant]}`} role="status">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{toast.title}</h3>
          {toast.message ? <p className="mt-1 text-sm opacity-90">{toast.message}</p> : null}
        </div>

        <button
          aria-label="Fermer la notification"
          className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
          onClick={() => onClose(toast.id)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
