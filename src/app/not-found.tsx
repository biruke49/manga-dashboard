import Link from "next/link";

export default function NotFound() {
  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-6 py-24">
      <div className="admin-panel w-full max-w-2xl p-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">404</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-navy">Admin page not found.</h1>
        <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground">
          The route you requested is not available in the dashboard yet.
        </p>
        <Link
          href="/admin"
          className="mt-8 inline-flex h-11 items-center justify-center bg-brand-navy px-5 text-sm font-semibold text-white transition hover:bg-brand-navy/90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
