export default function Loading() {
  return (
    <div className="admin-shell flex min-h-screen items-center justify-center bg-background px-6">
      <div className="admin-panel-muted w-full max-w-md p-8 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          Loading
        </p>
        <div className="mt-6 h-2 w-full overflow-hidden bg-white">
          <div className="h-full w-1/3 bg-brand-copper" />
        </div>
      </div>
    </div>
  );
}
