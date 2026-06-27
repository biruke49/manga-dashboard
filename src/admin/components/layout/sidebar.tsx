"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoutIcon } from "@/admin/lib/icons";
import { hasStoredPermission, logout } from "@/admin/lib/api";
import { cn } from "@/admin/lib/utils";
import { adminNavigation } from "@/admin/mock/navigation";

interface SidebarProps {
  open: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const visibleNavigation = adminNavigation.filter(
    (item) =>
      !item.requiredPermissions ||
      hasStoredPermission(item.requiredPermissions),
  );

  return (
    <aside
      className={cn(
        "admin-sidebar-surface fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col overflow-hidden border-r border-black/0 px-0 py-6 transition-transform duration-200 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="shrink-0 px-8 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-sm font-semibold text-white">
            Y
          </span>
          <span className="text-xl font-semibold tracking-[0.04em] text-primary">
            YISHAK
          </span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-[var(--surface-panel)] to-transparent" />
        <nav className="h-full overflow-y-auto px-0 pb-24 pt-6 [scrollbar-width:thin]">
          <div className="space-y-1">
            {visibleNavigation.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 py-3 pr-5 text-sm transition-colors",
                    active
                      ? "border-l-4 border-secondary bg-[var(--surface-low)] pl-4 font-bold text-secondary"
                      : "pl-5 font-medium text-slate-500 hover:bg-[var(--surface-low)] hover:text-primary",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-[var(--surface-panel)] to-transparent" />
      </div>

      <div className="shrink-0 border-t border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-[var(--surface-panel)]/95 px-4 pb-2 pt-2 backdrop-blur-sm">
        <button
          className="flex w-full items-center gap-3 px-4 py-4 text-sm font-medium text-slate-500 transition hover:bg-[var(--surface-low)] hover:text-primary"
          onClick={async () => {
            try {
              await logout();
            } catch {
              // Clearing local auth state and redirecting is enough for the dashboard UI.
            }
            router.replace("/login");
            router.refresh();
          }}
        >
          <LogoutIcon className="h-[18px] w-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
