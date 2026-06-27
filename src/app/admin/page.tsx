"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError } from "@/admin/lib/api";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState } from "@/admin/components/ui/empty-state";
import { StatCard } from "@/admin/components/ui/stat-card";
import { StatusBadge } from "@/admin/components/ui/status-badge";

const RECENT_ORDER_QUERY = "orderBy[0][field]=createdAt&orderBy[0][direction]=DESC";

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

interface EmployeeItem {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  enabled?: boolean;
  createdAt?: string;
}

interface RoleItem {
  id: string;
  name: string;
  key: string;
}

interface ActivityItem {
  id: string;
  action: string;
  modelName: string;
  payload?: Record<string, unknown> | null;
  user?: { name?: string } | null;
  createdAt: string;
}

export default function Page() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [rolesCount, setRolesCount] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  const recentActivities = useMemo(() => activities.slice(0, 6), [activities]);

  return (
    <div className="space-y-6">
      <section className="grid gap-px border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] sm:grid-cols-3">
        <StatCard label="Users" value={String(usersCount)} tone="default" />
        <StatCard label="Active Users" value={String(activeUsersCount)} tone="secondary" />
        <StatCard label="Roles" value={String(rolesCount)} tone="default" />
      </section>

      {errorMessage ? (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white px-6 py-10">
          <EmptyState title="Dashboard unavailable" description={errorMessage} />
        </section>
      ) : null}

      <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] px-4 py-3 sm:px-5">
          <h2 className="admin-headline text-[1.4rem] text-primary">Recent Activity Logs</h2>
          <Link href="/admin/activity-logs" className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary">
            View All Logs
          </Link>
        </div>

        <DataTable columns={["Actor", "Action", "Module", "Details", "Time"]}>
          {isLoading ? (
            <LoadingRow colSpan={5} label="Loading activity..." />
          ) : recentActivities.length > 0 ? (
            recentActivities.map((item) => (
              <tr key={item.id} className="admin-table-row">
                <td className="px-4 py-3 text-[12px] font-semibold text-primary">{item.user?.name || "System"}</td>
                <td className="px-4 py-3 text-[12px] text-muted-foreground">{formatLabel(item.action)}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={formatLabel(item.modelName)} tone="muted" />
                </td>
                <td className="px-4 py-3 text-[12px] text-muted-foreground">{getActivityDetails(item)}</td>
                <td className="px-4 py-3 text-[12px] text-muted-foreground">{formatDateTime(item.createdAt)}</td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={5} title="No activity yet" />
          )}
        </DataTable>
      </section>
    </div>
  );

  async function loadDashboard() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [usersResponse, rolesResponse, activityResponse] = await Promise.all([
        apiRequest<CollectionResponse<EmployeeItem>>(`/employees/get-employees?top=5&${RECENT_ORDER_QUERY}`),
        apiRequest<CollectionResponse<RoleItem>>("/roles/get-roles"),
        apiRequest<CollectionResponse<ActivityItem>>(`/activities/get-activities?top=6&${RECENT_ORDER_QUERY}`),
      ]);

      const users = usersResponse.data || [];
      setActivities(activityResponse.data || []);
      setUsersCount(usersResponse.count ?? users.length);
      setActiveUsersCount(users.filter((user) => user.enabled !== false).length);
      setRolesCount(rolesResponse.count ?? rolesResponse.data?.length ?? 0);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load dashboard."));
    } finally {
      setIsLoading(false);
    }
  }
}

function LoadingRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}

function EmptyRow({ colSpan, title }: { colSpan: number; title: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10">
        <EmptyState title={title} description="Activity appears here after users create, update, archive, or restore records." />
      </td>
    </tr>
  );
}

function getActivityDetails(item: ActivityItem) {
  const payloadName =
    typeof item.payload?.name === "string"
      ? item.payload.name
      : typeof item.payload?.title === "string"
        ? item.payload.title
        : null;

  return payloadName || formatLabel(item.modelName);
}

function formatLabel(value?: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
