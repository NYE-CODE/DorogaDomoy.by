export function MapLoadingFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/50 dark:bg-muted">
      <div className="text-center text-muted-foreground">
        <div className="mx-auto mb-2 size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}
