// پس‌زمینهٔ متحرک به سبک نگارگری ایرانی:
// لایه‌های SVG (ابر چینی، سیمرغ، کوه‌های مرجانی، سوار، سرو و درخت شکوفه) با انیمیشن CSS حرکت می‌کنند (فقط transform، روی GPU)
// و این فایل غبار طلایی درخشان را روی canvas می‌کشد، اختلاف منظر (parallax) با موس را می‌سازد،
// در زبانهٔ پنهان همه چیز را متوقف می‌کند و prefers-reduced-motion را رعایت می‌کند.
(() => {
  "use strict";
  const cv = document.getElementById("bgCanvas");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  let W = 0, H = 0, DPR = 1, parts = [], sprite, raf = 0, last = 0;

  function makeSprite() {
    const s = document.createElement("canvas"), n = 32; s.width = s.height = n;
    const g = s.getContext("2d"), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    gr.addColorStop(0, "rgba(255,236,180,1)"); gr.addColorStop(.25, "rgba(233,196,106,.55)"); gr.addColorStop(1, "rgba(233,196,106,0)");
    g.fillStyle = gr; g.fillRect(0, 0, n, n); return s;
  }
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.max(36, Math.min(110, Math.round(W * H / 15000)));
    if (Math.abs(parts.length - n) > n * .25) parts = Array.from({ length: n }, () => newPart(true));
    draw(0);
  }
  function newPart(anywhere) {
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.9,
      vx: (Math.random() - .5) * 6, vy: -(3 + Math.random() * 10), ph: Math.random() * 6.28, sp: .6 + Math.random() * 1.4, a: .25 + Math.random() * .55 };
  }
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
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
  const root = document.documentElement;
  function setPaused(p) { root.classList.toggle("bg-paused", p); }
  // اختلاف منظر با حرکت موس (فقط دستگاه‌های دارای موس)
  if (window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let tx = 0, ty = 0, pend = false;
    addEventListener("pointermove", e => {
      tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5;
      if (pend || mq.matches) return; pend = true;
      requestAnimationFrame(() => { pend = false; root.style.setProperty("--mx", tx.toFixed(3)); root.style.setProperty("--my", ty.toFixed(3)); });
    }, { passive: true });
  }
  function play() { if (raf || mq.matches || document.hidden) return; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  sprite = makeSprite(); resize();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  document.addEventListener("visibilitychange", () => { setPaused(document.hidden); document.hidden ? stop() : play(); });
  setPaused(document.hidden);
  (mq.addEventListener ? mq.addEventListener("change", () => { stop(); draw(0); play(); }) : 0);
  play();
  window.__bg = { get running() { return !!raf; }, get cssPaused() { return root.classList.contains("bg-paused"); } };
})();
