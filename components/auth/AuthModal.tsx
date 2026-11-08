import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowRight, Lock, Mail, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { TelegramLoginButton } from './TelegramLoginButton';
import { authApi, type TelegramAuthPayload } from '../../api/client';
import type { User } from '@/entities/user/model/types';
import { getSafeReturnPath } from '@/shared/lib/auth-return-path';
import { resolvePostSignupWelcomePath } from '@/shared/lib/post-signup-welcome';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceIconButton,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import '../../landing/styles/theme-scoped.css';

interface AuthModalProps {
  onNavigateToTerms?: () => void;
}

const segmentTrack =
  'grid gap-0.5 rounded-md border border-border bg-muted/60 p-0.5';

function segmentClass(active: boolean) {
  return cn(
    'flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
    active
      ? 'bg-card text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
  );
}

const authInput = cn(surfaceInput, 'h-11 rounded-lg py-0 pl-10 pr-3 text-sm');

export function AuthModal({ onNavigateToTerms }: AuthModalProps = {}) {
  const { isAuthModalOpen, closeAuthModal, login, register, loginWithTelegram } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getSafeReturnPath(
    (location.state as { fromProtected?: string } | null)?.fromProtected,
  );
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupRole, setSignupRole] = useState<'user' | 'volunteer'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [tgBotUsername, setTgBotUsername] = useState<string | null>(null);
  const [tgLoginEnabled, setTgLoginEnabled] = useState(false);

  const resetForm = () => {
    setMode('login');
    setEmail('');
    setPassword('');
    setName('');
    setAgreedToTerms(false);
    setSignupRole('user');
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuthModalOpen) {
      resetForm();
      return;
    }
    authApi
      .getConfig()
      .then((cfg) => {
        setTgBotUsername(cfg.telegram_bot_username ?? null);
        setTgLoginEnabled(Boolean(cfg.telegram_login_enabled && cfg.telegram_bot_username));
      })
      .catch(() => {
        setTgLoginEnabled(false);
      });
  }, [isAuthModalOpen]);

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const navigateAfterAuth = (
    user: User,
    isNewSignup = false,
    roleHint?: 'user' | 'volunteer' | null,
  ) => {
    if (user.profileCompleted === false) {
      navigate('/complete-profile', {
        replace: true,
        state: {
          ...(returnPath ? { fromProtected: returnPath } : {}),
          suggestPetProfile: true,
          suggestSignupRole: roleHint ?? undefined,
        },
      });
      return;
    }
    const welcomePath = resolvePostSignupWelcomePath(user, isNewSignup, roleHint);
    if (welcomePath) {
      navigate(welcomePath, {
        replace: true,
        state: returnPath ? { fromProtected: returnPath } : undefined,
      });
      return;
    }
    if (returnPath) {
      navigate(returnPath, { replace: true });
    }
  };

  const handleTelegramAuth = async (payload: TelegramAuthPayload) => {
    setIsLoading(true);
    try {
      const u = await loginWithTelegram(payload);
      toast.success(t.auth.telegramLoginSuccess);
      if (!u.profileCompleted) {
        navigate('/complete-profile', {
          replace: true,
          state: {
            ...(returnPath ? { fromProtected: returnPath } : {}),
            suggestPetProfile: true,
          },
        });
        return;
      }
      if (returnPath) {
        navigate(returnPath, { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleForSignup = signupRole;

    if (mode === 'register' && name.trim().length < 2) {
      toast.error(t.auth.nameMinLength);
      return;
    }

    if (password.length < 6) {
      toast.error(t.auth.passwordMinLength);
      return;
    }

    if (mode === 'register' && !agreedToTerms) {
      toast.error(t.auth.agreeRequired);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const u = await login(email, password);
        toast.success(t.auth.welcomeBack);
        resetForm();
        navigateAfterAuth(u, false);
      } else {
        const u = await register(email, name, password, {}, roleForSignup);
        toast.success(t.auth.registerSuccess);
        resetForm();
        navigateAfterAuth(u, true, roleForSignup);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contents">
      <Dialog open={isAuthModalOpen} onOpenChange={(next) => !next && handleClose()}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'landing-theme w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card',
          )}
        >
          <div className="border-b border-border/80 bg-card px-5 pb-4 pt-5 sm:px-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DialogTitle className="typo-h2 font-display text-foreground">
                  {mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {mode === 'login' ? t.auth.loginSubtitle : t.auth.registerSubtitle}
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={surfaceIconButton}
                aria-label={t.common.close}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className={cn(segmentTrack, 'grid-cols-2')} role="tablist" aria-label={t.auth.loginTitle}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => setMode('login')}
                className={segmentClass(mode === 'login')}
              >
                {t.auth.login}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => setMode('register')}
                className={segmentClass(mode === 'register')}
              >
                {t.auth.registerTitle}
              </button>
            </div>
          </div>

          <div className="bg-landing px-5 py-6 sm:px-6 sm:py-7">
            {tgLoginEnabled && tgBotUsername ? (
              <div className="mb-5 space-y-3">
                <TelegramLoginButton
                  botUsername={tgBotUsername}
                  onAuth={(payload) => void handleTelegramAuth(payload)}
                  disabled={isLoading}
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wide">
                    <span className="bg-landing px-2 text-muted-foreground">{t.auth.orDivider}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              {mode === 'register' ? (
                <div className="space-y-1.5">
                  <label htmlFor="auth-name" className={surfaceFieldLabel}>
                    {t.auth.yourName}
                  </label>
                  <div className="relative">
                    <UserIcon
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={authInput}
                      placeholder={t.auth.namePlaceholder}
                      autoComplete="name"
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="auth-email" className={surfaceFieldLabel}>
                  {t.auth.email}
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete={mode === 'login' ? 'username' : 'email'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={authInput}
                    placeholder="name@example.by"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="auth-password" className={cn(surfaceFieldLabel, 'mb-0')}>
                    {t.auth.password}
                  </label>
                  {mode === 'login' ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        navigate('/forgot-password');
                      }}
                      className="inline-flex min-h-11 items-center rounded-md text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {t.auth.forgotPasswordLink}
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={authInput}
                    placeholder={t.auth.password}
                    aria-describedby="auth-password-hint"
                  />
                </div>
                <p id="auth-password-hint" className="text-xs text-muted-foreground">
                  {t.auth.passwordHint}
                </p>
              </div>

              {mode === 'register' ? (
                <div className="space-y-1.5">
                  <label className={surfaceFieldLabel}>{t.auth.registerRoleLabel}</label>
                  <div className={cn(segmentTrack, 'grid-cols-2')}>
                    <button
                      type="button"
                      onClick={() => setSignupRole('user')}
                      className={segmentClass(signupRole === 'user')}
                    >
                      {t.auth.registerAsUser}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupRole('volunteer')}
                      className={segmentClass(signupRole === 'volunteer')}
                    >
                      {t.auth.registerAsVolunteer}
                    </button>
                  </div>
                </div>
              ) : null}

              {mode === 'register' ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
                  />
                  <span>
                    {t.auth.agreeWith}{' '}
                    <button
                      type="button"
                      className="font-semibold text-primary transition-colors hover:text-primary/90"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateToTerms?.();
                      }}
                    >
                      {t.auth.terms}
                    </button>
                  </span>
                </label>
              ) : null}

              <button type="submit" disabled={isLoading} className={cn(surfaceCtaPrimary, 'mt-1')}>
                {isLoading ? (
                  <span
                    className="size-5 animate-spin rounded-full border-2 border-landing-dark/30 border-t-landing-dark"
                    aria-hidden
                  />
                ) : (
                  <>
                    {mode === 'login' ? t.auth.login : t.auth.register}
                    <ArrowRight className="size-4" aria-hidden />
                  </>
                )}
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
