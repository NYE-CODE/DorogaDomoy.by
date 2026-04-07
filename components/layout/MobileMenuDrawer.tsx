import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  X,
  Home,
  Search,
  FileText,
  PawPrint,
  Settings,
  Shield,
  LogOut,
  LogIn,
  User,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useScrollLock } from '../ui/use-scroll-lock';

interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenuDrawer({ open, onClose }: MobileMenuDrawerProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useI18n();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogin = () => {
    onClose();
    openAuthModal();
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  const isActive = (path: string) => pathname === path;

  const linkCls = (path: string) =>
    `flex items-center gap-3 px-5 py-3.5 text-[15px] transition-colors ${
      isActive(path)
        ? 'text-primary font-semibold bg-primary/5'
        : 'text-foreground hover:bg-muted'
    }`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className="absolute top-0 right-0 bottom-0 w-[min(20rem,85vw)] bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={t.header.menu ?? 'Menu'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <span className="text-lg font-bold text-foreground">{t.header.menu ?? 'Меню'}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg hover:bg-muted text-muted-foreground"
            aria-label={t.common.close}
          >
            <X size={22} />
          </button>
        </div>

        {/* User info (if authenticated) */}
        {isAuthenticated && user && (
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF9800] rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <button type="button" onClick={() => go('/')} className={linkCls('/')}>
            <Home size={20} />
            <span>{t.header.home ?? 'Главная'}</span>
          </button>
          <button type="button" onClick={() => go('/search')} className={linkCls('/search')}>
            <Search size={20} />
            <span>{t.header.searchAds ?? t.common.search}</span>
          </button>
          <button type="button" onClick={() => go('/blog')} className={linkCls('/blog')}>
            <BookOpen size={20} />
            <span>{t.header.blog}</span>
          </button>

          {isAuthenticated && (
            <>
              <div className="my-2 mx-5 border-t border-border" />
              <button type="button" onClick={() => go('/my-ads')} className={linkCls('/my-ads')}>
                <FileText size={20} />
                <span>{t.header.myAds}</span>
              </button>
              <button type="button" onClick={() => go('/my-pets')} className={linkCls('/my-pets')}>
                <PawPrint size={20} />
                <span>{t.header.myPets ?? t.landing?.header?.myPets}</span>
              </button>
              <button type="button" onClick={() => go('/settings')} className={linkCls('/settings')}>
                <Settings size={20} />
                <span>{t.header.settings}</span>
              </button>

              {user?.role === 'admin' && (
                <button type="button" onClick={() => go('/admin')} className={linkCls('/admin')}>
                  <Shield size={20} className="text-[#FF9800]" />
                  <span className="text-[#FF9800] font-medium">{t.header.adminPanel}</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Footer: login / logout */}
        <div className="border-t border-border px-5 py-3 shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-0 py-3 text-destructive text-[15px] font-medium"
            >
              <LogOut size={20} />
              <span>{t.header.logout}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="flex items-center gap-3 w-full px-0 py-3 text-primary text-[15px] font-medium"
            >
              <LogIn size={20} />
              <span>{t.header.login}</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
