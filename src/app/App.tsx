import { Suspense } from 'react';
import { BrowserRouter, Routes } from 'react-router';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { I18nProvider } from '@/app/providers/I18nContext';
import { FeatureFlagsProvider } from '@/app/providers/FeatureFlagsContext';
import { PartnerAdsProvider } from '@/features/partner-ads/PartnerAdsContext';
import { AuthProvider } from '@/app/providers/AuthContext';
import { FavoritesProvider } from '@/app/providers/FavoritesContext';
import { CityProvider } from '@/app/providers/CityContext';
import { ShelterPetBrowseProvider } from '@/app/providers/ShelterPetBrowseContext';
import { SeoRouteSync } from '@/widgets/seo/SeoRouteSync';
import { ScrollToTopOnRouteChange } from '@/widgets/seo/ScrollToTopOnRouteChange';
import { MobileBottomNav } from '@/widgets/layout/MobileBottomNav';
import { SkipToContent } from '@/widgets/layout/SkipToContent';
import { CookieConsentBanner } from '../../components/cookie-consent-banner';
import { MainContentLandmark } from '@/widgets/layout/MainContentLandmark';
import { MetrikaTracker } from '@/app/router/MetrikaTracker';
import { RouteHistoryTracker } from '@/app/router/RouteHistoryTracker';
import { GlobalToaster } from '@/app/router/GlobalToaster';
import { AuthModalGlobal } from '@/app/router/AuthModalGlobal';
import { RouteLoader } from '@/app/router/RouteLoader';
import { ErrorBoundary } from '@/widgets/error/ErrorBoundary';
import { AppRoutes } from '@/app/router/routes';

/** Корневой компонент: провайдеры, роутинг, глобальные виджеты. */
export function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <FeatureFlagsProvider>
          <PartnerAdsProvider>
            <BrowserRouter>
              <SkipToContent />
              <MainContentLandmark />
              <SeoRouteSync />
              <ScrollToTopOnRouteChange />
              <MetrikaTracker />
              <RouteHistoryTracker />
              <GlobalToaster />
              <AuthProvider>
                <FavoritesProvider>
                  <CityProvider>
                    <ShelterPetBrowseProvider>
                      <AuthModalGlobal />
                      <Suspense fallback={<RouteLoader />}>
                        <ErrorBoundary>
                          <Routes>{AppRoutes()}</Routes>
                        </ErrorBoundary>
                      </Suspense>
                      <MobileBottomNav />
                      <CookieConsentBanner />
                    </ShelterPetBrowseProvider>
                  </CityProvider>
                </FavoritesProvider>
              </AuthProvider>
            </BrowserRouter>
          </PartnerAdsProvider>
        </FeatureFlagsProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
