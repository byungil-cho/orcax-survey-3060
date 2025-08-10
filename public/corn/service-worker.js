const VERSION = 'v1.0.0';
const PRECACHE = `precache-${VERSION}`;
const RUNTIME  = `runtime-${VERSION}`;
const CORE = ['./','corn-index.html','corn-farm.html','js/app.js','js/sw-register.js','manifest.webmanifest'];
self.addEventListener('install',(e)=>{e.waitUntil(caches.open(PRECACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',(e)=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>![PRECACHE,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',(e)=>{
  const req=e.request; const url=new URL(req.url);
  const isImage=/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(url.pathname); const isImgFolder=url.pathname.includes('/img/');
  if(isImage && isImgFolder){ e.respondWith((async()=>{ const cached=await caches.match(req); if(cached) return cached;
    try{ const res=await fetch(req); const copy=res.clone(); caches.open(RUNTIME).then(cache=>cache.put(req,copy)); return res; }catch{ return cached||Response.error(); } })()); return; }
  if(req.mode==='navigate'){ e.respondWith((async()=>{ try{ const res=await fetch(req); const copy=res.clone(); caches.open(RUNTIME).then(cache=>cache.put(req,copy)); return res; }catch{ return (await caches.match(req))||(await caches.match('corn-farm.html')); } })()); return; }
  e.respondWith(fetch(req).catch(()=>caches.match(req)));
});
self.addEventListener('message', async (e)=>{
  const {type, assets}=e.data||{};
  if(type==='PRECACHE' && Array.isArray(assets)){ const cache=await caches.open(PRECACHE); await cache.addAll(assets);
    const clients=await self.clients.matchAll(); clients.forEach(c=>c.postMessage({type:'PRECACHED', count:assets.length})); }
});