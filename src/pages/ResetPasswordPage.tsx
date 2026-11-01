import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, Lock } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/app/providers/I18nContext';
import { authApi } from '@/shared/api/auth';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceInput,
  surfacePage,
  surfacePanel,
} from '@/shared/styles/surface-classes';
import '../../landing/styles/theme-scoped.css';

const authInput = cn(surfaceInput, 'h-11 rounded-lg py-0 pl-10 pr-3 text-sm');

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const copy = t.auth.resetPassword;
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = (params.get('token') || '').trim();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t.auth.passwordMinLength);
      return;
    }
    if (password !== confirm) {
      toast.error(copy.passwordMismatch);
      return;
    }
    setSaving(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.invalidLink);
    } finally {
      setSaving(false);
    }
  };

  const goToLogin = () => {
    openAuthModal();
    navigate('/');
  };

  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header showCitySelector />
      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className={cn(surfacePanel, 'mx-auto max-w-md overflow-hidden')}>
          <div className="border-b border-border/80 bg-card px-5 py-5 sm:px-6">
            <h1 className="typo-h2 font-display text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {done ? copy.success : token ? copy.subtitle : copy.missingToken}
            </p>
          </div>

          {done ? (
            <div className="bg-landing px-5 py-6 sm:px-6">
              <button type="button" onClick={goToLogin} className={surfaceCtaPrimary}>
                {t.auth.login}
              </button>
            </div>
          ) : !token ? (
            <div className="bg-landing px-5 py-6 sm:px-6">
              <Link to="/forgot-password" className={surfaceCtaPrimary}>
                {t.auth.forgotPassword.title}
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 bg-landing px-5 py-6 sm:px-6">
              <div className="space-y-1.5">
                <label htmlFor="reset-password" className={surfaceFieldLabel}>
                  {copy.newPassword}
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="reset-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={authInput}
                    autoComplete="new-password"
                    aria-describedby="reset-password-hint"
                  />
                </div>
                <p id="reset-password-hint" className="text-xs text-muted-foreground">
                  {t.auth.passwordHint}
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reset-password-confirm" className={surfaceFieldLabel}>
                  {copy.confirmPassword}
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="reset-password-confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={authInput}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className={surfaceCtaPrimary} aria-busy={saving} aria-label={copy.submit}>
                {saving ? (
                  <span
                    className="size-5 animate-spin rounded-full border-2 border-landing-dark/30 border-t-landing-dark"
                    aria-hidden
                  />
                ) : (
                  <>
                    {copy.submit}
                    <ArrowRight className="size-4" aria-hidden />
                  </>
                )}
              </button>
              <Link
                to="/"
                className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {copy.backHome}
              </Link>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
