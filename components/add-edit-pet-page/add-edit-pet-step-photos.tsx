import { Sparkles } from 'lucide-react';
import {
  countFilledProfilePetPhotoSlots,
  slotsFromStoredPhotos,
  storedPhotosFromSlots,
} from '@/shared/lib/profile-pet-photo-slots';
import { ProfilePetPhotoSlotPicker } from '../profile-pet-photo-slot-picker';
import { PROFILE_PET_PHOTO_GUIDE_INSTAGRAM_URL } from './add-edit-pet-form-helpers';
import type { ProfilePetFormData } from './add-edit-pet-form-types';

export interface AddEditPetStepPhotosProps {
  formData: ProfilePetFormData;
  f: Record<string, string | readonly string[] | ((n: number) => string)>;
  t: { petForm: Record<string, string>; common: { toasts: Record<string, string> } };
  isUploadingPhotos: boolean;
  uploadingSlotIndex: number | null;
  aiAnalyzing: boolean;
  onPickSlot: (slotIndex: number) => void;
  onRemoveSlot: (slotIndex: number) => void;
  onFileDrop: (slotIndex: number, fileList: FileList | null) => void;
  onAiAnalyze: () => void;
}

export function AddEditPetStepPhotos({
  formData,
  f,
  t,
  isUploadingPhotos,
  uploadingSlotIndex,
  aiAnalyzing,
  onPickSlot,
  onRemoveSlot,
  onFileDrop,
  onAiAnalyze,
}: AddEditPetStepPhotosProps) {
  const photoAlt = f.photoAlt as (n: number) => string;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{f.step1PhotoHint as string}</p>
      <div className="text-right text-sm text-muted-foreground">
        {(f.photosCount as string).replace(
          '{n}',
          String(countFilledProfilePetPhotoSlots(formData.photos)),
        )}
      </div>

      <ProfilePetPhotoSlotPicker
        photos={storedPhotosFromSlots(slotsFromStoredPhotos(formData.photos))}
        labels={f.photoSlots as readonly string[]}
        addLabel={f.photoSlotAdd as string}
        replaceLabel={f.photoSlotReplace as string}
        optionalLabel={f.photoSlotOptional as string}
        recommendedLabel={f.photoSlotRecommended as string}
        photoAlt={(n) => photoAlt(n)}
        disabled={isUploadingPhotos}
        uploadingSlotIndex={uploadingSlotIndex}
        onPickSlot={onPickSlot}
        onRemoveSlot={onRemoveSlot}
        onFileDrop={onFileDrop}
      />

      {isUploadingPhotos ? (
        <p className="text-sm text-muted-foreground">{t.common.toasts.photoUploading}</p>
      ) : null}
      {countFilledProfilePetPhotoSlots(formData.photos) > 0 ? (
        <>
          <p className="text-center text-xs text-muted-foreground">{t.petForm.aiAutoHint}</p>
          <button
            type="button"
            onClick={onAiAnalyze}
            disabled={aiAnalyzing || isUploadingPhotos}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            {aiAnalyzing ? t.petForm.aiAnalyzing : t.petForm.aiSuggestFromPhoto}
          </button>
        </>
      ) : null}
    </div>
  );
}

export function AddEditPetStepPhotosGuide({ f }: { f: Record<string, string> }) {
  return (
    <p className="text-sm text-muted-foreground">
      {f.step1InstagramGuidePrefix}
      <a
        href={PROFILE_PET_PHOTO_GUIDE_INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:text-primary-hover hover:underline dark:text-primary-soft dark:hover:text-primary-soft-hover"
      >
        {f.step1InstagramGuideLink}
      </a>
      {f.step1InstagramGuideSuffix}
    </p>
  );
}
