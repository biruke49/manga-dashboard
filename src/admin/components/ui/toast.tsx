"use client";

import { AlertTriangleIcon, CheckCircleIcon, CloseIcon, HelpIcon } from "@/admin/lib/icons";
import { cn } from "@/admin/lib/utils";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  tone: "success" | "error" | "warning" | "info";
}

const toneStyles = {
  success: {
    border: "border-l-[var(--success)]",
    icon: CheckCircleIcon,
    iconColor: "text-[var(--success)]",
  },
  error: {
    border: "border-l-error",
    icon: AlertTriangleIcon,
    iconColor: "text-error",
  },
  warning: {
    border: "border-l-secondary",
    icon: AlertTriangleIcon,
    iconColor: "text-secondary",
  },
  info: {
    border: "border-l-primary",
    icon: HelpIcon,
    iconColor: "text-primary",
  },
};

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed right-4 top-20 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = toneStyles[toast.tone].icon;

        return (
          <div key={toast.id} className={cn("border-l-4 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(27,28,25,0.08)]", toneStyles[toast.tone].border)}>
            <div className="flex items-start gap-3">
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", toneStyles[toast.tone].iconColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold uppercase tracking-[0.1em] text-primary">{toast.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{toast.message}</p>
              </div>
              <button type="button" onClick={() => onDismiss(toast.id)} className="text-slate-400 transition hover:text-primary" aria-label="Dismiss toast">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
