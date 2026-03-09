import { useParams } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Phone, MessageCircle, Calendar, Share2, Printer, Home, Heart, Building2, AlertTriangle, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Pet } from '../types/pet';
import { animalTypeLabels, colorLabels, genderLabels, formatDate } from '../utils/pet-helpers';
import { toast, Toaster } from 'sonner';
import { petsApi, reportsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden">
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
    <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden group">
      <img
        src={photos[current]}
        alt={`${alt} — фото ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      <button
        onClick={() => goTo(current - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-5 h-5 text-gray-800" />
      </button>
      <button
        onClick={() => goTo(current + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-5 h-5 text-gray-800" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current
                ? 'bg-white scale-110 shadow-md'
                : 'bg-white/50 hover:bg-white/75'
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
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportingPetId, setReportingPetId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    petsApi.get(id)
      .then(setPet)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600">Загрузка объявления...</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-600 text-lg">Объявление не найдено</p>
        <a
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </a>
      </div>
    );
  }

  const getArchiveReasonBadge = () => {
    if (!pet.isArchived || !pet.archiveReason) return null;

    let icon = null;
    let bgColor = 'bg-green-50';
    let textColor = 'text-green-700';
    let borderColor = 'border-green-200';

    if (pet.archiveReason.includes('вернулся домой') || pet.archiveReason.includes('найден хозяин')) {
      icon = <Home className="w-4 h-4" />;
    } else if (pet.archiveReason.includes('пристроен')) {
      icon = <Heart className="w-4 h-4" />;
      bgColor = 'bg-pink-50';
      textColor = 'text-pink-700';
      borderColor = 'border-pink-200';
    } else if (pet.archiveReason.includes('приют')) {
      icon = <Building2 className="w-4 h-4" />;
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-700';
      borderColor = 'border-blue-200';
    }

    return { icon, bgColor, textColor, borderColor };
  };

  const archiveBadge = getArchiveReasonBadge();

  const handleContactClick = (url: string) => {
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Поиск питомца: ${animalTypeLabels[pet.animalType]} - ${pet.city}`;
    const text = pet.description;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      // Share API failed, try clipboard
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована в буфер обмена');
      return;
    } catch {
      // Clipboard API failed
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        toast.success('Ссылка скопирована в буфер обмена');
      } else {
        throw new Error('execCommand failed');
      }
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const handlePrintFlyer = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const flyerContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ПОИСК ПИТОМЦА - ${pet.animalType}</title>
          <style>
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
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${pet.status === 'searching' ? 'ПРОПАЛ ПИТОМЕЦ' : 'НАЙДЕН ПИТОМЕЦ'}</h1>
            <div class="subtitle">${pet.city} · ${animalTypeLabels[pet.animalType]}</div>
          </div>
          <div class="photo-container">
            <img src="${pet.photos[0]}" class="photo" />
          </div>
          <div class="info-grid">
            <div><div class="label">Порода</div><div class="value">${pet.breed || 'Не указана'}</div></div>
            <div><div class="label">Окрас</div><div class="value">${pet.colors.map(c => colorLabels[c]).join(', ')}</div></div>
            <div><div class="label">Пол</div><div class="value">${genderLabels[pet.gender]}</div></div>
            ${pet.approximateAge ? `<div><div class="label">Возраст</div><div class="value">${pet.approximateAge}</div></div>` : ''}
          </div>
          <div class="description">${pet.description}</div>
          <div class="contact-box">
            <div class="contact-label">Звоните в любое время</div>
            <div class="phone">${pet.contacts.phone || 'СМ. КОНТАКТЫ'}</div>
            <div class="value">${pet.authorName}</div>
          </div>
          <div class="footer">DorogaDomoy.by</div>
          <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(flyerContent);
    printWindow.document.close();
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
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">На главную</span>
          </a>

          <h1 className="text-lg text-gray-900 truncate px-4">
            {animalTypeLabels[pet.animalType]} {pet.breed && `· ${pet.breed}`}
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
        <ImageCarousel photos={pet.photos} alt={animalTypeLabels[pet.animalType]} />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleShare}
            className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Поделиться
          </button>
          <button
            onClick={handlePrintFlyer}
            className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Скачать листовку
          </button>
        </div>

        {/* Main info grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-xl text-gray-900 pb-3 border-b border-gray-100">
              Информация
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Тип животного</p>
                <p className="text-gray-900">{animalTypeLabels[pet.animalType]}</p>
              </div>
              {pet.breed && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Порода</p>
                  <p className="text-gray-900">{pet.breed}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Цвет</p>
                <p className="text-gray-900">{pet.colors.map(c => colorLabels[c]).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Пол</p>
                <p className="text-gray-900">{genderLabels[pet.gender]}</p>
              </div>
            </div>

            {pet.approximateAge && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Возраст</p>
                <p className="text-gray-900">{pet.approximateAge}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t border-gray-100">
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
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl text-gray-900 pb-3 border-b border-gray-100 mb-4">
                Описание
              </h2>
              <p className="text-gray-700 whitespace-pre-line">{pet.description}</p>
            </div>

            {/* Contacts */}
            {!pet.isArchived && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl text-gray-900 pb-3 border-b border-gray-100 mb-4">
                  Контакты
                </h2>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
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
                      <span>Telegram</span>
                    </button>
                  )}
                  {pet.contacts.viber && (
                    <button
                      onClick={() => handleContactClick(`viber://chat?number=${pet.contacts.viber!.replace('+', '')}`)}
                      className="flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Viber</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Archived notice */}
            {pet.isArchived && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-3">Это архивное объявление. Контакты скрыты.</p>
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl text-gray-900">Местоположение</h2>
              <span className="text-sm text-gray-500 ml-auto">{pet.city}</span>
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
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Пожаловаться на объявление
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

      <Toaster />
    </div>
  );
}
