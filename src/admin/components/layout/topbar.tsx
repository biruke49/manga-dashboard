"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { getStoredProfile, hasStoredPermission } from "@/admin/lib/api";
import { MenuIcon } from "@/admin/lib/icons";
import { adminNavigation } from "@/admin/mock/navigation";

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const visibleNavigation = adminNavigation.filter(
    (item) =>
      !item.requiredPermissions ||
      hasStoredPermission(item.requiredPermissions),
  );
  const activeItem = adminNavigation.find((item) => item.href === pathname) ?? visibleNavigation[0] ?? adminNavigation[0];
  const profile = getStoredProfile();
  const profileName = profile?.name || "Dashboard User";
  const profileRole = profile?.currentRole?.name || profile?.type || "Employee";

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200/50 bg-white/85 backdrop-blur-md lg:left-64">
      <div className="flex h-full items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-10 w-10 items-center justify-center text-primary lg:hidden"
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground md:block">
            {activeItem.label}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-3 border-l border-slate-200/70 pl-5 sm:flex">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase leading-none tracking-tight text-primary">{profileName}</p>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-secondary">{profileRole}</p>
            </div>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfr1twACcffVpnVZiD0uOwmPWeWouIsaReiicII9mPqTLvIc4MFqvzZSamCIr1Nb1RBj5UY6rG1IseKxkHzKiYIcSfQ-s69UcwNR9JzLe39AefZr-a5s1wG2Cbvt06Npr_GwdjJTA517q733fMUos6vm5VOt-g3OtXZmL13ZqFfu8Y2TEdDKvFCyNW-UYsugXtSB9RjlaB_wytvfS53Y5Ziiz_UvXqZzIwcn1-PY3UgMO7vRRlnwBJlpJRa7ajkye2H5P4HK1a8MT0"
              alt={profileName}
              width={32}
              height={32}
              className="h-8 w-8 border border-primary object-cover grayscale"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
