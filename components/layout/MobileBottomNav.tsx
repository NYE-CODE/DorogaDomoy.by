import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Search,
  Plus,
  Building2,
  PawPrint,
  ListFilter,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useShelterPetBrowseOptional } from '../../context/ShelterPetBrowseContext';
import { useIsMobile } from '../ui/use-mobile';
import { cn } from '../ui/utils';
import type { HomeMode } from '../../landing/app/App';
import { readAdopterProfile } from '../../utils/adopter-profile-storage';
import { HOME_MODE_STORAGE_KEY } from '../../utils/home-route';
import { matchOrangeFabActiveClass, matchOrangeFabClass } from '../../styles/match-styles';

const HIDDEN_PREFIXES = ['/create', '/edit/', '/admin', '/terms', '/my-pets/add', '/match/quiz'];

/** Базовые позиции: левый пункт / FAB / (мои орг.) / режим. */
const SIDE_BTN_CLASS =
  'flex w-full min-w-0 flex-col items-center justify-center gap-0.5 pb-2 pt-2 transition-colors';
const SIDE_ICON = 22;
const SIDE_LABEL = 'text-[11px] font-medium leading-tight';
const FAB_CLASS =
  'flex size-14 shrink-0 -mt-4 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform';

function navShellClass(showBrowseArrows: boolean, hasExtraOrgSlot: boolean) {
  if (showBrowseArrows) {
    return hasExtraOrgSlot
      ? 'w-full max-w-[calc(100%-7rem)] sm:max-w-[22rem]'
      : 'w-[16rem] max-w-[calc(100%-5.75rem)]';
  }
  return hasExtraOrgSlot
    ? 'w-[20rem] max-w-[calc(100%-1rem)]'
    : 'w-[16rem] max-w-[calc(100%-1rem)]';
}

