import { useState, useEffect } from 'react';
import { X, Search, ChevronRight, ChevronLeft, ImagePlus } from 'lucide-react';
import { AnimalType, PetStatus, PetColor, Gender, Pet } from '../types/pet';
import { useScrollLock } from './ui/use-scroll-lock';
import { colorLabels, genderLabels } from '../utils/pet-helpers';
import { BreedCombobox } from './breed-combobox';
import { CAT_BREEDS, DOG_BREEDS } from '../utils/breeds';
import { useAuth } from '../context/AuthContext';
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
  };
}

const statusOptions: { value: PetStatus; label: string; icon: string; color: string; activeColor: string }[] = [
  { value: 'searching', label: 'Ищут', icon: '🔍', color: 'text-gray-600', activeColor: 'bg-red-50 text-red-700 border-red-200 shadow-sm' },
  { value: 'found', label: 'Найден', icon: '📍', color: 'text-gray-600', activeColor: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' },
];

const animalTypeOptions: { value: AnimalType; label: string; icon: string }[] = [
  { value: 'cat', label: 'Кот', icon: '🐱' },
  { value: 'dog', label: 'Собака', icon: '🐕' },
  { value: 'other', label: 'Другое', icon: '🦔' },
];

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'unknown', label: genderLabels.unknown },
  { value: 'male', label: genderLabels.male },
  { value: 'female', label: genderLabels.female },
];

export function PetForm({ onClose, onSubmit, initialData, isEditing = false }: PetFormProps) {
  const { user } = useAuth();
  useScrollLock(true);

  const [formData, setFormData] = useState<PetFormData>(() =>
    initialData ? formDataFromPet(initialData) : defaultFormData
  );

  const [step, setStep] = useState(1);
  const [tried, setTried] = useState(false);
  const [maxPhotos, setMaxPhotos] = useState(10);

  useEffect(() => {
    setStep(1);
    setTried(false);
  }, [isEditing, initialData?.id]);

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
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Не удалось загрузить изображение')); };
      img.src = URL.createObjectURL(file);
    });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error('Загружайте только изображения (JPEG, PNG, WebP)');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимум 15 МБ');
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
    if (!formData.status) errs.status = 'Выберите статус';
    if (!formData.animalType) errs.animalType = 'Выберите тип животного';
    if (formData.colors.length === 0) errs.colors = 'Выберите хотя бы один окрас';
    return errs;
  };

  const step2Errors = () => {
    const errs: Record<string, string> = {};
    if (!formData.description?.trim()) errs.description = 'Введите описание';
    else if (formData.description.length > MAX_DESCRIPTION) errs.description = `Макс. ${MAX_DESCRIPTION} символов`;
    if (!formData.city?.trim()) errs.city = 'Укажите адрес';
    if (formData.photos.length === 0) errs.photos = 'Загрузите хотя бы одно фото';
    return errs;
  };

  const canProceed = () => {
    if (step === 1) {
      if (isEditing && initialData) return true;
      return Object.keys(step1Errors()).length === 0;
    }
    if (step === 2) {
      return Object.keys(step2Errors()).length === 0;
    }
    return true;
  };

  const errors = tried ? (step === 1 ? step1Errors() : step2Errors()) : {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (step < 2) {
      if (canProceed()) { setTried(false); setStep(step + 1); }
      return;
    }
    if (!canProceed()) return;
    onSubmit(formData);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Редактирование' : 'Новое объявление'}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex gap-1">
                <div className={`h-1 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`h-1 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>
              <span className="text-xs text-gray-400">Шаг {step} из 2</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">Статус *</span>
                <div className="flex gap-1.5">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: opt.value })}
                      className={`px-3 py-1 text-sm rounded-lg border transition-all ${
                        formData.status === opt.value
                          ? opt.activeColor
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.status && <p className="text-xs text-red-500 ml-2">{errors.status}</p>}
              </div>

              {/* Animal type + Breed */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="shrink-0">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Тип животного *</span>
                  <div className="flex bg-gray-100 rounded-lg p-0.5 mt-1.5 w-fit">
                    {animalTypeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, animalType: opt.value, breed: '' })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          formData.animalType === opt.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span className="text-base leading-none">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {errors.animalType && <p className="text-xs text-red-500 mt-1">{errors.animalType}</p>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Порода</span>
                  <div className="mt-1.5">
                    {formData.animalType === 'other' ? (
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value.slice(0, 80) })}
                        placeholder="Введите породу (необязательно)"
                        maxLength={80}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Окрас *</span>
                <div className={`flex flex-wrap gap-1.5 mt-1.5 ${errors.colors ? 'ring-2 ring-red-300 bg-red-50/50 p-2 rounded-xl' : ''}`}>
                  {(Object.keys(colorLabels) as PetColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-2.5 py-1 text-sm rounded-lg border transition-all ${
                        formData.colors.includes(color)
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {colorLabels[color]}
                    </button>
                  ))}
                </div>
                {errors.colors && <p className="text-xs text-red-500 mt-1">{errors.colors}</p>}
              </div>

              {/* Gender + Age */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="shrink-0">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Пол</span>
                  <div className="flex bg-gray-100 rounded-lg p-0.5 mt-1.5 w-fit">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: opt.value })}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          formData.gender === opt.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Возраст</span>
                  <input
                    type="text"
                    value={formData.approximateAge}
                    onChange={(e) => setFormData({ ...formData, approximateAge: e.target.value })}
                    placeholder="Напр.: 2 года"
                    className="block mt-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Описание *</span>
                  <span className={`text-xs ${formData.description.length > MAX_DESCRIPTION ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
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
                  placeholder="Опишите питомца, особые приметы, обстоятельства..."
                  rows={4}
                  maxLength={MAX_DESCRIPTION}
                  className={`w-full mt-2 px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.description ? 'border-red-300' : 'border-gray-200'}`}
                  required
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Фото *</span>
                  <span className={`text-xs ${formData.photos.length === 0 && errors.photos ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
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
                        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-blue-500">
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
                      <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${errors.photos ? 'border-red-300 bg-red-50/50 text-red-400' : 'border-gray-200 hover:border-blue-400 text-gray-400 hover:text-blue-500'}`}>
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
                    <p className="text-xs text-gray-400 text-center py-1">Загружено максимальное количество фото</p>
                  )}
                </div>
                {errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}
              </div>

              {/* Address */}
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Адрес *</span>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Минск, ул. Примерная, 1"
                    className={`flex-1 px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.city ? 'border-red-300' : 'border-gray-200'}`}
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
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0"
                    title="Показать на карте"
                  >
                    <Search className="w-4 h-4" />
                    На карте
                  </button>
                </div>
                {errors.city
                  ? <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                  : <p className="text-xs text-gray-400 mt-1">Введите адрес и нажмите «На карте» или выберите точку на карте</p>
                }
              </div>

              {/* Map */}
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Точка на карте *</span>
                <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
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

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTried(true);
                  if (canProceed()) { setTried(false); setStep(2); }
                }}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Далее
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                {isEditing ? 'Сохранить' : 'Создать объявление'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
