import { useEffect, useMemo, useState } from "react";
import { Mail, MessageCircle, Bot, Heart } from "lucide-react";
import { Link } from "react-router";
import { useI18n } from "../../../context/I18nContext";
import type { translations } from "../../../i18n/translations";
import { useFeatureFlags } from "@/app/providers/FeatureFlagsContext";
import { helpApi, type HelpDonationTier } from "../../../api/client";
import { safeExternalUrl } from "../../../utils/safe-external-url";
import {
  LANDING_NAV_ITEMS,
  type LandingNavHash,
  isLandingNavItemVisible,
} from "../landing-nav-config";
import { LandingCta } from "./landing-cta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { landingContainerWide } from "./landing-section-styles";

function landingNavLabel(hash: LandingNavHash, t: (typeof translations)["ru"]): string {
  const f = t.landing.footer;
  switch (hash) {
    case "stats":
      return t.landing.help.statsTitle;
    case "pets-feature":
      return f.sectionPets;
    case "mobile-app":
      return f.mobileApp;
    case "shelter-pets":
      return f.sectionShelterPets;
    case "pets-nearby":
      return f.sectionPetsNearby;
    case "how-it-works":
      return f.sectionHowItWorks;
    case "media":
      return t.landing.media.title;
    case "partners":
      return f.partners;
    case "faq":
      return f.faq;
  }
}

export function Footer() {
  const { t } = useI18n();
  const ff = useFeatureFlags();
  const f = t.landing.footer;
  const h = t.landing.help;

  const [supportOpen, setSupportOpen] = useState(false);
  const [donationTiers, setDonationTiers] = useState<HelpDonationTier[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await helpApi.get();
        if (cancelled) return;
        setDonationTiers(cfg.donation_tiers ?? []);
      } catch {
        if (!cancelled) setDonationTiers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedTiers = useMemo(
    () =>
      [...donationTiers].sort(
        (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
      ),
    [donationTiers],
  );

  const handleDonationClick = (tier: HelpDonationTier) => {
    const link = safeExternalUrl(tier.payment_url, { httpsOnly: true });
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
    setSupportOpen(false);
  };

  /** Только секции, которые реально рендерятся (те же feature flags, что в App.tsx) */
  const navLinks = useMemo(
    () =>
      LANDING_NAV_ITEMS.filter((item) => isLandingNavItemVisible(item, ff)).map(
        (item) => ({
          to: `/#${item.hash}`,
          label: landingNavLabel(item.hash, t),
        }),
      ),
    [ff, t],
  );

  const linkClass =
    "rounded-sm text-on-landing-dark-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-landing-dark";

  const colTitleClass = "mb-5 text-sm font-semibold text-on-landing-dark";

  return (
    <footer className="bg-landing-dark text-on-landing-dark">
      <div className={`${landingContainerWide} py-12 pb-24 md:pb-14`}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Link
                to="/"
                className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-landing-dark"
              >
                <img
                  src="/logo.png"
                  alt="DorogaDomoy.by"
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <span className="text-xl font-bold tracking-tight text-on-landing-dark">
                  DorogaDomoy.by
                </span>
              </Link>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-on-landing-dark-muted">{f.about}</p>
            <LandingCta
              type="button"
              variant="primaryOnDark"
              className="mt-5"
              onClick={() => setSupportOpen(true)}
            >
              <Heart size={18} aria-hidden />
              {f.supportProject}
            </LandingCta>
          </div>

          <div>
            <h3 className={colTitleClass}>{f.contactsTitle}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@dorogadomoy.by"
                  className={`${linkClass} inline-flex items-center gap-3 text-sm`}
                >
                  <Mail size={18} className="shrink-0 opacity-80" aria-hidden />
                  <span>contact@dorogadomoy.by</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/dorogadomoy_by"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-3 text-sm`}
                >
                  <MessageCircle size={18} className="shrink-0 opacity-80" aria-hidden />
                  <span>{f.telegramGroup}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/dorogadomoy_support_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-3 text-sm`}
                >
                  <Bot size={18} className="shrink-0 opacity-80" aria-hidden />
                  <span>{f.supportBot}</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className={colTitleClass}>{f.navTitle}</h3>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {navLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={`${linkClass} text-sm`}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-on-landing-dark/15 pt-8 text-center text-sm text-on-landing-dark-muted">
          <p>
            &copy; {new Date().getFullYear()} DorogaDomoy.by — {f.copyright}
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <a href="/poisk-propavshih-zhivotnyh/" className={linkClass}>
              {f.searchGuide}
            </a>
            <span className="text-on-landing-dark/30" aria-hidden>
              ·
            </span>
            <Link to="/terms" className={linkClass}>
              {f.rules}
            </Link>
            <span className="text-on-landing-dark/30" aria-hidden>
              ·
            </span>
            <Link to="/privacy" className={linkClass}>
              {f.privacyPolicy}
            </Link>
            <span className="text-on-landing-dark/30" aria-hidden>
              ·
            </span>
            <Link to="/delete-account" className={linkClass}>
              {f.deleteAccount}
            </Link>
          </p>
        </div>
      </div>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{h.supportModalTitle}</DialogTitle>
            <DialogDescription>{h.supportModalHint}</DialogDescription>
          </DialogHeader>
          {sortedTiers.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">{h.supportEmpty}</p>
          ) : (
            <div className="grid gap-2 pt-1">
              {sortedTiers.map((tier) => (
                <LandingCta
                  key={tier.id}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDonationClick(tier)}
                >
                  {tier.label}
                </LandingCta>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </footer>
  );
}
