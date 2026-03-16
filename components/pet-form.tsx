import { useState, useEffect } from 'react';
import { X, Search, ChevronRight, ChevronLeft, ImagePlus } from 'lucide-react';
import { AnimalType, PetStatus, PetColor, Gender, Pet } from '../types/pet';
import { useScrollLock } from './ui/use-scroll-lock';
import { BreedCombobox } from './breed-combobox';
import { CAT_BREEDS, DOG_BREEDS } from '../utils/breeds';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { LocationPicker } from './location-picker';
import { DEFAULT_CITY } from '../utils/cities';
import { geocode } from '../utils/geocode';
import { toast } from 'sonner';
import { settingsApi } from '../api/client';

const MAX_DESCRIPTION = 500;

interface PetFormProps {
  onClose: () => void;
  onSubmit: (data: PetFormData) => void;
  initialData?: Pet;
  isEditing?: boolean;
  /** При создании: статус выбран в модалке «потерял/нашёл», в форме не показываем выбор */
  initialStatus?: PetStatus;
  /** Режим отображения: modal — поверх страницы, page — контент на странице без оверлея */
  variant?: 'modal' | 'page';
}

export interface PetFormData {
  photos: string[];
  animalType: AnimalType;
  breed: string;
  colors: PetColor[];
  gender: Gender;
  approximateAge: string;
  status: PetStatus;
  description: string;
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
  /** Использовать контакты из профиля (только для создания) */
  useProfileContacts?: boolean;
  /** Имя для отображения в объявлении (если не из профиля) */
  contactName?: string;
  /** Телефон для объявления (если не из профиля) */
  contactPhone?: string;
  /** Согласие с политикой конфиденциальности (только для создания) */
  agreeToPrivacy?: boolean;
}

const defaultFormData: PetFormData = {
  photos: [],
  animalType: 'cat',
  breed: '',
  colors: [],
  gender: 'unknown',
  approximateAge: '',
  status: 'searching',
  description: '',
  city: 'Минск',
  location: { lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] },
  contacts: {},
  useProfileContacts: true,
  contactName: '',
  contactPhone: '',
  agreeToPrivacy: false,
};

function formDataFromPet(pet: Pet): PetFormData {
  return {
    photos: pet.photos ?? [],
    animalType: pet.animalType,
    breed: pet.breed || '',
    colors: pet.colors ?? [],
    gender: pet.gender || 'unknown',
    approximateAge: pet.approximateAge || '',
    status: pet.status,
    description: pet.description,
    city: pet.city ?? 'Минск',
    location: pet.location ?? defaultFormData.location,
    contacts: pet.contacts ?? {},
    useProfileContacts: true,
    contactName: pet.authorName ?? '',
    contactPhone: pet.contacts?.phone ?? '',
    agreeToPrivacy: true,
  };
}

const animalTypeOptions: { value: AnimalType; icon: string }[] = [
  { value: 'cat', icon: '🐱' },
  { value: 'dog', icon: '🐕' },
  { value: 'other', icon: '🦔' },
];

const genderOptions: { value: Gender }[] = [
  { value: 'unknown' },
  { value: 'male' },
  { value: 'female' },
];

const TOTAL_STEPS_CREATE = 5;
const TOTAL_STEPS_EDIT = 4;

