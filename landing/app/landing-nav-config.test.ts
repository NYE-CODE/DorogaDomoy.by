import { describe, expect, it } from "vitest";
import type { FeatureFlagsState } from "@/app/providers/FeatureFlagsContext";
import {
  LANDING_NAV_ITEMS,
  isLandingNavItemVisible,
} from "./landing-nav-config";

function flags(partial: Partial<FeatureFlagsState>): FeatureFlagsState {
  return {
    ff_landing_show_stats: false,
    ff_landing_show_pets_feature: false,
    ff_landing_show_faq: false,
    ff_landing_show_mobile_app: false,
    ff_partner_ads_enabled: false,
    flagsReady: true,
    ...partial,
  };
}

describe("isLandingNavItemVisible", () => {
  it("всегда показывает секции без флага", () => {
    const nearby = LANDING_NAV_ITEMS.find((i) => i.hash === "pets-nearby")!;
    expect(isLandingNavItemVisible(nearby, flags({ flagsReady: false }))).toBe(
      true,
    );
  });

  it("скрывает gated-пункты до загрузки флагов", () => {
    const faq = LANDING_NAV_ITEMS.find((i) => i.hash === "faq")!;
    expect(
      isLandingNavItemVisible(
        faq,
        flags({ flagsReady: false, ff_landing_show_faq: true }),
      ),
    ).toBe(false);
  });

  it("скрывает отключённые секции после загрузки", () => {
    const faq = LANDING_NAV_ITEMS.find((i) => i.hash === "faq")!;
    const mobile = LANDING_NAV_ITEMS.find((i) => i.hash === "mobile-app")!;
    expect(
      isLandingNavItemVisible(faq, flags({ ff_landing_show_faq: false })),
    ).toBe(false);
    expect(
      isLandingNavItemVisible(
        mobile,
        flags({ ff_landing_show_mobile_app: false }),
      ),
    ).toBe(false);
  });

  it("показывает включённые gated-секции", () => {
    const faq = LANDING_NAV_ITEMS.find((i) => i.hash === "faq")!;
    expect(
      isLandingNavItemVisible(faq, flags({ ff_landing_show_faq: true })),
    ).toBe(true);
  });
});
