import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './App.tsx'
import ProfilePage from './components/profile-page.tsx'
import PetDetailPage from './pages/PetDetailPage.tsx'
import UserProfilePage from './pages/UserProfilePage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import MyAdsPageRoute from './pages/MyAdsPage.tsx'
import SettingsPageRoute from './pages/SettingsPage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { I18nProvider } from './context/I18nContext.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/pet/:id" element={<PetDetailPage />} />
              <Route path="/user/:id" element={<UserProfilePage />} />
              <Route path="/my-ads" element={<MyAdsPageRoute />} />
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
