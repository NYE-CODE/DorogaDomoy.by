import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
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
  /** ����� 1�5; 0 = �� ������� */
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

const TRAIT_SCALE_HINTS: Record<string, [string, string]> = {
  energyLevel: ['���������', '����� ��������'],
  friendlinessLevel: ['����������', '����� ����������'],
  trainingLevel: ['��� �������', '������� ��������'],
  independenceLevel: ['����� ��������', '����� ����'],
};

function TraitScale({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  field: keyof typeof TRAIT_SCALE_HINTS;
  value: number;
  onChange: (v: number) => void;
}) {
  const [low, high] = TRAIT_SCALE_HINTS[field];
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5 sm:col-span-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {value > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ��������
          </button>
        )}
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`flex-1 rounded-md border py-1.5 text-sm font-semibold transition-colors ${
              value >= n && value > 0
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function CompatibilitySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Compatibility;
  onChange: (v: Compatibility) => void;
}) {
  const options: { v: Compatibility; t: string }[] = [
    { v: 'yes', t: '��' },
    { v: 'no', t: '���' },
    { v: 'unknown', t: '�� ����' },
  ];
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
      <div className="flex gap-1.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            aria-pressed={value === o.v}
            className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition-colors ${
              value === o.v
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
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
    if (step === 1) return '��� 1 �� 3: ����';
    if (step === 2) return '��� 2 �� 3: � �������';
    return '��� 3 �� 3: ����������';
  }, [step]);

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
      <div className="flex min-h-screen flex-col bg-background">
        <Header showCitySelector />
        <main className="flex-1 py-10">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  const totalSteps = 3;
  const pageTitle = isEdit ? '�������������� ������� ������' : '���������� ������� ������';

  return (
    <div className="landing-theme min-h-screen bg-muted/30 dark:bg-background flex flex-col">
      <Header showCitySelector />
      <section className="bg-white dark:bg-card border-b border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-[736px] mx-auto py-4">
          <div className="flex items-center gap-4 mb-4">
            <BackQuickMenu />
            <div className="flex-1 min-w-0">
              <h1 className="typo-h1 truncate">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t.petForm.step} {step} {t.petForm.of} {totalSteps}: {stepTitle.replace(/^��� \d+ �� \d+: /, '')}
              </p>
            </div>
            <Link
              to={`/my-shelters/${shelterId}/pets`}
              className="text-muted-foreground hover:text-black dark:text-muted-foreground dark:hover:text-foreground whitespace-nowrap transition-colors"
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
        <div className="max-w-[736px] mx-auto bg-white dark:bg-card rounded-lg shadow-sm border border-border p-8">
          <div>

            <div className="mt-5">
              {step === 1 ? (
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">{form.photos.length} {pf.of} {maxPhotos}</div>
                  <p className="mb-3 text-xs text-muted-foreground">{pf.photoFileSizeHint}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {form.photos.map((photo, idx) => (
                      <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg">
                        <img src={photo} alt="" className="size-full object-cover" />
                        <button type="button" onClick={() => setForm((p) => ({ ...p, photos: p.photos.filter((_, i) => i !== idx) }))} className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                          <X className="size-6 text-white" />
                        </button>
                      </div>
                    ))}
                    {form.photos.length < maxPhotos && (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:bg-muted/50">
                        <Upload className="mb-2 size-6 text-muted-foreground" />
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void handlePhotoUpload(e)} />
                      </label>
                    )}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={form.nickname} onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="������" />
                  <select value={form.animalType} onChange={(e) => setForm((p) => ({ ...p, animalType: e.target.value as FormState['animalType'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="cat">�����</option>
                    <option value="dog">������</option>
                    <option value="other">������</option>
                  </select>
                  <input value={form.breed} onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="������" />
                  <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as FormState['gender'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="unknown">��� ����������</option>
                    <option value="male">�����</option>
                    <option value="female">�����</option>
                  </select>
                  <input value={form.approximateAge} onChange={(e) => setForm((p) => ({ ...p, approximateAge: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="������� (��������)" />
                  <input value={form.colorsCsv} onChange={(e) => setForm((p) => ({ ...p, colorsCsv: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="������ ����� �������" />
                  <select value={form.healthStatus} onChange={(e) => setForm((p) => ({ ...p, healthStatus: e.target.value as FormState['healthStatus'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="disabled">������������</option>
                    <option value="treatment">��������� �������</option>
                    <option value="good">�������</option>
                    <option value="excellent">��������</option>
                  </select>
                  <select value={form.coatType} onChange={(e) => setForm((p) => ({ ...p, coatType: e.target.value as FormState['coatType'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="smooth">������� ������</option>
                    <option value="semi">�����������</option>
                    <option value="fluffy">��������</option>
                  </select>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="�������� �������" />
                  <input value={form.registrationAuthority} onChange={(e) => setForm((p) => ({ ...p, registrationAuthority: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder={t.petForm.registrationAuthorityPlaceholder} maxLength={300} />
                  <input value={form.registrationTokenNumber} onChange={(e) => setForm((p) => ({ ...p, registrationTokenNumber: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder={t.petForm.registrationTokenPlaceholder} maxLength={80} />

                  <div className="sm:col-span-2 mt-2 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-foreground">�������� � �������������</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      �������� ������� �������� ��������� ������� ��� ���� ����� �����. ����� ����������.
                    </p>
                  </div>
                  <TraitScale label="������� ����������" field="energyLevel" value={form.energyLevel} onChange={(v) => setForm((p) => ({ ...p, energyLevel: v }))} />
                  <TraitScale label="������� � �����" field="friendlinessLevel" value={form.friendlinessLevel} onChange={(v) => setForm((p) => ({ ...p, friendlinessLevel: v }))} />
                  <TraitScale label="�������������" field="trainingLevel" value={form.trainingLevel} onChange={(v) => setForm((p) => ({ ...p, trainingLevel: v }))} />
                  <TraitScale label="�����������������" field="independenceLevel" value={form.independenceLevel} onChange={(v) => setForm((p) => ({ ...p, independenceLevel: v }))} />
                  <CompatibilitySelect label="����� � ������" value={form.goodWithKids} onChange={(v) => setForm((p) => ({ ...p, goodWithKids: v }))} />
                  <CompatibilitySelect label="����� � ��������" value={form.goodWithDogs} onChange={(v) => setForm((p) => ({ ...p, goodWithDogs: v }))} />
                  <CompatibilitySelect label="����� � �������" value={form.goodWithCats} onChange={(v) => setForm((p) => ({ ...p, goodWithCats: v }))} />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <select value={form.adoptionStatus} onChange={(e) => setForm((p) => ({ ...p, adoptionStatus: e.target.value as FormState['adoptionStatus'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="available">���� ���</option>
                    <option value="reserved">������������</option>
                    <option value="adopted">���������</option>
                    <option value="on_treatment">�� �������</option>
                    <option value="not_for_adoption">�� ��������������</option>
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
                    �����������
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || saving}>
                �����
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={!canNext()}>
                  �����
                </Button>
              ) : (
                <Button type="button" onClick={() => void onSubmit()} disabled={saving || !canNext()}>
                  {saving ? '����������...' : isEdit ? '��������� ���������' : '�������� �������'}
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
