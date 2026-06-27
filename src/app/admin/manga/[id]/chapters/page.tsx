"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/admin/lib/api";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState, TableEmptyState } from "@/admin/components/ui/empty-state";
import { StatusBadge } from "@/admin/components/ui/status-badge";

interface ChapterItem {
  id: string;
  title: string;
  chapterNumber: number;
  status: string;
  pageCount: number;
  createdAt: string;
}

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    void loadChapters();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="admin-headline text-[1.6rem] text-primary">Chapters</h1>
        <Link
          href={`/admin/manga/${id}/create-chapter`}
          className="rounded-lg bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/88"
        >
          Add Chapter
        </Link>
      </div>

      {errorMessage ? (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white px-6 py-10">
          <EmptyState title="Failed to load" description={errorMessage} />
        </section>
      ) : (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white">
          <DataTable columns={["#", "Title", "Status", "Pages", "Created", "Actions"]}>
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>
            ) : chapters.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                title="No chapters yet"
                description="Add the first chapter for this manga, then upload pages and publish when it is ready."
                action={
                  <Link
                    href={`/admin/manga/${id}/create-chapter`}
                    className="rounded-lg bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/88"
                  >
                    Add Chapter
                  </Link>
                }
              />
            ) : (
              chapters.map((ch) => (
                <tr key={ch.id} className="admin-table-row">
                  <td className="px-6 py-4 text-[13px] font-semibold text-primary">{ch.chapterNumber}</td>
                  <td className="px-6 py-4 text-[13px] text-primary">{ch.title || `Chapter ${ch.chapterNumber}`}</td>
                  <td className="px-6 py-4"><StatusBadge label={ch.status} tone={ch.status === "published" ? "primary" : ch.status === "pending" ? "secondary" : "muted"} /></td>
                  <td className="px-6 py-4 text-[13px] text-muted-foreground">{ch.pageCount}</td>
                  <td className="px-6 py-4 text-[13px] text-muted-foreground">{new Date(ch.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/admin/manga/${id}/chapters/${ch.id}/pages`} className="text-[11px] font-black uppercase tracking-[0.12em] text-secondary hover:underline">
                      Pages
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </section>
      )}
    </div>
  );

  async function loadChapters() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiRequest<CollectionResponse<ChapterItem>>(`/chapters/chapters-by-manga/${id}`);
      setChapters(res.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load chapters.");
    } finally {
      setIsLoading(false);
    }
  }
}
