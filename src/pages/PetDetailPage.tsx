import { useParams, Link } from 'react-router';

import { useState, useEffect, useRef, type ReactNode } from 'react';

import { MapPin, Phone, MessageCircle, Calendar, Share2, Download, ChevronLeft, ChevronRight, User, Eye, AlertCircle, X, QrCode, FileText, Home, Heart, Building2, ArrowLeft, Send, Copy, Check, Printer, Image } from 'lucide-react';

import { Pet } from '@/entities/pet/model/types';

import { formatCalendarDate, formatRelativeTime, petStatusSoftPillClass, petScenarioFlyerColors, petScenarioDetailBannerClass } from '@/shared/lib/pet-helpers';
import { buildPetFlyerCss } from '@/shared/lib/pet-flyer-styles';

import { toast } from 'sonner';

import { petsApi, reportsApi, sightingsApi, type SightingItem, API_V1_BASE } from '@/shared/api/client';

import { useAuth } from '@/app/providers/AuthContext';

import { useI18n } from '@/app/providers/I18nContext';

import { ReportModal } from '../../components/report-modal';

import { SightingForm } from '../../components/SightingForm';

import { ReportReason } from '@/entities/admin/model/types';

import { RewardBadge } from '../../components/reward-badge';

import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import { getPetPhotoCircleDivIcon, SIGHTING_MARKER_BORDER_COLOR } from '@/shared/lib/leaflet-pet-photo-icon';

import { buildPetShareBundle, type PetShareDict } from '@/shared/lib/pet-share-text';

import { copyText as copyToClipboard } from '@/shared/lib/copy-text';

import { compressImageBlobForShare, tryShareImageFile } from '@/shared/lib/web-share-image';

import {

  applySeo,

  canonicalUrlFromPath,

  getSiteOrigin,

  SEO_KEYWORDS,

  SEO_ROBOTS_PRIVATE,

  SEO_ROBOTS_PUBLIC,

  truncateMetaDescription,

} from '@/shared/lib/seo';

import { tokens } from '@/shared/styles/tokens';

import { typoH3 } from '@/shared/styles/typography-classes';

import { useClickOutside } from '@/shared/hooks/useClickOutside';

import { EmptyState } from '@/shared/ui/empty-state';

import { PageLoader } from '@/shared/ui/page-loader';

import { Button } from '@/shared/ui/button';

import { FavoriteHeartButton } from '../../components/favorite-heart-button';

import { RevealPhoneButton } from '../../components/reveal-phone-button';

import { cn } from '@/shared/ui/utils';

import {

  appMessengerCtaSizingClass,

  appOutlineCtaClass,

  appPrimaryCtaClass,

} from '@/shared/styles/cta-classes';

import { getHomePath } from '@/shared/lib/home-route';

import { PLACEHOLDER_PRINT_FLYER } from '@/shared/lib/placeholder-images';

import { translations } from '@/shared/i18n/translations';

const PRINT_PLACEHOLDER_IMAGE = PLACEHOLDER_PRINT_FLYER;

function escapeHtml(value: string | null | undefined): string {

  return String(value ?? '')

    .replaceAll('&', '&amp;')

    .replaceAll('<', '&lt;')

    .replaceAll('>', '&gt;')

    .replaceAll('"', '&quot;')

    .replaceAll("'", '&#39;');

}

function isAbortError(e: unknown): boolean {

  if (e instanceof DOMException && e.name === 'AbortError') return true;

  if (e instanceof Error && e.name === 'AbortError') return true;

  return false;

}

function getSafeImageUrl(url?: string): string {

  if (!url) return PRINT_PLACEHOLDER_IMAGE;

  if (url.startsWith('data:image/')) return url;

  try {

    const parsed = new URL(url, window.location.origin);

    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : PRINT_PLACEHOLDER_IMAGE;

  } catch {

    return PRINT_PLACEHOLDER_IMAGE;

  }

}

function createSightingPopupContent(seenLabel: string, sighting: SightingItem): HTMLDivElement {

  const container = document.createElement('div');

  container.className = 'text-sm';

  const title = document.createElement('strong');

  const seenAt = new Date(sighting.seen_at);

  title.textContent =

    `${seenLabel} ${seenAt.toLocaleDateString('ru-RU')} ` +

    seenAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  container.appendChild(title);

  if (sighting.comment) {

    const comment = document.createElement('div');

    const trimmed = sighting.comment.slice(0, 80);

    comment.textContent = `${trimmed}${sighting.comment.length > 80 ? '?' : ''}`;

    container.appendChild(comment);

  }

  return container;

}

function SinglePetMap({ pet, sightings = [], seenLabel }: { pet: Pet; sightings?: SightingItem[]; seenLabel: string }) {

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapInstanceRef = useRef<L.Map | null>(null);

  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {

    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {

      scrollWheelZoom: false,

      dragging: true,

      zoomControl: true,

    }).setView([pet.location.lat, pet.location.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {

      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

    }).addTo(map);

    const petIcon = getPetPhotoCircleDivIcon({

      photoUrl: pet.photos?.[0],

      status: pet.status,

      size: 40,

    });

    L.marker([pet.location.lat, pet.location.lng], { icon: petIcon }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    const invalidateTimer = setTimeout(() => map.invalidateSize(), 100);

    return () => {

      clearTimeout(invalidateTimer);

      map.remove();

      mapInstanceRef.current = null;

      markersLayerRef.current = null;

    };

  }, [pet]);

  useEffect(() => {

    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    sightings.forEach((s) => {

      const icon = getPetPhotoCircleDivIcon({

        photoUrl: pet.photos?.[0],

        status: pet.status,

        borderColor: SIGHTING_MARKER_BORDER_COLOR,

        size: 32,

        borderWidth: 3,

      });

      const m = L.marker([s.location_lat, s.location_lng], { icon }).addTo(markersLayerRef.current!);

      m.bindPopup(createSightingPopupContent(seenLabel, s));

    });

  }, [sightings, seenLabel, pet]);

  return (

    <div ref={mapContainerRef} className="h-full w-full z-0" />

  );

}

