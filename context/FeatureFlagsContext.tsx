import { createContext, useContext, useEffect, useState } from "react";
import { featureFlagsApi } from "../api/client";

export interface FeatureFlagsState {
  ff_landing_show_stats: boolean;
  ff_landing_show_help: boolean;
}

const defaultFlags: FeatureFlagsState = {
  ff_landing_show_stats: true,
  ff_landing_show_help: true,
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
        })
      )
      .catch(() => {});
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
