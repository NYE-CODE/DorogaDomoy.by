import { X, MapPin, Phone, MessageCircle, Calendar, Share2, Printer, Home, Heart, Building2, AlertTriangle } from 'lucide-react';
import { Pet } from '../types/pet';
import { statusLabels, statusColors, animalTypeLabels, colorLabels, genderLabels, formatDate } from '../utils/pet-helpers';
import { toast } from 'sonner';
import { useScrollLock } from './ui/use-scroll-lock';

interface PetModalProps {
  pet: Pet | null;
  onClose: () => void;
  onReport?: (petId: string) => void;
  onAuthorClick?: (authorId: string) => void;
}

export function PetModal({ pet, onClose, onReport, onAuthorClick }: PetModalProps) {
  useScrollLock(!!pet);
  if (!pet) return null;

  // Get archive reason badge
  const getArchiveReasonBadge = () => {
    if (!pet.isArchived || !pet.archiveReason) return null;
    
    let icon = null;
    let bgColor = 'bg-green-50';
    let textColor = 'text-green-700';
    let borderColor = 'border-green-200';
    
    if (pet.archiveReason.includes('вернулся домой') || pet.archiveReason.includes('найден хозяин')) {
      icon = <Home className="w-4 h-4" />;
      bgColor = 'bg-green-50';
      textColor = 'text-green-700';
      borderColor = 'border-green-200';
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
    } catch (err) {
      console.log('Share API failed, trying clipboard');
    }

    // Try Clipboard API
    try {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована в буфер обмена');
        return;
    } catch (err) {
        console.log('Clipboard API failed, trying execCommand');
    }

    // Fallback: execCommand
    try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        
        // Ensure it's not visible but part of the DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
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
    } catch (err) {
        console.error('All copy methods failed', err);
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
            <div>
              <div class="label">Порода</div>
              <div class="value">${pet.breed || 'Не указана'}</div>
            </div>
            <div>
              <div class="label">Окрас</div>
              <div class="value">${pet.colors.map(c => colorLabels[c]).join(', ')}</div>
            </div>
            <div>
              <div class="label">Пол</div>
              <div class="value">${genderLabels[pet.gender]}</div>
            </div>
            ${pet.approximateAge ? `
            <div>
              <div class="label">Возраст</div>
              <div class="value">${pet.approximateAge}</div>
            </div>` : ''}
          </div>

          <div class="description">
            ${pet.description}
          </div>

          <div class="contact-box">
            <div class="contact-label">Звоните в любое время</div>
            <div class="phone">${pet.contacts.phone || 'СМ. КОНТАКТЫ'}</div>
            <div class="value">${pet.authorName}</div>
          </div>

          <div class="footer">DorogaDomoy.by</div>

          <script>
            window.onload = () => { setTimeout(() => window.print(), 500); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(flyerContent);
    printWindow.document.close();
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
          <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">
            {animalTypeLabels[pet.animalType]} {pet.breed && `· ${pet.breed}`}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Поделиться"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Photos */}
          <div className="mb-6">
            <div className="relative">
              <img 
                src={pet.photos[0]} 
                alt={animalTypeLabels[pet.animalType]}
                className="w-full h-80 object-cover rounded-lg"
              />
              <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg border ${statusColors[pet.status]} backdrop-blur-sm`}>
                {statusLabels[pet.status]}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-3 mb-8 pb-8 border-b border-gray-100">
             <button
              onClick={handlePrintFlyer}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Printer className="w-5 h-5" />
              Скачать листовку для печати
            </button>
          </div>

          {/* Info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Тип животного</p>
                <p className="font-medium text-gray-900">{animalTypeLabels[pet.animalType]}</p>
              </div>
              {pet.breed && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Порода</p>
                  <p className="font-medium text-gray-900">{pet.breed}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Цвет</p>
                <p className="font-medium text-gray-900">{pet.colors.map(c => colorLabels[c]).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Пол</p>
                <p className="font-medium text-gray-900">{genderLabels[pet.gender]}</p>
              </div>
            </div>

            {pet.approximateAge && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Возраст</p>
                <p className="font-medium text-gray-900">{pet.approximateAge}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-1">Описание</p>
              <p className="text-gray-900">{pet.description}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{pet.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(pet.publishedAt)}</span>
              </div>
            </div>
          </div>

          {/* Contacts */}
          {!pet.isArchived && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm text-gray-600">Контакты:</p>
                <button
                  onClick={() => onAuthorClick && onAuthorClick(pet.authorId)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {pet.authorName}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {pet.contacts.phone && (
                  <button
                    onClick={() => handleContactClick(`tel:${pet.contacts.phone}`)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {pet.contacts.phone}
                  </button>
                )}
                {pet.contacts.telegram && (
                  <button
                    onClick={() => handleContactClick(`https://t.me/${(pet.contacts.telegram ?? '').replace('@', '')}`)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Telegram
                  </button>
                )}
                {pet.contacts.viber && (
                  <button
                    onClick={() => handleContactClick(`viber://chat?number=${(pet.contacts.viber ?? '').replace('+', '')}`)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Viber
                  </button>
                )}
              </div>
            </div>
          )}

          {pet.isArchived && (
            <div className="border-t pt-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center mb-3">Это архивное объявление. Контакты скрыты.</p>
                {archiveBadge && (
                  <div className="flex justify-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${archiveBadge.bgColor} ${archiveBadge.borderColor} ${archiveBadge.textColor}`}>
                      {archiveBadge.icon}
                      <span className="text-sm font-medium">{pet.archiveReason}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Report Button */}
          {onReport && !pet.isArchived && (
            <div className="border-t pt-6 mt-6">
              <button
                onClick={() => onReport(pet.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Пожаловаться на объявление
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}