import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, Building2, Home, Search, History } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { getHomePath } from '../../utils/home-route';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

const PREV_ROUTE_KEY = 'dd_previous_path';

function isPrimaryRoute(path: string): boolean {
  return path === '/search' || path === '/shelters' || path === '/shelters/';
}

function routeLabel(path: string, labels: {
  home: string;
  search: string;
  shelters: string;
  shelterPage: string;
  adListing: string;
  shelterPet: string;
  blog: string;
  blogPost: string;
  favorites: string;
  profile: string;
  fallback: string;
}): string {
  if (path === '/') return labels.home;
  if (path === '/search') return labels.search;
  if (path === '/shelters' || path === '/shelters/') return labels.shelters;
  if (path.startsWith('/shelters/')) return labels.shelterPage;
  if (path.startsWith('/pet/')) return labels.adListing;
  if (path.startsWith('/shelter-pet/')) return labels.shelterPet;
  if (path.startsWith('/blog/')) return labels.blogPost;
  if (path === '/blog') return labels.blog;
  if (path === '/favorites') return labels.favorites;
  if (path === '/profile') return labels.profile;
  return labels.fallback;
}

export function BackQuickMenu() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { t } = useI18n();
  const bqm = t.backQuickMenu;
  const routeLabels = useMemo(
    () => ({
      home: t.common.home,
      search: t.common.search,
      shelters: t.header.shelters,
      shelterPage: bqm.shelterPage,
      adListing: bqm.adListing,
      shelterPet: bqm.shelterPet,
      blog: t.header.blog,
      blogPost: bqm.blogPost,
      favorites: t.header.favorites,
      profile: t.header.profile,
      fallback: t.common.back,
    }),
    [t, bqm],
  );
  const [open, setOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(PREV_ROUTE_KEY);
    setPreviousPath(saved);
  }, [pathname, search]);

  useClickOutside(ref, () => setOpen(false), open);

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
        className="rounded-lg p-2 transition-[background-color] duration-150 ease-in-out hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label={t.common.back}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ArrowLeft className="size-6 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-[110] min-w-[15rem] rounded-lg border border-border bg-card p-2 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(getHomePath());
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
          >
            <Home size={17} />
            <span>{t.common.home}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/search');
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
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
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
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
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
              >
                <History size={17} />
                <span>{routeLabel(previousPath.split('?')[0] || previousPath, routeLabels)}</span>
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
