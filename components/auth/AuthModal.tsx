import { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface AuthModalProps {
  onNavigateToTerms?: () => void;
}

export function AuthModal({ onNavigateToTerms }: AuthModalProps = {}) {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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
        await login(email, password);
        toast.success(t.auth.welcomeBack);
      } else {
        await register(email, name, password, {});
        toast.success(t.auth.registerSuccess);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="contents"
    >
      <Dialog open={isAuthModalOpen} onOpenChange={(next) => !next && closeAuthModal()}>
        <DialogContent
          className="w-full max-w-md overflow-hidden rounded-2xl p-0"
          showCloseButton={false}
        >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-1">
              {mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
            </h2>
            <p className="text-primary-foreground/90 text-sm">
              {mode === 'login' 
                ? t.auth.loginSubtitle 
                : t.auth.registerSubtitle}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.auth.yourName}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-10"
                    placeholder={t.auth.namePlaceholder}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="name@example.by"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.auth.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:ring-2"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t.auth.agreeWith}{' '}
                  <a 
                    href="#" 
                    className="text-primary font-semibold hover:text-primary/90 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateToTerms?.();
                    }}
                  >
                    {t.auth.terms}
                  </a>
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? t.auth.login : t.auth.register}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
              <button 
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-2 text-primary font-semibold hover:text-primary/90 transition-colors"
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