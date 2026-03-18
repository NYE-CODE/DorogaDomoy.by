import { useNavigate } from 'react-router';
import LandingApp from '../landing/app/App';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FeatureFlagsProvider } from '../context/FeatureFlagsContext';
import '../landing/styles/theme-scoped.css';

/**
 * Лендинг по адресу /. Компоненты и разметка перенесены один в один из папки landing page.
 * Подключён к бэкенду: объявления, статистика, авторизация.
 */
export default function LandingPage() {
  const { closeAuthModal } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleNavigateToTerms = () => {
    closeAuthModal();
    navigate('/search'); // На SearchPage есть вкладка «Условия»
  };

  return (
    <div className={`landing-theme min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <FeatureFlagsProvider>
        <LandingApp />
        <AuthModal onNavigateToTerms={handleNavigateToTerms} />
      </FeatureFlagsProvider>
    </div>
  );
}
