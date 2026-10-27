const SHELL_CACHE = 'ashen-shell-__ASHEN_BUILD_ID__';
const BUILD_ID = '__ASHEN_BUILD_ID__';
const APP_FILES = [
  './',
  './index.html',
  './play.html',
  './app.js?v=__ASHEN_BUILD_ID__',
  './styles.css?v=__ASHEN_BUILD_ID__',
  './play.css?v=__ASHEN_BUILD_ID__',
  './app-update.css?v=__ASHEN_BUILD_ID__',
  './mobile-manager.css?v=__ASHEN_BUILD_ID__',
  './campaign.js?v=__ASHEN_BUILD_ID__',
  './story-progression.js',
  './play.js?v=__ASHEN_BUILD_ID__',
  './app-update.js?v=__ASHEN_BUILD_ID__',
  './mobile-manager.js?v=__ASHEN_BUILD_ID__',
  './save-utils.js',
  './vendor/three.module.js',
  './vendor/three.core.js',
  './vendor/GLTFLoader.js',
  './utils/BufferGeometryUtils.js',
  './utils/SkeletonUtils.js',
  './Assets/ashen-crown-logo.svg',
  './play-boot.js?v=__ASHEN_BUILD_ID__',
  './auth-config.js?v=__ASHEN_BUILD_ID__',
  './auth.js?v=__ASHEN_BUILD_ID__',
  './cloud-save-queue.js',
  './i18n.js?v=__ASHEN_BUILD_ID__',
  './model3d.js?v=__ASHEN_BUILD_ID__',
  './model3d.css',
  './assets/ashen-crown-logo.svg',
  './site.webmanifest',
  './resource-pack.json',
];
const CURRENT_ASSETS = new Set(APP_FILES.map((path) => new URL(path, self.location.href).href));

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
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: 'ASHEN_APP_VERSION', buildId: BUILD_ID });
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

    // Return only assets belonging to the active build's precache. Navigations
    // above are network-first; unknown same-origin assets are revalidated online.
    const cached = CURRENT_ASSETS.has(url.href) ? await cache.match(request) : null;
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'ASHEN_GET_VERSION') {
    const response = { type: 'ASHEN_APP_VERSION', buildId: BUILD_ID };
    if (event.ports?.[0]) event.ports[0].postMessage(response);
    else event.source?.postMessage(response);
    return;
  }
  if (event.data?.type === 'ASHEN_SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});
