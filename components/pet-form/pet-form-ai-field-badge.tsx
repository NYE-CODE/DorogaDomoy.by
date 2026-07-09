import { Sparkles } from 'lucide-react';

export function AiFieldBadge({ show, label }: { show?: boolean; label: string }) {
  if (!show) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium normal-case text-primary">
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
