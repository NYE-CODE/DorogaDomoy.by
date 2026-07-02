import { FileDown, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useI18n } from '@/app/providers/I18nContext';
import { ActionButton, Icon, Text } from '@/shared/ui/atoms';
import {
  AdCardHeader,
  Card,
  ContactGroup,
  type ContactGroupItem,
} from '@/shared/ui/molecules';
import { cn } from '@/shared/lib/classNames';
import { formatDate, petScenarioFromStatus } from '@/shared/lib/pet-helpers';
import { PLACEHOLDER_PET_MAP } from '@/shared/lib/placeholder-images';
import { getPetContactLinks } from '../../lib/contact-links';
import type { Pet } from '../../model/types';
import type { PetCardProps } from './PetCard.types';

function buildTitle(pet: Pet, animalTypeLabels: Record<Pet['animalType'], string>): string {
  if (pet.name) return pet.name;
  const animal = animalTypeLabels[pet.animalType];
  return pet.breed ? `${animal} — ${pet.breed}` : animal;
}

/**
 * Карточка объявления для списков: фото, статус, суть, контакт в один тап.
 * Вся логика (загрузка, листовка) — снаружи через пропсы.
 */
function PetCard({ pet, onDownloadFlyer, className, style }: PetCardProps) {
  const { t } = useI18n();

  const title = buildTitle(pet, t.pet.animalType);
  const links = getPetContactLinks(pet.contacts);

  const channels: ContactGroupItem[] = [];
  if (links.phone) {
    channels.push({ key: 'phone', label: t.petCard.call, icon: Phone, href: links.phone });
  }
  if (links.telegram) {
    channels.push({
      key: 'telegram',
      label: t.petCard.telegram,
      icon: Send,
      href: links.telegram,
      target: '_blank',
    });
  }
  if (links.viber) {
    channels.push({ key: 'viber', label: t.petCard.viber, icon: MessageCircle, href: links.viber });
  }
  const [primaryChannel, ...secondaryChannels] = channels;

  return (
    <Card
      className={cn('gap-0 overflow-hidden rounded-2xl border shadow-sm', className)}
      style={style}
    >
      <img
        src={pet.photos?.[0] || PLACEHOLDER_PET_MAP}
        alt={`${title}, ${pet.city}`}
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />

      <div className="flex flex-col gap-3 p-4">
        <AdCardHeader
          title={title}
          status={petScenarioFromStatus(pet.status)}
          statusLabel={t.pet.status[pet.status]}
          dateText={formatDate(pet.publishedAt)}
          dateTime={new Date(pet.publishedAt).toISOString()}
        />

        <Text as="p" variant="body" className="line-clamp-2">
          {pet.description}
        </Text>

        <span className="flex items-center gap-1.5">
          <Icon icon={MapPin} size="xs" className="text-muted-foreground" />
          <Text as="span" variant="caption" className="truncate">
            {pet.city}
          </Text>
        </span>

        <div className="flex flex-col gap-2">
          {primaryChannel && (
            <ContactGroup primary={primaryChannel} secondary={secondaryChannels} />
          )}
          {onDownloadFlyer && (
            <ActionButton
              variant="secondary"
              icon={FileDown}
              label={t.petCard.downloadFlyer}
              onClick={() => onDownloadFlyer(pet)}
              className="w-full"
            />
          )}
        </div>
      </div>
    </Card>
  );
}

export { PetCard };
export type { PetCardProps } from './PetCard.types';
