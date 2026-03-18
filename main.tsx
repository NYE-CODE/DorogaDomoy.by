import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router'
import { Toaster } from 'sonner'
import LandingPage from './pages/LandingPage.tsx'
import SearchPage from './pages/SearchPage.tsx'
import ProfilePage from './components/profile-page.tsx'
import PetDetailPage from './pages/PetDetailPage.tsx'
import UserProfilePage from './pages/UserProfilePage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import MyAdsPageRoute from './pages/MyAdsPage.tsx'
import CreateAdPage from './pages/CreateAdPage.tsx'
import EditAdPage from './pages/EditAdPage.tsx'
import SettingsPageRoute from './pages/SettingsPage.tsx'
import { TermsPage } from './components/terms-page'
import { AuthModal } from './components/auth/AuthModal'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx'
import { I18nProvider } from './context/I18nContext.tsx'
import './styles/globals.css';
// Стили лендинга (шрифты и т.п.) — theme-scoped подключается в LandingPage
import './landing/styles/fonts.css'

function GlobalToaster() {
  const { theme } = useTheme();
  return <Toaster position="top-center" richColors theme={theme} />;
}

const YM_ID = 107705476;

function MetrikaTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ym) {
      (window as any).ym(YM_ID, 'hit', location.pathname + location.search);
    }
  }, [location.pathname, location.search]);
  return null;
}

function TermsRoute() {
  const navigate = useNavigate();
  return <TermsPage onBack={() => navigate(-1)} />;
}

function AuthModalGlobal() {
  const navigate = useNavigate();
  const { closeAuthModal } = useAuth();
  const handleNavigateToTerms = () => {
    closeAuthModal();
    navigate('/search');
  };
  return <AuthModal onNavigateToTerms={handleNavigateToTerms} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <MetrikaTracker />
          <GlobalToaster />
          <AuthProvider>
            <AuthModalGlobal />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/pet/:id" element={<PetDetailPage />} />
              <Route path="/user/:id" element={<UserProfilePage />} />
              <Route path="/my-ads" element={<MyAdsPageRoute />} />
              <Route path="/create" element={<CreateAdPage />} />
              <Route path="/edit/:id" element={<EditAdPage />} />
              <Route path="/settings" element={<SettingsPageRoute />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/terms" element={<TermsRoute />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
