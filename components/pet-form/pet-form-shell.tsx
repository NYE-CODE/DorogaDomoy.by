import { useState, useEffect, useRef, useCallback } from 'react';
import type { PetColor } from '../../types/pet';
import { useScrollLock } from '../ui/use-scroll-lock';
import { useAuth } from '../../context/AuthContext';
import { useCity } from '../../context/CityContext';
import { useI18n } from '../../context/I18nContext';
import { useIsMobile } from '../ui/use-mobile';
import { toast } from 'sonner';
import { settingsApi } from '../../api/client';
import { petsApi } from '@/shared/api/client';
import { compressImageFileToDataUrl } from '../../utils/compress-image';
import { formatBelarusPhoneStorage } from '../../utils/belarus-phone';
import { clearPetFormDraft, loadPetFormDraft, savePetFormDraft } from '@/shared/lib/pet-form-draft';
import {
  APPROXIMATE_AGE_LESS_2,
  APPROXIMATE_AGE_MORE_2,
  applyPhotoAnalyzeToAdForm,
  pickPhotosForAi,
  type AiFilledAdFields,
} from '@/shared/lib/ai-photo-analyze';
import { MAX_DESCRIPTION, TOTAL_STEPS_CREATE, TOTAL_STEPS_EDIT } from './pet-form-constants';
import {
  defaultFormData,
  defaultsFromSelectedCity,
  formDataFromPet,
  migratePetFormDraftStep,
} from './pet-form-helpers';
import { PetFormHeader } from './pet-form-header';
import { PetFormNavigation } from './pet-form-navigation';
import { PetFormStepContacts } from './pet-form-step-contacts';
import { PetFormStepDescription } from './pet-form-step-description';
import { PetFormStepLocation } from './pet-form-step-location';
import { PetFormStepPhotos } from './pet-form-step-photos';
import { PetFormStepTraits } from './pet-form-step-traits';
import type { PetFormData, PetFormProps } from './pet-form-types';
import { getPetFormStepErrors } from './pet-form-validation';

export function PetFormShell({
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  initialStatus,
  variant = 'modal',
  renderStepHeaderExternally = false,
  onStepChange,
  prefillPartial = null,
  closeOnSubmit = true,
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
  const [submitting, setSubmitting] = useState(false);
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
    const images = pickPhotosForAi(photosRef.current);
    if (!images.length) return;
    const reqId = ++aiRequestRef.current;
    setAiAnalyzing(true);
    try {
      const result = await petsApi.analyzePhotos(images);
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
            distinctiveMarks: prev.distinctiveMarks ?? [],
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

  const getStepErrors = () => getPetFormStepErrors(step, formData, { t, user, isEditing });

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
    setSubmitting(true);
    try {
      await Promise.resolve(onSubmit(dataToSubmit));
      if (!isEditing && user?.id) clearPetFormDraft(user.id);
      if (closeOnSubmit) onClose();
    } catch {
      // ошибку показывает родитель (onSubmit)
    } finally {
      setSubmitting(false);
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

  const pageTitle = getPageTitle();

  useEffect(() => {
    if (renderStepHeaderExternally && variant === 'page' && onStepChange) {
      onStepChange({
        step,
        totalSteps,
        stepTitle: currentStepTitle,
        stepDesc: currentStepDesc,
        pageTitle,
        onBack: () => (step > 1 ? setStep(step - 1) : onClose()),
      });
    }
  }, [step, totalSteps, formData.status, formData.animalType, renderStepHeaderExternally, variant, onStepChange, currentStepTitle, currentStepDesc, pageTitle, onClose]);

  const stepBaseProps = { variant, formData, setFormData, errors, t };

  const content = (
    <>
      <PetFormHeader
        variant={variant}
        renderStepHeaderExternally={renderStepHeaderExternally}
        step={step}
        totalSteps={totalSteps}
        isEditing={isEditing}
        formData={formData}
        currentStepTitle={currentStepTitle}
        currentStepDesc={currentStepDesc}
        pageTitle={pageTitle}
        t={t}
        onClose={onClose}
        onBack={() => (step > 1 ? setStep(step - 1) : onClose())}
      />

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
        {variant === 'page' && step >= 1 && currentStepDesc && (
          <p className="text-muted-foreground mb-6">{currentStepDesc}</p>
        )}

        {step === 1 && (
          <PetFormStepPhotos
            {...stepBaseProps}
            isEditing={isEditing}
            initialStatus={initialStatus}
            maxPhotos={maxPhotos}
            aiAnalyzing={aiAnalyzing}
            onPhotoUpload={handlePhotoUpload}
            onAiAnalyze={handleAiAnalyzePhoto}
          />
        )}
        {step === 2 && (
          <PetFormStepTraits
            {...stepBaseProps}
            isMobile={isMobile}
            aiDescriptionBanner={aiDescriptionBanner}
            aiFilledFields={aiFilledFields}
            setAiFilledFields={setAiFilledFields}
            onGoToDescription={() => setStep(3)}
            onToggleColor={toggleColor}
            getAgeLabel={getAgeLabel}
          />
        )}
        {step === 3 && (
          <PetFormStepDescription
            {...stepBaseProps}
            aiFilledFields={aiFilledFields}
            setAiFilledFields={setAiFilledFields}
            onDescriptionChange={() => setAiDescriptionBanner(false)}
          />
        )}
        {step === 4 && <PetFormStepLocation {...stepBaseProps} />}
        {step === 5 && (
          <PetFormStepContacts
            {...stepBaseProps}
            isEditing={isEditing}
          />
        )}

        <PetFormNavigation
          variant={variant}
          step={step}
          totalSteps={totalSteps}
          isEditing={isEditing}
          formData={formData}
          t={t}
          canProceed={canProceed()}
          submitting={submitting}
          onBack={() => setStep(step - 1)}
          onNext={() => { setTried(false); setStep(step + 1); }}
          onTryProceed={() => setTried(true)}
        />
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
