import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, Building2, Home, Search, History } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { getHomePath } from '../../utils/home-route';

const PREV_ROUTE_KEY = 'dd_previous_path';

function isPrimaryRoute(path: string): boolean {
  return path === '/search' || path === '/shelters' || path === '/shelters/';
}

function routeLabel(path: string, fallback: string): string {
  if (path === '/') return 'Главная';
  if (path === '/search') return 'Поиск';
  if (path === '/shelters' || path === '/shelters/') return 'Приюты';
  if (path.startsWith('/shelters/')) return 'Страница приюта';
  if (path.startsWith('/pet/')) return 'Объявление';
  if (path.startsWith('/shelter-pet/')) return 'Питомец приюта';
  if (path.startsWith('/blog/')) return 'Статья блога';
  if (path === '/blog') return 'Блог';
  if (path === '/favorites') return 'Избранное';
  if (path === '/profile') return 'Профиль';
  return fallback;
}

export function BackQuickMenu() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(PREV_ROUTE_KEY);
    setPreviousPath(saved);
  }, [pathname, search]);

  useEffect(() => {
    const onOutside = (event: MouseEvent | TouchEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) setOpen(false);
    };
    if (!open) return;
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [open]);

  const current = `${pathname}${search}`;
  const canShowPrevious = useMemo(() => {
    if (!previousPath) return false;
    if (previousPath === current) return false;
    return !isPrimaryRoute(previousPath.split('?')[0] || previousPath);
  }, [previousPath, current]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-muted"
        aria-label={t.common.back}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ArrowLeft className="size-6 text-gray-600 dark:text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-[110] min-w-[15rem] rounded-2xl border border-border bg-card p-2 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(getHomePath());
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
          >
            <Home size={17} />
            <span>Главная</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/search');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
          >
            <Search size={17} />
            <span>{t.common.search}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/shelters');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
          >
            <Building2 size={17} />
            <span>{t.header.shelters}</span>
          </button>
          {canShowPrevious && previousPath ? (
            <>
              <div className="my-1 border-t border-border/80" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(previousPath);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
              >
                <History size={17} />
                <span>Назад</span>
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
