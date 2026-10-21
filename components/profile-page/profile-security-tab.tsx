import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import type { useAuth } from '../../context/AuthContext';

type AuthUser = ReturnType<typeof useAuth>['user'];

const iconInputClass = cn(surfaceInput, 'pl-10 pr-12');

export interface ProfileSecurityTabProps {
  user: AuthUser;
  t: { profile: Record<string, string> };
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showCurrentPw: boolean;
  setShowCurrentPw: (v: boolean) => void;
  showNewPw: boolean;
  setShowNewPw: (v: boolean) => void;
  showConfirmPw: boolean;
  setShowConfirmPw: (v: boolean) => void;
  isSavingPassword: boolean;
  isDeletingAccount: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDeleteAccount: () => void;
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggleShow,
  autoComplete,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggleShow: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label className={surfaceFieldLabel}>{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={iconInputClass}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export function ProfileSecurityTab({
  user,
  t,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPw,
  setShowCurrentPw,
  showNewPw,
  setShowNewPw,
  showConfirmPw,
  setShowConfirmPw,
  isSavingPassword,
  isDeletingAccount,
  onSubmit,
  onDeleteAccount,
}: ProfileSecurityTabProps) {
  return (
    <div className="space-y-6">
      <div className="mb-2 rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <h3 className="mb-2 font-semibold text-foreground">
          {user?.passwordSet === false
            ? t.profile.setPasswordTitle
            : t.profile.changePassword}
        </h3>
        <p className="text-sm text-muted-foreground">
          {user?.passwordSet === false
            ? t.profile.setPasswordHint
            : t.profile.passwordHint}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" autoComplete="username" value={user?.email || ''} readOnly />
        {user?.passwordSet !== false && (
          <PasswordField
            label={
              <>
                {(t.profile.currentPassword?.replace(/\s*\*\s*$/, '').trim() ||
                  t.profile.pointsBalanceLabel)}{' '}
                <span className="text-destructive">*</span>
              </>
            }
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder={t.profile.currentPasswordPlaceholder}
            show={showCurrentPw}
            onToggleShow={() => setShowCurrentPw(!showCurrentPw)}
            autoComplete="current-password"
          />
        )}
        <PasswordField
          label={
            <>
              {t.profile.newPassword.replace(/\s*\*\s*$/, '').trim()}{' '}
              <span className="text-destructive">*</span>
            </>
          }
          value={newPassword}
          onChange={setNewPassword}
          placeholder={t.profile.newPasswordPlaceholder}
          show={showNewPw}
          onToggleShow={() => setShowNewPw(!showNewPw)}
          autoComplete="new-password"
        />
        <PasswordField
          label={
            <>
              {t.profile.confirmPassword.replace(/\s*\*\s*$/, '').trim()}{' '}
              <span className="text-destructive">*</span>
            </>
          }
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder={t.profile.confirmPasswordPlaceholder}
          show={showConfirmPw}
          onToggleShow={() => setShowConfirmPw(!showConfirmPw)}
          autoComplete="new-password"
        />
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={
              isSavingPassword ||
              !newPassword ||
              !confirmPassword ||
              (user?.passwordSet !== false && !currentPassword)
            }
            className={cn(surfaceCtaPrimary, 'w-full sm:w-auto sm:px-8')}
          >
            {isSavingPassword ? (
              <div className="size-5 animate-spin rounded-full border-2 border-landing-dark/30 border-t-landing-dark" />
            ) : (
              <>
                <Lock className="size-5" aria-hidden />
                {user?.passwordSet === false
                  ? t.profile.setPasswordTitle
                  : t.profile.changePassword}
              </>
            )}
          </button>
        </div>
      </form>

      <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
        <h3 className="font-semibold text-foreground">{t.profile.deleteAccount}</h3>
        <p className="text-sm text-muted-foreground">{t.profile.deleteAccountBody}</p>
        <button
          type="button"
          disabled={isDeletingAccount}
          onClick={onDeleteAccount}
          className={cn(
            surfaceCtaOutline,
            'w-full border-destructive/50 text-destructive hover:bg-destructive/10 sm:w-auto sm:px-6',
          )}
        >
          {isDeletingAccount ? '…' : t.profile.deleteAccount}
        </button>
      </div>
    </div>
  );
}
