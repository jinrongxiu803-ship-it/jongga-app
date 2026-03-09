const CACHE = 'jongga-v3';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('yahoo') || e.request.url.includes('anthropic') || e.request.url.includes('corsproxy')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html'))));
});

// 백그라운드/앱 꺼진 상태 알림 수신
self.addEventListener('push', e => {
  const d = e.data?.json() || {title:'종가배팅 AI', body:'알림 도착'};
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: d.tag || 'jongga',
    requireInteraction: true,
    vibrate: [200,100,200,100,300],
    actions: [{action:'open',title:'앱 열기'},{action:'close',title:'닫기'}],
    data: d
  }));
});

// 알림 클릭
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return clients.openWindow('/');
    })
  );
});

// 앱에서 보내는 예약 알림 처리
const timers = {};
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE') {
    const {id, delayMs, title, body, tag} = e.data;
    if (timers[id]) clearTimeout(timers[id]);
    if (delayMs > 0) {
      timers[id] = setTimeout(() => {
        self.registration.showNotification(title, {
          body, icon:'/icons/icon-192.png', badge:'/icons/icon-192.png',
          tag: tag||id, requireInteraction:true, vibrate:[300,100,300,100,300]
        });
      }, delayMs);
    }
  }
  if (e.data?.type === 'CANCEL') {
    const {id} = e.data;
    if (timers[id]) { clearTimeout(timers[id]); delete timers[id]; }
  }
});
