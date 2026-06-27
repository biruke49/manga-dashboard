"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/admin/lib/api";

interface MangaItem {
  id: string;
  title: string;
  description?: string;
  artist?: string;
  genres?: string[];
  language?: string;
  isMature?: boolean;
  coverImageFilename?: string;
  pdfFilename?: string;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [manga, setManga] = useState<MangaItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artist, setArtist] = useState("");
  const [genres, setGenres] = useState("");
  const [language, setLanguage] = useState("am");
  const [isMature, setIsMature] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((value) => setId(value.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    void loadManga(id);
  }, [id]);

  async function loadManga(mangaId: string) {
    setLoading(true);
    try {
      const res = await apiRequest<MangaItem>(`/manga/get-manga/${mangaId}`);
      setManga(res);
      setTitle(res.title || "");
      setDescription(res.description || "");
      setArtist(res.artist || "");
      setGenres(res.genres?.join(", ") || "");
      setLanguage(res.language || "am");
      setIsMature(Boolean(res.isMature));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load manga.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest("/manga/update-manga", {
        method: "PUT",
        body: JSON.stringify({
          id,
          title,
          description: description || undefined,
          artist: artist || undefined,
          genres: genres ? genres.split(",").map((g) => g.trim()).filter(Boolean) : undefined,
          language,
          isMature,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (cover) {
        const coverForm = new FormData();
        coverForm.append("cover", cover);
        await apiRequest(`/manga/update-manga-cover/${id}`, { method: "POST", body: coverForm });
      }
      if (pdf) {
        const pdfForm = new FormData();
        pdfForm.append("pdf", pdf);
        await apiRequest(`/manga/update-manga-pdf/${id}`, { method: "POST", body: pdfForm });
      }
      router.push("/admin/manga");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update manga.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest("/manga/update-manga-status", {
        method: "PUT",
        body: JSON.stringify({
          id,
          status: "published",
        }),
        headers: { "Content-Type": "application/json" },
      });
      router.push("/admin/manga");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish manga.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !id) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!manga) return <p className="text-sm text-destructive">{error || "Manga not found."}</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="admin-headline text-[1.6rem] text-primary">Edit Manga</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white p-6">
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Artist</label>
          <input value={artist} onChange={(e) => setArtist(e.target.value)} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Genres</label>
          <input value={genres} onChange={(e) => setGenres(e.target.value)} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Cover Image</label>
          <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:uppercase file:tracking-[0.08em] file:text-primary-foreground focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Manga PDF</label>
          <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:uppercase file:tracking-[0.08em] file:text-primary-foreground focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring">
              <option value="am">Amharic</option>
              <option value="en">English</option>
              <option value="om">Oromo</option>
              <option value="ti">Tigrinya</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)} className="h-4 w-4 rounded border-input" />
              Mature content
            </label>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/88 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={handlePublish} disabled={saving} className="rounded-lg border border-border px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-primary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
            Publish
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-muted">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
