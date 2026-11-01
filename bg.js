// پس‌زمینهٔ متحرک: غبار طلایی شناور + نقش خطیِ گل دوازده‌پر تخت جمشید که آرام می‌چرخد.
// سبک و کم‌مصرف: نقش یک بار روی بوم جداگانه کشیده می‌شود؛ در زبانهٔ پنهان متوقف می‌شود؛ prefers-reduced-motion را رعایت می‌کند.
(() => {
  "use strict";
  const cv = document.getElementById("bgCanvas");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  let W = 0, H = 0, DPR = 1, parts = [], sprite, rosette, rosR = 0, raf = 0, last = 0, angle = 0;

  function makeSprite() {
    const s = document.createElement("canvas"), n = 32; s.width = s.height = n;
    const g = s.getContext("2d"), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    gr.addColorStop(0, "rgba(255,236,180,1)"); gr.addColorStop(.25, "rgba(233,196,106,.55)"); gr.addColorStop(1, "rgba(233,196,106,0)");
    g.fillStyle = gr; g.fillRect(0, 0, n, n); return s;
  }
  // گل دوازده‌پر، حلقه‌های مروارید و کنگره‌های پلکانی — فقط خط
  function makeRosette(R) {
    const s = document.createElement("canvas"), size = Math.ceil(R * 2 + 8);
    s.width = s.height = size; const g = s.getContext("2d"), c = size / 2;
    g.translate(c, c); g.strokeStyle = "rgba(233,196,106,1)"; g.lineWidth = Math.max(1, R / 420);
    const ring = r => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); };
    ring(R); ring(R * .97); ring(R * .62); ring(R * .6); ring(R * .16);
    // پرهای بزرگ
    for (let i = 0; i < 12; i++) { g.save(); g.rotate(i * Math.PI / 6); g.beginPath(); g.ellipse(0, -R * .38, R * .075, R * .2, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
    // پرهای کوچک میانی
    for (let i = 0; i < 24; i++) { g.save(); g.rotate(i * Math.PI / 12 + Math.PI / 24); g.beginPath(); g.ellipse(0, -R * .78, R * .03, R * .1, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
    // حلقهٔ مرواریدها
    for (let i = 0; i < 72; i++) { const a = i * Math.PI / 36; g.beginPath(); g.arc(Math.cos(a) * R * .925, Math.sin(a) * R * .925, R * .012, 0, Math.PI * 2); g.stroke(); }
    // کنگره‌های پلکانی رو به بیرون
    for (let i = 0; i < 36; i++) {
      g.save(); g.rotate(i * Math.PI / 18); const r0 = R * .97, st = R * .012;
      g.beginPath(); g.moveTo(-st * 3, -r0); g.lineTo(-st * 3, -r0 - st); g.lineTo(-st * 2, -r0 - st); g.lineTo(-st * 2, -r0 - 2 * st);
      g.lineTo(-st, -r0 - 2 * st); g.lineTo(-st, -r0 - 3 * st); g.lineTo(st, -r0 - 3 * st); g.lineTo(st, -r0 - 2 * st); g.lineTo(st * 2, -r0 - 2 * st);
      g.lineTo(st * 2, -r0 - st); g.lineTo(st * 3, -r0 - st); g.lineTo(st * 3, -r0); g.stroke(); g.restore();
    }
    return s;
  }
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.max(36, Math.min(110, Math.round(W * H / 15000)));
    if (Math.abs(parts.length - n) > n * .25) parts = Array.from({ length: n }, () => newPart(true));
    const R = Math.max(W, H) * .52;
    // صفحه‌کلید موبایل و نوار آدرس اندازه را کمی تغییر می‌دهند؛ فقط در تغییر محسوس دوباره می‌کشیم
    if (!rosette || Math.abs(R - rosR) > rosR * .2) { rosR = R; rosette = makeRosette(rosR * DPR); }
    draw(0);
  }
  function newPart(anywhere) {
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.9,
      vx: (Math.random() - .5) * 6, vy: -(3 + Math.random() * 10), ph: Math.random() * 6.28, sp: .6 + Math.random() * 1.4, a: .25 + Math.random() * .55 };
  }
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    // نقش چرخان
    angle += dt * 0.012;
    const cx = W * .5, cy = H * .48, d = rosette.width / DPR;
    ctx.save(); ctx.globalAlpha = .075; ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.drawImage(rosette, -d / 2, -d / 2, d, d); ctx.restore();
    ctx.save(); ctx.globalAlpha = .05; ctx.translate(cx, cy); ctx.rotate(-angle * 1.6);
    ctx.drawImage(rosette, -d * .23, -d * .23, d * .46, d * .46); ctx.restore();
    // غبار طلایی
    ctx.globalCompositeOperation = "lighter";
    const t = performance.now() / 1000;
    for (const p of parts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < -12 || p.x < -12 || p.x > W + 12) Object.assign(p, newPart(false));
      const tw = .55 + .45 * Math.sin(t * p.sp + p.ph), s = p.r * 6;
      ctx.globalAlpha = p.a * tw;
      ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    draw(dt); raf = requestAnimationFrame(frame);
  }
  function play() { if (raf || mq.matches || document.hidden) return; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  sprite = makeSprite(); resize();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : play());
  (mq.addEventListener ? mq.addEventListener("change", () => { stop(); draw(0); play(); }) : 0);
  play();
  window.__bg = { get running() { return !!raf; } };
})();
