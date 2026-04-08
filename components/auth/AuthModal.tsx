import { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { toast } from 'sonner';
import { useScrollLock } from '../ui/use-scroll-lock';

interface AuthModalProps {
  onNavigateToTerms?: () => void;
}

export function AuthModal({ onNavigateToTerms }: AuthModalProps = {}) {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  useScrollLock(isAuthModalOpen);
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70] backdrop-blur-sm"
      onClick={closeAuthModal}
    >
      <div 
        className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
          <button 
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.yourName}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-input-background text-foreground placeholder:text-muted-foreground hover:border-primary/50"
                    placeholder={t.auth.namePlaceholder}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-input-background text-foreground placeholder:text-muted-foreground hover:border-primary/50"
                  placeholder="name@example.by"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-input-background text-foreground placeholder:text-muted-foreground hover:border-primary/50"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all font-medium disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? t.auth.login : t.auth.register}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
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
      </div>
    </div>
  );
}