import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  Building2,
  Calendar,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  PawPrint,
  Send,
  Scissors,
  User,
} from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import type { ShelterResponse } from '@/shared/api/client';
import { formatCalendarDate, formatRelativeTime } from '@/shared/lib/pet-helpers';
import { petScenarioSoftPillClass } from '@/shared/lib/pet-scenario-colors';
import { shelterLogoSrc } from '@/shared/lib/shelter-public';
import { appMessengerCtaSizingClass, appOutlineCtaClass } from '@/shared/styles/cta-classes';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/ui/utils';
import { FavoriteHeartButton } from '../../../components/favorite-heart-button';
import { RevealPhoneButton } from '../../../components/reveal-phone-button';
import { PartnerAdSlot } from '@/features/partner-ads/PartnerAdSlot';
import type { ShelterContactDisplay, ShelterPetDetailT } from './shelter-pet-detail-glyphs';

function AttrRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-landing-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium leading-snug text-foreground">{value}</div>
      </div>
    </div>
  );
}

export interface ShelterPetDetailSidebarProps {
  pet: Pet;
  t: ShelterPetDetailT;
  title: string;
  adoption: string;
  health: string;
  colors: string;
  coat: string;
  shelter: ShelterResponse | null;
  contacts: ShelterContactDisplay;
}

export function ShelterPetDetailSidebar({
  pet,
  t,
  title,
  adoption,
  health,
  colors,
  coat,
  shelter,
  contacts,
}: ShelterPetDetailSidebarProps) {
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
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <FavoriteHeartButton
            petId={pet.id}
            size="md"
            className="border-border bg-landing-muted text-foreground shadow-sm hover:bg-muted"
          />
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
              petScenarioSoftPillClass.shelter,
            )}
          >
            {adoption}
          </span>
          <span className="inline-flex items-center rounded-full bg-landing-muted px-3 py-1 text-sm text-muted-foreground">
            {t.pet.animalType[pet.animalType]}
          </span>
        </div>

        <div className="divide-y divide-border/70">
          <AttrRow
            icon={<PawPrint className="size-4" aria-hidden />}
            label={t.filters.type}
            value={t.pet.animalType[pet.animalType]}
          />
          <AttrRow
            icon={<PawPrint className="size-4" aria-hidden />}
            label={t.pet.breedLabel}
            value={pet.breed?.trim() || t.pet.notSpecified}
          />
          <AttrRow
            icon={<Calendar className="size-4" aria-hidden />}
            label={t.pet.ageLabel}
            value={pet.approximateAge?.trim() || t.pet.notSpecified}
          />
          <AttrRow
            icon={<User className="size-4" aria-hidden />}
            label={t.pet.genderLabel}
            value={t.pet.gender[pet.gender]}
          />
          <AttrRow
            icon={<Palette className="size-4" aria-hidden />}
            label={t.pet.colorLabel}
            value={colors}
          />
          <AttrRow
            icon={<Scissors className="size-4" aria-hidden />}
            label="Шерсть"
            value={coat}
          />
          <AttrRow
            icon={<PawPrint className="size-4" aria-hidden />}
            label={t.shelterPet.healthLabel}
            value={health}
          />
        </div>

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {shelterLocationLine || pet.city ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-shelter" aria-hidden />
              <span className="min-w-0 truncate">{shelterLocationLine || pet.city}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0" aria-hidden />
            <span>
              {formatCalendarDate(pet.publishedAt)}
              <span className="mx-1.5 text-border">·</span>
              {formatRelativeTime(pet.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h2 className="font-display mb-4 text-lg font-semibold text-foreground">
          {t.landing.shelters.detailContacts}
        </h2>

        {shelter ? (
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-landing-muted ring-2 ring-border">
              {shelterLogoUrl ? (
                <img src={shelterLogoUrl} alt="" className="size-full object-cover" />
              ) : (
                <Building2 className="size-6 text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <Link
                to={`/shelters/${shelter.id}`}
                className="block truncate font-medium text-foreground transition-colors hover:text-shelter"
              >
                {shelter.name}
              </Link>
              <div className="text-sm text-muted-foreground">{t.backQuickMenu.shelterPage}</div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {displayPhone ? <RevealPhoneButton phone={displayPhone} /> : null}
          {displayTelegram ? (
            <Button
              className={cn(
                appMessengerCtaSizingClass,
                'w-full border-0 bg-telegram text-white hover:bg-telegram-hover',
              )}
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
              className={cn(
                appMessengerCtaSizingClass,
                'w-full border-0 bg-viber text-white hover:bg-viber-hover',
              )}
              asChild
            >
              <a href={`viber://chat?number=${displayViber.replace('+', '')}`}>
                <MessageCircle className="size-5" aria-hidden />
                Viber
              </a>
            </Button>
          ) : null}
          {displayEmail ? (
            <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
              <a href={`mailto:${displayEmail}`}>
                <Mail className="size-5" aria-hidden />
                {displayEmail}
              </a>
            </Button>
          ) : null}
          {displayWebsiteUrl ? (
            <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
              <a href={displayWebsiteUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="size-5" aria-hidden />
                Открыть сайт
              </a>
            </Button>
          ) : null}
          {shelter ? (
            <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
              <Link to={`/shelters/${shelter.id}`}>{t.backQuickMenu.shelterPage}</Link>
            </Button>
          ) : null}
          {!hasContactChannels && !shelter ? (
            <p className="text-sm text-muted-foreground">{t.landing.shelters.detailNoContacts}</p>
          ) : null}
        </div>
      </div>

      <PartnerAdSlot placement="pet-detail-sidebar" compact />
    </aside>
  );
}
