/**
 * Общие Tailwind-классы для экранов админ-панели:
 * списки с таблицами, шапки страниц, фильтры, пустые состояния.
 */
export const adm = {
  page: 'space-y-6',
  /** Заголовок + кнопка(и) справа на широких экранах */
  headerRow: 'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
  headerText: 'min-w-0',
  title: 'text-2xl font-semibold tracking-tight text-gray-900 dark:text-white',
  subtitle: 'text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-3xl',
  lead: 'text-sm text-gray-600 dark:text-gray-400 max-w-3xl',
  primaryBtn:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 transition-colors',
  filtersCard: 'bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm',
  settingsCard: 'bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm',
  settingsCardTitle: 'text-base font-semibold text-gray-900 dark:text-white mb-4',
  tableShell: 'rounded-xl border border-gray-200 dark:border-gray-700 bg-card shadow-sm overflow-hidden',
  tableWrap: 'overflow-x-auto',
  table: 'w-full text-sm min-w-0',
  thead: 'bg-muted/60 dark:bg-muted/30 border-b border-gray-200 dark:border-gray-700',
  th: 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400',
  tbody: 'divide-y divide-gray-200 dark:divide-gray-700',
  tr: 'transition-colors hover:bg-muted/40 dark:hover:bg-muted/15',
  tdEmpty: 'px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400',
  emptyBox:
    'rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-12 text-center text-sm text-gray-600 dark:text-gray-400 shadow-sm',
  listCard: 'rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-4 sm:p-6 shadow-sm',
  ghostBtn:
    'inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-muted disabled:opacity-50 transition-colors',
  footerActions: 'flex justify-end pt-2',
  saveBtnLg:
    'px-6 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
  paginationOuter: 'flex flex-wrap items-center justify-between gap-4',
  paginationBtn:
    'inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-card text-gray-800 dark:text-gray-200 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  paginationPageNum:
    'inline-flex min-w-[2.25rem] h-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-card text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-muted transition-colors',
  paginationPageNumActive:
    'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
  paginationEllipsis: 'inline-flex min-w-[2.25rem] h-9 items-center justify-center text-sm text-gray-500 dark:text-gray-400 select-none',
  labelFilter: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1',
  selectNative:
    'w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent',
  warnBanner:
    'text-sm text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 max-w-3xl',
} as const;
