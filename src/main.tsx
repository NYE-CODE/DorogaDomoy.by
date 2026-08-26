import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import '@/shared/styles/globals.css';
import '../landing/styles/fonts.css';

/** Снять застрявший PWA-воркер без reload во время первого render. */
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
}
if (typeof caches !== 'undefined') {
  void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
