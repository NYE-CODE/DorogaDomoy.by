import type { AnimalType, Gender, Pet, PetColor, PetStatus } from '../../types/pet';

export interface PetFormStepInfo {
  step: number;
  totalSteps: number;
  stepTitle: string;
  stepDesc: string;
  pageTitle: string;
  onBack: () => void;
}

export interface PetFormProps {
  onClose: () => void;
  onSubmit: (data: PetFormData) => void | Promise<void>;
  initialData?: Pet;
  isEditing?: boolean;
  initialStatus?: PetStatus;
  variant?: 'modal' | 'page';
  renderStepHeaderExternally?: boolean;
  onStepChange?: (info: PetFormStepInfo) => void;
  prefillPartial?: Partial<PetFormData> | null;
  /** После успешного onSubmit вызвать onClose (по умолчанию true). Для /create — false, редирект в onSubmit. */
  closeOnSubmit?: boolean;
}

export interface PetFormData {
  photos: string[];
  animalType: AnimalType;
  breed: string;
  colors: PetColor[];
  gender: Gender;
  approximateAge: string;
  approximateAgeRaw?: string;
  status: PetStatus;
  description: string;
  distinctiveMarks: string[];
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  contacts: {
    telegram?: string;
    phone?: string;
    viber?: string;
  };
  useProfileContacts?: boolean;
  contactName?: string;
  contactPhone?: string;
  agreeToPrivacy?: boolean;
  rewardMode?: 'points' | 'money';
  rewardAmountByn?: number;
  registrationAuthority?: string;
  registrationTokenNumber?: string;
  includeChipInDescription?: boolean;
  pendingChipNumber?: string;
}
