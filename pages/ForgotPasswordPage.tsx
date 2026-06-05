import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Mail, ArrowRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { authApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { Link } from 'react-router';
import { getHomePath } from '../utils/home-route';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const fp = t.auth.forgotPassword;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSent(true);
      toast.success(res.detail || fp.sentGeneric);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="landing-theme min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <Header showCitySelector showHomeModeToggle={false} />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">{fp.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{fp.subtitle}</p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-foreground">{fp.sentGeneric}</p>
              <p className="text-sm text-muted-foreground">{fp.checkTelegram}</p>
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate(getHomePath())}>
                {fp.backToLogin}
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.auth.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="name@example.by"
                    autoComplete="email"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{fp.telegramOnlyHint}</p>
              <Button type="submit" disabled={sending} className="h-11 w-full">
                {sending ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {fp.submit}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {!sent && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to={getHomePath()} className="font-semibold text-primary hover:underline">
                {fp.backToLogin}
              </Link>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
