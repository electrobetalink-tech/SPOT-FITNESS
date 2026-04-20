"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ToastNotification, type ToastNotificationData, type ToastVariant } from "@/components/toast-notification";

type ShowToastInput = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  showToast: (input: ShowToastInput) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotificationData[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = "info", duration = 5000 }: ShowToastInput) => {
      const id = crypto.randomUUID();
      const toast: ToastNotificationData = {
        id,
        title,
        message,
        variant,
        duration
      };

      setToasts((current) => [...current, toast]);

      if (duration > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast
    }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div className="pointer-events-auto" key={toast.id}>
            <ToastNotification onClose={dismissToast} toast={toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast doit être utilisé dans ToastProvider");
  }

  return context;
}
