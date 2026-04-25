import { createContext, useContext, useEffect, useState } from "react";
import { featureFlagsApi } from "../api/client";

export interface FeatureFlagsState {
  ff_landing_show_stats: boolean;
  ff_landing_show_help: boolean;
  ff_landing_show_pets_feature: boolean;
  ff_landing_show_faq: boolean;
  ff_instagram_boost_stories: boolean;
}

const defaultFlags: FeatureFlagsState = {
  ff_landing_show_stats: true,
  ff_landing_show_help: true,
  ff_landing_show_pets_feature: true,
  ff_landing_show_faq: true,
  ff_instagram_boost_stories: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsState>(defaultFlags);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlagsState>(defaultFlags);

  useEffect(() => {
    featureFlagsApi
      .get()
      .then((ff) =>
        setFlags({
          ff_landing_show_stats: ff.ff_landing_show_stats === "true",
          ff_landing_show_help: ff.ff_landing_show_help === "true",
          ff_landing_show_pets_feature:
            (ff.ff_landing_show_pets_feature ?? "true") === "true",
          ff_landing_show_faq: (ff.ff_landing_show_faq ?? "true") === "true",
          ff_instagram_boost_stories: (ff.ff_instagram_boost_stories ?? "true") === "true",
        })
      )
      .catch((e) => {
        console.warn("[FeatureFlags] failed to load", e);
      });
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
