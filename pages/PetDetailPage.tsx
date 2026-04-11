import { useParams, Link } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, MessageCircle, Calendar, Share2, Download, ChevronLeft, ChevronRight, User, Eye, AlertCircle, X, QrCode, FileText, Home, Heart, Building2, ArrowLeft, Send, Copy, Check, Printer, Image } from 'lucide-react';
import { Pet } from '../types/pet';
import { formatDate } from '../utils/pet-helpers';
import { toast } from 'sonner';
import { petsApi, reportsApi, sightingsApi, type SightingItem, API_BASE } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { ReportModal } from '../components/report-modal';
import { SightingForm } from '../components/SightingForm';
import { ReportReason } from '../types/admin';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildPetShareBundle, type PetShareDict } from '../utils/pet-share-text';
import { copyText as copyToClipboard } from '../utils/copy-text';
import { compressImageBlobForShare, tryShareImageFile } from '../utils/web-share-image';
import {
  applySeo,
  canonicalUrlFromPath,
  getSiteOrigin,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '../utils/seo';

const PRINT_PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">' +
      '<rect width="800" height="600" fill="#f3f4f6"/>' +
      '<path d="M210 390l90-102 116 128 86-74 98 118H210z" fill="#d1d5db"/>' +
      '<circle cx="318" cy="214" r="42" fill="#d1d5db"/>' +
    '</svg>'
  );

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
    comment.textContent = `${trimmed}${sighting.comment.length > 80 ? '…' : ''}`;
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

    const colors: Record<string, string> = {
      searching: '#ef4444',
      found: '#3b82f6',
    };
    const color = colors[pet.status] || '#6b7280';
    const symbol = pet.animalType === 'cat' ? '🐱' : pet.animalType === 'dog' ? '🐕' : '🐾';

    const petIcon = L.divIcon({
      html: `<div style="background-color:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:20px">${symbol}</div>`,
      className: 'custom-marker-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    L.marker([pet.location.lat, pet.location.lng], { icon: petIcon }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, [pet]);

  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    sightings.forEach((s) => {
      const icon = L.divIcon({
        html: `<div style="background:#f59e0b;width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:12px">👁</div>`,
        className: 'custom-marker-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const m = L.marker([s.location_lat, s.location_lng], { icon }).addTo(markersLayerRef.current!);
      m.bindPopup(createSightingPopupContent(seenLabel, s));
    });
  }, [sightings, seenLabel]);

  return (
    <div ref={mapContainerRef} className="h-full w-full z-0" />
  );
}

function ImageCarousel({ photos, alt }: { photos: string[]; alt: string }) {
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
          alt={photos.length > 1 ? `${alt} — фото ${current + 1}` : alt}
          className="w-full h-full object-contain"
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={() => goTo(current - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
            <button
              onClick={() => goTo(current + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? 'bg-[#FF9800] w-6' : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="p-4 flex gap-2 overflow-x-auto">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? 'border-[#FF9800]' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <img src={src} alt={`${alt} — миниатюра ${i + 1}`} className="w-full h-full object-cover" />
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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    setPet(null);
    petsApi
      .get(id)
      .then(setPet)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (loading || !id) return;
    if (error || !pet) {
      applySeo({
        title: 'Объявление не найдено | DorogaDomoy.by',
        description:
          'Объявление удалено или не существует. Поиск пропавших и найденных питомцев на DorogaDomoy.by.',
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
    const title = `${headline} — ${animal}${breedPart}, ${pet.city} | DorogaDomoy.by`;
    const description = truncateMetaDescription(`${headline}. ${animal}, ${pet.city}. ${pet.description}`);
    applySeo({
      title,
      description,
      canonicalUrl: `${getSiteOrigin()}/pet/${pet.id}`,
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [pet, locale]);

  useEffect(() => {
    if (!showShareMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  useEffect(() => {
    if (!pet || pet.isArchived || pet.status !== 'searching') return;
    sightingsApi.listByPet(pet.id).then(setSightings).catch(() => setSightings([]));
  }, [pet?.id, pet?.isArchived, pet?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{t.petDetail.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">Объявление не найдено</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            К сожалению, это объявление не существует или было удалено.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center h-12 px-6 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const getArchiveReasonBadge = () => {
    if (!pet.isArchived || !pet.archiveReason) return null;

    let icon = null;
    let bgColor = 'bg-green-50 dark:bg-green-900/20';
    let textColor = 'text-green-700 dark:text-green-400';
    let borderColor = 'border-green-200 dark:border-green-800';

    if (pet.archiveReason.includes('вернулся домой') || pet.archiveReason.includes('найден хозяин')) {
      icon = <Home className="w-4 h-4" />;
    } else if (pet.archiveReason.includes('пристроен')) {
      icon = <Heart className="w-4 h-4" />;
      bgColor = 'bg-pink-50 dark:bg-pink-900/20';
      textColor = 'text-pink-700 dark:text-pink-400';
      borderColor = 'border-pink-200 dark:border-pink-800';
    } else if (pet.archiveReason.includes('приют')) {
      icon = <Building2 className="w-4 h-4" />;
      bgColor = 'bg-green-50 dark:bg-green-900/20';
      textColor = 'text-green-700 dark:text-green-400';
      borderColor = 'border-gray-200 dark:border-gray-700';
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
      setTimeout(() => setCopiedKind(null), 2500);
    } else toast.error(t.common.error);
    setShowShareMenu(false);
  };

  const handleCopyLinkOnly = async () => {
    if (await copyToClipboard(shareBundle.url)) {
      toast.success(t.petDetail.shareCopiedLink);
      setCopiedKind('link');
      setTimeout(() => setCopiedKind(null), 2500);
    } else toast.error(t.common.error);
    setShowShareMenu(false);
  };

  const fetchCardBlob = async (format: 'feed' | 'story'): Promise<Blob | null> => {
    try {
      const url = `${API_BASE}/pets/${pet.id}/social-card?format=${format}&lang=${locale}&contacts=1&_=${Date.now()}`;
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

    await copyToClipboard(shareBundle.textFull);

    const meta = {
      text: shareBundle.textFull,
      url: shareBundle.url,
      title: shareBundle.vkTitle,
    };

    let out: 'shared' | 'aborted' | 'unavailable' = 'unavailable';

    if (cardFormat === 'story') {
      const jpeg = await compressImageBlobForShare(blob);
      if (jpeg) {
        out = await tryShareImageFile(jpeg, `dorogadomoy-${pet.id}-story.jpg`, meta);
      }
      if (out === 'unavailable') {
        const jpegSmall = await compressImageBlobForShare(blob, {
          maxLongSide: 720,
          maxSizeBytes: 1_200_000,
        });
        if (jpegSmall) {
          out = await tryShareImageFile(jpegSmall, `dorogadomoy-${pet.id}-story.jpg`, meta);
        }
      }
      if (out === 'unavailable') {
        out = await tryShareImageFile(blob, `dorogadomoy-${pet.id}-story.png`, meta);
      }
    } else {
      out = await tryShareImageFile(blob, `dorogadomoy-${pet.id}-feed.png`, meta);
    }

    if (out === 'shared') {
      toast.success(t.petDetail.shareInstagramSystemOk, {
        description: t.petDetail.shareInstagramSystemOkDesc,
        duration: 9000,
      });
      return;
    }
    if (out === 'aborted') return;

    const cardUrl = URL.createObjectURL(blob);
    setInstagramGuide({ variant, openPath, cardUrl });
  };

  const handleShareInstagramPost = () => void finishInstagramShare('post', '/');

  const handleShareInstagramStory = () => void finishInstagramShare('story', '/');

  const petUrl = shareBundle.url;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(petUrl)}`;
  const safePhotoUrl = getSafeImageUrl(pet.photos[0]);
  const flyerIsLost = pet.status === 'searching';
  /** «Пропал» — фирменный оранжевый как на сайте (#FF9800); «найден» — зелёный. */
  const flyerAccent = flyerIsLost ? '#FF9800' : '#166534';
  const flyerAccentSoft = flyerIsLost ? '#FFF8F0' : '#ecfdf5';
  const flyerAccentBorder = flyerIsLost ? '#FFCC80' : '#86efac';

  const flyerTitle = escapeHtml(flyerIsLost ? t.petDetail.lostPet : t.petDetail.foundPet);
  const flyerSubtitle = escapeHtml(`${pet.city} · ${t.pet.animalType[pet.animalType]}`);
  const flyerLocationLine = escapeHtml(`${t.pet.location}: ${pet.city}`);
  const flyerBreed = escapeHtml(pet.breed || t.pet.notSpecified);
  const flyerColors = escapeHtml(pet.colors.map(c => t.pet.color[c]).join(', '));
  const flyerGender = escapeHtml(t.pet.gender[pet.gender]);
  const flyerAge = pet.approximateAge ? escapeHtml(pet.approximateAge) : null;
  const flyerDescription = escapeHtml(pet.description);
  const flyerContactPhone = escapeHtml(pet.contacts.phone || t.petDetail.seeContacts);
  const flyerAuthorName = escapeHtml(pet.authorName);
  const qrLabel = escapeHtml(t.petDetail.moreOnSite);
  const callAnytimeLabel = escapeHtml(t.petDetail.callAnytime);
  const flyerDocTitle = escapeHtml(`DorogaDomoy.by — ${pet.city}`);
  const flyerLang = escapeHtml(locale);

  const flyerCommonStyles = `
    :root {
      --accent: ${flyerAccent};
      --accent-soft: ${flyerAccentSoft};
      --accent-border: ${flyerAccentBorder};
      --ink: #111827;
      --muted: #4b5563;
      --line: #e5e7eb;
    }
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 15px; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      background: #f3f4f6;
      padding: 18px 14px 28px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }
    .sheet {
      max-width: 720px;
      margin: 0 auto;
      background: #fff;
      border-radius: 14px;
      padding: 26px 28px 30px;
      border: 1px solid var(--line);
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
    }
    @media print {
      body { background: #fff !important; padding: 0; }
      html { font-size: 12.5px; }
      .sheet {
        box-shadow: none !important;
        border: none !important;
        border-radius: 0;
        max-width: none;
        padding: 0;
      }
      .sheet, .flyer-header, .photo-frame, .info-grid, .description, .contact-box, .contact-qr {
        page-break-inside: avoid;
      }
      .flyer-header {
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom-width: 3px;
      }
      .brand-strip { font-size: 8px; margin-bottom: 4px; letter-spacing: 0.14em; }
      .title { font-size: 24px !important; letter-spacing: -0.01em; }
      .subtitle { font-size: 12.5px; margin-top: 4px; }
      .loc-line { font-size: 11.5px; margin-top: 3px; }
      .photo-frame {
        height: 168px !important;
        min-height: 0 !important;
        margin-bottom: 8px;
        border-radius: 8px;
      }
      .info-grid { font-size: 12px; gap: 5px 12px; margin-bottom: 8px; }
      .label { font-size: 8.5px; margin-bottom: 1px; }
      .description {
        font-size: 11px;
        line-height: 1.32;
        padding: 8px 10px;
        margin-bottom: 9px;
        max-height: 68mm;
        overflow: hidden;
      }
      .contact-box, .contact-qr {
        padding: 10px 12px;
        border-radius: 10px;
        border-width: 2px;
      }
      .contact-qr { gap: 10px 14px; }
      .contact-label { font-size: 10.5px; margin-bottom: 3px; }
      .phone { font-size: 21px !important; margin: 4px 0; letter-spacing: 0.02em; }
      .author-line { font-size: 12.5px; margin-top: 2px; }
      .contact-qr .qr img { width: 100px !important; height: 100px !important; }
      .contact-qr .qr-label { font-size: 9px; margin-top: 4px; max-width: 110px; }
      .footer { margin-top: 6px; padding-top: 5px; font-size: 9px; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    .flyer-header {
      text-align: center;
      padding-bottom: 10px;
      margin-bottom: 12px;
      border-bottom: 3px solid var(--accent);
    }
    .brand-strip {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.18em;
      color: var(--muted);
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .title {
      font-size: clamp(22px, 5vw, 34px);
      font-weight: 900;
      color: var(--accent);
      line-height: 1.05;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 15px;
      font-weight: 700;
      margin-top: 6px;
      color: var(--ink);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .loc-line {
      font-size: 14px;
      margin-top: 5px;
      color: var(--muted);
      font-weight: 600;
    }
    .photo-frame {
      text-align: center;
      margin-bottom: 12px;
      min-height: 200px;
      height: clamp(200px, 32vh, 280px);
      background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%);
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 18px;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .label {
      font-weight: 700;
      color: var(--muted);
      font-size: 11px;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .value { font-weight: 600; color: var(--ink); }
    .description {
      font-size: 13.5px;
      line-height: 1.38;
      margin-bottom: 12px;
      padding: 10px 12px;
      background: var(--accent-soft);
      border-left: 4px solid var(--accent);
      border-radius: 0 8px 8px 0;
      white-space: pre-wrap;
    }
    .contact-box {
      text-align: center;
      border: 2px solid var(--accent);
      padding: 14px 14px;
      border-radius: 12px;
      background: #fafafa;
    }
    .contact-qr {
      display: flex;
      align-items: stretch;
      flex-wrap: wrap;
      justify-content: center;
      gap: 14px 18px;
      border: 2px solid var(--accent);
      padding: 14px 16px;
      border-radius: 12px;
      background: #fafafa;
    }
    .contact-qr .left {
      flex: 1 1 200px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }
    .contact-qr .qr { flex: 0 0 auto; text-align: center; }
    .contact-qr .qr img {
      width: 112px;
      height: 112px;
      display: block;
      margin: 0 auto;
      border-radius: 8px;
      border: 1px solid var(--line);
    }
    .contact-qr .qr-label {
      font-size: 11px;
      color: var(--muted);
      margin-top: 6px;
      font-weight: 600;
      max-width: 140px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.25;
    }
    .contact-label {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 4px;
      color: var(--ink);
      letter-spacing: 0.04em;
    }
    .phone {
      font-size: clamp(22px, 6vw, 32px);
      font-weight: 900;
      margin: 4px 0;
      letter-spacing: 0.03em;
      color: var(--accent);
      font-variant-numeric: tabular-nums;
      word-break: break-all;
    }
    .author-line {
      font-size: 15px;
      font-weight: 700;
      color: var(--ink);
      margin-top: 3px;
    }
    .footer {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid var(--line);
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      font-weight: 600;
    }
  `;

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

  const flyerHeaderBody = `
    <header class="flyer-header">
      <div class="brand-strip">DorogaDomoy.by</div>
      <h1 class="title">${flyerTitle}</h1>
      <div class="subtitle">${flyerSubtitle}</div>
      <div class="loc-line">${flyerLocationLine}</div>
    </header>
    <div class="photo-frame">
      <img src="${safePhotoUrl}" class="photo" alt="" decoding="async" loading="eager" />
    </div>
    <div class="info-grid">
      <div><div class="label">${escapeHtml(t.pet.breedLabel)}</div><div class="value">${flyerBreed}</div></div>
      <div><div class="label">${escapeHtml(t.pet.colorLabel)}</div><div class="value">${flyerColors}</div></div>
      <div><div class="label">${escapeHtml(t.pet.genderLabel)}</div><div class="value">${flyerGender}</div></div>
      ${flyerAge ? `<div><div class="label">${escapeHtml(t.pet.ageLabel)}</div><div class="value">${flyerAge}</div></div>` : ''}
    </div>
    <div class="description">${flyerDescription}</div>
  `;

  const openFlyer = (html: string) => {
    // Нельзя передавать noopener в windowFeatures: тогда window.open возвращает null (спецификация),
    // и document.write не выполняется — листовка «не скачивается» / не открывается.
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
      ${flyerHeaderBody}
      <div class="contact-box">
        <div class="contact-label">${callAnytimeLabel}</div>
        <div class="phone">${flyerContactPhone}</div>
        <div class="author-line">${flyerAuthorName}</div>
      </div>
      <div class="footer">DorogaDomoy.by</div>
    `.trim()),
    );
  };

  const handleFlyerQR = () => {
    setShowFlyerModal(false);
    openFlyer(
      buildFlyerDocument(`
      ${flyerHeaderBody}
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
      <div class="footer">DorogaDomoy.by</div>
    `.trim()),
    );
  };

  const handleReportPet = () => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы пожаловаться на объявление');
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
      toast.success('Жалоба отправлена', {
        description: 'Модератор рассмотрит её в ближайшее время',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка отправки жалобы');
    }
  };

  const statusBg = pet.status === 'searching'
    ? 'bg-primary/10 border-primary/30 dark:bg-red-900/20 dark:border-red-800'
    : 'bg-green-100 border-green-200';

  const statusText = pet.status === 'searching'
    ? 'text-primary font-medium dark:text-red-400'
    : 'text-green-700 font-medium';

  const canAddSighting = pet.status === 'searching' && !pet.isArchived
    && !(currentUser && (pet.authorId === currentUser.id || (currentUser.id === 'user-demo' && pet.authorId === 'current-user')));

  const dateStr = pet.publishedAt.toISOString().slice(0, 10);
  const daysAgo = Math.floor((Date.now() - pet.publishedAt.getTime()) / 86400000);
  const daysAgoText =
    daysAgo === 0 ? 'сегодня' : daysAgo === 1 ? '1 день назад' : daysAgo < 5 ? `${daysAgo} дня назад` : `${daysAgo} дней назад`;

  return (
    <>
    <div className="min-h-screen bg-gray-50 dark:bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-[#FF9800] transition-colors"
          >
            <ChevronLeft size={20} />
            Вернуться к объявлениям
          </Link>
        </div>

        {/* Alert Banner */}
        {pet.status === 'searching' && !pet.isArchived && (
          <div className="bg-[#FFF4E5] border-2 border-[#FF9800] rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={24} className="text-[#FF9800] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#FF9800] font-bold mb-1">ВНИМАНИЕ! Этого питомца ищут!</p>
              <p className="text-gray-700 dark:text-gray-300">
                Помогите найти потерявшееся животное. Если вы видели его, пожалуйста, свяжитесь с владельцем.
              </p>
            </div>
          </div>
        )}

        {pet.status === 'found' && !pet.isArchived && (
          <div className="bg-[#E8F5E9] border-2 border-[#4CAF50] rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={24} className="text-[#4CAF50] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#4CAF50] font-bold mb-1">Найдено животное!</p>
              <p className="text-gray-700 dark:text-gray-300">
                Это животное было найдено. Если это ваш питомец, пожалуйста, свяжитесь с нашедшим.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-lg">
              <ImageCarousel photos={pet.photos} alt={t.pet.animalType[pet.animalType]} />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 h-12 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg"
            >
              <Share2 className="w-5 h-5" />
              {t.petDetail.shareAdButton}
            </button>

            {showShareMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden max-h-[min(70vh,520px)] overflow-y-auto">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-card z-10">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.petDetail.share}</span>
                  <button type="button" onClick={() => setShowShareMenu(false)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded-lg"><X className="w-4 h-4 text-gray-400 dark:text-gray-500" /></button>
                </div>

                <div className="py-1">
                  <button type="button" onClick={handleShareTelegram} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2AABEE]/10 shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-[#2AABEE]" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t.petDetail.shareTelegram}</span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <div className="px-4 py-1.5"><span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.petDetail.shareInstagramSection}</span></div>

                  <button type="button" onClick={handleShareInstagramPost} disabled={cardLoading !== null} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left disabled:opacity-50">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shrink-0">
                      <Image className="w-4 h-4" aria-hidden />
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {cardLoading === 'feed' ? t.petDetail.shareCardDownloading : t.petDetail.shareInstagramPost}
                    </span>
                  </button>

                  <button type="button" onClick={handleShareInstagramStory} disabled={cardLoading !== null} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left disabled:opacity-50">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shrink-0">
                      <Image className="w-4 h-4" aria-hidden />
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {cardLoading === 'story' ? t.petDetail.shareCardDownloading : t.petDetail.shareInstagramStory}
                    </span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                  <button type="button" onClick={handleCopyPostText} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 shrink-0">
                      {copiedKind === 'full' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t.petDetail.shareCopyFull}</span>
                  </button>

                  <button type="button" onClick={handleCopyLinkOnly} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 shrink-0">
                      {copiedKind === 'link' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t.petDetail.shareCopyLinkOnly}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => setShowFlyerModal(true)}
              className="w-full flex items-center justify-center gap-2 h-12 bg-white border-2 border-[#FF9800] text-[#FF9800] rounded-lg hover:bg-orange-50 transition-colors font-medium text-lg dark:bg-gray-900 dark:border-[#FF9800] dark:text-[#FF9800] dark:hover:bg-orange-950/30"
            >
              <Download className="w-5 h-5" />
              {t.petDetail.downloadFlyer}
            </button>
          </div>
        </div>

            {/* Description - inside left column */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-4">{t.pet.description}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{pet.description}</p>
            </div>

            {/* Map Section */}
            <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin size={24} className="text-[#FF9800]" />
                  <h2 className="text-2xl font-bold text-black dark:text-white">{t.pet.location}</h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 ml-9">{pet.city}</p>
              </div>
              {canAddSighting && pet.status === 'searching' && !pet.isArchived && (
                <div className="p-6 bg-orange-50 dark:bg-orange-950/20 border-b border-gray-200 dark:border-gray-200">
                  <button
                    onClick={() => setShowSightingForm(true)}
                    className="w-full h-12 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg mb-3"
                  >
                    {t.petDetail.sawSimilar}
                  </button>
                  <p className="text-gray-600 dark:text-gray-400 text-center">{t.petDetail.sightingHintForVisitors.replace(/^\s*\u{1F441}\s*/u, '')}</p>
                </div>
              )}
              <div className="h-96">
                <SinglePetMap pet={pet} sightings={sightings} seenLabel={t.sightings.seenLabel} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Информация о животном */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-6">{t.pet.information}</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Статус</div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    pet.status === 'searching' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {pet.status === 'searching' ? 'Потеряно' : 'Найдено'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t.pet.animalTypeLabel || 'Тип животного'}</div>
                  <div className="font-medium text-black dark:text-white">{t.pet.animalType[pet.animalType]}</div>
                </div>
                {pet.breed && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t.pet.breedLabel}</div>
                    <div className="font-medium text-black dark:text-white">{pet.breed}</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t.pet.colorLabel}</div>
                  <div className="flex flex-wrap gap-2">
                    {pet.colors.map((c) => (
                      <span key={c} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {t.pet.color[c]}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t.pet.genderLabel}</div>
                  <div className="font-medium text-black dark:text-white">{t.pet.gender[pet.gender]}</div>
                </div>
                {pet.approximateAge && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t.pet.ageLabel}</div>
                    <div className="font-medium text-black dark:text-white">{pet.approximateAge}</div>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-[18px] h-[18px] flex-shrink-0" />
                    <span>{pet.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-[18px] h-[18px] flex-shrink-0" />
                    <span>{formatDate(pet.publishedAt)} {daysAgo > 0 && `(${daysAgoText})`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Контактная информация */}
            {!pet.isArchived && (
              <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-black dark:text-white mb-4">{t.pet.contacts}</h2>
                <div className="flex items-center gap-3 mb-6">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pet.authorName)}&size=48`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <Link to={`/user/${pet.authorId}`} className="font-medium text-black dark:text-white hover:text-[#FF9800] transition-colors">
                      {pet.authorName}
                    </Link>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Автор объявления</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {pet.contacts.phone && (
                    <a
                      href={`tel:${pet.contacts.phone}`}
                      className="flex items-center justify-center gap-2 w-full h-12 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg"
                    >
                      <Phone className="w-5 h-5" />
                      {pet.contacts.phone}
                    </a>
                  )}
                  {pet.contacts.telegram && (
                    <a
                      href={`https://t.me/${pet.contacts.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-12 bg-[#0088cc] text-white rounded-lg hover:bg-[#006699] transition-colors font-medium text-lg"
                    >
                      <Send className="w-5 h-5" />
                      Написать в Telegram
                    </a>
                  )}
                  {pet.contacts.viber && (
                    <a
                      href={`viber://chat?number=${pet.contacts.viber.replace('+', '')}`}
                      className="flex items-center justify-center gap-2 w-full h-12 bg-[#7360f2] text-white rounded-lg hover:bg-[#5a4dd4] transition-colors font-medium text-lg"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {t.profile.viber}
                    </a>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to={`/user/${pet.authorId}`}
                    className="flex items-center justify-center w-full h-12 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-lg"
                  >
                    Все объявления автора
                  </Link>
                </div>
              </div>
            )}

            {pet.isArchived && (
              <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-lg">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t.petDetail.contactsHiddenArchived}</p>
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

            {/* Пожаловаться */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-lg">
              <button
                onClick={handleReportPet}
                className="flex items-center justify-center gap-2 w-full text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
                Пожаловаться на объявление
              </button>
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
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black dark:text-white">{t.petDetail.flyerModalTitle}</h2>
              <button
                onClick={() => setShowFlyerModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t.petDetail.flyerModalIntro}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={handleFlyerQR}
                className="group relative bg-gradient-to-br from-[#FFF4E5] to-white dark:from-orange-950/30 dark:to-gray-900 border-2 border-[#FF9800] rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-[#FF9800] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <QrCode size={40} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">{t.petDetail.flyerWithQR}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t.petDetail.flyerWithQRDesc}
                  </p>
                  <div className="flex items-center gap-2 text-[#FF9800] font-medium">
                    <Download size={18} />
                    {t.petDetail.flyerDownload}
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-[#FF9800] text-white text-xs px-2 py-1 rounded-full">
                  {t.petDetail.flyerRecommended}
                </div>
              </button>

              <button
                onClick={handleFlyerClassic}
                className="group relative bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl p-6 hover:border-[#FF9800] hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 group-hover:bg-[#FFF4E5] dark:group-hover:bg-orange-950/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                    <FileText size={40} className="text-gray-600 dark:text-gray-400 group-hover:text-[#FF9800] transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">{t.petDetail.flyerClassic}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t.petDetail.flyerClassicDesc}
                  </p>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 group-hover:text-[#FF9800] font-medium transition-colors">
                    <Download size={18} />
                    {t.petDetail.flyerDownload}
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-[#FF9800]" />
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
            className="bg-white dark:bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h2
                  id="instagram-guide-title"
                  className="text-xl font-bold text-gray-900 dark:text-white pr-2"
                >
                  {t.petDetail.shareInstagramModalTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => { if (instagramGuide.cardUrl) URL.revokeObjectURL(instagramGuide.cardUrl); setInstagramGuide(null); }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-muted shrink-0"
                  aria-label={t.common.close}
                >
                  <X size={22} />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t.petDetail.shareInstagramModalExplain}
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                <li>{t.petDetail.shareInstagramModalStep1}</li>
                <li>{t.petDetail.shareInstagramModalStep2}</li>
                <li>
                  {instagramGuide.variant === 'story'
                    ? t.petDetail.shareInstagramModalStep3Story
                    : t.petDetail.shareInstagramModalStep3Post}
                </li>
              </ol>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                {t.petDetail.shareInstagramModalCaptionLabel}
              </p>
              <textarea
                readOnly
                rows={4}
                value={shareBundle.textFull}
                className="w-full text-sm border border-gray-300 dark:border-border rounded-lg p-3 bg-gray-50 dark:bg-muted/50 text-gray-900 dark:text-gray-100 resize-y min-h-[80px]"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg border border-gray-300 dark:border-border text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-muted"
                onClick={async () => {
                  if (await copyToClipboard(shareBundle.textFull)) {
                    toast.success(t.petDetail.shareCopiedFull);
                  } else toast.error(t.common.error);
                }}
              >
                <Copy className="w-4 h-4" />
                {t.petDetail.shareInstagramModalCopyText}
              </button>
              {instagramGuide.cardUrl ? (
                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-border">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {t.petDetail.shareCardSection}
                  </p>
                  <img
                    src={instagramGuide.cardUrl}
                    alt="Card preview"
                    className="w-full rounded-lg border border-gray-200 dark:border-border mb-3"
                  />
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-gray-100 dark:bg-muted text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-muted/80"
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
                  className="flex-1 h-12 rounded-lg border border-gray-300 dark:border-border text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-muted"
                  onClick={() => setInstagramGuide(null)}
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

      {showSightingForm && pet && (
        <SightingForm
          pet={pet}
          onClose={() => setShowSightingForm(false)}
          onSuccess={() => {
            sightingsApi.listByPet(pet.id, 7).then(setSightings).catch(() => {});
            toast.success(t.petDetail.sightingSuccess);
          }}
        />
      )}
    </>
  );
}
