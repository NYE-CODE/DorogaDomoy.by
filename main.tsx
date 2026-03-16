import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router'
import SearchPage from './pages/SearchPage.tsx'
import ProfilePage from './components/profile-page.tsx'
import PetDetailPage from './pages/PetDetailPage.tsx'
import UserProfilePage from './pages/UserProfilePage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import MyAdsPageRoute from './pages/MyAdsPage.tsx'
import CreateAdPage from './pages/CreateAdPage.tsx'
import SettingsPageRoute from './pages/SettingsPage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { I18nProvider } from './context/I18nContext.tsx'
import './styles/globals.css'

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <MetrikaTracker />
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/search" replace />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/pet/:id" element={<PetDetailPage />} />
              <Route path="/user/:id" element={<UserProfilePage />} />
              <Route path="/my-ads" element={<MyAdsPageRoute />} />
              <Route path="/create" element={<CreateAdPage />} />
              <Route path="/settings" element={<SettingsPageRoute />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
