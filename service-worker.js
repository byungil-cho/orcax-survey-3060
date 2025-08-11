// service-worker.js (minimal)
const VERSION = 'v1-corn-idx';
self.addEventListener('install', (e)=>{ self.skipWaiting(); });
self.addEventListener('activate', (e)=>{ self.clients.claim(); });

// 캐시 네임
const RUNTIME = 'rt-' + VERSION;

// /api/는 건드리지 않음(3060 CORS 요청 그대로 네트워크)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 교차 출처이거나, /api/ 로 시작하면 스킵
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // GET만 캐시
  if (event.request.method !== 'GET') return;

  event.respondWith((async ()=>{
    const cache = await caches.open(RUNTIME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      // HTML은 네비게이션 캐시 방지(개발 편의)
      if (!res || res.status !== 200 || res.type === 'opaque') return res;
      const ct = res.headers.get('content-type')||'';
      if (!ct.includes('text/html')) cache.put(event.request, res.clone());
      return res;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
