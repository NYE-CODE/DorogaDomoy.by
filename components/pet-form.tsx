import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { X, Search, ChevronLeft, Upload, Sparkles } from 'lucide-react';
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
import { petsApi } from '@/shared/api/client';
import { compressImageFileToDataUrl } from '../utils/compress-image';
import {
  BELARUS_MOBILE_PHONE_PLACEHOLDER,
  formatBelarusPhoneStorage,
  isValidBelarusMobilePhoneOptional,
} from '../utils/belarus-phone';
import { petScenarioFormToggleActiveClass } from '@/shared/lib/pet-helpers';
import { clearPetFormDraft, loadPetFormDraft, savePetFormDraft } from '@/shared/lib/pet-form-draft';
import {
  APPROXIMATE_AGE_LESS_2,
  APPROXIMATE_AGE_MORE_2,
  applyPhotoAnalyzeToAdForm,
  pickBestPhotoForAi,
  type AiFilledAdFields,
} from '@/shared/lib/ai-photo-analyze';
import { RouteProgress } from '@/shared/ui/molecules';

const APPROXIMATE_AGE_PRESET_VALUES = [
  '',
  APPROXIMATE_AGE_LESS_2,
  APPROXIMATE_AGE_MORE_2,
] as const;

const MAX_DESCRIPTION = 500;
const MIN_DESCRIPTION = 20;

function AiFieldBadge({ show, label }: { show?: boolean; label: string }) {
  if (!show) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium normal-case text-primary">
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

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
  /** See PetFormProps */
  initialStatus?: PetStatus;
  /** See PetFormProps */
  variant?: 'modal' | 'page';
  /** See PetFormProps */
  renderStepHeaderExternally?: boolean;
  /** See PetFormProps */
  onStepChange?: (info: PetFormStepInfo) => void;
  /** See PetFormProps */
  prefillPartial?: Partial<PetFormData> | null;
}

export interface PetFormData {
  photos: string[];
  animalType: AnimalType;
  breed: string;
  colors: PetColor[];
  gender: Gender;
  approximateAge: string;
  /** Исходная строка возраста из профиля (для отображения; категория — approximateAge) */
  approximateAgeRaw?: string;
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
  /** See PetFormProps */
  useProfileContacts?: boolean;
  /** See PetFormProps */
  contactName?: string;
  /** See PetFormProps */
  contactPhone?: string;
  /** See PetFormProps */
  agreeToPrivacy?: boolean;
  /** See PetFormProps */
  rewardMode?: 'points' | 'money';
  rewardAmountByn?: number;
  /** See PetFormProps */
  registrationAuthority?: string;
  /** See PetFormProps */
  registrationTokenNumber?: string;
  /** Показывать номер чипа в публичном описании (по умолчанию нет) */
  includeChipInDescription?: boolean;
  /** Номер чипа из профиля — не уходит отдельным полем API, только в description при согласии */
  pendingChipNumber?: string;
}

/** See PetFormProps */
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
  approximateAgeRaw: '',
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
  includeChipInDescription: false,
  pendingChipNumber: '',
};

function formDataFromPet(pet: Pet): PetFormData {
  return {
    photos: pet.photos ?? [],
    animalType: pet.animalType,
    breed: pet.breed || '',
    colors: pet.colors ?? [],
    gender: pet.gender || 'unknown',
    approximateAge: pet.approximateAge || '',
    approximateAgeRaw: pet.approximateAgeRaw || '',
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
    includeChipInDescription: false,
    pendingChipNumber: '',
  };
}

const animalTypeOptions: { value: AnimalType; icon: string }[] = [
  { value: 'cat', icon: '🐱' },
  { value: 'dog', icon: '🐶' },
  { value: 'other', icon: '🐾' },
];

const genderOptions: { value: Gender }[] = [
  { value: 'unknown' },
  { value: 'male' },
  { value: 'female' },
];

const agePresetValues = APPROXIMATE_AGE_PRESET_VALUES;

const TOTAL_STEPS_CREATE = 5;
const TOTAL_STEPS_EDIT = 5;

