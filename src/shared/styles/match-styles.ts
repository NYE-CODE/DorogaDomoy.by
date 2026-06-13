/** Фирменный оранжевый подбора питомцев — semantic tokens. */
export const matchOrangeFabClass =
  'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary-hover transition-[background-color] duration-150 ease-in-out';

/** Активная страница /match — лёгкое кольцо вокруг FAB. */
export const matchOrangeFabActiveClass =
  'ring-2 ring-primary/45 ring-offset-2 ring-offset-background';

export const matchScoreBadgeClass =
  'shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-md sm:px-3 sm:py-1.5 sm:text-sm';

export const matchReasonChipClass =
  'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-emphasis dark:bg-primary/18 dark:text-primary-soft';

export const matchLinkClass =
  'inline-block text-sm font-medium text-primary transition-colors duration-150 ease-in-out hover:text-primary-hover hover:underline';

export const matchChoiceActiveClass =
  'border-primary bg-primary/10 text-foreground';

export const matchProgressBarClass =
  'h-2 rounded-full bg-gradient-to-r from-primary-light to-primary transition-all duration-150 ease-in-out';

/** Область карточки на /match — на десктопе шире под двухколоночный layout. */
export const matchMobileCardWrapClass =
  'relative min-h-0 w-full min-w-0 flex-1 lg:max-w-none';

/** Панель ❌/❤️ — в потоке на мобильном, статично на десктопе. */
export const matchMobileActionsClass =
  'shrink-0 border-t border-border/70 bg-background px-4 py-3 max-lg:shadow-[var(--shadow-md)] lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none';

export const matchMobileActionsInnerClass =
  'mx-auto grid max-w-[22rem] grid-cols-[1fr_auto_1fr] items-center gap-4 sm:max-w-md lg:flex lg:max-w-none lg:justify-center lg:gap-10';

export const matchPassButtonClass =
  'mx-auto flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-rose-200 bg-card text-rose-500 shadow-sm transition-transform duration-150 ease-in-out active:scale-95 disabled:opacity-50 dark:border-rose-500/35 lg:size-16';

export const matchLikeButtonClass =
  'mx-auto flex size-[3.75rem] shrink-0 items-center justify-center rounded-full border-0 bg-success text-primary-foreground shadow-md transition-transform duration-150 ease-in-out active:scale-95 disabled:opacity-50 sm:size-16 lg:size-[4.5rem]';

export const matchCardShellClass =
  'relative h-full w-full overflow-hidden bg-card max-lg:rounded-none sm:rounded-2xl sm:border sm:border-border/80 sm:shadow-lg sm:ring-1 sm:ring-foreground/5 dark:sm:ring-foreground/10';

/** Область карточки на странице /match (десктоп) — без второй рамки. */
export const matchDesktopStageClass = 'relative min-h-0 flex-1';

/** Десктоп: одна карточка, без двойной обводки. */
export const matchCardShellDesktopClass =
  'relative h-full w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md';

/** Фото занимает только область над шторкой (bottom задаётся inline). */
export const matchCardPhotoClass =
  'absolute inset-x-0 top-0 flex items-center justify-center bg-muted';

/** Нижняя шторка — белый фон, высота задаётся inline (drag + snap). */
export const matchCardBodyClass =
  'absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-t border-border bg-card text-foreground shadow-[var(--shadow-md)]';

/** Отступ main на /match: снизу под mobile nav; на десктопе — зазор перед футером. */
export const matchMobileMainPadClass =
  'pb-[calc(4.75rem+max(env(safe-area-inset-bottom,0px),var(--spacing-2)))] lg:pb-28';

/** Оверлеи при свайпе карточки. */
export const matchSwipeLikeOverlayClass =
  'pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/35 via-emerald-500/10 to-transparent';

export const matchSwipePassOverlayClass =
  'pointer-events-none absolute inset-0 bg-gradient-to-bl from-rose-400/35 via-rose-500/10 to-transparent';

/** Штампы «нравится» / «пропустить» при свайпе. */
export const matchSwipeLikeStampClass =
  'pointer-events-none absolute left-[8%] top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-2xl border-[3px] border-emerald-500 bg-emerald-500/15 px-4 py-2.5 text-emerald-600 shadow-md backdrop-blur-sm dark:text-emerald-300';

export const matchSwipePassStampClass =
  'pointer-events-none absolute right-[8%] top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-2xl border-[3px] border-rose-500 bg-rose-500/15 px-4 py-2.5 text-rose-600 shadow-md backdrop-blur-sm dark:text-rose-300';

export const matchSwipeStampLabelClass =
  'text-lg font-black uppercase leading-none tracking-[0.18em] sm:text-xl';

/** Десктоп: фото cover, не contain. */
export const matchDesktopPhotoClass =
  'relative min-h-0 overflow-hidden bg-muted/50 dark:bg-muted/30';

export const matchDesktopPhotoImgClass = 'size-full object-cover object-center';

/** Десктоп: футер карточки с кнопками pass/like. */
export const matchDesktopActionsFooterClass =
  'shrink-0 border-t border-border/70 bg-muted/25 px-5 py-4 dark:bg-muted/10';

export const matchDesktopActionsRowClass =
  'flex items-center justify-center gap-5 sm:gap-8';

export const matchScoreRingTrackClass = 'text-muted/80';

export const matchScoreRingValueClass = 'stroke-primary';

export const matchDesktopThumbClass =
  'relative size-14 shrink-0 overflow-hidden rounded-lg border-2 border-transparent opacity-70 transition-opacity duration-150 ease-in-out hover:opacity-100';

export const matchDesktopThumbActiveClass =
  'border-primary opacity-100 ring-1 ring-primary/30';
