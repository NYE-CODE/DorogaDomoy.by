import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "./utils";
import { typoBody, typoH2 } from "@/shared/styles/typography-classes";

interface EmptyStateProps {
  title: string;
  description: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "danger" | "brand";
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
      : tone === "brand"
        ? "bg-primary/12 text-primary"
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
      <h2 className={typoH2}>{title}</h2>
      <p className={cn(typoBody, "mx-auto mt-2 max-w-md text-muted-foreground")}>
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
