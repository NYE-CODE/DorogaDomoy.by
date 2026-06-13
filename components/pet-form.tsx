import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { X, Search, ChevronLeft, Upload } from 'lucide-react';
import { AnimalType, PetStatus, PetColor, Gender, Pet } from '../types/pet';
import { useScrollLock } from './ui/use-scroll-lock';
import { BreedCombobox } from './breed-combobox';
import { CAT_BREEDS, DOG_BREEDS } from '../utils/breeds';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useI18n } from '../context/I18nContext';
import { useIsMobile } from './ui/use-mobile';
import { LocationPicker } from './location-picker';
import { DEFAULT_CITY, findCityByName } from '../utils/cities';
import { geocode } from '../utils/geocode';
import { toast } from 'sonner';
import { settingsApi } from '../api/client';
import { compressImageFileToDataUrl } from '../utils/compress-image';
import {
  BELARUS_MOBILE_PHONE_PLACEHOLDER,
  formatBelarusPhoneStorage,
  isValidBelarusMobilePhoneOptional,
} from '../utils/belarus-phone';
import {
  clearPetFormDraft,
  loadPetFormDraft,
  savePetFormDraft,
} from '@/shared/lib/pet-form-draft';

const MAX_DESCRIPTION = 500;

export interface PetFormStepInfo {
  step: number;
  totalSteps: number;
  stepTitle: string;
  stepDesc: string;
  pageTitle: string;
  onBack: () => void;
}

interface PetFormProps {
  onClose: () => void;
  onSubmit: (data: PetFormData) => void;
  initialData?: Pet;
  isEditing?: boolean;
  /** При создании: статус выбран в модалке «потерял/нашёл», в форме не показываем выбор */
  initialStatus?: PetStatus;
  /** Режим отображения: modal — поверх страницы, page — контент на странице без оверлея */
  variant?: 'modal' | 'page';
  /** При true и variant=page: шаг рендерится снаружи (родитель), форма не рисует header с шагом */
  renderStepHeaderExternally?: boolean;
  /** Вызывается при смене шага — родитель может отрисовать секцию шага под хедером */
  onStepChange?: (info: PetFormStepInfo) => void;
  /** Частичное предзаполнение при создании (например из «Мои питомцы») */
  prefillPartial?: Partial<PetFormData> | null;
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
  /** Награда за помощь */
  rewardMode?: 'points' | 'money';
  rewardAmountByn?: number;
  /** Госучёт РБ (жетон): орган ведения учёта */
  registrationAuthority?: string;
  /** Номер жетона */
  registrationTokenNumber?: string;
}

/** Город и точка на карте по выбранному в фильтре городу (иначе Минск). */
function defaultsFromSelectedCity(selectedCity: string): Pick<PetFormData, 'city' | 'location'> {
  const trimmed = selectedCity.trim();
  if (!trimmed) {
    return {
      city: DEFAULT_CITY.name,
      location: { lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] },
    };
  }
  const found = findCityByName(trimmed);
  if (found) {
    return {
      city: found.name,
      location: { lat: found.coordinates[0], lng: found.coordinates[1] },
    };
  }
  return {
    city: trimmed,
    location: { lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] },
  };
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
  city: DEFAULT_CITY.name,
  location: { lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] },
  contacts: {},
  useProfileContacts: true,
  contactName: '',
  contactPhone: '',
  agreeToPrivacy: false,
  rewardMode: 'points',
  rewardAmountByn: undefined,
  registrationAuthority: '',
  registrationTokenNumber: '',
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
    city: pet.city ?? DEFAULT_CITY.name,
    location: pet.location ?? {
      lat: DEFAULT_CITY.coordinates[0],
      lng: DEFAULT_CITY.coordinates[1],
    },
    contacts: pet.contacts ?? {},
    useProfileContacts: true,
    contactName: pet.authorName ?? '',
    contactPhone: pet.contacts?.phone ?? '',
    agreeToPrivacy: true,
    rewardMode: pet.rewardMode ?? 'points',
    rewardAmountByn: pet.rewardAmountByn,
    registrationAuthority: pet.registrationAuthority ?? '',
    registrationTokenNumber: pet.registrationTokenNumber ?? '',
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

