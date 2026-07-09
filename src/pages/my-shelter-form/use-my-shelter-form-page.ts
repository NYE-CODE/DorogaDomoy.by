import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/AuthContext';
import { useCity } from '@/app/providers/CityContext';
import { useI18n } from '@/app/providers/I18nContext';
import {
  sheltersApi,
  type ShelterContacts,
  type ShelterModerationStatus,
} from '@/shared/api/client';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
} from '@/shared/lib/seo';
import {
  SHELTER_FORM_STEPS,
  compressLogo,
  compressShelterCover,
  defaultsFromSelectedCity,
  emptyForm,
  formFromShelter,
  type ShelterFormState,
} from '@/shared/lib/shelter-org-form';
import { geocode } from '@/shared/lib/geocode';

export function useMyShelterFormPage() {
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
      title: `${isCreate ? ms.createCard : ms.editCard} ќ DorogaDomoy.by`,
      description: ms.subtitle,
      canonicalUrl: canonicalUrlFromPath(path),
      robots: SEO_ROBOTS_PRIVATE,
      keywords: SEO_KEYWORDS,
    });
  }, [isCreate, ms.createCard, ms.editCard, ms.subtitle, shelterId]);

  useEffect(() => {
    if (!isCreate) return;
    setForm({ ...emptyForm(defaults, user?.contacts), existingLogo: null, existingCover: null });
    setEditingStatus(null);
    setFormStep(1);
    setBootLoading(false);
  }, [isCreate, defaults, user?.contacts]);

  useLayoutEffect(() => {
    if (isCreate || !shelterId) return;
    setEditingStatus(null);
    setBootLoading(true);
  }, [isCreate, shelterId]);

  useEffect(() => {
    if (isCreate || !shelterId || !user?.id) return;
    let cancelled = false;
    sheltersApi
      .get(shelterId)
      .then((row) => {
        if (cancelled) return;
        if (row.owner_user_id !== user.id) {
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
  }, [isCreate, shelterId, user?.id, ms.loadError, navigate]);

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
      } else if (shelterId) {
        const current = await sheltersApi.get(shelterId);
        if (current.owner_user_id !== user?.id) {
          toast.error(ms.loadError);
          return;
        }
        if (current.moderation_status === 'approved') {
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
        } else {
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
        }
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

  return {
    t,
    ms,
    isCreate,
    form,
    setForm,
    formStep,
    saving,
    bootLoading,
    mapSyncing,
    approvedLocked,
    currentStepMeta,
    logoInputRef,
    coverInputRef,
    goList,
    handlePlaceFromMap,
    syncMapFromAddress,
    handleLogo,
    handleCover,
    handleSave,
    goFormNext,
    goFormBack,
  };
}
