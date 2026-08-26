/* Kill-switch: ранее сайт регистрировал SW, который кэшировал SPA.
   После удаления SW из кода nginx отдавал /sw.js как index.html (try_files),
   поэтому старый воркер не обновлялся и показывал 404 на новые маршруты. */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(windows.map((client) => client.navigate(client.url)));
    })(),
  );
});
