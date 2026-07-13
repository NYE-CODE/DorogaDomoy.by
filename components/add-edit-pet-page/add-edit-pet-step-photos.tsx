import { Sparkles } from 'lucide-react';
import {
  countFilledProfilePetPhotoSlots,
  slotsFromStoredPhotos,
  storedPhotosFromSlots,
} from '@/shared/lib/profile-pet-photo-slots';
import { formatI18nTemplate } from '@/shared/lib/i18n-template';
import { ProfilePetPhotoSlotPicker, type ProfilePetPhotoSlotLabels } from '../profile-pet-photo-slot-picker';
import { PROFILE_PET_PHOTO_GUIDE_INSTAGRAM_URL } from './add-edit-pet-form-helpers';
import type { ProfilePetFormData } from './add-edit-pet-form-types';

export interface AddEditPetStepPhotosProps {
  formData: ProfilePetFormData;
  f: Record<string, unknown>;
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
  const photoAltTemplate = String(f.photoAlt ?? 'Photo {n}');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{String(f.step1PhotoHint)}</p>
      <div className="text-right text-sm text-muted-foreground">
        {formatI18nTemplate(String(f.photosCount), {
          n: countFilledProfilePetPhotoSlots(formData.photos),
        })}
      </div>

      <ProfilePetPhotoSlotPicker
        photos={storedPhotosFromSlots(slotsFromStoredPhotos(formData.photos))}
        labels={f.photoSlots as ProfilePetPhotoSlotLabels}
        addLabel={String(f.photoSlotAdd)}
        replaceLabel={String(f.photoSlotReplace)}
        optionalLabel={String(f.photoSlotOptional)}
        recommendedLabel={String(f.photoSlotRecommended)}
        photoAlt={(n) => formatI18nTemplate(photoAltTemplate, { n })}
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
