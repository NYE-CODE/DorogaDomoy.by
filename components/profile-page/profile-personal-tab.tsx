import { Camera, Check, Copy, Mail, MessageCircle, Phone, Save, User } from 'lucide-react';
import { BELARUS_MOBILE_PHONE_PLACEHOLDER } from '../../utils/belarus-phone';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import { resolveAvatarUrl } from './profile-page-helpers';
import type { ProfileRoleDraft, ProfileTranslations } from './profile-page-types';
import type { useAuth } from '../../context/AuthContext';

type AuthUser = ReturnType<typeof useAuth>['user'];

const iconInputClass = cn(surfaceInput, 'pl-10');

export interface ProfilePersonalTabProps {
  user: AuthUser;
  t: {
    profile: Record<string, string>;
    auth: { nameMinLength: string };
  };
  pr: ProfileTranslations;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  viber: string;
  setViber: (v: string) => void;
  roleDraft: ProfileRoleDraft;
  setRoleDraft: (v: ProfileRoleDraft) => void;
  isSavingProfile: boolean;
  helperCopied: boolean;
  onCopyHelperCode: () => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfilePersonalTab({
  user,
  t,
  pr,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  viber,
  setViber,
  roleDraft,
  setRoleDraft,
  isSavingProfile,
  helperCopied,
  onCopyHelperCode,
  onAvatarUpload,
  onSubmit,
}: ProfilePersonalTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 border-b border-border pb-6 sm:flex-row">
        <div className="relative">
          <div className="flex size-32 items-center justify-center overflow-hidden rounded-full bg-landing-muted ring-[3px] ring-medallion">
            {user?.avatar ? (
              <img
                src={resolveAvatarUrl(user.avatar)}
                alt={user.name || 'Avatar'}
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="size-12 text-muted-foreground" aria-hidden />
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 flex size-10 cursor-pointer items-center justify-center rounded-full bg-primary text-landing-dark shadow-card transition-colors hover:bg-primary-hover"
          >
            <Camera className="size-5" aria-hidden />
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="mb-1 font-semibold text-foreground">{t.profile.photoTitle}</h3>
          <p className="mb-3 text-sm text-muted-foreground">{t.profile.avatarHint}</p>
          <label htmlFor="avatar-upload-btn" className={cn(surfaceCtaOutline, 'inline-flex w-auto cursor-pointer px-5')}>
            <Camera className="size-[18px]" aria-hidden />
            {t.profile.uploadPhoto}
            <input id="avatar-upload-btn" type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-landing-muted/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">{t.profile.helperIdLabel}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t.profile.helperIdHint}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              void onCopyHelperCode();
            }}
            className={cn(surfaceCtaOutline, 'w-auto px-4 py-2 text-sm')}
            disabled={!user?.helperCode}
          >
            {helperCopied ? (
              <Check className="size-4 text-primary" aria-hidden />
            ) : (
              <Copy className="size-4 text-muted-foreground" aria-hidden />
            )}
            <span className="font-mono text-sm">{user?.helperCode ?? '—'}</span>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-xs text-muted-foreground">{t.profile.helperConfirmedCountLabel}</div>
            <div className="font-display text-xl font-bold text-foreground">
              {user?.helperConfirmedCount ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-xs text-muted-foreground">{t.profile.pointsBalanceLabel}</div>
            <div className="font-display text-xl font-bold text-foreground">
              {user?.pointsBalance ?? 0}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className={surfaceFieldLabel}>
              {t.profile.nameLabel.replace(/\s*\*\s*$/, '').trim()}{' '}
              <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.profile.namePlaceholder}
                className={iconInputClass}
              />
            </div>
          </div>
          <div>
            <label className={surfaceFieldLabel}>
              {t.profile.emailLabel?.replace(/\s*\*\s*$/, '').trim() || 'Email'}{' '}
              <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={iconInputClass}
              />
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="rounded-2xl border border-border bg-landing-muted/50 p-4 md:col-span-2">
              <div className="mb-1 text-sm font-medium text-muted-foreground">{t.profile.roleFieldLabel}</div>
              <div className="font-medium text-foreground">{t.profile.roles?.admin}</div>
            </div>
          )}

          {user?.role === 'user' && (
            <div className="md:col-span-2">
              <label className={surfaceFieldLabel}>{t.profile.roleFieldLabel}</label>
              <select
                value={roleDraft}
                onChange={(e) => setRoleDraft(e.target.value as ProfileRoleDraft)}
                className={cn(surfaceInput, 'max-w-md')}
              >
                <option value="user">{t.profile.roles?.user}</option>
                <option value="volunteer">{t.profile.roles?.volunteer}</option>
              </select>
              <p className="mt-2 text-xs text-muted-foreground">{pr.roleUpgradeHint}</p>
            </div>
          )}

          {user?.role === 'volunteer' && (
            <div className="md:col-span-2">
              <label className={surfaceFieldLabel}>{t.profile.roleFieldLabel}</label>
              <select
                disabled
                value="volunteer"
                className={cn(surfaceInput, 'max-w-md cursor-not-allowed opacity-90')}
              >
                <option value="volunteer">{t.profile.roles?.volunteer}</option>
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                {user.registeredAsVolunteer
                  ? (pr.roleHintRegVolunteer ?? '')
                  : (pr.roleUpgradeHint ?? '')}
              </p>
            </div>
          )}

          <div>
            <label className={surfaceFieldLabel}>
              {t.profile.phone} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER}
                className={iconInputClass}
              />
            </div>
          </div>
          <div>
            <label className={surfaceFieldLabel}>{t.profile.viber}</label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="tel"
                value={viber}
                onChange={(e) => setViber(e.target.value)}
                placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER}
                className={iconInputClass}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingProfile}
            className={cn(surfaceCtaPrimary, 'w-full sm:w-auto sm:px-8')}
          >
            {isSavingProfile ? (
              <div className="size-5 animate-spin rounded-full border-2 border-landing-dark/30 border-t-landing-dark" />
            ) : (
              <>
                <Save className="size-5" aria-hidden />
                {t.profile.saveChanges}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
