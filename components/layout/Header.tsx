import { User as UserIcon, LogOut, Settings, Shield, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onViewChange: (view: 'main') => void;
  selectedCity: string;
  onCityClick: () => void;
}

export function Header({ onViewChange, selectedCity, onCityClick }: HeaderProps) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMyAdsClick = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      navigate('/my-ads');
      setIsMenuOpen(false);
    }
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      navigate('/profile');
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shrink-0">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-3 md:py-4">
        {/* Main row */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => onViewChange('main')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0"
          >
            <img
              src="/logo.png"
              alt="DorogaDomoy.by"
              className="h-9 md:h-10 w-auto shrink-0"
            />
            <div className="text-left min-w-0">
              <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white leading-snug truncate">DorogaDomoy.by</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 hidden sm:block">{t.header.tagline}</p>
            </div>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* City button — desktop only */}
            <button
              onClick={onCityClick}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="max-w-[140px] truncate text-gray-800 dark:text-gray-200">
                {selectedCity || t.header.allBelarus}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              {isAuthenticated && user ? (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-1 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 border border-white">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">{t.header.login}</span>
                </button>
              )}

              {/* Dropdown */}
              {isMenuOpen && isAuthenticated && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" />
                    {t.header.profile}
                  </button>

                  <button
                    onClick={handleMyAdsClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" />
                    {t.header.myAds}
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {t.header.settings}
                  </button>

                  {user?.role === 'admin' && (
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>
                      <button
                        onClick={() => {
                          navigate('/admin');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2 font-medium"
                      >
                        <Shield className="w-4 h-4" />
                        {t.header.adminPanel}
                      </button>
                    </>
                  )}

                  <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>
                  
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                      onViewChange('main');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.header.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* City row — mobile only */}
        <button
          onClick={onCityClick}
          className="md:hidden flex items-center gap-2 w-full mt-2.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-gray-800 dark:text-gray-200 truncate">
            {selectedCity || t.header.allBelarus}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-auto" />
        </button>
      </div>
    </header>
  );
}
