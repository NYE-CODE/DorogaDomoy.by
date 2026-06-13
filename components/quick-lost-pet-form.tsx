import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Upload, ChevronLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useI18n } from '../context/I18nContext';
import { LocationPicker } from './location-picker';
import { DEFAULT_CITY, findCityByName } from '../utils/cities';
import { compressImageFileToDataUrl } from '../utils/compress-image';
import { Button } from './ui/button';
import type { AnimalType, PetFormData } from './pet-form';
import { cn } from './ui/utils';
import { appPrimaryCtaClass } from '../styles/cta-classes';

const MAX_DESC = 200;

interface QuickLostPetFormProps {
  onSubmit: (data: PetFormData) => Promise<void>;
  onSwitchToFull: () => void;
}

function defaultsFromCity(cityName: string) {
  const trimmed = cityName.trim();
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

export function QuickLostPetForm({ onSubmit, onSwitchToFull }: QuickLostPetFormProps) {
  const { user } = useAuth();
  const { selectedCity } = useCity();
  const { t } = useI18n();
  const q = t.createAd.quick;

  const [step, setStep] = useState<1 | 2>(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [animalType, setAnimalType] = useState<AnimalType>('dog');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_CITY.coordinates[0],
    lng: DEFAULT_CITY.coordinates[1],
  });
  const [submitting, setSubmitting] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const d = defaultsFromCity(selectedCity);
    setCity(d.city);
    setLocation(d.location);
  }, [selectedCity]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(t.petForm.onlyImages);
        continue;
      }
      try {
        const compressed = await compressImageFileToDataUrl(file);
        setPhotos((prev) => (prev.length >= 5 ? prev : [...prev, compressed]));
      } catch {
        toast.error(t.common.toasts.imageProcessError);
      }
    }
    e.target.value = '';
  };

  const goStep2 = () => {
    setTried(true);
    if (photos.length === 0) {
      toast.error(t.petForm.uploadPhoto);
      return;
    }
    setTried(false);
    setStep(2);
  };

  const handlePublish = async () => {
    setTried(true);
    if (!city.trim()) {
      toast.error(t.petForm.specifyAddress);
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const data: PetFormData = {
        photos,
        animalType,
        breed: '',
        colors: [],
        gender: 'unknown',
        approximateAge: '',
        status: 'searching',
        description: description.trim() || q.defaultDescription,
        city: city.trim(),
        location,
        contacts: { ...user.contacts },
        useProfileContacts: true,
        agreeToPrivacy: true,
        rewardMode: 'points',
      };
      await onSubmit(data);
    } catch {
      /* parent toast */
    } finally {
      setSubmitting(false);
    }
  };

  const animalOptions: { value: AnimalType; label: string; icon: string }[] = [
    { value: 'dog', label: t.pet.animalType.dog, icon: '🐕' },
    { value: 'cat', label: t.pet.animalType.cat, icon: '🐱' },
    { value: 'other', label: t.pet.animalType.other, icon: '🦔' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-foreground">{q.bannerTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{q.bannerDesc}</p>
        <button
          type="button"
          onClick={onSwitchToFull}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          {q.switchToFull}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {q.stepLabel.replace('{step}', String(step)).replace('{total}', '2')}
      </p>

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium">{q.animalTypeLabel}</p>
            <div className="flex flex-wrap gap-2">
              {animalOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnimalType(opt.value)}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                    animalType === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{q.photosLabel}</p>
            <label
              className={cn(
                'flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors hover:bg-muted/50',
                tried && photos.length === 0 ? 'border-destructive' : 'border-border',
              )}
            >
              <Upload className="mb-2 size-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t.petForm.uploadPhotoHint}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void handlePhotoUpload(e)} />
            </label>
            {photos.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((src, i) => (
                  <img key={i} src={src} alt="" className="size-16 rounded-lg object-cover" />
                ))}
              </div>
            ) : null}
          </div>

          <Button type="button" className={cn('w-full', appPrimaryCtaClass)} onClick={goStep2}>
            {t.common.next}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            {t.common.back}
          </button>

          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4 text-primary" />
              {q.locationLabel}
            </p>
            <LocationPicker
              city={city}
              location={location}
              onCityChange={setCity}
              onLocationChange={setLocation}
            />
          </div>

          <div>
            <label htmlFor="quick-desc" className="mb-2 block text-sm font-medium">
              {q.descriptionLabel}{' '}
              <span className="font-normal text-muted-foreground">({t.sightings.optional})</span>
            </label>
            <textarea
              id="quick-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              rows={3}
              placeholder={q.descriptionPlaceholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {q.contactsHint}{' '}
            <Link to="/profile" className="text-primary hover:underline">
              {t.profile.contacts}
            </Link>
          </p>

          <Button
            type="button"
            disabled={submitting}
            className={cn('w-full h-12', appPrimaryCtaClass)}
            onClick={() => void handlePublish()}
          >
            {submitting ? t.common.loading : q.publish}
          </Button>
        </div>
      )}
    </div>
  );
}
