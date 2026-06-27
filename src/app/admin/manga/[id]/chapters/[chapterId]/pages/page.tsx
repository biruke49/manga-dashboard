"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/admin/lib/api";
import { EmptyState } from "@/admin/components/ui/empty-state";

interface PageItem {
  id: string;
  pageNumber: number;
  imageUrl: string | null;
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const router = useRouter();
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setChapterId(p.chapterId));
  }, [params]);

  useEffect(() => {
    if (!chapterId) return;
    void loadPages();
  }, [chapterId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !chapterId) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("pages", file));
      await apiRequest(`/chapter-pages/upload-pages/${chapterId}`, {
        method: "POST",
        body: formData,
      });
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="admin-headline text-[1.6rem] text-primary">Chapter Pages</h1>
        <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/88">
          {uploading ? "Uploading..." : "Upload Pages"}
          <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white p-6">
        {pages.length === 0 ? (
          <EmptyState
            title="No pages uploaded yet"
            description="Upload image files for this chapter. They will appear here in reading order once the backend returns them."
            action={
              <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/88">
                {uploading ? "Uploading..." : "Upload Pages"}
                <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {pages
              .sort((a, b) => a.pageNumber - b.pageNumber)
              .map((page) => (
                <div key={page.id} className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
                  {page.imageUrl ? (
                    <img
                      src={page.imageUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Loading...
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 text-[10px] text-white">
                    <span>p.{page.pageNumber}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-muted"
          >
            Back to Chapters
          </button>
        </div>
      </section>
    </div>
  );

  async function loadPages() {
    if (!chapterId) return;
    try {
      const res = await apiRequest<PageItem[]>(`/chapter-pages/get-pages/${chapterId}`);
      setPages(Array.isArray(res) ? res : []);
    } catch {
      setPages([]);
    }
  }
}
