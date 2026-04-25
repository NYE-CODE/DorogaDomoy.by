import { MapPin, User, Settings, FileText, Shield, LogOut, ChevronDown, PawPrint, Menu, Heart } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { CitySelectModal } from "../../../components/city-select-modal";
import { MobileMenuDrawer } from "../../../components/layout/MobileMenuDrawer";
import { useAuth } from "../../../context/AuthContext";
import { useI18n } from "../../../context/I18nContext";
import { useCityOptional } from "../../../context/CityContext";
import { landingContainerWide, landingHeaderPrimaryCtaClass } from "./landing-section-styles";

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
    <>
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className={landingContainerWide}>
        <div className="flex items-center justify-between py-4 md:py-5">
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
            <Link
              to="/blog"
              className="hidden h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted md:inline-flex md:h-12"
            >
              {t.landing.header.blog}
            </Link>
            <Button asChild>
              <Link to="/create" className={`${landingHeaderPrimaryCtaClass} shrink-0`}>
                <span className="text-xl leading-none">+</span>
                <span>{t.landing.header.createAd}</span>
              </Link>
            </Button>
            
            {showCitySelector && (
              <button
                type="button"
                onClick={handleRegionClick}
                className="flex h-12 max-w-[220px] items-center gap-2 truncate rounded-lg border border-border px-4 transition-colors hover:bg-muted/80 lg:max-w-none"
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
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex h-12 items-center gap-2 rounded-lg border border-border px-4 transition-colors hover:border-primary hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User size={14} />
                    </div>
                    <span className="text-foreground hidden lg:inline">{t.landing.header.profile}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 z-[100] mt-2 w-64 rounded-xl border border-border bg-card py-2 shadow-lg">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="font-bold text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <button type="button" onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted">
                          <User size={18} className="text-muted-foreground" />
                          <span className="text-foreground">{t.landing.header.profile}</span>
                        </button>
                        <button type="button" onClick={() => { navigate("/my-pets"); setIsProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted">
                          <PawPrint size={18} className="text-muted-foreground" />
                          <span className="text-foreground">{t.landing.header.myPets}</span>
                        </button>
                        <button type="button" onClick={() => { navigate("/my-ads"); setIsProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted">
                          <FileText size={18} className="text-muted-foreground" />
                          <span className="text-foreground">{t.landing.header.myAds}</span>
                        </button>
                        <button type="button" onClick={() => { navigate("/favorites"); setIsProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted">
                          <Heart size={16} className="text-rose-500" />
                          <span className="text-foreground">{t.header.favorites}</span>
                        </button>
                        <button type="button" onClick={() => { navigate("/settings"); setIsProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted">
                          <Settings size={18} className="text-muted-foreground" />
                          <span className="text-foreground">{t.landing.header.settings}</span>
                        </button>
                        {user.role === "admin" && (
                          <button
                            type="button"
                            onClick={() => { navigate("/admin"); setIsProfileOpen(false); }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            <Shield size={18} className="text-primary" />
                            <span>{t.landing.header.adminPanel}</span>
                          </button>
                        )}
                        <div className="border-t border-border mt-2 pt-2">
                          <button type="button" onClick={() => { logout(); setIsProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-destructive/10">
                            <LogOut size={18} className="text-destructive" />
                            <span className="text-destructive font-medium">{t.landing.header.logout}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button type="button" onClick={openAuthModal} className={landingHeaderPrimaryCtaClass}>
                  <User size={18} className="text-primary-foreground" />
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
        </div>

        {/* Mobile Region Selector - Full Width Below */}
        {showCitySelector && (
          <div className="border-t border-border/60 pb-3 pt-3 md:hidden">
            <button
              type="button"
              onClick={handleRegionClick}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 transition-colors hover:bg-muted/80"
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

    {/* Вне шапки: иначе fixed+z-index заперты в контексте z-40 и меню оказывается под контентом */}
    <MobileMenuDrawer open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}