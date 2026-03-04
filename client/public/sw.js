const CACHE_NAME = 'vem-v4';
const STATIC_CACHE = 'vem-static-v4';
const API_CACHE = 'vem-api-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.png'
];

const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="uz" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
  <meta name="theme-color" content="#0a0a12">
  <title>VEM - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a12; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .bg-orb1 { position: absolute; top: 15%; left: 20%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%); border-radius: 50%; filter: blur(60px); animation: floatOrb 8s ease-in-out infinite; }
    .bg-orb2 { position: absolute; bottom: 10%; right: 15%; width: 250px; height: 250px; background: radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%); border-radius: 50%; filter: blur(50px); animation: floatOrb 10s ease-in-out infinite reverse; }
    .container { text-align: center; padding: 2rem; max-width: 380px; position: relative; z-index: 1; }
    .wifi-icon-wrap { position: relative; width: 100px; height: 100px; margin: 0 auto 2rem; }
    .wifi-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(59,130,246,0.15); animation: ringPulse 3s ease-out infinite; }
    .wifi-ring:nth-child(2) { animation-delay: 1s; }
    .wifi-ring:nth-child(3) { animation-delay: 2s; }
    .wifi-icon-inner { position: absolute; inset: 15px; border-radius: 24px; background: linear-gradient(135deg, #2563eb, #7c3aed); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(37,99,235,0.35); animation: iconBounce 4s ease-in-out infinite; }
    .wifi-icon-inner svg { width: 36px; height: 36px; stroke: #fff; }
    .slash { position: absolute; top: 50%; left: 50%; width: 55px; height: 3px; background: #ef4444; transform: translate(-50%, -50%) rotate(-45deg); border-radius: 2px; box-shadow: 0 0 8px rgba(239,68,68,0.5); animation: slashAppear 0.6s ease-out 0.5s both; }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; background: linear-gradient(135deg, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { font-size: 0.85rem; color: #64748b; line-height: 1.7; margin-bottom: 0.75rem; }
    .lang-tabs { display: flex; justify-content: center; gap: 8px; margin-bottom: 2rem; }
    .lang-tab { padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #94a3b8; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .lang-tab.active { background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; border-color: transparent; box-shadow: 0 4px 15px rgba(37,99,235,0.3); }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; border: none; padding: 1rem 2.5rem; border-radius: 1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 25px rgba(37,99,235,0.35); position: relative; overflow: hidden; }
    .btn:active { transform: scale(0.96); }
    .btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%); transform: translateX(-100%); animation: shimmer 3s ease-in-out infinite; }
    .status-dot { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 2rem; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.6); animation: dotPulse 2s ease-in-out infinite; }
    .dot:nth-child(2) { animation-delay: 0.3s; }
    .dot:nth-child(3) { animation-delay: 0.6s; }
    .status-text { font-size: 0.7rem; color: #ef4444; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
    @keyframes floatOrb { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-25px) scale(1.08); } }
    @keyframes ringPulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
    @keyframes iconBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes slashAppear { from { transform: translate(-50%,-50%) rotate(-45deg) scaleX(0); } to { transform: translate(-50%,-50%) rotate(-45deg) scaleX(1); } }
    @keyframes shimmer { 0%,100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
    @keyframes dotPulse { 0%,100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
    .msg { display: none; }
    .msg.active { display: block; }
  </style>
</head>
<body>
  <div class="bg-orb1"></div>
  <div class="bg-orb2"></div>
  <div class="container">
    <div class="wifi-icon-wrap">
      <div class="wifi-ring"></div>
      <div class="wifi-ring"></div>
      <div class="wifi-ring"></div>
      <div class="wifi-icon-inner">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01M4.93 13.222a10 10 0 0114.14 0M1.394 9.393a15 15 0 0121.213 0"/></svg>
      </div>
      <div class="slash"></div>
    </div>

    <div class="status-dot">
      <div class="dot"></div><div class="dot"></div><div class="dot"></div>
      <span class="status-text" id="statusText">OFFLINE</span>
    </div>

    <div class="lang-tabs">
      <button class="lang-tab active" onclick="switchLang('uz')">O'zbek</button>
      <button class="lang-tab" onclick="switchLang('ru')">Русский</button>
      <button class="lang-tab" onclick="switchLang('en')">English</button>
    </div>

    <div id="msg-uz" class="msg active">
      <h1>Aloqa mavjud emas</h1>
      <p class="subtitle">Internet aloqangizni tekshiring va qayta urinib ko'ring.<br>Ilova internetga ulangandan keyin avtomatik ishga tushadi.</p>
    </div>
    <div id="msg-ru" class="msg">
      <h1>Нет подключения</h1>
      <p class="subtitle">Проверьте подключение к интернету и попробуйте снова.<br>Приложение автоматически заработает при восстановлении связи.</p>
    </div>
    <div id="msg-en" class="msg">
      <h1>No Connection</h1>
      <p class="subtitle">Check your internet connection and try again.<br>The app will resume automatically when you're back online.</p>
    </div>

    <button class="btn" onclick="window.location.reload()">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
      <span id="btnText">Qayta urinish</span>
    </button>
  </div>

  <script>
    var texts = {
      uz: { btn: "Qayta urinish", status: "OFFLINE" },
      ru: { btn: "Повторить", status: "НЕТ СЕТИ" },
      en: { btn: "Try Again", status: "OFFLINE" }
    };
    function switchLang(lang) {
      document.querySelectorAll('.msg').forEach(function(el) { el.classList.remove('active'); });
      document.getElementById('msg-' + lang).classList.add('active');
      document.querySelectorAll('.lang-tab').forEach(function(el) { el.classList.remove('active'); });
      event.target.classList.add('active');
      document.getElementById('btnText').textContent = texts[lang].btn;
      document.getElementById('statusText').textContent = texts[lang].status;
    }
    window.addEventListener('online', function() { window.location.reload(); });
  </script>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== API_CACHE && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let data = { title: 'VEM Fund', body: '', icon: '/icons/icon-192.png', url: '/notifications' };
  try {
    if (event.data) {
      const payload = event.data.json();
      data.title = payload.title || data.title;
      data.body = payload.body || payload.message || '';
      data.icon = payload.icon || data.icon;
      data.url = payload.url || data.url;
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/icons/icon-192.png',
      data: { url: data.url },
      vibrate: [200, 100, 200],
      tag: 'vem-notification',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(OFFLINE_PAGE, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (response.ok && (request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.destination === 'font')) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => new Response('', { status: 503 }));
    })
  );
});
