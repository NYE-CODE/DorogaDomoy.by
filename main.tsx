import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './App.tsx'
import PetDetailPage from './pages/PetDetailPage.tsx'
import UserProfilePage from './pages/UserProfilePage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/pet/:id" element={<PetDetailPage />} />
          <Route path="/user/:id" element={<UserProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
