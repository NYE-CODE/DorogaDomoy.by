import type { Pet } from '../../../types/pet';
import type { MatchResult } from '../../../utils/pet-match';
import { petEnergyHint } from '../../../utils/pet-match';
import { buildTraitScales } from '../../../utils/pet-traits';
import { useI18n } from '../../../context/I18nContext';

export function useMatchPetDisplay(pet: Pet, match: MatchResult) {
  const { t } = useI18n();
  const c = t.match.card;
  const s = t.match.swipe;
  const traitScales = buildTraitScales(t.petTraits);

  const name = pet.name?.trim() || pet.breed || c.defaultName;
  const breed = pet.breed?.trim();
  const age = pet.approximateAge?.trim();
  const meta = [breed, age].filter(Boolean).join(' · ') || '—';
  const energy = petEnergyHint(pet, traitScales);
  const genderLabel: Record<string, string> = {
    male: c.genderMale,
    female: c.genderFemale,
    unknown: c.genderUnknown,
  };
  const healthLabel: Record<string, string> = {
    disabled: c.healthDisabled,
    treatment: c.healthTreatment,
    good: c.healthGood,
    excellent: c.healthExcellent,
  };
  const detailItems: [string, string][] = [
    [c.detailAge, age || c.notSpecified],
    [c.detailGender, genderLabel[pet.gender] ?? c.notSpecified],
    [
      c.detailHealth,
      pet.healthStatus ? healthLabel[pet.healthStatus] ?? pet.healthStatus : c.notSpecifiedNeuter,
    ],
    [c.detailCity, pet.city || c.notSpecified],
  ];

  return { c, s, name, meta, energy, detailItems, match };
}
