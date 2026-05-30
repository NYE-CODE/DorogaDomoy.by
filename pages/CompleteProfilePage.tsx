import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { getHomePath } from '../utils/home-route';

export default function CompleteProfilePage() {
  const { t } = useI18n();
  const cp = t.auth.completeProfile;
  const { user, completeProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'user' | 'volunteer'>('user');
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
      await completeProfile({
        email: email.trim(),
        role: signupRole,
        password: password.trim() || undefined,
      });
      toast.success(cp.success);
      navigate(getHomePath(), { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="landing-theme min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <Header showCitySelector showHomeModeToggle={false} />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">{cp.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{cp.subtitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {cp.greeting} <span className="font-medium text-foreground">{user.name}</span>
          </p>

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

            <div>
              <label className="mb-1.5 block text-sm font-medium">{cp.passwordOptional}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder={cp.passwordOptionalHint}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">{t.auth.registerRoleLabel}</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="signup-role"
                    checked={signupRole === 'user'}
                    onChange={() => setSignupRole('user')}
                    className="size-4 accent-primary"
                  />
                  {t.auth.registerAsUser}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="signup-role"
                    checked={signupRole === 'volunteer'}
                    onChange={() => setSignupRole('volunteer')}
                    className="size-4 accent-primary"
                  />
                  {t.auth.registerAsVolunteer}
                </label>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-primary"
              />
              <span>
                {t.auth.agreeWith}{' '}
                <a href="/terms" className="font-semibold text-primary hover:underline">
                  {t.auth.terms}
                </a>
              </span>
            </label>

            <Button type="submit" disabled={saving} className="h-11 w-full">
              {saving ? (
                <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {cp.submit}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => void logout()}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {cp.logout}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
