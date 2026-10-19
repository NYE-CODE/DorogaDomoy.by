import type { FeatureFlagsState } from "@/app/providers/FeatureFlagsContext";

/** Якоря секций лендинга — должны совпадать с id на странице и порядком в App.tsx */
export type LandingNavHash =
  | "stats"
  | "pets-feature"
  | "mobile-app"
  | "shelter-pets"
  | "pets-nearby"
  | "how-it-works"
  | "media"
  | "partners"
  | "faq";

export type LandingNavFlagKey = Pick<
  FeatureFlagsState,
  | "ff_landing_show_stats"
  | "ff_landing_show_pets_feature"
  | "ff_landing_show_mobile_app"
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
  { hash: "pets-nearby" },
  { hash: "how-it-works" },
  { hash: "shelter-pets" },
  { hash: "pets-feature", requiredFlag: "ff_landing_show_pets_feature" },
  { hash: "mobile-app", requiredFlag: "ff_landing_show_mobile_app" },
  { hash: "media" },
  { hash: "partners" },
  { hash: "faq", requiredFlag: "ff_landing_show_faq" },
];

/** Пункт футера/навигации виден только если секция включена флагом (и флаги уже загружены). */
export function isLandingNavItemVisible(
  item: LandingNavItemDef,
  ff: FeatureFlagsState,
): boolean {
  if (!item.requiredFlag) return true;
  if (!ff.flagsReady) return false;
  return ff[item.requiredFlag] === true;
}
