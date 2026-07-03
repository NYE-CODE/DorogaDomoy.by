import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  Maximize2,
  ScanFace,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';
import { useRef } from 'react';
import { cn } from './ui/utils';
import {
  PROFILE_PET_PHOTO_SLOT_COUNT,
  PROFILE_PET_PHOTO_SLOT_IDS,
  type ProfilePetPhotoSlotId,
} from '@/shared/lib/profile-pet-photo-slots';

export type ProfilePetPhotoSlotLabels = Record<
  ProfilePetPhotoSlotId,
  { title: string; hint: string }
>;

const SLOT_ICONS: Record<ProfilePetPhotoSlotId, LucideIcon> = {
  face_front: ScanFace,
  profile_left: ArrowLeft,
  profile_right: ArrowRight,
  full_body: Maximize2,
  special_mark_1: ZoomIn,
  special_mark_2: ZoomIn,
};

type ProfilePetPhotoSlotPickerProps = {
  photos: string[];
  labels: ProfilePetPhotoSlotLabels;
  addLabel: string;
  replaceLabel: string;
  optionalLabel: string;
  recommendedLabel: string;
  photoAlt: (slotIndex: number) => string;
  disabled?: boolean;
  uploadingSlotIndex: number | null;
  onPickSlot: (slotIndex: number) => void;
  onRemoveSlot: (slotIndex: number) => void;
  onFileDrop: (slotIndex: number, files: FileList | null) => void;
};

export function ProfilePetPhotoSlotPicker({
  photos,
  labels,
  addLabel,
  replaceLabel,
  optionalLabel,
  recommendedLabel,
  photoAlt,
  disabled = false,
  uploadingSlotIndex,
  onPickSlot,
  onRemoveSlot,
  onFileDrop,
}: ProfilePetPhotoSlotPickerProps) {
  const dragSlotRef = useRef<number | null>(null);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      {PROFILE_PET_PHOTO_SLOT_IDS.map((slotId, index) => {
        const url = (photos[index] ?? '').trim();
        const filled = Boolean(url);
        const isUploading = uploadingSlotIndex === index;
        const Icon = SLOT_ICONS[slotId];
        const { title, hint } = labels[slotId];
        const isRecommended = slotId === 'face_front';

        return (
          <div
            key={slotId}
            className={cn(
              'relative flex aspect-[4/5] flex-col overflow-hidden rounded-lg border bg-muted/15',
              filled ? 'border-border' : 'border-dashed border-border/80',
              isRecommended && !filled && 'border-medallion-border/60',
            )}
          >
            {filled ? (
              <>
                <img
                  src={url}
                  alt={photoAlt(index + 1)}
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 to-transparent p-2">
                  <p className="text-xs font-semibold leading-tight text-white">{title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSlot(index)}
                  disabled={disabled || isUploading}
                  className="absolute right-2 top-2 rounded-full bg-black/55 p-1 text-white transition-colors hover:bg-black/75 disabled:opacity-50"
                  aria-label={replaceLabel}
                >
                  <X size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onPickSlot(index)}
                  disabled={disabled || isUploading}
                  className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-2 text-xs font-medium text-white transition-colors hover:bg-black/70 disabled:opacity-50"
                >
                  {isUploading ? '…' : replaceLabel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onPickSlot(index)}
                disabled={disabled || isUploading}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (disabled || isUploading) return;
                  dragSlotRef.current = index;
                  onFileDrop(index, e.dataTransfer.files);
                }}
                className={cn(
                  'flex size-full flex-col items-center justify-center gap-2 px-3 py-4 text-center outline-none transition-colors',
                  'hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  (disabled || isUploading) && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-11 items-center justify-center rounded-lg',
                    isRecommended
                      ? 'bg-medallion-soft text-medallion'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon size={22} aria-hidden />
                </span>
                <span className="text-sm font-semibold leading-snug text-foreground">{title}</span>
                <span className="text-xs leading-snug text-muted-foreground">{hint}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Upload size={12} aria-hidden />
                  {isUploading ? '…' : addLabel}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide',
                    isRecommended
                      ? 'bg-medallion-soft text-medallion-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isRecommended ? recommendedLabel : optionalLabel}
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { PROFILE_PET_PHOTO_SLOT_COUNT };
