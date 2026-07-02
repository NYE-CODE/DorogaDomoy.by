/** Focus + transition для кастомных интерактивных элементов (не shadcn). */

export const focusRingClass =
  'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring';

export const interactiveTransitionClass =
  'transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-in-out';

export const iconButtonClass = `${interactiveTransitionClass} ${focusRingClass} rounded-md`;

export const ghostSurfaceHoverClass = 'hover:bg-muted/60 dark:hover:bg-muted/40';

export const pageSurfaceClass = 'bg-muted/30 dark:bg-background';

export const cardSurfaceClass =
  'bg-card border border-border rounded-md shadow-sm';

export const mutedPanelClass = 'bg-muted/50 dark:bg-muted/30 border border-border/60 rounded-md';
