import { Mail, MessageCircle, Bot } from "lucide-react";
import { Link } from "react-router";
import { useI18n } from "../../../context/I18nContext";
import type { translations } from "../../../i18n/translations";
import { useFeatureFlags } from "../../../context/FeatureFlagsContext";
import {
  LANDING_NAV_ITEMS,
  type LandingNavHash,
  isLandingNavItemVisible,
} from "../landing-nav-config";
import { landingContainerWide } from "./landing-section-styles";

function landingNavLabel(hash: LandingNavHash, t: (typeof translations)["ru"]): string {
  const f = t.landing.footer;
  switch (hash) {
    case "stats":
      return (
        (t.landing.help as { statsTitle?: string }).statsTitle ?? "В цифрах"
      );
    case "how-it-works":
      return f.howItWorks;
    case "pets-feature":
      return f.sectionPets;
    case "announcements":
      return f.ads;
    case "why-us":
      return f.whyUs;
    case "media":
      return t.landing.media.title;
    case "partners":
      return f.partners;
    case "help":
      return f.help;
    case "faq":
      return f.faq;
  }
}

export function Footer() {
  const { t } = useI18n();
  const ff = useFeatureFlags();
  const f = t.landing.footer;

  /** Пункты только для секций, которые включены теми же флагами, что и в App.tsx */
  const navLinks = LANDING_NAV_ITEMS.filter((item) =>
    isLandingNavItemVisible(item, ff),
  ).map((item) => ({
    to: `/#${item.hash}`,
    label: landingNavLabel(item.hash, t),
  }));

  const linkClass =
    "text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm";

  const colTitleClass = "mb-5 text-sm font-semibold text-foreground";

  return (
    <footer className="border-t border-border bg-muted/35 dark:bg-muted/20">
      <div className={`${landingContainerWide} py-12 pb-24 md:pb-14`}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
                <img src="/logo.png" alt="DorogaDomoy.by" className="h-10 w-10 shrink-0 object-contain" />
                <span className="text-xl font-bold tracking-tight text-foreground">DorogaDomoy.by</span>
              </Link>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{f.about}</p>
          </div>

          <div>
            <h3 className={colTitleClass}>{f.contactsTitle}</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contact@dorogadomoy.by" className={`${linkClass} inline-flex items-center gap-3 text-sm`}>
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

        <div className="mt-10 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} DorogaDomoy.by — {f.copyright}
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link to="/terms" className={`${linkClass}`}>
              {f.rules}
            </Link>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <Link to="/terms" className={`${linkClass}`}>
              {f.privacyPolicy}
            </Link>
          </p>
          <p className="mt-2">
            {f.madeWith} <span className="text-primary">♥</span> {f.forPets}
          </p>
        </div>
      </div>
    </footer>
  );
}
