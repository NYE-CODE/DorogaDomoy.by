import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../context/I18nContext";
import { profilePetsApi, type ProfilePetResponse } from "../api/client";
import { resolveProfilePetSpecies } from "../utils/profile-pet-display";

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
  medicalInfo: "",
  temperament: "friendly",
  respondsToName: "yes",
  favoriteTreats: "",
  favoriteWalks: "",
  photos: [],
});

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
    medicalInfo: p.medical_info ?? "",
    temperament: p.temperament ?? "friendly",
    respondsToName: p.responds_to_name ? "yes" : "no",
    favoriteTreats: p.favorite_treats ?? "",
    favoriteWalks: p.favorite_walks ?? "",
    photos: p.photos ?? [],
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePickPhotos = () => fileInputRef.current?.click();

  const addPhotoFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const images = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    setFormData((prev) => {
      const room = 5 - prev.photos.length;
      if (room <= 0) return prev;
      const toAdd = images.slice(0, room);
      const urls = toAdd.map((file) => URL.createObjectURL(file));
      if (urls.length) toast.success(f.toastPhotoAdded);
      return { ...prev, photos: [...prev.photos, ...urls] };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addPhotoFiles(e.target.files);
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => {
      const url = prev.photos[index];
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      return { ...prev, photos: prev.photos.filter((_, i) => i !== index) };
    });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.breed.trim() || !formData.age.trim()) {
        toast.error(f.toastFillRequired);
        return;
      }
    }
    if (currentStep === 2) {
      if (formData.photos.length === 0) {
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
    const photoPromises = formData.photos.map(async (url) => {
      if (url.startsWith("blob:")) {
        const resp = await fetch(url);
        const blob = await resp.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      return url;
    });
    const photos = await Promise.all(photoPromises);
    formData.photos.forEach((url) => { if (url.startsWith("blob:")) URL.revokeObjectURL(url); });

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
      medical_info: formData.medicalInfo || undefined,
      temperament: formData.temperament || undefined,
      responds_to_name: formData.respondsToName === "yes",
      favorite_treats: formData.favoriteTreats || undefined,
      favorite_walks: formData.favoriteWalks || undefined,
      photos,
    };

    try {
      if (isEditMode && id) {
        await profilePetsApi.update(id, payload);
      } else {
        await profilePetsApi.create(payload);
      }
      toast.success(isEditMode ? f.toastUpdated : f.toastAdded);
      navigate("/my-pets");
    } catch (e: any) {
      toast.error(e?.message ?? t.common.error);
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
  const progressPercentage = (currentStep / totalSteps) * 100;

  const stepLine = f.stepLine
    .replace("{current}", String(currentStep))
    .replace("{total}", String(totalSteps))
    .replace("{title}", currentMeta.title);

  if (isEditMode && isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#FF9800]/30 border-t-[#FF9800] rounded-full animate-spin" />
      </div>
    );
  }

  if (isEditMode && loadError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border shadow-sm p-6 text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-3">{mp.loadErrorTitle}</h1>
          <p className="text-gray-600 dark:text-muted-foreground mb-3">{mp.loadErrorDesc}</p>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mb-6">{loadError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => void loadProfilePet()}
              className="inline-flex items-center justify-center bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg px-6 h-12 transition-colors"
            >
              {mp.retryLoad}
            </button>
            <button
              type="button"
              onClick={() => navigate("/my-pets")}
              className="inline-flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80 rounded-lg px-6 h-12 transition-colors"
            >
              {mp.stubBack}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-600 dark:text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-black dark:text-white">
                {isEditMode ? f.editTitle : f.addTitle}
              </h1>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">{stepLine}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/my-pets")}
              className="text-gray-600 dark:text-muted-foreground hover:text-black dark:hover:text-white shrink-0"
            >
              {f.close}
            </button>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#FDB913] to-[#FF9800] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border p-8">
          <p className="text-gray-600 dark:text-muted-foreground mb-6">{currentMeta.subtitle}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent"
                  placeholder={f.placeholderName}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelSpecies} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSpeciesChange("cat")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.species === "cat"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.speciesCat}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeciesChange("dog")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.species === "dog"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.speciesDog}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeciesChange("other")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.species === "other"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.speciesOther}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="breed" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelBreed} <span className="text-red-500">*</span>
                </label>
                {formData.species === "other" ? (
                  <input
                    type="text"
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent"
                    placeholder={f.breedOtherPlaceholder}
                  />
                ) : (
                  <select
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent"
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
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelGender} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, gender: "male" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.gender === "male"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.genderMale}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, gender: "female" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.gender === "female"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.genderFemale}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelAge} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent"
                  placeholder={f.placeholderAge}
                  min={0}
                  max={30}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
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
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
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
            <div>
              <div className="text-right text-sm text-gray-500 dark:text-muted-foreground mb-4">
                {f.photosCount.replace("{n}", String(formData.photos.length))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.photos.map((photo, index) => (
                  <div key={`${photo}-${index}`} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={f.photoAlt.replace("{n}", String(index + 1))}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {formData.photos.length < 5 && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handlePickPhotos}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePickPhotos();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addPhotoFiles(e.dataTransfer.files);
                  }}
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#FF9800] hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FF9800]"
                >
                  <Upload size={48} className="text-gray-400 dark:text-muted-foreground mb-4" />
                  <span className="text-gray-600 dark:text-foreground font-medium">{f.uploadTitle}</span>
                  <span className="text-sm text-gray-500 dark:text-muted-foreground mt-2">{f.uploadHint}</span>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="specialMarks" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelSpecialMarks}
                </label>
                <textarea
                  id="specialMarks"
                  name="specialMarks"
                  value={formData.specialMarks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent resize-none"
                  rows={3}
                  placeholder={f.placeholderSpecialMarks}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelChipped}
                </label>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isChipped: "yes" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.isChipped === "yes"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
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
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.no}
                  </button>
                </div>

                {formData.isChipped === "yes" && (
                  <div>
                    <label htmlFor="chipNumber" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                      {f.labelChipNumber}
                    </label>
                    <input
                      type="text"
                      id="chipNumber"
                      name="chipNumber"
                      value={formData.chipNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent"
                      placeholder={f.placeholderChip}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="medicalInfo" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelMedical}
                </label>
                <textarea
                  id="medicalInfo"
                  name="medicalInfo"
                  value={formData.medicalInfo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent resize-none"
                  rows={3}
                  placeholder={f.placeholderMedical}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
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
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelRespondsToName}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, respondsToName: "yes" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.respondsToName === "yes"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, respondsToName: "no" }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      formData.respondsToName === "no"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                    }`}
                  >
                    {f.no}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="favoriteTreats" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelTreats}
                </label>
                <input
                  type="text"
                  id="favoriteTreats"
                  name="favoriteTreats"
                  value={formData.favoriteTreats}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent"
                  placeholder={f.placeholderTreats}
                />
              </div>

              <div>
                <label htmlFor="favoriteWalks" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {f.labelWalks}
                </label>
                <input
                  type="text"
                  id="favoriteWalks"
                  name="favoriteWalks"
                  value={formData.favoriteWalks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-[#FF9800] focus:border-transparent"
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
                className="w-full h-12 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg"
              >
                {f.nextStep}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full h-12 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
              >
                {isEditMode ? f.submitSave : f.submitAdd}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
