"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError, hasStoredPermission } from "@/admin/lib/api";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState } from "@/admin/components/ui/empty-state";
import { Pagination } from "@/admin/components/ui/pagination";
import { SearchInput } from "@/admin/components/ui/search-input";
import { StatusBadge } from "@/admin/components/ui/status-badge";

const RECENT_ORDER_QUERY = "orderBy[0][field]=createdAt&orderBy[0][direction]=DESC";

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
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
  const canManageActivities = hasStoredPermission("manage-activities");
  const [query, setQuery] = useState("");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return activities.filter((item) => {
      const actor = item.user?.name || "system";
      const details = getActivityDetails(item);

      return (
        normalized.length === 0 ||
        actor.toLowerCase().includes(normalized) ||
        formatLabel(item.action).toLowerCase().includes(normalized) ||
        details.toLowerCase().includes(normalized) ||
        formatLabel(item.modelName).toLowerCase().includes(normalized)
      );
    });
  }, [activities, query]);

  return (
    <div>
      {!canManageActivities ? (
        <EmptyState title="Access denied" description="You do not have permission to view activity logs." />
      ) : (
      <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-[280px]">
          <SearchInput placeholder="SEARCH ACTIVITY..." value={query} onChange={setQuery} />
        </div>
      </div>

      <DataTable columns={["Actor", "Action", "Details", "Type", "Timestamp"]}>
        {isLoading ? (
          <tr>
            <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
              Loading activity...
            </td>
          </tr>
        ) : errorMessage ? (
          <tr>
            <td colSpan={5} className="px-6 py-10">
              <EmptyState title="Activity unavailable" description={errorMessage} />
            </td>
          </tr>
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map((item) => (
            <tr key={item.id} className="admin-table-row transition-colors">
              <td className="px-4 py-3 text-[12px] font-semibold text-brand-navy">{item.user?.name || "System"}</td>
              <td className="px-4 py-3 text-[12px] text-muted-foreground">{formatLabel(item.action)}</td>
              <td className="px-4 py-3 text-[12px] text-muted-foreground">{getActivityDetails(item)}</td>
              <td className="px-4 py-3">
                <StatusBadge label={formatLabel(item.modelName)} tone="muted" />
              </td>
              <td className="px-4 py-3 text-[12px] text-muted-foreground">{formatDate(item.createdAt)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="px-6 py-10">
              <EmptyState title="No activity yet" description="Operations activity will appear here after records are changed." />
            </td>
          </tr>
        )}
      </DataTable>

      <Pagination summary={`Displaying 1 - ${filteredActivities.length} of ${activities.length} logged events`} />
      </>
      )}
    </div>
  );

  async function loadActivities() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiRequest<CollectionResponse<ActivityItem>>(`/activities/get-activities?${RECENT_ORDER_QUERY}`);
      setActivities(response.data || []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load activity logs."));
    } finally {
      setIsLoading(false);
    }
  }
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

function formatDate(value?: string) {
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
