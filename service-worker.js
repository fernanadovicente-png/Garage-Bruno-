const CACHE='garagebruno-v2';
const ASSETS=['./','./index.html','./script.js','./manifest.json','./icons/logo.png','./icons/logo-512.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(resp=>resp||fetch(e.request).then(net=>{
    const copy=net.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy)); return net;
  }).catch(()=>resp)));
});