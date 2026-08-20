import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TelegramLoginButton } from './TelegramLoginButton';
import { authApi, type TelegramAuthPayload } from '../../api/client';
import type { User } from '@/entities/user/model/types';
import { getSafeReturnPath } from '@/shared/lib/auth-return-path';
import { resolvePostSignupWelcomePath } from '@/shared/lib/post-signup-welcome';

interface AuthModalProps {
  onNavigateToTerms?: () => void;
}

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
        <DialogContent className="w-full max-w-md overflow-hidden rounded-lg p-0" showCloseButton={false}>
          <div className="relative flex h-32 items-center justify-center bg-gradient-to-r from-primary to-primary/80">
            <div className="text-center text-white">
              <DialogTitle className="mb-1 text-2xl font-bold text-white">
                {mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
              </DialogTitle>
              <DialogDescription className="text-sm text-primary-foreground/90">
                {mode === 'login' ? t.auth.loginSubtitle : t.auth.registerSubtitle}
              </DialogDescription>
            </div>
          </div>

          <div className="p-8">
            {tgLoginEnabled && tgBotUsername && (
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
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t.auth.orDivider}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.yourName}</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      placeholder={t.auth.namePlaceholder}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    autoComplete={mode === 'login' ? 'username' : 'email'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="name@example.by"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">{t.auth.password}</label>
                  {mode === 'login' && (
                    <span
                      className="cursor-not-allowed text-xs font-medium text-muted-foreground"
                      title={t.auth.forgotPasswordDisabled}
                    >
                      {t.auth.forgotPasswordDisabled}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder={t.auth.password}
                    aria-describedby="auth-password-hint"
                  />
                </div>
                <p id="auth-password-hint" className="mt-1.5 text-xs text-muted-foreground">
                  {t.auth.passwordHint}
                </p>
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    {t.auth.registerRoleLabel}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="auth-modal-signup-role"
                        checked={signupRole === 'user'}
                        onChange={() => setSignupRole('user')}
                        className="size-4 accent-primary"
                      />
                      {t.auth.registerAsUser}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="auth-modal-signup-role"
                        checked={signupRole === 'volunteer'}
                        onChange={() => setSignupRole('volunteer')}
                        className="size-4 accent-primary"
                      />
                      {t.auth.registerAsVolunteer}
                    </label>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-primary focus:ring-2 dark:border-border dark:bg-muted"
                  />
                  <label className="ml-2 text-sm text-foreground/90">
                    {t.auth.agreeWith}{' '}
                    <button
                      type="button"
                      className="font-semibold text-primary transition-colors hover:text-primary/90"
                      onClick={() => onNavigateToTerms?.()}
                    >
                      {t.auth.terms}
                    </button>
                  </label>
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="h-11 w-full">
                {isLoading ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {mode === 'login' ? t.auth.login : t.auth.register}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="ml-2 font-semibold text-primary transition-colors hover:text-primary/90"
                >
                  {mode === 'login' ? t.auth.register : t.auth.login}
                </button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
