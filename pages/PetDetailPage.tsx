import { useParams, Link } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, MessageCircle, Calendar, Share2, Download, ChevronLeft, ChevronRight, User, Eye, AlertCircle, X, QrCode, FileText, Home, Heart, Building2, ArrowLeft, Send, Copy, Check, Printer } from 'lucide-react';
import { Pet } from '../types/pet';
import { formatDate } from '../utils/pet-helpers';
import { toast, Toaster } from 'sonner';
import { petsApi, reportsApi, sightingsApi, type SightingItem } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { ReportModal } from '../components/report-modal';
import { SightingForm } from '../components/SightingForm';
import { ReportReason } from '../types/admin';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
      const d = new Date(s.seen_at);
      const popup = `<div class="text-sm"><strong>${seenLabel}</strong> ${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}${s.comment ? `<br/>${s.comment.slice(0, 80)}${s.comment.length > 80 ? '…' : ''}` : ''}</div>`;
      m.bindPopup(popup);
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
              <ChevronRight className="w-5 h-5 text-gray-800 rotate-180" />
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
  const { theme } = useTheme();
  const { t } = useI18n();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportingPetId, setReportingPetId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [sightings, setSightings] = useState<SightingItem[]>([]);
  const [showSightingForm, setShowSightingForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    petsApi.get(id)
      .then(setPet)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

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

  const getShareUrl = () => window.location.href;
  const getShareText = () => {
    const animal = t.pet.animalType[pet.animalType];
    const status = pet.status === 'searching' ? 'Потерян' : 'Найден';
    const breed = pet.breed ? ` (${pet.breed})` : '';
    return `${status}: ${animal}${breed} — ${pet.city}. ${pet.description?.slice(0, 120) || ''}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
    } catch {
      const ta = document.createElement('textarea');
      ta.value = getShareUrl();
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setLinkCopied(true);
    toast.success('Ссылка скопирована');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`;
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareX = () => {
    const url = `https://x.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`;
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareInstagramDM = () => {
    const url = `https://ig.me/m?text=${encodeURIComponent(getShareText() + '\n' + getShareUrl())}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  const handleShareInstagramStory = () => {
    handleCopyLink();
    toast.info('Ссылка скопирована. Откройте Instagram, создайте Stories и вставьте ссылку-стикер.', { duration: 5000 });
    window.open('https://www.instagram.com/', '_blank');
    setShowShareMenu(false);
  };

  const handleShareInstagramPost = () => {
    handleCopyLink();
    toast.info('Ссылка скопирована. Откройте Instagram, создайте пост и вставьте ссылку в описание.', { duration: 5000 });
    window.open('https://www.instagram.com/', '_blank');
    setShowShareMenu(false);
  };

  const petUrl = `${window.location.origin}/pet/${pet.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(petUrl)}`;

  const flyerCommonStyles = `
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px 24px; max-width: 800px; margin: 0 auto; color: #000; }
    .header { text-align: center; border-bottom: 4px solid #ef4444; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 42px; font-weight: 900; color: #ef4444; line-height: 1; text-transform: uppercase; }
    .subtitle { font-size: 20px; font-weight: bold; margin-top: 6px; text-transform: uppercase; }
    .photo-container { text-align: center; margin-bottom: 16px; height: 340px; background: #f3f4f6; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .photo { max-width: 100%; max-height: 100%; object-fit: contain; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 14px; font-size: 18px; }
    .label { font-weight: bold; color: #666; font-size: 13px; margin-bottom: 2px; text-transform: uppercase; }
    .value { font-weight: 600; }
    .description { font-size: 17px; line-height: 1.4; margin-bottom: 16px; padding: 12px 14px; background: #fff1f2; border-left: 5px solid #ef4444; }
    .contact-box { border: 3px solid #000; padding: 16px; text-align: center; border-radius: 14px; }
    .contact-label { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
    .phone { font-size: 38px; font-weight: 900; margin: 6px 0; letter-spacing: 1px; }
    .footer { margin-top: 12px; text-align: center; font-size: 12px; color: #9ca3af; }
  `;

  const flyerHeaderBody = `
    <div class="header">
      <h1 class="title">${pet.status === 'searching' ? t.petDetail.lostPet : t.petDetail.foundPet}</h1>
      <div class="subtitle">${pet.city} · ${t.pet.animalType[pet.animalType]}</div>
    </div>
    <div class="photo-container">
      <img src="${pet.photos[0]}" class="photo" />
    </div>
    <div class="info-grid">
      <div><div class="label">${t.pet.breedLabel}</div><div class="value">${pet.breed || t.pet.notSpecified}</div></div>
      <div><div class="label">${t.pet.colorLabel}</div><div class="value">${pet.colors.map(c => t.pet.color[c]).join(', ')}</div></div>
      <div><div class="label">${t.pet.genderLabel}</div><div class="value">${t.pet.gender[pet.gender]}</div></div>
      ${pet.approximateAge ? `<div><div class="label">${t.pet.ageLabel}</div><div class="value">${pet.approximateAge}</div></div>` : ''}
    </div>
    <div class="description">${pet.description}</div>
  `;

  const openFlyer = (html: string) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  const handleFlyerClassic = () => {
    setShowFlyerModal(false);
    openFlyer(`<!DOCTYPE html><html><head><title>Листовка</title><style>${flyerCommonStyles}</style></head><body>
      ${flyerHeaderBody}
      <div class="contact-box">
        <div class="contact-label">${t.petDetail.callAnytime}</div>
        <div class="phone">${pet.contacts.phone || t.petDetail.seeContacts}</div>
        <div class="value">${pet.authorName}</div>
      </div>
      <div class="footer">DorogaDomoy.by</div>
      <script>window.onload = () => { setTimeout(() => window.print(), 500); }<\/script>
    </body></html>`);
  };

  const handleFlyerQR = () => {
    setShowFlyerModal(false);
    openFlyer(`<!DOCTYPE html><html><head><title>Листовка с QR</title><style>${flyerCommonStyles}
      .contact-qr { display: flex; align-items: center; gap: 20px; border: 3px solid #000; padding: 16px 20px; border-radius: 14px; }
      .contact-qr .left { flex: 1; text-align: center; }
      .contact-qr .qr { flex-shrink: 0; text-align: center; }
      .contact-qr .qr img { width: 140px; height: 140px; }
      .contact-qr .qr-label { font-size: 11px; color: #666; margin-top: 4px; }
    </style></head><body>
      ${flyerHeaderBody}
      <div class="contact-qr">
        <div class="left">
          <div class="contact-label">${t.petDetail.callAnytime}</div>
          <div class="phone">${pet.contacts.phone || t.petDetail.seeContacts}</div>
          <div class="value">${pet.authorName}</div>
        </div>
        <div class="qr">
          <img src="${qrUrl}" alt="QR" />
          <div class="qr-label">${t.petDetail.moreOnSite}</div>
        </div>
      </div>
      <div class="footer">DorogaDomoy.by</div>
      <script>window.onload = () => { setTimeout(() => window.print(), 800); }<\/script>
    </body></html>`);
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
              Поделиться объявлением
            </button>

            {showShareMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.petDetail.share}</span>
                  <button onClick={() => setShowShareMenu(false)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded-lg"><X className="w-4 h-4 text-gray-400 dark:text-gray-500" /></button>
                </div>

                <div className="py-1">
                  <button onClick={handleShareTelegram} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2AABEE]/10">
                      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-[#2AABEE]" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Telegram</span>
                  </button>

                  <button onClick={handleShareX} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-900 dark:text-white" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">X (Twitter)</span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <div className="px-4 py-1.5"><span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Instagram</span></div>

                  <button onClick={handleShareInstagramPost} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Пост</span>
                  </button>

                  <button onClick={handleShareInstagramStory} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Stories</span>
                  </button>

                  <button onClick={handleShareInstagramDM} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white">
                      <MessageCircle className="w-4 h-4" />
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Сообщение</span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                  <button onClick={() => { handleCopyLink(); setShowShareMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{linkCopied ? 'Скопировано!' : 'Копировать ссылку'}</span>
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
              Скачать листовку
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
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

      <Toaster theme={theme} />
    </>
  );
}
