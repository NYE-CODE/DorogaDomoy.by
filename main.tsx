import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router'
import { Toaster } from 'sonner'
import { AuthModal } from './components/auth/AuthModal'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { CityProvider } from './context/CityContext.tsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx'
import { I18nProvider } from './context/I18nContext.tsx'
import './styles/globals.css';
import './landing/styles/fonts.css'
import { MobileBottomNav } from './components/layout/MobileBottomNav'

const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.tsx'));
const ProfilePage = lazy(() => import('./components/profile-page.tsx'));
const PetDetailPage = lazy(() => import('./pages/PetDetailPage.tsx'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.tsx'));
const MyAdsPageRoute = lazy(() => import('./pages/MyAdsPage.tsx'));
const CreateAdPage = lazy(() => import('./pages/CreateAdPage.tsx'));
const EditAdPage = lazy(() => import('./pages/EditAdPage.tsx'));
const SettingsPageRoute = lazy(() => import('./pages/SettingsPage.tsx'));
const MyPetsPageRoute = lazy(() => import('./pages/MyPetsPage.tsx'));
const MyPetProfilePage = lazy(() => import('./pages/MyPetProfilePage.tsx'));
const AddEditPetPageRoute = lazy(() => import('./pages/AddEditPetPage.tsx'));
const PublicPetProfilePage = lazy(() => import('./pages/PublicPetProfilePage.tsx'));
const TermsPage = lazy(() =>
  import('./components/terms-page').then((module) => ({ default: module.TermsPage }))
);

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

function RouteLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
      Загрузка...
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <MetrikaTracker />
          <GlobalToaster />
          <AuthProvider>
            <CityProvider>
              <AuthModalGlobal />
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/pet-profile/:id" element={<PublicPetProfilePage />} />
                  <Route path="/my-pets/add" element={<AddEditPetPageRoute />} />
                  <Route path="/my-pets/:id/edit" element={<AddEditPetPageRoute />} />
                  <Route path="/my-pets/:id" element={<MyPetProfilePage />} />
                  <Route path="/my-pets" element={<MyPetsPageRoute />} />
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
              </Suspense>
              <MobileBottomNav />
            </CityProvider>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
