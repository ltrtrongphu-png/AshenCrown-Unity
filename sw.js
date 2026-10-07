const SHELL_CACHE = 'ashen-shell-__ASHEN_BUILD_ID__';
const APP_FILES = [
  './',
  './index.html',
  './play.html',
  './styles.css',
  './play.css',
  './campaign.js',
  './play.js',
  './i18n.js',
  './model3d.js',
  './model3d.css',
  './Assets/ashen-crown-logo.svg',
  './resource-pack.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('ashen-shell-') && name !== SHELL_CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isPackAsset = url.origin === self.location.origin && url.pathname.includes('/Assets/Models/');

  if (isPackAsset) return;
  if (url.origin !== self.location.origin && !['cdn.jsdelivr.net', 'esm.sh'].includes(url.hostname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const cachedPage = await cache.match(request);
        if (cachedPage) return cachedPage;
        const path = url.pathname.replace(/\/+$/, '');
        const fallback = path.endsWith('/play') ? './play.html' : './index.html';
        const offlinePage = await cache.match(fallback);
        if (offlinePage) return offlinePage;
        throw error;
      }
    }

    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && (response.type === 'basic' || response.type === 'cors')) await cache.put(request, response.clone());
    return response;
  })());
});
