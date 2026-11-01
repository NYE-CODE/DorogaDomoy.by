import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Cat, Dog, PawPrint, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import '../../landing/styles/theme-scoped.css';
import { Footer } from '@/widgets/layout/Footer';
import { Header } from '@/widgets/layout/Header';
import { Button } from '@/shared/ui/button';
import { PageLoader } from '@/shared/ui/page-loader';
import { RouteProgress } from '@/shared/ui/molecules';
import { BackQuickMenu } from '../../components/navigation/BackQuickMenu';
import { settingsApi, shelterPetsApi, sheltersApi, type ShelterPetInput, type ShelterResponse } from '@/shared/api/client';
import type { Compatibility, Pet } from '@/entities/pet/model/types';
import { useI18n } from '@/app/providers/I18nContext';
import { compressImageFileToDataUrl } from '@/shared/lib/compress-image';
import { formatI18nTemplate } from '@/shared/lib/i18n-template';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfacePage,
  surfacePanel,
  surfaceSelectRow,
  surfaceUploadZone,
} from '@/shared/styles/surface-classes';
import {
  profilePetField,
  profilePetInput,
  profilePetSegmentClass,
  profilePetSegmentTrack,
  profilePetTagClass,
  profilePetTextarea,
} from '../../components/add-edit-pet-page/add-edit-pet-form-styles';

type FormState = {
  photos: string[];
  nickname: string;
  animalType: 'cat' | 'dog' | 'other';
  breed: string;
  gender: 'male' | 'female' | 'unknown';
  approximateAge: string;
  colorsCsv: string;
  healthStatus: 'disabled' | 'treatment' | 'good' | 'excellent';
  coatType: 'smooth' | 'semi' | 'fluffy';
  description: string;
  adoptionStatus: 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';
  isPublished: boolean;
  registrationAuthority: string;
  registrationTokenNumber: string;
  /** Trait scale 1-5; 0 = not set */
  energyLevel: number;
  friendlinessLevel: number;
  trainingLevel: number;
  independenceLevel: number;
  goodWithKids: Compatibility;
  goodWithDogs: Compatibility;
  goodWithCats: Compatibility;
};

const emptyForm = (): FormState => ({
  photos: [],
  nickname: '',
  animalType: 'cat',
  breed: '',
  gender: 'unknown',
  approximateAge: '',
  colorsCsv: '',
  healthStatus: 'good',
  coatType: 'smooth',
  description: '',
  adoptionStatus: 'available',
  isPublished: true,
  registrationAuthority: '',
  registrationTokenNumber: '',
  energyLevel: 0,
  friendlinessLevel: 0,
  trainingLevel: 0,
  independenceLevel: 0,
  goodWithKids: 'unknown',
  goodWithDogs: 'unknown',
  goodWithCats: 'unknown',
});

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(profilePetField, className)}>
      <span className={surfaceFieldLabel}>{label}</span>
      {children}
    </div>
  );
}

