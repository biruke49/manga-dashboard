"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession, getCurrentUser } from "@/admin/lib/api";
import { Sidebar } from "@/admin/components/layout/sidebar";
import { Topbar } from "@/admin/components/layout/topbar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      try {
        await getCurrentUser({ skipAuthRefresh: true });
        if (!cancelled) {
          setIsCheckingAuth(false);
        }
      } catch {
        clearAuthSession();
        if (!cancelled) {
          setIsCheckingAuth(false);
          window.location.replace(`/login?reason=expired&next=${encodeURIComponent(pathname)}`);
        }
      }
    }

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-low)]">
        <div className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white px-8 py-6 text-center shadow-[0_18px_36px_rgba(27,28,25,0.08)]">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
            Authenticating
          </p>
          <p className="mt-3 text-sm text-primary">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <Topbar onMenuToggle={() => setSidebarOpen((open) => !open)} />
      <main className="admin-page-shell min-h-screen pt-16 lg:ml-64">
        <div className="admin-content px-4 pb-8 pt-5 sm:px-6 sm:pt-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
