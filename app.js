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

  let target = "", segments = [], spans = [], typed = "";
  let total = 0, correctKeys = 0, startTime = 0, tick = null, running = false, finished = false;
  let lastPick = -1;

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
    if (render) renderFrom(start ? start - 1 : 0);
  }

  // ساخت span برای هر نویسه؛ کلمه‌ها nowrap تا وسط کلمه شکسته نشود
  function render() { wordsEl.innerHTML = ""; spans = []; renderFrom(0); }
  function renderFrom(from) {
    let wordEl;
    let i = spans.length;
    while (i < target.length) {
      wordEl = document.createElement("span"); wordEl.className = "word";
      while (i < target.length) {
        const c = target[i];
        const s = document.createElement("span");
        s.className = "ch" + (c === " " ? " sp" : "") + (c === ZWNJ ? " zw" : "");
        s.textContent = c === " " ? "\u00A0" : c;
        wordEl.appendChild(s); spans.push(s); i++;
        if (c === " ") break;
      }
      wordsEl.appendChild(wordEl);
    }
  }

  function updateRange(a, b) {
    for (let i = a; i < b && i < spans.length; i++) {
      const s = spans[i]; s.classList.remove("ok", "bad", "badspace", "cur", "curEnd");
      if (i < typed.length) {
        if (matches(target[i], typed[i])) s.classList.add("ok");
        else s.classList.add(target[i] === " " || target[i] === ZWNJ ? "badspace" : "bad");
      }
    }
    placeCaret();
  }
  let caretEl = null;
  function placeCaret() {
    if (caretEl) caretEl.classList.remove("cur", "curEnd");
    if (typed.length < spans.length) { caretEl = spans[typed.length]; caretEl.classList.add("cur"); }
    else { caretEl = spans[spans.length - 1]; caretEl && caretEl.classList.add("curEnd"); }
    scrollLines();
  }
  function scrollLines() {
    if (!caretEl) return;
    const lh = parseFloat(getComputedStyle(wrap).lineHeight);
    const top = caretEl.parentElement.offsetTop;
    const line = Math.round(top / lh);
    wordsEl.style.transform = line >= 2 ? `translateY(${-(line - 1) * lh}px)` : "";
  }

  function correctChars() { let n = 0; for (let i = 0; i < typed.length; i++) if (matches(target[i], typed[i])) n++; return n; }
  function elapsed() { return startTime ? (performance.now() - startTime) / 1000 : 0; }
  function wpm(sec) { return sec > 0 ? Math.round((correctChars() / 5) / (sec / 60)) : 0; }

  function reset() {
    clearInterval(tick); tick = null; running = false; finished = false;
    typed = ""; total = 0; correctKeys = 0; startTime = 0; input.value = "";
    setTarget(cfg.mode === "time" ? buildTimeMode() : buildPassageMode());
    render(); wordsEl.style.transform = ""; caretEl = null; placeCaret();
    timerEl.textContent = cfg.mode === "time" ? fa(cfg.time) : ""; liveWpmEl.textContent = "";
    $("result").classList.add("hidden"); $("test").classList.remove("hidden");
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
    }, 200);
  }

  function onInput() {
    if (finished) { input.value = typed; return; }
    let v = input.value.replace(/\n/g, "");
    if (v.length > target.length) v = v.slice(0, target.length);
    if (!running && v.length) start();
    const old = typed;
    // شمارش ضربه‌ها برای دقت
    if (v.length > old.length) {
      for (let i = old.length; i < v.length; i++) { total++; if (matches(target[i], v[i])) correctKeys++; }
    }
    typed = v; input.value = v;
    let a = 0; while (a < old.length && a < v.length && old[a] === v[a]) a++;
    updateRange(a, Math.max(old.length, v.length) + 1);
    wrap.classList.add("typing"); clearTimeout(onInput.t); onInput.t = setTimeout(() => wrap.classList.remove("typing"), 600);
    if (cfg.mode === "time" && typed.length > target.length - 150) {
      const next = POOL[Math.floor(Math.random() * POOL.length)];
      appendSegment(next, true); updateRange(typed.length - 1, spans.length);
    }
    if (cfg.mode === "passage" && typed.length === target.length) finish();
  }

  function finish() {
    if (finished) return;
    finished = true; running = false; clearInterval(tick);
    const sec = cfg.mode === "time" ? Math.min(elapsed(), cfg.time) : elapsed();
    const acc = total ? Math.round((correctKeys / total) * 100) : 0;
    $("rWpm").textContent = fa(wpm(sec));
    $("rAcc").textContent = "٪" + fa(acc);
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
    $("test").classList.add("hidden"); $("result").classList.remove("hidden");
    window.__lastResult = { wpm: wpm(sec), acc, correct: correctChars(), typed: typed.length, sec };
  }

  function focusInput() { input.focus({ preventScroll: true }); wrap.classList.remove("blurred"); }
  input.addEventListener("blur", () => wrap.classList.add("blurred"));
  input.addEventListener("focus", () => wrap.classList.remove("blurred"));
  wrap.addEventListener("mousedown", e => { e.preventDefault(); focusInput(); });
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

  window.__ptype = { get target() { return target; }, normalizeText, matches, finish, reset, cfg };
  syncButtons(); reset();
})();
