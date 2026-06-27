import { cn } from "@/admin/lib/utils";

interface StatusBadgeProps {
  label: string;
  tone?: "primary" | "secondary" | "muted" | "error" | "navy" | "copper";
}

export function StatusBadge({ label, tone = "primary" }: StatusBadgeProps) {
  const resolvedTone = tone === "navy" ? "primary" : tone === "copper" ? "secondary" : tone;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em]",
        resolvedTone === "primary" && "bg-primary/5 text-primary",
        resolvedTone === "secondary" && "bg-secondary/10 text-secondary",
        resolvedTone === "muted" && "bg-black/5 text-muted-foreground",
        resolvedTone === "error" && "bg-error/10 text-error",
      )}
    >
      {label}
    </span>
  );
}
