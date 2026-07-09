import { Link } from 'react-router';
import { AlertCircle, Calendar, MapPin, MessageCircle, Send } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { formatCalendarDate, formatRelativeTime, petStatusSoftPillClass } from '@/shared/lib/pet-helpers';
import { cn } from '@/shared/ui/utils';
import { appMessengerCtaSizingClass, appOutlineCtaClass } from '@/shared/styles/cta-classes';
import { Button } from '@/shared/ui/button';
import { RewardBadge } from '../../../components/reward-badge';
import { RevealPhoneButton } from '../../../components/reveal-phone-button';
import { type ArchiveBadgeStyle } from './pet-detail-archive-badge';
import type { PetDetailT } from './pet-detail-archive-badge';

export interface PetDetailSidebarProps {
  pet: Pet;
  t: PetDetailT;
  archiveBadge: ArchiveBadgeStyle | null;
  onReport: () => void;
}

export function PetDetailSidebar({ pet, t, archiveBadge, onReport }: PetDetailSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="typo-h2 mb-6">{t.pet.information}</h2>
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm text-muted-foreground">{t.filters.status}</div>
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
                petStatusSoftPillClass[pet.status],
              )}
            >
              {pet.status === 'searching' ? t.pet.status.searching : t.pet.status.found}
            </div>
          </div>
          {pet.status === 'searching' && (
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Вознаграждение</div>
              <RewardBadge pet={pet} />
            </div>
          )}
          <div>
            <div className="mb-1 text-sm text-muted-foreground">{t.pet.animalTypeLabel}</div>
            <div className="font-medium text-foreground">{t.pet.animalType[pet.animalType]}</div>
          </div>
          {pet.breed && (
            <div>
              <div className="mb-1 text-sm text-muted-foreground">{t.pet.breedLabel}</div>
              <div className="font-medium text-foreground">{pet.breed}</div>
            </div>
          )}
          <div>
            <div className="mb-1 text-sm text-muted-foreground">{t.pet.colorLabel}</div>
            <div className="flex flex-wrap gap-2">
              {pet.colors.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {t.pet.color[c]}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm text-muted-foreground">{t.pet.genderLabel}</div>
            <div className="font-medium text-foreground">{t.pet.gender[pet.gender]}</div>
          </div>
          {pet.approximateAge && (
            <div>
              <div className="mb-1 text-sm text-muted-foreground">{t.pet.ageLabel}</div>
              <div className="font-medium text-foreground">{pet.approximateAge}</div>
            </div>
          )}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-[18px] shrink-0" aria-hidden />
              <span>{pet.city}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-[18px] shrink-0" aria-hidden />
              <span>
                {formatCalendarDate(pet.publishedAt)}
                <span className="mx-1.5 text-border">?</span>
                {formatRelativeTime(pet.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!pet.isArchived && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="typo-h2 mb-4">{t.pet.contacts}</h2>
          <div className="mb-6 flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pet.authorName)}&size=48`}
              alt=""
              className="size-12 rounded-full object-cover"
            />
            <div>
              <Link
                to={`/user/${pet.authorId}`}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                {pet.authorName}
              </Link>
              <div className="text-sm text-muted-foreground">{t.petDetail.authorSubtitle}</div>
            </div>
          </div>
          <div className="space-y-3">
            {pet.contacts.phone && <RevealPhoneButton phone={pet.contacts.phone} />}
            {pet.contacts.telegram && (
              <Button
                className={cn(
                  appMessengerCtaSizingClass,
                  'w-full border-0 bg-telegram text-white hover:bg-telegram-hover',
                )}
                asChild
              >
                <a
                  href={`https://t.me/${pet.contacts.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="size-5" aria-hidden />
                  {t.petDetail.writeTelegram}
                </a>
              </Button>
            )}
            {pet.contacts.viber && (
              <Button
                className={cn(
                  appMessengerCtaSizingClass,
                  'w-full border-0 bg-viber text-white hover:bg-viber-hover',
                )}
                asChild
              >
                <a href={`viber://chat?number=${pet.contacts.viber.replace('+', '')}`}>
                  <MessageCircle className="size-5" aria-hidden />
                  {t.profile.viber}
                </a>
              </Button>
            )}
          </div>
          <div className="mt-6 border-t border-border pt-6">
            <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
              <Link to={`/user/${pet.authorId}`}>{t.petDetail.viewAuthorAds}</Link>
            </Button>
          </div>
        </div>
      )}

      {pet.isArchived && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="mb-3 text-sm text-muted-foreground">{t.petDetail.contactsHiddenArchived}</p>
            {archiveBadge && (
              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${archiveBadge.bgColor} ${archiveBadge.borderColor} ${archiveBadge.textColor}`}>
                  {archiveBadge.icon}
                  <span className="text-sm">{pet.archiveReason}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-auto w-full gap-2 py-3 text-muted-foreground hover:text-destructive"
          onClick={onReport}
        >
          <AlertCircle className="size-5" aria-hidden />
          {t.petDetail.report}
        </Button>
      </div>
    </div>
  );
}
