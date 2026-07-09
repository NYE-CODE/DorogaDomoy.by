import { cn } from '../ui/utils';
import type { AdminGuidesPanelView } from './admin-guides-types';

export interface AdminGuidesViewTabsProps {
  view: AdminGuidesPanelView;
  tabVideosLabel: string;
  tabCategoriesLabel: string;
  onViewChange: (view: AdminGuidesPanelView) => void;
}

export function AdminGuidesViewTabs({
  view,
  tabVideosLabel,
  tabCategoriesLabel,
  onViewChange,
}: AdminGuidesViewTabsProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onViewChange('videos')}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          view === 'videos'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
        )}
      >
        {tabVideosLabel}
      </button>
      <button
        type="button"
        onClick={() => onViewChange('categories')}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          view === 'categories'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
        )}
      >
        {tabCategoriesLabel}
      </button>
    </div>
  );
}
