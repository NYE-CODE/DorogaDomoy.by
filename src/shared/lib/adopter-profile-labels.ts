import type { AdopterProfile } from '@/entities/adopter-profile/model/types';

export interface AdopterProfileLabelCopy {
  ageAny: string;
  ageYoung: string;
  ageAdult: string;
  ageSenior: string;
  genderAny: string;
  genderMale: string;
  genderFemale: string;
  healthAny: string;
  healthTreatment: string;
  healthDisability: string;
  healthBoth: string;
}

export function agePrefLabel(pref: AdopterProfile['agePref'], copy: AdopterProfileLabelCopy): string {
  switch (pref) {
    case 'young':
      return copy.ageYoung;
    case 'adult':
      return copy.ageAdult;
    case 'senior':
      return copy.ageSenior;
    default:
      return copy.ageAny;
  }
}

export function genderPrefLabel(
  pref: AdopterProfile['genderPref'],
  copy: AdopterProfileLabelCopy,
): string {
  switch (pref) {
    case 'male':
      return copy.genderMale;
    case 'female':
      return copy.genderFemale;
    default:
      return copy.genderAny;
  }
}

export function adopterHealthSummary(profile: AdopterProfile, copy: AdopterProfileLabelCopy): string {
  if (profile.acceptsTreatment && profile.acceptsDisability) {
    return copy.healthBoth;
  }
  if (profile.acceptsTreatment) return copy.healthTreatment;
  if (profile.acceptsDisability) return copy.healthDisability;
  return copy.healthAny;
}