function shouldHide(pathname: string): boolean {
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (/^\/my-pets\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}

function SideLabel({ children }: { children: ReactNode }) {
  return <span className={SIDE_LABEL}>{children}</span>;
}

function EdgeButton({
  children,
  side,
  hidden,
}: {
  children: ReactNode;
  side: 'left' | 'right';
  hidden?: boolean;
}) {
  return (
    <div
      className={cn(
        'absolute bottom-0 flex h-16 w-[3rem] items-center justify-center',
        side === 'left' ? 'left-1' : 'right-1',
        hidden && 'pointer-events-none opacity-0',
      )}
      aria-hidden={hidden}
    >
      {children}
    </div>
  );
}

export function MobileBottomNav() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const browse = useShelterPetBrowseOptional();
  const isMobile = useIsMobile();
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const [homeMode, setHomeMode] = useState<HomeMode>(() => {
    if (typeof window === 'undefined') return 'search';
    const saved = window.localStorage.getItem(HOME_MODE_STORAGE_KEY);
    return saved === 'shelters' ? 'shelters' : 'search';
  });

  const isSearch = pathname === '/search';
  const isSheltersMode = homeMode === 'shelters';
  const isShelterPetDetail = pathname.startsWith('/shelter-pet/');
  const isShelterPetsTab = pathname === '/shelters' && new URLSearchParams(search).get('tab') === 'pets';
  const isVolunteerOrAdmin = user?.role === 'volunteer' || user?.role === 'admin';
  const showBrowseArrows = isShelterPetDetail;

  useEffect(() => {
    const syncMode = () => {
      const saved = window.localStorage.getItem(HOME_MODE_STORAGE_KEY);
      setHomeMode(saved === 'shelters' ? 'shelters' : 'search');
    };
    syncMode();
    const syncOnRoute = () => syncMode();
    syncOnRoute();
    window.addEventListener('storage', syncMode);
    return () => window.removeEventListener('storage', syncMode);
  }, [pathname, search]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setModeMenuOpen(false);
      }
    };
    if (!modeMenuOpen) return;
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [modeMenuOpen]);

  const handleCreate = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    navigate('/create');
  };

  const handleSheltersTabToggle = () => {
    if (isShelterPetsTab) navigate('/shelters');
    else navigate('/shelters?tab=pets');
  };

  const handleSheltersPrimary = () => {
    if (isShelterPetDetail) navigate('/shelters');
    else handleSheltersTabToggle();
  };

  const handleMyShelters = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    navigate('/my-shelters');
  };

  const handleMatchPet = () => {
    const profile = readAdopterProfile();
    navigate(profile?.completedAt ? '/match' : '/match/quiz');
  };

  const setModeAndNavigate = (mode: HomeMode) => {
    window.localStorage.setItem(HOME_MODE_STORAGE_KEY, mode);
    setHomeMode(mode);
    setModeMenuOpen(false);
    navigate(mode === 'shelters' ? '/shelters' : '/search');
  };

  if (!isMobile || shouldHide(pathname)) return null;

  const modeDropdown = (
    <div className="absolute bottom-full right-0 z-50 mb-2 min-w-[11rem] rounded-xl border border-border bg-card p-1 shadow-lg">
      <button
        type="button"
        onClick={() => setModeAndNavigate('search')}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
          homeMode === 'search' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
        }`}
      >
        <Search size={16} />
        {t.common.search}
      </button>
      <button
        type="button"
        onClick={() => setModeAndNavigate('shelters')}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
          homeMode === 'shelters' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
        }`}
      >
        <Building2 size={16} />
        Приюты
      </button>
    </div>
  );

  const modeButton = (
    <button
      type="button"
      onClick={() => setModeMenuOpen((v) => !v)}
      className={cn(
        SIDE_BTN_CLASS,
        modeMenuOpen ? 'text-primary' : 'text-muted-foreground',
      )}
      aria-expanded={modeMenuOpen}
      aria-haspopup="menu"
    >
      {modeMenuOpen ? <ChevronUp size={SIDE_ICON} /> : <ListFilter size={SIDE_ICON} />}
      <SideLabel>Режим</SideLabel>
    </button>
  );

  const isMatchRoute = pathname === '/match' || pathname === '/match/quiz';
  const centerFab = isSheltersMode ? (
    <button
      type="button"
      onClick={handleMatchPet}
      className={cn(
        FAB_CLASS,
        matchOrangeFabClass,
        isMatchRoute && matchOrangeFabActiveClass,
      )}
      aria-label="Подобрать питомца"
      aria-current={pathname === '/match' ? 'page' : undefined}
    >
      <PawPrint size={28} strokeWidth={2.5} />
    </button>
  ) : (
    <button
      type="button"
      onClick={handleCreate}
      className={cn(FAB_CLASS, 'bg-[#FF9800] text-white shadow-orange-500/30')}
      aria-label={t.header.createAd}
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 overflow-visible md:hidden border-t border-border bg-background"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)', transform: 'translateZ(0)' }}
    >
      <EdgeButton side="left" hidden={!showBrowseArrows}>
        <button
          type="button"
          onClick={() => browse?.goPrev()}
          disabled={!browse?.canPrev}
          className={cn(
            'flex size-10 items-center justify-center rounded-full transition-colors',
            !browse?.canPrev ? 'cursor-not-allowed opacity-35' : 'text-muted-foreground hover:bg-muted',
          )}
          aria-label="Предыдущий питомец"
          tabIndex={showBrowseArrows ? 0 : -1}
        >
          <ChevronLeft size={SIDE_ICON} />
        </button>
      </EdgeButton>

      <div
        className={cn(
          'relative mx-auto grid h-16 items-end',
          isSheltersMode && isVolunteerOrAdmin ? 'grid-cols-4' : 'grid-cols-3',
          navShellClass(showBrowseArrows, isSheltersMode && isVolunteerOrAdmin),
        )}
      >
        {isSheltersMode ? (
          <button
            type="button"
            onClick={handleSheltersPrimary}
            className={cn(SIDE_BTN_CLASS, 'text-primary')}
            aria-label={isShelterPetDetail ? 'Перейти к приютам' : isShelterPetsTab ? 'Перейти к приютам' : 'Перейти к питомцам'}
          >
            {isShelterPetsTab && !isShelterPetDetail ? (
              <>
                <PawPrint size={SIDE_ICON} />
                <SideLabel>Питомцы</SideLabel>
              </>
            ) : (
              <>
                <Building2 size={SIDE_ICON} />
                <SideLabel>Приюты</SideLabel>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/search')}
            className={cn(SIDE_BTN_CLASS, isSearch ? 'text-primary' : 'text-muted-foreground')}
            aria-current={isSearch ? 'page' : undefined}
          >
            <Search size={SIDE_ICON} />
            <SideLabel>{t.common.search}</SideLabel>
          </button>
        )}

        <div className="flex justify-center">{centerFab}</div>

        {isSheltersMode && isVolunteerOrAdmin ? (
          <button
            type="button"
            onClick={handleMyShelters}
            className={cn(
              SIDE_BTN_CLASS,
              pathname.startsWith('/my-shelters') ? 'text-primary' : 'text-muted-foreground',
            )}
            aria-label={t.header.myShelterOrg ?? 'Мои организации'}
          >
            <Building2 size={SIDE_ICON} />
            <SideLabel>Мои орг.</SideLabel>
          </button>
        ) : null}

        <div className="relative flex min-w-0 items-end justify-center" ref={modeMenuRef}>
          {modeMenuOpen ? modeDropdown : null}
          {modeButton}
        </div>
      </div>

      <EdgeButton side="right" hidden={!showBrowseArrows}>
        <button
          type="button"
          onClick={() => browse?.goNext()}
          disabled={!browse?.canNext}
          className={cn(
            'flex size-10 items-center justify-center rounded-full transition-colors',
            !browse?.canNext ? 'cursor-not-allowed opacity-35' : 'text-muted-foreground hover:bg-muted',
          )}
          aria-label="Следующий питомец"
          tabIndex={showBrowseArrows ? 0 : -1}
        >
          <ChevronRight size={SIDE_ICON} />
        </button>
      </EdgeButton>
    </nav>
  );
}
