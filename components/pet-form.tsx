import { useState, useEffect } from 'react';
import { X, Upload, MapPin, Search } from 'lucide-react';
import { AnimalType, PetStatus, PetColor, Gender, Pet } from '../types/pet';
import { animalTypeLabels, statusLabels, colorLabels, genderLabels } from '../utils/pet-helpers';
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

export function PetForm({ onClose, onSubmit, initialData, isEditing = false }: PetFormProps) {
  const { user } = useAuth();
  
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Редактировать объявление' : 'Создать объявление'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Шаг {step} из 2</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PetStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="searching">{statusLabels.searching}</option>
                  <option value="found">{statusLabels.found}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип животного *
                </label>
                <select
                  value={formData.animalType}
                  onChange={(e) => setFormData({ ...formData, animalType: e.target.value as AnimalType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="cat">{animalTypeLabels.cat}</option>
                  <option value="dog">{animalTypeLabels.dog}</option>
                  <option value="other">{animalTypeLabels.other}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Порода
                </label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value.slice(0, 80) })}
                  placeholder="Введите породу (необязательно)"
                  maxLength={80}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.breed.length} / 80
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Окрас *
                </label>
                <div className={`flex flex-wrap gap-2 p-2 rounded-lg ${errors.colors ? 'ring-2 ring-red-400 bg-red-50' : ''}`}>
                  {(Object.keys(colorLabels) as PetColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        formData.colors.includes(color)
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {colorLabels[color]}
                    </button>
                  ))}
                </div>
                {errors.colors && <p className="text-xs text-red-500 mt-1">{errors.colors}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пол
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="unknown">{genderLabels.unknown}</option>
                  <option value="male">{genderLabels.male}</option>
                  <option value="female">{genderLabels.female}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Примерный возраст
                </label>
                <input
                  type="text"
                  value={formData.approximateAge}
                  onChange={(e) => setFormData({ ...formData, approximateAge: e.target.value })}
                  placeholder="Например: 2 года"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Описание *
                  </label>
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
                  rows={5}
                  maxLength={MAX_DESCRIPTION}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
                  required
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Фото *
                  </label>
                  <span className={`text-xs ${formData.photos.length === 0 && errors.photos ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {formData.photos.length} из {maxPhotos}
                  </span>
                </div>
                <div className="space-y-2">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) })}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.photos.length < maxPhotos && (
                    <label className={`w-full px-4 py-8 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600 cursor-pointer ${errors.photos ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}>
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Загрузить фото</span>
                      <span className="text-xs text-gray-400">JPEG, PNG, WebP · до 15 МБ</span>
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
                    <p className="text-xs text-gray-500 text-center py-2">Загружено максимальное количество фото</p>
                  )}
                </div>
                {errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Минск, ул. Примерная, 1"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.city ? 'border-red-400' : 'border-gray-300'}`}
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shrink-0"
                    title="Показать на карте"
                  >
                    <Search className="w-4 h-4" />
                    На карте
                  </button>
                </div>
                {errors.city
                  ? <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                  : <p className="text-xs text-gray-500 mt-1">Введите адрес и нажмите «На карте» или выберите точку на карте</p>
                }
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Точка на карте *
                </label>
                <LocationPicker
                  initialLocation={formData.location}
                  onLocationSelect={(newLocation) => setFormData((prev) => ({ ...prev, location: newLocation }))}
                  onLocationWithAddress={(location, address) => {
                    setFormData((prev) => ({ ...prev, location, city: address }));
                  }}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Далее
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {isEditing ? 'Сохранить изменения' : 'Создать объявление'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}