// Martini · service worker mínimo: instalable y con las imágenes en caché. La app siempre pide la versión nueva primero.
const C='martini-v1';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(u.pathname.startsWith('/img/')||u.pathname.startsWith('/icons/')){e.respondWith(caches.open(C).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok)c.put(e.request,n.clone());return n;}))));return;}
  e.respondWith(fetch(e.request).then(n=>{if(n.ok){const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));}return n;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))));});
