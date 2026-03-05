import { MapPin, Phone, MessageCircle, Edit2, Trash2, Home, Heart, Building2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Pet } from '../types/pet';
import { statusLabels, statusColors, animalTypeLabels, colorLabels, genderLabels, formatDate } from '../utils/pet-helpers';
import { useAuth } from '../context/AuthContext';

interface PetCardProps {
  pet: Pet;
  onClick?: () => void;
  compact?: boolean;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}

export function PetCard({ pet, onClick, compact = false, onEdit, onDelete }: PetCardProps) {
  const { user } = useAuth();
  
  // Check if current user is the author
  // We use 'current-user' check for mock data compatibility
  const isOwner = user && (pet.authorId === user.id || (user.id === 'user-demo' && pet.authorId === 'current-user'));

  // Get moderation status badge
  const getModerationBadge = () => {
    if (!isOwner) return null;
    
    switch (pet.moderationStatus) {
      case 'pending':
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          text: 'На проверке',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200'
        };
      case 'approved':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          text: 'Опубликовано',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          text: 'Отклонено',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      default:
        return null;
    }
  };

  // Get archive reason badge
  const getArchiveReasonBadge = () => {
    if (!pet.isArchived || !pet.archiveReason) return null;
    
    let icon = null;
    let bgColor = 'bg-green-50';
    let textColor = 'text-green-700';
    let borderColor = 'border-green-200';
    
    if (pet.archiveReason.includes('вернулся домой') || pet.archiveReason.includes('найден хозяин')) {
      icon = <Home className="w-3.5 h-3.5" />;
      bgColor = 'bg-green-50';
      textColor = 'text-green-700';
      borderColor = 'border-green-200';
    } else if (pet.archiveReason.includes('пристроен')) {
      icon = <Heart className="w-3.5 h-3.5" />;
      bgColor = 'bg-pink-50';
      textColor = 'text-pink-700';
      borderColor = 'border-pink-200';
    } else if (pet.archiveReason.includes('приют')) {
      icon = <Building2 className="w-3.5 h-3.5" />;
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-700';
      borderColor = 'border-blue-200';
    }
    
    return { icon, bgColor, textColor, borderColor };
  };

  const moderationBadge = getModerationBadge();
  const archiveBadge = getArchiveReasonBadge();

  const handleContactClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(pet);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(pet);
  };

  if (compact) {
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow relative group"
        onClick={onClick}
      >
        <div className="flex gap-3">
          <img 
            src={pet.photos[0]} 
            alt={animalTypeLabels[pet.animalType]}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {animalTypeLabels[pet.animalType]} {pet.breed && `· ${pet.breed}`}
              </h3>
              <span className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${statusColors[pet.status]}`}>
                {statusLabels[pet.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{pet.colors.map(c => colorLabels[c]).join(', ')}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {pet.city} · {formatDate(pet.publishedAt)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={pet.photos[0]} 
          alt={animalTypeLabels[pet.animalType]}
          className="w-full h-48 object-cover"
        />
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg border ${statusColors[pet.status]} backdrop-blur-sm`}>
          {statusLabels[pet.status]}
        </div>
        
        {/* Owner Actions */}
        {isOwner && (onEdit || onDelete) && (
          <div className="absolute top-3 left-3 flex gap-2">
            {onEdit && (
              <button 
                onClick={handleEdit}
                className="p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm transition-colors"
                title="Редактировать"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="p-1.5 bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-sm transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg text-gray-900">
              {animalTypeLabels[pet.animalType]} {pet.breed && `· ${pet.breed}`}
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
            <span>Цвет: {pet.colors.map(c => colorLabels[c]).join(', ')}</span>
            {pet.gender && <span>· {genderLabels[pet.gender]}</span>}
            {pet.approximateAge && <span>· {pet.approximateAge}</span>}
          </div>

          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
            {pet.description}
          </p>

          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="w-4 h-4" />
            <span>{pet.city}</span>
            <span className="mx-1">·</span>
            <span>{formatDate(pet.publishedAt)}</span>
          </div>
          
          {/* Moderation Status Badge (shown to owner) */}
          {moderationBadge && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${moderationBadge.bgColor} ${moderationBadge.textColor} ${moderationBadge.borderColor} mb-2`}>
              {moderationBadge.icon}
              <span>{moderationBadge.text}</span>
            </div>
          )}
          
          {/* Rejection Reason */}
          {isOwner && pet.moderationStatus === 'rejected' && pet.moderationReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 mb-2">
              <strong>Причина:</strong> {pet.moderationReason}
            </div>
          )}
          
          {/* Archive Reason Badge */}
          {archiveBadge && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${archiveBadge.bgColor} ${archiveBadge.textColor} ${archiveBadge.borderColor}`}>
              {archiveBadge.icon}
              <span>{pet.archiveReason}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <p className="text-xs text-gray-500 mb-2">Контакты: {pet.authorName}</p>
          
          {pet.isArchived ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600">Контакты скрыты для архивных объявлений</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pet.contacts.phone && (
                <button
                  onClick={(e) => handleContactClick(e, `tel:${pet.contacts.phone}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Телефон
                </button>
              )}
              {pet.contacts.telegram && (
                <button
                  onClick={(e) => handleContactClick(e, `https://t.me/${(pet.contacts.telegram ?? '').replace('@', '')}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Telegram
                </button>
              )}
              {pet.contacts.viber && (
                <button
                  onClick={(e) => handleContactClick(e, `viber://chat?number=${(pet.contacts.viber ?? '').replace('+', '')}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Viber
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}