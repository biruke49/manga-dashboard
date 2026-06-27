"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/admin/lib/api";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState } from "@/admin/components/ui/empty-state";
import { StatusBadge } from "@/admin/components/ui/status-badge";

interface MangaItem {
  id: string;
  title: string;
  status: string;
  chapterCount: number;
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

  useEffect(() => {
    void loadMangas();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="admin-headline text-[1.6rem] text-primary">My Mangas</h1>
        <Link
          href="/admin/manga/create"
          className="rounded-lg bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/88"
        >
          Create Manga
        </Link>
      </div>

      {errorMessage ? (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white px-6 py-10">
          <EmptyState title="Failed to load" description={errorMessage} />
        </section>
      ) : (
        <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white">
          <DataTable columns={["Title", "Status", "Chapters", "Created", "Actions"]}>
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>
            ) : mangas.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">No manga yet.</td></tr>
            ) : (
              mangas.map((manga) => (
                <tr key={manga.id} className="admin-table-row">
                  <td className="px-6 py-4 text-[13px] font-semibold text-primary">{manga.title}</td>
                  <td className="px-6 py-4"><StatusBadge label={manga.status} tone={manga.status === "published" ? "primary" : manga.status === "pending" ? "secondary" : "muted"} /></td>
                  <td className="px-6 py-4 text-[13px] text-muted-foreground">{manga.chapterCount}</td>
                  <td className="px-6 py-4 text-[13px] text-muted-foreground">{new Date(manga.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/admin/manga/${manga.id}/chapters`} className="text-[11px] font-black uppercase tracking-[0.12em] text-secondary hover:underline">
                      Chapters
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

  async function loadMangas() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiRequest<CollectionResponse<MangaItem>>("/manga/my-mangas");
      setMangas(res.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load mangas.");
    } finally {
      setIsLoading(false);
    }
  }
}
