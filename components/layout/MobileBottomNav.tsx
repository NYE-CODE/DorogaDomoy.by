import { useLocation, useNavigate } from 'react-router';
import { Search, Plus, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useIsMobile } from '../ui/use-mobile';

const HIDDEN_PREFIXES = ['/create', '/edit/', '/admin', '/terms', '/my-pets/add'];

function shouldHide(pathname: string): boolean {
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (/^\/my-pets\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isAuthenticated, openAuthModal } = useAuth();
  const isMobile = useIsMobile();

  if (!isMobile || shouldHide(pathname)) return null;

  const isSearch = pathname === '/search';
  const isProfile = pathname === '/profile';

  const handleCreate = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    navigate('/create');
  };

  const handleProfile = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    navigate('/profile');
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)', transform: 'translateZ(0)' }}
    >
      <div className="flex items-end justify-around h-16 px-4 max-w-lg mx-auto">
        {/* Search */}
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

        {/* Create — elevated center button */}
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center justify-center w-14 h-14 -mt-4 rounded-full bg-[#FF9800] text-white shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
          aria-label={t.header.createAd}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>

        {/* Profile */}
        <button
          type="button"
          onClick={handleProfile}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[4rem] pt-2 pb-2 transition-colors ${
            isProfile ? 'text-primary' : 'text-muted-foreground'
          }`}
          aria-current={isProfile ? 'page' : undefined}
        >
          <User size={22} />
          <span className="text-[11px] font-medium leading-tight">{t.header.profile}</span>
        </button>
      </div>
    </nav>
  );
}
