import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Search, Plus, Building2, PawPrint, ListFilter, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useIsMobile } from '../ui/use-mobile';
import type { HomeMode } from '../../landing/app/App';
import { HOME_MODE_STORAGE_KEY } from '../../utils/home-route';

const HIDDEN_PREFIXES = ['/create', '/edit/', '/admin', '/terms', '/my-pets/add'];

function shouldHide(pathname: string): boolean {
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (/^\/my-pets\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}

export function MobileBottomNav() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isAuthenticated, openAuthModal, user } = useAuth();
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
  const isShelters = pathname === '/shelters' || pathname.startsWith('/shelters/');
  const isShelterPetsTab = pathname === '/shelters' && new URLSearchParams(search).get('tab') === 'pets';

  useEffect(() => {
    const syncMode = () => {
      const saved = window.localStorage.getItem(HOME_MODE_STORAGE_KEY);
      setHomeMode(saved === 'shelters' ? 'shelters' : 'search');
    };
    syncMode();
    // storage событие не срабатывает в текущей вкладке, поэтому синхронизируем и по навигации
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

  const handleShelters = () => navigate('/shelters');
  const handleShelterPets = () => navigate('/shelters?tab=pets');
  const handleMyShelters = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    navigate('/my-shelters');
  };
  const setModeAndNavigate = (mode: HomeMode) => {
    window.localStorage.setItem(HOME_MODE_STORAGE_KEY, mode);
    setHomeMode(mode);
    setModeMenuOpen(false);
    navigate(mode === 'shelters' ? '/shelters' : '/search');
  };

  if (!isMobile || shouldHide(pathname)) return null;

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)', transform: 'translateZ(0)' }}
    >
      <div className="relative flex items-end justify-around h-16 px-4 max-w-lg mx-auto">
        {isSheltersMode ? (
          <>
            <button
              type="button"
              onClick={handleShelters}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[4rem] pt-2 pb-2 transition-colors ${
                isShelters && !isShelterPetsTab ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-current={isShelters && !isShelterPetsTab ? 'page' : undefined}
            >
              <Building2 size={22} />
              <span className="text-[11px] font-medium leading-tight">Приюты</span>
            </button>
            {user?.role === 'shelter' ? (
              <button
                type="button"
                onClick={handleMyShelters}
                className="flex items-center justify-center w-14 h-14 -mt-4 rounded-full bg-[#FF9800] text-white shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
                aria-label={t.header.myShelterOrg ?? 'Мои приюты'}
              >
                <Building2 size={24} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleShelterPets}
                className="flex items-center justify-center w-14 h-14 -mt-4 rounded-full bg-[#FF9800] text-white shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
                aria-label="Питомцы приютов"
              >
                <PawPrint size={24} strokeWidth={2.5} />
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[4rem] pt-2 pb-2 transition-colors ${
                isSearch ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-current={isSearch ? 'page' : undefined}
            >
              <Search size={22} />
              <span className="text-[11px] font-medium leading-tight">{t.common.search}</span>
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center justify-center w-14 h-14 -mt-4 rounded-full bg-[#FF9800] text-white shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
              aria-label={t.header.createAd}
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </>
        )}

        <div className="relative" ref={modeMenuRef}>
          {modeMenuOpen && (
            <div className="absolute bottom-16 right-0 z-50 min-w-[11rem] rounded-xl border border-border bg-card p-1 shadow-lg">
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
          )}
          <button
            type="button"
            onClick={() => setModeMenuOpen((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[4rem] pt-2 pb-2 transition-colors ${
              modeMenuOpen ? 'text-primary' : 'text-muted-foreground'
            }`}
            aria-expanded={modeMenuOpen}
            aria-haspopup="menu"
          >
            {modeMenuOpen ? <ChevronUp size={22} /> : <ListFilter size={22} />}
            <span className="text-[11px] font-medium leading-tight">Режим</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
