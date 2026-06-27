"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/admin/lib/api";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState, TableEmptyState } from "@/admin/components/ui/empty-state";
import { StatusBadge } from "@/admin/components/ui/status-badge";

interface MangaItem {
  id: string;
  title: string;
  status: string;
  authorId: string;
  createdAt: string;
}

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

export default function Page() {
  const [mangas, setMangas] = useState<MangaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReview = async (id: string, status: string, rejectionReason?: string) => {
    try {
      await apiRequest("/manga/update-manga-status", {
        method: "PUT",
        body: JSON.stringify({ id, status, rejectionReason }),
        headers: { "Content-Type": "application/json" },
      });
      await loadMangas();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Review failed.");
    }
  };

  useEffect(() => { void loadMangas(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="admin-headline text-[1.6rem] text-primary">Manga Reviews</h1>

      {errorMessage ? (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white px-6 py-10">
          <EmptyState title="Failed to load" description={errorMessage} />
        </section>
      ) : (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white">
          <DataTable columns={["Title", "Status", "Created", "Actions"]}>
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>
            ) : mangas.length === 0 ? (
              <TableEmptyState
                colSpan={4}
                title="No manga waiting for review"
                description="New creator submissions will appear here when they are ready to approve or reject."
              />
            ) : (
              mangas.map((manga) => (
                <tr key={manga.id} className="admin-table-row">
                  <td className="px-6 py-4 text-[13px] font-semibold text-primary">{manga.title}</td>
                  <td className="px-6 py-4"><StatusBadge label={manga.status} tone={manga.status === "published" ? "primary" : manga.status === "pending" ? "secondary" : "muted"} /></td>
                  <td className="px-6 py-4 text-[13px] text-muted-foreground">{new Date(manga.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {manga.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleReview(manga.id, "published")}
                          className="rounded bg-green-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white hover:bg-green-700">
                          Approve
                        </button>
                        <button onClick={() => {
                          const reason = prompt("Rejection reason:");
                          if (reason) handleReview(manga.id, "rejected", reason);
                        }}
                          className="rounded bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white hover:bg-red-700">
                          Reject
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

  async function loadMangas() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiRequest<CollectionResponse<MangaItem>>("/manga/pending-mangas");
      setMangas(res.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load.");
    } finally {
      setIsLoading(false);
    }
  }
}
