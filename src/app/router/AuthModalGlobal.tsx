import { useNavigate } from 'react-router';
import { AuthModal } from '../../../components/auth/AuthModal';
import { useAuth } from '@/app/providers/AuthContext';
/** Глобальная модалка авторизации (рендерится один раз в корне приложения). */
export function AuthModalGlobal() {
  const navigate = useNavigate();
  const { closeAuthModal } = useAuth();

  const handleNavigateToTerms = () => {
    closeAuthModal();
    navigate('/terms');
  };

  return <AuthModal onNavigateToTerms={handleNavigateToTerms} />;
}