function ImageCarousel({

  photos,

  alt,

  overlay,

}: {

  photos: string[];

  alt: string;

  overlay?: ReactNode;

}) {

  const [current, setCurrent] = useState(0);

  if (photos.length === 0) return null;

  const goTo = (index: number) => {

    setCurrent((index + photos.length) % photos.length);

  };

  return (

    <>

      <div className="relative aspect-[4/3] bg-black">

        <img

          src={photos[current]}

          alt={photos.length > 1 ? `${alt} Ч фото ${current + 1}` : alt}

          className="w-full h-full object-contain"

        />

            {photos.length > 1 && (

              <>

                <button

                  type="button"

                  onClick={() => goTo(current - 1)}

                  className="absolute left-3 top-1/2 z-[5] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/50 sm:left-4"

                  aria-label="Previous photo"

                >

                  <ChevronLeft className="size-5" />

                </button>

                <button

                  type="button"

                  onClick={() => goTo(current + 1)}

                  className="absolute right-3 top-1/2 z-[5] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/50 sm:right-4"

                  aria-label="Next photo"

                >

                  <ChevronRight className="size-5" />

                </button>

                <div className="absolute bottom-4 left-1/2 z-[5] flex -translate-x-1/2 gap-2">

                  {photos.map((_, i) => (

                    <button

                      key={i}

                      type="button"

                      onClick={() => setCurrent(i)}

                      className={cn(

                        'h-2 rounded-full transition-all',

                        i === current ? 'w-7 bg-primary shadow-sm' : 'w-2 bg-white/55 hover:bg-white/85',

                      )}

                      aria-label={`Photo ${i + 1}`}

                    />

                  ))}

                </div>

              </>

            )}

        {overlay != null ? (

          <div className="pointer-events-none absolute inset-0 z-[12]">

            <div className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-4 sm:right-4">{overlay}</div>

          </div>

        ) : null}

      </div>

      {photos.length > 1 && (

        <div className="flex gap-2 overflow-x-auto border-t border-border bg-muted/30 p-3 sm:p-4">

          {photos.map((src, i) => (

            <button

              key={i}

              type="button"

              onClick={() => setCurrent(i)}

              className={cn(

                'h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors',

                i === current

                  ? 'border-primary ring-2 ring-primary/25'

                  : 'border-transparent ring-1 ring-border hover:border-muted-foreground/30',

              )}

            >

              <img src={src} alt={`${alt} Ч миниатюра ${i + 1}`} className="size-full object-cover" />

            </button>

          ))}

        </div>

      )}

    </>

  );

}

