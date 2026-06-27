import { cn } from "@/admin/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  note?: string;
  tone?: "default" | "secondary" | "error" | "primary";
}

export function StatCard({ label, value, note, tone = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "border-r border-[color:color-mix(in_srgb,var(--border)_22%,transparent)] px-4 py-4 last:border-r-0 sm:px-5 sm:py-4",
        tone === "default" && "bg-[var(--surface-low)]",
        tone === "secondary" && "bg-background",
        tone === "error" && "bg-background",
        tone === "primary" && "bg-[var(--surface-low)]",
      )}
    >
      <p
        className={cn(
          "text-[9px] font-black uppercase tracking-[0.2em]",
          tone === "secondary" ? "text-secondary" : tone === "error" ? "text-error" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <span
          className={cn(
            "admin-headline text-[2.25rem] leading-none sm:text-[2.5rem]",
            tone === "secondary" ? "text-secondary" : tone === "error" ? "text-error" : "text-primary",
          )}
        >
          {value}
        </span>
        {note ? <span className="bg-[var(--surface-high)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-secondary">{note}</span> : null}
      </div>
    </div>
  );
}
