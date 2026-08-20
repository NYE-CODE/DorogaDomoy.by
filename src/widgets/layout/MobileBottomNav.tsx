import { type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Search,
  Plus,
  Building2,
  PawPrint,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/app/providers/I18nContext';
import { useShelterPetBrowseOptional } from '@/app/providers/ShelterPetBrowseContext';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/ui/utils';

const HIDDEN_PREFIXES = ['/create', '/edit/', '/admin', '/terms', '/privacy', '/my-pets/add'];
const SIDE_BTN_CLASS =
  'flex w-full min-w-0 flex-col items-center justify-center gap-0.5 pb-2 pt-2 transition-colors';
const SIDE_ICON = 22;
const SIDE_LABEL = 'text-xs font-medium leading-tight';
const FAB_CLASS =
  'flex size-14 shrink-0 -mt-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform';

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
  const nav = t.nav;
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const browse = useShelterPetBrowseOptional();
  const isMobile = useIsMobile();

  const isSearch = pathname === '/search';
  const isShelters = pathname === '/shelters' || pathname.startsWith('/shelters/');
  const isShelterPetDetail = pathname.startsWith('/shelter-pet/');
  const isShelterPetsTab = pathname === '/shelters' && new URLSearchParams(search).get('tab') === 'pets';
  const isVolunteerOrAdmin = user?.role === 'volunteer' || user?.role === 'admin';
  const showBrowseArrows = isShelterPetDetail;

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
    else if (isShelters) handleSheltersTabToggle();
    else navigate('/shelters');
  };

  const handleMyShelters = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    navigate('/my-shelters');
  };

  if (!isMobile || shouldHide(pathname)) return null;

  const showVolunteerSlot = isVolunteerOrAdmin;

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 overflow-visible border-t border-border bg-background md:hidden"
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
          aria-label={nav.prevPet}
          tabIndex={showBrowseArrows ? 0 : -1}
        >
          <ChevronLeft size={SIDE_ICON} />
        </button>
      </EdgeButton>

      <div
        className={cn(
          'relative mx-auto grid h-16 items-end',
          showVolunteerSlot ? 'grid-cols-4' : 'grid-cols-3',
          navShellClass(showBrowseArrows, showVolunteerSlot),
        )}
      >
        <button
          type="button"
          onClick={() => navigate('/search')}
          className={cn(SIDE_BTN_CLASS, isSearch ? 'text-primary' : 'text-muted-foreground')}
          aria-current={isSearch ? 'page' : undefined}
        >
          <Search size={SIDE_ICON} />
          <SideLabel>{t.common.search}</SideLabel>
        </button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCreate}
            className={FAB_CLASS}
            aria-label={t.header.createAd}
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSheltersPrimary}
          className={cn(SIDE_BTN_CLASS, isShelters ? 'text-primary' : 'text-muted-foreground')}
          aria-label={
            isShelterPetDetail
              ? nav.goToShelters
              : isShelterPetsTab
                ? nav.goToShelters
                : nav.goToPets
          }
        >
          {isShelterPetsTab && !isShelterPetDetail ? (
            <>
              <PawPrint size={SIDE_ICON} />
              <SideLabel>{nav.petsTab}</SideLabel>
            </>
          ) : (
            <>
              <Building2 size={SIDE_ICON} />
              <SideLabel>{t.header.shelters}</SideLabel>
            </>
          )}
        </button>

        {showVolunteerSlot ? (
          <button
            type="button"
            onClick={handleMyShelters}
            className={cn(
              SIDE_BTN_CLASS,
              pathname.startsWith('/my-shelters') ? 'text-primary' : 'text-muted-foreground',
            )}
            aria-label={t.header.myShelterOrg ?? nav.myOrgsShort}
          >
            <Building2 size={SIDE_ICON} />
            <SideLabel>{nav.myOrgsShort}</SideLabel>
          </button>
        ) : null}
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
          aria-label={nav.nextPet}
          tabIndex={showBrowseArrows ? 0 : -1}
        >
          <ChevronRight size={SIDE_ICON} />
        </button>
      </EdgeButton>
    </nav>
  );
}
