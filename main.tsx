import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import { AuthModal } from './components/auth/AuthModal'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { CityProvider } from './context/CityContext.tsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx'
import { I18nProvider } from './context/I18nContext.tsx'
import './styles/globals.css';
import './landing/styles/fonts.css'
import { MobileBottomNav } from './components/layout/MobileBottomNav'
import { SeoRouteSync } from './components/SeoRouteSync'
import { PageLoader } from './components/ui/page-loader';
import { ScrollToTopOnRouteChange } from './components/ScrollToTopOnRouteChange';

const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));
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
const TermsPage = lazy(() => import('./pages/TermsPage.tsx'));
const BlogListPage = lazy(() => import('./pages/BlogListPage.tsx'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage.tsx'));

function GlobalToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme={theme}
      toastOptions={{
        duration: 4500,
        classNames: { toast: 'font-sans' },
      }}
    />
  );
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

function RequireAuth({ children }: { children: React.ReactElement }) {
  const location = useLocation();
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal();
    }
  }, [isAuthenticated, isLoading, openAuthModal]);

  if (isLoading) {
    return <RouteLoader />;
  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/search"
        replace
        state={{ fromProtected: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }
  return children;
}

function RequireAdmin({ children }: { children: React.ReactElement }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoader />;
  if (!isAuthenticated) return <Navigate to="/search" replace />;
  if (user?.role !== 'admin') return <Navigate to="/search" replace />;
  return children;
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
  return <PageLoader />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <SeoRouteSync />
          <ScrollToTopOnRouteChange />
          <MetrikaTracker />
          <GlobalToaster />
          <AuthProvider>
            <CityProvider>
              <AuthModalGlobal />
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                  <Route path="/pet-profile/:id" element={<PublicPetProfilePage />} />
                  <Route path="/my-pets/add" element={<RequireAuth><AddEditPetPageRoute /></RequireAuth>} />
                  <Route path="/my-pets/:id/edit" element={<RequireAuth><AddEditPetPageRoute /></RequireAuth>} />
                  <Route path="/my-pets/:id" element={<RequireAuth><MyPetProfilePage /></RequireAuth>} />
                  <Route path="/my-pets" element={<RequireAuth><MyPetsPageRoute /></RequireAuth>} />
                  <Route path="/pet/:id" element={<PetDetailPage />} />
                  <Route path="/user/:id" element={<UserProfilePage />} />
                  <Route path="/my-ads" element={<RequireAuth><MyAdsPageRoute /></RequireAuth>} />
                  <Route path="/create" element={<RequireAuth><CreateAdPage /></RequireAuth>} />
                  <Route path="/edit/:id" element={<RequireAuth><EditAdPage /></RequireAuth>} />
                  <Route path="/settings" element={<RequireAuth><SettingsPageRoute /></RequireAuth>} />
                  <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/blog" element={<BlogListPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
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
