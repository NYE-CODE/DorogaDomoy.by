import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Lock, ArrowRight } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { authApi } from '@/shared/api/client';
import { useI18n } from '@/app/providers/I18nContext';
import { getHomePath } from '@/shared/lib/home-route';

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const rp = t.auth.resetPassword;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(rp.invalidLink);
      return;
    }
    if (password.length < 6) {
      toast.error(t.auth.passwordMinLength);
      return;
    }
    if (password !== confirm) {
      toast.error(rp.passwordMismatch);
      return;
    }
    setSaving(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success(rp.success);
      navigate(getHomePath(), { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="landing-theme min-h-screen flex flex-col bg-muted/30 dark:bg-background">
      <Header showCitySelector />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          <h1 className="typo-h1">{rp.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{rp.subtitle}</p>

          {!token ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-destructive">{rp.invalidLink}</p>
              <Link to={getHomePath()} className="text-sm font-medium text-primary hover:underline">
                {rp.backHome}
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{rp.newPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{rp.confirmPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="h-11 w-full">
                {saving ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {rp.submit}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
