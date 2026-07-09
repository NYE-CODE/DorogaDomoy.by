export interface MyAdsPageHeaderProps {
  backLabel: string;
  title: string;
  subtitle: string;
  totalLabel?: string;
  totalCount?: number;
  onBack: () => void;
}

export function MyAdsPageHeader({
  backLabel,
  title,
  subtitle,
  totalLabel,
  totalCount,
  onBack,
}: MyAdsPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-muted/25 p-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <div className="min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ← {backLabel}
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      </div>
      {totalCount != null && totalCount > 0 && totalLabel ? (
        <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {totalLabel} <span className="font-semibold text-foreground">{totalCount}</span>
        </p>
      ) : null}
    </div>
  );
}
