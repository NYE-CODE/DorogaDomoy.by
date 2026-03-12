import { MapPin, Phone, MessageCircle, Edit2, Trash2, Home, Heart, Building2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Pet } from '../types/pet';
import { statusColors, formatDate } from '../utils/pet-helpers';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface PetCardProps {
  pet: Pet;
  onClick?: () => void;
  compact?: boolean;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}

export function PetCard({ pet, onClick, compact = false, onEdit, onDelete }: PetCardProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  
  // Check if current user is the author
  // We use 'current-user' check for mock data compatibility
  const isOwner = user && (pet.authorId === user.id || (user.id === 'user-demo' && pet.authorId === 'current-user'));
  const isAdmin = user?.role === 'admin';
  const canEditDelete = isOwner || isAdmin;

  // Get moderation status badge
  const getModerationBadge = () => {
    if (!isOwner) return null;
    
    switch (pet.moderationStatus) {
      case 'pending':
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          text: t.moderation.onReview,
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          textColor: 'text-amber-700 dark:text-amber-400',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
      case 'approved':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          text: t.moderation.approved,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          text: t.moderation.rejected,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      default:
        return null;
    }
  };

  // Get archive reason badge
  const getArchiveReasonBadge = () => {
    if (!pet.isArchived || !pet.archiveReason) return null;
    
    let icon = null;
    let bgColor = 'bg-green-50 dark:bg-green-900/20';
    let textColor = 'text-green-700 dark:text-green-400';
    let borderColor = 'border-green-200 dark:border-green-800';
    
    if (pet.archiveReason.includes('вернулся домой') || pet.archiveReason.includes('найден хозяин')) {
      icon = <Home className="w-3.5 h-3.5" />;
      bgColor = 'bg-green-50 dark:bg-green-900/20';
      textColor = 'text-green-700 dark:text-green-400';
      borderColor = 'border-green-200 dark:border-green-800';
    } else if (pet.archiveReason.includes('пристроен')) {
      icon = <Heart className="w-3.5 h-3.5" />;
      bgColor = 'bg-pink-50 dark:bg-pink-900/20';
      textColor = 'text-pink-700 dark:text-pink-400';
      borderColor = 'border-pink-200 dark:border-pink-800';
    } else if (pet.archiveReason.includes('приют')) {
      icon = <Building2 className="w-3.5 h-3.5" />;
      bgColor = 'bg-blue-50 dark:bg-blue-900/20';
      textColor = 'text-blue-700 dark:text-blue-400';
      borderColor = 'border-blue-200 dark:border-blue-800';
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
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow relative group"
        onClick={onClick}
      >
        <div className="flex gap-3">
          <img 
            src={pet.photos[0]} 
            alt={t.pet.animalType[pet.animalType]}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {t.pet.animalType[pet.animalType]} {pet.breed && `· ${pet.breed}`}
              </h3>
              <span className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${statusColors[pet.status]}`}>
                {t.pet.status[pet.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{pet.colors.map(c => t.pet.color[c as keyof typeof t.pet.color]).join(', ')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
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
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={pet.photos[0]} 
          alt={t.pet.animalType[pet.animalType]}
          className="w-full h-48 object-cover"
        />
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg border ${statusColors[pet.status]} backdrop-blur-sm`}>
          {t.pet.status[pet.status]}
        </div>
        
        {/* Owner or Admin Actions */}
        {canEditDelete && (onEdit || onDelete) && (
          <div className="absolute top-3 left-3 flex gap-2">
            {onEdit && (
              <button 
                onClick={handleEdit}
                className="p-1.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm transition-colors"
                title={t.common.edit}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="p-1.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-red-600 rounded-lg shadow-sm transition-colors"
                title={t.common.delete}
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
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {t.pet.animalType[pet.animalType]} {pet.breed && `· ${pet.breed}`}
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Цвет: {pet.colors.map(c => t.pet.color[c as keyof typeof t.pet.color]).join(', ')}</span>
            {pet.gender && <span>· {t.pet.gender[pet.gender]}</span>}
            {pet.approximateAge && <span>· {pet.approximateAge}</span>}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
            {pet.description}
          </p>

          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
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
              <strong>{t.moderation.reason}:</strong> {pet.moderationReason}
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

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t.pet.contacts}:{' '}
            <a
              href={`/user/${pet.authorId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              {pet.authorName}
            </a>
          </p>
          
          {pet.isArchived ? (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.petDetail.contactsHiddenArchived}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pet.contacts.phone && (
                <button
                  onClick={(e) => handleContactClick(e, `tel:${pet.contacts.phone}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  {t.profile.phone}
                </button>
              )}
              {pet.contacts.telegram && (
                <button
                  onClick={(e) => handleContactClick(e, `https://t.me/${(pet.contacts.telegram ?? '').replace('@', '')}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t.profile.telegram}
                </button>
              )}
              {pet.contacts.viber && (
                <button
                  onClick={(e) => handleContactClick(e, `viber://chat?number=${(pet.contacts.viber ?? '').replace('+', '')}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t.profile.viber}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}