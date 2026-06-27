import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/admin/lib/utils";

interface ActionButtonProps extends ComponentPropsWithoutRef<"button"> {
  children: ReactNode;
  tone?: "primary" | "secondary";
}

export function actionButtonClass(tone: "primary" | "secondary" = "primary") {
  return cn(
    "inline-flex appearance-none items-center justify-center gap-2 whitespace-nowrap rounded-none border-0 px-5 py-3 text-sm font-semibold leading-none no-underline transition",
    tone === "primary" && "bg-primary !text-white hover:bg-[var(--brand-navy)]",
    tone === "secondary" && "bg-[var(--surface-mid)] !text-primary hover:bg-[var(--surface-high)]",
  );
}

export function ActionButton({ children, className, tone = "primary", type = "button", ...props }: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(actionButtonClass(tone), className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface ActionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  tone?: "primary" | "secondary";
}

export function ActionLink({ href, children, className, tone = "primary" }: ActionLinkProps) {
  return (
    <Link href={href} className={cn(actionButtonClass(tone), className)}>
      {children}
    </Link>
  );
}