/** Миграция номера шага: прежний порядок 1=инфо, 2=описание, 3=фото → 1=фото, 2=инфо, 3=описание */
function migratePetFormDraftStep(step: number): number {
  if (step >= 5) return step;
  const legacyToCurrent: Record<number, number> = { 1: 2, 2: 3, 3: 1, 4: 4 };
  return legacyToCurrent[step] ?? step;
}

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
    const pf = t.petForm;
    if (value === '') return short ? pf.ageUnknownShort : t.pet.gender.unknown;
    if (value === APPROXIMATE_AGE_LESS_2) return short ? pf.ageLess2Short : pf.ageLess2;
    if (value === APPROXIMATE_AGE_MORE_2) return short ? pf.ageMore2Short : pf.ageMore2;
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
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<AiFilledAdFields>({});
  const [aiDescriptionBanner, setAiDescriptionBanner] = useState(false);
  const draftLoadedRef = useRef(false);
  const autoAiTriggeredRef = useRef(false);
  const prevPhotoCountRef = useRef(0);
  const photosRef = useRef(formData.photos);
  const aiRequestRef = useRef(0);
  photosRef.current = formData.photos;

  useEffect(() => {
    return () => {
      aiRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (isEditing || initialData || draftLoadedRef.current || !user?.id) return;
    if (prefillPartial && Object.keys(prefillPartial).length > 0) return;
    const draft = loadPetFormDraft(user.id);
    if (!draft) return;
    draftLoadedRef.current = true;
    setFormData({ ...draft.formData, photos: [] });
    setStep(migratePetFormDraftStep(Math.min(Math.max(draft.step, 1), totalSteps)));
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

  /** See PetFormProps */
  useEffect(() => {
    if (initialData || isEditing) return;
    const fromFilter = defaultsFromSelectedCity(selectedCity);
    setFormData((prev) => ({ ...prev, city: fromFilter.city, location: fromFilter.location }));
  }, [selectedCity, initialData, isEditing]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileList = Array.from(files);
    e.target.value = '';

    const toProcess: File[] = [];
    for (const file of fileList) {
      if (!file.type.startsWith('image/')) {
        toast.error(t.petForm.onlyImages);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(t.petForm.maxSize);
        continue;
      }
      toProcess.push(file);
    }
    if (toProcess.length === 0) return;

    const results = await Promise.all(
      toProcess.map(async (file) => {
        try {
          return await compressImageFileToDataUrl(file);
        } catch {
          return null;
        }
      }),
    );

    const compressed = results.filter((item): item is string => item !== null);
    if (compressed.length < results.length) {
      toast.error(t.common.toasts.imageProcessError);
    }
    if (compressed.length === 0) return;

    setFormData((prev) => {
      const room = maxPhotos - prev.photos.length;
      if (room <= 0) {
        toast.warning(t.common.toasts.maxPhotos.replace('{n}', String(maxPhotos)));
        return prev;
      }
      const adding = compressed.slice(0, room);
      if (adding.length < compressed.length) {
        toast.warning(t.common.toasts.maxPhotos.replace('{n}', String(maxPhotos)));
      }
      return { ...prev, photos: [...prev.photos, ...adding] };
    });
  };

  const runAiAnalyze = useCallback(async (opts?: { autoAdvance?: boolean; isAuto?: boolean }) => {
    const image = pickBestPhotoForAi(photosRef.current);
    if (!image) return;
    const reqId = ++aiRequestRef.current;
    setAiAnalyzing(true);
    try {
      const result = await petsApi.analyzePhoto(image);
      if (reqId !== aiRequestRef.current) return;
      if (!result.ai_available) {
        if (result.error === 'invalid_image') {
          toast.message(t.petForm.aiInvalidImage);
        } else if (result.error === 'not_animal') {
          toast.error(t.petForm.aiNotAnimal);
        } else if (result.error === 'photo_unclear') {
          toast.message(t.petForm.aiPhotoUnclear);
        } else if (result.error === 'analyze_failed') {
          toast.error(t.petForm.aiFailed);
        } else if (!result.error) {
          toast.message(t.petForm.aiUnavailable);
        } else {
          toast.message(t.petForm.aiFailed);
        }
        return;
      }
      let descriptionFilled = false;
      setFormData((prev) => {
        const { next, filled, descriptionFilled: descFilled } = applyPhotoAnalyzeToAdForm(
          {
            animalType: prev.animalType,
            breed: prev.breed,
            colors: prev.colors,
            gender: prev.gender,
            approximateAge: prev.approximateAge,
            description: prev.description,
          },
          result,
          MAX_DESCRIPTION,
        );
        descriptionFilled = descFilled;
        setAiFilledFields((current) => ({ ...current, ...filled }));
        return { ...prev, ...next };
      });
      autoAiTriggeredRef.current = true;
      setAiDescriptionBanner(descriptionFilled);
      toast.success(opts?.isAuto ? t.petForm.aiAppliedAuto : t.petForm.aiApplied);
      setTried(false);
      if (opts?.autoAdvance) setStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('429') || /rate limit/i.test(msg)) {
        toast.error(t.petForm.aiRateLimited);
      } else {
        toast.error(t.petForm.aiFailed);
      }
    } finally {
      if (reqId === aiRequestRef.current) setAiAnalyzing(false);
    }
  }, [t]);

  useEffect(() => {
    const count = formData.photos.length;
    if (count === 0) {
      autoAiTriggeredRef.current = false;
      prevPhotoCountRef.current = 0;
      return;
    }
    const firstPhotoAdded = prevPhotoCountRef.current === 0 && count > 0;
    prevPhotoCountRef.current = count;
    if (!firstPhotoAdded || autoAiTriggeredRef.current || aiAnalyzing) return;
    const timer = window.setTimeout(() => {
      if (!autoAiTriggeredRef.current && photosRef.current.length > 0) {
        void runAiAnalyze({ isAuto: true });
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [formData.photos.length, aiAnalyzing, runAiAnalyze]);

  const handleAiAnalyzePhoto = () => {
    void runAiAnalyze({ isAuto: false });
  };

  const toggleColor = (color: PetColor) => {
    const newColors = formData.colors.includes(color)
      ? formData.colors.filter(c => c !== color)
      : [...formData.colors, color];
    setFormData({ ...formData, colors: newColors });
    setAiFilledFields((prev) => ({ ...prev, colors: false }));
  };

  const step1Errors = () => {
    const errs: Record<string, string> = {};
    if (formData.photos.length === 0) errs.photos = t.petForm.uploadPhoto;
    return errs;
  };

  const step2Errors = () => {
    const errs: Record<string, string> = {};
    if (!formData.animalType) errs.animalType = t.petForm.selectAnimalType;
    if (!formData.breed?.trim()) errs.breed = t.petForm.breedRequired;
    if (formData.colors.length === 0) errs.colors = t.petForm.selectColor;
    return errs;
  };

  const step3Errors = () => {
    const errs: Record<string, string> = {};
    const desc = formData.description?.trim() ?? '';
    if (!desc) errs.description = t.petForm.enterDescription;
    else if (desc.length < MIN_DESCRIPTION) {
      errs.description = t.petForm.descriptionTooShort.replace('{min}', String(MIN_DESCRIPTION));
    } else if (formData.description.length > MAX_DESCRIPTION) {
      errs.description = t.petForm.descriptionTooLong.replace('{max}', String(MAX_DESCRIPTION));
    }
    if (formData.status === 'searching' && formData.rewardMode === 'money') {
      const amount = Number(formData.rewardAmountByn);
      if (!Number.isFinite(amount) || amount <= 0) {
        errs.rewardAmountByn = t.petForm.rewardAmountRequired;
      }
    }
    const raLen = (formData.registrationAuthority ?? '').trim().length;
    const rtLen = (formData.registrationTokenNumber ?? '').trim().length;
    if (raLen > 300) errs.registrationAuthority = t.petForm.registrationAuthorityTooLong;
    if (rtLen > 80) errs.registrationTokenNumber = t.petForm.registrationTokenTooLong;
    return errs;
  };

  const step4Errors = () => {
    const errs: Record<string, string> = {};
    if (!formData.city?.trim()) errs.city = t.petForm.specifyAddress;
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
      // (see i18n)
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
      {/* Header — hidden when parent renders step header (PostPage) */}
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
                {t.petForm.statusToggleLost}
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
            <RouteProgress
              totalSteps={totalSteps}
              currentStep={step}
              label={`${t.petForm.step} ${step} ${t.petForm.of} ${totalSteps}`}
              className="mb-3 max-w-sm"
            />
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
              <div className="flex items-center gap-3 mt-1.5">
                <RouteProgress
                  totalSteps={totalSteps}
                  currentStep={step}
                  label={`${t.petForm.step} ${step} ${t.petForm.of} ${totalSteps}`}
                  className="w-44"
                />
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
              className="mb-6 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
            >
              <p className="font-medium">{t.petForm.draftRestored}</p>
              {draftPhotoCount > 0 ? (
                <p className="mt-1 text-muted-foreground">
                  {t.petForm.draftPhotosHint.replace('{n}', String(draftPhotoCount))}
                </p>
              ) : null}
            </div>
          ) : null}
          {/* stepDesc for steps 2–5 below the title, same as modal */}
          {variant === 'page' && step >= 1 && currentStepDesc && (
            <p className="text-muted-foreground mb-6">{currentStepDesc}</p>
          )}
          {/* Step 2: type, breed, color, gender */}
          {step === 2 && (
            <div className="space-y-6">
              {aiDescriptionBanner && formData.description?.trim() ? (
                <div
                  role="status"
                  className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
                >
                  <p className="font-medium">{t.petForm.aiDescriptionBannerTitle}</p>
                  <p className="mt-1 text-muted-foreground line-clamp-2">{formData.description}</p>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    {t.petForm.aiDescriptionBannerAction}
                  </button>
                </div>
              ) : null}
              {/* Animal type + Breed */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="shrink-0">
                  <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                    {t.petForm.whoIsThis}
                    <AiFieldBadge show={aiFilledFields.animalType} label={t.petForm.aiFieldBadge} />
                  </label>
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
                  <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
                    {t.petForm.breedLabel} <span className="text-red-500">*</span>
                    <AiFieldBadge show={aiFilledFields.breed} label={t.petForm.aiFieldBadge} />
                  </span>
                  <div className="mt-1.5">
                    {formData.animalType === 'other' ? (
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) => {
                          setFormData({ ...formData, breed: e.target.value.slice(0, 80) });
                          setAiFilledFields((prev) => ({ ...prev, breed: false }));
                        }}
                        placeholder={t.petForm.otherBreedPlaceholder}
                        maxLength={80}
                        className={variant === 'page' ? 'w-full px-4 py-3 border border-black/10 dark:border-border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent' : 'w-full px-4 py-3 border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'}
                      />
                    ) : (
                      <BreedCombobox
                        breeds={formData.animalType === 'cat' ? CAT_BREEDS : DOG_BREEDS}
                        value={formData.breed}
                        onChange={(breed) => {
                          setFormData({ ...formData, breed });
                          setAiFilledFields((prev) => ({ ...prev, breed: false }));
                        }}
                        placeholder={t.petForm.selectOrEnterBreed}
                        className={variant === 'page' ? 'bg-input-background dark:bg-input-background border-black/10 dark:border-border' : undefined}
                      />
                    )}
                  </div>
                  {errors.breed && <p className="text-xs text-red-500 mt-1">{errors.breed}</p>}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                  {t.petForm.colorLabel}
                  <AiFieldBadge show={aiFilledFields.colors} label={t.petForm.aiFieldBadge} />
                </label>
                <div className={`flex flex-wrap gap-2 mt-1.5 ${errors.colors ? 'ring-2 ring-red-300 bg-red-50/50 dark:bg-red-900/20 p-2 rounded-md' : ''}`}>
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
                  <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                    {t.petForm.genderLabel}
                    <AiFieldBadge show={aiFilledFields.gender} label={t.petForm.aiFieldBadge} />
                  </label>
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
                          ? t.pet.gender.unknownShort
                          : t.pet.gender[opt.value]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                    {t.petForm.ageLabel}
                    <AiFieldBadge show={aiFilledFields.approximateAge} label={t.petForm.aiFieldBadge} />
                  </label>
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
                      placeholder={t.petForm.ageExamplePlaceholder}
                      className="block mt-1.5 w-full px-4 py-3 border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: description and registration */}
          {step === 3 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  {t.petForm.descriptionLabel}
                  <AiFieldBadge show={aiFilledFields.description} label={t.petForm.aiFieldBadge} />
                </label>
                <span
                  className={`text-sm ${
                    formData.description.trim().length > 0 &&
                    formData.description.trim().length < MIN_DESCRIPTION
                      ? 'text-amber-600 dark:text-amber-400 font-medium'
                      : formData.description.length > MAX_DESCRIPTION
                        ? 'text-red-500 font-medium'
                        : 'text-muted-foreground dark:text-muted-foreground'
                  }`}
                >
                  {formData.description.length} / {MAX_DESCRIPTION}
                  {formData.description.trim().length > 0 &&
                    formData.description.trim().length < MIN_DESCRIPTION && (
                      <span className="ml-1">
                        ({t.petForm.descriptionMinHint.replace('{min}', String(MIN_DESCRIPTION))})
                      </span>
                    )}
                </span>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_DESCRIPTION) {
                    setFormData({ ...formData, description: e.target.value });
                    setAiFilledFields((prev) => ({ ...prev, description: false }));
                    setAiDescriptionBanner(false);
                  }
                }}
                placeholder={t.petForm.descriptionPlaceholder}
                rows={8}
                maxLength={MAX_DESCRIPTION}
                className={variant === 'page' ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-destructive' : 'border-border'}` : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-destructive' : 'border-border dark:border-border'}`}
                required
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              {!errors.description &&
                formData.description.trim().length > 0 &&
                formData.description.trim().length < MIN_DESCRIPTION && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    {t.petForm.descriptionTooShortSearchHint}
                  </p>
                )}

              {!!formData.pendingChipNumber?.trim() && (
                <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 rounded border-border"
                    checked={!!formData.includeChipInDescription}
                    onChange={(e) => {
                      const reveal = e.target.checked;
                      const chip = formData.pendingChipNumber!.trim();
                      const chipLine = `${t.myPets.form.labelChipNumber}: ${chip}`;
                      const chippedLine = `${t.myPets.form.labelChipped}: ${t.myPets.form.yes}`;
                      let desc = formData.description;
                      desc = desc
                        .split(/\n\n+/)
                        .filter((block) => {
                          const b = block.trim();
                          if (!b) return false;
                          if (b.startsWith(`${t.myPets.form.labelChipNumber}:`)) return false;
                          if (b.startsWith(`${t.myPets.form.labelChipped}:`)) return false;
                          return true;
                        })
                        .join('\n\n');
                      const addition = reveal ? chipLine : chippedLine;
                      desc = desc ? `${desc}\n\n${addition}` : addition;
                      setFormData({
                        ...formData,
                        includeChipInDescription: reveal,
                        description: desc.slice(0, MAX_DESCRIPTION),
                      });
                    }}
                  />
                  <span>{t.petForm.revealChipInDescription}</span>
                </label>
              )}

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
                  {t.petForm.rewardTitle}
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
                      {t.petForm.rewardPointsMode}
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
                      {t.petForm.rewardMoneyMode}
                    </span>
                  </label>
                </div>

                {formData.rewardMode === 'money' ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground/90 mb-2">
                      {t.petForm.rewardAmountLabel}
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
                      {t.petForm.rewardMoneyHint}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-3">
                    {t.petForm.rewardPointsHint}
                  </p>
                )}
              </div>
              )}
            </div>
          )}

          {/* Step 1: photos */}
          {step === 1 && (
            <div>
              {!isEditing && !initialStatus && (
                <div className="mb-6 pb-6 border-b border-border">
                  <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
                    {t.petForm.whatHappened}
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'searching' })}
                      className={`flex-1 rounded-lg px-6 py-3 font-medium transition-colors ${
                        formData.status === 'searching'
                          ? petScenarioFormToggleActiveClass.lost
                          : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                      }`}
                    >
                      {t.petForm.statusToggleLost}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'found' })}
                      className={`flex-1 rounded-lg px-6 py-3 font-medium transition-colors ${
                        formData.status === 'found'
                          ? petScenarioFormToggleActiveClass.found
                          : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                      }`}
                    >
                      {t.petForm.statusToggleFound}
                    </button>
                  </div>
                </div>
              )}
              <div className="text-right text-sm text-muted-foreground mb-4">
                {t.petForm.photosUploadedCount.replace('{current}', String(formData.photos.length)).replace('{max}', String(maxPhotos))}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={photo} alt={t.petForm.photoAltNumber.replace('{n}', String(index + 1))} className="w-full h-full object-cover" />
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
                  <span className="text-muted-foreground dark:text-foreground font-medium">{t.petForm.uploadPhotoHint}</span>
                  <span className="text-sm text-muted-foreground mt-2">{t.petForm.uploadPhotoDrag}</span>
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
                <p className="text-sm text-muted-foreground text-center py-1">{t.petForm.maxPhotosReached}</p>
              )}
              {formData.photos.length > 0 && (
                <p className="mb-3 text-center text-xs text-muted-foreground">{t.petForm.aiAutoHint}</p>
              )}
              {formData.photos.length > 0 && (
                <button
                  type="button"
                  onClick={handleAiAnalyzePhoto}
                  disabled={aiAnalyzing}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                  {aiAnalyzing ? t.petForm.aiAnalyzing : t.petForm.aiSuggestFromPhoto}
                </button>
              )}
              {errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}
            </div>
          )}

          {/* Step 4: address and map */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <span className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground uppercase mb-3 block">{t.petForm.addressLabel}</span>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t.petForm.addressExamplePlaceholder}
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
                    title={t.petForm.geocodeOnMapTitle}
                  >
                    <Search className="w-4 h-4" />
                    {t.pet.onMap}
                  </button>
                </div>
                {errors.city
                  ? <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                  : <p className="text-xs text-muted-foreground/80 mt-1">{t.petForm.addressMapHint}</p>
                }
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{t.petForm.mapPointLabel}</span>
                <div className={`mt-2 rounded-md overflow-hidden border ${variant === 'page' ? 'border-black/10 dark:border-border' : 'border-border'}`}>
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

          {/* Step 5: contacts and privacy */}
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
                      placeholder={t.petForm.contactNamePlaceholder}
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
                {variant === 'page' ? t.petForm.nextStep : t.common.next}
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
    ? 'bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl'
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