export function PetForm({ onClose, onSubmit, initialData, isEditing = false, initialStatus, variant = 'modal' }: PetFormProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  useScrollLock(variant === 'modal');

  const totalSteps = isEditing ? TOTAL_STEPS_EDIT : TOTAL_STEPS_CREATE;

  const [formData, setFormData] = useState<PetFormData>(() => {
    if (initialData) return formDataFromPet(initialData);
    return { ...defaultFormData, status: initialStatus ?? 'searching' };
  });

  const [step, setStep] = useState(1);
  const [tried, setTried] = useState(false);
  const [maxPhotos, setMaxPhotos] = useState(10);

  useEffect(() => {
    setStep(1);
    setTried(false);
  }, [isEditing, initialData?.id]);

  useEffect(() => {
    if (!initialData && initialStatus) {
      setFormData((prev) => ({ ...prev, status: initialStatus }));
    }
  }, [initialStatus, initialData]);

  useEffect(() => {
    settingsApi.get().then((s) => {
      const val = parseInt(s.max_photos, 10);
      if (val > 0) setMaxPhotos(val);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(formDataFromPet(initialData));
    } else {
      const base = { ...defaultFormData };
      if (user?.contacts) base.contacts = user.contacts;
      setFormData(base);
    }
  }, [initialData?.id, user?.id]);

  const compressImage = (file: File, maxDim = 1200, quality = 0.8): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error(t.petForm.uploadFailed)); };
      img.src = URL.createObjectURL(file);
    });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(t.petForm.onlyImages);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(t.petForm.maxSize);
        continue;
      }
      try {
        const compressed = await compressImage(file);
        setFormData(prev => {
          if (prev.photos.length >= maxPhotos) {
            toast.warning(`Максимум ${maxPhotos} фото`);
            return prev;
          }
          return { ...prev, photos: [...prev.photos, compressed] };
        });
      } catch {
        toast.error('Не удалось обработать изображение');
      }
    }
    e.target.value = '';
  };

  const toggleColor = (color: PetColor) => {
    const newColors = formData.colors.includes(color)
      ? formData.colors.filter(c => c !== color)
      : [...formData.colors, color];
    setFormData({ ...formData, colors: newColors });
  };

  const step1Errors = () => {
    const errs: Record<string, string> = {};
    if (!formData.animalType) errs.animalType = t.petForm.selectAnimalType;
    if (formData.colors.length === 0) errs.colors = t.petForm.selectColor;
    return errs;
  };

  const step2Errors = () => {
    const errs: Record<string, string> = {};
    if (formData.photos.length === 0) errs.photos = t.petForm.uploadPhoto;
    return errs;
  };

  const step3Errors = () => {
    const errs: Record<string, string> = {};
    if (!formData.city?.trim()) errs.city = t.petForm.specifyAddress;
    return errs;
  };

  const step4Errors = () => {
    const errs: Record<string, string> = {};
    if (!formData.description?.trim()) errs.description = t.petForm.enterDescription;
    else if (formData.description.length > MAX_DESCRIPTION) errs.description = `Макс. ${MAX_DESCRIPTION} символов`;
    return errs;
  };

  const step5Errors = () => {
    const errs: Record<string, string> = {};
    if (!formData.agreeToPrivacy) errs.agreeToPrivacy = t.petForm.agreePrivacyRequired;
    if (!formData.useProfileContacts) {
      if (!formData.contactName?.trim()) errs.contactName = t.profile.nameLabel;
      if (!formData.contactPhone?.trim()) errs.contactPhone = t.profile.phone;
    }
    return errs;
  };

  const getStepErrors = () => {
    if (step === 1) return step1Errors();
    if (step === 2) return step2Errors();
    if (step === 3) return step3Errors();
    if (step === 4) return step4Errors();
    if (step === 5) return step5Errors();
    return {};
  };

  const canProceed = () => Object.keys(getStepErrors()).length === 0;

  const errors = tried ? getStepErrors() : {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (step < totalSteps) {
      if (canProceed()) { setTried(false); setStep(step + 1); }
      return;
    }
    if (!canProceed()) return;
    const dataToSubmit: PetFormData = { ...formData };
    if (!isEditing && formData.useProfileContacts && user) {
      dataToSubmit.contacts = { ...user.contacts };
    } else if (!isEditing && !formData.useProfileContacts) {
      dataToSubmit.contacts = { phone: formData.contactPhone?.trim() || undefined };
      dataToSubmit.contactName = formData.contactName?.trim();
    }
    onSubmit(dataToSubmit);
    onClose();
  };

  const stepTitles = [t.petForm.step1Title, t.petForm.step2Title, t.petForm.step3Title, t.petForm.step4Title, t.petForm.step5Title];
  const stepDescs = [t.petForm.step1Desc, t.petForm.step2Desc, t.petForm.step3Desc, t.petForm.step4Desc, t.petForm.step5Desc];

  const getPageTitle = () => {
    if (isEditing) return t.petForm.editTitle;
    const st = formData.status;
    const type = formData.animalType;
    if (st === 'searching') {
      if (type === 'dog') return t.petForm.formTitleLostDog;
      if (type === 'cat') return t.petForm.formTitleLostCat;
      return t.petForm.formTitleLostOther;
    }
    if (type === 'dog') return t.petForm.formTitleFoundDog;
    if (type === 'cat') return t.petForm.formTitleFoundCat;
    return t.petForm.formTitleFoundOther;
  };

  const content = (
    <>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${variant === 'page' ? 'pb-6 border-b border-gray-200 dark:border-gray-700' : 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 rounded-t-2xl'}`}>
        {variant === 'page' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                {t.common.back}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {t.petForm.close}
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {getPageTitle()}
            </h1>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.petForm.step} {step} {t.petForm.of} {totalSteps}: {stepTitles[step - 1]}
            </p>
            {stepDescs[step - 1] && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stepDescs[step - 1]}
              </p>
            )}
          </div>
        ) : (
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? t.petForm.editTitle : formData.status === 'searching' ? t.petForm.formTitleLost : t.petForm.formTitleFound}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex gap-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-8 rounded-full transition-colors ${step >= i + 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{t.petForm.step} {step} {t.petForm.of} {totalSteps}</span>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors" aria-label={t.common.back}>
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

        <form onSubmit={handleSubmit} className={variant === 'page' ? 'pt-8' : 'p-6'}>
          {/* Step 1: Тип питомца, пол, цвет, возраст */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Animal type + Breed */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="shrink-0">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{variant === 'page' ? t.petForm.whoIsThis : t.petForm.animalTypeLabel}</span>
                  <div className="flex bg-muted rounded-lg p-0.5 mt-1.5 w-fit">
                    {animalTypeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, animalType: opt.value, breed: '' })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          formData.animalType === opt.value
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <span className="text-base leading-none">{opt.icon}</span>
                        {t.pet.animalType[opt.value]}
                      </button>
                    ))}
                  </div>
                  {errors.animalType && <p className="text-xs text-red-500 mt-1">{errors.animalType}</p>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.petForm.breedLabel}</span>
                  <div className="mt-1.5">
                    {formData.animalType === 'other' ? (
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value.slice(0, 80) })}
                        placeholder="Введите породу (необязательно)"
                        maxLength={80}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    ) : (
                      <BreedCombobox
                        breeds={formData.animalType === 'cat' ? CAT_BREEDS : DOG_BREEDS}
                        value={formData.breed}
                        onChange={(breed) => setFormData({ ...formData, breed })}
                        placeholder="Выберите или введите породу"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.petForm.colorLabel}</span>
                <div className={`flex flex-wrap gap-1.5 mt-1.5 ${errors.colors ? 'ring-2 ring-red-300 bg-red-50/50 dark:bg-red-900/20 p-2 rounded-xl' : ''}`}>
                  {(Object.keys(t.pet.color) as PetColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-2.5 py-1 text-sm rounded-lg border transition-all ${
                        formData.colors.includes(color)
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-card text-foreground border-border hover:bg-muted hover:border-border'
                      }`}
                    >
                      {t.pet.color[color]}
                    </button>
                  ))}
                </div>
                {errors.colors && <p className="text-xs text-red-500 mt-1">{errors.colors}</p>}
              </div>

              {/* Gender + Age */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="shrink-0">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.petForm.genderLabel}</span>
                  <div className="flex bg-muted rounded-lg p-0.5 mt-1.5 w-fit">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: opt.value })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          formData.gender === opt.value
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {t.pet.gender[opt.value]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.petForm.ageLabel}</span>
                  <input
                    type="text"
                    value={formData.approximateAge}
                    onChange={(e) => setFormData({ ...formData, approximateAge: e.target.value })}
                    placeholder="Напр.: 2 года"
                    className="block mt-1.5 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Фото */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.petForm.photosLabel}</span>
                  <span className={`text-xs ${formData.photos.length === 0 && errors.photos ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formData.photos.length} из {maxPhotos}
                  </span>
                </div>
                <div className="mt-2">
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                          <img src={photo} alt={`Фото ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="w-6 h-6 text-white" />
                          </button>
                        </div>
                      ))}
                      {formData.photos.length < maxPhotos && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 dark:text-gray-500 hover:text-primary">
                          <ImagePlus className="w-6 h-6" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                  {formData.photos.length === 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${errors.photos ? 'border-red-300 bg-red-50/50 dark:bg-red-900/20 text-red-400' : 'border-gray-200 dark:border-gray-600 hover:border-primary text-gray-400 dark:text-gray-500 hover:text-primary'}`}>
                        <ImagePlus className="w-6 h-6" />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                  {formData.photos.length >= maxPhotos && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-1">Загружено максимальное количество фото</p>
                  )}
                </div>
                {errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Адрес и карта */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.petForm.addressLabel}</span>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Минск, ул. Примерная, 1"
                    className={`flex-1 px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.city ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const addr = formData.city.trim();
                      if (!addr) return;
                      const result = await geocode(addr);
                      if (result) {
                        setFormData({
                          ...formData,
                          city: result.displayName,
                          location: { lat: result.lat, lng: result.lng },
                        });
                      } else {
                        toast.error('Адрес не найден. Проверьте ввод или выберите точку на карте.');
                      }
                    }}
                    className="px-4 py-3 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0"
                    title="Показать на карте"
                  >
                    <Search className="w-4 h-4" />
                    {t.pet.onMap}
                  </button>
                </div>
                {errors.city
                  ? <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                  : <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Введите адрес и нажмите «На карте» или выберите точку на карте</p>
                }
              </div>
              <div>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Точка на карте *</span>
                <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                  <LocationPicker
                    initialLocation={formData.location}
                    onLocationSelect={(newLocation) => setFormData((prev) => ({ ...prev, location: newLocation }))}
                    onLocationWithAddress={(location, address) => {
                      setFormData((prev) => ({ ...prev, location, city: address }));
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Описание */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.petForm.descriptionLabel}</span>
                  <span className={`text-xs ${formData.description.length > MAX_DESCRIPTION ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formData.description.length} / {MAX_DESCRIPTION}
                  </span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESCRIPTION) {
                      setFormData({ ...formData, description: e.target.value });
                    }
                  }}
                  placeholder={t.petForm.descriptionPlaceholder}
                  rows={4}
                  maxLength={MAX_DESCRIPTION}
                  className={`w-full mt-2 px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}`}
                  required
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          )}

          {/* Step 5: Контакты (только при создании) */}
          {step === 5 && !isEditing && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.profile.contacts}</span>
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-accent dark:hover:bg-accent/80 cursor-pointer">
                    <input
                      type="radio"
                      name="contactSource"
                      checked={formData.useProfileContacts === true}
                      onChange={() => setFormData({ ...formData, useProfileContacts: true })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{t.petForm.useMyContacts}</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-accent dark:hover:bg-accent/80 cursor-pointer">
                    <input
                      type="radio"
                      name="contactSource"
                      checked={formData.useProfileContacts === false}
                      onChange={() => setFormData({ ...formData, useProfileContacts: false })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{t.petForm.newContacts}</span>
                  </label>
                </div>
              </div>
              {!formData.useProfileContacts && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.petForm.contactNameLabel} *</label>
                    <input
                      type="text"
                      value={formData.contactName ?? ''}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder={t.profile.namePlaceholder}
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary ${errors.contactName ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}`}
                    />
                    {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.petForm.contactPhoneLabel} *</label>
                    <input
                      type="tel"
                      value={formData.contactPhone ?? ''}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+375291234567"
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary ${errors.contactPhone ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}`}
                    />
                    {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
                  </div>
                </div>
              )}
              <div>
                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-accent dark:hover:bg-accent/80">
                  <input
                    type="checkbox"
                    checked={!!formData.agreeToPrivacy}
                    onChange={(e) => setFormData({ ...formData, agreeToPrivacy: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-primary rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.petForm.agreePrivacy}</span>
                </label>
                {errors.agreeToPrivacy && <p className="text-xs text-red-500 mt-1">{errors.agreeToPrivacy}</p>}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100 dark:border-gray-700">
            {variant === 'page' ? (
              <div />
            ) : step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.common.back}
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTried(true);
                  if (canProceed()) { setTried(false); setStep(step + 1); }
                }}
                className={`flex items-center gap-1.5 px-6 py-3 text-white text-sm font-medium rounded-lg transition-colors ${variant === 'page' ? 'bg-primary hover:bg-primary/90' : 'bg-primary hover:bg-primary/90'}`}
              >
                {variant === 'page' ? t.petForm.saveAndContinue : t.common.next}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                {isEditing ? t.common.save : t.petForm.createAd}
              </button>
            )}
          </div>
        </form>
    </>
  );

  const cardClass = variant === 'modal'
    ? 'bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl'
    : 'w-full max-w-2xl mx-auto';

  if (variant === 'page') {
    return <div className={cardClass}>{content}</div>;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className={cardClass} onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
