/** Focus + transition для кастомных интерактивных элементов (не shadcn). */

export const focusRingClass =
  'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring';

export const interactiveTransitionClass =
  'transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-in-out';

export const iconButtonClass = `${interactiveTransitionClass} ${focusRingClass} rounded-md`;

export const ghostSurfaceHoverClass = 'hover:bg-muted/60 dark:hover:bg-muted/40';

/** Фон страницы — синхронно с surfacePage. */
export const pageSurfaceClass = 'bg-landing';

/** Панель контента — синхронно с surfacePanel. */
export const cardSurfaceClass =
  'overflow-hidden rounded-2xl border border-border bg-card shadow-card';

/** Мягкий колодец — синхронно с surfaceMutedWell. */
export const mutedPanelClass = 'overflow-hidden rounded-3xl bg-landing-muted/80';
