export type AnimalType = 'cat' | 'dog' | 'other';

export type PetStatus = 'searching' | 'found';

export type PetColor = 'black' | 'white' | 'gray' | 'brown' | 'red' | 'mixed' | 'spotted' | 'striped';

export type Gender = 'male' | 'female' | 'unknown';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type PetScope = 'lost_found' | 'shelter_pet';
export type AdoptionStatus = 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';

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
  status: PetStatus;
  description: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  publishedAt: Date;
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
  isPublished?: boolean;
  publishedByUserId?: string;
  updatedByUserId?: string;
}