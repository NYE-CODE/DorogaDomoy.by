import { Plus, User as UserIcon, LogOut, Settings, Shield, MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onViewChange: (view: 'main' | 'my-ads' | 'profile' | 'admin') => void;
  onCreateClick: () => void;
  currentView: 'main' | 'my-ads' | 'profile' | 'admin';
  selectedCity: string;
  onCityClick: () => void;
}

export function Header({ onViewChange, onCreateClick, currentView, selectedCity, onCityClick }: HeaderProps) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
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

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      onCreateClick();
    }
  };

  const handleMyAdsClick = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      onViewChange('my-ads');
      setIsMenuOpen(false);
    }
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      onViewChange('profile');
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shrink-0">
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
              <h1 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug truncate">DorogaDomoy.by</h1>
              <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">Дорога Домой — поиск пропавших питомцев</p>
            </div>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* City button — desktop only */}
            <button
              onClick={onCityClick}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
            >
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="max-w-[140px] truncate text-gray-800">
                {selectedCity || 'Вся Беларусь'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>

            <button
              onClick={handleCreateClick}
              className="flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow shrink-0"
              title="Создать объявление"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Создать объявление</span>
            </button>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              {isAuthenticated && user ? (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-1 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full bg-gray-200 object-cover border border-white"
                  />
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Войти</span>
                </button>
              )}

              {/* Dropdown */}
              {isMenuOpen && isAuthenticated && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Профиль
                  </button>

                  <button
                    onClick={handleMyAdsClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" />
                    Мои объявления
                  </button>

                  {user?.role === 'admin' && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          onViewChange('admin');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2 font-medium"
                      >
                        <Shield className="w-4 h-4" />
                        Админ панель
                      </button>
                    </>
                  )}

                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                      onViewChange('main');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* City row — mobile only */}
        <button
          onClick={onCityClick}
          className="md:hidden flex items-center gap-2 w-full mt-2.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
        >
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-gray-800 truncate">
            {selectedCity || 'Вся Беларусь'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-auto" />
        </button>
      </div>
    </header>
  );
}
