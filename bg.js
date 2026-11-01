// پس‌زمینهٔ متحرک دو صحنه دارد:
//  • فارسی: نگارگری ایرانی/شاهنامه (لایه‌های SVG با انیمیشن CSS + غبار طلایی روی canvas)
//  • English: ادای احترام به «شب پرستاره»ی ون‌گوگ و گل‌ها و برگ‌های الهام‌گرفته از هنر مکزیکی (bg-en.js، با بارگذاری تنبل)
// با تغییر زبان دو صحنه نرم در هم محو می‌شوند؛ صحنهٔ غیرفعال فقط هنگام اولین نیاز بارگذاری می‌شود و پس از محو شدن متوقف می‌شود.
// در زبانهٔ پنهان همه چیز متوقف می‌شود و prefers-reduced-motion رعایت می‌شود.
(() => {
  "use strict";
  const root = document.documentElement;
  const cv = document.getElementById("bgCanvas");
  const scFa = document.querySelector(".scene-fa"), scEn = document.querySelector(".scene-en");
  if (!cv || !cv.getContext || !scFa || !scEn) return;
  const ctx = cv.getContext("2d");
  const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const FADE = 1200;
  let W = 0, H = 0, DPR = 1, parts = [], sprite, raf = 0, last = 0;
  let active = root.lang === "en" ? "en" : "fa", faOn = active === "fa", enOn = active === "en", idleT = 0, enLoading = null;

  // ---------- صحنهٔ فارسی: غبار طلایی ----------
  function makeSprite() {
    const s = document.createElement("canvas"), n = 32; s.width = s.height = n;
    const g = s.getContext("2d"), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    gr.addColorStop(0, "rgba(255,236,180,1)"); gr.addColorStop(.25, "rgba(233,196,106,.55)"); gr.addColorStop(1, "rgba(233,196,106,0)");
    g.fillStyle = gr; g.fillRect(0, 0, n, n); return s;
  }
  function newPart(anywhere) {
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.9,
      vx: (Math.random() - .5) * 6, vy: -(3 + Math.random() * 10), ph: Math.random() * 6.28, sp: .6 + Math.random() * 1.4, a: .25 + Math.random() * .55 };
  }
  function drawFa(dt) {
    ctx.clearRect(0, 0, W, H);
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
  const en = () => window.__bgEn && window.__bgEn.mounted ? window.__bgEn : null;
  function drawAll(dt) { if (faOn) drawFa(dt); if (enOn && en()) en().draw(dt); }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.max(36, Math.min(110, Math.round(W * H / 15000)));
    if (Math.abs(parts.length - n) > n * .25) parts = Array.from({ length: n }, () => newPart(true));
    if (en()) en().resize(W, H, window.devicePixelRatio || 1);
    drawAll(0);
  }

  // ---------- بارگذاری تنبل صحنه‌ها ----------
  function loadFa() {
    scFa.querySelectorAll("[data-src]").forEach(i => { i.src = i.getAttribute("data-src"); i.removeAttribute("data-src"); });
    return Promise.resolve();
  }
  function loadEn() {
    if (en()) return Promise.resolve();
    if (!enLoading) enLoading = new Promise(res => {
      const go = () => { if (!en()) window.__bgEn.mount(scEn, W, H, window.devicePixelRatio || 1); res(); };
      if (window.__bgEn) return go();
      const s = document.createElement("script"); s.src = "bg-en.js"; s.async = true;
      s.onload = go; s.onerror = () => res(); document.head.appendChild(s);
    });
    return enLoading;
  }

  // ---------- محو متقاطع ----------
  function show(lang, instant) {
    active = lang;
    const on = lang === "en" ? scEn : scFa, off = lang === "en" ? scFa : scEn;
    (lang === "en" ? loadEn() : loadFa()).then(() => {
      if (active !== lang) return;
      if (lang === "en") enOn = true; else faOn = true;
      on.classList.remove("idle");
      if (instant) on.classList.add("on"); else requestAnimationFrame(() => on.classList.add("on"));
      off.classList.remove("on");
      drawAll(0); play();
      clearTimeout(idleT);
      idleT = setTimeout(() => {           // پس از پایان محو، صحنهٔ پنهان کاملاً متوقف می‌شود
        if (active !== lang) return;
        off.classList.add("idle");
        if (lang === "en") faOn = false; else enOn = false;
      }, instant ? 0 : FADE + 100);
    });
  }
  new MutationObserver(() => { const l = root.lang === "en" ? "en" : "fa"; if (l !== active) show(l, false); })
    .observe(root, { attributes: true, attributeFilter: ["lang"] });

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    drawAll(dt); raf = requestAnimationFrame(frame);
  }
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
  (mq.addEventListener ? mq.addEventListener("change", () => { stop(); drawAll(0); play(); }) : 0);
  show(active, true);
  play();
  window.__bg = { get running() { return !!raf; }, get cssPaused() { return root.classList.contains("bg-paused"); },
    get scene() { return active; }, get faOn() { return faOn; }, get enOn() { return enOn; }, get enMounted() { return !!en(); } };
})();