export default function PetDetailPage() {

  const { id } = useParams<{ id: string }>();

  const { user: currentUser, isAuthenticated, openAuthModal } = useAuth();

  const { t, locale } = useI18n();

  const [pet, setPet] = useState<Pet | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  const [reportingPetId, setReportingPetId] = useState<string | null>(null);

  const [copiedKind, setCopiedKind] = useState<null | 'link' | 'full'>(null);

  const [showFlyerModal, setShowFlyerModal] = useState(false);

  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareMenuRef = useRef<HTMLDivElement>(null);

  const [sightings, setSightings] = useState<SightingItem[]>([]);

  const [showSightingForm, setShowSightingForm] = useState(false);

  const [instagramGuide, setInstagramGuide] = useState<null | {

    variant: 'post' | 'story';

    openPath: string;

    cardUrl: string | null;

  }>(null);

  const [cardLoading, setCardLoading] = useState<null | 'feed' | 'story'>(null);

  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const instagramCardUrlRef = useRef<string | null>(null);

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

    const ac = new AbortController();

    setLoading(true);

    setError(false);

    setPet(null);

    petsApi

      .get(id, { signal: ac.signal })

      .then((p) => {

        if (ac.signal.aborted) return;

        setPet(p);

      })

      .catch((e: unknown) => {

        if (isAbortError(e)) return;

        setError(true);

      })

      .finally(() => {

        if (!ac.signal.aborted) setLoading(false);

      });

    return () => ac.abort();

  }, [id]);

  useEffect(() => {

    if (loading || !id) return;

    if (error || !pet) {

      applySeo({

        title: 'ќбъ€вление не найдено | DorogaDomoy.by',

        description:

          'ќбъ€вление удалено или ссылка устарела. DorogaDomoy.by Ч платформа поиска пропавших и найденных питомцев в Ѕеларуси.',

        canonicalUrl: canonicalUrlFromPath(`/pet/${id}`),

        robots: SEO_ROBOTS_PRIVATE,

        keywords: SEO_KEYWORDS,

      });

    }

  }, [loading, error, pet, id]);

  useEffect(() => {

    if (!pet) return;

    const animal = t.pet.animalType[pet.animalType];

    const headline = pet.status === 'searching' ? t.petDetail.lostPet : t.petDetail.foundPet;

    const breedPart = pet.breed ? `, ${pet.breed}` : '';

    const title = `${headline} Ч ${animal}${breedPart}, ${pet.city} | DorogaDomoy.by`;

    const description = truncateMetaDescription(`${headline}. ${animal}, ${pet.city}. ${pet.description}`);

    applySeo({

      title,

      description,

      canonicalUrl: `${getSiteOrigin()}/pet/${pet.id}`,

      robots: SEO_ROBOTS_PUBLIC,

      keywords: SEO_KEYWORDS,

    });

  }, [pet, locale]);

  useClickOutside(shareMenuRef, () => setShowShareMenu(false), showShareMenu);

  useEffect(() => {

    if (!pet || pet.isArchived || pet.status !== 'searching' || (pet.petScope ?? 'lost_found') === 'shelter_pet') return;

    const ac = new AbortController();

    sightingsApi

      .listByPet(pet.id, 7, { signal: ac.signal })

      .then((rows) => {

        if (!ac.signal.aborted) setSightings(rows);

      })

      .catch((err: unknown) => {

        if (isAbortError(err)) return;

        console.warn('[PetDetailPage] sightings load failed', err);

        setSightings([]);

      });

    return () => ac.abort();

  }, [pet?.id, pet?.isArchived, pet?.status]);

  if (loading) {

    return <PageLoader label={t.petDetail.loading} />;

  }

  if (error || !pet) {

    return (

      <div className="flex min-h-screen flex-col bg-background px-4 pt-16 pb-24 md:py-16 dark:bg-background">

        <EmptyState

          title={t.petDetail.notFound}

          description={t.petDetail.notFoundDesc}

          action={

            <Button className={appPrimaryCtaClass} asChild>

              <Link to={getHomePath()}>{t.petDetail.toMain}</Link>

            </Button>

          }

          className="mx-auto max-w-lg border-dashed"

        />

      </div>

    );

  }

  const isShelterPet = (pet.petScope ?? 'lost_found') === 'shelter_pet';

  const getArchiveReasonBadge = () => {

    if (!pet.isArchived || !pet.archiveReason) return null;

    let icon = null;

    let bgColor = 'bg-green-50 dark:bg-green-900/20';

    let textColor = 'text-green-700 dark:text-green-400';

    let borderColor = 'border-green-200 dark:border-green-800';

    const returnedLabels = [

      t.deleteReason.reasons.returned,

      translations.ru.deleteReason.reasons.returned,

      translations.be.deleteReason.reasons.returned,

      translations.en.deleteReason.reasons.returned,

    ];

    const adoptedLabels = [

      t.deleteReason.reasons.adopted,

      translations.ru.deleteReason.reasons.adopted,

      translations.be.deleteReason.reasons.adopted,

      translations.en.deleteReason.reasons.adopted,

    ];

    const transferredLabels = [

      t.deleteReason.reasons.transferred,

      translations.ru.deleteReason.reasons.transferred,

      translations.be.deleteReason.reasons.transferred,

      translations.en.deleteReason.reasons.transferred,

    ];

    if (returnedLabels.some((label) => pet.archiveReason === label)) {

      icon = <Home className="w-4 h-4" />;

    } else if (adoptedLabels.some((label) => pet.archiveReason === label)) {

      icon = <Heart className="w-4 h-4" />;

      bgColor = 'bg-pink-50 dark:bg-pink-900/20';

      textColor = 'text-pink-700 dark:text-pink-400';

      borderColor = 'border-pink-200 dark:border-pink-800';

    } else if (transferredLabels.some((label) => pet.archiveReason === label)) {

      icon = <Building2 className="w-4 h-4" />;

      bgColor = 'bg-green-50 dark:bg-green-900/20';

      textColor = 'text-green-700 dark:text-green-400';

      borderColor = 'border-border';

    }

    return { icon, bgColor, textColor, borderColor };

  };

  const archiveBadge = getArchiveReasonBadge();

  const handleContactClick = (url: string) => {

    window.open(url, '_blank');

  };

  const shareDict: PetShareDict = {

    shareHeadlineLost: t.petDetail.shareHeadlineLost,

    shareHeadlineFound: t.petDetail.shareHeadlineFound,

    shareLostLine: t.petDetail.shareLostLine,

    shareFoundLine: t.petDetail.shareFoundLine,

    shareBreedParen: t.petDetail.shareBreedParen,

    shareMoreOn: t.petDetail.shareMoreOn,

    shareCta: t.petDetail.shareCta,

  };

  const shareBundle = buildPetShareBundle(

    pet,

    t.pet.animalType[pet.animalType],

    shareDict,

    window.location.origin,

  );

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

  const fetchCardBlob = async (format: 'feed' | 'story'): Promise<Blob | null> => {

    try {

      const url = `${API_V1_BASE}/pets/${pet.id}/social-card?format=${format}&lang=${locale}&contacts=1&_=${Date.now()}`;

      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) return null;

      return await res.blob();

    } catch {

      return null;

    }

  };

  const handleShareTelegram = () => {

    const u = `https://t.me/share/url?url=${encodeURIComponent(shareBundle.url)}&text=${encodeURIComponent(shareBundle.textForMessenger)}`;

    window.open(u, '_blank', 'noopener,noreferrer,width=600,height=520');

    setShowShareMenu(false);

  };

  const finishInstagramShare = async (

    variant: 'post' | 'story',

    openPath: string,

  ) => {

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

      await compressImageBlobForShare(blob, {

        maxLongSide: variant === 'story' ? 1080 : 1080,

        maxSizeBytes: variant === 'story' ? 1_800_000 : 1_500_000,

      }) ?? blob;

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

  const petUrl = shareBundle.url;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(petUrl)}`;

  const safePhotoUrl = getSafeImageUrl(pet.photos[0]);

  const flyerIsLost = pet.status === 'searching';

  const flyerAuthorName = escapeHtml(pet.authorName);

  const flyerScenario = flyerIsLost ? 'lost' : 'found';
  const flyerPalette = petScenarioFlyerColors[flyerScenario];
  const flyerAccent = flyerPalette.accent;
  const flyerAccentSoft = flyerPalette.soft;
  const flyerAccentBorder = flyerPalette.border;

  const flyerTitle = escapeHtml(flyerIsLost ? t.petDetail.lostPet : t.petDetail.foundPet);

  const flyerSubtitle = escapeHtml(`${pet.city} Ј ${t.pet.animalType[pet.animalType]}`);

  const flyerBreed = escapeHtml(pet.breed || t.pet.notSpecified);

  const flyerColors = escapeHtml(pet.colors.map(c => t.pet.color[c]).join(', '));

  const flyerGender = escapeHtml(t.pet.gender[pet.gender]);

  const flyerAge = pet.approximateAge ? escapeHtml(pet.approximateAge) : null;

  const flyerDescription = escapeHtml(pet.description);

  const flyerContactPhone = escapeHtml(pet.contacts.phone || t.petDetail.seeContacts);

  const qrLabel = escapeHtml(t.petDetail.moreOnSite);

  const callAnytimeLabel = escapeHtml(t.petDetail.callAnytime);

  const flyerDocTitle = escapeHtml(`DorogaDomoy.by Ј ${pet.city}`);

  const flyerLang = escapeHtml(locale);

  const flyerCommonStyles = buildPetFlyerCss({
    accent: flyerAccent,
    soft: flyerAccentSoft,
    border: flyerAccentBorder,
  });

  const flyerPrintScript =

    '<script>(function(){function p(){setTimeout(function(){window.focus();window.print();},300);}' +

    'var imgs=document.getElementsByTagName("img"),i,img,n=0;' +

    'for(i=0;i<imgs.length;i++){if(!imgs[i].complete)n++;}' +

    'if(!n){p();return;}' +

    'var l=n;' +

    'for(i=0;i<imgs.length;i++){img=imgs[i];if(img.complete)continue;' +

    'img.onload=img.onerror=function(){if(!--l)p();};}' +

    '})();<\/script>';

  const buildFlyerDocument = (bodyInner: string) =>

    `<!DOCTYPE html><html lang="${flyerLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${flyerDocTitle}</title><style>${flyerCommonStyles}</style></head><body><main class="sheet">${bodyInner}</main>${flyerPrintScript}</body></html>`;

  const flyerHeaderHtml = `
    <header class="flyer-header">
      <div class="brand-strip">DorogaDomoy.by</div>
      <h1 class="title">${flyerTitle}</h1>
      <div class="subtitle">${flyerSubtitle}</div>
    </header>`;

  const flyerPhotoHtml = `
    <div class="photo-area">
      <img src="${safePhotoUrl}" class="photo" alt="" decoding="async" loading="eager" />
    </div>`;

  const flyerDetailsStart = `
    <div class="flyer-details">
    <div class="info-grid">
      <div><div class="label">${escapeHtml(t.pet.breedLabel)}</div><div class="value">${flyerBreed}</div></div>
      <div><div class="label">${escapeHtml(t.pet.colorLabel)}</div><div class="value">${flyerColors}</div></div>
      <div><div class="label">${escapeHtml(t.pet.genderLabel)}</div><div class="value">${flyerGender}</div></div>
      ${flyerAge ? `<div><div class="label">${escapeHtml(t.pet.ageLabel)}</div><div class="value">${flyerAge}</div></div>` : ''}
    </div>
    <div class="description">${flyerDescription}</div>`;

  const flyerDetailsEnd = `
    </div>`;

  const openFlyer = (html: string) => {

    // Ќе передаЄм noopener в windowFeatures: иначе window.open возвращает null,

    // а document.write не срабатывает Ч нужен другой способ / QR.

    const w = window.open('', '_blank');

    if (!w) return;

    try {

      w.opener = null;

    } catch {

      /* ignore */

    }

    w.document.write(html);

    w.document.close();

  };

  const handleFlyerClassic = () => {

    setShowFlyerModal(false);

    openFlyer(

      buildFlyerDocument(`

      ${flyerHeaderHtml}
      ${flyerPhotoHtml}
      ${flyerDetailsStart}
      <div class="contact-box">
        <div class="contact-label">${callAnytimeLabel}</div>
        <div class="phone">${flyerContactPhone}</div>
        <div class="author-line">${flyerAuthorName}</div>
      </div>
      ${flyerDetailsEnd}

    `.trim()),

    );

  };

  const handleFlyerQR = () => {

    setShowFlyerModal(false);

    openFlyer(

      buildFlyerDocument(`

      ${flyerHeaderHtml}
      ${flyerPhotoHtml}
      ${flyerDetailsStart}
      <div class="contact-qr">
        <div class="left">
          <div class="contact-label">${callAnytimeLabel}</div>
          <div class="phone">${flyerContactPhone}</div>
          <div class="author-line">${flyerAuthorName}</div>
        </div>
        <div class="qr">
          <img src="${qrUrl}" alt="" width="112" height="112" decoding="async" loading="eager" />
          <div class="qr-label">${qrLabel}</div>
        </div>
      </div>
      ${flyerDetailsEnd}

    `.trim()),

    );

  };

  const handleReportPet = () => {

    if (!isAuthenticated) {

      toast.error(t.common.toasts.reportLoginRequired);

      openAuthModal();

      return;

    }

    setReportingPetId(pet.id);

  };

  const handleSubmitReport = async (reason: ReportReason, description: string) => {

    if (!reportingPetId || !currentUser) return;

    try {

      await reportsApi.create(reportingPetId, reason, description);

      setReportingPetId(null);

      toast.success(t.common.toasts.reportSent, {

        description: t.common.toasts.reportSentDesc,

      });

    } catch (err) {

      toast.error(err instanceof Error ? err.message : t.common.toasts.reportSendError);

    }

  };

  const canAddSighting = !isShelterPet && pet.status === 'searching' && !pet.isArchived

    && !(currentUser && (pet.authorId === currentUser.id || (currentUser.id === 'user-demo' && pet.authorId === 'current-user')));

  return (

    <>

    <div className="min-h-screen bg-background pt-8 pb-24 md:py-8">

      <div className="page-container">

        {/* Breadcrumb */}

        <div className="mb-6">

          <Link

            to={getHomePath()}

            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"

          >

            <ChevronLeft size={20} aria-hidden />

            {t.petDetail.backToAds}

          </Link>

        </div>

        {/* Alert Banner */}

        {!isShelterPet && pet.status === 'searching' && !pet.isArchived && (

          <div className={petScenarioDetailBannerClass.lost.box}>

            <AlertCircle size={24} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />

            <div>

              <p className="mb-1 font-semibold text-rose-800 dark:text-rose-200">{t.petDetail.lostBannerTitle}</p>

              <p className="text-muted-foreground text-sm leading-relaxed">{t.petDetail.lostBannerBody}</p>

            </div>

          </div>

        )}

        {!isShelterPet && pet.status === 'found' && !pet.isArchived && (

          <div className={petScenarioDetailBannerClass.found.box}>

            <AlertCircle size={24} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />

            <div>

              <p className="mb-1 font-semibold text-sky-900 dark:text-sky-200">{t.petDetail.foundBannerTitle}</p>

              <p className="text-muted-foreground text-sm leading-relaxed">{t.petDetail.foundBannerBody}</p>

            </div>

          </div>

        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column */}

          <div className="lg:col-span-2 space-y-6">

            {/* Photo Gallery */}

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">

              <ImageCarousel

                photos={pet.photos}

                alt={t.pet.animalType[pet.animalType]}

                overlay={<FavoriteHeartButton petId={pet.id} />}

              />

            </div>

            {/* Action buttons */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="relative flex min-w-0 gap-2" ref={shareMenuRef}>

            <Button

              type="button"

              className={cn(appPrimaryCtaClass, 'min-w-0 flex-1')}

              onClick={() => setShowShareMenu(!showShareMenu)}

              aria-expanded={showShareMenu}

              aria-haspopup="true"

            >

              <Share2 className="size-5" aria-hidden />

              {t.petDetail.shareAdButton}

            </Button>

            {showShareMenu && (

              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,520px)] overflow-hidden overflow-y-auto rounded-md border border-border bg-card shadow-lg">

                <div className="px-4 py-2.5 border-b border-border/60 dark:border-border flex items-center justify-between sticky top-0 bg-card z-10">

                  <span className="text-sm font-semibold text-foreground">{t.petDetail.share}</span>

                  <button type="button" onClick={() => setShowShareMenu(false)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded-lg"><X className="w-4 h-4 text-muted-foreground/80" /></button>

                </div>

                <div className="py-1">

                  <button type="button" onClick={handleShareTelegram} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">

                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-telegram/10 shrink-0">

                      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-telegram" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>

                    </span>

                    <span className="text-sm text-foreground/90">{t.petDetail.shareTelegram}</span>

                  </button>

                  <div className="border-t border-border/60 dark:border-border my-1" />

                  <div className="px-4 py-1.5"><span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{t.petDetail.shareInstagramSection}</span></div>

                  <button type="button" onClick={handleShareInstagramPost} disabled={cardLoading !== null} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left disabled:opacity-50">

                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-foreground/90 dark:text-foreground shrink-0">

                      <Image className="w-4 h-4" aria-hidden />

                    </span>

                    <span className="text-sm text-foreground/90">

                      {cardLoading === 'feed' ? t.petDetail.shareCardDownloading : t.petDetail.shareInstagramPost}

                    </span>

                  </button>

                  <button type="button" onClick={handleShareInstagramStory} disabled={cardLoading !== null} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left disabled:opacity-50">

                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-foreground/90 dark:text-foreground shrink-0">

                      <Image className="w-4 h-4" aria-hidden />

                    </span>

                    <span className="text-sm text-foreground/90">

                      {cardLoading === 'story' ? t.petDetail.shareCardDownloading : t.petDetail.shareInstagramStory}

                    </span>

                  </button>

                  <div className="border-t border-border/60 dark:border-border my-1" />

                  <button type="button" onClick={handleCopyPostText} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">

                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted shrink-0">

                      {copiedKind === 'full' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}

                    </span>

                    <span className="text-sm text-foreground/90">{t.petDetail.shareCopyFull}</span>

                  </button>

                  <button type="button" onClick={handleCopyLinkOnly} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">

                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted shrink-0">

                      {copiedKind === 'link' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}

                    </span>

                    <span className="text-sm text-foreground/90">{t.petDetail.shareCopyLinkOnly}</span>

                  </button>

                </div>

              </div>

            )}

          </div>

          <div>

            <Button

              type="button"

              className={cn(appOutlineCtaClass, 'w-full')}

              onClick={() => setShowFlyerModal(true)}

            >

              <Download className="size-5" aria-hidden />

              {t.petDetail.downloadFlyer}

            </Button>

          </div>

        </div>

            {/* Description - inside left column */}

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

              <h2 className="typo-h2 mb-4">{t.pet.description}</h2>

              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{pet.description}</p>

            </div>

            {(pet.registrationAuthority?.trim() || pet.registrationTokenNumber?.trim()) && (

              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

                <h2 className="typo-h2 mb-4">{t.petDetail.registrationTitle}</h2>

                <dl className="space-y-3 text-muted-foreground">

                  {pet.registrationAuthority?.trim() ? (

                    <div>

                      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/70">

                        {t.petDetail.registrationAuthority}

                      </dt>

                      <dd className="mt-1 whitespace-pre-line leading-relaxed">{pet.registrationAuthority.trim()}</dd>

                    </div>

                  ) : null}

                  {pet.registrationTokenNumber?.trim() ? (

                    <div>

                      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/70">

                        {t.petDetail.registrationToken}

                      </dt>

                      <dd className="mt-1 font-mono text-sm">{pet.registrationTokenNumber.trim()}</dd>

                    </div>

                  ) : null}

                </dl>

              </div>

            )}

            {!isShelterPet && (

              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">

                <div className="border-b border-border p-6">

                  <div className="mb-2 flex items-center gap-3">

                    <MapPin size={24} className="text-primary" aria-hidden />

                    <h2 className="typo-h2">{t.pet.location}</h2>

                  </div>

                  <p className="ml-9 text-muted-foreground">{pet.city}</p>

                </div>

                {canAddSighting && pet.status === 'searching' && !pet.isArchived && (

                  <div className="border-b border-border bg-primary/5 p-6 dark:bg-primary/10">

                    <Button

                      type="button"

                      className={cn(appPrimaryCtaClass, 'mb-3 w-full')}

                      onClick={() => setShowSightingForm(true)}

                    >

                      {t.petDetail.sawSimilar}

                    </Button>

                    <p className="text-center text-sm text-muted-foreground">{t.petDetail.sightingHintForVisitors.replace(/^\s*\u{1F441}\s*/u, '')}</p>

                  </div>

                )}

                <div className="h-96">

                  <SinglePetMap pet={pet} sightings={sightings} seenLabel={t.sightings.seenLabel} />

                </div>

              </div>

            )}

          </div>

          {/* Right Column */}

          <div className="space-y-6">

            {/* —татус и награда */}

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

              <h2 className="typo-h2 mb-6">{t.pet.information}</h2>

              <div className="space-y-4">

                <div>

                  <div className="mb-1 text-sm text-muted-foreground">{t.filters.status}</div>

                  <div

                    className={cn(

                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',

                      petStatusSoftPillClass[pet.status],

                    )}

                  >

                    {pet.status === 'searching' ? t.pet.status.searching : t.pet.status.found}

                  </div>

                </div>

                {pet.status === 'searching' && (

                  <div>

                    <div className="mb-1 text-sm text-muted-foreground">¬ознаграждение</div>

                    <RewardBadge pet={pet} />

                  </div>

                )}

                <div>

                  <div className="mb-1 text-sm text-muted-foreground">{t.pet.animalTypeLabel}</div>

                  <div className="font-medium text-foreground">{t.pet.animalType[pet.animalType]}</div>

                </div>

                {pet.breed && (

                  <div>

                    <div className="mb-1 text-sm text-muted-foreground">{t.pet.breedLabel}</div>

                    <div className="font-medium text-foreground">{pet.breed}</div>

                  </div>

                )}

                <div>

                  <div className="mb-1 text-sm text-muted-foreground">{t.pet.colorLabel}</div>

                  <div className="flex flex-wrap gap-2">

                    {pet.colors.map((c) => (

                      <span

                        key={c}

                        className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"

                      >

                        {t.pet.color[c]}

                      </span>

                    ))}

                  </div>

                </div>

                <div>

                  <div className="mb-1 text-sm text-muted-foreground">{t.pet.genderLabel}</div>

                  <div className="font-medium text-foreground">{t.pet.gender[pet.gender]}</div>

                </div>

                {pet.approximateAge && (

                  <div>

                    <div className="mb-1 text-sm text-muted-foreground">{t.pet.ageLabel}</div>

                    <div className="font-medium text-foreground">{pet.approximateAge}</div>

                  </div>

                )}

                <div className="space-y-2 border-t border-border pt-4">

                  <div className="flex items-center gap-2 text-muted-foreground">

                    <MapPin className="size-[18px] shrink-0" aria-hidden />

                    <span>{pet.city}</span>

                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">

                    <Calendar className="size-[18px] shrink-0" aria-hidden />

                    <span>

                      {formatCalendarDate(pet.publishedAt)}

                      <span className="mx-1.5 text-border">Ј</span>

                      {formatRelativeTime(pet.publishedAt)}

                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* »нформаци€ об авторе */}

            {!pet.isArchived && (

              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

                <h2 className="typo-h2 mb-4">{t.pet.contacts}</h2>

                <div className="mb-6 flex items-center gap-3">

                  <img

                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pet.authorName)}&size=48`}

                    alt=""

                    className="size-12 rounded-full object-cover"

                  />

                  <div>

                    <Link

                      to={`/user/${pet.authorId}`}

                      className="font-medium text-foreground transition-colors hover:text-primary"

                    >

                      {pet.authorName}

                    </Link>

                    <div className="text-sm text-muted-foreground">{t.petDetail.authorSubtitle}</div>

                  </div>

                </div>

                <div className="space-y-3">

                  {pet.contacts.phone && <RevealPhoneButton phone={pet.contacts.phone} />}

                  {pet.contacts.telegram && (

                    <Button

                      className={cn(

                        appMessengerCtaSizingClass,

                        'w-full border-0 bg-telegram text-white hover:bg-telegram-hover',

                      )}

                      asChild

                    >

                      <a

                        href={`https://t.me/${pet.contacts.telegram.replace('@', '')}`}

                        target="_blank"

                        rel="noopener noreferrer"

                      >

                        <Send className="size-5" aria-hidden />

                        {t.petDetail.writeTelegram}

                      </a>

                    </Button>

                  )}

                  {pet.contacts.viber && (

                    <Button

                      className={cn(

                        appMessengerCtaSizingClass,

                        'w-full border-0 bg-viber text-white hover:bg-viber-hover',

                      )}

                      asChild

                    >

                      <a href={`viber://chat?number=${pet.contacts.viber.replace('+', '')}`}>

                        <MessageCircle className="size-5" aria-hidden />

                        {t.profile.viber}

                      </a>

                    </Button>

                  )}

                </div>

                <div className="mt-6 border-t border-border pt-6">

                  <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>

                    <Link to={`/user/${pet.authorId}`}>{t.petDetail.viewAuthorAds}</Link>

                  </Button>

                </div>

              </div>

            )}

            {pet.isArchived && (

              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

                <div className="rounded-lg bg-muted/50 p-4 text-center">

                  <p className="mb-3 text-sm text-muted-foreground">{t.petDetail.contactsHiddenArchived}</p>

                  {archiveBadge && (

                    <div className="flex justify-center">

                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${archiveBadge.bgColor} ${archiveBadge.borderColor} ${archiveBadge.textColor}`}>

                        {archiveBadge.icon}

                        <span className="text-sm">{pet.archiveReason}</span>

                      </div>

                    </div>

                  )}

                </div>

              </div>

            )}

            {/*  онтакты */}

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

              <Button

                type="button"

                variant="ghost"

                size="lg"

                className="h-auto w-full gap-2 py-3 text-muted-foreground hover:text-destructive"

                onClick={handleReportPet}

              >

                <AlertCircle className="size-5" aria-hidden />

                {t.petDetail.report}

              </Button>

            </div>

          </div>

          </div>

        </div>

      </div>

      {showFlyerModal && (

        <div

          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"

          onClick={() => setShowFlyerModal(false)}

        >

          <div

            className="bg-white dark:bg-background rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-auto"

            onClick={(e) => e.stopPropagation()}

          >

            <div className="flex items-center justify-between mb-6">

              <h2 className="typo-h2">{t.petDetail.flyerModalTitle}</h2>

              <button

                onClick={() => setShowFlyerModal(false)}

                className="text-muted-foreground/80 hover:text-muted-foreground dark:hover:text-muted-foreground/50 transition-colors"

              >

                <X size={28} />

              </button>

            </div>

            <p className="text-muted-foreground mb-8">

              {t.petDetail.flyerModalIntro}

            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <button

                onClick={handleFlyerQR}

                className="group relative bg-gradient-to-br from-primary/10 to-white dark:from-orange-950/30 dark:to-background border-2 border-primary rounded-lg p-6 hover:shadow-xl transition-all duration-150 ease-in-out hover:scale-105 focus-within:ring-[3px] focus-within:ring-ring/50"

              >

                <div className="flex flex-col items-center text-center">

                  <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">

                    <QrCode size={40} className="text-white" />

                  </div>

                  <h3 className={`${typoH3} mb-2`}>{t.petDetail.flyerWithQR}</h3>

                  <p className="text-muted-foreground text-sm mb-4">

                    {t.petDetail.flyerWithQRDesc}

                  </p>

                  <div className="flex items-center gap-2 text-primary font-medium">

                    <Download size={18} />

                    {t.petDetail.flyerDownload}

                  </div>

                </div>

                <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-1 rounded-full">

                  {t.petDetail.flyerRecommended}

                </div>

              </button>

              <button

                onClick={handleFlyerClassic}

                className="group relative bg-white dark:bg-card border-2 border-border rounded-lg p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-105"

              >

                <div className="flex flex-col items-center text-center">

                  <div className="w-20 h-20 bg-muted group-hover:bg-primary-surface dark:group-hover:bg-orange-950/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all">

                    <FileText size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />

                  </div>

                  <h3 className={`${typoH3} mb-2`}>{t.petDetail.flyerClassic}</h3>

                  <p className="text-muted-foreground text-sm mb-4">

                    {t.petDetail.flyerClassicDesc}

                  </p>

                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary font-medium transition-colors">

                    <Download size={18} />

                    {t.petDetail.flyerDownload}

                  </div>

                </div>

              </button>

            </div>

            <div className="mt-6 pt-6 border-t border-border">

              <div className="flex items-start gap-3 text-sm text-muted-foreground">

                <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-primary" />

                <p>{t.petDetail.flyerHint}</p>

              </div>

            </div>

          </div>

        </div>

      )}

      {instagramGuide && (

        <div

          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"

          role="dialog"

          aria-modal="true"

          aria-labelledby="instagram-guide-title"

          onClick={() => { if (instagramGuide.cardUrl) URL.revokeObjectURL(instagramGuide.cardUrl); setInstagramGuide(null); }}

        >

          <div

            className="bg-white dark:bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border"

            onClick={(e) => e.stopPropagation()}

          >

            <div className="p-6">

              <div className="flex justify-between items-start gap-4 mb-4">

                <h2

                  id="instagram-guide-title"

                  className="typo-h1 pr-2"

                >

                  {t.petDetail.shareInstagramModalTitle}

                </h2>

                <button

                  type="button"

                  onClick={() => { if (instagramGuide.cardUrl) URL.revokeObjectURL(instagramGuide.cardUrl); setInstagramGuide(null); }}

                  className="p-1 rounded-lg text-muted-foreground/80 hover:text-muted-foreground dark:hover:text-muted-foreground/50 hover:bg-muted shrink-0"

                  aria-label={t.common.close}

                >

                  <X size={22} />

                </button>

              </div>

              <p className="text-sm text-muted-foreground mb-4">

                {t.petDetail.shareInstagramModalExplain}

              </p>

              <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90 mb-4">

                <li>{t.petDetail.shareInstagramModalStep1}</li>

                <li>{t.petDetail.shareInstagramModalStep2}</li>

                <li>

                  {instagramGuide.variant === 'story'

                    ? t.petDetail.shareInstagramModalStep3Story

                    : t.petDetail.shareInstagramModalStep3Post}

                </li>

              </ol>

              {instagramGuide.variant !== 'story' && (

                <>

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">

                    {t.petDetail.shareInstagramModalCaptionLabel}

                  </p>

                  <textarea

                    readOnly

                    rows={4}

                    value={shareBundle.textFull}

                    className="w-full text-sm border border-border dark:border-border rounded-lg p-3 bg-muted/50 dark:bg-muted/50 text-foreground dark:text-foreground resize-y min-h-[80px]"

                    onFocus={(e) => e.target.select()}

                  />

                  <button

                    type="button"

                    className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg border border-border dark:border-border text-sm font-medium text-foreground/90 dark:text-foreground hover:bg-muted/50"

                    onClick={async () => {

                      if (await copyToClipboard(shareBundle.textFull)) {

                        toast.success(t.petDetail.shareCopiedFull);

                      } else toast.error(t.common.error);

                    }}

                  >

                    <Copy className="w-4 h-4" />

                    {t.petDetail.shareInstagramModalCopyText}

                  </button>

                </>

              )}

              {instagramGuide.cardUrl ? (

                <div className="mt-5 pt-5 border-t border-border">

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">

                    {t.petDetail.shareCardSection}

                  </p>

                  <img

                    src={instagramGuide.cardUrl}

                    alt="Card preview"

                    className="w-full rounded-lg border border-border mb-3"

                  />

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">

                    <button

                      type="button"

                      className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted dark:hover:bg-muted/80"

                      onClick={() => {

                        if (!instagramGuide.cardUrl) return;

                        const a = document.createElement('a');

                        a.href = instagramGuide.cardUrl;

                        a.download = `dorogadomoy-${pet.id}-${instagramGuide.variant === 'story' ? 'story' : 'feed'}.png`;

                        a.click();

                        toast.success(t.petDetail.shareCardSaved);

                      }}

                    >

                      <Download className="w-4 h-4" />

                      {t.petDetail.shareCardDownloadBtn}

                    </button>

                  </div>

                </div>

              ) : null}

              <div className="mt-6 flex flex-col sm:flex-row gap-2">

                <button

                  type="button"

                  className="flex-1 h-12 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white text-sm font-semibold hover:opacity-95 transition-opacity"

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

                  className="flex-1 h-12 rounded-lg border border-border dark:border-border text-sm font-medium text-foreground/90 dark:text-foreground hover:bg-muted/50"

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

      )}

      {reportingPetId && (

        <ReportModal

          onClose={() => setReportingPetId(null)}

          onSubmit={handleSubmitReport}

        />

      )}

      {pet && !isShelterPet && (

        <SightingForm

          pet={pet}

          open={showSightingForm}

          onClose={() => setShowSightingForm(false)}

          onSuccess={() => {

            sightingsApi

              .listByPet(pet.id, 7)

              .then(setSightings)

              .catch((err: unknown) => {

                console.warn('[PetDetailPage] sightings refresh after sighting failed', err);

              });

            toast.success(t.petDetail.sightingSuccess);

          }}

        />

      )}

    </>

  );

}
