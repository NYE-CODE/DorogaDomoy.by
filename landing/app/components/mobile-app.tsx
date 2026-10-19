import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useI18n } from "../../../context/I18nContext";
import { settingsApi } from "../../../api/client";
import { safeExternalUrl } from "../../../utils/safe-external-url";
import { LandingCta } from "./landing-cta";
import { cn } from "./ui/utils";
import {
  landingContainerWide,
  landingH2,
  landingLead,
  landingMuted,
  landingSectionBase,
  landingSectionY,
} from "./landing-section-styles";

export function MobileApp() {
  const { t } = useI18n();
  const m = t.landing.mobileApp;
  const [playUrl, setPlayUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await settingsApi.get();
        if (cancelled) return;
        setPlayUrl((s.mobile_app_play_url ?? "").trim());
      } catch {
        if (!cancelled) setPlayUrl("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const safeUrl = safeExternalUrl(playUrl, { httpsOnly: true });
  if (!safeUrl) return null;

  const openStore = () => {
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="mobile-app" className={cn(landingSectionBase, landingSectionY)}>
      <div className={landingContainerWide}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0 max-w-md space-y-3 text-left">
            <h2 className={cn(landingH2, "mb-0")}>{m.title}</h2>
            <p className={landingLead}>{m.subtitle}</p>
            <div className="pt-4">
              <LandingCta type="button" showArrow onClick={openStore}>
                {m.cta}
              </LandingCta>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[13.5rem] flex-col items-center gap-3 lg:mx-0 lg:justify-self-end">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <QRCode value={safeUrl} size={168} level="M" aria-label={m.qrAlt} />
            </div>
            <p className={cn(landingMuted, "text-center")}>{m.qrHint}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
