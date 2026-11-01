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
  // معادل‌های پذیرفتنی هنگام تایپ فارسی (کیبورد عربی، ویرگول لاتین و ...)
  const FA_EQ = { "\u064A": "ی", "\u0649": "ی", "\u0643": "ک", "\u0629": "ه", ",": "،", ";": "؛", "?": "؟" };
  function normChar(c) {
    if (FA_EQ[c]) return FA_EQ[c];
    const d = "0123456789".indexOf(c); if (d >= 0) return FA_DIGITS[d];
    const a = "٠١٢٣٤٥٦٧٨٩".indexOf(c); if (a >= 0) return FA_DIGITS[a];
    return c;
  }
  // پاک‌سازی متنِ واردشده: نویسه‌های نامرئی جهت‌دهی (RLM/LRM/...)، ZWJ و BOM حذف می‌شوند،
  // انواع فاصله (NBSP و ...) به فاصلهٔ معمولی تبدیل می‌شوند و شکل‌های نمایشی عربی (FB50–FEFF) به حرف پایه.
  function cleanTyped(s) {
    s = s.replace(/[\r\n\t]/g, "")
      .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ")
      .replace(/[\u200B\u200D\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF\u00AD]/g, "")
      .replace(/[\uFB50-\uFDFF\uFE70-\uFEFC]/g, c => c.normalize("NFKC"));
    try { s = s.normalize("NFC"); } catch (e) {}
    return s;
  }
  // نیم‌فاصله را با نیم‌فاصله یا فاصله می‌پذیریم (بسیاری از صفحه‌کلیدها نیم‌فاصله ندارند)
  function matches(expected, typed) {
    if (expected === typed) return true;
    if (typed === undefined) return false;
    if (lang === "en") return enCanon(expected) === enCanon(typed);
    typed = normChar(typed);
    if (expected === ZWNJ) return typed === ZWNJ || typed === " ";
    return expected === typed;
  }

  // ---------- زبان (فارسی / English) ----------
  const I18N = {
    fa: {
      title: "تایپ پارسی | تمرین تایپ با ادبیات فارسی",
      desc: "تمرین تایپ فارسی با گزیده‌هایی از حافظ، سعدی، فردوسی، مولوی، خیام و دیگران",
      brand: "تایپ پارسی", logo: "تایپ <b>پارسی</b>", settings: "تنظیمات",
      time: "زمان", passage: "متن", short: "کوتاه", medium: "متوسط", long: "بلند",
      hint: "برای شروع، روی متن بزنید یا تایپ کنید", input: "ورودی تایپ",
      restart: "شروع دوباره", restartTitle: "شروع دوباره (Tab)",
      speed: "سرعت", wpmUnit: "کلمه در دقیقه", accuracy: "دقت", percent: "درصد", chart: "نمودار سرعت",
      legend: '<i class="lw"></i> سرعت <i class="lr"></i> خام <i class="le"></i> خطا',
      chars: "درست / غلط", timeLabel: "زمان", modeLabel: "حالت", typedTitle: "آنچه تایپ کردید", again: "دوباره",
      keys: '<kbd>Tab</kbd> یا <kbd>Enter</kbd> شروع دوباره <span class="dot"></span> <kbd>Esc</kbd> پایان',
      note: "گزیده‌هایی از حافظ، سعدی، فردوسی، مولوی، خیام و دیگران",
      liveWpm: "ک/د", sec: " ثانیه", pct: "٪", modeTime: "زمان ", lens: { short: "متن کوتاه", medium: "متن متوسط", long: "متن بلند" },
      q: ["«", "»"], sepWho: "، ",
      kbWrong: "⌨️ صفحه‌کلید روی <b>انگلیسی</b> است؛ آن را <b>فارسی</b> کنید <span>(گوشی: دکمهٔ 🌐 · رایانه: <bdi dir=ltr>Alt+Shift</bdi> یا <bdi dir=ltr>⌘+Space</bdi>)</span>",
      kbRemapped: "⌨️ صفحه‌کلید روی انگلیسی است", caps: "Caps Lock روشن است"
    },
    en: {
      title: "Parsi Type | Typing practice with English literature & philosophy",
      desc: "Typing practice with passages from Shakespeare, Austen, Dickens, the Brontës, Melville, Thoreau, Emerson, Keats, Whitman, Dickinson, Locke, Hume, Mill and more.",
      brand: "Parsi Type", logo: "Parsi <b>Type</b>", settings: "Settings",
      time: "time", passage: "passage", short: "short", medium: "medium", long: "long",
      hint: "Click or start typing to begin", input: "Typing input",
      restart: "Restart", restartTitle: "Restart (Tab)",
      speed: "speed", wpmUnit: "words per minute", accuracy: "accuracy", percent: "percent", chart: "Speed chart",
      legend: '<i class="lw"></i> wpm <i class="lr"></i> raw <i class="le"></i> errors',
      chars: "correct / wrong", timeLabel: "time", modeLabel: "mode", typedTitle: "What you typed", again: "Again",
      keys: '<kbd>Tab</kbd> or <kbd>Enter</kbd> restart <span class="dot"></span> <kbd>Esc</kbd> finish',
      note: "Passages from Shakespeare, Austen, Dickens, Melville, Thoreau, Hume, Mill and others",
      liveWpm: "wpm", sec: "s", pct: "%", modeTime: "time ", lens: { short: "short passage", medium: "medium passage", long: "long passage" },
      q: ["“", "”"], sepWho: ", ",
      kbWrong: "⌨️ Your keyboard is set to <b>Persian</b>. Switch it to <b>English</b> <span>(phone: 🌐 key · computer: Alt+Shift or ⌘+Space)</span>",
      kbRemapped: "⌨️ Your keyboard is set to Persian, so keys are being read as English (QWERTY). <span>Switch to English for best results.</span>",
      caps: "⇪ Caps Lock is on"
    }
  };
  let lang = document.documentElement.lang === "en" ? "en" : "fa";
  const T = () => I18N[lang];
  const num = n => lang === "fa" ? fa(n) : String(n);
  // در انگلیسی، نشانه‌های تایپوگرافیک متن با معادل ساده‌ی صفحه‌کلید هم پذیرفته می‌شوند (و برعکس، برای نقل‌قول‌های هوشمند iOS)
  const EN_EQ = { "\u2019": "'", "\u2018": "'", "\u02BC": "'", "\u00B4": "'", "\u201B": "'", "\u2032": "'", "\u201C": '"', "\u201D": '"', "\u201E": '"', "\u00AB": '"', "\u00BB": '"',
    "\u2014": "-", "\u2013": "-", "\u2012": "-", "\u2010": "-", "\u2011": "-", "\u2212": "-", "\u00A0": " ", "\u066C": "'", "\u060C": ",", "\u061B": ";", "\u061F": "?" };
  // علامت‌ها یکسان، حرکت‌ها (ë → e) نادیده، و رقم‌های فارسی/عربی = رقم لاتین
  const enCanon = c => {
    if (!c) return c;
    if (EN_EQ[c]) return EN_EQ[c];
    let d = FA_DIGITS.indexOf(c); if (d < 0) d = "٠١٢٣٤٥٦٧٨٩".indexOf(c); if (d >= 0) return String(d);
    return c.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || c;
  };
  const POOLS = {
    fa: PASSAGES.map((p, i) => ({ ...p, id: i, text: normalizeText(p.text) })),
    en: PASSAGES_EN.map((p, i) => ({ ...p, id: i, text: p.text.replace(/\s+/g, " ").trim() }))
  };
  let POOL = POOLS[lang];
  // مرز طول برای کوتاه/متوسط/بلند (فارسی بدون تغییر)
  const LEN_CUT = { fa: [90, 170], en: [120, 175] };

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
    const [c1, c2] = LEN_CUT[lang];
    const short = POOL.filter(p => p.text.length <= c1);
    const medium = POOL.filter(p => p.text.length > c1 && p.text.length <= c2);
    const long = POOL.filter(p => p.text.length > c2);
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
  const needZWJ = k => lang === "fa" && joinsLeft(target[k - 1]) && joinsRight(target[k]);

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
    const rtl = lang === "fa";   // راست‌به‌چپ: ابتدای نویسه سمت راست آن است
    const x = (rtl ? (atEnd ? r.left : r.right) : (atEnd ? r.right : r.left)) - base.left;
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
    typed = ""; total = 0; correctKeys = 0; startTime = 0; input.value = ""; composing = false; wrongScript = 0; remapped = false;
    samples = []; lastSampleSec = 0; errSince = 0;
    setTarget(cfg.mode === "time" ? buildTimeMode() : buildPassageMode());
    render(); wordsEl.style.transform = ""; placeCaret();
    timerEl.textContent = cfg.mode === "time" ? num(cfg.time) : ""; liveWpmEl.textContent = "";
    showView("test");
    wrap.classList.remove("typing"); updateWarn();
    focusInput();
  }

  function start() {
    running = true; startTime = performance.now();
    tick = setInterval(() => {
      const t = elapsed();
      if (cfg.mode === "time") {
        const left = Math.max(0, Math.ceil(cfg.time - t));
        timerEl.textContent = num(left);
        if (t >= cfg.time) finish();
      } else timerEl.textContent = num(Math.floor(t));
      liveWpmEl.textContent = num(wpm(t)) + " " + T().liveWpm;
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
  // ---------- ورودی ----------
  // متنِ textarea منبع حقیقت است: هر بار کل مقدار با متن هدف مقایسه می‌شود (نه فقط آخرین کلید)،
  // پس جایگزینی کلمه توسط کیبورد گوشی، پیشنهاد کلمه، چسباندن و پاک کردن همه درست حساب می‌شوند.
  // در حین ترکیب (composition / IME، مثل Gboard یا کیبوردهای پیشنهادگر) مقدار textarea را دست نمی‌زنیم
  // چون بازنویسی آن کیبورد را به هم می‌ریزد و حروف تکراری یا جابه‌جا وارد می‌شوند.
  let composing = false;
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => { composing = false; setTimeout(() => { onInput(); caretToEnd(); }, 0); });

  // نقشهٔ کلیدهای فیزیکی (QWERTY آمریکایی) برای وقتی که در حالت انگلیسی کیبوردِ سیستم روی فارسی مانده است
  const US = { Minus: "-_", Equal: "=+", BracketLeft: "[{", BracketRight: "]}", Backslash: "\\|", Semicolon: ";:", Quote: "'\"", Comma: ",<", Period: ".>", Slash: "/?", Backquote: "`~",
    Digit1: "1!", Digit2: "2@", Digit3: "3#", Digit4: "4$", Digit5: "5%", Digit6: "6^", Digit7: "7&", Digit8: "8*", Digit9: "9(", Digit0: "0)" };
  const usChar = (code, shift) => {
    if (/^Key[A-Z]$/.test(code)) { const c = code[3]; return shift ? c : c.toLowerCase(); }
    return US[code] ? US[code][shift ? 1 : 0] : null;
  };
  const isPersianScript = c => /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(c);
  const isLatinLetter = c => /[A-Za-z]/.test(c);
  let lastKey = null, capsOn = false, wrongScript = 0, remapped = false;
  input.addEventListener("keydown", e => {
    lastKey = { code: e.code, shift: e.shiftKey, t: performance.now() };
    if (e.getModifierState) capsOn = e.getModifierState("CapsLock");
    updateWarn();
  });

  const warnEl = $("kbWarn");
  function updateWarn() {
    if (!warnEl) return;
    let msg = "";
    if (wrongScript >= 2) msg = remapped ? T().kbRemapped : T().kbWrong;
    else if (capsOn && lang === "en" && !finished) msg = T().caps;
    warnEl.innerHTML = msg;
    warnEl.classList.toggle("show", !!msg);
  }

  function onInput(e) {
    if (finished) { if (!composing) input.value = typed; return; }
    let v = cleanTyped(input.value);
    const old = typed;
    // تشخیص زبانِ اشتباهِ کیبورد از روی نویسه‌های تازه (پیش از هر تبدیل)
    for (let i = old.length; i < v.length; i++) {
      const c = v[i];
      if (lang === "en" ? isPersianScript(c) : isLatinLetter(c)) wrongScript++;
      else if (lang === "en" ? isLatinLetter(c) : (isPersianScript(c) && !FA_EQ[c] && !"،؛؟".includes(c))) { wrongScript = 0; remapped = false; }
    }
    // حالت انگلیسی + کیبورد فارسی روی رایانه: حرفِ فارسیِ تازه را از روی کلید فیزیکی به حرف انگلیسی برمی‌گردانیم
    if (lang === "en" && !composing && v.length === old.length + 1 && v.startsWith(old) && isPersianScript(v[v.length - 1])) {
      const k = lastKey && performance.now() - lastKey.t < 1000 ? usChar(lastKey.code, lastKey.shift) : null;
      if (k) { v = old + k; remapped = true; }
    }
    if (v.length > target.length) v = v.slice(0, target.length);
    if (!running && v.length) start();
    // شمارش ضربه‌ها برای دقت + تشخیص زبانِ اشتباهِ کیبورد
    if (v.length > old.length) {
      for (let i = old.length; i < v.length; i++) { total++; if (matches(target[i], v[i])) correctKeys++; else errSince++; }
    }
    typed = v;
    if (!composing && input.value !== v) input.value = v;   // فقط در صورت نیاز بازنویسی می‌شود
    let a = 0; while (a < old.length && a < v.length && old[a] === v[a]) a++;
    updateRange(a, Math.max(old.length, v.length) + 1);
    updateWarn();
    wrap.classList.add("typing"); clearTimeout(onInput.t); onInput.t = setTimeout(() => wrap.classList.remove("typing"), 600);
    if (!composing) caretToEnd();
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
    countUp($("rAcc"), acc, T().pct);
    $("rChars").textContent = num(correctChars()) + " / " + num(typed.length - correctChars());
    $("rTime").textContent = num(Math.round(sec)) + T().sec;
    $("rMode").textContent = cfg.mode === "time" ? T().modeTime + num(cfg.time) : T().lens[cfg.len];
    const reached = segments.filter(s => s.start < Math.max(1, typed.length));
    $("attrib").innerHTML = "";
    reached.forEach(s => {
      const d = document.createElement("div"); d.className = "item";
      const q = document.createElement("div"); q.className = "quote"; q.textContent = T().q[0] + s.p.text + T().q[1];
      const w = document.createElement("div"); w.className = "who"; w.textContent = "— " + s.p.author + T().sepWho + s.p.source;
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
    // فارسی: «٪۹۶» مانند قبل؛ انگلیسی: «96%»
    const show = v => lang === "fa" ? prefix + fa(v) : v + prefix;
    const done = () => { el.textContent = show(to); };
    if (reduceMotion() || to <= 0) return done();
    const t0 = performance.now(), D = 900;
    (function step(now) {
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      el.textContent = show(Math.round(to * e));
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
    for (let i = 0; i <= 3; i++) { const v = maxV / 1.15 * i / 3, y = Y(v); grid += `<line x1="${pl}" x2="${Wc - pr}" y1="${y}" y2="${y}" class="g"/><text x="${pl - 6}" y="${y + 4}" class="ax" text-anchor="end">${num(Math.round(v))}</text>`; }
    const step = Math.max(1, Math.ceil(pts.length / 8));
    pts.forEach((p, i) => { if (i % step === 0 || i === pts.length - 1) grid += `<text x="${X(p.s)}" y="${Hc - 6}" class="ax" text-anchor="middle">${num(Math.round(p.s))}</text>`; });
    const errs = pts.filter(p => p.err).map(p => `<circle cx="${X(p.s)}" cy="${Y(p.wpm)}" r="${Math.min(7, 3 + p.err)}" class="e"/>`).join("");
    svg.innerHTML = `<defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9c46a" stop-opacity=".35"/><stop offset="1" stop-color="#e9c46a" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#ga)" class="ar"/><path d="${line("raw")}" class="r"/><path d="${line("wpm")}" class="w" pathLength="1"/>${errs}`;
  }
  function focusInput() { input.focus({ preventScroll: true }); wrap.classList.remove("blurred"); }
  input.addEventListener("blur", () => wrap.classList.add("blurred"));
  input.addEventListener("focus", () => wrap.classList.remove("blurred"));
  // textarea شفاف روی متن قرار دارد تا لمس متن در موبایل (iOS) مستقیماً صفحه‌کلید را باز کند.
  // نشانگر متنِ textarea همیشه در انتها نگه داشته می‌شود.
  const caretToEnd = () => { if (composing) return; const l = input.value.length; if (input.selectionStart !== l || input.selectionEnd !== l) input.setSelectionRange(l, l); };
  // («select» عمداً اینجا نیست: اگر کیبورد یا مرورگر بخشی از متن را برای جایگزینی انتخاب کند، نباید آن را به هم بزنیم)
  ["mouseup", "touchend", "focus", "keyup"].forEach(ev => input.addEventListener(ev, () => setTimeout(caretToEnd, 0)));
  // اگر نشانگرِ textarea به هر دلیلی وسط متن باشد (لمس روی متن در آیفون، کشیدن روی فاصله، کلیک)،
  // تایپ و پاک کردن همیشه در انتهای متن انجام می‌شود؛ وگرنه حروف وسط متن درج می‌شوند و همهٔ ادامه غلط دیده می‌شود.
  input.addEventListener("beforeinput", e => {
    if (finished || composing || e.isComposing) return;
    const v = input.value, L = v.length, a = input.selectionStart, b = input.selectionEnd;
    if (a !== b || a === L || !e.cancelable) return;   // انتخابِ واقعی یا نشانگر در انتها: رفتار عادی
    const t = e.inputType;
    if (t === "insertText" && e.data != null) { e.preventDefault(); input.value = v + e.data; }
    else if (t === "deleteContentBackward") { e.preventDefault(); input.value = v.slice(0, -1); }
    else if (t === "deleteWordBackward") { e.preventDefault(); input.value = v.replace(/\S*\s*$/, ""); }
    else if (t === "deleteContentForward" || t === "deleteWordForward") { e.preventDefault(); return; }
    else return;
    caretToEnd(); onInput();
  });
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

  // اعمال زبان روی کل رابط
  function applyLang(save) {
    const t = T(), h = document.documentElement;
    h.lang = lang; h.dir = lang === "en" ? "ltr" : "rtl";
    document.title = t.title; $("metaDesc").setAttribute("content", t.desc);
    document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = t[el.dataset.i18n]; });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t[el.dataset.i18nAria]));
    document.querySelectorAll("[data-i18n-title]").forEach(el => el.setAttribute("title", t[el.dataset.i18nTitle]));
    document.querySelectorAll("[data-num]").forEach(el => { el.textContent = num(+el.dataset.num); });
    input.setAttribute("dir", lang === "en" ? "ltr" : "rtl");
    input.setAttribute("lang", lang);
    document.querySelectorAll("#langToggle [data-lang]").forEach(b => { const on = b.dataset.lang === lang; b.classList.toggle("active", on); b.setAttribute("aria-pressed", on); });
    $("langToggle").dataset.active = lang;
    POOL = POOLS[lang]; lastPick = -1;
    if (save) {
      try { localStorage.setItem("ptype-lang", lang); } catch (e) {}
      try { const u = new URL(location.href); u.searchParams.set("lang", lang); history.replaceState(null, "", u); } catch (e) {}
    }
  }
  function setLang(l) {
    if (l === lang) return;
    lang = l; applyLang(true); reset();
  }
  $("langToggle").addEventListener("click", e => {
    const b = e.target.closest("[data-lang]"); if (!b) return;
    setLang(b.dataset.lang); b.blur();
  });
  (function initLang() {
    let fromUrl = null; try { fromUrl = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    applyLang(fromUrl === "en" || fromUrl === "fa");
  })();

  window.__ptype = { get target() { return target; }, get words() { return words; }, get lang() { return lang; }, setLang, normalizeText, matches, finish, reset, cfg };
  syncButtons(); reset();
})();
