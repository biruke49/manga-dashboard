import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="admin-panel-muted p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--border)_24%,transparent)] bg-white text-lg font-black text-secondary">
        -
      </div>
      <h3 className="mt-5 text-xl font-bold text-brand-navy">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function TableEmptyState({
  colSpan,
  title,
  description,
  action,
}: EmptyStateProps & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <EmptyState title={title} description={description} action={action} />
      </td>
    </tr>
  );
}
