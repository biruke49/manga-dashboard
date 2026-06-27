import { ChevronLeftIcon, ChevronRightIcon } from "@/admin/lib/icons";

interface PaginationProps {
  summary: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function Pagination({ summary, currentPage = 1, totalPages = 1, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className="flex flex-col gap-3 border-t border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] bg-[var(--surface-low)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{summary}</p>
      {totalPages > 1 ? (
        <div className="flex gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={isPreviousDisabled}
            className="flex h-8 w-8 items-center justify-center bg-white text-primary transition hover:bg-[var(--surface-mid)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange?.(page)}
              className={page === currentPage ? "flex h-8 min-w-8 items-center justify-center bg-primary px-2 text-[10px] font-black text-white" : "flex h-8 min-w-8 items-center justify-center bg-white px-2 text-[10px] font-black text-primary transition hover:bg-[var(--surface-mid)]"}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={isNextDisabled}
            className="flex h-8 w-8 items-center justify-center bg-white text-primary transition hover:bg-[var(--surface-mid)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
