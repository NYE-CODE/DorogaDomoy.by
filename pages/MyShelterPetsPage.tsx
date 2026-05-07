import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Building2, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { PageLoader } from '../components/ui/page-loader';
import { useI18n } from '../context/I18nContext';
import { shelterPetsApi, settingsApi, sheltersApi, type ShelterPetInput, type ShelterResponse } from '../api/client';
import type { Pet } from '../types/pet';
import { BackQuickMenu } from '../components/navigation/BackQuickMenu';

type FormState = {
  id?: string;
  photos: string[];
  animalType: 'cat' | 'dog' | 'other';
  gender: 'male' | 'female' | 'unknown';
  adoptionStatus: 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';
  approximateAge: string;
  description: string;
  breed: string;
  colorsCsv: string;
  isPublished: boolean;
};

const emptyForm = (): FormState => ({
  photos: [],
  animalType: 'cat',
  gender: 'unknown',
  adoptionStatus: 'available',
  approximateAge: '',
  description: '',
  breed: '',
  colorsCsv: '',
  isPublished: true,
});

/** Как в объявлении (`PetForm`): сжатие JPEG до разумного размера перед отправкой на сервер */
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

export default function MyShelterPetsPage() {
  const { t } = useI18n();
  const pf = t.petForm;
  const { shelterId } = useParams<{ shelterId: string }>();
  const [myShelters, setMyShelters] = useState<ShelterResponse[]>([]);
  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelterId ?? '');
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingShelters, setLoadingShelters] = useState(true);
  const [loadingPets, setLoadingPets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maxPhotos, setMaxPhotos] = useState(10);
  const [form, setForm] = useState<FormState>(() => emptyForm());

  const selectedShelter = useMemo(
    () => myShelters.find((s) => s.id === selectedShelterId) ?? null,
    [myShelters, selectedShelterId],
  );

  const loadShelters = () => {
    setLoadingShelters(true);
    sheltersApi
      .mine()
      .then((rows) => {
        setMyShelters(rows);
        if (!selectedShelterId && rows.length > 0) {
          setSelectedShelterId(rows[0].id);
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : t.common.error))
      .finally(() => setLoadingShelters(false));
  };

  const loadPets = (sid: string) => {
    if (!sid) return;
    setLoadingPets(true);
    sheltersApi
      .listPets(sid, { is_archived: false, limit: 200 })
      .then(setPets)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.common.error))
      .finally(() => setLoadingPets(false));
  };

  useEffect(() => {
    loadShelters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (selectedShelterId) {
      loadPets(selectedShelterId);
    } else {
      setPets([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShelterId]);

  const startCreate = () => setForm(emptyForm());

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          if (prev.photos.length >= maxPhotos) {
            toast.warning(`${pf.maxPhotos} ${maxPhotos}`);
            return prev;
          }
          return { ...prev, photos: [...prev.photos, compressed] };
        });
      } catch {
        toast.error(pf.uploadFailed);
      }
    }
    e.target.value = '';
  };

  const removePhotoAt = (index: number) => {
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const startEdit = (pet: Pet) => {
    setForm({
      id: pet.id,
      photos: [...(pet.photos ?? [])],
      animalType: pet.animalType,
      gender: pet.gender,
      adoptionStatus: pet.adoptionStatus ?? 'available',
      approximateAge: pet.approximateAge ?? '',
      description: pet.description,
      breed: pet.breed ?? '',
      colorsCsv: (pet.colors ?? []).join(', '),
      isPublished: pet.isPublished ?? true,
    });
  };

  const onSave = async () => {
    if (!selectedShelter) {
      toast.error('Выберите приют');
      return;
    }
    const photos = form.photos;
    if (photos.length === 0) {
      toast.error(pf.uploadPhoto);
      return;
    }
    if (!form.description.trim()) {
      toast.error('Добавьте описание');
      return;
    }
    const colors = form.colorsCsv
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (form.id) {
        await shelterPetsApi.update(form.id, {
          photos,
          animalType: form.animalType,
          gender: form.gender,
          adoptionStatus: form.adoptionStatus,
          approximateAge: form.approximateAge || undefined,
          description: form.description.trim(),
          breed: form.breed || undefined,
          colors,
          city: selectedShelter.city,
          location: { lat: selectedShelter.location_lat, lng: selectedShelter.location_lng },
          isPublished: form.isPublished,
        });
        toast.success('Питомец обновлён');
      } else {
        const payload: ShelterPetInput = {
          photos,
          animalType: form.animalType,
          gender: form.gender,
          approximateAge: form.approximateAge || undefined,
          description: form.description.trim(),
          breed: form.breed || undefined,
          colors,
          city: selectedShelter.city,
          location: { lat: selectedShelter.location_lat, lng: selectedShelter.location_lng },
          contacts: {},
          adoptionStatus: form.adoptionStatus,
          isPublished: form.isPublished,
        };
        await sheltersApi.createPet(selectedShelter.id, payload);
        toast.success('Питомец добавлен');
      }
      setForm(emptyForm());
      loadPets(selectedShelter.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async (pet: Pet) => {
    if (!confirm(`Архивировать питомца "${pet.description.slice(0, 40)}..."?`)) return;
    try {
      await shelterPetsApi.archive(pet.id, 'archived from shelter cabinet');
      toast.success('Питомец отправлен в архив');
      if (selectedShelterId) loadPets(selectedShelterId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    }
  };

  if (loadingShelters) {
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector />
      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <BackQuickMenu />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <Building2 className="size-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Питомцы приюта</h1>
            <select
              className="ml-auto rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={selectedShelterId}
              onChange={(e) => {
                setSelectedShelterId(e.target.value);
                setForm(emptyForm());
              }}
            >
              {myShelters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={startCreate}>
              <Plus className="mr-1 size-4" />
              Новый питомец
            </Button>
          </div>

          <div className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">{form.id ? 'Редактирование питомца' : 'Добавление питомца'}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold uppercase text-muted-foreground">
                  {pf.photosLabel}
                </label>
                <div className="mb-2 text-right text-sm text-muted-foreground">
                  {form.photos.length} {pf.of} {maxPhotos}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {form.photos.map((photo, index) => (
                    <div key={index} className="group relative aspect-square overflow-hidden rounded-lg">
                      <img src={photo} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhotoAt(index)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-6 text-white" />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < maxPhotos && form.photos.length > 0 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-[#FF9800] hover:bg-muted/50 dark:border-gray-600">
                      <Upload className="mb-2 size-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => void handlePhotoUpload(e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {form.photos.length === 0 && (
                  <label
                    className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-[#FF9800] hover:bg-muted/50 dark:border-gray-600`}
                  >
                    <Upload size={48} className="mb-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{pf.uploadPhotoHint}</span>
                    <span className="mt-2 text-sm text-muted-foreground">{pf.uploadPhotoDrag}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => void handlePhotoUpload(e)}
                      className="hidden"
                    />
                  </label>
                )}
                {form.photos.length >= maxPhotos && (
                  <p className="py-1 text-center text-sm text-muted-foreground">
                    {pf.maxPhotos} {maxPhotos}
                  </p>
                )}
              </div>
              <select
                value={form.animalType}
                onChange={(e) => setForm((p) => ({ ...p, animalType: e.target.value as FormState['animalType'] }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="cat">Кошка</option>
                <option value="dog">Собака</option>
                <option value="other">Другое</option>
              </select>
              <select
                value={form.gender}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as FormState['gender'] }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="unknown">Пол неизвестен</option>
                <option value="male">Самец</option>
                <option value="female">Самка</option>
              </select>
              <select
                value={form.adoptionStatus}
                onChange={(e) => setForm((p) => ({ ...p, adoptionStatus: e.target.value as FormState['adoptionStatus'] }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="available">Доступен</option>
                <option value="reserved">Резерв</option>
                <option value="adopted">Пристроен</option>
                <option value="on_treatment">На лечении</option>
                <option value="not_for_adoption">Не пристраивается</option>
              </select>
              <input
                value={form.breed}
                onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Порода"
              />
              <input
                value={form.approximateAge}
                onChange={(e) => setForm((p) => ({ ...p, approximateAge: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Возраст (примерно)"
              />
              <input
                value={form.colorsCsv}
                onChange={(e) => setForm((p) => ({ ...p, colorsCsv: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                placeholder="Окрасы через запятую: black, white"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                placeholder="Описание питомца"
              />
              <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                />
                Опубликован
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void onSave()} disabled={saving || !selectedShelterId}>
                <Save className="mr-1 size-4" />
                {saving ? 'Сохранение...' : form.id ? 'Сохранить изменения' : 'Добавить питомца'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setForm(emptyForm())}>
                Сбросить
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Список питомцев ({pets.length})</h2>
            {loadingPets ? (
              <PageLoader />
            ) : pets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет питомцев у выбранного приюта.</p>
            ) : (
              <ul className="space-y-3">
                {pets.map((pet) => (
                  <li key={pet.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {(pet.name?.trim() || pet.breed || pet.animalType)} · Ищет дом
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pet.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pet.adoptionStatus || 'available'} · {pet.isPublished ? 'published' : 'hidden'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(pet)}>
                        <Pencil className="mr-1 size-4" />
                        Ред.
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => void onArchive(pet)}>
                        <Trash2 className="mr-1 size-4" />
                        Архив
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
