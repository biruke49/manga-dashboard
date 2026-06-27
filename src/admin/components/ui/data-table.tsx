import type { ReactNode } from "react";

interface DataTableProps {
  columns: string[];
  children: ReactNode;
}

export function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="bg-primary text-white">
              {columns.map((column) => (
                <th
                  key={column}
                  className={column === "Actions" ? "px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.24em]" : "px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em]"}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--border)_18%,transparent)]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
