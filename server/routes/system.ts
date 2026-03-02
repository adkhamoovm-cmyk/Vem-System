import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, webpush, asyncHandler } from "../lib/helpers";

const router = Router();

const vapidPublic = process.env.VAPID_PUBLIC_KEY || "";

router.get("/api/download-app", (req: Request, res: Response) => {
  const domain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "vem.app";
  const ua = req.headers["user-agent"] || "";
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VEM Ilovani O'rnatish</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#0a0a1a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:linear-gradient(145deg,#12122a,#1a1a2e);border:1px solid rgba(99,102,241,0.2);border-radius:24px;padding:28px 24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
.logo{width:120px;height:auto;margin:0 auto 16px;filter:drop-shadow(0px 4px 12px rgba(79,107,255,0.4))}
h1{font-size:20px;margin-bottom:4px;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700}
.subtitle{color:#94a3b8;font-size:13px;margin-bottom:20px}
.browser-tabs{display:flex;gap:6px;margin-bottom:16px;background:#0f0f23;border-radius:12px;padding:4px}
.tab{flex:1;padding:10px 8px;border-radius:10px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.3s;color:#64748b;display:flex;align-items:center;justify-content:center;gap:4px}
.tab.active{background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
.tab svg{width:16px;height:16px}
.guide{display:none;animation:fadeIn 0.3s ease}
.guide.active{display:block}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.steps{text-align:left;background:rgba(15,15,35,0.6);border:1px solid rgba(99,102,241,0.1);border-radius:16px;padding:16px;margin:12px 0}
.step{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(99,102,241,0.08)}.step:last-child{border:0;padding-bottom:0}
.num{background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;box-shadow:0 2px 8px rgba(59,130,246,0.3)}
.step-text{font-size:13px;color:#cbd5e1;line-height:1.6}
.step-text b{color:#e2e8f0}
.step-text code{color:#60a5fa;background:rgba(59,130,246,0.1);padding:2px 6px;border-radius:4px;font-size:12px}
.highlight{display:inline-flex;align-items:center;gap:4px;background:rgba(59,130,246,0.15);color:#93c5fd;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;margin:2px 0}
.note{background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.15);border-radius:12px;padding:12px 14px;margin-top:12px;display:flex;align-items:flex-start;gap:8px}
.note-icon{font-size:16px;flex-shrink:0;margin-top:1px}
.note-text{font-size:12px;color:#fbbf24;line-height:1.5}
.btn{display:block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border:none;padding:14px;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;width:100%;margin-top:16px;transition:all 0.3s;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
.btn:active{transform:scale(0.98)}
.detected{display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:#4ade80;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500;margin-bottom:16px}
.detected svg{width:14px;height:14px}
</style></head><body>
<div class="card">
<img src="/icons/vem-logo.png" alt="VEM" class="logo">
<h1>VEM Ilovani O'rnatish</h1>
<p class="subtitle">Telefoningizga VEM ilovasini o'rnating</p>

<div id="detected" class="detected" style="display:none"></div>

<div class="browser-tabs">
  <div class="tab" id="tab-chrome" onclick="showGuide('chrome')">
    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4"/></svg>
    Chrome
  </div>
  <div class="tab" id="tab-safari" onclick="showGuide('safari')">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>
    Safari
  </div>
  <div class="tab" id="tab-samsung" onclick="showGuide('samsung')">
    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="2" width="14" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18" r="1"/></svg>
    Samsung
  </div>
</div>

<div id="guide-chrome" class="guide">
  <div class="steps">
    <div class="step"><div class="num">1</div><div class="step-text"><b>Chrome</b> brauzerida saytni oching:<br><code>${domain}</code></div></div>
    <div class="step"><div class="num">2</div><div class="step-text">Yuqori o'ng burchakdagi <span class="highlight">⋮ Uch nuqta</span> menyusini bosing</div></div>
    <div class="step"><div class="num">3</div><div class="step-text"><span class="highlight">📲 Bosh ekranga qo'shish</span> yoki <span class="highlight">Install app</span> ni tanlang</div></div>
    <div class="step"><div class="num">4</div><div class="step-text"><b>"O'rnatish"</b> tugmasini bosib tasdiqlang — tayyor!</div></div>
  </div>
  <div class="note"><span class="note-icon">💡</span><span class="note-text">Agar "Bosh ekranga qo'shish" ko'rinmasa — sahifani bir marta yangilang va qayta urinib ko'ring</span></div>
</div>

<div id="guide-safari" class="guide">
  <div class="steps">
    <div class="step"><div class="num">1</div><div class="step-text"><b>Safari</b> brauzerida saytni oching:<br><code>${domain}</code></div></div>
    <div class="step"><div class="num">2</div><div class="step-text">Pastki paneldagi <span class="highlight">⬆ Ulashish (Share)</span> tugmasini bosing</div></div>
    <div class="step"><div class="num">3</div><div class="step-text">Pastga aylantiring va <span class="highlight">➕ Bosh ekranga qo'shish</span> ni tanlang</div></div>
    <div class="step"><div class="num">4</div><div class="step-text">O'ng yuqoridagi <b>"Qo'shish"</b> tugmasini bosing — tayyor!</div></div>
  </div>
  <div class="note"><span class="note-icon">🍎</span><span class="note-text">Safari — iPhone va iPad uchun yagona PWA o'rnatish usuli. Chrome/Firefox orqali iPhone'ga o'rnatib bo'lmaydi</span></div>
</div>

<div id="guide-samsung" class="guide">
  <div class="steps">
    <div class="step"><div class="num">1</div><div class="step-text"><b>Samsung Internet</b> brauzerida saytni oching:<br><code>${domain}</code></div></div>
    <div class="step"><div class="num">2</div><div class="step-text">Pastki paneldagi <span class="highlight">☰ Menyu (3 chiziq)</span> tugmasini bosing</div></div>
    <div class="step"><div class="num">3</div><div class="step-text"><span class="highlight">➕ Sahifani qo'shish</span> → <span class="highlight">Bosh ekran</span> ni tanlang</div></div>
    <div class="step"><div class="num">4</div><div class="step-text"><b>"Qo'shish"</b> tugmasini bosing — tayyor!</div></div>
  </div>
  <div class="note"><span class="note-icon">📱</span><span class="note-text">Samsung Galaxy telefonlarida Samsung Internet brauzeri oldindan o'rnatilgan bo'ladi</span></div>
</div>

<button class="btn" onclick="history.back() || (location.href='/')">↩ Orqaga qaytish</button>
</div>

<script>
function showGuide(browser) {
  document.querySelectorAll('.guide').forEach(g => g.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('guide-' + browser).classList.add('active');
  document.getElementById('tab-' + browser).classList.add('active');
}
(function() {
  var ua = navigator.userAgent || '';
  var detected = document.getElementById('detected');
  var browser = 'chrome';
  var label = '';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'safari';
    label = '🍎 Safari aniqlandi';
  } else if (/SamsungBrowser/.test(ua)) {
    browser = 'samsung';
    label = '📱 Samsung Internet aniqlandi';
  } else if (/Chrome/.test(ua)) {
    browser = 'chrome';
    label = '🌐 Chrome aniqlandi';
  }
  if (label) {
    detected.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ' + label;
    detected.style.display = 'inline-flex';
  }
  showGuide(browser);
})();
</script>
</body></html>`);
});

router.get("/api/notifications", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const list = await storage.getUserNotifications(userId, 50);
  res.json(list);
}));

router.get("/api/notifications/unread-count", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const count = await storage.getUnreadNotificationCount(userId);
  res.json({ count });
}));

router.post("/api/notifications/:id/read", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  await storage.markNotificationRead(req.params.id, userId);
  res.json({ ok: true });
}));

router.post("/api/notifications/read-all", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  await storage.markAllNotificationsRead(userId);
  res.json({ ok: true });
}));

router.get("/api/push/vapid-key", (_req: Request, res: Response) => {
  res.json({ publicKey: vapidPublic });
});

router.post("/api/push/subscribe", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const { endpoint, keys, locale } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: "Invalid subscription" });
  }
  await storage.savePushSubscription({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, locale: locale || "uz" });
  res.json({ ok: true });
}));

router.post("/api/push/unsubscribe", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ message: "Endpoint required" });
  await storage.deletePushSubscription(userId, endpoint);
  res.json({ ok: true });
}));

export default router;
