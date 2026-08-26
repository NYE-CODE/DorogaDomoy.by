/* Kill-switch: старый Workbox-SW кэшировал SPA.
   Не вызываем clients.navigate() — это ломает React (removeChild) на открытой вкладке. */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});
