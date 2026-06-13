import type { AdopterProfile } from '@/entities/adopter-profile/model/types';
import type { Pet } from '@/entities/pet/model/types';
import { hasAnyTrait, isValidTraitLevel, traitLevelLabel, TRAIT_SCALES } from './pet-traits';
import { matchesAdopterAgePref, petMatchesAdopterHealth } from './shelter-pet-filters';

export interface MatchReasonCopy {
  energyFit: string;
  goodForBeginner: string;
  friendly: string;
  energeticOwner: string;
  apartmentFit: string;
  yardRunner: string;
  goodWithKids: string;
  goodWithDogs: string;
  goodWithCats: string;
  ageFit: string;
  goodHealth: string;
  treatmentReady: string;
  specialNeedsReady: string;
  sameCity: string;
  askShelterTraits: string;
}

export interface MatchResult {
  score: number;
  reasons: string[];
  hardFail: boolean;
}

function isAvailableForAdoption(pet: Pet): boolean {
  if (pet.isArchived) return false;
  if (pet.isPublished === false) return false;
  const status = pet.adoptionStatus;
  if (status && status !== 'available') return false;
  return true;
}

export function computeMatch(pet: Pet, profile: AdopterProfile, copy: MatchReasonCopy): MatchResult {
  if (!isAvailableForAdoption(pet)) {
    return { score: 0, reasons: [], hardFail: true };
  }

  if (profile.animalType !== 'any' && pet.animalType !== profile.animalType) {
    return { score: 0, reasons: [], hardFail: true };
  }

  if (profile.hasKids && pet.goodWithKids === 'no') {
    return { score: 0, reasons: [], hardFail: true };
  }
  if (profile.hasDogs && pet.goodWithDogs === 'no') {
    return { score: 0, reasons: [], hardFail: true };
  }
  if (profile.hasCats && pet.goodWithCats === 'no') {
    return { score: 0, reasons: [], hardFail: true };
  }

  if (
    profile.genderPref !== 'any' &&
    pet.gender !== 'unknown' &&
    pet.gender !== profile.genderPref
  ) {
    return { score: 0, reasons: [], hardFail: true };
  }

  if (!matchesAdopterAgePref(pet, profile.agePref)) {
    return { score: 0, reasons: [], hardFail: true };
  }

  if (
    !petMatchesAdopterHealth(pet, {
      acceptsTreatment: profile.acceptsTreatment,
      acceptsDisability: profile.acceptsDisability,
    })
  ) {
    return { score: 0, reasons: [], hardFail: true };
  }

  let score = 55;
  const reasons: string[] = [];

  const petEnergy = isValidTraitLevel(pet.energyLevel) ? pet.energyLevel : null;
  if (petEnergy != null) {
    const diff = Math.abs(petEnergy - profile.energyLevel);
    score += Math.max(0, 22 - diff * 5);
    if (diff <= 1) reasons.push(copy.energyFit);
  }

  if (profile.experience === 'beginner') {
    if (isValidTraitLevel(pet.trainingLevel) && pet.trainingLevel >= 3) {
      score += 12;
      reasons.push(copy.goodForBeginner);
    } else if (isValidTraitLevel(pet.friendlinessLevel) && pet.friendlinessLevel >= 4) {
      score += 8;
      reasons.push(copy.friendly);
    }
  } else if (petEnergy != null && petEnergy >= 4) {
    score += 6;
    reasons.push(copy.energeticOwner);
  }

  if (profile.housing === 'apartment') {
    if (petEnergy != null && petEnergy <= 3) {
      score += 8;
      reasons.push(copy.apartmentFit);
    }
    if (isValidTraitLevel(pet.independenceLevel) && pet.independenceLevel >= 3) {
      score += 4;
    }
  }

  if (profile.housing === 'house' && petEnergy != null && petEnergy >= 4) {
    score += 6;
    reasons.push(copy.yardRunner);
  }

  if (profile.hasKids && pet.goodWithKids === 'yes') {
    score += 14;
    reasons.push(copy.goodWithKids);
  }
  if (profile.hasDogs && pet.goodWithDogs === 'yes') {
    score += 10;
    reasons.push(copy.goodWithDogs);
  }
  if (profile.hasCats && pet.goodWithCats === 'yes') {
    score += 10;
    reasons.push(copy.goodWithCats);
  }

  if (profile.agePref !== 'any' && matchesAdopterAgePref(pet, profile.agePref)) {
    score += 8;
    reasons.push(copy.ageFit);
  }

  if (profile.genderPref !== 'any' && pet.gender === profile.genderPref) {
    score += 5;
  }

  if (pet.healthStatus === 'excellent' || pet.healthStatus === 'good') {
    score += 6;
    if (!reasons.includes(copy.goodHealth)) reasons.push(copy.goodHealth);
  }

  if (pet.healthStatus === 'treatment' && profile.acceptsTreatment) {
    score += 10;
    reasons.push(copy.treatmentReady);
  }

  if (pet.healthStatus === 'disabled' && profile.acceptsDisability) {
    score += 12;
    reasons.push(copy.specialNeedsReady);
  }

  const city = typeof profile.city === 'string' ? profile.city.trim() : '';
  if (city && pet.city?.trim() === city) {
    score += 12;
    reasons.push(copy.sameCity);
  }

  if (!hasAnyTrait(pet)) {
    score = Math.min(score, 68);
    if (reasons.length === 0) reasons.push(copy.askShelterTraits);
  }

  const uniqueReasons = [...new Set(reasons)].slice(0, 3);

  return {
    score: Number.isFinite(score)
      ? Math.min(99, Math.max(40, Math.round(score)))
      : 55,
    reasons: uniqueReasons,
    hardFail: false,
  };
}

export interface RankedPet {
  pet: Pet;
  match: MatchResult;
}

export function rankPetsForProfile(
  pets: Pet[],
  profile: AdopterProfile,
  excludeIds: ReadonlySet<string>,
  copy: MatchReasonCopy,
): RankedPet[] {
  return pets
    .filter((p) => !excludeIds.has(p.id))
    .map((pet) => ({ pet, match: computeMatch(pet, profile, copy) }))
    .filter((x) => !x.match.hardFail)
    .sort((a, b) => b.match.score - a.match.score);
}

/** Короткая подпись активности питомца для карточки match. */
export function petEnergyHint(pet: Pet, scales = TRAIT_SCALES): string | null {
  const def = scales.find((s) => s.key === 'energyLevel');
  if (!def) return null;
  return traitLevelLabel(def, pet.energyLevel);
}
