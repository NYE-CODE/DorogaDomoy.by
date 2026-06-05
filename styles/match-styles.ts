/** Фирменный оранжевый подбора питомцев — совпадает с FAB и CTA приложения. */
export const matchOrangeFabClass =
  'bg-[#FF9800] text-white shadow-lg shadow-orange-500/30 hover:bg-[#F57C00]';

/** Активная страница /match — лёгкое кольцо вокруг FAB. */
export const matchOrangeFabActiveClass =
  'ring-2 ring-[#FF9800]/45 ring-offset-2 ring-offset-background';

export const matchScoreBadgeClass =
  'shrink-0 rounded-full bg-[#FF9800] px-2.5 py-1 text-xs font-bold text-white shadow-md sm:px-3 sm:py-1.5 sm:text-sm';

export const matchReasonChipClass =
  'inline-flex items-center gap-1 rounded-full bg-[#FF9800]/10 px-2.5 py-1 text-xs font-medium text-[#C2410C] dark:bg-[#FF9800]/18 dark:text-[#FFB74D]';

export const matchLinkClass =
  'inline-block text-sm font-medium text-[#FF9800] transition-colors hover:text-[#F57C00] hover:underline';

export const matchChoiceActiveClass =
  'border-[#FF9800] bg-[#FF9800]/10 text-foreground';

export const matchProgressBarClass =
  'h-2 rounded-full bg-gradient-to-r from-[#FDB913] to-[#FF9800] transition-all';

/** Область карточки на /match — растягивается между шапкой и панелью действий. */
export const matchMobileCardWrapClass =
  'relative min-h-0 w-full min-w-0 flex-1 lg:max-w-lg';

/** Панель ❌/❤️ — в потоке на мобильном, статично на десктопе. */
export const matchMobileActionsClass =
  'shrink-0 border-t border-border/70 bg-background px-4 py-3 max-lg:shadow-[0_-4px_18px_rgba(15,23,42,0.06)] max-lg:dark:shadow-[0_-4px_18px_rgba(0,0,0,0.4)] lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none';

export const matchMobileActionsInnerClass =
  'mx-auto grid max-w-[22rem] grid-cols-[1fr_auto_1fr] items-center gap-4 sm:max-w-md lg:flex lg:max-w-none lg:justify-center lg:gap-10';

export const matchPassButtonClass =
  'mx-auto flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-rose-200 bg-white text-rose-500 shadow-sm transition-transform active:scale-95 disabled:opacity-50 dark:border-rose-500/35 dark:bg-background lg:size-16';

export const matchLikeButtonClass =
  'mx-auto flex size-[3.75rem] shrink-0 items-center justify-center rounded-full border-0 bg-emerald-500 text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 sm:size-16 lg:size-[4.5rem]';

export const matchCardShellClass =
  'relative h-full w-full overflow-hidden bg-card max-lg:rounded-none sm:rounded-2xl sm:border sm:border-border/80 sm:shadow-lg sm:ring-1 sm:ring-black/[0.04] dark:sm:ring-white/[0.06]';

/** Фото занимает только область над шторкой (bottom задаётся inline). */
export const matchCardPhotoClass =
  'absolute inset-x-0 top-0 flex items-center justify-center bg-muted';

/** Нижняя шторка — белый фон, высота задаётся inline (drag + snap). */
export const matchCardBodyClass =
  'absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-t border-border bg-card text-foreground shadow-[0_-8px_24px_rgba(15,23,42,0.12)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.45)]';

/** Отступ main: только нижняя nav (mobile). */
export const matchMobileMainPadClass =
  'pb-[calc(4.75rem+max(env(safe-area-inset-bottom,0px),8px))] lg:pb-12';

/** Оверлеи при свайпе карточки. */
export const matchSwipeLikeOverlayClass =
  'pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/35 via-emerald-500/10 to-transparent';

export const matchSwipePassOverlayClass =
  'pointer-events-none absolute inset-0 bg-gradient-to-bl from-rose-400/35 via-rose-500/10 to-transparent';

/** Штампы «нравится» / «пропустить» при свайпе. */
export const matchSwipeLikeStampClass =
  'pointer-events-none absolute left-[8%] top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-2xl border-[3px] border-emerald-500 bg-emerald-500/15 px-4 py-2.5 text-emerald-600 shadow-[0_8px_28px_rgba(16,185,129,0.35)] backdrop-blur-sm dark:text-emerald-300';

export const matchSwipePassStampClass =
  'pointer-events-none absolute right-[8%] top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-2xl border-[3px] border-rose-500 bg-rose-500/15 px-4 py-2.5 text-rose-600 shadow-[0_8px_28px_rgba(244,63,94,0.35)] backdrop-blur-sm dark:text-rose-300';

export const matchSwipeStampLabelClass =
  'text-lg font-black uppercase leading-none tracking-[0.18em] sm:text-xl';

