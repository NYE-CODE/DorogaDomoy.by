import {
  Calendar,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react';
import type { User } from '@/app/providers/AuthContext';
import { dateLocaleForUi } from '@/shared/lib/profile-pet-text';
import { cn } from '@/shared/ui/utils';
import { surfaceCardPaddedClass } from '@/shared/styles/surface-classes';
import { getUserProfileRoleName } from './user-profile-helpers';

export interface UserProfileHeaderProps {
  user: User;
  avatarUrl: string;
  t: Record<string, string>;
  locale: string;
  location: string | null;
  joinDate: Date | null;
  stats: {
    total: number;
    active: number;
    successful: number;
    pets: number;
  };
  statHelperLabel: string;
  isCopied: boolean;
  blocking: boolean;
  showAdminBlock: boolean;
  onToggleBlock: () => void;
  onShare: () => void;
}

export function UserProfileHeader({
  user,
  avatarUrl,
  t,
  locale,
  location,
  joinDate,
  stats,
  statHelperLabel,
  isCopied,
  blocking,
  showAdminBlock,
  onToggleBlock,
  onShare,
}: UserProfileHeaderProps) {
  return (
    <div className={cn(surfaceCardPaddedClass, 'relative mb-6')}>
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        {showAdminBlock ? (
          <button
            onClick={onToggleBlock}
            disabled={blocking}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              user.isBlocked
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
            title={user.isBlocked ? t.unblock : t.block}
          >
            {blocking ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : user.isBlocked ? (
              <>
                <ShieldCheck size={16} /> {t.unblock}
              </>
            ) : (
              <>
                <ShieldBan size={16} /> {t.block}
              </>
            )}
          </button>
        ) : null}
        <button
          onClick={onShare}
          className="rounded-lg p-2 text-primary transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/30"
          title={isCopied ? t.shareCopied : t.shareProfile}
        >
          <Share2 size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex justify-center sm:justify-start">
          <img
            src={avatarUrl}
            alt={user.name}
            className="h-24 w-24 rounded-full border-4 border-primary-light object-cover sm:h-32 sm:w-32"
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="typo-h1 mb-2">{user.name}</h1>
          <div className="mb-4">
            <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-black">
              {getUserProfileRoleName(user.role, t)}
            </span>
          </div>

          <div className="mb-4 flex flex-col items-center gap-3 text-muted-foreground sm:flex-row sm:items-start sm:gap-4">
            {location ? (
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <span className="text-sm sm:text-base">{location}</span>
              </div>
            ) : null}
            {joinDate ? (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <span className="text-sm sm:text-base">
                  {t.memberSince}{' '}
                  {joinDate.toLocaleDateString(dateLocaleForUi(locale), {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {user.contacts?.phone ? (
              <a
                href={`tel:${user.contacts.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:text-base"
              >
                <Phone size={18} />
                {t.call}
              </a>
            ) : null}
            {user.contacts?.telegram ? (
              <a
                href={`https://t.me/${user.contacts.telegram.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-orange-50 dark:bg-transparent dark:hover:bg-orange-950/20 sm:text-base"
              >
                <MessageCircle size={18} />
                {t.contact}
              </a>
            ) : null}
            {!user.contacts?.telegram && user.contacts?.viber && /\d/.test(user.contacts.viber) ? (
              <a
                href={`viber://chat?number=${user.contacts.viber.replace(/\D/g, '')}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-orange-50 dark:bg-transparent dark:hover:bg-orange-950/20 sm:text-base"
              >
                <MessageCircle size={18} />
                {t.contact}
              </a>
            ) : null}
            {!user.contacts?.telegram &&
            !(user.contacts?.viber && /\d/.test(user.contacts.viber)) &&
            user.email ? (
              <a
                href={`mailto:${user.email}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-orange-50 dark:bg-transparent dark:hover:bg-orange-950/20 sm:text-base"
              >
                <Mail size={18} />
                {t.writeEmail}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 md:grid-cols-5">
        <div className="text-center">
          <div className="mb-1 text-2xl font-bold text-primary sm:text-3xl">{stats.total}</div>
          <div className="text-xs text-muted-foreground sm:text-sm">{t.statAds}</div>
        </div>
        <div className="text-center md:border-x md:border-border">
          <div className="mb-1 text-2xl font-bold text-primary sm:text-3xl">{stats.active}</div>
          <div className="text-xs text-muted-foreground sm:text-sm">{t.statActive}</div>
        </div>
        <div className="text-center md:border-r md:border-border">
          <div className="mb-1 text-2xl font-bold text-primary-light sm:text-3xl">{stats.successful}</div>
          <div className="text-xs text-muted-foreground sm:text-sm">{t.statReturned}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-2xl font-bold text-primary sm:text-3xl">{stats.pets}</div>
          <div className="text-xs text-muted-foreground sm:text-sm">{t.statPets}</div>
        </div>
        <div className="text-center md:border-l md:border-border">
          <div className="mb-1 text-2xl font-bold text-success sm:text-3xl">
            {user.helperConfirmedCount ?? 0}
          </div>
          <div className="text-xs text-muted-foreground sm:text-sm">{statHelperLabel}</div>
        </div>
      </div>
    </div>
  );
}
