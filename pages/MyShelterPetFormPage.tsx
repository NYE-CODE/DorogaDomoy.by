import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { PageLoader } from '../components/ui/page-loader';
import { BackQuickMenu } from '../components/navigation/BackQuickMenu';
import { settingsApi, shelterPetsApi, sheltersApi, type ShelterPetInput, type ShelterResponse } from '../api/client';
import type { Pet } from '../types/pet';
import { useI18n } from '../context/I18nContext';

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
});

function compressImage(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
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
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('decode'));
    };
    img.src = URL.createObjectURL(file);
  });
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
            toast.error('Питомец не найден');
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
          });
        }
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : t.common.error);
      })
      .finally(() => setLoading(false));
  }, [isEdit, navigate, petId, shelterId, t.common.error]);

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Шаг 1 из 3: Фото';
    if (step === 2) return 'Шаг 2 из 3: О питомце';
    return 'Шаг 3 из 3: Публикация';
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
        const compressed = await compressImage(file);
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
        };
        await sheltersApi.createPet(shelterId, payload);
      }
      toast.success(isEdit ? 'Питомец обновлён' : 'Питомец добавлен');
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
        <Header showCitySelector showHomeModeToggle={false} />
        <main className="flex-1 py-10">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  const totalSteps = 3;
  const pageTitle = isEdit ? 'Редактирование питомца приюта' : 'Добавление питомца приюта';

  return (
    <div className="landing-theme min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      <Header showCitySelector showHomeModeToggle={false} />
      <section className="bg-white dark:bg-card border-b border-gray-200 dark:border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-[736px] mx-auto py-4">
          <div className="flex items-center gap-4 mb-4">
            <BackQuickMenu />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-black dark:text-foreground truncate">{pageTitle}</h1>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                {t.petForm.step} {step} {t.petForm.of} {totalSteps}: {stepTitle.replace(/^Шаг \d+ из \d+: /, '')}
              </p>
            </div>
            <Link
              to={`/my-shelters/${shelterId}/pets`}
              className="text-gray-600 hover:text-black dark:text-muted-foreground dark:hover:text-foreground whitespace-nowrap transition-colors"
            >
              {t.petForm.close}
            </Link>
          </div>
          <div className="w-full bg-gray-200 dark:bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#FDB913] to-[#FF9800] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </section>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-[736px] mx-auto bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border p-8">
          <div>

            <div className="mt-5">
              {step === 1 ? (
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">{form.photos.length} {pf.of} {maxPhotos}</div>
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
                  <input value={form.nickname} onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Кличка" />
                  <select value={form.animalType} onChange={(e) => setForm((p) => ({ ...p, animalType: e.target.value as FormState['animalType'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="cat">Кошка</option>
                    <option value="dog">Собака</option>
                    <option value="other">Другое</option>
                  </select>
                  <input value={form.breed} onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Порода" />
                  <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as FormState['gender'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="unknown">Пол неизвестен</option>
                    <option value="male">Самец</option>
                    <option value="female">Самка</option>
                  </select>
                  <input value={form.approximateAge} onChange={(e) => setForm((p) => ({ ...p, approximateAge: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Возраст (примерно)" />
                  <input value={form.colorsCsv} onChange={(e) => setForm((p) => ({ ...p, colorsCsv: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Окрасы через запятую" />
                  <select value={form.healthStatus} onChange={(e) => setForm((p) => ({ ...p, healthStatus: e.target.value as FormState['healthStatus'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="disabled">Инвалидность</option>
                    <option value="treatment">Требуется лечение</option>
                    <option value="good">Хорошее</option>
                    <option value="excellent">Отличное</option>
                  </select>
                  <select value={form.coatType} onChange={(e) => setForm((p) => ({ ...p, coatType: e.target.value as FormState['coatType'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="smooth">Гладкая шерсть</option>
                    <option value="semi">Полудлинная</option>
                    <option value="fluffy">Пушистая</option>
                  </select>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Описание питомца" />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <select value={form.adoptionStatus} onChange={(e) => setForm((p) => ({ ...p, adoptionStatus: e.target.value as FormState['adoptionStatus'] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="available">Ищет дом</option>
                    <option value="reserved">Забронирован</option>
                    <option value="adopted">Пристроен</option>
                    <option value="on_treatment">На лечении</option>
                    <option value="not_for_adoption">Не пристраивается</option>
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
                    Опубликован
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || saving}>
                Назад
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={!canNext()}>
                  Далее
                </Button>
              ) : (
                <Button type="button" onClick={() => void onSubmit()} disabled={saving || !canNext()}>
                  {saving ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Добавить питомца'}
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
