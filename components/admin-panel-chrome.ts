/**
 * Общие Tailwind-классы для экранов админ-панели:
 * списки с таблицами, шапки страниц, фильтры, пустые состояния.
 */
export const adm = {
  page: 'space-y-6',
  /** Заголовок + кнопка(и) справа на широких экранах */
  headerRow: 'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
  headerText: 'min-w-0',
  title: 'typo-h2',
  subtitle: 'typo-caption mt-1 max-w-3xl',
  lead: 'typo-lead max-w-3xl',
  primaryBtn:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 transition-[background-color] duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  filtersCard: 'bg-card border border-border rounded-xl p-4 shadow-sm',
  settingsCard: 'bg-card border border-border rounded-xl p-6 shadow-sm',
  settingsCardTitle: 'text-base font-semibold text-foreground mb-4',
  tableShell: 'rounded-xl border border-border bg-card shadow-sm overflow-hidden',
  tableWrap: 'overflow-x-auto',
  table: 'w-full text-sm min-w-0',
  thead: 'bg-muted/60 dark:bg-muted/30 border-b border-border',
  th: 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  tbody: 'divide-y divide-border',
  tr: 'transition-colors duration-150 hover:bg-muted/40 dark:hover:bg-muted/15',
  tdEmpty: 'px-6 py-12 text-center text-sm text-muted-foreground',
  emptyBox:
    'rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground shadow-sm',
  listCard: 'rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm',
  ghostBtn:
    'inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 transition-[color,background-color,border-color] duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  footerActions: 'flex justify-end pt-2',
  saveBtnLg:
    'px-6 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-[background-color] duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  paginationOuter: 'flex flex-wrap items-center justify-between gap-4',
  paginationBtn:
    'inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-[color,background-color] duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  paginationPageNum:
    'inline-flex min-w-[2.25rem] h-9 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-[color,background-color] duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  paginationPageNumActive:
    'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
  paginationEllipsis:
    'inline-flex min-w-[2.25rem] h-9 items-center justify-center text-sm text-muted-foreground select-none',
  labelFilter: 'block text-xs font-medium text-foreground/90 mb-1',
  selectNative:
    'w-full px-3 py-2.5 text-sm border border-border bg-input-background text-foreground rounded-lg transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30',
  warnBanner:
    'text-sm text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 max-w-3xl',
} as const;

export const admFieldClass =
  'w-full px-3 py-2.5 border border-border bg-input-background text-foreground rounded-lg transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';
