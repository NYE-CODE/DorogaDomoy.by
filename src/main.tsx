import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from '@/app/App';
import '@/shared/styles/globals.css';
import '../landing/styles/fonts.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

let swReloadPending = false;
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swReloadPending) return;
    swReloadPending = true;
    window.location.reload();
  });
}

registerSW({
  immediate: true,
  onRegistered(registration) {
    if (!registration) return;
    window.setInterval(() => {
      void registration.update();
    }, 60 * 60 * 1000);
  },
});
