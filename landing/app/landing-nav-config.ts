import type { FeatureFlagsState } from "../../context/FeatureFlagsContext";

/** Якоря секций лендинга — должны совпадать с id на странице и порядком в App.tsx */
export type LandingNavHash =
  | "stats"
  | "how-it-works"
  | "pets-feature"
  | "announcements"
  | "why-us"
  | "media"
  | "partners"
  | "help"
  | "faq";

export type LandingNavFlagKey = Pick<
  FeatureFlagsState,
  | "ff_landing_show_stats"
  | "ff_landing_show_pets_feature"
  | "ff_landing_show_help"
  | "ff_landing_show_faq"
>;

export type LandingNavItemDef = {
  hash: LandingNavHash;
  /** Если задано — ссылка показывается только когда эта секция реально рендерится в App.tsx */
  requiredFlag?: keyof LandingNavFlagKey;
};

/**
 * Порядок как на главной (`landing/app/App.tsx`).
 * Любая секция с флагом здесь должна условно рендериться там же через тот же флаг.
 */
export const LANDING_NAV_ITEMS: readonly LandingNavItemDef[] = [
  { hash: "stats", requiredFlag: "ff_landing_show_stats" },
  { hash: "how-it-works" },
  { hash: "pets-feature", requiredFlag: "ff_landing_show_pets_feature" },
  { hash: "announcements" },
  { hash: "why-us" },
  { hash: "media" },
  { hash: "partners" },
  { hash: "help", requiredFlag: "ff_landing_show_help" },
  { hash: "faq", requiredFlag: "ff_landing_show_faq" },
];

export function isLandingNavItemVisible(item: LandingNavItemDef, ff: FeatureFlagsState): boolean {
  if (!item.requiredFlag) return true;
  return ff[item.requiredFlag];
}
