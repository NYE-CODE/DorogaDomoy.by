import { useParams } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Phone, MessageCircle, Calendar, Share2, Printer, Home, Heart, Building2, AlertTriangle, ChevronLeft, ChevronRight, User, Copy, Check, X } from 'lucide-react';
import { Pet } from '../types/pet';
import { formatDate } from '../utils/pet-helpers';
import { toast, Toaster } from 'sonner';
import { petsApi, reportsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { ReportModal } from '../components/report-modal';
import { ReportReason } from '../types/admin';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function SinglePetMap({ pet }: { pet: Pet }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
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

      const icon = L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-size: 20px;
          ">
            ${symbol}
          </div>
        `,
        className: 'custom-marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([pet.location.lat, pet.location.lng], { icon }).addTo(map);
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pet]);

  return (
    <div ref={mapContainerRef} className="h-full w-full z-0" />
  );
}

function ImageCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);

  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
        <img
          src={photos[0]}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const goTo = (index: number) => {
    setCurrent((index + photos.length) % photos.length);
  };

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden group">
      <img
        src={photos[current]}
        alt={`${alt} — фото ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      <button
        onClick={() => goTo(current - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-5 h-5 text-gray-800 dark:text-gray-200" />
      </button>
      <button
        onClick={() => goTo(current + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-5 h-5 text-gray-800 dark:text-gray-200" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current
                ? 'bg-white dark:bg-gray-800 scale-110 shadow-md'
                : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/75 dark:hover:bg-gray-800/75'
            }`}
          />
        ))}
      </div>

      <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
        {current + 1} / {photos.length}
      </div>
    </div>
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [showFlyerMenu, setShowFlyerMenu] = useState(false);
  const flyerMenuRef = useRef<HTMLDivElement>(null);

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
    if (!showFlyerMenu) return;
    const close = (e: MouseEvent) => {
      if (flyerMenuRef.current && !flyerMenuRef.current.contains(e.target as Node)) setShowFlyerMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showFlyerMenu]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{t.petDetail.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t.petDetail.notFound}</p>
        <a
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.petDetail.toMain}
        </a>
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
      bgColor = 'bg-blue-50 dark:bg-blue-900/20';
      textColor = 'text-blue-700 dark:text-blue-400';
      borderColor = 'border-blue-200 dark:border-blue-800';
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
    setShowFlyerMenu(false);
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
    setShowFlyerMenu(false);
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
    ? 'bg-red-50 border-red-200'
    : 'bg-blue-50 border-blue-200';

  const statusText = pet.status === 'searching'
    ? 'text-red-700'
    : 'text-blue-700';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t.petDetail.toMain}</span>
          </a>

          <h1 className="text-lg text-gray-900 dark:text-white truncate px-4">
            {t.pet.animalType[pet.animalType]} {pet.breed && `· ${pet.breed}`}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Status banner */}
        <div className={`mb-6 px-4 py-3 rounded-xl border ${statusBg} flex items-center gap-3`}>
          <div className={`w-3 h-3 rounded-full ${pet.status === 'searching' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
          <span className={`${statusText}`}>
            {pet.status === 'searching' ? 'Этого питомца ищут — помогите найти!' : 'Этот питомец найден — ищем хозяина!'}
          </span>
        </div>

        {/* Image carousel */}
        <ImageCarousel photos={pet.photos} alt={t.pet.animalType[pet.animalType]} />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="relative flex-1 min-w-[180px]" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              {t.petDetail.share}
            </button>

            {showShareMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.petDetail.share}</span>
                  <button onClick={() => setShowShareMenu(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-4 h-4 text-gray-400 dark:text-gray-500" /></button>
                </div>

                <div className="py-1">
                  <button onClick={handleShareTelegram} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2AABEE]/10">
                      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-[#2AABEE]" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Telegram</span>
                  </button>

                  <button onClick={handleShareX} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-900 dark:text-white" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">X (Twitter)</span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <div className="px-4 py-1.5"><span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Instagram</span></div>

                  <button onClick={handleShareInstagramPost} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Пост</span>
                  </button>

                  <button onClick={handleShareInstagramStory} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Stories</span>
                  </button>

                  <button onClick={handleShareInstagramDM} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white">
                      <MessageCircle className="w-4 h-4" />
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Сообщение</span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                  <button onClick={() => { handleCopyLink(); setShowShareMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{linkCopied ? 'Скопировано!' : 'Копировать ссылку'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative flex-1 min-w-[180px]" ref={flyerMenuRef}>
            <button
              onClick={() => setShowFlyerMenu(!showFlyerMenu)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Скачать листовку
            </button>
            {showFlyerMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Выберите шаблон</span>
                </div>
                <button onClick={handleFlyerClassic} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0">
                    <Printer className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Классическая</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Фото, описание, контакты</p>
                  </div>
                </button>
                <button onClick={handleFlyerQR} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700">
                  <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor"><path d="M3 11h2v2H3v-2zm0-4h2v2H3V7zm4 4h2v2H7v-2zm0-4h2v2H7V7zm-4-4h6v6H3V3zm2 4h2V5H5v2zm8-4h6v6h-6V3zm2 4h2V5h-2v2zM3 13h6v6H3v-6zm2 4h2v-2H5v2zm8 0h2v2h-2v-2zm0-4h2v2h-2v-2zm4 4h2v2h-2v-2zm0-4h2v2h-2v-2zm4 0h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-8h2v2h-2V9zm4 0h2v2h-2V9z"/></svg>
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">С QR-кодом</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Фото, контакты + QR на объявление</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main info grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="text-xl text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-700">
              {t.pet.information}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Тип животного</p>
                <p className="text-gray-900 dark:text-white">{t.pet.animalType[pet.animalType]}</p>
              </div>
              {pet.breed && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Порода</p>
                  <p className="text-gray-900 dark:text-white">{pet.breed}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Цвет</p>
                <p className="text-gray-900 dark:text-white">{pet.colors.map(c => t.pet.color[c]).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Пол</p>
                <p className="text-gray-900 dark:text-white">{t.pet.gender[pet.gender]}</p>
              </div>
            </div>

            {pet.approximateAge && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Возраст</p>
                <p className="text-gray-900 dark:text-white">{pet.approximateAge}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{pet.city}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(pet.publishedAt)}</span>
              </div>
            </div>
          </div>

          {/* Right column: description + contacts */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                {t.pet.description}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{pet.description}</p>
            </div>

            {/* Contacts */}
            {!pet.isArchived && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                  {t.pet.contacts}
                </h2>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <a
                    href={`/user/${pet.authorId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    {pet.authorName}
                  </a>
                </div>

                <div className="flex flex-col gap-3">
                  {pet.contacts.phone && (
                    <button
                      onClick={() => handleContactClick(`tel:${pet.contacts.phone}`)}
                      className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      <span>{pet.contacts.phone}</span>
                    </button>
                  )}
                  {pet.contacts.telegram && (
                    <button
                      onClick={() => handleContactClick(`https://t.me/${pet.contacts.telegram!.replace('@', '')}`)}
                      className="flex items-center gap-3 px-4 py-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{t.profile.telegram}</span>
                    </button>
                  )}
                  {pet.contacts.viber && (
                    <button
                      onClick={() => handleContactClick(`viber://chat?number=${pet.contacts.viber!.replace('+', '')}`)}
                      className="flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{t.profile.viber}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Archived notice */}
            {pet.isArchived && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
          </div>
        </div>

        {/* Map section */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl text-gray-900 dark:text-white">{t.pet.location}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{pet.city}</span>
            </div>
            <div className="h-[300px] md:h-[400px]">
              <SinglePetMap pet={pet} />
            </div>
          </div>
        </div>

        {/* Report */}
        {!pet.isArchived && (
          <div className="mt-6 mb-8 text-center">
            <button
              onClick={handleReportPet}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              {t.petDetail.report}
            </button>
          </div>
        )}
      </div>

      {reportingPetId && (
        <ReportModal
          onClose={() => setReportingPetId(null)}
          onSubmit={handleSubmitReport}
        />
      )}

      <Toaster theme={theme} />
    </div>
  );
}
