import { useState, useRef, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, Edit2, Trash2, Home, Heart, Building2, Clock, CheckCircle2, XCircle, Eye, MoreVertical } from 'lucide-react';
import { Pet } from '../types/pet';
import { petStatusPhotoPillClass, formatDate, formatRelativeTime } from '../utils/pet-helpers';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { RewardBadge, getRewardBadgeMeta } from './reward-badge';
import { FavoriteHeartButton } from './favorite-heart-button';
import { cn } from './ui/utils';
import { typoH4 } from '@/shared/styles/typography-classes';
import { activateOnKeyboard, interactiveCardClass } from '@/shared/styles/interaction-classes';

interface PetCardProps {
  pet: Pet;
  onClick?: () => void;
  compact?: boolean;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
  /** ?????????? ??????? (???????????? ?????? ??? status=searching) */
  sightingCount?: number;
  /** ?????? ?????? (???/??????) ? ????? ????????? ? ???????? ? ???? ??????????? ?? ????????? */
  hideStatusBadge?: boolean;
  /** ?????? ?? ????????? ?? ?????? (????????? ?? ????????? ???????) */
  showFavoriteToggle?: boolean;
}

export function PetCard({
  pet,
  onClick,
  compact = false,
  onEdit,
  onDelete,
  sightingCount,
  hideStatusBadge,
  showFavoriteToggle = true,
}: PetCardProps) {
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
    
    if (pet.archiveReason.includes('???????? ?????') || pet.archiveReason.includes('?????? ??????')) {
      icon = <Home className="w-3.5 h-3.5" />;
      bgColor = 'bg-green-50 dark:bg-green-900/20';
      textColor = 'text-green-700 dark:text-green-400';
      borderColor = 'border-green-200 dark:border-green-800';
    } else if (pet.archiveReason.includes('?????????')) {
      icon = <Heart className="w-3.5 h-3.5" />;
      bgColor = 'bg-pink-50 dark:bg-pink-900/20';
      textColor = 'text-pink-700 dark:text-pink-400';
      borderColor = 'border-pink-200 dark:border-pink-800';
    } else if (pet.archiveReason.includes('?????')) {
      icon = <Building2 className="w-3.5 h-3.5" />;
      bgColor = 'bg-muted';
      textColor = 'text-foreground/90';
      borderColor = 'border-border dark:border-border';
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
    const colorStr = pet.colors.length ? pet.colors.map(c => t.pet.color[c as keyof typeof t.pet.color]).join(', ') : '?';
    const breedStr = pet.breed?.trim() || t.landing.announcements.breedDefault;
    const photoAlt = `${t.pet.animalType[pet.animalType]}${pet.breed ? `, ${pet.breed}` : ''}, ${pet.city}`;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={activateOnKeyboard(onClick)}
        className={cn(
          interactiveCardClass,
          'group relative flex items-start gap-3 overflow-hidden rounded-lg border border-border/70 bg-card p-3 shadow-sm',
          'transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-md',
        )}
      >
        {showFavoriteToggle && (
          <div className="absolute right-2 top-2 z-10">
            <FavoriteHeartButton petId={pet.id} size="sm" className="!p-1.5" />
          </div>
        )}

        <div className="relative size-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted sm:size-[6.5rem]">
          <img
            src={photoUrl}
            alt={photoAlt}
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span
            className={cn(
              'absolute left-1.5 top-1.5 z-[2] inline-flex max-w-[calc(100%-0.75rem)] truncate rounded-full px-2 py-0.5 text-[0.65rem] font-semibold sm:text-xs',
              petStatusPhotoPillClass[pet.status],
            )}
          >
            {t.pet.status[pet.status]}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-8">
          <h3 className={cn(typoH4, 'line-clamp-1 leading-tight')}>
            {t.pet.animalType[pet.animalType]} <span className="font-medium text-muted-foreground">?</span>{' '}
            <span className="font-medium">{breedStr}</span>
          </h3>
          {getRewardBadgeMeta(pet) ? (
            <div className="min-w-0 w-full">
              <RewardBadge pet={pet} compact compactWrap />
            </div>
          ) : null}
          <p className="line-clamp-1 text-xs text-muted-foreground sm:text-sm">{colorStr}</p>
          <div className="flex flex-col gap-1.5">
            <span className="flex max-w-full items-center gap-1.5 self-start rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
              <MapPin size={12} className="shrink-0 opacity-80" aria-hidden />
              <span className="min-w-0 truncate">{pet.city}</span>
            </span>
            <span
              className={cn(
                'flex items-center gap-1.5 self-start rounded-md px-2.5 py-1 text-xs',
                pet.status === 'searching' && !pet.isArchived
                  ? 'bg-lost-soft font-semibold text-lost-foreground'
                  : 'bg-muted/70 text-muted-foreground',
              )}
            >
              <Clock size={12} className="shrink-0 opacity-80" aria-hidden />
              {formatRelativeTime(pet.publishedAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={activateOnKeyboard(onClick)}
      className={cn(
        interactiveCardClass,
        'overflow-hidden rounded-lg border border-border bg-card shadow-sm',
      )}
    >
      <div className="relative">
        <img 
          src={pet.photos[0]} 
          alt={t.pet.animalType[pet.animalType]}
          className="w-full h-48 object-cover"
        />
        {!hideStatusBadge && (
          <div
            className={cn(
              'absolute left-3 top-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
              petStatusPhotoPillClass[pet.status],
            )}
          >
            {t.pet.status[pet.status]}
          </div>
        )}
        {showFavoriteToggle && (
          <div className="absolute bottom-3 right-3 z-10">
            <FavoriteHeartButton petId={pet.id} />
          </div>
        )}
        
        {/* Owner or Admin Actions ? three-dots menu on the right */}
        {canEditDelete && (onEdit || onDelete) && (
          <div className="absolute top-3 right-3" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1.5 bg-white/90 dark:bg-card/90 hover:bg-card dark:hover:bg-card text-foreground/90 rounded-lg shadow-sm transition-colors"
              title={t.common.options}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-card rounded-lg shadow-lg border border-border dark:border-border py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(e); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground/90 dark:text-foreground hover:bg-accent dark:hover:bg-accent flex items-center gap-2"
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
            <h3 className="font-semibold text-lg text-foreground">
              {t.pet.animalType[pet.animalType]} {pet.breed && `? ${pet.breed}`}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <RewardBadge pet={pet} />
              {sightingCount != null && sightingCount > 0 && pet.status === 'searching' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-md text-xs font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  {sightingCount}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
            <span>{t.pet.colorLabel}: {pet.colors.map(c => t.pet.color[c as keyof typeof t.pet.color]).join(', ')}</span>
            {pet.gender && <span>? {t.pet.gender[pet.gender]}</span>}
            {pet.approximateAge && <span>? {pet.approximateAge}</span>}
          </div>

          <p className="text-sm text-foreground/90 line-clamp-2 mb-3">
            {pet.description}
          </p>

          <div className="mb-3 space-y-1 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{pet.city}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              {/* ????? ????????: ????? ? ??????? ?????????, ? ?? ???? ?????????? */}
              {pet.status === 'searching' && !pet.isArchived ? (
                <span className="font-semibold text-lost-foreground">
                  {formatRelativeTime(pet.publishedAt)}
                </span>
              ) : (
                <span>{formatDate(pet.publishedAt)}</span>
              )}
            </div>
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

        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">
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
            <div className="bg-muted/30 dark:bg-muted border border-border rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">{t.petDetail.contactsHiddenArchived}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pet.contacts.phone && (
                <button
                  onClick={(e) => handleContactClick(e, `tel:${pet.contacts.phone}`)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm',
                    // ????? ????????: ?????? ? ??????? ????????, ????????? ?????? ????????
                    pet.status === 'searching'
                      ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary-hover'
                      : 'bg-muted text-muted-foreground hover:bg-accent',
                  )}
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