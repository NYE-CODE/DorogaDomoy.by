import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import {
  countFilledProfilePetPhotoSlots,
  emptyStoredProfilePetPhotos,
  slotsFromStoredPhotos,
  storedPhotosFromSlots,
} from '@/shared/lib/profile-pet-photo-slots';
import { toast } from "sonner";
import { useI18n } from "../context/I18nContext";
import { profilePetsApi, type ProfilePetResponse } from "../api/client";
import { resolveProfilePetSpecies } from "../utils/profile-pet-display";
import { compressImageBlobForShare } from "../utils/web-share-image";
import { Button } from "./ui/button";
import { ProfilePetPhotoSlotPicker } from "./profile-pet-photo-slot-picker";
import { RouteProgress } from "@/shared/ui/molecules";
import { appPrimaryCtaClass } from "@/shared/styles/cta-classes";

interface ProfilePetFormData {
  name: string;
  species: "dog" | "cat" | "other";
  breed: string;
  gender: string;
  age: string;
  colors: string[];
  specialMarks: string;
  isChipped: string;
  chipNumber: string;
  registrationAuthority: string;
  registrationTokenNumber: string;
  medicalInfo: string;
  temperament: string;
  respondsToName: string;
  favoriteTreats: string;
  favoriteWalks: string;
  photos: string[];
}

const emptyForm = (): ProfilePetFormData => ({
  name: "",
  species: "dog",
  breed: "",
  gender: "male",
  age: "",
  colors: [],
  specialMarks: "",
  isChipped: "no",
  chipNumber: "",
  registrationAuthority: "",
  registrationTokenNumber: "",
  medicalInfo: "",
  temperament: "friendly",
  respondsToName: "yes",
  favoriteTreats: "",
  favoriteWalks: "",
  photos: emptyStoredProfilePetPhotos(),
});

const MAX_PROFILE_UPLOAD_BYTES = 750 * 1024;

class PhotoPrepareError extends Error {
  constructor(public readonly kind: "process" | "tooLarge") {
    super(kind);
    this.name = "PhotoPrepareError";
  }
}

/** Instagram guide for pet photos (external link). */
const PROFILE_PET_PHOTO_GUIDE_INSTAGRAM_URL =
  "https://www.instagram.com/p/DXpRblXiJwT/?img_index=1";

function buildCompressedPhotoName(file: File): string {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return `${baseName}.jpg`;
}

async function prepareProfilePhotoForUpload(file: File): Promise<File> {
  const compressed = await compressImageBlobForShare(file, {
    maxLongSide: 1200,
    maxSizeBytes: MAX_PROFILE_UPLOAD_BYTES,
  });
  if (!compressed) {
    throw new PhotoPrepareError("process");
  }
  if (compressed.size > MAX_PROFILE_UPLOAD_BYTES) {
    throw new PhotoPrepareError("tooLarge");
  }
  return new File([compressed], buildCompressedPhotoName(file), {
    type: "image/jpeg",
  });
}

function profilePetToForm(p: ProfilePetResponse): ProfilePetFormData {
  return {
    name: p.name,
    species: resolveProfilePetSpecies(p.species, p.breed),
    breed: p.breed ?? "",
    gender: p.gender === "female" ? "female" : "male",
    age: p.age ?? "",
    colors: p.colors ?? [],
    specialMarks: p.special_marks ?? "",
    isChipped: p.is_chipped ? "yes" : "no",
    chipNumber: p.chip_number ?? "",
    registrationAuthority: p.registration_authority ?? "",
    registrationTokenNumber: p.registration_token_number ?? "",
    medicalInfo: p.medical_info ?? "",
    temperament: p.temperament ?? "friendly",
    respondsToName: p.responds_to_name ? "yes" : "no",
    favoriteTreats: p.favorite_treats ?? "",
    favoriteWalks: p.favorite_walks ?? "",
    photos: storedPhotosFromSlots(slotsFromStoredPhotos(p.photos ?? [])),
  };
}

