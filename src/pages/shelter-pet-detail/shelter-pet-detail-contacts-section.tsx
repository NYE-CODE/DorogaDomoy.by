import { Link } from 'react-router';
import { Building2, Globe, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import type { ShelterResponse } from '@/shared/api/client';
import { appMessengerCtaSizingClass, appOutlineCtaClass } from '@/shared/styles/cta-classes';
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
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="typo-h2 mb-4">{t.landing.shelters.detailContacts}</h2>
      {shelter ? (
        <div className="mb-4 rounded-md border border-border/70 bg-muted/30 p-3 text-sm">
          <div className="flex gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-background">
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
              <p className="font-semibold leading-snug">{shelter.name}</p>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
                <span>{shelterLocationLine || '?'}</span>
              </p>
              <Link
                to={`/shelters/${shelter.id}`}
                className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80"
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
          <Button className={cn(appMessengerCtaSizingClass, 'w-full border-0 bg-telegram text-white hover:bg-telegram-hover')} asChild>
            <a href={`https://t.me/${displayTelegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
              <Send className="size-5" />
              Telegram
            </a>
          </Button>
        ) : null}
        {displayViber ? (
          <Button className={cn(appMessengerCtaSizingClass, 'w-full border-0 bg-viber text-white hover:bg-viber-hover')} asChild>
            <a href={`viber://chat?number=${displayViber.replace('+', '')}`}>
              <MessageCircle className="size-5" />
              Viber
            </a>
          </Button>
        ) : null}
        {displayEmail ? (
          <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
            <a href={`mailto:${displayEmail}`}>
              <Mail className="size-5" />
              {displayEmail}
            </a>
          </Button>
        ) : null}
        {displayWebsiteUrl ? (
          <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
            <a href={displayWebsiteUrl} target="_blank" rel="noopener noreferrer">
              <Globe className="size-5" />
              Открыть сайт
            </a>
          </Button>
        ) : null}
        {!hasContactChannels ? (
          <p className="text-sm text-muted-foreground">
            {shelter ? (
              <>
                У организации нет прямых контактов — напишите через{' '}
                <Link to={`/shelters/${shelter.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
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
