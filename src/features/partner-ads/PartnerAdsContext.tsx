import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { partnerAdsApi, type PartnerAd } from '@/shared/api/partner-ads';
import type { PartnerAdPlacement } from '@/shared/lib/partner-ad-placements';
import { useFeatureFlags } from '@/app/providers/FeatureFlagsContext';

interface PartnerAdsContextValue {
  enabled: boolean;
  loading: boolean;
  getAdForPlacement: (placement: PartnerAdPlacement) => PartnerAd | null;
  refresh: () => void;
}

const PartnerAdsContext = createContext<PartnerAdsContextValue>({
  enabled: false,
  loading: false,
  getAdForPlacement: () => null,
  refresh: () => undefined,
});

export function PartnerAdsProvider({ children }: { children: React.ReactNode }) {
  const { ff_partner_ads_enabled } = useFeatureFlags();
  const [ads, setAds] = useState<PartnerAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!ff_partner_ads_enabled) {
      setAds([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    partnerAdsApi
      .listActive()
      .then((list) => {
        if (!cancelled) setAds(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setAds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ff_partner_ads_enabled, reloadToken]);

  const getAdForPlacement = useCallback(
    (placement: PartnerAdPlacement) => {
      for (const ad of ads) {
        if (ad.placements?.includes(placement)) return ad;
      }
      return null;
    },
    [ads],
  );

  const value = useMemo(
    () => ({
      enabled: ff_partner_ads_enabled,
      loading,
      getAdForPlacement,
      refresh,
    }),
    [ff_partner_ads_enabled, loading, getAdForPlacement, refresh],
  );

  return <PartnerAdsContext.Provider value={value}>{children}</PartnerAdsContext.Provider>;
}

export function usePartnerAds() {
  return useContext(PartnerAdsContext);
}

export function usePartnerAd(placement: PartnerAdPlacement) {
  const { enabled, getAdForPlacement } = usePartnerAds();
  if (!enabled) return null;
  return getAdForPlacement(placement);
}
