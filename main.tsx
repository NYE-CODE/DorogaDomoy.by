import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
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
import { FavoritesProvider } from './context/FavoritesContext';
import { getHomePath } from './utils/home-route';

const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));
const PetDetailPage = lazy(() => import('./pages/PetDetailPage.tsx'));
const ShelterPetDetailPage = lazy(() => import('./pages/ShelterPetDetailPage.tsx'));
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
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.tsx'));
const SheltersPage = lazy(() => import('./pages/SheltersPage.tsx'));
const ShelterDetailPage = lazy(() => import('./pages/ShelterDetailPage.tsx'));
const MySheltersPage = lazy(() => import('./pages/MySheltersPage.tsx'));
const MyShelterFormPage = lazy(() => import('./pages/MyShelterFormPage.tsx'));
const MyShelterPetsListPage = lazy(() => import('./pages/MyShelterPetsListPage.tsx'));
const MyShelterPetFormPage = lazy(() => import('./pages/MyShelterPetFormPage.tsx'));
const MyShelterPetCampaignPage = lazy(() => import('./pages/MyShelterPetCampaignPage.tsx'));
const MyShelterTeamPage = lazy(() => import('./pages/MyShelterTeamPage.tsx'));

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
const PREV_ROUTE_KEY = 'dd_previous_path';
const CURRENT_ROUTE_KEY = 'dd_current_path';

function MetrikaTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ym) {
      (window as any).ym(YM_ID, 'hit', location.pathname + location.search);
    }
  }, [location.pathname, location.search]);
  return null;
}

function RouteHistoryTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = `${location.pathname}${location.search}`;
    const current = window.sessionStorage.getItem(CURRENT_ROUTE_KEY);
    if (current && current !== next) {
      window.sessionStorage.setItem(PREV_ROUTE_KEY, current);
    }
    window.sessionStorage.setItem(CURRENT_ROUTE_KEY, next);
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
        to={getHomePath()}
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
  if (!isAuthenticated) return <Navigate to={getHomePath()} replace />;
  if (user?.role !== 'admin') return <Navigate to={getHomePath()} replace />;
  return children;
}

function RequireVolunteer({ children }: { children: React.ReactElement }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoader />;
  if (!isAuthenticated) return <Navigate to={getHomePath()} replace />;
  if (user?.role !== 'volunteer' && user?.role !== 'admin') return <Navigate to="/profile" replace />;
  return children;
}

function AuthModalGlobal() {
  const navigate = useNavigate();
  const { closeAuthModal } = useAuth();
  const handleNavigateToTerms = () => {
    closeAuthModal();
    navigate(getHomePath());
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
          <RouteHistoryTracker />
          <GlobalToaster />
          <AuthProvider>
            <FavoritesProvider>
            <CityProvider>
              <AuthModalGlobal />
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                  <Route path="/pet-profile/:id" element={<PublicPetProfilePage />} />
                  <Route path="/my-pets/add" element={<RequireAuth><AddEditPetPageRoute /></RequireAuth>} />
                  <Route path="/my-pets/:id/edit" element={<RequireAuth><AddEditPetPageRoute /></RequireAuth>} />
                  <Route path="/my-pets/:id" element={<RequireAuth><MyPetProfilePage /></RequireAuth>} />
                  <Route path="/my-pets" element={<RequireAuth><MyPetsPageRoute /></RequireAuth>} />
                  <Route path="/pet/:id" element={<PetDetailPage />} />
                  <Route path="/shelter-pet/:id" element={<ShelterPetDetailPage />} />
                  <Route path="/user/:id" element={<UserProfilePage />} />
                  <Route path="/my-ads" element={<RequireAuth><MyAdsPageRoute /></RequireAuth>} />
                  <Route path="/create" element={<RequireAuth><CreateAdPage /></RequireAuth>} />
                  <Route path="/edit/:id" element={<RequireAuth><EditAdPage /></RequireAuth>} />
                  <Route path="/settings" element={<RequireAuth><SettingsPageRoute /></RequireAuth>} />
                  <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/blog" element={<BlogListPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/shelters/:shelterId" element={<ShelterDetailPage />} />
                  <Route path="/shelters" element={<SheltersPage />} />
                  <Route path="/shelters/" element={<SheltersPage />} />
                  <Route
                    path="/my-shelters/:shelterId/pets"
                    element={
                      <RequireAuth>
                        <RequireVolunteer>
                          <MyShelterPetsListPage />
                        </RequireVolunteer>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-shelters/:shelterId/pets/new"
                    element={
                      <RequireAuth>
                        <RequireVolunteer>
                          <MyShelterPetFormPage />
                        </RequireVolunteer>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-shelters/:shelterId/pets/:petId/edit"
                    element={
                      <RequireAuth>
                        <RequireVolunteer>
                          <MyShelterPetFormPage />
                        </RequireVolunteer>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-shelters/:shelterId/pets/:petId/campaign"
                    element={
                      <RequireAuth>
                        <RequireVolunteer>
                          <MyShelterPetCampaignPage />
                        </RequireVolunteer>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-shelters/:shelterId/team"
                    element={
                      <RequireAuth>
                        <MyShelterTeamPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-shelters/new"
                    element={
                      <RequireAuth>
                        <RequireVolunteer>
                          <MyShelterFormPage />
                        </RequireVolunteer>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-shelters/edit/:shelterId"
                    element={
                      <RequireAuth>
                        <RequireVolunteer>
                          <MyShelterFormPage />
                        </RequireVolunteer>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-shelters"
                    element={
                      <RequireAuth>
                        <RequireVolunteer>
                          <MySheltersPage />
                        </RequireVolunteer>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-shelters/"
                    element={
                      <RequireAuth>
                        <RequireVolunteer>
                          <MySheltersPage />
                        </RequireVolunteer>
                      </RequireAuth>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
              <MobileBottomNav />
            </CityProvider>
            </FavoritesProvider>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

registerSW({
  immediate: true,
  onRegistered(registration) {
    if (!registration) return
    /** Периодический запрос нового SW, чтобы вкладку не держали на старой версии сутками */
    window.setInterval(() => {
      void registration.update()
    }, 60 * 60 * 1000)
  },
})
