import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Smartphone } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import { settingsApi } from "../../../api/client";
import { safeExternalUrl } from "../../../utils/safe-external-url";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import {
  landingContainerWide,
  landingH2,
  landingLead,
  landingPanel,
  landingSectionAlt,
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
    <section id="mobile-app" className={cn(landingSectionAlt, landingSectionY)}>
      <div className={landingContainerWide}>
        <div
          className={cn(
            landingPanel,
            "grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_auto] lg:gap-12 lg:p-10",
          )}
        >
          <div className="min-w-0 text-center lg:text-left">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary lg:justify-start">
              <Smartphone size={28} aria-hidden />
            </div>
            <h2 className={cn(landingH2, "mb-3")}>{m.title}</h2>
            <p className={cn(landingLead, "mx-auto max-w-xl lg:mx-0")}>{m.subtitle}</p>
            <Button
              type="button"
              className="mt-6 h-12 rounded-lg px-6 text-base font-semibold"
              onClick={openStore}
            >
              {m.cta}
            </Button>
          </div>

          <div className="mx-auto flex w-full max-w-[220px] flex-col items-center gap-3">
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <QRCode value={safeUrl} size={168} level="M" aria-label={m.qrAlt} />
            </div>
            <p className="text-center text-xs leading-snug text-muted-foreground sm:text-sm">
              {m.qrHint}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
