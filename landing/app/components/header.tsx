import { MapPin, User, Settings, FileText, Shield, LogOut, ChevronDown, PawPrint, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { CitySelectModal } from "../../../components/city-select-modal";
import { MobileMenuDrawer } from "../../../components/layout/MobileMenuDrawer";
import { useAuth } from "../../../context/AuthContext";
import { useI18n } from "../../../context/I18nContext";
import { useCityOptional } from "../../../context/CityContext";

interface HeaderProps {
  selectedCity?: string;
  onCityClick?: () => void;
  showCitySelector?: boolean;
}

export function Header(props: HeaderProps = {}) {
  const { selectedCity: propSelectedCity, onCityClick, showCitySelector = true } = props || {};
  const cityContext = useCityOptional();
  const selectedCityFromContext = cityContext?.selectedCity ?? '';
  const { t } = useI18n();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(t.landing.header.allBelarus);

  useEffect(() => {
    const fromContext = cityContext?.selectedCity?.trim();
    setSelectedRegion(fromContext || t.landing.header.allBelarus);
  }, [cityContext?.selectedCity, t.landing.header.allBelarus]);

  const hasCityControl = typeof onCityClick === 'function';
  const displayRegion = (selectedCityFromContext?.trim() || propSelectedCity?.trim() || selectedRegion) || t.landing.header.allBelarus;
  const handleRegionClick = () => {
    if (hasCityControl) onCityClick();
    else setIsRegionOpen(true);
  };
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const el = event.target as Element;
      const isInsideProfile = el?.closest?.('[data-profile-menu]');
      if (!isInsideProfile) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="sticky top-0 z-50 bg-background shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <img src="/logo.png" alt="DorogaDomoy.by" className="w-10 h-10 shrink-0 object-contain" />
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold text-foreground leading-tight">DorogaDomoy.by</span>
                <span className="text-sm text-muted-foreground leading-tight hidden md:block">{t.landing.header.tagline}</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4 items-center">
            <Button asChild>
              <Link to="/create" className="bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg px-6 h-12 flex items-center justify-center gap-2 text-lg">
                <span className="text-xl">+</span>
                <span>{t.landing.header.createAd}</span>
              </Link>
            </Button>
            
            {showCitySelector && (
              <button 
                onClick={handleRegionClick}
                className="flex items-center gap-2 px-4 h-12 rounded-lg border border-border"
              >
                <MapPin size={18} className="text-primary" />
                <span className="text-foreground">{displayRegion}</span>
                <ChevronDown size={16} className="text-muted-foreground" />
              </button>
            )}

            <div className="relative" ref={profileRef} data-profile-menu>
              {isAuthenticated && user ? (
                <>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-4 h-12 rounded-lg border border-border hover:border-primary transition-colors"
                  >
                    <div className="w-6 h-6 bg-[#FF9800] rounded-full flex items-center justify-center">
                      <User size={14} className="text-white" />
                    </div>
                    <span className="text-foreground hidden lg:inline">{t.landing.header.profile}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-card rounded-lg shadow-lg border border-border py-2 z-[100]">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="font-bold text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <button onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                          <User size={18} className="text-muted-foreground" />
                          <span className="text-foreground">{t.landing.header.profile}</span>
                        </button>
                        <button onClick={() => { navigate("/my-pets"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                          <PawPrint size={18} className="text-muted-foreground" />
                          <span className="text-foreground">{t.landing.header.myPets}</span>
                        </button>
                        <button onClick={() => { navigate("/my-ads"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                          <FileText size={18} className="text-muted-foreground" />
                          <span className="text-foreground">{t.landing.header.myAds}</span>
                        </button>
                        <button onClick={() => { navigate("/settings"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                          <Settings size={18} className="text-muted-foreground" />
                          <span className="text-foreground">{t.landing.header.settings}</span>
                        </button>
                        {user.role === "admin" && (
                          <button onClick={() => { navigate("/admin"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/10 transition-colors text-left">
                            <Shield size={18} className="text-[#FF9800]" />
                            <span className="text-[#FF9800] font-medium">{t.landing.header.adminPanel}</span>
                          </button>
                        )}
                        <div className="border-t border-border mt-2 pt-2">
                          <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 transition-colors text-left">
                            <LogOut size={18} className="text-destructive" />
                            <span className="text-destructive font-medium">{t.landing.header.logout}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg px-6 h-12 flex items-center justify-center gap-2 text-lg"
                >
                  <User size={18} className="text-white" />
                  <span className="hidden lg:inline">{t.landing.header.login}</span>
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Navigation — burger only, rest moved to MobileBottomNav */}
          <nav className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-12 h-12 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label={t.header.menu ?? 'Menu'}
            >
              <Menu size={22} className="text-foreground" />
            </button>
          </nav>

          <MobileMenuDrawer open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* Mobile Region Selector - Full Width Below */}
        {showCitySelector && (
          <div className="md:hidden pb-4">
            <button 
              onClick={handleRegionClick}
              className="w-full flex items-center justify-center gap-2 px-4 h-12 rounded-lg border border-border"
            >
              <MapPin size={18} className="text-primary" />
              <span className="text-foreground">{displayRegion}</span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* City Select Modal — когда город не управляется родителем (страницы без onCityClick) */}
      {!hasCityControl && cityContext && showCitySelector && (
        <CitySelectModal
          open={isRegionOpen}
          onClose={() => setIsRegionOpen(false)}
          currentCity={selectedCityFromContext || propSelectedCity}
          onSelect={(city) => {
            if (city) {
              cityContext.saveCity(city.coordinates[0], city.coordinates[1], city.name);
            } else {
              cityContext.clearCity();
            }
            setSelectedRegion(city?.name ?? t.landing.header.allBelarus);
            setIsRegionOpen(false);
          }}
        />
      )}
    </header>
  );
}