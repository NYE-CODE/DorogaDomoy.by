import LandingApp from '../landing/app/App';
import { useTheme } from '../context/ThemeContext';
import { FeatureFlagsProvider } from '../context/FeatureFlagsContext';
import '../landing/styles/theme-scoped.css';

/**
 * Лендинг по адресу /. Компоненты и разметка перенесены один в один из папки landing page.
 * Подключён к бэкенду: объявления, статистика, авторизация.
 * AuthModal рендерится глобально в main.tsx.
 */
export default function LandingPage() {
  const { theme } = useTheme();

  return (
    <div className={`landing-theme min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <FeatureFlagsProvider>
        <LandingApp />
      </FeatureFlagsProvider>
    </div>
  );
}
