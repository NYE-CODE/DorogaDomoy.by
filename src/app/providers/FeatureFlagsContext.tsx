import { createContext, useContext, useEffect, useState } from "react";
import { featureFlagsApi } from "@/shared/api/client";

export interface FeatureFlagsState {
  ff_landing_show_stats: boolean;
  ff_landing_show_pets_feature: boolean;
  ff_landing_show_faq: boolean;
  ff_landing_show_mobile_app: boolean;
  ff_partner_ads_enabled: boolean;
  /** false до ответа API — gated-секции/ссылки не показываем заранее */
  flagsReady: boolean;
}

const defaultFlags: FeatureFlagsState = {
  ff_landing_show_stats: false,
  ff_landing_show_pets_feature: false,
  ff_landing_show_faq: false,
  ff_landing_show_mobile_app: false,
  ff_partner_ads_enabled: false,
  flagsReady: false,
};

const FeatureFlagsContext = createContext<FeatureFlagsState>(defaultFlags);

function parseFlags(
  ff: Awaited<ReturnType<typeof featureFlagsApi.get>>,
): Omit<FeatureFlagsState, "flagsReady"> {
  return {
    ff_landing_show_stats: ff.ff_landing_show_stats === "true",
    ff_landing_show_pets_feature:
      (ff.ff_landing_show_pets_feature ?? "true") === "true",
    ff_landing_show_faq: (ff.ff_landing_show_faq ?? "true") === "true",
    ff_landing_show_mobile_app:
      (ff.ff_landing_show_mobile_app ?? "false") === "true",
    ff_partner_ads_enabled: (ff.ff_partner_ads_enabled ?? "false") === "true",
  };
}

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlagsState>(defaultFlags);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ff = await featureFlagsApi.get();
        if (cancelled) return;
        setFlags({ ...parseFlags(ff), flagsReady: true });
      } catch (e) {
        console.warn("[FeatureFlags] failed to load", e);
        if (!cancelled) {
          // При ошибке — безопасные дефолты (всё gated выкл.), чтобы не светить отключённое
          setFlags({ ...defaultFlags, flagsReady: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
