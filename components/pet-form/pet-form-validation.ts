import type { Dispatch, SetStateAction } from 'react';
import type { User } from '../../context/AuthContext';
import { isValidBelarusMobilePhoneOptional } from '../../utils/belarus-phone';
import type { useI18n } from '../../context/I18nContext';
import { MAX_DESCRIPTION, MIN_DESCRIPTION } from './pet-form-constants';
import type { PetFormData } from './pet-form-types';

export type PetFormT = ReturnType<typeof useI18n>['t'];

export interface PetFormStepBaseProps {
  variant: 'modal' | 'page';
  formData: PetFormData;
  setFormData: Dispatch<SetStateAction<PetFormData>>;
  errors: Record<string, string>;
  t: PetFormT;
}

export function getPetFormStepErrors(
  step: number,
  formData: PetFormData,
  ctx: { t: PetFormT; user: User | null | undefined; isEditing: boolean },
): Record<string, string> {
  const { t, user, isEditing } = ctx;

  if (step === 1) {
    const errs: Record<string, string> = {};
    if (formData.photos.length === 0) errs.photos = t.petForm.uploadPhoto;
    return errs;
  }

  if (step === 2) {
    const errs: Record<string, string> = {};
    if (!formData.animalType) errs.animalType = t.petForm.selectAnimalType;
    if (!formData.breed?.trim()) errs.breed = t.petForm.breedRequired;
    if (formData.colors.length === 0) errs.colors = t.petForm.selectColor;
    return errs;
  }

  if (step === 3) {
    const errs: Record<string, string> = {};
    const desc = formData.description?.trim() ?? '';
    if (!desc) errs.description = t.petForm.enterDescription;
    else if (desc.length < MIN_DESCRIPTION) {
      errs.description = t.petForm.descriptionTooShort.replace('{min}', String(MIN_DESCRIPTION));
    } else if (formData.description.length > MAX_DESCRIPTION) {
      errs.description = t.petForm.descriptionTooLong.replace('{max}', String(MAX_DESCRIPTION));
    }
    if (formData.status === 'searching' && formData.rewardMode === 'money') {
      const amount = Number(formData.rewardAmountByn);
      if (!Number.isFinite(amount) || amount <= 0) {
        errs.rewardAmountByn = t.petForm.rewardAmountRequired;
      }
    }
    const raLen = (formData.registrationAuthority ?? '').trim().length;
    const rtLen = (formData.registrationTokenNumber ?? '').trim().length;
    if (raLen > 300) errs.registrationAuthority = t.petForm.registrationAuthorityTooLong;
    if (rtLen > 80) errs.registrationTokenNumber = t.petForm.registrationTokenTooLong;
    return errs;
  }

  if (step === 4) {
    const errs: Record<string, string> = {};
    if (!formData.city?.trim()) errs.city = t.petForm.specifyAddress;
    return errs;
  }

  if (step === 5) {
    const errs: Record<string, string> = {};
    if (!isEditing && !formData.agreeToPrivacy) errs.agreeToPrivacy = t.petForm.agreePrivacyRequired;
    if (formData.useProfileContacts) {
      if (!user) {
        errs.profileContacts = t.petForm.profileContactsNeedAuth;
      } else {
        const p = user.contacts?.phone?.trim() ?? '';
        const v = user.contacts?.viber?.trim() ?? '';
        const tg = user.contacts?.telegram?.trim() ?? '';
        const linked = !!user.telegramId;
        if (!p && !v && !tg && !linked) {
          errs.profileContacts = t.profile.atLeastOneContact;
        } else if (p && !isValidBelarusMobilePhoneOptional(p)) {
          errs.profileContacts = t.profile.belarusPhoneInvalid;
        } else if (v && !isValidBelarusMobilePhoneOptional(v)) {
          errs.profileContacts = t.profile.belarusPhoneInvalid;
        }
      }
    } else {
      if (!formData.contactName?.trim()) errs.contactName = t.profile.nameLabel;
      if (!formData.contactPhone?.trim()) errs.contactPhone = t.profile.phone;
      else if (!isValidBelarusMobilePhoneOptional(formData.contactPhone)) {
        errs.contactPhone = t.profile.belarusPhoneInvalid;
      }
    }
    return errs;
  }

  return {};
}
