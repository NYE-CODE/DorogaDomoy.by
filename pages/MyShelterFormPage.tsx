import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Image, MapPin, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { BackQuickMenu } from '../components/navigation/BackQuickMenu';
import { LocationPicker } from '../components/location-picker';
import { PageLoader } from '../components/ui/page-loader';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useI18n } from '../context/I18nContext';
import {
  sheltersApi,
  type ShelterAnimalFocus,
  type ShelterContacts,
  type ShelterKind,
  type ShelterModerationStatus,
} from '../api/client';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
} from '../utils/seo';
import { appOutlineCtaClass, appPrimaryCtaClass } from '../styles/cta-classes';
import {
  SHELTER_FORM_STEPS,
  compressLogo,
  compressShelterCover,
  defaultsFromSelectedCity,
  emptyForm,
  formFromShelter,
  logoPreview,
  type ShelterFormState,
} from '../utils/shelter-org-form';
import { geocode } from '../utils/geocode';

export default function MyShelterFormPage() {
  const { t } = useI18n();
  const ms = t.myShelters;
  const { shelterId } = useParams<{ shelterId?: string }>();
  const isCreate = !shelterId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCity } = useCity();
  const defaults = useMemo(() => defaultsFromSelectedCity(selectedCity), [selectedCity]);

  const [form, setForm] = useState<ShelterFormState>(() => ({
    ...emptyForm(defaults, user?.contacts),
    existingLogo: null,
    existingCover: null,
  }));
  const [editingStatus, setEditingStatus] = useState<ShelterModerationStatus | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [bootLoading, setBootLoading] = useState(!isCreate);
  const [mapSyncing, setMapSyncing] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const goList = useCallback(() => navigate('/my-shelters'), [navigate]);

  useEffect(() => {
    const path = isCreate ? '/my-shelters/new' : `/my-shelters/edit/${shelterId}`;
    applySeo({
      title: `${isCreate ? ms.createCard : ms.editCard} — DorogaDomoy.by`,
      description: ms.subtitle,
      canonicalUrl: canonicalUrlFromPath(path),
      robots: SEO_ROBOTS_PRIVATE,
      keywords: SEO_KEYWORDS,
    });
  }, [isCreate, ms.createCard, ms.editCard, ms.subtitle, shelterId]);

  useEffect(() => {
    if (isCreate) {
      setForm({ ...emptyForm(defaults, user?.contacts), existingLogo: null, existingCover: null });
      setEditingStatus(null);
      setFormStep(1);
      setBootLoading(false);
      return;
    }
    if (!shelterId) {
      setBootLoading(false);
      return;
    }
    let cancelled = false;
    setBootLoading(true);
    sheltersApi
      .mine()
      .then((list) => {
        if (cancelled) return;
        const row = list.find((x) => x.id === shelterId);
        if (!row) {
          toast.error(ms.loadError);
          navigate('/my-shelters', { replace: true });
          return;
        }
        setForm({ ...formFromShelter(row), existingLogo: row.logo_url, existingCover: row.cover_url ?? null });
        setEditingStatus(row.moderation_status);
        setFormStep(1);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(ms.loadError);
          navigate('/my-shelters', { replace: true });
        }
      })
      .finally(() => {
        if (!cancelled) setBootLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCreate, shelterId, defaults, user?.contacts, ms.loadError, navigate]);

  const approvedLocked = editingStatus === 'approved';

  const stepWizardMeta = useMemo(
    () => [
      { title: ms.formStep1Title, desc: ms.formStep1Desc },
      { title: ms.formStep2Title, desc: ms.formStep2Desc },
      { title: ms.formStep3Title, desc: ms.formStep3Desc },
      { title: ms.formStep4Title, desc: ms.formStep4Desc },
    ],
    [
      ms.formStep1Title,
      ms.formStep1Desc,
      ms.formStep2Title,
      ms.formStep2Desc,
      ms.formStep3Title,
      ms.formStep3Desc,
      ms.formStep4Title,
      ms.formStep4Desc,
    ],
  );

  const currentStepMeta = stepWizardMeta[formStep - 1] ?? stepWizardMeta[0];
  const stepProgressPct = (formStep / SHELTER_FORM_STEPS) * 100;

  const buildContacts = (): ShelterContacts => {
    const c: ShelterContacts = {};
    if (form.phone.trim()) c.phone = form.phone.trim();
    if (form.telegram.trim()) c.telegram = form.telegram.trim();
    if (form.website.trim()) c.website = form.website.trim();
    if (form.email.trim()) c.email = form.email.trim();
    return c;
  };

  const handlePlaceFromMap = useCallback(
    (
      loc: { lat: number; lng: number },
      place: { formattedAddress: string; locality: string | null },
    ) => {
      setForm((p) => ({
        ...p,
        lat: loc.lat,
        lng: loc.lng,
        address: place.formattedAddress,
        ...(place.locality?.trim() ? { city: place.locality.trim() } : {}),
      }));
    },
    [],
  );

  const syncMapFromAddress = useCallback(async () => {
    const city = form.city.trim();
    const addr = form.address.trim();
    const q = [city, addr].filter(Boolean).join(', ');
    if (!city) {
      toast.error(ms.fillCityRequired);
      return;
    }
    setMapSyncing(true);
    try {
      const res = await geocode(q);
      if (!res) {
        toast.error(ms.formGeocodeNotFound);
        return;
      }
      setForm((p) => ({ ...p, lat: res.lat, lng: res.lng }));
    } finally {
      setMapSyncing(false);
    }
  }, [form.address, form.city, ms.fillCityRequired, ms.formGeocodeNotFound]);

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) {
      toast.error(ms.logoInvalid);
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error(ms.logoTooBig);
      return;
    }
    try {
      const dataUrl = await compressLogo(f);
      setForm((prev) => ({ ...prev, logoDataUrl: dataUrl, existingLogo: null }));
    } catch {
      toast.error(ms.logoFailed);
    }
  };

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) {
      toast.error(ms.logoInvalid);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error(ms.coverTooBig);
      return;
    }
    try {
      const dataUrl = await compressShelterCover(f);
      setForm((prev) => ({ ...prev, coverDataUrl: dataUrl, existingCover: null }));
    } catch {
      toast.error(ms.coverFailed);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      toast.error(ms.fillRequired);
      return;
    }
    const contacts = buildContacts();
    const logoForUpdate =
      form.logoDataUrl !== null && form.logoDataUrl !== ''
        ? form.logoDataUrl
        : form.existingLogo
          ? form.existingLogo
          : null;
    const coverForUpdate =
      form.coverDataUrl !== null && form.coverDataUrl !== ''
        ? form.coverDataUrl
        : form.existingCover
          ? form.existingCover
          : null;

    setSaving(true);
    try {
      if (isCreate) {
        await sheltersApi.create({
          name: form.name.trim(),
          kind: form.kind,
          animal_focus: form.animalFocus,
          description: form.description.trim() || undefined,
          city: form.city.trim(),
          address: form.address.trim() || undefined,
          location_lat: form.lat,
          location_lng: form.lng,
          contacts,
          ...(form.logoDataUrl ? { logo_url: form.logoDataUrl } : {}),
          ...(form.coverDataUrl ? { cover_url: form.coverDataUrl } : {}),
        });
        toast.success(ms.createSuccess);
      } else if (shelterId && editingStatus === 'approved') {
        await sheltersApi.update(shelterId, {
          description: form.description.trim() || null,
          address: form.address.trim() || null,
          location_lat: form.lat,
          location_lng: form.lng,
          contacts,
          logo_url: logoForUpdate,
          cover_url: coverForUpdate,
          animal_focus: form.animalFocus,
        });
        toast.success(ms.updateSuccess);
      } else if (shelterId) {
        await sheltersApi.update(shelterId, {
          name: form.name.trim(),
          kind: form.kind,
          animal_focus: form.animalFocus,
          description: form.description.trim() || null,
          city: form.city.trim(),
          address: form.address.trim() || null,
          location_lat: form.lat,
          location_lng: form.lng,
          contacts,
          logo_url: logoForUpdate,
          cover_url: coverForUpdate,
        });
        toast.success(ms.updateSuccess);
      }
      navigate('/my-shelters', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ms.saveError);
    } finally {
      setSaving(false);
    }
  };

  const goFormNext = () => {
    if (formStep === 1 && !form.name.trim()) {
      toast.error(ms.fillNameRequired);
      return;
    }
    if (formStep === 2 && !form.city.trim()) {
      toast.error(ms.fillCityRequired);
      return;
    }
    setFormStep((s) => Math.min(SHELTER_FORM_STEPS, s + 1));
  };

  const goFormBack = () => setFormStep((s) => Math.max(1, s - 1));

  if (bootLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background dark:bg-gray-950">
        <Header showCitySelector showHomeModeToggle={false} />
        <main className="flex flex-1 items-center justify-center py-16">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-background">
      <Header showCitySelector showHomeModeToggle={false} />

      <section className="border-b border-gray-200 bg-white dark:border-border dark:bg-card">
        <div className="mx-auto max-w-[736px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-4">
            <BackQuickMenu />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold text-black dark:text-foreground">
                {isCreate ? ms.createCard : ms.editCard}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
                {t.petForm.step} {formStep} {t.petForm.of} {SHELTER_FORM_STEPS}:{' '}
                <span className="font-medium text-foreground">{currentStepMeta.title}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={goList}
              className="whitespace-nowrap text-gray-600 transition-colors hover:text-black dark:text-muted-foreground dark:hover:text-foreground"
            >
              {t.petForm.close}
            </button>
          </div>
          {approvedLocked ? (
            <p className="mb-3 text-sm text-muted-foreground">{ms.approvedEditHint}</p>
          ) : null}
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FDB913] to-[#FF9800] transition-[width] duration-300 ease-out"
              style={{ width: `${stepProgressPct}%` }}
            />
          </div>
        </div>
      </section>

      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-[736px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                {currentStepMeta.desc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-0 pb-0">
              {formStep === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="shelter-name">{ms.fieldName} *</Label>
                    <Input
                      id="shelter-name"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      disabled={approvedLocked}
                      autoComplete="organization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shelter-kind">{ms.fieldKind}</Label>
                    <Select
                      value={form.kind}
                      disabled={approvedLocked}
                      onValueChange={(v) => setForm((p) => ({ ...p, kind: v as ShelterKind }))}
                    >
                      <SelectTrigger id="shelter-kind" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shelter">{ms.kindShelter}</SelectItem>
                        <SelectItem value="foster">{ms.kindFoster}</SelectItem>
                        <SelectItem value="vet">{ms.kindVet}</SelectItem>
                        <SelectItem value="other">{ms.kindOther}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shelter-animal-focus">
                      {ms.fieldAnimalFocus} *
                    </Label>
                    <Select
                      value={form.animalFocus}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, animalFocus: v as ShelterAnimalFocus }))
                      }
                    >
                      <SelectTrigger id="shelter-animal-focus" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dogs">{ms.focusDogs}</SelectItem>
                        <SelectItem value="cats">{ms.focusCats}</SelectItem>
                        <SelectItem value="mixed">{ms.focusMixed}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shelter-description">{ms.fieldDescription}</Label>
                    <Textarea
                      id="shelter-description"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      rows={5}
                      className="min-h-[120px] resize-y"
                    />
                  </div>
                </>
              ) : null}

              {formStep === 2 ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="shelter-city">{ms.fieldCity} *</Label>
                      <Input
                        id="shelter-city"
                        value={form.city}
                        onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                        disabled={approvedLocked}
                        autoComplete="address-level2"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="shelter-address">{ms.fieldAddress}</Label>
                      <Input
                        id="shelter-address"
                        value={form.address}
                        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                        autoComplete="street-address"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 sm:w-auto"
                      disabled={mapSyncing}
                      onClick={() => void syncMapFromAddress()}
                    >
                      <MapPin className="size-4 shrink-0" aria-hidden />
                      {mapSyncing ? t.common.loading : ms.formSyncMapButton}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{ms.fieldLocation}</p>
                    <LocationPicker
                      mapHeight="h-64 sm:h-72"
                      initialLocation={{ lat: form.lat, lng: form.lng }}
                      onLocationSelect={(loc) => setForm((p) => ({ ...p, lat: loc.lat, lng: loc.lng }))}
                      onLocationPlaceSync={handlePlaceFromMap}
                    />
                  </div>
                </div>
              ) : null}

              {formStep === 3 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shelter-phone">{ms.fieldPhone}</Label>
                    <Input
                      id="shelter-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shelter-telegram">{ms.fieldTelegram}</Label>
                    <Input
                      id="shelter-telegram"
                      value={form.telegram}
                      onChange={(e) => setForm((p) => ({ ...p, telegram: e.target.value }))}
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="shelter-website">{ms.fieldWebsite}</Label>
                    <Input
                      id="shelter-website"
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                      autoComplete="url"
                      placeholder="https://"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="shelter-email">{ms.fieldEmail}</Label>
                    <Input
                      id="shelter-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      autoComplete="email"
                    />
                  </div>
                </div>
              ) : null}

              {formStep === 4 ? (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label>{ms.fieldLogo}</Label>
                    <p className="text-sm text-muted-foreground">{ms.logoHint}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {(form.logoDataUrl || form.existingLogo) && (
                        <img
                          src={form.logoDataUrl || logoPreview(form.existingLogo) || ''}
                          alt=""
                          className="size-20 rounded-xl border border-border object-cover shadow-sm"
                        />
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogo}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="size-4 shrink-0" aria-hidden />
                        {ms.logoChoose}
                      </Button>
                      {(form.logoDataUrl || form.existingLogo) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setForm((p) => ({ ...p, logoDataUrl: null, existingLogo: null }))}
                        >
                          <X className="size-4 shrink-0" aria-hidden />
                          {ms.logoClear}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 border-t border-border pt-6">
                    <Label>{ms.fieldCover}</Label>
                    <p className="text-sm text-muted-foreground">{ms.coverHint}</p>
                    {(form.coverDataUrl || form.existingCover) && (
                      <div className="overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                        <img
                          src={form.coverDataUrl || logoPreview(form.existingCover) || ''}
                          alt=""
                          className="max-h-40 w-full object-cover object-center sm:max-h-48"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCover}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <Image className="size-4 shrink-0" aria-hidden />
                        {ms.coverChoose}
                      </Button>
                      {(form.coverDataUrl || form.existingCover) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setForm((p) => ({ ...p, coverDataUrl: null, existingCover: null }))}
                        >
                          <X className="size-4 shrink-0" aria-hidden />
                          {ms.coverClear}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn('w-full sm:w-auto', appOutlineCtaClass)}
                onClick={goList}
                disabled={saving}
              >
                {ms.cancel}
              </Button>
              {formStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn('w-full sm:w-auto', appOutlineCtaClass)}
                  onClick={goFormBack}
                  disabled={saving}
                >
                  {t.common.back}
                </Button>
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              {formStep < SHELTER_FORM_STEPS ? (
                <Button type="button" className={cn('w-full sm:w-auto', appPrimaryCtaClass)} onClick={goFormNext}>
                  {t.common.next}
                </Button>
              ) : (
                <Button
                  type="button"
                  className={cn('w-full sm:w-auto', appPrimaryCtaClass)}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? t.common.loading : ms.saveDraft}
                </Button>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
