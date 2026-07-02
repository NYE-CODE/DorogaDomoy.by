import { useEffect, useId, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  Globe,
  Heart,
  Image,
  Mail,
  MapPin,
  Mars,
  MessageCircle,
  Phone,
  Send,
  Share2,
  Venus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  API_V1_BASE,
  campaignsApi,
  petsApi,
  sheltersApi,
  type ShelterCampaignResponse,
  type ShelterResponse,
} from '@/shared/api/client';
import { BackQuickMenu } from '../../components/navigation/BackQuickMenu';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { Footer } from '@/widgets/layout/Footer';
import { Header } from '@/widgets/layout/Header';
import { PageLoader } from '@/shared/ui/page-loader';
import { Button } from '@/shared/ui/button';
import { FavoriteHeartButton } from '../../components/favorite-heart-button';
import { RevealPhoneButton } from '../../components/reveal-phone-button';
import { ShelterPetTraits } from '../../components/ShelterPetTraits';
import { useI18n } from '@/app/providers/I18nContext';
import type { Pet } from '@/entities/pet/model/types';
import { formatCalendarDate, formatRelativeTime } from '@/shared/lib/pet-helpers';
import { petScenarioSoftPillClass } from '@/shared/lib/pet-scenario-colors';
import { appMessengerCtaSizingClass, appOutlineCtaClass, appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { applySeo, canonicalUrlFromPath, SEO_KEYWORDS } from '@/shared/lib/seo';
import { cn } from '@/shared/ui/utils';
import { compressImageBlobForShare, tryShareImageFile } from '@/shared/lib/web-share-image';
import { copyText as copyToClipboard } from '@/shared/lib/copy-text';
import { buildShelterPetShareBundle } from '@/shared/lib/shelter-pet-share';
import { shelterLogoSrc } from '@/shared/lib/shelter-public';
import { useShelterPetBrowse } from '@/app/providers/ShelterPetBrowseContext';
import {
  browseSearchFromParams,
  parseBrowseContext,
  resolveShelterPetBrowseIds,
} from '@/shared/lib/shelter-pet-browse';

function ShelterPetGenderGlyph({ gender }: { gender: Pet['gender'] }) {
  const Icon = gender === 'male' ? Mars : gender === 'female' ? Venus : CircleHelp;
  const cls =
    gender === 'male'
      ? 'text-sky-500'
      : gender === 'female'
        ? 'text-pink-500'
        : 'text-muted-foreground';
  return <Icon className={cn('size-5 shrink-0', cls)} aria-hidden />;
}

function ShelterPetHealthGlyph({
  healthStatus,
  clipId,
}: {
  healthStatus?: string | null;
  clipId: string;
}) {
  switch (healthStatus) {
    case 'excellent':
      return <Heart className="size-5 shrink-0 fill-current text-rose-800" aria-hidden />;
    case 'good':
      return <Heart className="size-5 shrink-0 fill-current text-red-500" aria-hidden />;
    case 'treatment':
      return (
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="12" width="24" height="12" />
            </clipPath>
          </defs>
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 1-4.5 2.5C10.5 4 9.26 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            fill="none"
            stroke="rgb(252 165 165)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 1-4.5 2.5C10.5 4 9.26 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            fill="rgb(239 68 68)"
            clipPath={`url(#${clipId})`}
          />
        </svg>
      );
    case 'disabled':
      return <Heart className="size-5 shrink-0 fill-current text-amber-300" aria-hidden />;
    default:
      return <Heart className="size-5 shrink-0 text-muted-foreground/50" aria-hidden />;
  }
}

export default function ShelterPetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const browseQueryKey = searchParams.toString();
  const { setBrowseNav, canPrev, canNext, goPrev, goNext, nav: browseNav } = useShelterPetBrowse();
  const { t, locale } = useI18n();
  const treatmentClipId = useId();
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<Pet | null>(null);
  const [shelter, setShelter] = useState<ShelterResponse | null>(null);
  const [campaigns, setCampaigns] = useState<ShelterCampaignResponse[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState<null | 'feed' | 'story'>(null);
  const [fundraisingPanel, setFundraisingPanel] = useState<'fundraising' | 'fundraising_history'>('fundraising');
  const [mobileTab, setMobileTab] = useState<'about' | 'fundraising' | 'fundraising_history'>('about');
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  const [showHelpDetails, setShowHelpDetails] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [copiedKind, setCopiedKind] = useState<null | 'link' | 'full'>(null);
  const [instagramGuide, setInstagramGuide] = useState<null | {
    variant: 'post' | 'story';
    openPath: string;
    cardUrl: string | null;
  }>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instagramCardUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsLg(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    instagramCardUrlRef.current = instagramGuide?.cardUrl ?? null;
  }, [instagramGuide?.cardUrl]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      const u = instagramCardUrlRef.current;
      if (u) URL.revokeObjectURL(u);
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    const ctx = parseBrowseContext(searchParams);
    const needsPetForFallback = !ctx;
    if (needsPetForFallback && (!pet || pet.id !== id)) return;

    const browseQuery = browseSearchFromParams(searchParams);
    setBrowseNav({ petIds: [], currentId: id, browseQuery, loading: true });

    let cancelled = false;
    const shelterFallback = ctx?.source === 'shelter' ? ctx.shelterId : pet?.shelterId;

    void resolveShelterPetBrowseIds(ctx, shelterFallback)
      .then((petIds) => {
        if (cancelled) return;
        let ids = petIds.length > 0 ? petIds : [id];
        if (!ids.includes(id)) ids = [id, ...ids];
        setBrowseNav({ petIds: ids, currentId: id, browseQuery, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setBrowseNav({ petIds: [id], currentId: id, browseQuery, loading: false });
      });

    return () => {
      cancelled = true;
      setBrowseNav(null);
    };
  }, [id, pet, browseQueryKey, searchParams, setBrowseNav]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setShelter(null);
    petsApi
      .get(id, { signal: ac.signal })
      .then(async (row) => {
        if (ac.signal.aborted) return;
        let nextPet = row;
        if (row.shelterId) {
          try {
            const org = await sheltersApi.get(row.shelterId);
            if (!ac.signal.aborted) setShelter(org);
            const shelterPets = await sheltersApi.listPets(row.shelterId, { is_archived: false, limit: 300 });
            const exact = shelterPets.find((p) => p.id === row.id);
            if (exact) {
    petsApi
      .get(id, { signal: ac.signal })
              nextPet = {
                ...row,
                name: exact.name?.trim() || row.name,
                colors: exact.colors?.length ? exact.colors : row.colors,
                healthStatus: exact.healthStatus ?? row.healthStatus,
                coatType: exact.coatType ?? row.coatType,
                energyLevel: exact.energyLevel ?? row.energyLevel,
                friendlinessLevel: exact.friendlinessLevel ?? row.friendlinessLevel,
                trainingLevel: exact.trainingLevel ?? row.trainingLevel,
                independenceLevel: exact.independenceLevel ?? row.independenceLevel,
                goodWithKids: exact.goodWithKids ?? row.goodWithKids,
                goodWithDogs: exact.goodWithDogs ?? row.goodWithDogs,
                goodWithCats: exact.goodWithCats ?? row.goodWithCats,
              };
            }
          } catch {
            if (!ac.signal.aborted) setShelter(null);
          }
        }
        if (!ac.signal.aborted) setPet(nextPet);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : t.common.error);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [id, t.common.error]);

  useEffect(() => {
    if (!pet) return;
    const adoptionSeo = (() => {
      const s = pet.adoptionStatus ?? 'available';
      if (s === 'reserved') return t.myShelterPetsList.statusReserved;
      if (s === 'adopted') return t.myShelterPetsList.statusAdopted;
      if (s === 'on_treatment') return t.myShelterPetsList.statusTreatment;
      if (s === 'not_for_adoption') return t.myShelterPetsList.statusNotForAdoption;
      return t.myShelterPetsList.statusAvailable;
    })();
    const title = `${pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType]} — ищет дом`;
    const description = `${adoptionSeo} · ${pet.city}. Узнайте больше о питомце на DorogaDomoy.by`;
    applySeo({
      title,
      description,
      canonicalUrl: canonicalUrlFromPath(`/shelter-pet/${pet.id}`),
      keywords: SEO_KEYWORDS,
    });
  }, [pet, t.pet.animalType, t.myShelterPetsList]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [pet?.id]);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    setCampaignsLoading(true);
    campaignsApi
      .listByPet(id)
      .then((rows) => {
        if (ac.signal.aborted) return;
        setCampaigns(rows);
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setCampaigns([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setCampaignsLoading(false);
      });
    return () => ac.abort();
  }, [id]);

  useClickOutside(shareMenuRef, () => setShowShareMenu(false), showShareMenu);

  if (!id) return <Navigate to="/shelters?tab=pets" replace />;
  if (loading) return <PageLoader />;
  if (error || !pet) return <Navigate to="/shelters?tab=pets" replace />;
  if ((pet.petScope ?? 'lost_found') !== 'shelter_pet') return <Navigate to={`/pet/${pet.id}`} replace />;

  const title = pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType];
  const adoption = (() => {
    const s = pet.adoptionStatus ?? 'available';
    if (s === 'reserved') return t.myShelterPetsList.statusReserved;
    if (s === 'adopted') return t.myShelterPetsList.statusAdopted;
    if (s === 'on_treatment') return t.myShelterPetsList.statusTreatment;
    if (s === 'not_for_adoption') return t.myShelterPetsList.statusNotForAdoption;
    return t.myShelterPetsList.statusAvailable;
  })();
  const traitLabels = {
    health: {
      disabled: t.shelterPet.healthDisabled,
      treatment: t.shelterPet.healthTreatment,
      good: t.shelterPet.healthGood,
      excellent: t.shelterPet.healthExcellent,
    },
    coat: {
      smooth: t.shelterPet.coatSmooth,
      semi: t.shelterPet.coatSemi,
      fluffy: t.shelterPet.coatFluffy,
    },
  };
  const health = pet.healthStatus
    ? (traitLabels.health[pet.healthStatus as keyof typeof traitLabels.health] ?? pet.healthStatus)
    : '?';
  const coat = pet.coatType
    ? (traitLabels.coat[pet.coatType as keyof typeof traitLabels.coat] ?? pet.coatType)
    : '?';
  const colors = pet.colors.length > 0
    ? pet.colors
        .map((c) => t.pet.color[c as keyof typeof t.pet.color] || c)
        .filter((v) => String(v ?? '').trim().length > 0)
        .join(', ')
    : '?';

  const shelterContacts = shelter?.contacts;
  const displayPhone = pet.contacts.phone?.trim() || shelterContacts?.phone?.trim();
  const displayTelegram = pet.contacts.telegram?.trim() || shelterContacts?.telegram?.trim();
  const displayViber = pet.contacts.viber?.trim();
  const displayEmail = shelterContacts?.email?.trim();
  const rawWebsite = shelterContacts?.website?.trim();
  const displayWebsiteUrl =
    rawWebsite &&
    (rawWebsite.startsWith('http://') || rawWebsite.startsWith('https://'))
      ? rawWebsite
      : rawWebsite
        ? `https://${rawWebsite}`
        : '';
  const hasContactChannels = !!(
    displayPhone ||
    displayTelegram ||
    displayViber ||
    displayEmail ||
    displayWebsiteUrl
  );

  const shelterLogoUrl = shelter ? shelterLogoSrc(shelter.logo_url) : undefined;
  const shelterLocationLine = shelter
    ? [shelter.city?.trim(), shelter.address?.trim()].filter(Boolean).join(', ')
    : '';

  const photos = (pet.photos?.length ?? 0) > 0 ? pet.photos! : [''];
  const safePhotoIndex = Math.min(photoIndex, Math.max(0, photos.length - 1));
  const heroPhoto = photos[safePhotoIndex] || photos[0];
  const canSlide = photos.length > 1;
  const activeCampaign = campaigns.find((item) => item.status === 'active') ?? null;
  const historyCampaigns = campaigns.filter((item) => item.status === 'completed');
  const currentCampaign = activeCampaign;
  const currentCampaignEndsAt = currentCampaign?.ends_at ? new Date(currentCampaign.ends_at) : null;
  const hasValidCurrentCampaignEndsAt = Boolean(
    currentCampaignEndsAt && !Number.isNaN(currentCampaignEndsAt.getTime()),
  );
  const progressPercent = currentCampaign
    ? Math.max(0, Math.min(100, Math.round((currentCampaign.collected_amount / Math.max(1, currentCampaign.goal_amount)) * 100)))
    : 0;

  const cardLang = locale === 'be' ? 'be' : 'ru';

  const shareBundle = buildShelterPetShareBundle({
    petId: pet.id,
    title,
    animalLabel: t.pet.animalType[pet.animalType],
    breedParen: pet.breed?.trim()
      ? t.petDetail.shareBreedParen.replace('{breed}', pet.breed.trim())
      : '',
    city: pet.city?.trim() || '?',
    statusLabel: adoption,
    shelterName: shelter?.name,
    description: pet.description?.trim() ?? '',
    headline: t.petDetail.shareShelterHeadline,
    lineTemplate: t.petDetail.shareShelterLine,
    shelterPrefix: t.petDetail.shareShelterShelterPrefix,
    moreOn: t.petDetail.shareShelterMoreOn,
    cta: t.petDetail.shareCta,
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  });

  const fetchCardBlob = async (format: 'feed' | 'story'): Promise<Blob | null> => {
    try {
      const url = `${API_V1_BASE}/pets/${pet.id}/social-card?format=${format}&lang=${cardLang}&contacts=1&_=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  };

  const handleCopyPostText = async () => {
    if (await copyToClipboard(shareBundle.textFull)) {
      toast.success(t.petDetail.shareCopiedFull);
      setCopiedKind('full');
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => {
        copyResetTimerRef.current = null;
        setCopiedKind(null);
      }, 2500);
    } else toast.error(t.common.error);
    setShowShareMenu(false);
  };

  const handleCopyLinkOnly = async () => {
    if (await copyToClipboard(shareBundle.url)) {
      toast.success(t.petDetail.shareCopiedLink);
      setCopiedKind('link');
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => {
        copyResetTimerRef.current = null;
        setCopiedKind(null);
      }, 2500);
    } else toast.error(t.common.error);
    setShowShareMenu(false);
  };

  const handleShareTelegram = () => {
    const u = `https://t.me/share/url?url=${encodeURIComponent(shareBundle.url)}&text=${encodeURIComponent(shareBundle.textForMessenger)}`;
    window.open(u, '_blank', 'noopener,noreferrer,width=600,height=520');
    setShowShareMenu(false);
  };

  const finishInstagramShare = async (variant: 'post' | 'story', openPath: string) => {
    setShowShareMenu(false);
    const cardFormat = variant === 'story' ? 'story' : 'feed';
    setCardLoading(cardFormat);

    const blob = await fetchCardBlob(cardFormat);
    setCardLoading(null);

    if (!blob) {
      toast.error(t.petDetail.shareCardError);
      return;
    }

    const shareBlob =
      (await compressImageBlobForShare(blob, {
        maxLongSide: variant === 'story' ? 1080 : 1080,
        maxSizeBytes: variant === 'story' ? 1_800_000 : 1_500_000,
      })) ?? blob;

    if (variant !== 'story') {
      void copyToClipboard(shareBundle.textFull);
    }

    const out = await tryShareImageFile(
      shareBlob,
      `dorogadomoy-${pet.id}-${cardFormat}.${shareBlob.type === 'image/jpeg' ? 'jpg' : 'png'}`,
      variant === 'story'
        ? {}
        : { text: shareBundle.textFull, url: shareBundle.url, title: shareBundle.vkTitle },
      { fileOnly: variant === 'story' },
    );

    if (out === 'shared') {
      toast.success(t.petDetail.shareInstagramSystemOk, {
        description: t.petDetail.shareInstagramSystemOkDesc,
        duration: 9000,
      });
      return;
    }
    if (out === 'aborted') return;

    const cardUrl = URL.createObjectURL(blob);
    setInstagramGuide((prev) => {
      if (prev?.cardUrl) URL.revokeObjectURL(prev.cardUrl);
      return { variant, openPath, cardUrl };
    });
  };

  const handleShareInstagramPost = () => void finishInstagramShare('post', '/');
  const handleShareInstagramStory = () => void finishInstagramShare('story', '/');

  const showAbout = isLg || mobileTab === 'about';
  const showFundraisingSection =
    isLg || mobileTab === 'fundraising' || mobileTab === 'fundraising_history';
  const showCampaign =
    isLg ? fundraisingPanel === 'fundraising' : mobileTab === 'fundraising';
  const showHistory =
    isLg ? fundraisingPanel === 'fundraising_history' : mobileTab === 'fundraising_history';

  const renderFundraisingCardBody = () => (
    <>
      <div className="mb-5 hidden lg:inline-flex rounded-md border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => setFundraisingPanel('fundraising')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            fundraisingPanel === 'fundraising'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          Сбор
        </button>
        <button
          type="button"
          onClick={() => setFundraisingPanel('fundraising_history')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            fundraisingPanel === 'fundraising_history'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          История сборов
        </button>
      </div>

      {showCampaign ? (
        <div>
          <h2 className="typo-h2">Текущий сбор</h2>
          {campaignsLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Загрузка сбора...</p>
          ) : currentCampaign ? (
            <div className="mt-4 space-y-4 rounded-md border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{currentCampaign.title}</h3>
                  {currentCampaign.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{currentCampaign.description}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Активный</span>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <p><span className="text-muted-foreground">Цель: </span>{currentCampaign.goal_amount} BYN</p>
                <p><span className="text-muted-foreground">Собрано: </span>{currentCampaign.collected_amount} BYN</p>
                <p><span className="text-muted-foreground">Прогресс: </span>{progressPercent}%</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Обновлено: {formatCalendarDate(new Date(currentCampaign.updated_at))}
              </p>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              {hasValidCurrentCampaignEndsAt && currentCampaignEndsAt ? (
                <p className="text-xs text-muted-foreground">
                  Срок: до {formatCalendarDate(currentCampaignEndsAt)}
                </p>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setShowHelpDetails((v) => !v)}>
                {showHelpDetails ? 'Скрыть реквизиты' : 'Как помочь'}
              </Button>
              {showHelpDetails ? (
                <div className="rounded-lg border border-border bg-background p-3 text-sm whitespace-pre-line">
                  {currentCampaign.help_details?.trim() || 'Реквизиты пока не указаны организацией.'}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-muted-foreground">Активного сбора пока нет.</p>
            </div>
          )}
        </div>
      ) : null}
      {showHistory ? (
        <div>
          <h2 className="typo-h2">История сборов</h2>
          {historyCampaigns.length === 0 ? (
            <p className="mt-3 text-muted-foreground">
              {t.petDetail.shelterCampaignHistoryEmpty}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {historyCampaigns.map((item) => (
                <div key={item.id} className="rounded-md border border-border/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span className="text-xs text-muted-foreground">Завершён</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.collected_amount} / {item.goal_amount} BYN
                  </p>
                  {item.close_reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Причина: {item.close_reason}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );

  return (
    <>
    {browseNav && browseNav.petIds.length > 1 ? (
      <>
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          className="fixed left-2 top-[42%] z-30 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur-sm transition hover:border-border hover:bg-muted/80 hover:text-foreground disabled:pointer-events-none disabled:opacity-25 lg:inline-flex"
          aria-label={t.nav.prevPet}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          className="fixed right-2 top-[42%] z-30 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur-sm transition hover:border-border hover:bg-muted/80 hover:text-foreground disabled:pointer-events-none disabled:opacity-25 lg:inline-flex"
          aria-label={t.nav.nextPet}
        >
          <ChevronRight className="size-5" />
        </button>
      </>
    ) : null}
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector={false} />
      <main className="flex-1 py-6 sm:py-10">
        <div className="page-container">
          <div className="mb-6">
            <BackQuickMenu />
          </div>

          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
            <div className="flex flex-col gap-4 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:self-start">
            <div className="-mx-4 h-fit shrink-0 overflow-hidden border-y border-border bg-card sm:mx-0 sm:rounded-lg sm:border">
              <div className="relative aspect-[4/3] w-full bg-muted">
                {heroPhoto ? (
                  <img src={heroPhoto} alt={title} className="block size-full max-h-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">{t.match.card.noPhoto}</div>
                )}
                {canSlide ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPhotoIndex((p) => (p - 1 + photos.length) % photos.length)}
                      className="absolute left-3 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm hover:bg-black/45"
                      aria-label={t.match.card.photoPrev}
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoIndex((p) => (p + 1) % photos.length)}
                      className="absolute right-3 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm hover:bg-black/45"
                      aria-label={t.match.card.photoNext}
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                ) : null}
                <div className="pointer-events-none absolute inset-0 z-[12]">
                  <div className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
                    <FavoriteHeartButton petId={pet.id} />
                  </div>
                </div>
              </div>
              {canSlide ? (
                <div className="flex gap-2 overflow-x-auto border-t border-border px-2 py-2 sm:px-3">
                  {photos.map((photo, idx) => (
                    <button
                      key={`${photo}-${idx}`}
                      type="button"
                      onClick={() => setPhotoIndex(idx)}
                      className={cn(
                        'h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-colors',
                        idx === photoIndex ? 'border-primary' : 'border-border hover:border-primary/60',
                      )}
                      aria-label={t.shelterPet.photoAlt.replace('{name}', title).replace('{n}', String(idx + 1))}
                    >
                      <img
                        src={photo}
                        alt={t.shelterPet.photoAlt.replace('{name}', title).replace('{n}', String(idx + 1))}
                        className="block size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div
              className={cn(
                'hidden rounded-lg border border-border bg-card p-6 shadow-sm lg:block',
                !showFundraisingSection && 'hidden',
              )}
            >
              {renderFundraisingCardBody()}
            </div>
            </div>

            <div
              className="flex gap-1 rounded-md border border-border bg-background p-1 lg:hidden"
              role="tablist"
              aria-label="Разделы карточки питомца"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === 'about'}
                onClick={() => setMobileTab('about')}
                className={cn(
                  'min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm',
                  mobileTab === 'about'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                О питомце
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === 'fundraising'}
                onClick={() => setMobileTab('fundraising')}
                className={cn(
                  'min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm',
                  mobileTab === 'fundraising'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                Сбор
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === 'fundraising_history'}
                onClick={() => setMobileTab('fundraising_history')}
                className={cn(
                  'min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm',
                  mobileTab === 'fundraising_history'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                История сборов
              </button>
            </div>

            <div className="contents lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:gap-4 lg:self-start">
            <div
              className={cn(
                'rounded-lg border border-border bg-card p-6 shadow-sm',
                !showAbout && 'hidden',
              )}
            >
                <h2 className="typo-h2 mb-4 max-lg:hidden">О питомце</h2>
                <div className="space-y-3 text-sm">
                  <h1 className="typo-h1">{title}</h1>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn('rounded-full px-3 py-1 text-sm font-medium', petScenarioSoftPillClass.shelter)}>{adoption}</span>
                      <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{t.pet.animalType[pet.animalType]}</span>
                    </div>
                    <div
                      className="flex shrink-0 items-center gap-2.5"
                      aria-label={`${t.pet.genderLabel}: ${t.pet.gender[pet.gender]}. Здоровье: ${health}`}
                    >
                      <span
                        title={`${t.pet.genderLabel}: ${t.pet.gender[pet.gender]}`}
                        className="inline-flex"
                      >
                        <ShelterPetGenderGlyph gender={pet.gender} />
                      </span>
                      <span title={`Здоровье: ${health}`} className="inline-flex text-rose-500">
                        <ShelterPetHealthGlyph healthStatus={pet.healthStatus} clipId={treatmentClipId} />
                      </span>
                    </div>
                  </div>

                  <p className="pt-1 whitespace-pre-line leading-relaxed text-muted-foreground">{pet.description || t.shelterPet.descriptionEmpty}</p>
                  {(pet.registrationAuthority?.trim() || pet.registrationTokenNumber?.trim()) && (
                    <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                      <p className="font-semibold text-foreground">{t.petDetail.registrationTitle}</p>
                      {pet.registrationAuthority?.trim() ? (
                        <p className="mt-1 text-muted-foreground">
                          <span className="text-foreground/80">{t.petDetail.registrationAuthority}: </span>
                          {pet.registrationAuthority.trim()}
                        </p>
                      ) : null}
                      {pet.registrationTokenNumber?.trim() ? (
                        <p className="mt-1 text-muted-foreground">
                          <span className="text-foreground/80">{t.petDetail.registrationToken}: </span>
                          <span className="font-mono">{pet.registrationTokenNumber.trim()}</span>
                        </p>
                      ) : null}
                    </div>
                  )}
                  <p><span className="text-muted-foreground">{t.pet.breedLabel}: </span>{pet.breed?.trim() || '?'}</p>
                  <p><span className="text-muted-foreground">{t.pet.colorLabel}: </span>{colors}</p>
                  <p><span className="text-muted-foreground">{t.pet.ageLabel}: </span>{pet.approximateAge?.trim() || '?'}</p>
                  <p><span className="text-muted-foreground">Шерсть: </span>{coat}</p>
                  <ShelterPetTraits pet={pet} className="mt-3" />
                  <div className="border-t border-border pt-3 text-muted-foreground">
                    <p className="inline-flex items-start gap-2">
                      <Calendar className="size-4 shrink-0 mt-0.5" aria-hidden />
                      <span>
                        {t.petDetail.shelterAboutDatesLine
                          .replace('{published}', formatCalendarDate(pet.publishedAt))
                          .replace('{updated}', formatRelativeTime(pet.updatedAt))}
                      </span>
                    </p>
                  </div>

                  <div className="relative flex min-w-0 pt-2" ref={shareMenuRef}>
                    <Button
                      type="button"
                      className={cn(appPrimaryCtaClass, 'min-w-0 w-full')}
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      aria-expanded={showShareMenu}
                      aria-haspopup="true"
                    >
                      <Share2 className="size-5 shrink-0" aria-hidden />
                      {t.petDetail.shareShelterProfileButton}
                    </Button>

                    {showShareMenu ? (
                      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,520px)] overflow-hidden overflow-y-auto rounded-md border border-border bg-card shadow-lg">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card px-4 py-2.5 dark:border-border">
                          <span className="text-sm font-semibold text-foreground">{t.petDetail.share}</span>
                          <button
                            type="button"
                            onClick={() => setShowShareMenu(false)}
                            className="rounded-lg p-1 hover:bg-accent dark:hover:bg-accent"
                          >
                            <X className="h-4 w-4 text-muted-foreground/80" />
                          </button>
                        </div>

                        <div className="py-1">
                          <button
                            type="button"
                            onClick={handleShareTelegram}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent dark:hover:bg-accent"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-telegram/10">
                              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-telegram" fill="currentColor" aria-hidden>
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                              </svg>
                            </span>
                            <span className="text-sm text-foreground/90">{t.petDetail.shareTelegram}</span>
                          </button>

                          <div className="my-1 border-t border-border/60 dark:border-border" />
                          <div className="px-4 py-1.5">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                              {t.petDetail.shareShelterInstagramSection}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleShareInstagramPost}
                            disabled={cardLoading !== null}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-50 dark:hover:bg-accent"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/90 dark:bg-muted dark:text-foreground">
                              <Image className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="text-sm text-foreground/90">
                              {cardLoading === 'feed' ? t.petDetail.shareCardDownloading : t.petDetail.shareInstagramPost}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={handleShareInstagramStory}
                            disabled={cardLoading !== null}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-50 dark:hover:bg-accent"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/90 dark:bg-muted dark:text-foreground">
                              <Image className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="text-sm text-foreground/90">
                              {cardLoading === 'story' ? t.petDetail.shareCardDownloading : t.petDetail.shareInstagramStory}
                            </span>
                          </button>

                          <div className="my-1 border-t border-border/60 dark:border-border" />

                          <button
                            type="button"
                            onClick={() => void handleCopyPostText()}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent dark:hover:bg-accent"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                              {copiedKind === 'full' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </span>
                            <span className="text-sm text-foreground/90">{t.petDetail.shareCopyFull}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleCopyLinkOnly()}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent dark:hover:bg-accent"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                              {copiedKind === 'link' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </span>
                            <span className="text-sm text-foreground/90">{t.petDetail.shareCopyLinkOnly}</span>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

            <div
              className={cn(
                'rounded-lg border border-border bg-card p-6 shadow-sm lg:hidden',
                !showFundraisingSection && 'hidden',
              )}
            >
              {renderFundraisingCardBody()}
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="typo-h2 mb-4">{t.landing.shelters.detailContacts}</h2>
              {shelter ? (
                <div className="mb-4 rounded-md border border-border/70 bg-muted/30 p-3 text-sm">
                  <div className="flex gap-3">
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-background">
                      {shelterLogoUrl ? (
                        <img
                          src={shelterLogoUrl}
                          alt={shelter.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Building2 className="size-6 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="font-semibold leading-snug">{shelter.name}</p>
                      <p className="flex items-start gap-1.5 text-muted-foreground">
                        <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
                        <span>{shelterLocationLine || '?'}</span>
                      </p>
                      <Link
                        to={`/shelters/${shelter.id}`}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80"
                      >
                        {t.backQuickMenu.shelterPage}
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="space-y-3">
                {displayPhone ? <RevealPhoneButton phone={displayPhone} /> : null}
                {displayTelegram ? (
                  <Button className={cn(appMessengerCtaSizingClass, 'w-full border-0 bg-telegram text-white hover:bg-telegram-hover')} asChild>
                    <a href={`https://t.me/${displayTelegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                      <Send className="size-5" />
                      Telegram
                    </a>
                  </Button>
                ) : null}
                {displayViber ? (
                  <Button className={cn(appMessengerCtaSizingClass, 'w-full border-0 bg-viber text-white hover:bg-viber-hover')} asChild>
                    <a href={`viber://chat?number=${displayViber.replace('+', '')}`}>
                      <MessageCircle className="size-5" />
                      Viber
                    </a>
                  </Button>
                ) : null}
                {displayEmail ? (
                  <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
                    <a href={`mailto:${displayEmail}`}>
                      <Mail className="size-5" />
                      {displayEmail}
                    </a>
                  </Button>
                ) : null}
                {displayWebsiteUrl ? (
                  <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
                    <a href={displayWebsiteUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="size-5" />
                      Открыть сайт
                    </a>
                  </Button>
                ) : null}
                {!hasContactChannels ? (
                  <p className="text-sm text-muted-foreground">
                    {shelter ? (
                      <>
                        У организации нет прямых контактов — напишите через{' '}
                        <Link to={`/shelters/${shelter.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                          {t.backQuickMenu.shelterPage}
                        </Link>
                        .
                      </>
                    ) : (
                      <>{t.landing.shelters.detailNoContacts}</>
                    )}
                  </p>
                ) : null}
              </div>
            </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>

      {instagramGuide ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shelter-pet-instagram-guide-title"
          onClick={() => {
            if (instagramGuide.cardUrl) URL.revokeObjectURL(instagramGuide.cardUrl);
            setInstagramGuide(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-white shadow-xl dark:border-border dark:bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 id="shelter-pet-instagram-guide-title" className="pr-2 typo-h1">
                  {t.petDetail.shareInstagramModalTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (instagramGuide.cardUrl) URL.revokeObjectURL(instagramGuide.cardUrl);
                    setInstagramGuide(null);
                  }}
                  className="shrink-0 rounded-lg p-1 text-muted-foreground/80 hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted dark:hover:text-muted-foreground/50"
                  aria-label={t.common.close}
                >
                  <X size={22} />
                </button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{t.petDetail.shareInstagramModalExplain}</p>
              <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-foreground/90">
                <li>{t.petDetail.shareInstagramModalStep1}</li>
                <li>{t.petDetail.shareInstagramModalStep2}</li>
                <li>
                  {instagramGuide.variant === 'story'
                    ? t.petDetail.shareInstagramModalStep3Story
                    : t.petDetail.shareInstagramModalStep3Post}
                </li>
              </ol>
              {instagramGuide.variant !== 'story' ? (
                <>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.petDetail.shareInstagramModalCaptionLabel}
                  </p>
                  <textarea
                    readOnly
                    rows={4}
                    value={shareBundle.textFull}
                    className="min-h-[80px] w-full resize-y rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground dark:border-border dark:bg-muted/50 dark:text-foreground"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground/90 hover:bg-muted/50 dark:border-border dark:text-foreground dark:hover:bg-muted sm:w-auto"
                    onClick={async () => {
                      if (await copyToClipboard(shareBundle.textFull)) {
                        toast.success(t.petDetail.shareCopiedFull);
                      } else toast.error(t.common.error);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    {t.petDetail.shareInstagramModalCopyText}
                  </button>
                </>
              ) : null}
              {instagramGuide.cardUrl ? (
                <div className="mt-5 border-t border-border pt-5 dark:border-border">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.petDetail.shareCardSection}
                  </p>
                  <img
                    src={instagramGuide.cardUrl}
                    alt=""
                    className="mb-3 w-full rounded-lg border border-border"
                  />
                  <div className="flex flex-col flex-wrap gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-muted px-4 text-sm font-medium text-foreground hover:bg-muted dark:text-foreground dark:hover:bg-muted/80"
                      onClick={() => {
                        if (!instagramGuide.cardUrl) return;
                        const a = document.createElement('a');
                        a.href = instagramGuide.cardUrl;
                        a.download = `dorogadomoy-${pet.id}-${instagramGuide.variant === 'story' ? 'story' : 'feed'}.png`;
                        a.click();
                        toast.success(t.petDetail.shareCardSaved);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      {t.petDetail.shareCardDownloadBtn}
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 h-12 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                  onClick={() =>
                    window.open(
                      `https://www.instagram.com${instagramGuide.openPath}`,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  {t.petDetail.shareInstagramModalOpenIg}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-border h-12 text-sm font-medium text-foreground/90 hover:bg-muted/50 dark:border-border dark:text-foreground dark:hover:bg-muted"
                  onClick={() => {
                    if (instagramGuide.cardUrl) URL.revokeObjectURL(instagramGuide.cardUrl);
                    setInstagramGuide(null);
                  }}
                >
                  {t.petDetail.shareInstagramModalClose}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
