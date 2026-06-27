interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="admin-panel-muted p-10 text-center">
      <h3 className="text-xl font-bold text-brand-navy">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
