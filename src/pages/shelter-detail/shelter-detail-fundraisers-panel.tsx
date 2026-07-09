export interface ShelterDetailFundraisersPanelProps {
  title: string;
  emptyText: string;
  headingClassName?: string;
}

export function ShelterDetailFundraisersPanel({
  title,
  emptyText,
  headingClassName = 'text-xl font-bold tracking-tight text-foreground',
}: ShelterDetailFundraisersPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className={headingClassName}>{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
    </section>
  );
}
