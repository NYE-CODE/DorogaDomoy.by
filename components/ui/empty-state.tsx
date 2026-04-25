import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "./utils";

interface EmptyStateProps {
  title: string;
  description: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}

export function EmptyState({
  title,
  description,
  hint,
  icon,
  action,
  tone = "default",
  className,
}: EmptyStateProps) {
  const iconWrapClass =
    tone === "danger"
      ? "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300"
      : "bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-8 text-center md:p-12",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto mb-4 flex size-16 items-center justify-center rounded-full",
          iconWrapClass,
        )}
      >
        {icon ?? <AlertCircle className="size-7" />}
      </div>
      <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground md:text-base">
        {description}
      </p>
      {hint && (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground/90">
          {hint}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
