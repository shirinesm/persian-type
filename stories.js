/* «داستان کوتاه پیدا کن» / "Find a short story" — sidebar, search and story card.
   Data (stories-fa.js / stories-en.js) is loaded lazily the first time the section opens.
   Every story is ≤100 words and was checked word for word against its source (tools/verify_stories.py). */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const html = document.documentElement, body = document.body;
  const L = () => (html.lang === "en" ? "en" : "fa");
  const FA_D = "۰۱۲۳۴۵۶۷۸۹";
  const num = n => (L() === "fa" ? String(n).replace(/\d/g, d => FA_D[d]) : String(n));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const S = {
    fa: {
      searching: "در حال جست‌وجو…", loading: "در حال آماده‌سازی داستان‌ها…",
      found: (i, n, q) => `داستان ${num(i)} از ${num(n)} برای «${esc(q)}»`,
      none: q => `برای «${esc(q)}» داستانی پیدا نشد. یکی از این موضوع‌ها را امتحان کنید یا یک داستان تصادفی بخوانید:`,
      random: "یک داستان تصادفی", words: n => `${num(n)} کلمه`, full: "حکایت کامل", excerpt: "برشی از",
      gj: "متن در گنجور", gut: "متن در پروژه گوتنبرگ", ws: "متن در ویکی‌نبشته", related: "موضوع‌های مرتبط:",
      try: "پیشنهاد:", sugg: ["عشق", "دوستی", "مرگ", "دریا", "پادشاه", "روباه", "دروغ", "شب", "طمع", "خاموشی"],
      newTab: "(در زبانهٔ تازه)", total: n => `${num(n)} حکایت کوتاه از گلستان سعدی و بهارستان جامی`
    },
    en: {
      searching: "Searching…", loading: "Getting the stories ready…",
      found: (i, n, q) => `Story ${i} of ${n} for “${esc(q)}”`,
      none: q => `No story matched “${esc(q)}”. Try one of these themes, or read a random story:`,
      random: "A random story", words: n => `${n} words`, full: "Complete text", excerpt: "Excerpt from",
      gj: "Read on Ganjoor", gut: "Read on Project Gutenberg", ws: "Read on Wikisource", related: "Related themes:",
      try: "Try:", sugg: ["love", "friendship", "death", "sea", "fox", "king", "greed", "night", "truth", "hope"],
      newTab: "(opens in a new tab)", total: n => `${n} public-domain short stories and fables`
    }
  };
  const t = () => S[L()];

  // ---------- normalisation ----------
  const FA_MAP = { "ي": "ی", "ى": "ی", "ك": "ک", "ة": "ه", "ۀ": "ه", "ؤ": "و", "أ": "ا", "إ": "ا", "ٱ": "ا", "آ": "ا", "ئ": "ی" };
  function normFa(s) {
    return s.replace(/[\u064B-\u065F\u0670\u0640\u200C\u200D\u200E\u200F]/g, "").replace(/[يىكةۀؤأإٱآئ]/g, c => FA_MAP[c])
      .replace(/[۰-۹]/g, d => FA_D.indexOf(d));
  }
  const FA_SUF = ["هایی", "ترین", "های", "ها", "یان", "گان", "ان", "تر", "یی", "ای", "اند", "ند", "یش", "مان", "شان", "تان", "ات", "ست", "ش", "م", "ت", "ی", "د"];
  function faVariants(w) {
    const out = new Set([w]);
    const bases = [w];
    for (const p of ["نمی", "می", "همی"]) if (w.startsWith(p) && w.length - p.length >= 2) bases.push(w.slice(p.length));
    if (w.length >= 4 && (w[0] === "ب" || w[0] === "ن")) bases.push(w.slice(1));
    for (const b of bases) {
      out.add(b);
      for (const s of FA_SUF) if (b.endsWith(s) && b.length - s.length >= 2 && (s.length > 1 || b.length - s.length >= 3)) { out.add(b.slice(0, -s.length)); break; }
    }
    return out;
  }
  function stemEn(w) {
    w = w.replace(/['’]s$/, "").replace(/['’]/g, "");
    if (w.length <= 3) return w;
    if (/ies$/.test(w) && w.length > 4) w = w.slice(0, -3) + "y";
    else if (/sses$/.test(w)) w = w.slice(0, -2);
    else if (/(ches|shes|xes|zes)$/.test(w)) w = w.slice(0, -2);
    else if (/[^su]s$/.test(w)) w = w.slice(0, -1);
    if (/ing$/.test(w) && w.length > 5) w = w.slice(0, -3);
    else if (/ed$/.test(w) && w.length > 4) w = w.slice(0, -2);
    else if (/ly$/.test(w) && w.length > 5) w = w.slice(0, -2);
    if (/([bdfgklmnprt])\1$/.test(w) && !/(ll|ss)$/.test(w)) w = w.slice(0, -1);
    if (/e$/.test(w) && w.length > 3) w = w.slice(0, -1);
    return w;
  }
  const IRREG = { died: "die", dead: "die", dying: "die", men: "man", women: "woman", children: "child", mice: "mouse", wolves: "wolf", geese: "goose", feet: "foot", teeth: "tooth", oxen: "ox", lives: "life", wives: "wife", thieves: "thief", leaves: "leaf", knives: "knife", calves: "calf", sheep: "sheep", fell: "fall", ran: "run", ate: "eat", flew: "fly", saw: "see", said: "say", told: "tell", found: "find", thought: "think", gave: "give", took: "take", came: "come", went: "go", loved: "love", friends: "friend" };
  const isFaWord = w => /[\u0600-\u06FF]/.test(w);
  // one token -> {k: normalised key, v: Set of variants}
  function keyOf(raw) {
    if (isFaWord(raw)) { const k = normFa(raw); return { k, v: faVariants(k), fa: true }; }
    const low = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/’/g, "'");
    const base = IRREG[low] || low;
    const st = stemEn(base);
    return { k: low.replace(/['’]/g, ""), v: new Set([low.replace(/['’]/g, ""), base, st]), fa: false };
  }
  const WORD_RE = /[\p{L}\p{M}\u200C'’]+/gu;
  const tokens = s => (s.match(WORD_RE) || []).map(w => w.replace(/^['’]+|['’]+$/g, "")).filter(Boolean);

  // ---------- bilingual themes / synonyms (query in either language → concept → stories) ----------
  const THEMES = [
    ["عشق", "love", "عشق عاشق معشوق دلبر دلدار محبت مهر محبوب دلارام", "love lover beloved sweetheart romance darling"],
    ["مرگ", "death", "مرگ مردن بمرد بمیرد میرد مرده اجل هلاک گور کشتن بکشت کشته جان‌سپردن", "death die dead kill grave perish mortal"],
    ["دوستی", "friendship", "دوست دوستی یار رفیق همراه صحبت یاران", "friend friendship companion comrade ally"],
    ["دشمنی", "enemy", "دشمن دشمنی خصم کین کینه عداوت", "enemy foe hatred hostile"],
    ["دریا", "sea", "دریا کشتی ملاح موج غرق ساحل دجله رود آب", "sea ship sailor ocean wave shore drown river water fisherman"],
    ["پادشاه", "king", "پادشاه ملک شاه سلطان امیر وزیر خسرو شاهزاده ملکزاده", "king queen prince princess ruler throne court monarch emperor"],
    ["ثروت", "wealth", "زر سیم مال درم دینار گنج توانگر توانگری دولت نعمت", "gold money rich wealth treasure coin silver miser"],
    ["فقر", "poverty", "درویش فقیر درویشی گدا مسکین تنگدست بینوا", "poor poverty beggar want"],
    ["خرد", "wisdom", "حکیم دانا خرد عقل دانش هوش عاقل خردمند", "wise wisdom sage clever reason prudence"],
    ["نادانی", "foolishness", "نادان ابله احمق جاهل نادانی", "fool foolish stupid silly ignorance"],
    ["طمع", "greed", "طمع حرص آز حریص طماع", "greed greedy covet envy"],
    ["قناعت", "contentment", "قناعت قانع خرسند", "content contentment"],
    ["دروغ", "lie", "دروغ دروغگو فریب مکر حیله", "lie liar deceit trick cunning cheat"],
    ["راستی", "truth", "راستی راست حق صادق", "truth true honest honesty"],
    ["خاموشی", "silence", "خاموشی خاموش سکوت خامشی زبان سخن گفتار", "silence silent quiet tongue speech talk boast"],
    ["عدل", "justice", "عدل داد انصاف دادگر", "justice just judge fair"],
    ["ظلم", "tyranny", "ظلم ستم ظالم ستمگر جور بیداد", "tyrant tyranny cruel oppress injustice"],
    ["صبر", "patience", "صبر شکیبایی تحمل آهسته", "patience patient slow steady perseverance"],
    ["ترس", "fear", "ترس بیم هراس ترسید", "fear afraid fright terror coward"],
    ["امید", "hope", "امید امیدوار آرزو", "hope wish longing"],
    ["شادی", "happiness", "شادی شاد خوشی طرب خرم", "happy happiness joy glad merry"],
    ["غم", "sorrow", "غم اندوه گریه بگریست رنج درد", "sorrow grief weep tear pain sad mourn"],
    ["شب", "night", "شب ماه ستاره تاریکی خواب", "night moon star dark sleep dream"],
    ["سفر", "journey", "سفر مسافر راه کاروان بیابان", "journey travel traveller traveler road way"],
    ["پیری", "old age", "پیر پیری سالخورده کهنسال", "old age aged elder"],
    ["جوانی", "youth", "جوان جوانی کودک طفل پسر", "young youth boy child son"],
    ["خانواده", "family", "پدر مادر پسر دختر فرزند برادر زن شوهر", "father mother son daughter brother wife husband family child"],
    ["تربیت", "education", "تربیت ادب معلم استاد شاگرد علم", "teach teacher learn lesson pupil school educate"],
    ["جنگ", "war", "جنگ لشکر سپاه شمشیر دلاور پهلوان", "war battle soldier sword army fight"],
    ["بخشش", "kindness", "کرم بخشش جود سخاوت نیکی احسان کریم", "kind kindness generous gift mercy grateful gratitude"],
    ["غرور", "pride", "غرور تکبر کبر خودپسند", "pride proud vain vanity arrogant"],
    ["طنز", "humour", "مطایبه ظریف خنده", "humour humor funny joke satire laugh"],
    ["جانوران", "animals", "شیر روباه گرگ سگ گربه موش مار شتر اسب خر درازگوش کلاغ زاغ مرغ گوسفند مور بز گاو", "animal beast fox lion wolf dog cat mouse snake camel horse ass crow bird sheep ant goat ox bull"],
    ["طبیعت", "nature", "درخت باغ گل بستان بوستان کوه باران ابر", "tree garden flower rose mountain rain cloud forest"]
  ];
  // word-level dictionary so a single word also crosses languages (fox → روباه …)
  const DICT = [["روباه", "fox"], ["شیر", "lion"], ["گرگ", "wolf"], ["سگ", "dog"], ["گربه", "cat"], ["موش", "mouse"], ["مار", "snake serpent"], ["شتر", "camel"], ["اسب", "horse"],
    ["خر درازگوش", "ass donkey"], ["کلاغ زاغ", "crow raven"], ["مرغ پرنده", "bird hen"], ["گوسفند میش", "sheep lamb"], ["مور مورچه", "ant"], ["گاو", "ox bull cow"], ["بز", "goat"],
    ["درخت", "tree oak"], ["آفتاب خورشید", "sun"], ["ماه", "moon"], ["آب", "water"], ["نان", "bread"], ["زر طلا", "gold"], ["دزد", "thief robber"], ["طبیب پزشک", "doctor physician"],
    ["بازرگان", "merchant"], ["خواب", "sleep dream"], ["گل", "flower rose"], ["باغ", "garden"], ["کوه", "mountain"], ["زن", "woman wife"], ["مادر", "mother"], ["پدر", "father"],
    ["چشم", "eye"], ["دل", "heart"], ["دست", "hand"], ["سنگ", "stone rock"], ["آتش", "fire"], ["باد", "wind"], ["کشتی", "ship boat"], ["شب", "night"], ["روز", "day"], ["خانه", "house home"]];
  let CONC = null; // built lazily: [{fa, en, keys:Set(all variants of keys), lab:{fa,en}}]
  function buildConcepts() {
    CONC = [];
    const add = (fa, en, faKeys, enKeys, theme) => {
      const keys = new Set(), base = new Set();
      (fa + " " + faKeys + " " + en + " " + enKeys).split(/\s+/).filter(Boolean).forEach(w => { const o = keyOf(w); base.add(o.k); o.v.forEach(x => keys.add(x)); });
      CONC.push({ lab: { fa, en }, keys, base, theme });
    };
    THEMES.forEach(([fa, en, fk, ek]) => add(fa, en, fk, ek, true));
    DICT.forEach(([f, e]) => add(f.split(" ")[0], e.split(" ")[0], f, e, false));
  }

  // ---------- index ----------
  const DATA = { fa: null, en: null }, IDX = { fa: null, en: null };
  function load(lang) {
    if (DATA[lang]) return Promise.resolve(DATA[lang]);
    const name = lang === "fa" ? "STORIES_FA" : "STORIES_EN";
    if (window[name]) return Promise.resolve(DATA[lang] = window[name]);
    return new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = `stories-${lang}.js?v=1`; s.async = true;
      s.onload = () => res(DATA[lang] = window[name]); s.onerror = rej; document.head.appendChild(s);
    });
  }
  const plain = st => st.parts.map(p => p.slice(1).join(" ")).join(" ");
  function index(lang) {
    if (IDX[lang]) return IDX[lang];
    if (!CONC) buildConcepts();
    IDX[lang] = DATA[lang].map(st => {
      const text = plain(st);
      const cnt = new Map(), vars = new Set(), list = [];
      const addTok = w => { const o = keyOf(w); list.push(o.k); cnt.set(o.k, (cnt.get(o.k) || 0) + 1); o.v.forEach(x => vars.add(x)); };
      tokens(text).forEach(w => { addTok(w); if (w.includes("\u200C")) w.split("\u200C").forEach(p => p.length > 1 && addTok(p)); });
      const meta = new Set(); tokens([st.t, st.a, st.w, st.ch || "", st.tr || ""].join(" ")).forEach(w => keyOf(w).v.forEach(x => meta.add(x)));
      const conc = new Set();
      CONC.forEach((c, ci) => { for (const v of c.keys) if (vars.has(v) || meta.has(v)) { conc.add(ci); break; } });
      if ((st.ch && st.ch.includes("مطایبه")) || st.a === "Ambrose Bierce") conc.add(CONC.findIndex(c => c.lab.en === "humour"));
      if (/حیوانات/.test(st.ch || "") || st.a === "Aesop") conc.add(CONC.findIndex(c => c.lab.en === "animals"));
      const prio = st.a === "Ambrose Bierce" || st.w === "بهارستان" ? 0.92 : 1;
      return { st, cnt, vars, list: [...new Set(list)], meta, conc, prio };
    });
    return IDX[lang];
  }
  function queryConcepts(qs) {
    const hits = new Set();
    qs.forEach(q => CONC.forEach((c, ci) => { for (const v of q.v) if (c.keys.has(v)) { hits.add(ci); break; } }));
    return hits;
  }
  function search(lang, query) {
    const idx = index(lang);
    const qs = tokens(query).map(keyOf).filter(q => q.k.length > 1 || q.fa);
    if (!qs.length) return { qs, res: [] };
    const qc = qs.map(q => queryConcepts([q]));
    const res = [];
    idx.forEach(it => {
      let score = 0, matched = 0;
      qs.forEach((q, qi) => {
        let s = 0;
        for (const v of q.v) if (it.meta.has(v)) { s = 4; break; }
        const c = it.cnt.get(q.k);
        if (c) s = Math.max(s, 3 + Math.min(1, (c - 1) * .3));
        else {
          let vh = false; for (const v of q.v) if (it.vars.has(v)) { vh = true; break; }
          if (vh) s = Math.max(s, 2.5);
          else if (q.k.length >= 3 && it.list.some(w => w.length > q.k.length && w.startsWith(q.k))) s = Math.max(s, 1.5);
        }
        let ch = 0; qc[qi].forEach(ci => { if (it.conc.has(ci)) ch++; });
        if (ch) s = Math.max(s, 2) + (s >= 2.5 ? .5 : 0);
        if (s) { matched++; score += s; }
      });
      if (!matched) return;
      if (matched === qs.length && qs.length > 1) score += 2 * qs.length;
      res.push({ it, score: score * it.prio + Math.random() * 0.01 });
    });
    res.sort((a, b) => b.score - a.score);
    return { qs, qc, res };
  }

  // ---------- rendering ----------
  let state = { q: "", res: [], i: 0, qs: [], qc: [] };
  const els = {};
  function markHtml(text, qs, qc) {
    const conc = new Set(); (qc || []).forEach(s => s.forEach(ci => conc.add(ci)));
    const parts = text.split(/([\p{L}\p{M}\u200C'’]+)/u);
    return parts.map((p, i) => {
      if (i % 2 === 0 || !qs.length) return esc(p);
      const o = keyOf(p.replace(/^['’]+|['’]+$/g, ""));
      let hit = qs.some(q => q.k === o.k || [...q.v].some(v => o.v.has(v)) || (q.k.length >= 3 && o.k.startsWith(q.k)));
      if (!hit && conc.size) for (const ci of conc) { const c = CONC[ci]; if (c.base.has(o.k) || [...o.v].some(v => c.base.has(v))) { hit = true; break; } }
      return hit ? `<mark>${esc(p)}</mark>` : esc(p);
    }).join("");
  }
  const wordCount = st => st.parts.reduce((n, p) => n + p.slice(1).join(" ").split(/\s+/).filter(Boolean).length, 0);
  function linkLabel(u) { return /ganjoor/.test(u) ? t().gj : /wikisource/.test(u) ? t().ws : t().gut; }
  function renderStory(st, qs, qc) {
    const lang = L(), x = t();
    const isFa = lang === "fa";
    const bodyHtml = st.parts.map(p => p[0] === "b"
      ? `<div class="st-beyt"><span>${markHtml(p[1], qs, qc)}</span>${p[2] ? `<span>${markHtml(p[2], qs, qc)}</span>` : ""}</div>`
      : `<p>${markHtml(p[1], qs, qc)}</p>`).join("");
    const where = isFa ? `${esc(st.w)}، ${esc(st.ch)}، ${esc(st.t)}` : `<i>${esc(st.w)}</i>${st.w !== st.t ? ` — “${esc(st.t)}”` : ""}${st.tr ? `, ${esc(st.tr)}` : ""}`;
    els.result.innerHTML = `
      <header class="st-head">
        <span class="st-badge${st.x ? " ex" : ""}">${st.x ? x.excerpt : x.full}</span>
        <h2 id="stStoryTitle">${st.x ? `${esc(x.excerpt)} “${esc(st.t)}”` : esc(isFa ? st.t : st.t)}</h2>
      </header>
      <div class="st-text" lang="${lang}" dir="${isFa ? "rtl" : "ltr"}">${bodyHtml}</div>
      <footer class="st-cite">
        <div class="st-who"><b>${esc(st.a)}</b> <span class="st-dash">—</span> ${where}</div>
        <div class="st-meta"><span>${esc(st.y)}</span><span class="dot"></span><span>${x.words(wordCount(st))}</span><span class="dot"></span>
          <a href="${esc(st.u)}" target="_blank" rel="noopener">${linkLabel(st.u)} <span class="sr-only">${x.newTab}</span><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>
      </footer>`;
    els.result.classList.remove("hidden"); els.result.classList.remove("pop"); void els.result.offsetWidth; els.result.classList.add("pop");
    els.actions.classList.remove("hidden");
    state.cur = st;
  }
  function chipHtml(labels, cls) { return labels.map(l => `<button type="button" class="st-chip ${cls || ""}" data-q="${esc(l)}">${esc(l)}</button>`).join(""); }
  function showSuggestions() {
    const x = t(); els.chips.innerHTML = `<span class="st-try">${x.try}</span>` + chipHtml(x.sugg);
  }
  function relatedChips(st) {
    const it = index(L()).find(i => i.st === st); if (!it) return "";
    const labs = [...it.conc].map(ci => CONC[ci]).filter(c => c.theme).map(c => c.lab[L()]).slice(0, 6);
    return labs.length ? `<span class="st-try">${t().related}</span>` + chipHtml(labs) : "";
  }
  function showCurrent() {
    const { res, i, q } = state;
    const r = res[i];
    renderStory(r.it.st, state.qs, state.qc);
    els.status.innerHTML = t().found(L() === "fa" ? i + 1 : i + 1, res.length, q);
    els.another.disabled = res.length < 2;
    els.chips.innerHTML = relatedChips(r.it.st);
  }
  function randomStory(focus) {
    const d = DATA[L()]; const st = d[Math.floor(Math.random() * d.length)];
    state = { q: "", res: [], i: 0, qs: [], qc: [] };
    renderStory(st, [], []); els.status.textContent = "";
    els.another.disabled = false; els.chips.innerHTML = relatedChips(st);
    if (focus) els.result.focus({ preventScroll: true });
  }
  async function doSearch(q, focusResult) {
    q = q.trim();
    if (!q) { randomStory(focusResult); return; }
    els.status.textContent = t().searching;
    await ensure();
    const { qs, qc, res } = search(L(), q);
    state = { q, res, i: 0, qs, qc };
    if (res.length) { showCurrent(); if (focusResult) els.result.focus({ preventScroll: true }); }
    else {
      els.result.classList.add("hidden"); els.actions.classList.add("hidden");
      els.status.innerHTML = t().none(q);
      const themes = CONC.filter(c => c.theme).map(c => c.lab[L()]);
      els.chips.innerHTML = `<button type="button" class="st-chip rnd" data-rnd="1">🎲 ${t().random}</button>` + chipHtml(themes.sort(() => Math.random() - .5).slice(0, 8));
    }
  }
  function another() {
    if (state.res.length > 1) { state.i = (state.i + 1) % state.res.length; showCurrent(); }
    else randomStory();
    els.result.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  let ready = null;
  function ensure() {
    if (!ready || ready.lang !== L()) {
      const lang = L();
      ready = load(lang).then(() => { index(lang); }); ready.lang = lang;
      els.status.textContent = t().loading;
      ready.then(() => { if (els.status.textContent === t().loading) els.status.textContent = ""; els.count.textContent = t().total(DATA[lang].length); });
    }
    return ready;
  }

  // ---------- sidebar + routing ----------
  let lastFocus = null;
  function openSidebar() {
    lastFocus = document.activeElement;
    els.sb.classList.add("open"); els.sb.removeAttribute("inert"); els.sb.setAttribute("aria-hidden", "false");
    els.scrim.classList.add("on"); els.menu.setAttribute("aria-expanded", "true"); body.classList.add("sb-open");
    const cur = els.sb.querySelector(".sb-item.current") || els.sb.querySelector(".sb-item");
    setTimeout(() => cur.focus(), 30);
  }
  function closeSidebar(restore) {
    if (!els.sb.classList.contains("open")) return;
    els.sb.classList.remove("open"); els.sb.setAttribute("inert", ""); els.sb.setAttribute("aria-hidden", "true");
    els.scrim.classList.remove("on"); els.menu.setAttribute("aria-expanded", "false"); body.classList.remove("sb-open");
    if (restore !== false && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function setRoute(stories, push) {
    const was = body.classList.contains("story-mode");
    body.classList.toggle("story-mode", stories);
    els.sb.querySelectorAll(".sb-item").forEach(a => { const on = (a.dataset.nav === "stories") === stories; a.classList.toggle("current", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
    if (push) { try { const u = new URL(location.href); u.hash = stories ? "stories" : ""; history.pushState(null, "", u.href.replace(/#$/, "")); } catch (e) {} }
    if (stories) {
      $("test").classList.add("hidden"); $("result").classList.add("hidden");
      els.view.classList.remove("hidden"); els.view.classList.remove("enter"); void els.view.offsetWidth; els.view.classList.add("enter");
      ensure();
      if (!was) { if (!els.result.innerHTML) showSuggestions(); }
    } else if (was) {
      els.view.classList.add("hidden");
      if (window.__ptype) window.__ptype.reset();
    }
  }
  function goStories(push) { closeSidebar(false); setRoute(true, push); setTimeout(() => els.q.focus({ preventScroll: true }), 60); }
  function goTyping(push) { closeSidebar(false); setRoute(false, push); }

  function init() {
    Object.assign(els, { sb: $("sidebar"), scrim: $("scrim"), menu: $("menuBtn"), view: $("storyView"), q: $("stQ"), form: $("stForm"),
      chips: $("stChips"), status: $("stStatus"), result: $("stResult"), actions: $("stActions"), another: $("stAnother"), count: $("stCount") });
    els.view.addEventListener("animationend", e => { if (e.target === els.view) els.view.classList.remove("enter"); });
    els.menu.addEventListener("click", () => els.sb.classList.contains("open") ? closeSidebar() : openSidebar());
    $("sbClose").addEventListener("click", () => closeSidebar());
    els.scrim.addEventListener("click", () => closeSidebar());
    els.sb.addEventListener("click", e => {
      const a = e.target.closest(".sb-item"); if (!a) return; e.preventDefault();
      a.dataset.nav === "stories" ? goStories(true) : goTyping(true);
    });
    document.addEventListener("keydown", e => {
      if (!els.sb.classList.contains("open")) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closeSidebar(); return; }
      if (e.key === "Tab") { // focus trap
        const f = [...els.sb.querySelectorAll("a[href],button:not([disabled])")];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!els.sb.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        e.stopImmediatePropagation();
      }
    }, true);
    els.form.addEventListener("submit", e => { e.preventDefault(); doSearch(els.q.value, false); els.q.blur && window.matchMedia("(max-width:640px)").matches && els.q.blur(); });
    els.chips.addEventListener("click", e => {
      const b = e.target.closest(".st-chip"); if (!b) return;
      if (b.dataset.rnd) { ensure().then(() => randomStory(true)); return; }
      els.q.value = b.dataset.q; doSearch(b.dataset.q, false);
    });
    els.another.addEventListener("click", another);
    $("stRandom").addEventListener("click", () => ensure().then(() => randomStory()));
    $("stType").addEventListener("click", () => {
      const st = state.cur; if (!st || !window.__ptype) return;
      const fa = L() === "fa";
      let text = plain(st);
      if (fa) text = text.replace(/\u0654/g, "").replace(/[«»]/g, "");
      const source = fa ? `${st.w}، ${st.t}` : `${st.w}${st.w !== st.t ? ", “" + st.t + "”" : ""}`;
      goTyping(true);
      window.__ptype.typeStory({ text: text.replace(/\s+/g, " ").trim(), author: st.a, source });
    });
    window.addEventListener("popstate", () => { location.hash === "#stories" ? setRoute(true) : setRoute(false); });
    document.addEventListener("ptype:lang", () => {
      ready = null; els.count.textContent = "";
      if (body.classList.contains("story-mode")) {
        ensure().then(() => { if (state.q) doSearch(state.q); else if (state.cur) randomStory(); else showSuggestions(); });
      } else { els.result.innerHTML = ""; els.result.classList.add("hidden"); els.actions.classList.add("hidden"); els.status.textContent = ""; state = { q: "", res: [], i: 0, qs: [], qc: [] }; }
      if (!state.q) els.q.value = "";
    });
    if (location.hash === "#stories") setRoute(true);
  }
  window.__stories = { search: (q, lang) => ensure().then(() => search(lang || L(), q).res.map(r => r.it.st)), load, open: () => goStories(true) };
  init();
})();
