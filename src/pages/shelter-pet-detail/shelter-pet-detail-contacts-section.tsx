import { Link } from 'react-router';
import { Building2, Globe, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import type { ShelterResponse } from '@/shared/api/client';
import { appMessengerCtaSizingClass } from '@/shared/styles/cta-classes';
import { surfaceCtaOutline, surfacePanel } from '@/shared/styles/surface-classes';
import { shelterLogoSrc } from '@/shared/lib/shelter-public';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/ui/utils';
import { RevealPhoneButton } from '../../../components/reveal-phone-button';
import type { ShelterContactDisplay, ShelterPetDetailT } from './shelter-pet-detail-glyphs';

export interface ShelterPetDetailContactsSectionProps {
  t: ShelterPetDetailT;
  shelter: ShelterResponse | null;
  contacts: ShelterContactDisplay;
}

export function ShelterPetDetailContactsSection({
  t,
  shelter,
  contacts,
}: ShelterPetDetailContactsSectionProps) {
  const {
    displayPhone,
    displayTelegram,
    displayViber,
    displayEmail,
    displayWebsiteUrl,
    hasContactChannels,
    shelterLocationLine,
  } = contacts;

  const shelterLogoUrl = shelter ? shelterLogoSrc(shelter.logo_url) : undefined;

  return (
    <div className={cn(surfacePanel, 'p-5 sm:p-6')}>
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground sm:text-xl">
        {t.landing.shelters.detailContacts}
      </h2>
      {shelter ? (
        <div className="mb-5 rounded-2xl bg-landing-muted/60 p-3.5 text-sm">
          <div className="flex gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card">
              {shelterLogoUrl ? (
                <img
                  src={shelterLogoUrl}
                  alt={shelter.name}
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-6 text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-semibold leading-snug text-foreground">{shelter.name}</p>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-shelter" aria-hidden />
                <span>{shelterLocationLine || '—'}</span>
              </p>
              <Link
                to={`/shelters/${shelter.id}`}
                className="inline-flex items-center gap-1 font-medium text-shelter transition-colors hover:text-shelter-foreground"
              >
                {t.backQuickMenu.shelterPage}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <div className="space-y-3">
        {displayPhone ? <RevealPhoneButton phone={displayPhone} /> : null}
        {displayTelegram ? (
          <Button
            className={cn(appMessengerCtaSizingClass, 'w-full rounded-full border-0 bg-telegram text-white hover:bg-telegram-hover')}
            asChild
          >
            <a
              href={`https://t.me/${displayTelegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send className="size-5" aria-hidden />
              Telegram
            </a>
          </Button>
        ) : null}
        {displayViber ? (
          <Button
            className={cn(appMessengerCtaSizingClass, 'w-full rounded-full border-0 bg-viber text-white hover:bg-viber-hover')}
            asChild
          >
            <a href={`viber://chat?number=${displayViber.replace('+', '')}`}>
              <MessageCircle className="size-5" aria-hidden />
              Viber
            </a>
          </Button>
        ) : null}
        {displayEmail ? (
          <Button className={cn(surfaceCtaOutline, 'w-full')} asChild>
            <a href={`mailto:${displayEmail}`}>
              <Mail className="size-5" aria-hidden />
              {displayEmail}
            </a>
          </Button>
        ) : null}
        {displayWebsiteUrl ? (
          <Button className={cn(surfaceCtaOutline, 'w-full')} asChild>
            <a href={displayWebsiteUrl} target="_blank" rel="noopener noreferrer">
              <Globe className="size-5" aria-hidden />
              Открыть сайт
            </a>
          </Button>
        ) : null}
        {!hasContactChannels ? (
          <p className="text-sm text-muted-foreground">
            {shelter ? (
              <>
                У организации нет прямых контактов — напишите через{' '}
                <Link
                  to={`/shelters/${shelter.id}`}
                  className="font-medium text-shelter underline-offset-4 hover:underline"
                >
                  {t.backQuickMenu.shelterPage}
                </Link>
                .
              </>
            ) : (
              <>{t.landing.shelters.detailNoContacts}</>
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
