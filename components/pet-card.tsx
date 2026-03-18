import { useState, useRef, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, Edit2, Trash2, Home, Heart, Building2, Clock, CheckCircle2, XCircle, Eye, MoreVertical } from 'lucide-react';
import { Pet } from '../types/pet';
import { statusColors, formatDate, formatRelativeTime } from '../utils/pet-helpers';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface PetCardProps {
  pet: Pet;
  onClick?: () => void;
  compact?: boolean;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
  /** Количество видений (показывается только для status=searching) */
  sightingCount?: number;
  /** Скрыть статус (ищу/найден) и бейдж модерации — например в «Мои объявления» со вкладками */
  hideStatusBadge?: boolean;
}

export function PetCard({ pet, onClick, compact = false, onEdit, onDelete, sightingCount, hideStatusBadge }: PetCardProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-700 dark:text-gray-300';
      borderColor = 'border-gray-200 dark:border-gray-600';
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
    const photoUrl = pet.photos[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
    const colorStr = pet.colors.length ? pet.colors.map(c => t.pet.color[c as keyof typeof t.pet.color]).join(', ') : '—';
    const breedStr = pet.breed || 'Дворовый';
    return (
      <div
        className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex gap-3 p-3">
          <img
            src={photoUrl}
            alt={t.pet.animalType[pet.animalType]}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-black dark:text-white truncate">
                {t.pet.animalType[pet.animalType]}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                pet.status === 'searching'
                  ? 'bg-[#FF9800] text-white'
                  : 'bg-[#FDB913] text-black'
              }`}>
                {t.pet.status[pet.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{breedStr}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{colorStr}</p>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
              <MapPin size={12} />
              <span className="truncate">{pet.city}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
              <Clock size={12} />
              <span>{formatRelativeTime(pet.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={pet.photos[0]} 
          alt={t.pet.animalType[pet.animalType]}
          className="w-full h-48 object-cover"
        />
        {!hideStatusBadge && (
          <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg border ${statusColors[pet.status]} backdrop-blur-sm`}>
            {t.pet.status[pet.status]}
          </div>
        )}
        
        {/* Owner or Admin Actions — three-dots menu on the right */}
        {canEditDelete && (onEdit || onDelete) && (
          <div className="absolute top-3 right-3" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1.5 bg-white/90 dark:bg-gray-800/90 hover:bg-card dark:hover:bg-card text-gray-700 dark:text-gray-300 rounded-lg shadow-sm transition-colors"
              title={t.common.options}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(e); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-accent dark:hover:bg-accent flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t.common.edit}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(e); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-accent dark:hover:bg-accent flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.common.delete}
                  </button>
                )}
              </div>
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
            {sightingCount != null && sightingCount > 0 && pet.status === 'searching' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-md text-xs font-medium shrink-0">
                <Eye className="w-3.5 h-3.5" />
                {sightingCount}
              </span>
            )}
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
          
          {/* Moderation Status Badge (shown to owner, hidden when hideStatusBadge e.g. in My Ads) */}
          {!hideStatusBadge && moderationBadge && (
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
              className="text-primary hover:text-primary/90 hover:underline"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  {t.profile.phone}
                </button>
              )}
              {pet.contacts.telegram && (
                <button
                  onClick={(e) => handleContactClick(e, `https://t.me/${(pet.contacts.telegram ?? '').replace('@', '')}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
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