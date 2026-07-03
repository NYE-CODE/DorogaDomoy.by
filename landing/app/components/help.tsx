import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, Share2, Users } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useI18n } from "../../../context/I18nContext";
import { useFeatureFlags } from "../../../context/FeatureFlagsContext";
import { helpApi, type HelpDonationTier } from "../../../api/client";
import { copyText } from "../../../utils/copy-text";
import { safeExternalUrl } from "../../../utils/safe-external-url";
import { cn } from "./ui/utils";
import {
  landingContainerWide,
  landingH2,
  landingIconChip,
  landingLeadWideCenter,
  landingPanel,
  landingPathAccentBorder,
  landingSectionAlt,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

const CARD_CONFIG = [
  { icon: Share2, accent: landingPathAccentBorder.found, variant: "secondary" as const },
  { icon: Users, accent: landingPathAccentBorder.shelter, variant: "secondary" as const },
  { icon: Heart, accent: landingPathAccentBorder.lost, variant: "default" as const },
];

export function Help() {
  const { t } = useI18n();
  const { ff_landing_show_help } = useFeatureFlags();
  const h = t.landing.help;
  const ways = h.ways;

  const [volunteerUrl, setVolunteerUrl] = useState("");
  const [donationTiers, setDonationTiers] = useState<HelpDonationTier[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

  useEffect(() => {
    if (!ff_landing_show_help) return;
    let cancelled = false;

    (async () => {
      try {
        const cfg = await helpApi.get();
        if (cancelled) return;
        setVolunteerUrl(cfg.volunteer_url ?? "");
        setDonationTiers(cfg.donation_tiers ?? []);
      } catch {
        if (cancelled) return;
        setVolunteerUrl("");
        setDonationTiers([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ff_landing_show_help]);

  const sortedTiers = useMemo(
    () => [...donationTiers].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
    [donationTiers],
  );

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "https://dorogadomoy.by";
    const payload = { title: "DorogaDomoy.by", text: h.shareText, url };

    setShareHint(null);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share(payload);
        return;
      }
      const line = `${h.shareText}\n${url}`;
      if (await copyText(line)) {
        setShareHint(h.shareCopied);
        return;
      }
      setShareHint(h.shareFailed);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const line = `${h.shareText}\n${url}`;
      if (await copyText(line)) {
        setShareHint(h.shareCopied);
      } else {
        setShareHint(h.shareFailed);
      }
    }
  }, [h.shareCopied, h.shareFailed, h.shareText]);

  const handleVolunteer = useCallback(() => {
    const link = safeExternalUrl(volunteerUrl);
    if (!link) {
      setShareHint(h.volunteerNoLink);
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  }, [h.volunteerNoLink, volunteerUrl]);

  const handleDonationClick = (tier: HelpDonationTier) => {
    const link = safeExternalUrl(tier.payment_url, { httpsOnly: true });
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
    setSupportOpen(false);
  };

  if (!ff_landing_show_help) {
    return (
      <section id="help" className={cn(landingSectionAlt, landingSectionY)}>
        <div className={landingContainerWide} />
      </section>
    );
  }

  return (
    <section id="help" className={cn(landingSectionAlt, landingSectionY)}>
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{h.title}</h2>
          <p className={landingLeadWideCenter}>{h.subtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {CARD_CONFIG.map((card, index) => {
            const w = ways[index];
            if (!w) return null;
            const Icon = card.icon;
            const onClick =
              index === 0 ? () => void handleShare() : index === 1 ? handleVolunteer : () => setSupportOpen(true);

            return (
              <div
                key={index}
                className={cn(
                  landingPanel,
                  "flex flex-col p-5 md:p-6",
                  card.accent,
                  "border-l-[3px] sm:border-l-[3px] sm:border-t-0",
                )}
              >
                <span className={cn(landingIconChip, "mb-5")}>
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="mb-2 text-lg font-semibold leading-tight">{w.title}</h3>
                <p className="mb-5 flex-grow text-sm leading-relaxed text-muted-foreground md:text-base">
                  {w.desc}
                </p>
                <Button
                  type="button"
                  className="mt-auto h-11 w-full rounded-lg font-medium"
                  variant={card.variant}
                  onClick={onClick}
                >
                  {w.action}
                </Button>
              </div>
            );
          })}
        </div>

        {shareHint && (
          <p className="mt-4 text-center text-sm text-muted-foreground" role="status">
            {shareHint}
          </p>
        )}

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
                  <Button
                    key={tier.id}
                    type="button"
                    variant="secondary"
                    className="h-12 w-full justify-center text-base font-semibold"
                    onClick={() => handleDonationClick(tier)}
                  >
                    {tier.label}
                  </Button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
