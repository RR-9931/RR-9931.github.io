/* 总入口 service worker：只管总入口自己这一页（离线也能打开）。
   钱簿、书斋、事后诸葛亮各有自己的 service worker，范围比这个窄，所以不会被这里影响。 */
const VERSION = 'hub-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hub-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const base = new URL('./', self.registration.scope).pathname;
  const mine = u.pathname === base || u.pathname === base + 'index.html' || SHELL.some(s => s !== './' && u.pathname === base + s.slice(2));
  if (!mine) return; // 其他 app 的请求一律不碰
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    try { const r = await fetch(e.request, { cache: 'no-store' }); if (r.ok) c.put(e.request, r.clone()); return r; }
    catch (err) { return (await c.match(e.request, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error(); }
  })());
});
