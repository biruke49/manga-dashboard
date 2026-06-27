"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/admin/lib/api";

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artist, setArtist] = useState("");
  const [genres, setGenres] = useState("");
  const [language, setLanguage] = useState("am");
  const [isMature, setIsMature] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = {
        title,
        description: description || undefined,
        artist: artist || undefined,
        genres: genres ? genres.split(",").map((g) => g.trim()).filter(Boolean) : undefined,
        language,
        isMature,
      };
      const result = await apiRequest<{ id: string }>("/manga/create-manga", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      router.push(`/admin/manga`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create manga.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="admin-headline text-[1.6rem] text-primary">Create Manga</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white p-6">
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Artist</label>
          <input value={artist} onChange={(e) => setArtist(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Genres (comma-separated)</label>
          <input value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Action, Drama, Fantasy"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring">
              <option value="am">Amharic</option>
              <option value="en">English</option>
              <option value="om">Oromo</option>
              <option value="ti">Tigrinya</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)}
                className="h-4 w-4 rounded border-input" />
              Mature content
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/88 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Creating..." : "Create"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-muted">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
