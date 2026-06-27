"use client";

import type { ReactNode } from "react";
import { CloseIcon } from "@/admin/lib/icons";
import { cn } from "@/admin/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  tone?: "default" | "danger";
  panelClassName?: string;
  bodyClassName?: string;
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  tone = "default",
  panelClassName,
  bodyClassName,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className={cn("flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col bg-white shadow-[0_20px_40px_rgba(27,28,25,0.08)]", panelClassName)}>
        <div className={cn("flex items-start justify-between border-l-4 px-6 py-5", tone === "danger" ? "border-l-error" : "border-l-secondary")}>
          <div>
            <h2 className="admin-headline text-2xl text-primary">{title}</h2>
            {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 transition hover:text-primary" aria-label="Close modal">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 pb-6", bodyClassName)}>{children}</div>
        {footer ? <div className="border-t border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
