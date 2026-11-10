// 더치지직 (The Chzzk) Universal Web / PWA Service Worker
const CACHE_NAME = 'thechzzk-web-v1.3';
const SHELL_ASSETS = [
  './mobile_app.html',
  './manifest.json',
  './css/mobile_style.css',
  './js/hls.min.js',
  './js/chzzk_engine.js',
  './js/chzzk_client_api.js',
  './js/mobile_controller.js',
  './img/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('일부 정적 파일 캐시 실패 (무시 가능):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 미디어 스트림, 비디오 청크(m3u8, ts, mp4), API 요청, 외부 도메인은 서비스 워커 우회하여 브라우저 직접 처리
  if (
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('naver.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('corsproxy') ||
    url.hostname.includes('allorigins') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./mobile_app.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