const agePresetValues = ['', 'менее 2 года', 'более 2 года'] as const;

const TOTAL_STEPS_CREATE = 5;
const TOTAL_STEPS_EDIT = 5;

export function PetForm({
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  initialStatus,
  variant = 'modal',
  renderStepHeaderExternally = false,
  onStepChange,
  prefillPartial = null,
}: PetFormProps) {
  const { user } = useAuth();
  const { selectedCity } = useCity();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  useScrollLock(variant === 'modal');

  const getAgeLabel = (value: string, short: boolean) => {
    const pf = t.petForm as { ageUnknownShort?: string; ageLess2?: string; ageLess2Short?: string; ageMore2?: string; ageMore2Short?: string };
    if (value === '') return short ? (pf.ageUnknownShort ?? 'Неизв.') : t.pet.gender.unknown;
    if (value === 'менее 2 года') return short ? (pf.ageLess2Short ?? '< 2 года') : (pf.ageLess2 ?? 'менее 2 года');
    if (value === 'более 2 года') return short ? (pf.ageMore2Short ?? '> 2 года') : (pf.ageMore2 ?? 'более 2 года');
    return value;
  };

  const totalSteps = isEditing ? TOTAL_STEPS_EDIT : TOTAL_STEPS_CREATE;

  const [formData, setFormData] = useState<PetFormData>(() => {
    if (initialData) return formDataFromPet(initialData);
    const fromFilter = defaultsFromSelectedCity(selectedCity);
    return {
      ...defaultFormData,
      status: initialStatus ?? 'searching',
      city: fromFilter.city,
      location: fromFilter.location,
    };
  });

  const [step, setStep] = useState(1);
  const [tried, setTried] = useState(false);
  const [maxPhotos, setMaxPhotos] = useState(10);
  const [draftPhotoCount, setDraftPhotoCount] = useState(0);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftLoadedRef = useRef(false);

  useEffect(() => {
    if (isEditing || initialData || draftLoadedRef.current || !user?.id) return;
    if (prefillPartial && Object.keys(prefillPartial).length > 0) return;
    const draft = loadPetFormDraft(user.id);
    if (!draft) return;
    draftLoadedRef.current = true;
    setFormData({ ...draft.formData, photos: [] });
    setStep(Math.min(Math.max(draft.step, 1), totalSteps));
    setDraftPhotoCount(draft.savedPhotoCount);
    setDraftRestored(true);
  }, [isEditing, initialData, user?.id, prefillPartial, totalSteps]);

  useEffect(() => {
    if (isEditing || !user?.id) return;
    const timer = window.setTimeout(() => {
      savePetFormDraft(user.id, { formData, step });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [formData, step, isEditing, user?.id]);

  useEffect(() => {
    setStep(1);
    setTried(false);
  }, [isEditing, initialData?.id, prefillPartial]);

  useEffect(() => {
    if (!initialData && initialStatus) {
      setFormData((prev) => ({ ...prev, status: initialStatus }));
    }
  }, [initialStatus, initialData]);

  useEffect(() => {
    settingsApi.get().then((s) => {
      const val = parseInt(String(s.max_photos ?? ''), 10);
      if (Number.isFinite(val) && val > 0 && val <= 50) setMaxPhotos(val);
    }).catch((err: unknown) => {
      console.warn('[PetForm] settings (max_photos) load failed', err);
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(formDataFromPet(initialData));
    } else {
      const fromFilter = defaultsFromSelectedCity(selectedCity);
      const base: PetFormData = {
        ...defaultFormData,
        status: initialStatus ?? 'searching',
        city: fromFilter.city,
        location: fromFilter.location,
      };
      if (user?.contacts) base.contacts = user.contacts;
      if (prefillPartial) {
        Object.assign(base, prefillPartial);
      }
      setFormData(base);
    }
  }, [initialData?.id, user?.id, prefillPartial, initialStatus]);

  /** Подстраиваем адрес шага 3 под смену города в фильтре (только создание объявления). */
  useEffect(() => {
    if (initialData || isEditing) return;
    const fromFilter = defaultsFromSelectedCity(selectedCity);
    setFormData((prev) => ({ ...prev, city: fromFilter.city, location: fromFilter.location }));
  }, [selectedCity, initialData, isEditing]);

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
        const compressed = await compressImageFileToDataUrl(file);
        setFormData(prev => {
          if (prev.photos.length >= maxPhotos) {
            toast.warning(t.common.toasts.maxPhotos.replace('{n}', String(maxPhotos)));
            return prev;
          }
          return { ...prev, photos: [...prev.photos, compressed] };
        });
      } catch {
        toast.error(t.common.toasts.imageProcessError);
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
    if (formData.status === 'searching' && formData.rewardMode === 'money') {
      const amount = Number(formData.rewardAmountByn);
      if (!Number.isFinite(amount) || amount <= 0) {
        errs.rewardAmountByn = 'Укажите сумму в BYN';
      }
    }
    const raLen = (formData.registrationAuthority ?? '').trim().length;
    const rtLen = (formData.registrationTokenNumber ?? '').trim().length;
    if (raLen > 300) errs.registrationAuthority = 'Макс. 300 символов';
    if (rtLen > 80) errs.registrationTokenNumber = 'Макс. 80 символов';
    return errs;
  };

  const step5Errors = () => {
    const errs: Record<string, string> = {};
    if (!isEditing && !formData.agreeToPrivacy) errs.agreeToPrivacy = t.petForm.agreePrivacyRequired;
    if (formData.useProfileContacts) {
      if (!user) {
        errs.profileContacts = t.petForm.profileContactsNeedAuth;
      } else {
        const p = user.contacts?.phone?.trim() ?? '';
        const v = user.contacts?.viber?.trim() ?? '';
        const tg = user.contacts?.telegram?.trim() ?? '';
        const linked = !!user.telegramId;
        if (!p && !v && !tg && !linked) {
          errs.profileContacts = t.profile.atLeastOneContact;
        } else if (p && !isValidBelarusMobilePhoneOptional(p)) {
          errs.profileContacts = t.profile.belarusPhoneInvalid;
        } else if (v && !isValidBelarusMobilePhoneOptional(v)) {
          errs.profileContacts = t.profile.belarusPhoneInvalid;
        }
      }
    } else {
      if (!formData.contactName?.trim()) errs.contactName = t.profile.nameLabel;
      if (!formData.contactPhone?.trim()) errs.contactPhone = t.profile.phone;
      else if (!isValidBelarusMobilePhoneOptional(formData.contactPhone)) {
        errs.contactPhone = t.profile.belarusPhoneInvalid;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (step < totalSteps) {
      if (canProceed()) { setTried(false); setStep(step + 1); }
      return;
    }
    if (!canProceed()) return;
    const dataToSubmit: PetFormData = { ...formData };
    if (formData.useProfileContacts && user) {
      dataToSubmit.contacts = { ...user.contacts };
    } else {
      const trimmed = formData.contactPhone?.trim() || '';
      dataToSubmit.contacts = {
        phone: trimmed ? (formatBelarusPhoneStorage(trimmed) ?? undefined) : undefined,
      };
      dataToSubmit.contactName = formData.contactName?.trim();
    }
    try {
      await Promise.resolve(onSubmit(dataToSubmit));
      if (!isEditing && user?.id) clearPetFormDraft(user.id);
      onClose();
    } catch {
      // Ошибка — остаёмся на форме, родитель показал toast
    }
  };

  const stepTitles = [t.petForm.step1Title, t.petForm.step2Title, t.petForm.step3Title, t.petForm.step4Title, t.petForm.step5Title];
  const stepDescs = [t.petForm.step1Desc, t.petForm.step2Desc, t.petForm.step3Desc, t.petForm.step4Desc, t.petForm.step5Desc];
  const safeStepIndex = Math.min(Math.max(step, 1), totalSteps) - 1;
  const currentStepTitle = stepTitles[safeStepIndex] ?? '';
  const currentStepDesc = stepDescs[safeStepIndex] ?? '';

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

  useEffect(() => {
    if (renderStepHeaderExternally && variant === 'page' && onStepChange) {
      onStepChange({
        step,
        totalSteps,
        stepTitle: currentStepTitle,
        stepDesc: currentStepDesc,
        pageTitle: getPageTitle(),
        onBack: () => (step > 1 ? setStep(step - 1) : onClose()),
      });
    }
  }, [step, totalSteps, formData.status, formData.animalType, renderStepHeaderExternally, variant, onStepChange]);

  const content = (
    <>
      {/* Header — при renderStepHeaderExternally рисуется снаружи (PostPage) */}
      {!(variant === 'page' && renderStepHeaderExternally) && (
      <div className={`sticky top-0 z-10 ${variant === 'page' ? 'pb-6 border-b border-border' : 'bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border/60 dark:border-border rounded-t-2xl'}`}>
        {variant === 'page' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground dark:hover:text-white text-sm font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                {t.common.back}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white"
              >
                {t.petForm.close}
              </button>
            </div>
            <h1 className="typo-h2 mb-3">
              {getPageTitle()}
            </h1>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-primary-light to-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <p className="text-sm font-medium text-foreground/90">
              {t.petForm.step} {step} {t.petForm.of} {totalSteps}: {currentStepTitle}
            </p>
            {currentStepDesc && (
              <p className="text-sm text-muted-foreground mt-1">
                {currentStepDesc}
              </p>
            )}
          </div>
        ) : (
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? t.petForm.editTitle : formData.status === 'searching' ? t.petForm.formTitleLost : t.petForm.formTitleFound}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex gap-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-8 rounded-full transition-colors ${step >= i + 1 ? 'bg-primary' : 'bg-muted dark:bg-muted/80'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground/80">{t.petForm.step} {step} {t.petForm.of} {totalSteps}</span>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors" aria-label={t.common.back}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
      )}

        <form onSubmit={handleSubmit} className={variant === 'page' ? 'pt-8' : 'p-6'}>
          {draftRestored && !isEditing ? (
            <div
              role="status"
              className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
            >
              <p className="font-medium">{t.petForm.draftRestored}</p>
              {draftPhotoCount > 0 ? (
                <p className="mt-1 text-muted-foreground">
                  {t.petForm.draftPhotosHint.replace('{n}', String(draftPhotoCount))}
                </p>
              ) : null}
            </div>
          ) : null}
          {/* stepDesc для шагов 2–5 — сверху формы, как в эталоне */}
          {variant === 'page' && step >= 2 && currentStepDesc && (
            <p className="text-muted-foreground mb-6">{currentStepDesc}</p>
          )}
          {/* Step 1: Тип питомца, пол, цвет, возраст */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Announcement type - только при создании */}
              {!isEditing && (
                <>
                  <div className="mb-8 pb-6 border-b border-border">
                    <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                      Тип объявления
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'searching' })}
                        className={`flex-1 rounded-lg px-6 py-3 font-medium transition-colors ${
                          formData.status === 'searching'
                            ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-600/90'
                            : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                        }`}
                      >
                        Пропала
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'found' })}
                        className={`flex-1 rounded-lg px-6 py-3 font-medium transition-colors ${
                          formData.status === 'found'
                            ? 'bg-sky-600 text-white shadow-sm hover:bg-sky-600/90'
                            : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                        }`}
                      >
                        Найдена
                      </button>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">{t.petForm.step1Desc}</p>
                </>
              )}
              {/* Animal type + Breed */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="shrink-0">
                  <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">{t.petForm.whoIsThis}</label>
                  <div className={`flex gap-3 ${variant === 'page' ? '' : 'bg-muted rounded-lg p-0.5'}`}>
                    {animalTypeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, animalType: opt.value, breed: '' })}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                          variant === 'page'
                            ? formData.animalType === opt.value
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                            : formData.animalType === opt.value
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        } ${variant === 'page' ? 'text-sm' : 'px-3 py-1.5 text-sm'}`}
                      >
                        <span className="text-base leading-none">{opt.icon}</span>
                        {(opt.value === 'cat' || opt.value === 'dog') && isMobile ? null : (
                          <span>{t.pet.animalType[opt.value]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.animalType && <p className="text-xs text-red-500 mt-1">{errors.animalType}</p>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{t.petForm.breedLabel}</span>
                  <div className="mt-1.5">
                    {formData.animalType === 'other' ? (
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value.slice(0, 80) })}
                        placeholder="Введите породу (необязательно)"
                        maxLength={80}
                        className={variant === 'page' ? 'w-full px-4 py-3 border border-black/10 dark:border-border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent' : 'w-full px-4 py-3 border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'}
                      />
                    ) : (
                      <BreedCombobox
                        breeds={formData.animalType === 'cat' ? CAT_BREEDS : DOG_BREEDS}
                        value={formData.breed}
                        onChange={(breed) => setFormData({ ...formData, breed })}
                        placeholder="Выберите или введите породу"
                        className={variant === 'page' ? 'bg-input-background dark:bg-input-background border-black/10 dark:border-border' : undefined}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">{t.petForm.colorLabel}</label>
                <div className={`flex flex-wrap gap-2 mt-1.5 ${errors.colors ? 'ring-2 ring-red-300 bg-red-50/50 dark:bg-red-900/20 p-2 rounded-xl' : ''}`}>
                  {(Object.keys(t.pet.color) as PetColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        variant === 'page'
                          ? formData.colors.includes(color)
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                          : formData.colors.includes(color)
                            ? 'bg-muted text-muted-foreground border border-border'
                            : 'bg-card text-foreground border border-border hover:bg-muted hover:border-border'
                      }`}
                    >
                      {t.pet.color[color]}
                    </button>
                  ))}
                </div>
                {errors.colors && <p className="text-xs text-red-500 mt-1">{errors.colors}</p>}
              </div>

              {/* Gender + Age */}
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">{t.petForm.genderLabel}</label>
                  <div className={`flex gap-3 ${variant === 'page' ? '' : 'bg-muted rounded-lg p-0.5 w-fit'}`}>
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: opt.value })}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                          variant === 'page'
                            ? formData.gender === opt.value
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                            : formData.gender === opt.value
                              ? 'bg-card text-foreground shadow-sm px-3 py-1.5'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground px-3 py-1.5'
                        }`}
                      >
                        {isMobile && opt.value === 'unknown'
                          ? ((t.pet.gender as { unknownShort?: string }).unknownShort ?? 'Неизв.')
                          : t.pet.gender[opt.value]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">{t.petForm.ageLabel}</label>
                  {variant === 'page' ? (
                    <div className="flex gap-3">
                      {agePresetValues.map((value) => (
                        <button
                          key={value || 'empty'}
                          type="button"
                          onClick={() => setFormData({ ...formData, approximateAge: value })}
                          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            (formData.approximateAge === value || (value === '' && !formData.approximateAge))
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                          }`}
                        >
                          {getAgeLabel(value, isMobile)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.approximateAge}
                      onChange={(e) => setFormData({ ...formData, approximateAge: e.target.value })}
                      placeholder="Напр.: 2 года"
                      className="block mt-1.5 w-full px-4 py-3 border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Фото — точно по эталону */}
          {step === 2 && (
            <div>
              <div className="text-right text-sm text-muted-foreground mb-4">
                {formData.photos.length} из {maxPhotos}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
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
                {formData.photos.length < maxPhotos && formData.photos.length > 0 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50/50 flex flex-col items-center justify-center transition-colors text-muted-foreground hover:text-primary">
                    <Upload className="w-6 h-6 mb-2" />
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
              {formData.photos.length === 0 && (
                <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50/50 transition-colors ${errors.photos ? '!border-destructive bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                  <Upload size={48} className="text-muted-foreground mb-4" />
                  <span className="text-muted-foreground dark:text-foreground font-medium">{(t.petForm as { uploadPhotoHint?: string }).uploadPhotoHint || 'Нажмите для загрузки фото'}</span>
                  <span className="text-sm text-muted-foreground mt-2">{(t.petForm as { uploadPhotoDrag?: string }).uploadPhotoDrag || 'или перетащите файлы сюда'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
              {formData.photos.length >= maxPhotos && (
                <p className="text-sm text-muted-foreground text-center py-1">Загружено максимальное количество фото</p>
              )}
              {errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}
            </div>
          )}

          {/* Step 3: Адрес и карта */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground uppercase mb-3 block">{t.petForm.addressLabel}</span>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Минск, ул. Примерная, 1"
                    className={variant === 'page' ? `flex-1 w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.city ? 'border-destructive' : 'border-black/10 dark:border-border'}` : `flex-1 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.city ? 'border-destructive' : 'border-border dark:border-border'}`}
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
                        toast.error(t.common.toasts.addressNotFound);
                      }
                    }}
                    className="px-6 h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1.5 shrink-0"
                    title="Показать на карте"
                  >
                    <Search className="w-4 h-4" />
                    {t.pet.onMap}
                  </button>
                </div>
                {errors.city
                  ? <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                  : <p className="text-xs text-muted-foreground/80 mt-1">Введите адрес и нажмите «На карте» или выберите точку на карте</p>
                }
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">Точка на карте *</span>
                <div className={`mt-2 rounded-xl overflow-hidden border ${variant === 'page' ? 'border-black/10 dark:border-border' : 'border-border'}`}>
                  <LocationPicker
                    initialLocation={formData.location}
                    onLocationSelect={(newLocation) => setFormData((prev) => ({ ...prev, location: newLocation }))}
                    onLocationWithAddress={(location, address) => {
                      setFormData((prev) => ({ ...prev, location, city: address }));
                    }}
                    mapHeight={variant === 'page' ? 'h-96' : 'h-48'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Описание — как в эталоне */}
          {step === 4 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-muted-foreground uppercase">{t.petForm.descriptionLabel}</label>
                <span className={`text-sm ${formData.description.length > MAX_DESCRIPTION ? 'text-red-500 font-medium' : 'text-muted-foreground dark:text-muted-foreground'}`}>
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
                rows={8}
                maxLength={MAX_DESCRIPTION}
                className={variant === 'page' ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-destructive' : 'border-border'}` : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-destructive' : 'border-border dark:border-border'}`}
                required
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}

              <div className="mt-8 border-t border-border pt-6">
                <p className="text-sm font-semibold text-muted-foreground uppercase mb-1">
                  {t.petForm.registrationSectionTitle}
                </p>
                <p className="text-xs text-muted-foreground mb-4">{t.petForm.registrationHint}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/90 mb-2">
                      {t.petForm.registrationAuthorityLabel}
                    </label>
                    <input
                      type="text"
                      value={formData.registrationAuthority ?? ''}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationAuthority: e.target.value })
                      }
                      placeholder={t.petForm.registrationAuthorityPlaceholder}
                      maxLength={300}
                      className={variant === 'page'
                        ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.registrationAuthority ? 'border-destructive' : 'border-border'}`
                        : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.registrationAuthority ? 'border-destructive' : 'border-border dark:border-border'}`}
                    />
                    {errors.registrationAuthority && (
                      <p className="text-xs text-red-500 mt-1">{errors.registrationAuthority}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/90 mb-2">
                      {t.petForm.registrationTokenLabel}
                    </label>
                    <input
                      type="text"
                      value={formData.registrationTokenNumber ?? ''}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationTokenNumber: e.target.value })
                      }
                      placeholder={t.petForm.registrationTokenPlaceholder}
                      maxLength={80}
                      className={variant === 'page'
                        ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.registrationTokenNumber ? 'border-destructive' : 'border-border'}`
                        : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.registrationTokenNumber ? 'border-destructive' : 'border-border dark:border-border'}`}
                    />
                    {errors.registrationTokenNumber && (
                      <p className="text-xs text-red-500 mt-1">{errors.registrationTokenNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {formData.status === 'searching' && (
              <div className="mt-8 border-t border-border pt-6">
                <div className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {(t.petForm as { rewardTitle?: string }).rewardTitle ?? 'Награда за помощь'}
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
                    <input
                      type="radio"
                      name="rewardMode"
                      checked={(formData.rewardMode ?? 'points') === 'points'}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          rewardMode: 'points',
                          rewardAmountByn: undefined,
                        })
                      }
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-foreground/90">
                      {(t.petForm as { rewardPointsMode?: string }).rewardPointsMode ??
                        'Награда платформы: очки'}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
                    <input
                      type="radio"
                      name="rewardMode"
                      checked={formData.rewardMode === 'money'}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          rewardMode: 'money',
                          rewardAmountByn: formData.rewardAmountByn ?? 50,
                        })
                      }
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-foreground/90">
                      {(t.petForm as { rewardMoneyMode?: string }).rewardMoneyMode ??
                        'Денежное вознаграждение (передача напрямую)'}
                    </span>
                  </label>
                </div>

                {formData.rewardMode === 'money' ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground/90 mb-2">
                      {(t.petForm as { rewardAmountLabel?: string }).rewardAmountLabel ??
                        'Сумма вознаграждения, BYN'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={formData.rewardAmountByn ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rewardAmountByn: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="100"
                      className={variant === 'page'
                        ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.rewardAmountByn ? 'border-destructive' : 'border-border'}`
                        : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.rewardAmountByn ? 'border-destructive' : 'border-border dark:border-border'}`}
                    />
                    {errors.rewardAmountByn && <p className="text-xs text-red-500 mt-1">{errors.rewardAmountByn}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {(t.petForm as { rewardMoneyHint?: string }).rewardMoneyHint ??
                        'Платформа не участвует в передаче средств: владелец передаёт вознаграждение лично.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-3">
                    {(t.petForm as { rewardPointsHint?: string }).rewardPointsHint ??
                      'Если владелец подтвердит помощника по ID после закрытия объявления, система начислит очки.'}
                  </p>
                )}
              </div>
              )}
            </div>
          )}

          {/* Step 5: Контакты — при создании и редактировании */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">{t.petForm.contactsForLink}</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
                    <input
                      type="radio"
                      name="contactSource"
                      checked={formData.useProfileContacts === true}
                      onChange={() => setFormData({ ...formData, useProfileContacts: true })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-foreground/90">{t.petForm.useMyContacts}</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
                    <input
                      type="radio"
                      name="contactSource"
                      checked={formData.useProfileContacts === false}
                      onChange={() => setFormData({ ...formData, useProfileContacts: false })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-foreground/90">{t.petForm.newContacts}</span>
                  </label>
                </div>
                {errors.profileContacts && (
                  <p className="text-xs text-red-500 mt-2">{errors.profileContacts}</p>
                )}
              </div>
              {!formData.useProfileContacts && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground/90 mb-2">{t.petForm.contactNameLabel} *</label>
                    <input
                      type="text"
                      value={formData.contactName ?? ''}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Ваше имя"
                      className={variant === 'page' ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.contactName ? 'border-destructive' : 'border-border'}` : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.contactName ? 'border-destructive' : 'border-border dark:border-border'}`}
                    />
                    {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/90 mb-2">{t.petForm.contactPhoneLabel} *</label>
                    <input
                      type="tel"
                      value={formData.contactPhone ?? ''}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER}
                      className={variant === 'page' ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.contactPhone ? 'border-destructive' : 'border-border'}` : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.contactPhone ? 'border-destructive' : 'border-border dark:border-border'}`}
                    />
                    {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
                  </div>
                </div>
              )}
              {!isEditing && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.agreeToPrivacy}
                    onChange={(e) => setFormData({ ...formData, agreeToPrivacy: e.target.checked })}
                    className="mt-1 w-4 h-4 text-primary rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">
                    {t.petForm.agreePrivacy}{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      {t.petForm.privacyPolicyLink}
                    </Link>
                  </span>
                </label>
              )}
              {!isEditing && errors.agreeToPrivacy && <p className="text-xs text-red-500 mt-1">{errors.agreeToPrivacy}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border/60 dark:border-border">
            {variant === 'page' ? (
              <div />
            ) : step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm text-muted-foreground hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
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
                className={`flex items-center justify-center gap-1.5 px-6 py-3 text-white font-medium rounded-lg transition-colors ${variant === 'page' ? 'w-full h-12 bg-primary hover:bg-primary-hover text-lg' : 'bg-primary hover:bg-primary/90 text-sm'}`}
              >
                {variant === 'page' ? (t.petForm as { nextStep?: string }).nextStep || 'Следующий шаг' : t.common.next}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isEditing && !formData.agreeToPrivacy}
                className="w-full h-12 bg-primary hover:bg-primary-hover text-white text-lg font-medium rounded-lg disabled:bg-muted dark:disabled:bg-muted/80 disabled:cursor-not-allowed transition-colors"
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
    : 'w-full';

  if (variant === 'page') {
    return <div className={cardClass}>{content}</div>;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"
      onClick={onClose}
    >
      <div className={cardClass} onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
