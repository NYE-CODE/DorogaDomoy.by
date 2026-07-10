import { useMemo } from 'react';
import { useI18n } from '@/app/providers/I18nContext';
import { API_BASE } from '@/shared/api/base';
import { cn } from '@/shared/ui/utils';
import type { PartnerAdPlacement } from '@/shared/lib/partner-ad-placements';
import { usePartnerAd } from './PartnerAdsContext';

function resolveBannerUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

export interface PartnerAdSlotProps {
  placement: PartnerAdPlacement;
  className?: string;
  /** Компактный вид для sidebar */
  compact?: boolean;
}

export function PartnerAdSlot({ placement, className, compact = false }: PartnerAdSlotProps) {
  const { t } = useI18n();
  const ad = usePartnerAd(placement);

  const label = useMemo(() => {
    if (!ad) return '';
    const name = ad.sponsor_label?.trim() || ad.partner_name?.trim() || ad.title;
    return t.partnerAds.sponsoredBy.replace('{name}', name);
  }, [ad, t.partnerAds.sponsoredBy]);

  if (!ad) return null;

  const desktopSrc = resolveBannerUrl(ad.image_desktop);
  const mobileSrc = resolveBannerUrl(ad.image_mobile || ad.image_desktop);
  const alt = ad.alt_text?.trim() || label || t.partnerAds.sponsoredLabel;

  return (
    <aside
      className={cn('overflow-hidden rounded-lg border border-border bg-muted/30', className)}
      aria-label={t.partnerAds.sponsoredLabel}
    >
      <p className="px-3 pt-2 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <a
        href={ad.link_url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="mt-1 block p-2 pt-0 transition-opacity hover:opacity-90"
      >
        <picture>
          <source media="(max-width: 639px)" srcSet={mobileSrc} />
          <img
            src={desktopSrc}
            alt={alt}
            className={cn(
              'mx-auto w-full rounded-md object-contain',
              compact ? 'max-h-40' : 'max-h-28 sm:max-h-32',
            )}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </a>
    </aside>
  );
}
