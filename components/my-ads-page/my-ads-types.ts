import type { ModerationStatus, Pet } from '@/entities/pet/model/types';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export const MY_ADS_STATUS_TABS: {
  value: ModerationStatus;
  icon: typeof CheckCircle;
  labelKey: keyof { approved: string; onReview: string; rejected: string };
}[] = [
  { value: 'approved', icon: CheckCircle, labelKey: 'approved' },
  { value: 'pending', icon: Clock, labelKey: 'onReview' },
  { value: 'rejected', icon: XCircle, labelKey: 'rejected' },
];

export interface MyAdsPageProps {
  pets: Pet[];
  onBack: () => void;
  onCreateClick: () => void;
  onEditPet: (pet: Pet) => void;
  onDeletePet: (pet: Pet) => void;
  onRenewPet?: (pet: Pet) => void;
  /** Макс. день из listing_reminder_days — когда показывать кнопку «Продлить» */
  renewPromptWithinDays?: number;
}
