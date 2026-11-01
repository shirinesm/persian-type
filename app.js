(() => {
  "use strict";
  const ZWNJ = "\u200C";
  const HARAKAT = /[\u064B-\u0652\u0670\u0640]/g; // اعراب و کشیده
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const fa = n => String(n).replace(/\d/g, d => FA_DIGITS[d]);

  // یکسان‌سازی ی/ک عربی و فارسی و حذف اعراب
  function normalizeText(s) {
    return s.replace(HARAKAT, "")
      .replace(/[\u064A\u0649]/g, "ی")   // ي ى → ی
      .replace(/\u0643/g, "ک")          // ك → ک
      .replace(/[\u200D\u200F\u200E]/g, "")
      .replace(/\s+/g, " ").trim();
  }
  function normChar(c) {
    if (c === "\u064A" || c === "\u0649") return "ی";
    if (c === "\u0643") return "ک";
    if (c === "\u0629") return "ه";
    return c;
  }
  // نیم‌فاصله را با نیم‌فاصله یا فاصله می‌پذیریم (بسیاری از صفحه‌کلیدها نیم‌فاصله ندارند)
  function matches(expected, typed) {
    typed = normChar(typed);
    if (expected === ZWNJ) return typed === ZWNJ || typed === " ";
    return expected === typed;
  }

  const POOL = PASSAGES.map((p, i) => ({ ...p, id: i, text: normalizeText(p.text) }));

  const $ = id => document.getElementById(id);
  const wordsEl = $("words"), wrap = $("wordsWrap"), input = $("hiddenInput");
  const timerEl = $("timer"), liveWpmEl = $("liveWpm");

  const cfg = { mode: "time", time: 30, len: "short" };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem("ptype-cfg") || "{}")); } catch (e) {}

  let target = "", segments = [], typed = "";
  let total = 0, correctKeys = 0, startTime = 0, tick = null, running = false, finished = false;
  let lastPick = -1;
  let samples = [], lastSampleSec = 0, errSince = 0;
  const reduceMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pickRandom(list) {
    let p; do { p = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && p.id === lastPick);
    lastPick = p.id; return p;
  }

  function buildPassageMode() {
    const short = POOL.filter(p => p.text.length <= 90);
    const medium = POOL.filter(p => p.text.length > 90 && p.text.length <= 170);
    const long = POOL.filter(p => p.text.length > 170);
    if (cfg.len === "short") return [pickRandom(short)];
    if (cfg.len === "medium") return [pickRandom(medium)];
    // متن بلند: یک قطعهٔ بلند، یا چند قطعه پشت سر هم تا حدود ۲۵۰ نویسه
    const out = [pickRandom(long.concat(medium))]; let len = out[0].text.length;
    const bag = shuffle(POOL.filter(p => p.id !== out[0].id));
    while (len < 250 && bag.length) { const p = bag.pop(); out.push(p); len += p.text.length + 1; }
    return out;
  }
  function buildTimeMode() {
    const need = Math.max(500, cfg.time * 22);
    const out = []; let len = 0; let bag = shuffle(POOL.slice());
    while (len < need) { if (!bag.length) bag = shuffle(POOL.slice()); const p = bag.pop(); out.push(p); len += p.text.length + 1; }
    return out;
  }

  function setTarget(list) {
    segments = []; target = "";
    list.forEach(p => appendSegment(p, false));
  }
  function appendSegment(p, render) {
    const start = target.length ? target.length + 1 : 0;
    target = target ? target + " " + p.text : p.text;
    segments.push({ p, start, end: target.length });
    if (render) {
      // کلمهٔ آخر (که فاصلهٔ پایانی نداشت) دوباره ساخته می‌شود
      const last = words.pop(); last.el.remove();
      buildWords(last.start);
    }
  }

  // ---------- نمایش ----------
  // برای اتصال درست حروف فارسی (به‌ویژه در Safari) هر کلمه از چند «تکه» ساخته می‌شود:
  // نویسه‌های پشت‌سرهمی که وضعیت یکسان دارند (درست / غلط / تایپ‌نشده) در یک span می‌آیند،
  // و در مرز دو تکه، اگر دو حرف باید به هم بچسبند، از دو طرف ZWJ گذاشته می‌شود تا شکل پیوستهٔ حروف حفظ شود.
  // نشانگر (caret) یک عنصر جداست که با Range.getClientRects جای‌گذاری می‌شود.
  const ZWJ = "\u200D";
  const RIGHT_ONLY = new Set("اآأإٱدذرزژوؤۀة");
  const isArabicLetter = c => /[\u0620-\u064A\u066E-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF]/.test(c);
  const joinsLeft = c => isArabicLetter(c) && c !== "ء" && !RIGHT_ONLY.has(c);   // به حرف بعدی می‌چسبد
  const joinsRight = c => isArabicLetter(c) && c !== "ء";                         // به حرف قبلی می‌چسبد
  const needZWJ = k => joinsLeft(target[k - 1]) && joinsRight(target[k]);

  let words = [], charWord = [], posNode = [], posOff = [];
  const caret = document.createElement("div"); caret.id = "caret";

  function render() {
    wordsEl.textContent = ""; words = []; charWord = []; posNode = []; posOff = [];
    wordsEl.appendChild(caret);
    buildWords(0);
  }
  function buildWords(from) {
    let i = from;
    while (i < target.length) {
      const s = i;
      while (i < target.length && target[i] !== " ") i++;
      if (i < target.length) i++; // فاصلهٔ پایان کلمه
      const el = document.createElement("span"); el.className = "word";
      const wi = words.length; words.push({ start: s, end: i, el });
      for (let k = s; k < i; k++) charWord[k] = wi;
      wordsEl.appendChild(el); renderWord(wi);
    }
  }
  function stateOf(i) {
    if (i >= typed.length) return "";
    if (matches(target[i], typed[i])) return "ok";
    return target[i] === " " || target[i] === ZWNJ ? "badspace" : "bad";
  }
  function renderWord(wi) {
    const w = words[wi], el = w.el;
    el.textContent = "";
    const hasSp = target[w.end - 1] === " ";
    const lettersEnd = hasSp ? w.end - 1 : w.end;
    let k = w.start;
    while (k < lettersEnd) {
      const st = stateOf(k); let j = k;
      while (j < lettersEnd && stateOf(j) === st) j++;
      let text = "";
      if (k > w.start && needZWJ(k)) text += ZWJ;
      const offs = [];
      for (let m = k; m < j; m++) { offs.push(text.length); text += target[m]; }
      if (j < lettersEnd && needZWJ(j)) text += ZWJ;
      const span = document.createElement("span");
      span.className = st || "u";
      const tn = document.createTextNode(text); span.appendChild(tn); el.appendChild(span);
      for (let m = k; m < j; m++) { posNode[m] = tn; posOff[m] = offs[m - k]; }
      k = j;
    }
    if (hasSp) {
      const st = stateOf(w.end - 1);
      const span = document.createElement("span"); span.className = "sp" + (st ? " " + st : "");
      const tn = document.createTextNode("\u00A0"); span.appendChild(tn); el.appendChild(span);
      posNode[w.end - 1] = tn; posOff[w.end - 1] = 0;
    }
  }

  function updateRange(a, b) {
    const n = target.length; if (!n) return;
    const w0 = charWord[Math.min(a, n - 1)], w1 = charWord[Math.min(Math.max(b - 1, a), n - 1)];
    for (let wi = w0; wi <= w1; wi++) renderWord(wi);
    placeCaret();
  }

  const range = document.createRange();
  function charRect(i) {
    const node = posNode[i];
    range.setStart(node, posOff[i]); range.setEnd(node, posOff[i] + 1);
    const rects = range.getClientRects();
    for (const r of rects) if (r.width > 0) return r;
    return rects[0] || node.parentElement.getBoundingClientRect();
  }
  function placeCaret() {
    const n = target.length; if (!n) return;
    const idx = Math.min(typed.length, n);
    const atEnd = idx >= n;
    const ci = atEnd ? n - 1 : idx;
    const r = charRect(ci);
    const base = wordsEl.getBoundingClientRect();
    const x = (atEnd ? r.left : r.right) - base.left;   // راست‌به‌چپ: ابتدای نویسه سمت راست آن است
    const wordEl = words[charWord[ci]].el;
    const lh = wordEl.offsetHeight || parseFloat(getComputedStyle(wrap).lineHeight);
    caret.style.transform = `translate(${Math.round(x - 1)}px, ${Math.round(wordEl.offsetTop + lh * 0.2)}px)`;
    caret.style.height = Math.round(lh * 0.6) + "px";
    scrollLines(wordEl);
  }
  function scrollLines(wordEl) {
    const lh = parseFloat(getComputedStyle(wrap).lineHeight);
    const line = Math.round(wordEl.offsetTop / lh);
    wordsEl.style.transform = line >= 2 ? `translateY(${-(line - 1) * lh}px)` : "";
  }

  function correctChars() { let n = 0; for (let i = 0; i < typed.length; i++) if (matches(target[i], typed[i])) n++; return n; }
  function elapsed() { return startTime ? (performance.now() - startTime) / 1000 : 0; }
  function wpm(sec) { return sec > 0 ? Math.round((correctChars() / 5) / (sec / 60)) : 0; }

  function reset() {
    clearInterval(tick); tick = null; running = false; finished = false;
    typed = ""; total = 0; correctKeys = 0; startTime = 0; input.value = "";
    samples = []; lastSampleSec = 0; errSince = 0;
    setTarget(cfg.mode === "time" ? buildTimeMode() : buildPassageMode());
    render(); wordsEl.style.transform = ""; placeCaret();
    timerEl.textContent = cfg.mode === "time" ? fa(cfg.time) : ""; liveWpmEl.textContent = "";
    showView("test");
    wrap.classList.remove("typing");
    focusInput();
  }

  function start() {
    running = true; startTime = performance.now();
    tick = setInterval(() => {
      const t = elapsed();
      if (cfg.mode === "time") {
        const left = Math.max(0, Math.ceil(cfg.time - t));
        timerEl.textContent = fa(left);
        if (t >= cfg.time) finish();
      } else timerEl.textContent = fa(Math.floor(t));
      liveWpmEl.textContent = fa(wpm(t)) + " ک/د";
      sample(t);
    }, 200);
  }

  // نمونه‌برداری ثانیه‌به‌ثانیه برای نمودار
  function sample(t) {
    while (lastSampleSec + 1 <= t) {
      lastSampleSec++;
      samples.push({ s: lastSampleSec, wpm: wpm(lastSampleSec), raw: Math.round((typed.length / 5) / (lastSampleSec / 60)), err: errSince });
      errSince = 0;
    }
  }
  function onInput() {
    if (finished) { input.value = typed; return; }
    let v = input.value.replace(/\n/g, "");
    if (v.length > target.length) v = v.slice(0, target.length);
    if (!running && v.length) start();
    const old = typed;
    // شمارش ضربه‌ها برای دقت
    if (v.length > old.length) {
      for (let i = old.length; i < v.length; i++) { total++; if (matches(target[i], v[i])) correctKeys++; else errSince++; }
    }
    typed = v; input.value = v;
    let a = 0; while (a < old.length && a < v.length && old[a] === v[a]) a++;
    updateRange(a, Math.max(old.length, v.length) + 1);
    wrap.classList.add("typing"); clearTimeout(onInput.t); onInput.t = setTimeout(() => wrap.classList.remove("typing"), 600);
    caretToEnd();
    if (cfg.mode === "time" && typed.length > target.length - 150) {
      const next = POOL[Math.floor(Math.random() * POOL.length)];
      appendSegment(next, true); placeCaret();
    }
    if (cfg.mode === "passage" && typed.length === target.length) finish();
  }

  function finish() {
    if (finished) return;
    finished = true; running = false; clearInterval(tick);
    const sec = cfg.mode === "time" ? Math.min(elapsed(), cfg.time) : elapsed();
    const acc = total ? Math.round((correctKeys / total) * 100) : 0;
    sample(sec);
    if (sec - lastSampleSec > .3 || !samples.length) samples.push({ s: sec, wpm: wpm(sec), raw: Math.round((typed.length / 5) / (Math.max(sec, .001) / 60)), err: errSince });
    countUp($("rWpm"), wpm(sec), "");
    countUp($("rAcc"), acc, "٪");
    $("rChars").textContent = fa(correctChars()) + " / " + fa(typed.length - correctChars());
    $("rTime").textContent = fa(Math.round(sec)) + " ثانیه";
    $("rMode").textContent = cfg.mode === "time" ? "زمان " + fa(cfg.time) : { short: "متن کوتاه", medium: "متن متوسط", long: "متن بلند" }[cfg.len];
    const reached = segments.filter(s => s.start < Math.max(1, typed.length));
    $("attrib").innerHTML = "";
    reached.forEach(s => {
      const d = document.createElement("div"); d.className = "item";
      const q = document.createElement("div"); q.className = "quote"; q.textContent = "«" + s.p.text + "»";
      const w = document.createElement("div"); w.className = "who"; w.textContent = "— " + s.p.author + "، " + s.p.source;
      d.append(q, w); $("attrib").appendChild(d);
    });
    showView("result");
    drawChart();
    window.__lastResult = { wpm: wpm(sec), acc, correct: correctChars(), typed: typed.length, sec };
  }

  // جابه‌جایی نرم بین صفحهٔ تایپ و کارنامه
  function showView(name) {
    const on = $(name), off = $(name === "test" ? "result" : "test");
    off.classList.add("hidden"); off.classList.remove("enter");
    if (!on.classList.contains("hidden")) return;
    on.classList.remove("hidden"); on.classList.remove("enter"); void on.offsetWidth; on.classList.add("enter");
    // پس از پایان انیمیشن کلاس را برمی‌داریم تا blur شیشه‌ای کارت (backdrop-filter) دوباره کار کند
    on.addEventListener("animationend", function done(e) { if (e.target === on) { on.classList.remove("enter"); on.removeEventListener("animationend", done); } });
  }
  // شمارش متحرک آمار
  function countUp(el, to, prefix) {
    const done = () => { el.textContent = prefix + fa(to); };
    if (reduceMotion() || to <= 0) return done();
    const t0 = performance.now(), D = 900;
    (function step(now) {
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      el.textContent = prefix + fa(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step); else done();
    })(t0);
    setTimeout(done, D + 100); // اگر زبانه پنهان باشد
  }
  // نمودار سرعت (SVG)
  function drawChart() {
    const svg = $("chart"), wrapC = svg.parentElement;
    const pts = samples.filter(p => p.s > 0);
    if (pts.length < 2) { wrapC.classList.add("hidden"); return; }
    wrapC.classList.remove("hidden");
    const Wc = 600, Hc = 170, pl = 34, pr = 10, pt = 12, pb = 24;
    const maxS = pts[pts.length - 1].s, maxV = Math.max(10, ...pts.map(p => Math.max(p.wpm, p.raw))) * 1.15;
    const X = s => pl + (s - pts[0].s) / (maxS - pts[0].s || 1) * (Wc - pl - pr);
    const Y = v => pt + (1 - v / maxV) * (Hc - pt - pb);
    const line = k => pts.map((p, i) => (i ? "L" : "M") + X(p.s).toFixed(1) + " " + Y(p[k]).toFixed(1)).join(" ");
    const area = line("wpm") + ` L${X(maxS).toFixed(1)} ${Hc - pb} L${X(pts[0].s).toFixed(1)} ${Hc - pb} Z`;
    let grid = "";
    for (let i = 0; i <= 3; i++) { const v = maxV / 1.15 * i / 3, y = Y(v); grid += `<line x1="${pl}" x2="${Wc - pr}" y1="${y}" y2="${y}" class="g"/><text x="${pl - 6}" y="${y + 4}" class="ax" text-anchor="end">${fa(Math.round(v))}</text>`; }
    const step = Math.max(1, Math.ceil(pts.length / 8));
    pts.forEach((p, i) => { if (i % step === 0 || i === pts.length - 1) grid += `<text x="${X(p.s)}" y="${Hc - 6}" class="ax" text-anchor="middle">${fa(Math.round(p.s))}</text>`; });
    const errs = pts.filter(p => p.err).map(p => `<circle cx="${X(p.s)}" cy="${Y(p.wpm)}" r="${Math.min(7, 3 + p.err)}" class="e"/>`).join("");
    svg.innerHTML = `<defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9c46a" stop-opacity=".35"/><stop offset="1" stop-color="#e9c46a" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#ga)" class="ar"/><path d="${line("raw")}" class="r"/><path d="${line("wpm")}" class="w" pathLength="1"/>${errs}`;
  }
  function focusInput() { input.focus({ preventScroll: true }); wrap.classList.remove("blurred"); }
  input.addEventListener("blur", () => wrap.classList.add("blurred"));
  input.addEventListener("focus", () => wrap.classList.remove("blurred"));
  // textarea شفاف روی متن قرار دارد تا لمس متن در موبایل (iOS) مستقیماً صفحه‌کلید را باز کند.
  // نشانگر متنِ textarea همیشه در انتها نگه داشته می‌شود.
  const caretToEnd = () => { const l = input.value.length; if (input.selectionStart !== l || input.selectionEnd !== l) input.setSelectionRange(l, l); };
  ["mouseup", "touchend", "focus", "select", "keyup"].forEach(ev => input.addEventListener(ev, () => setTimeout(caretToEnd, 0)));
  window.addEventListener("resize", () => placeCaret());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeCaret());
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", e => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) e.preventDefault();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); reset(); return; }
    if (e.key === "Escape") { if (running) finish(); return; }
    if (!finished && document.activeElement !== input && e.key.length === 1 && !e.ctrlKey && !e.metaKey) focusInput();
  });

  function saveCfg() { localStorage.setItem("ptype-cfg", JSON.stringify(cfg)); }
  function syncButtons() {
    document.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("active", b.dataset.mode === cfg.mode));
    document.querySelectorAll("[data-time]").forEach(b => b.classList.toggle("active", +b.dataset.time === cfg.time));
    document.querySelectorAll("[data-len]").forEach(b => b.classList.toggle("active", b.dataset.len === cfg.len));
    $("timeGroup").classList.toggle("hidden", cfg.mode !== "time");
    $("lenGroup").classList.toggle("hidden", cfg.mode !== "passage");
  }
  $("config").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mode) cfg.mode = b.dataset.mode;
    if (b.dataset.time) cfg.time = +b.dataset.time;
    if (b.dataset.len) cfg.len = b.dataset.len;
    saveCfg(); syncButtons(); reset(); b.blur();
  });
  $("restartBtn").addEventListener("click", reset);
  $("againBtn").addEventListener("click", reset);

  window.__ptype = { get target() { return target; }, get words() { return words; }, normalizeText, matches, finish, reset, cfg };
  syncButtons(); reset();
})();
