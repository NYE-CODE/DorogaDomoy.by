import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useI18n } from '@/app/providers/I18nContext';
import type { SearchSortMode } from '@/pages/search/search-list-helpers';
import { cn } from '@/shared/ui/utils';

interface SearchSortSelectProps {
  value: SearchSortMode;
  onChange: (value: SearchSortMode) => void;
  className?: string;
}

export function SearchSortSelect({ value, onChange, className }: SearchSortSelectProps) {
  const { t } = useI18n();
  const sort = t.app.searchSort;

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
        {sort.label}
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as SearchSortMode)}>
        <SelectTrigger
          aria-label={sort.label}
          className="h-10 w-[min(100%,11.5rem)] rounded-full border-border bg-card px-3.5 text-sm shadow-sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{sort.newest}</SelectItem>
          <SelectItem value="oldest">{sort.oldest}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
