import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, Mail } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
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

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const copy = t.auth.forgotPassword;
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error(t.auth.completeProfile.emailInvalid);
      return;
    }
    setSending(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header showCitySelector />
      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className={cn(surfacePanel, 'mx-auto max-w-md overflow-hidden')}>
          <div className="border-b border-border/80 bg-card px-5 py-5 sm:px-6">
            <h1 className="typo-h2 font-display text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{sent ? copy.sentGeneric : copy.subtitle}</p>
          </div>

          {sent ? (
            <div className="bg-landing px-5 py-6 sm:px-6">
              <Link to="/" className={surfaceCtaPrimary}>
                {copy.backToLogin}
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 bg-landing px-5 py-6 sm:px-6">
              <div className="space-y-1.5">
                <label htmlFor="forgot-email" className={surfaceFieldLabel}>
                  {t.auth.email}
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="forgot-email"
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
              <p className="text-sm text-muted-foreground">{copy.hint}</p>
              <button type="submit" disabled={sending} className={surfaceCtaPrimary} aria-busy={sending} aria-label={copy.submit}>
                {sending ? (
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
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
