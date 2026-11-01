import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/app/providers/I18nContext';
import { getHomePath } from '@/shared/lib/home-route';
import { getSafeReturnPath } from '@/shared/lib/auth-return-path';
import { resolvePostSignupWelcomePath } from '@/shared/lib/post-signup-welcome';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceInput,
  surfacePage,
  surfacePanel,
} from '@/shared/styles/surface-classes';
import '../../landing/styles/theme-scoped.css';

const segmentTrack = 'grid gap-0.5 rounded-md border border-border bg-muted/60 p-0.5';
function segmentClass(active: boolean) {
  return cn(
    'flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
    active
      ? 'bg-card text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
  );
}

const authInput = cn(surfaceInput, 'h-11 rounded-lg py-0 pl-10 pr-3 text-sm');

export default function CompleteProfilePage() {
  const { t } = useI18n();
  const cp = t.auth.completeProfile;
  const { user, completeProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    fromProtected?: string;
    suggestPetProfile?: boolean;
    suggestSignupRole?: 'user' | 'volunteer';
  } | null;
  const returnPath = getSafeReturnPath(locationState?.fromProtected);
  const suggestPetProfile = Boolean(locationState?.suggestPetProfile);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'user' | 'volunteer'>(
    locationState?.suggestSignupRole === 'volunteer' ? 'volunteer' : 'user',
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error(cp.emailInvalid);
      return;
    }
    if (!agreedToTerms) {
      toast.error(t.auth.agreeRequired);
      return;
    }
    if (password && password.length < 6) {
      toast.error(t.auth.passwordMinLength);
      return;
    }
    setSaving(true);
    try {
      const updated = await completeProfile({
        email: email.trim(),
        role: signupRole,
        password: password.trim() || undefined,
      });
      toast.success(cp.success);
      if (suggestPetProfile) {
        const welcomePath = resolvePostSignupWelcomePath(
          updated ?? { ...user, role: signupRole },
          true,
          signupRole,
        );
        if (welcomePath) {
          navigate(welcomePath, {
            replace: true,
            state: returnPath ? { fromProtected: returnPath } : undefined,
          });
          return;
        }
      }
      navigate(returnPath ?? getHomePath(), { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header showCitySelector />
      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className={cn(surfacePanel, 'mx-auto max-w-md overflow-hidden')}>
          <div className="border-b border-border/80 bg-card px-5 py-5 sm:px-6">
            <h1 className="typo-h2 font-display text-foreground">{cp.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{cp.subtitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {cp.greeting} <span className="font-medium text-foreground">{user.name}</span>
            </p>
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-4 bg-landing px-5 py-6 sm:px-6"
          >
            <div className="space-y-1.5">
              <label htmlFor="complete-profile-email" className={surfaceFieldLabel}>
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="complete-profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={authInput}
                  placeholder="name@example.by"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="complete-profile-password" className={surfaceFieldLabel}>
                {cp.passwordOptional}
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="complete-profile-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authInput}
                  placeholder={cp.passwordOptionalHint}
                  autoComplete="new-password"
                  aria-describedby="complete-profile-password-hint"
                />
              </div>
              <p id="complete-profile-password-hint" className="text-xs text-muted-foreground">
                {cp.passwordOptionalHint}
              </p>
            </div>

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

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded accent-primary"
              />
              <span>
                {t.auth.agreeWith}{' '}
                <Link to="/terms" className="font-semibold text-primary hover:underline">
                  {t.auth.terms}
                </Link>
              </span>
            </label>

            <button type="submit" disabled={saving} className={surfaceCtaPrimary}>
              {saving ? (
                <span
                  className="size-5 animate-spin rounded-full border-2 border-landing-dark/30 border-t-landing-dark"
                  aria-hidden
                />
              ) : (
                <>
                  {cp.submit}
                  <ArrowRight className="size-4" aria-hidden />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-border/60 bg-landing px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {cp.logout}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
