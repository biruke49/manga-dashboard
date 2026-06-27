"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/admin/lib/api";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState, TableEmptyState } from "@/admin/components/ui/empty-state";
import { StatusBadge } from "@/admin/components/ui/status-badge";

interface ReportItem {
  id: string;
  reporterId: string;
  mangaId: string;
  chapterId: string;
  commentId: string;
  reason: string;
  status: string;
  adminNote: string;
  createdAt: string;
}

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

export default function Page() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStatus = async (id: string, status: string) => {
    const adminNote = status === "dismissed" ? prompt("Dismissal note (optional):") : undefined;
    try {
      await apiRequest("/reports/update-report-status", {
        method: "PUT",
        body: JSON.stringify({ id, status, adminNote }),
        headers: { "Content-Type": "application/json" },
      });
      await loadReports();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Update failed.");
    }
  };

  useEffect(() => { void loadReports(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="admin-headline text-[1.6rem] text-primary">Reports</h1>

      {errorMessage ? (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white px-6 py-10">
          <EmptyState title="Failed to load" description={errorMessage} />
        </section>
      ) : (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white">
          <DataTable columns={["Reason", "Status", "Date", "Actions"]}>
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>
            ) : reports.length === 0 ? (
              <TableEmptyState
                colSpan={4}
                title="No reports"
                description="Reader reports and moderation issues will show up here when they need attention."
              />
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="admin-table-row">
                  <td className="px-6 py-4 text-[13px] text-primary">{report.reason}</td>
                  <td className="px-6 py-4"><StatusBadge label={report.status} tone={report.status === "pending" ? "secondary" : report.status === "reviewed" ? "primary" : "muted"} /></td>
                  <td className="px-6 py-4 text-[13px] text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {report.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatus(report.id, "reviewed")}
                          className="rounded bg-green-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white hover:bg-green-700">
                          Resolve
                        </button>
                        <button onClick={() => handleStatus(report.id, "dismissed")}
                          className="rounded bg-gray-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white hover:bg-gray-600">
                          Dismiss
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </section>
      )}
    </div>
  );

  async function loadReports() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiRequest<CollectionResponse<ReportItem>>("/reports/get-reports");
      setReports(res.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  }
}
