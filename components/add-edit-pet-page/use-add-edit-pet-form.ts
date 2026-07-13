import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  countFilledProfilePetPhotoSlots,
  emptyStoredProfilePetPhotos,
  slotsFromStoredPhotos,
  storedPhotosFromSlots,
} from '@/shared/lib/profile-pet-photo-slots';
import { toast } from 'sonner';
import { useI18n } from '../../context/I18nContext';
import { profilePetsApi } from '../../api/client';
import { petsApi } from '@/shared/api/client';
import {
  mapAiAgeYearsEstimate,
  mapAiApproximateAge,
  mapAiColorsToOptionLabels,
  pickPhotosForAi,
} from '@/shared/lib/ai-photo-analyze';
import {
  ADD_EDIT_PET_TOTAL_STEPS,
  emptyProfilePetForm,
  type ProfilePetFormData,
} from './add-edit-pet-form-types';
import { PhotoPrepareError, prepareProfilePhotoForUpload, profilePetToForm } from './add-edit-pet-form-helpers';

export function useAddEditPetForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const mp = t.myPets;
  const f = t.myPets.form;
  const isEditMode = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfilePetFormData>(emptyProfilePetForm);
  const [isLoadingProfile, setIsLoadingProfile] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef(0);
  const loadRequestRef = useRef(0);
  const profileAiRequestRef = useRef(0);
  const formPhotosRef = useRef(formData.photos);
  formPhotosRef.current = formData.photos;

  const loadProfilePet = useCallback(async () => {
    if (!isEditMode || !id) {
      setIsLoadingProfile(false);
      setLoadError(null);
      return;
    }
    const reqId = ++loadRequestRef.current;
    setIsLoadingProfile(true);
    setLoadError(null);
    setCurrentStep(1);
    try {
      const pet = await profilePetsApi.get(id);
      if (reqId !== loadRequestRef.current) return;
      setFormData(profilePetToForm(pet));
      setLoadError(null);
    } catch (error) {
      if (reqId !== loadRequestRef.current) return;
      setLoadError(error instanceof Error ? error.message : mp.loadErrorDesc);
    } finally {
      if (reqId === loadRequestRef.current) setIsLoadingProfile(false);
    }
  }, [id, isEditMode, mp.loadErrorDesc]);

  useEffect(() => {
    if (!isEditMode) {
      loadRequestRef.current += 1;
      setIsLoadingProfile(false);
      setLoadError(null);
      setFormData(emptyProfilePetForm());
      return;
    }
    void loadProfilePet();
  }, [isEditMode, id, loadProfilePet]);

  useEffect(() => {
    return () => {
      profileAiRequestRef.current += 1;
      loadRequestRef.current += 1;
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpeciesChange = (species: 'dog' | 'cat' | 'other') => {
    setFormData((prev) => ({
      ...prev,
      species,
      breed: '',
    }));
  };

  const toggleColor = (color: string) => {
    setFormData((prev) => {
      if (prev.colors.includes(color)) {
        return { ...prev, colors: prev.colors.filter((c) => c !== color) };
      }
      return { ...prev, colors: [...prev.colors, color] };
    });
  };

  const handlePickSlot = (slotIndex: number) => {
    if (isUploadingPhotos) return;
    pendingSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  const runProfileAiAnalyze = async (opts?: { advanceStep?: boolean }) => {
    const images = pickPhotosForAi(formPhotosRef.current);
    if (!images.length || aiAnalyzing || isUploadingPhotos) return;
    const reqId = ++profileAiRequestRef.current;
    setAiAnalyzing(true);
    try {
      const result = await petsApi.analyzePhotos(images);
      if (reqId !== profileAiRequestRef.current) return;
      if (!result.ai_available) {
        if (result.error === 'invalid_image') toast.message(t.petForm.aiInvalidImage);
        else if (result.error === 'not_animal') toast.error(t.petForm.aiNotAnimal);
        else if (result.error === 'photo_unclear') toast.message(t.petForm.aiPhotoUnclear);
        else if (result.error === 'analyze_failed') toast.error(t.petForm.aiFailed);
        else if (!result.error) toast.message(t.petForm.aiUnavailable);
        else toast.message(t.petForm.aiFailed);
        return;
      }
      setFormData((prev) => {
        const next = { ...prev };
        if (result.animal_type === 'cat' || result.animal_type === 'dog' || result.animal_type === 'other') {
          if (next.species !== result.animal_type) {
            next.species = result.animal_type;
            next.breed = '';
          }
        }
        if (result.breed?.trim()) next.breed = result.breed.trim();
        if (result.gender === 'male' || result.gender === 'female') next.gender = result.gender;
        if (result.colors?.length) {
          const mapped = mapAiColorsToOptionLabels(result.colors, f.colorOptions);
          if (mapped.length) next.colors = mapped;
        }
        if (!next.age.trim()) {
          const years = mapAiAgeYearsEstimate(result.age_years_estimate ?? undefined);
          if (years) next.age = years;
          else {
            const preset = mapAiApproximateAge(result.approximate_age ?? undefined);
            if (preset.includes('менее')) next.age = '1';
            else if (preset.includes('более')) next.age = '3';
          }
        }
        const aiDesc = result.description?.trim() || result.notes?.trim();
        if (aiDesc && !next.specialMarks.trim()) {
          next.specialMarks = aiDesc.slice(0, 500);
        }
        return next;
      });
      toast.success(t.petForm.aiApplied);
      if (opts?.advanceStep && currentStep === 1) setCurrentStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('429') || /rate limit/i.test(msg)) toast.error(t.petForm.aiRateLimited);
      else toast.error(t.petForm.aiFailed);
    } finally {
      if (reqId === profileAiRequestRef.current) setAiAnalyzing(false);
    }
  };

  const uploadPhotoToSlot = async (slotIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploadingPhotos(true);
    setUploadingSlotIndex(slotIndex);
    try {
      const preparedFile = await prepareProfilePhotoForUpload(file);
      const url = await profilePetsApi.uploadPhoto(preparedFile);
      setFormData((prev) => {
        const next = [...prev.photos];
        while (next.length < emptyStoredProfilePetPhotos().length) {
          next.push('');
        }
        next[slotIndex] = url;
        return { ...prev, photos: storedPhotosFromSlots(slotsFromStoredPhotos(next)) };
      });
      toast.success(f.toastPhotoAdded);
    } catch (error) {
      if (error instanceof PhotoPrepareError) {
        toast.error(
          error.kind === 'tooLarge'
            ? t.common.toasts.photoTooLargeAfterCompress
            : t.common.toasts.imageProcessError,
        );
      } else {
        toast.error(error instanceof Error ? error.message : t.common.error);
      }
    } finally {
      setIsUploadingPhotos(false);
      setUploadingSlotIndex(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void uploadPhotoToSlot(pendingSlotRef.current, file);
  };

  const handleRemovePhoto = (slotIndex: number) => {
    setFormData((prev) => {
      const slots = slotsFromStoredPhotos(prev.photos);
      slots[slotIndex] = null;
      return { ...prev, photos: storedPhotosFromSlots(slots) };
    });
  };

  const handleSlotFileDrop = (slotIndex: number, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    void uploadPhotoToSlot(slotIndex, file);
  };

  const handleProfileAiAnalyze = () => {
    void runProfileAiAnalyze();
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (isUploadingPhotos) {
        toast.error(t.common.toasts.photoUploadWait);
        return;
      }
      if (!countFilledProfilePetPhotoSlots(formData.photos)) {
        toast.error(f.toastAddPhoto);
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.name.trim() || !formData.breed.trim() || !formData.age.trim()) {
        toast.error(f.toastFillRequired);
        return;
      }
    }
    if (currentStep < ADD_EDIT_PET_TOTAL_STEPS) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    else navigate('/my-pets');
  };

  const handleSubmit = async () => {
    if (isEditMode && (isLoadingProfile || loadError)) {
      toast.error(loadError || mp.loadErrorDesc);
      return;
    }
    if (isUploadingPhotos) {
      toast.error(t.common.toasts.photoUploadWait);
      return;
    }
    if (isSubmitting) return;

    const payload = {
      name: formData.name,
      species: formData.species,
      breed: formData.breed || undefined,
      gender: formData.gender,
      age: formData.age || undefined,
      colors: formData.colors,
      special_marks: formData.specialMarks || undefined,
      is_chipped: formData.isChipped === 'yes',
      chip_number: formData.isChipped === 'yes' ? formData.chipNumber || undefined : undefined,
      registration_authority: formData.registrationAuthority?.trim() || undefined,
      registration_token_number: formData.registrationTokenNumber?.trim() || undefined,
      medical_info: formData.medicalInfo || undefined,
      temperament: formData.temperament || undefined,
      responds_to_name: formData.respondsToName === 'yes',
      favorite_treats: formData.favoriteTreats || undefined,
      favorite_walks: formData.favoriteWalks || undefined,
      photos: storedPhotosFromSlots(slotsFromStoredPhotos(formData.photos)),
    };

    try {
      setIsSubmitting(true);
      if (isEditMode && id) {
        await profilePetsApi.update(id, payload);
      } else {
        await profilePetsApi.create(payload);
      }
      toast.success(isEditMode ? f.toastUpdated : f.toastAdded);
      navigate('/my-pets');
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: string }).message) : undefined;
      toast.error(message ?? t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepMeta = [
    { title: f.step1Title, subtitle: f.step1Subtitle },
    { title: f.step2Title, subtitle: f.step2Subtitle },
    { title: f.step3Title, subtitle: f.step3Subtitle },
    { title: f.step4Title, subtitle: f.step4Subtitle },
  ] as const;

  const currentMeta = stepMeta[currentStep - 1];
  const stepLine = f.stepLine
    .replace('{current}', String(currentStep))
    .replace('{total}', String(ADD_EDIT_PET_TOTAL_STEPS))
    .replace('{title}', currentMeta.title);

  return {
    id,
    navigate,
    t,
    mp,
    f,
    isEditMode,
    totalSteps: ADD_EDIT_PET_TOTAL_STEPS,
    currentStep,
    formData,
    setFormData,
    isLoadingProfile,
    loadError,
    isUploadingPhotos,
    uploadingSlotIndex,
    isSubmitting,
    aiAnalyzing,
    fileInputRef,
    stepMeta,
    currentMeta,
    stepLine,
    loadProfilePet,
    handleInputChange,
    handleSpeciesChange,
    toggleColor,
    handlePickSlot,
    handleFileChange,
    handleRemovePhoto,
    handleSlotFileDrop,
    handleProfileAiAnalyze,
    handleNext,
    handleBack,
    handleSubmit,
  };
}
