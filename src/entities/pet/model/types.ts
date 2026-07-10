export type AnimalType = 'cat' | 'dog' | 'other';

export type PetStatus = 'searching' | 'found';

export type PetColor = 'black' | 'white' | 'gray' | 'brown' | 'red' | 'mixed' | 'spotted' | 'striped';

export type Gender = 'male' | 'female' | 'unknown';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type PetScope = 'lost_found' | 'shelter_pet';
export type AdoptionStatus = 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';

/** Шкала черты характера: 1–5 (или undefined = «не указано») */
export type TraitLevel = 1 | 2 | 3 | 4 | 5;
/** Совместимость с детьми/животными */
export type Compatibility = 'yes' | 'no' | 'unknown';

export interface Statistics {
  searching: number;
  found: number;
  fostering: number;
}

export interface Pet {
  id: string;
  name?: string;
  photos: string[];
  animalType: AnimalType;
  breed?: string;
  colors: PetColor[];
  gender: Gender;
  approximateAge?: string;
  /** Исходная строка возраста (до нормализации в less_2/more_2) */
  approximateAgeRaw?: string | null;
  status: PetStatus;
  description: string;
  distinctiveMarks?: string[];
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  publishedAt: Date;
  expiresAt?: Date;
  updatedAt: Date;
  authorId: string;
  authorName: string;
  contacts: {
    telegram?: string;
    phone?: string;
    viber?: string;
  };
  isArchived: boolean;
  archiveReason?: string;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  moderatedAt?: Date;
  moderatedBy?: string;
  rewardMode?: 'points' | 'money';
  rewardAmountByn?: number;
  rewardPoints?: number;
  rewardRecipientUserId?: string;
  rewardPointsAwardedAt?: Date;
  petScope?: PetScope;
  shelterId?: string;
  adoptionStatus?: AdoptionStatus;
  healthStatus?: 'disabled' | 'treatment' | 'good' | 'excellent';
  coatType?: 'smooth' | 'semi' | 'fluffy';
  /** Черты характера приютского питомца (для подбора) */
  energyLevel?: TraitLevel;
  friendlinessLevel?: TraitLevel;
  trainingLevel?: TraitLevel;
  independenceLevel?: TraitLevel;
  goodWithKids?: Compatibility;
  goodWithDogs?: Compatibility;
  goodWithCats?: Compatibility;
  isPublished?: boolean;
  publishedByUserId?: string;
  updatedByUserId?: string;
  /** Госучёт РБ: орган, ведущий учёт (как на жетоне) */
  registrationAuthority?: string | null;
  /** Номер жетона учёта */
  registrationTokenNumber?: string | null;
  /** Связь с карточкой питомца (адресник), если объявление создано из профиля */
  profilePetId?: string | null;
}