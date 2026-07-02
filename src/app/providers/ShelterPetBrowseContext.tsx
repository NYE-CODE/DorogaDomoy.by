import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

type BrowseNavState = {
  petIds: string[];
  currentId: string;
  browseQuery: string;
  loading: boolean;
};

type ShelterPetBrowseContextValue = {
  nav: BrowseNavState | null;
  setBrowseNav: (nav: BrowseNavState | null) => void;
  canPrev: boolean;
  canNext: boolean;
  goPrev: () => void;
  goNext: () => void;
};

const ShelterPetBrowseContext = createContext<ShelterPetBrowseContextValue | null>(null);

export function ShelterPetBrowseProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [nav, setBrowseNav] = useState<BrowseNavState | null>(null);

  const index = nav ? nav.petIds.indexOf(nav.currentId) : -1;
  const canPrev = Boolean(nav && !nav.loading && nav.petIds.length > 1 && index > 0);
  const canNext = Boolean(nav && !nav.loading && nav.petIds.length > 1 && index >= 0 && index < nav.petIds.length - 1);

  const goPrev = useCallback(() => {
    if (!nav || nav.loading || nav.petIds.length <= 1) return;
    const i = nav.petIds.indexOf(nav.currentId);
    if (i <= 0) return;
    navigate(`/shelter-pet/${nav.petIds[i - 1]}${nav.browseQuery}`);
  }, [nav, navigate]);

  const goNext = useCallback(() => {
    if (!nav || nav.loading || nav.petIds.length <= 1) return;
    const i = nav.petIds.indexOf(nav.currentId);
    if (i < 0 || i >= nav.petIds.length - 1) return;
    navigate(`/shelter-pet/${nav.petIds[i + 1]}${nav.browseQuery}`);
  }, [nav, navigate]);

  const value = useMemo(
    () => ({ nav, setBrowseNav, canPrev, canNext, goPrev, goNext }),
    [nav, canPrev, canNext, goPrev, goNext],
  );

  return <ShelterPetBrowseContext.Provider value={value}>{children}</ShelterPetBrowseContext.Provider>;
}

export function useShelterPetBrowse() {
  const ctx = useContext(ShelterPetBrowseContext);
  if (!ctx) {
    throw new Error('useShelterPetBrowse must be used within ShelterPetBrowseProvider');
  }
  return ctx;
}

/** Безопасный доступ из MobileBottomNav — провайдер может быть выше роутера. */
export function useShelterPetBrowseOptional() {
  return useContext(ShelterPetBrowseContext);
}