function TraitScale({
  label,
  lowHint,
  highHint,
  clearLabel,
  value,
  onChange,
}: {
  label: string;
  lowHint: string;
  highHint: string;
  clearLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:col-span-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className={cn(surfaceFieldLabel, 'mb-0')}>{label}</span>
        {value > 0 ? (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {clearLabel}
          </button>
        ) : null}
      </div>
      <div className={cn(profilePetSegmentTrack, 'grid-cols-5')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={profilePetSegmentClass(value === n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{lowHint}</span>
        <span>{highHint}</span>
      </div>
    </div>
  );
}

function CompatibilitySelect({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
  unknownLabel,
}: {
  label: string;
  value: Compatibility;
  onChange: (v: Compatibility) => void;
  yesLabel: string;
  noLabel: string;
  unknownLabel: string;
}) {
  const options: { v: Compatibility; t: string }[] = [
    { v: 'yes', t: yesLabel },
    { v: 'no', t: noLabel },
    { v: 'unknown', t: unknownLabel },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className={cn(surfaceFieldLabel, 'mb-3')}>{label}</div>
      <div className={cn(profilePetSegmentTrack, 'grid-cols-3')}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            aria-pressed={value === o.v}
            className={profilePetSegmentClass(value === o.v)}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MyShelterPetFormPage() {
  const { t } = useI18n();
  const pf = t.petForm;
  const sp = t.shelterPet;
  const pt = t.petTraits;
  const msl = t.myShelterPetsList;
  const mf = t.myPets.form;
  const compatYes = mf.yes;
  const compatNo = mf.no;
  const compatUnknown = t.pet.gender.unknown;
  const coatTitle = t.landing.shelters.detailPetsCoatTitle;
  const { shelterId, petId } = useParams<{ shelterId: string; petId?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(petId);
  const [step, setStep] = useState(1);
  const [maxPhotos, setMaxPhotos] = useState(10);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [shelter, setShelter] = useState<ShelterResponse | null>(null);

  useEffect(() => {
    settingsApi
      .get()
      .then((s) => {
        const val = parseInt(String(s.max_photos ?? ''), 10);
        if (Number.isFinite(val) && val > 0 && val <= 50) setMaxPhotos(val);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!shelterId) return;
    setLoading(true);
    Promise.all([sheltersApi.get(shelterId), sheltersApi.listPets(shelterId, { limit: 300 })])
      .then(([shelterRow, pets]) => {
        setShelter(shelterRow);
        if (isEdit) {
          const pet = pets.find((x) => x.id === petId) as Pet | undefined;
          if (!pet) {
            toast.error(t.common.toasts.petNotFound);
            navigate(`/my-shelters/${shelterId}/pets`);
            return;
          }
          setForm({
            photos: pet.photos ?? [],
            nickname: pet.name ?? '',
            animalType: pet.animalType,
            breed: pet.breed ?? '',
            gender: pet.gender,
            approximateAge: pet.approximateAge ?? '',
            colorsCsv: (pet.colors ?? []).join(', '),
            healthStatus: pet.healthStatus ?? 'good',
            coatType: pet.coatType ?? 'smooth',
            description: pet.description,
            adoptionStatus: pet.adoptionStatus ?? 'available',
            isPublished: pet.isPublished ?? true,
            registrationAuthority: pet.registrationAuthority ?? '',
            registrationTokenNumber: pet.registrationTokenNumber ?? '',
            energyLevel: pet.energyLevel ?? 0,
            friendlinessLevel: pet.friendlinessLevel ?? 0,
            trainingLevel: pet.trainingLevel ?? 0,
            independenceLevel: pet.independenceLevel ?? 0,
            goodWithKids: pet.goodWithKids ?? 'unknown',
            goodWithDogs: pet.goodWithDogs ?? 'unknown',
            goodWithCats: pet.goodWithCats ?? 'unknown',
          });
        }
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : t.common.error);
      })
      .finally(() => setLoading(false));
  }, [isEdit, navigate, petId, shelterId, t.common.error]);

  const stepTitle = useMemo(() => {
    if (step === 1) return sp.stepPhotos;
    if (step === 2) return sp.stepAbout;
    return sp.stepPublication;
  }, [step, sp.stepPhotos, sp.stepAbout, sp.stepPublication]);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(pf.onlyImages);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(pf.maxSize);
        continue;
      }
      try {
        const compressed = await compressImageFileToDataUrl(file);
        setForm((prev) => {
          if (prev.photos.length >= maxPhotos) return prev;
          return { ...prev, photos: [...prev.photos, compressed] };
        });
      } catch {
        toast.error(pf.uploadFailed);
      }
    }
    e.target.value = '';
  };

  const canNext = () => {
    if (step === 1) return form.photos.length > 0;
    if (step === 2) {
      return Boolean(
        form.nickname.trim() &&
          form.approximateAge.trim() &&
          form.colorsCsv.trim() &&
          form.description.trim(),
      );
    }
    return true;
  };

  const onSubmit = async () => {
    if (!shelterId || !shelter) return;
    const colors = form.colorsCsv.split(',').map((x) => x.trim()).filter(Boolean);
    const lvl = (v: number) => (v >= 1 && v <= 5 ? v : undefined);
    const traits = {
      energyLevel: lvl(form.energyLevel),
      friendlinessLevel: lvl(form.friendlinessLevel),
      trainingLevel: lvl(form.trainingLevel),
      independenceLevel: lvl(form.independenceLevel),
      goodWithKids: form.goodWithKids,
      goodWithDogs: form.goodWithDogs,
      goodWithCats: form.goodWithCats,
    };
    setSaving(true);
    try {
      if (isEdit && petId) {
        await shelterPetsApi.update(petId, {
          photos: form.photos,
          nickname: form.nickname || undefined,
          animalType: form.animalType,
          breed: form.breed || undefined,
          gender: form.gender,
          approximateAge: form.approximateAge || undefined,
          colors,
          healthStatus: form.healthStatus,
          coatType: form.coatType,
          description: form.description.trim(),
          adoptionStatus: form.adoptionStatus,
          isPublished: form.isPublished,
          city: shelter.city,
          location: { lat: shelter.location_lat, lng: shelter.location_lng },
          registrationAuthority: form.registrationAuthority,
          registrationTokenNumber: form.registrationTokenNumber,
          ...traits,
        });
      } else {
        const payload: ShelterPetInput = {
          photos: form.photos,
          nickname: form.nickname || undefined,
          animalType: form.animalType,
          breed: form.breed || undefined,
          gender: form.gender,
          approximateAge: form.approximateAge || undefined,
          colors,
          healthStatus: form.healthStatus,
          coatType: form.coatType,
          description: form.description.trim(),
          adoptionStatus: form.adoptionStatus,
          isPublished: form.isPublished,
          city: shelter.city,
          location: { lat: shelter.location_lat, lng: shelter.location_lng },
          contacts: {},
          registrationAuthority: form.registrationAuthority,
          registrationTokenNumber: form.registrationTokenNumber,
          ...traits,
        };
        await sheltersApi.createPet(shelterId, payload);
      }
      toast.success(isEdit ? t.common.toasts.shelterPetUpdated : t.common.toasts.shelterPetAdded);
      navigate(`/my-shelters/${shelterId}/pets`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
        <Header showCitySelector />
        <main className="flex-1 py-10">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  const totalSteps = 3;
  const pageTitle = isEdit ? sp.formEditTitle : sp.formAddTitle;

  const animalOptions: {
    value: FormState['animalType'];
    label: string;
    icon: ReactNode;
  }[] = [
    { value: 'cat', label: t.pet.animalType.cat, icon: <Cat className="size-4" aria-hidden /> },
    { value: 'dog', label: t.pet.animalType.dog, icon: <Dog className="size-4" aria-hidden /> },
    { value: 'other', label: t.pet.animalType.other, icon: <PawPrint className="size-4" aria-hidden /> },
  ];

  const genderOptions: { value: FormState['gender']; label: string }[] = [
    { value: 'unknown', label: t.pet.gender.unknown },
    { value: 'male', label: t.pet.gender.male },
    { value: 'female', label: t.pet.gender.female },
  ];

  const healthOptions: { value: FormState['healthStatus']; label: string }[] = [
    { value: 'disabled', label: sp.healthDisabled },
    { value: 'treatment', label: sp.healthTreatment },
    { value: 'good', label: sp.healthGood },
    { value: 'excellent', label: sp.healthExcellent },
  ];

  const coatOptions: { value: FormState['coatType']; label: string }[] = [
    { value: 'smooth', label: sp.coatSmooth },
    { value: 'semi', label: sp.coatSemi },
    { value: 'fluffy', label: sp.coatFluffy },
  ];

  const adoptionOptions: { value: FormState['adoptionStatus']; label: string }[] = [
    { value: 'available', label: msl.statusAvailable },
    { value: 'reserved', label: msl.statusReserved },
    { value: 'adopted', label: msl.statusAdopted },
    { value: 'on_treatment', label: msl.statusTreatment },
    { value: 'not_for_adoption', label: msl.statusNotForAdoption },
  ];

  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header showCitySelector />
      <section className="border-b border-border/80 bg-card/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[736px] py-4">
          <div className="mb-4 flex items-center gap-4">
            <BackQuickMenu />
            <div className="min-w-0 flex-1">
              <h1 className="font-display typo-h1 truncate">{pageTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.petForm.step} {step} {t.petForm.of} {totalSteps}: {stepTitle}
              </p>
            </div>
            <Link
              to={`/my-shelters/${shelterId}/pets`}
              className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.petForm.close}
            </Link>
          </div>
          <RouteProgress
            totalSteps={totalSteps}
            currentStep={step}
            label={`${t.petForm.step} ${step} ${t.petForm.of} ${totalSteps}`}
            className="max-w-sm"
          />
        </div>
      </section>

      <main className="flex-1 px-4 py-8">
        <div className={cn(surfacePanel, 'mx-auto max-w-[736px] p-5 sm:p-8')}>
          <div className="space-y-6">
            {step === 1 ? (
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className={cn(surfaceFieldLabel, 'mb-0')}>{sp.stepPhotos}</span>
                  <span className="text-xs text-muted-foreground">
                    {form.photos.length} {pf.of} {maxPhotos}
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">{pf.photoFileSizeHint}</p>
                <div className="grid grid-cols-3 gap-3">
                  {form.photos.map((photo, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-2xl border border-border">
                      <img
                        src={photo}
                        alt={formatI18nTemplate(pf.photoAltNumber, { n: idx + 1 }, 'Photo')}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, photos: p.photos.filter((_, i) => i !== idx) }))
                        }
                        className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={t.common.close}
                      >
                        <X className="size-6 text-white" />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < maxPhotos ? (
                    <label className={cn(surfaceUploadZone, 'aspect-square cursor-pointer gap-2 p-3')}>
                      <Upload className="size-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => void handlePhotoUpload(e)}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={sp.nicknamePlaceholder}>
                  <input
                    value={form.nickname}
                    onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
                    className={profilePetInput}
                    placeholder={sp.nicknamePlaceholder}
                  />
                </Field>

                <Field label={pf.whoIsThis}>
                  <div className={cn(profilePetSegmentTrack, 'grid-cols-3')}>
                    {animalOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, animalType: opt.value }))}
                        className={profilePetSegmentClass(form.animalType === opt.value)}
                      >
                        {opt.icon}
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={sp.breedPlaceholder}>
                  <input
                    value={form.breed}
                    onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                    className={profilePetInput}
                    placeholder={sp.breedPlaceholder}
                  />
                </Field>

                <Field label={pf.genderLabel}>
                  <div className={cn(profilePetSegmentTrack, 'grid-cols-3')}>
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, gender: opt.value }))}
                        className={profilePetSegmentClass(form.gender === opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={pf.ageLabel}>
                  <input
                    value={form.approximateAge}
                    onChange={(e) => setForm((p) => ({ ...p, approximateAge: e.target.value }))}
                    className={profilePetInput}
                    placeholder={sp.agePlaceholder}
                  />
                </Field>

                <Field label={sp.colorsPlaceholder}>
                  <input
                    value={form.colorsCsv}
                    onChange={(e) => setForm((p) => ({ ...p, colorsCsv: e.target.value }))}
                    className={profilePetInput}
                    placeholder={sp.colorsPlaceholder}
                  />
                </Field>

                <Field label={sp.healthLabel} className="sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {healthOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, healthStatus: opt.value }))}
                        className={cn(profilePetTagClass(form.healthStatus === opt.value), 'flex-1 sm:flex-none')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={coatTitle} className="sm:col-span-2">
                  <div className={cn(profilePetSegmentTrack, 'grid-cols-3')}>
                    {coatOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, coatType: opt.value }))}
                        className={profilePetSegmentClass(form.coatType === opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={sp.descriptionPlaceholder} className="sm:col-span-2">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className={profilePetTextarea}
                    placeholder={sp.descriptionPlaceholder}
                  />
                </Field>

                <Field label={pf.registrationAuthorityLabel} className="sm:col-span-2">
                  <input
                    value={form.registrationAuthority}
                    onChange={(e) => setForm((p) => ({ ...p, registrationAuthority: e.target.value }))}
                    className={profilePetInput}
                    placeholder={pf.registrationAuthorityPlaceholder}
                    maxLength={300}
                  />
                </Field>

                <Field label={pf.registrationTokenLabel} className="sm:col-span-2">
                  <input
                    value={form.registrationTokenNumber}
                    onChange={(e) => setForm((p) => ({ ...p, registrationTokenNumber: e.target.value }))}
                    className={profilePetInput}
                    placeholder={pf.registrationTokenPlaceholder}
                    maxLength={80}
                  />
                </Field>

                <div className="sm:col-span-2 mt-1 border-t border-border pt-5">
                  <h3 className="font-display text-sm font-semibold text-foreground">{sp.traitsSectionTitle}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sp.traitsSectionHint}</p>
                </div>

                <TraitScale
                  label={pt.energyLevel.label}
                  lowHint={pt.energyLevel.levels[0]}
                  highHint={pt.energyLevel.levels[4]}
                  clearLabel={sp.clearTrait}
                  value={form.energyLevel}
                  onChange={(v) => setForm((p) => ({ ...p, energyLevel: v }))}
                />
                <TraitScale
                  label={pt.friendlinessLevel.label}
                  lowHint={pt.friendlinessLevel.levels[0]}
                  highHint={pt.friendlinessLevel.levels[4]}
                  clearLabel={sp.clearTrait}
                  value={form.friendlinessLevel}
                  onChange={(v) => setForm((p) => ({ ...p, friendlinessLevel: v }))}
                />
                <TraitScale
                  label={pt.trainingLevel.label}
                  lowHint={pt.trainingLevel.levels[0]}
                  highHint={pt.trainingLevel.levels[4]}
                  clearLabel={sp.clearTrait}
                  value={form.trainingLevel}
                  onChange={(v) => setForm((p) => ({ ...p, trainingLevel: v }))}
                />
                <TraitScale
                  label={pt.independenceLevel.label}
                  lowHint={pt.independenceLevel.levels[0]}
                  highHint={pt.independenceLevel.levels[4]}
                  clearLabel={sp.clearTrait}
                  value={form.independenceLevel}
                  onChange={(v) => setForm((p) => ({ ...p, independenceLevel: v }))}
                />
                <CompatibilitySelect
                  label={pt.compatYesKids}
                  yesLabel={compatYes}
                  noLabel={compatNo}
                  unknownLabel={compatUnknown}
                  value={form.goodWithKids}
                  onChange={(v) => setForm((p) => ({ ...p, goodWithKids: v }))}
                />
                <CompatibilitySelect
                  label={pt.compatYesDogs}
                  yesLabel={compatYes}
                  noLabel={compatNo}
                  unknownLabel={compatUnknown}
                  value={form.goodWithDogs}
                  onChange={(v) => setForm((p) => ({ ...p, goodWithDogs: v }))}
                />
                <CompatibilitySelect
                  label={pt.compatYesCats}
                  yesLabel={compatYes}
                  noLabel={compatNo}
                  unknownLabel={compatUnknown}
                  value={form.goodWithCats}
                  onChange={(v) => setForm((p) => ({ ...p, goodWithCats: v }))}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <Field label={msl.colStatus}>
                  <div className="flex flex-wrap gap-2">
                    {adoptionOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, adoptionStatus: opt.value }))}
                        className={cn(profilePetTagClass(form.adoptionStatus === opt.value), 'flex-1 sm:flex-none')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <label className={cn(surfaceSelectRow, 'select-none')}>
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                    className="size-4 rounded border-border text-primary focus-visible:ring-ring"
                  />
                  <span className="text-sm font-medium text-foreground">{sp.publishCheckbox}</span>
                </label>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className={cn(surfaceCtaOutline, 'w-full sm:w-auto sm:min-w-[8rem]')}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || saving}
              >
                {t.common.back}
              </Button>
              {step < 3 ? (
                <Button
                  type="button"
                  className={cn(surfaceCtaPrimary, 'w-full sm:w-auto sm:min-w-[8rem]')}
                  onClick={() => setStep((s) => Math.min(3, s + 1))}
                  disabled={!canNext()}
                >
                  {t.common.next}
                </Button>
              ) : (
                <Button
                  type="button"
                  className={cn(surfaceCtaPrimary, 'w-full sm:w-auto sm:min-w-[10rem]')}
                  onClick={() => void onSubmit()}
                  disabled={saving || !canNext()}
                >
                  {saving ? t.common.submitting : isEdit ? sp.savePet : sp.addPetButton}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