export function AddEditPetContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const mp = t.myPets;
  const f = t.myPets.form;
  const isEditMode = Boolean(id);

  const totalSteps = 4;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfilePetFormData>(emptyForm);
  const [isLoadingProfile, setIsLoadingProfile] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef(0);

  const loadProfilePet = useCallback(async () => {
    if (!isEditMode || !id) {
      setIsLoadingProfile(false);
      setLoadError(null);
      return;
    }
    setIsLoadingProfile(true);
    setLoadError(null);
    setCurrentStep(1);
    try {
      const pet = await profilePetsApi.get(id);
      setFormData(profilePetToForm(pet));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : mp.loadErrorDesc);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [id, isEditMode, mp.loadErrorDesc]);

  useEffect(() => {
    if (!isEditMode) {
      setIsLoadingProfile(false);
      setLoadError(null);
      setFormData(emptyForm());
      return;
    }
    profilePetsApi
      .get(id!)
      .then((p) => {
        setFormData(profilePetToForm(p));
        setLoadError(null);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : mp.loadErrorDesc);
      })
      .finally(() => setIsLoadingProfile(false));
  }, [id, isEditMode, mp.loadErrorDesc]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpeciesChange = (species: "dog" | "cat" | "other") => {
    setFormData((prev) => ({
      ...prev,
      species,
      breed: "",
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

  const uploadPhotoToSlot = async (slotIndex: number, file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsUploadingPhotos(true);
    setUploadingSlotIndex(slotIndex);
    try {
      const preparedFile = await prepareProfilePhotoForUpload(file);
      const url = await profilePetsApi.uploadPhoto(preparedFile);
      setFormData((prev) => {
        const next = [...prev.photos];
        while (next.length < emptyStoredProfilePetPhotos().length) {
          next.push("");
        }
        next[slotIndex] = url;
        return { ...prev, photos: storedPhotosFromSlots(slotsFromStoredPhotos(next)) };
      });
      toast.success(f.toastPhotoAdded);
    } catch (error) {
      if (error instanceof PhotoPrepareError) {
        toast.error(
          error.kind === "tooLarge"
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
    e.target.value = "";
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

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.breed.trim() || !formData.age.trim()) {
        toast.error(f.toastFillRequired);
        return;
      }
    }
    if (currentStep === 2) {
      if (isUploadingPhotos) {
        toast.error(t.common.toasts.photoUploadWait);
        return;
      }
      if (!countFilledProfilePetPhotoSlots(formData.photos)) {
        toast.error(f.toastAddPhoto);
        return;
      }
    }
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    else navigate("/my-pets");
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
      is_chipped: formData.isChipped === "yes",
      chip_number: formData.isChipped === "yes" ? formData.chipNumber || undefined : undefined,
      registration_authority: formData.registrationAuthority?.trim() || undefined,
      registration_token_number: formData.registrationTokenNumber?.trim() || undefined,
      medical_info: formData.medicalInfo || undefined,
      temperament: formData.temperament || undefined,
      responds_to_name: formData.respondsToName === "yes",
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
      navigate("/my-pets");
    } catch (e: any) {
      toast.error(e?.message ?? t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBreedOptions = () => {
    if (formData.species === "dog") return f.dogBreeds;
    if (formData.species === "cat") return f.catBreeds;
    return [];
  };

  const stepMeta = [
    { title: f.step1Title, subtitle: f.step1Subtitle },
    { title: f.step2Title, subtitle: f.step2Subtitle },
    { title: f.step3Title, subtitle: f.step3Subtitle },
    { title: f.step4Title, subtitle: f.step4Subtitle },
  ] as const;

  const currentMeta = stepMeta[currentStep - 1];

  const stepLine = f.stepLine
    .replace("{current}", String(currentStep))
    .replace("{total}", String(totalSteps))
    .replace("{title}", currentMeta.title);

  if (isEditMode && isLoadingProfile) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isEditMode && loadError) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-card rounded-lg border border-border shadow-sm p-6 text-center">
          <h1 className="typo-h2 mb-3">{mp.loadErrorTitle}</h1>
          <p className="text-muted-foreground mb-3">{mp.loadErrorDesc}</p>
          <p className="text-sm text-muted-foreground mb-6">{loadError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button type="button" className={appPrimaryCtaClass} onClick={() => void loadProfilePet()}>
              {mp.retryLoad}
            </Button>
            <Button type="button" variant="secondary" size="cta" onClick={() => navigate("/my-pets")}>
              {mp.stubBack}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="typo-h2">
                {isEditMode ? f.editTitle : f.addTitle}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{stepLine}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/my-pets")}
              className="text-muted-foreground hover:text-black dark:hover:text-white shrink-0"
            >
              {f.close}
            </button>
          </div>

          <RouteProgress
            totalSteps={totalSteps}
            currentStep={currentStep}
            label={stepLine}
            className="max-w-sm"
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border p-8">
          <div className="mb-6 space-y-2">
            <p className="text-muted-foreground">{currentMeta.subtitle}</p>
            {currentStep === 2 ? (
              <p className="text-sm text-muted-foreground">
                {f.step2InstagramGuidePrefix}
                <a
                  href={PROFILE_PET_PHOTO_GUIDE_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-primary-hover hover:underline dark:text-primary-soft dark:hover:text-primary-soft-hover"
                >
                  {f.step2InstagramGuideLink}
                </a>
                {f.step2InstagramGuideSuffix}
              </p>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={f.placeholderName}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelSpecies} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSpeciesChange("cat")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.species === "cat"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.speciesCat}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeciesChange("dog")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.species === "dog"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.speciesDog}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeciesChange("other")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.species === "other"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.speciesOther}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="breed" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelBreed} <span className="text-red-500">*</span>
                </label>
                {formData.species === "other" ? (
                  <input
                    type="text"
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={f.breedOtherPlaceholder}
                  />
                ) : (
                  <select
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">{f.selectBreed}</option>
                    {getBreedOptions().map((breed) => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelGender} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, gender: "male" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.gender === "male"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.genderMale}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, gender: "female" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.gender === "female"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.genderFemale}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelAge} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={f.placeholderAge}
                  min={0}
                  max={30}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelColors}
                </label>
                <div className="flex flex-wrap gap-2">
                  {f.colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.colors.includes(color)
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{f.step2PhotoHint}</p>
              <div className="text-right text-sm text-muted-foreground">
                {f.photosCount.replace(
                  "{n}",
                  String(countFilledProfilePetPhotoSlots(formData.photos)),
                )}
              </div>

              <ProfilePetPhotoSlotPicker
                photos={storedPhotosFromSlots(slotsFromStoredPhotos(formData.photos))}
                labels={f.photoSlots}
                addLabel={f.photoSlotAdd}
                replaceLabel={f.photoSlotReplace}
                optionalLabel={f.photoSlotOptional}
                recommendedLabel={f.photoSlotRecommended}
                photoAlt={(n) => f.photoAlt.replace("{n}", String(n))}
                disabled={isUploadingPhotos}
                uploadingSlotIndex={uploadingSlotIndex}
                onPickSlot={handlePickSlot}
                onRemoveSlot={handleRemovePhoto}
                onFileDrop={handleSlotFileDrop}
              />

              {isUploadingPhotos && (
                <p className="text-sm text-muted-foreground">{t.common.toasts.photoUploading}</p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="specialMarks" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelSpecialMarks}
                </label>
                <textarea
                  id="specialMarks"
                  name="specialMarks"
                  value={formData.specialMarks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  placeholder={f.placeholderSpecialMarks}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelChipped}
                </label>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isChipped: "yes" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.isChipped === "yes"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, isChipped: "no", chipNumber: "" }))
                    }
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.isChipped === "no"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.no}
                  </button>
                </div>

                {formData.isChipped === "yes" && (
                  <div>
                    <label htmlFor="chipNumber" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                      {f.labelChipNumber}
                    </label>
                    <input
                      type="text"
                      id="chipNumber"
                      name="chipNumber"
                      value={formData.chipNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={f.placeholderChip}
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase">
                  {f.registrationSectionTitle}
                </p>
                <p className="text-xs text-muted-foreground">{f.registrationHint}</p>
                <div>
                  <label htmlFor="registrationAuthority" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                    {f.labelRegistrationAuthority}
                  </label>
                  <input
                    type="text"
                    id="registrationAuthority"
                    name="registrationAuthority"
                    value={formData.registrationAuthority}
                    onChange={handleInputChange}
                    maxLength={300}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={f.placeholderRegistrationAuthority}
                  />
                </div>
                <div>
                  <label htmlFor="registrationTokenNumber" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                    {f.labelRegistrationToken}
                  </label>
                  <input
                    type="text"
                    id="registrationTokenNumber"
                    name="registrationTokenNumber"
                    value={formData.registrationTokenNumber}
                    onChange={handleInputChange}
                    maxLength={80}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={f.placeholderRegistrationToken}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="medicalInfo" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelMedical}
                </label>
                <textarea
                  id="medicalInfo"
                  name="medicalInfo"
                  value={formData.medicalInfo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  placeholder={f.placeholderMedical}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelTemperament}
                </label>
                <div className="flex flex-wrap gap-3">
                  {f.temperamentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, temperament: option.value }))
                      }
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        formData.temperament === option.value
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelRespondsToName}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, respondsToName: "yes" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.respondsToName === "yes"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, respondsToName: "no" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.respondsToName === "no"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.no}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="favoriteTreats" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelTreats}
                </label>
                <input
                  type="text"
                  id="favoriteTreats"
                  name="favoriteTreats"
                  value={formData.favoriteTreats}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={f.placeholderTreats}
                />
              </div>

              <div>
                <label htmlFor="favoriteWalks" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {f.labelWalks}
                </label>
                <input
                  type="text"
                  id="favoriteWalks"
                  name="favoriteWalks"
                  value={formData.favoriteWalks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={f.placeholderWalks}
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-12 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-lg"
              >
                {f.nextStep}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUploadingPhotos || isSubmitting}
                className={`w-full h-12 text-white rounded-lg transition-colors font-medium text-lg ${
                  isUploadingPhotos || isSubmitting
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSubmitting ? t.common.submitting : (isEditMode ? f.submitSave : f.submitAdd)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
