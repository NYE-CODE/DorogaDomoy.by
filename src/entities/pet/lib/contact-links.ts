import type { Pet } from '../model/types';

export interface PetContactLinks {
  phone?: string;
  telegram?: string;
  viber?: string;
}

/**
 * Единая сборка deep-link'ов каналов связи из контактов объявления.
 * Дублирует конвенции, уже используемые на страницах: tel:, t.me без @, viber по цифрам.
 */
export function getPetContactLinks(contacts: Pet['contacts']): PetContactLinks {
  return {
    phone: contacts.phone ? `tel:${contacts.phone.replace(/[^\d+]/g, '')}` : undefined,
    telegram: contacts.telegram
      ? `https://t.me/${contacts.telegram.replace(/^@/, '')}`
      : undefined,
    viber: contacts.viber
      ? `viber://chat?number=${contacts.viber.replace(/\D/g, '')}`
      : undefined,
  };
}
