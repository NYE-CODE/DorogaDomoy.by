import { cn } from "./utils";

interface PageLoaderProps {
  label?: string;
  className?: string;
  fullHeight?: boolean;
}

export function PageLoader({
  label = "Загрузка...",
  className,
  fullHeight = true,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        fullHeight ? "min-h-screen" : "min-h-[240px]",
        "bg-background flex items-center justify-center px-4",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
