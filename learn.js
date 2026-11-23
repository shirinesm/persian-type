/* «آموزش تایپ ده‌انگشتی» / "Learn touch typing" — ۶ قدم برای مبتدی مطلق.
   صفحه‌کلید تصویری فارسی با رنگ هر انگشت، و تمرین تعاملی در هر قدم.
   اتصال حروف فارسی: هر کلمه یک واحد پیوسته رندر می‌شود. رنگ درست/غلطِ
   هر حرف، اتصال را نمی‌شکند: نویسه‌های هم‌وضعیت در یک span می‌آیند و
   در مرز دو span، دقیقاً جایی که قاعدهٔ اتصال می‌خواهد، ZWJ گذاشته
   می‌شود (همان تکنیک app.js). روی spanهای حرفی هیچ letter-spacing،
   padding، margin یا border نیست. */
(() => {
  "use strict";
  const ZWJ = "\u200D";
  const ZWNJ = "\u200C";

  /* ---------- اتصال حروف (خالص، قابل تست در Node) ---------- */
  const RIGHT_ONLY = new Set(Array.from("اآأإٱدذرزژوؤۀة")); // به حرف بعدی نمی‌چسبند
  const isAr = c => /[\u0620-\u064A\u066E-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF]/.test(c);
  const joinsLeft = c => isAr(c) && c !== "ء" && !RIGHT_ONLY.has(c); // به حرف بعدی می‌چسبد
  const joinsRight = c => isAr(c) && c !== "ء";                        // به حرف قبلی می‌چسبد
  const needZWJ = (prev, next) => joinsLeft(prev) && joinsRight(next);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // word: یک کلمه، states: وضعیت هر نویسه ("" | "ok" | "bad" | "cur")
  // خروجی: HTML که در آن نویسه‌های هم‌وضعیت در یک span هستند و در مرز
  // spanها ZWJ گذاشته شده تا شکل متصل حروف حفظ شود.
  function joinedHTML(word, states) {
    let out = "", i = 0;
    while (i < word.length) {
      const st = states[i] || ""; let j = i;
      while (j < word.length && (states[j] || "") === st) j++;
      let text = "";
      if (i > 0 && needZWJ(word[i - 1], word[i])) text += ZWJ;
      text += word.slice(i, j);
      if (j < word.length && needZWJ(word[j - 1], word[j])) text += ZWJ;
      out += '<span class="ln-ch' + (st ? " " + st : "") + '">' + esc(text) + "</span>";
      i = j;
    }
    return out;
  }
  // نسخهٔ درستِ targetHTML با وضعیت هر نویسه، بر اساس موقعیت سراسری در متن
  function targetHTMLWithState(target, typed) {
    let pos = 0;
    return target.split(" ").map(word => {
      const states = Array.from(word).map((ch, k) => {
        const gi = pos + k;
        if (gi >= typed.length) return gi === typed.length ? "cur" : "";
        return typed[gi] === ch ? "ok" : "bad";
      });
      pos += word.length + 1;
      return '<span class="ln-word">' + joinedHTML(word, states) + "</span>";
    }).join(" ");
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { joinedHTML, targetHTMLWithState, needZWJ, joinsLeft, joinsRight };
  }

  if (typeof document === "undefined") return; // در Node فقط تست اتصال اجرا می‌شود

  /* ---------- زبان ---------- */
  const $ = id => document.getElementById(id);
  const html = document.documentElement;
  const L = () => (html.lang === "en" ? "en" : "fa");
  const FA_D = "۰۱۲۳۴۵۶۷۸۹";
  const num = n => (L() === "fa" ? String(n).replace(/\d/g, d => FA_D[d]) : String(n));

  const S = {
    fa: {
      title: "آموزش تایپ ده‌انگشتی",
      sub: "شش قدم، از صفر؛ برای کسی که هیچ تجربه‌ای ندارد. به کیبورد نگاه نکن — انگشت‌ها خودشان راه را پیدا می‌کنند.",
      step: "قدم",
      of: "از",
      next: "قدم بعد",
      prev: "قدم قبل",
      done: "آفرین! این تمرین را کامل کردی.",
      nextEx: "تمرین بعد",
      tryAgain: "دوباره",
      typeHere: "از اینجا شروع به تایپ کن…",
      progress: "پیشرفت",
      acc: "دقت",
      speed: "کلمه در دقیقه",
      keys: "کلیدهای این قدم",
      tip: "نکته",
      goType: "حالا می‌توانی برای تمرین بروی و شروع کنی",
      goTypeSub: "جای انگشت‌ها را یاد گرفتی، هر سه ردیف را شناختی و چند جملهٔ ساده را هم تایپ کردی. از اینجا به بعد فقط تمرین می‌خواهد — با متن‌های کوتاه شروع کن و کم‌کم سرعت بگیر.",
      goTypeBtn: "شروع تمرین تایپ",
      homeRow: "ردیف خانه",
      topRow: "ردیف بالا",
      bottomRow: "ردیف پایین",
      fingers: {
        lp: "کوچک چپ", lr: "حلقه چپ", lm: "میانی چپ", li: "اشاره چپ",
        lt: "شست چپ", rt: "شست راست", ri: "اشاره راست", rm: "میانی راست",
        rr: "حلقه راست", rp: "کوچک راست"
      }
    },
    en: {
      title: "Learn touch typing",
      sub: "Six steps, from zero — for someone with no experience at all. Don’t look at the keyboard; your fingers will find the way.",
      step: "Step",
      of: "of",
      next: "Next step",
      prev: "Previous step",
      done: "Well done! You completed this exercise.",
      nextEx: "Next exercise",
      tryAgain: "Again",
      typeHere: "Start typing here…",
      progress: "Progress",
      acc: "Accuracy",
      speed: "words per minute",
      keys: "Keys in this step",
      tip: "Tip",
      goType: "Now you can go and start practising",
      goTypeSub: "You know where your fingers go, you know all three rows, and you have typed a few simple sentences. From here on it is only practice — start with short texts and build up speed little by little.",
      goTypeBtn: "Start typing practice",
      homeRow: "Home row",
      topRow: "Top row",
      bottomRow: "Bottom row",
      fingers: {
        lp: "Left pinky", lr: "Left ring", lm: "Left middle", li: "Left index",
        lt: "Left thumb", rt: "Right thumb", ri: "Right index", rm: "Right middle",
        rr: "Right ring", rp: "Right pinky"
      }
    }
  };
  const t = () => S[L()];

  /* ---------- صفحه‌کلید فارسی (استاندارد) و انگشت هر کلید ---------- */
  // finger: lp lr lm li | ri rm rr rp | lt/rt (space)
  const ROWS = [
    [{ k: "ض", c: "Q", f: "lp" }, { k: "ص", c: "W", f: "lr" }, { k: "ث", c: "E", f: "lm" }, { k: "ق", c: "R", f: "li" }, { k: "ف", c: "T", f: "li" }, { k: "غ", c: "Y", f: "ri" }, { k: "ع", c: "U", f: "ri" }, { k: "ه", c: "I", f: "rm" }, { k: "خ", c: "O", f: "rr" }, { k: "ح", c: "P", f: "rp" }, { k: "ج", c: "[", f: "rp" }, { k: "چ", c: "]", f: "rp" }],
    [{ k: "ش", c: "A", f: "lp" }, { k: "س", c: "S", f: "lr" }, { k: "ی", c: "D", f: "lm" }, { k: "ب", c: "F", f: "li" }, { k: "ل", c: "G", f: "li" }, { k: "ا", c: "H", f: "ri" }, { k: "ت", c: "J", f: "ri" }, { k: "ن", c: "K", f: "rm" }, { k: "م", c: "L", f: "rr" }, { k: "ک", c: ";", f: "rp" }, { k: "گ", c: "'", f: "rp" }],
    [{ k: "ظ", c: "Z", f: "lp" }, { k: "ط", c: "X", f: "lr" }, { k: "ز", c: "C", f: "lm" }, { k: "ر", c: "V", f: "li" }, { k: "ذ", c: "B", f: "li" }, { k: "د", c: "N", f: "ri" }, { k: "ئ", c: "M", f: "ri" }, { k: "و", c: ",", f: "rm" }, { k: ".", c: ".", f: "rr" }]
  ];
  const FINGER_OF = {};
  ROWS.forEach(r => r.forEach(o => { FINGER_OF[o.k] = o.f; }));
  FINGER_OF[" "] = "lt";

  /* ---------- شش قدم ---------- */
  const LESSONS = [
    {
      keys: [], targets: [],
      title: { fa: "قدم ۱ — درست بنشین", en: "Step 1 — Sit right" },
      body: {
        fa: "پشتت صاف باشد، هر دو پا روی زمین و مچ دست‌ها آزاد و کمی بالاتر از کیبورد. صفحه‌کلید را جلوی خودت بگذار و آرنج‌ها را نزدیک بدن نگه دار. مهم‌ترین قانون از همین قدم اول: <b>به کیبورد نگاه نکن.</b> اولش کند می‌شوی، ولی چشم‌ات به صفحه باشد تا مغزت جای کلیدها را با لمس یاد بگیرد، نه با دیدن.",
        en: "Sit up straight, both feet on the floor, wrists relaxed and slightly above the keyboard. Keep your elbows close to your body. The most important rule, from this very first step: <b>don’t look at the keyboard.</b> You will be slow at first, but keep your eyes on the screen so your brain learns the keys by touch, not by sight."
      },
      tip: { fa: "اگر گردنت درد گرفت، ارتفاع صندلی یا مانیتور را عوض کن؛ خم‌شدن روی کیبورد از خود تایپ بدتر است.", en: "If your neck hurts, adjust the chair or screen height — hunching over the keyboard is worse than typing itself." }
    },
    {
      keys: ["ب", "ت", "ا", "ل"], targets: ["با", "تاب", "بابا", "بالا", "آب", "تالاب"],
      title: { fa: "قدم ۲ — ردیف خانه: انگشت‌های اشاره", en: "Step 2 — Home row: the index fingers" },
      body: {
        fa: "همه‌چیز از <b>ردیف خانه</b> شروع می‌شود؛ ردیف وسط کیبورد. <b>انگشت اشارهٔ دست چپ روی «ب»</b> و <b>انگشت اشارهٔ دست راست روی «ت»</b> می‌نشیند — روی همین دو کلید یک برجستگی کوچک هست که با لمس پیدایش می‌کنی؛ یعنی حتی بدون نگاه‌کردن هم می‌فهمی انگشت‌هات سر جای‌شان هستند یا نه. بعد از هر کلید، انگشت اشاره به خانه‌اش برمی‌گردد. دو حرف کنارشان هم مال اشاره‌هاست: «ل» (چپ) و «ا» (راست).",
        en: "Everything starts on the <b>home row</b>, the middle row of the keyboard. Your <b>left index finger rests on «ب»</b> and your <b>right index finger on «ت»</b> — both keys have a small bump you can feel, so you can tell by touch whether your fingers are home, without looking. After every key, the index finger comes back home. The two letters next to them also belong to the index fingers: «ل» (left) and «ا» (right)."
      },
      tip: { fa: "قبل از شروع هر تمرین، چشم بسته انگشت‌های اشاره را روی ب و ت بگذار؛ اگر برجستگی را حس کردی، آماده‌ای.", en: "Before each exercise, place your index fingers on ب and ت with your eyes closed; if you feel the bumps, you are ready." }
    },
    {
      keys: ["ش", "س", "ی", "ب", "ل", "ا", "ت", "ن", "م", "ک", "گ"], targets: ["شمس", "سینا", "مینا", "سال", "نام", "گل", "کاش", "بام"],
      title: { fa: "قدم ۳ — بقیهٔ ردیف خانه", en: "Step 3 — The rest of the home row" },
      body: {
        fa: "حالا هر انگشت سر جای خودش روی ردیف خانه می‌نشیند: کوچک چپ روی «ش»، حلقه چپ روی «س»، میانی چپ روی «ی»، اشاره چپ روی «ب» و «ل»، اشاره راست روی «ا» و «ت»، میانی راست روی «ن»، حلقه راست روی «م» و کوچک راست روی «ک» و «گ». هر انگشت فقط کلید خودش را می‌زند و برمی‌گردد. همین ردیف را خوب یاد بگیری، نصف راه را رفته‌ای.",
        en: "Now every finger sits in its own home-row place: left pinky on «ش», left ring on «س», left middle on «ی», left index on «ب» and «ل», right index on «ا» and «ت», right middle on «ن», right ring on «م», right pinky on «ک» and «گ». Each finger presses only its own key and comes back. Learn this row well and you are halfway there."
      },
      tip: { fa: "انگشت کوچک و حلقه اولش تنبل‌اند و اشتباه می‌کنند؛ عجله نکن و بگذار به‌تدریج قوی شوند.", en: "The pinky and ring fingers are lazy and make mistakes at first; don’t rush — let them get stronger gradually." }
    },
    {
      keys: ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "چ"], targets: ["قفس", "حرف", "خوش", "چشم", "جشن", "غصه"],
      title: { fa: "قدم ۴ — ردیف بالا", en: "Step 4 — The top row" },
      body: {
        fa: "ردیف بالا با همان انگشت‌ها زده می‌شود، فقط انگشت یک ردیف بالا می‌رود و برمی‌گردد: اشاره چپ «ق» و «ف»، اشاره راست «غ» و «ع»، میانی چپ «ث»، میانی راست «ه»، حلقه چپ «ص»، حلقه راست «خ»، کوچک چپ «ض» و کوچک راست «ح»، «ج» و «چ». بعد از هر کلید، انگشت دوباره روی ردیف خانه می‌نشیند.",
        en: "The top row is typed with the same fingers — each finger just reaches one row up and comes back: left index «ق» and «ف», right index «غ» and «ع», left middle «ث», right middle «ه», left ring «ص», right ring «خ», left pinky «ض», right pinky «ح», «ج» and «چ». After every key, the finger returns to the home row."
      },
      tip: { fa: "برای ردیف بالا دست را جلو نبر؛ فقط انگشت کشیده شود و مچ ثابت بماند.", en: "Don’t push your whole hand forward for the top row; only stretch the finger and keep the wrist still." }
    },
    {
      keys: ["ظ", "ط", "ز", "ر", "ذ", "د", "ئ", "و", " "], targets: ["زر", "درد", "رود", "ظرف", "طرز", "ذره", "ورد", "دود"],
      title: { fa: "قدم ۵ — ردیف پایین و فاصله", en: "Step 5 — The bottom row and space" },
      body: {
        fa: "ردیف پایین هم همین‌طور است: انگشت یک ردیف پایین می‌رود و برمی‌گردد — «ظ» و «ط» و «ز» با دست چپ، «ر» و «ذ» با اشاره چپ، «د» و «ئ» با اشاره راست و «و» با میانی راست. کلید <b>فاصله</b> را با شست می‌زنند؛ هر دو شست آزادند، هر کدام که راحت‌تر بود. نیم‌فاصله هم با همان شست و ترکیب Shift + Space است، ولی برای شروع فقط فاصله کافی است.",
        en: "The bottom row works the same way: the finger reaches one row down and comes back — «ظ», «ط» and «ز» with the left hand, «ر» and «ذ» with the left index, «د» and «ئ» with the right index, and «و» with the right middle. The <b>space</b> key is pressed with a thumb; both thumbs are free, use whichever feels easier. The half-space is the same thumb with Shift + Space, but plain space is enough to start."
      },
      tip: { fa: "فاصله را محکم نزن؛ یک ضربهٔ سبک با شست کافی است و سرعتت را بالا نگه می‌دارد.", en: "Don’t hit space hard; one light tap with the thumb is enough and keeps your speed up." }
    },
    {
      keys: [], targets: ["بابا آب داد.", "سلام بابا.", "گل زیباست.", "من شادم."],
      title: { fa: "قدم ۶ — متن‌های خیلی ساده", en: "Step 6 — Very simple texts" },
      body: {
        fa: "حالا هر سه ردیف را بلدی. این جمله‌های خیلی ساده را تایپ کن — کلمه‌به‌کلمه، آرام و بدون نگاه‌کردن به کیبورد. اشتباه کردی؟ مهم نیست؛ همان حرف را دوباره بزن و ادامه بده. سرعت حالا مهم نیست، مهم این است که انگشت‌ها خودشان جای کلید را پیدا کنند.",
        en: "Now you know all three rows. Type these very simple sentences — word by word, slowly, without looking at the keyboard. Made a mistake? It doesn’t matter; press the right key and carry on. Speed doesn’t matter yet; what matters is that your fingers find the keys by themselves."
      },
      tip: { fa: "هر روز ده دقیقه تمرین کوتاه، بهتر از یک ساعت تمرین یک‌باره در هفته است.", en: "Ten minutes of short practice every day beats one long hour once a week." }
    }
  ];

  /* ---------- وضعیت ---------- */
  let step = 0, ex = 0, typed = "", correct = 0, total = 0, startTime = 0;

  function renderSteps() {
    const el = $("lnSteps"); if (!el) return;
    el.innerHTML = LESSONS.map((ls, i) =>
      '<button type="button" class="ln-step' + (i === step ? " active" : "") + (i < step ? " done-step" : "") + '" data-step="' + i + '" role="tab" aria-selected="' + (i === step) + '">' +
      '<span class="ln-step-n">' + num(i + 1) + '</span><span>' + esc(ls.title[L()]) + "</span></button>"
    ).join("");
    el.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => goStep(+b.dataset.step)));
  }

  function renderKeyboard(activeKeys, nextKey) {
    const el = $("lnKb"); if (!el) return;
    let h = "";
    ROWS.forEach(row => {
      h += '<div class="ln-kb-row">' + row.map(o => {
        const cls = ["ln-key", "f-" + o.f];
        if (activeKeys.includes(o.k)) cls.push("active");
        if (nextKey === o.k) cls.push("next");
        const bump = (o.k === "ب" || o.k === "ت") ? '<i class="ln-bump" aria-hidden="true"></i>' : "";
        return '<span class="' + cls.join(" ") + '">' + bump + '<b>' + esc(o.k) + '</b><small dir="ltr">' + esc(o.c) + "</small></span>";
      }).join("") + "</div>";
    });
    h += '<div class="ln-kb-row"><span class="ln-key ln-space' + (activeKeys.includes(" ") ? " active" : "") + (nextKey === " " ? " next" : "") + '">' + (L() === "fa" ? "فاصله — با شست" : "Space — with a thumb") + "</span></div>";
    el.innerHTML = h;
  }

  function renderHands(activeFingers) {
    const el = $("lnHands"); if (!el) return;
    const order = ["lp", "lr", "lm", "li", "lt", "rt", "ri", "rm", "rr", "rp"];
    el.innerHTML = '<div class="ln-hands-row">' + order.map(f =>
      '<span class="ln-finger f-' + f + (activeFingers.includes(f) ? " active" : "") + '">' + esc(t().fingers[f]) + "</span>"
    ).join("") + "</div>";
  }

  function renderLesson() {
    const ls = LESSONS[step];
    const body = $("lnBody"); if (!body) return;
    ex = 0; typed = ""; correct = 0; total = 0; startTime = 0;
    const title = $("lnTitle"); if (title) title.textContent = t().title;
    const sub = $("lnSub"); if (sub) sub.textContent = t().sub;
    renderSteps();
    const activeFingers = [...new Set(ls.keys.map(k => FINGER_OF[k]).filter(Boolean))];
    renderKeyboard(ls.keys, ls.targets[0] ? ls.targets[0][0] : null);
    renderHands(activeFingers);
    let h = '<h2 class="ln-h2">' + esc(ls.title[L()]) + "</h2>";
    h += '<p class="ln-text">' + ls.body[L()] + "</p>";
    if (ls.keys.length) {
      h += '<p class="ln-keys-label">' + esc(t().keys) + ": " + ls.keys.map(k => "<b>" + esc(k) + "</b>").join("، ") + "</p>";
    }
    h += '<p class="ln-tip"><b>' + esc(t().tip) + ":</b> " + esc(ls.tip[L()]) + "</p>";
    h += '<div class="ln-nav"><button type="button" class="st-btn ln-prev"' + (step === 0 ? " disabled" : "") + ">" + esc(t().prev) + '</button>' +
      '<button type="button" class="primary ln-next">' + esc(step === LESSONS.length - 1 ? t().goTypeBtn : t().next) + "</button></div>";
    body.innerHTML = h;
    body.querySelector(".ln-prev").addEventListener("click", () => goStep(step - 1));
    body.querySelector(".ln-next").addEventListener("click", () => {
      if (step === LESSONS.length - 1) goTyping();
      else goStep(step + 1);
    });
    renderPractice();
    const done = $("lnDone"); if (done) done.classList.add("hidden");
  }

  function currentTarget() { return LESSONS[step].targets[ex] || ""; }

  function renderPractice() {
    const el = $("lnPractice"); if (!el) return;
    const ls = LESSONS[step];
    if (!ls.targets.length) { el.innerHTML = ""; return; }
    const target = currentTarget();
    el.innerHTML =
      '<div class="ln-target" dir="rtl" lang="fa">' + targetHTMLWithState(target, typed) + "</div>" +
      '<textarea class="ln-input" rows="2" dir="rtl" lang="fa" placeholder="' + esc(t().typeHere) + '" aria-label="' + esc(t().typeHere) + '"></textarea>' +
      '<div class="ln-stats"><span>' + esc(t().progress) + ": <b class=\"ln-prog\">" + num(0) + "٪</b></span>" +
      "<span>" + esc(t().acc) + ": <b class=\"ln-acc\">" + num(100) + "٪</b></span>" +
      "<span>" + esc(t().speed) + ": <b class=\"ln-wpm\">" + num(0) + "</b></span></div>" +
      '<div class="ln-msg" role="status" aria-live="polite"></div>';
    const input = el.querySelector(".ln-input");
    input.addEventListener("input", () => onPracticeInput(input));
    input.addEventListener("keydown", e => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) e.preventDefault();
    });
    // جای حروف فارسی در کادر تمرین با همان تکنیک کلمهٔ پیوسته است؛
    // targetHTMLWithState کلمه‌ها را جدا از هم و حروف هر کلمه را چسبیده رندر می‌کند.
    updatePractice(input);
  }

  function updatePractice(input) {
    const el = $("lnPractice"); if (!el) return;
    const target = currentTarget(); if (!target) return;
    const tgtEl = el.querySelector(".ln-target");
    if (tgtEl) tgtEl.innerHTML = targetHTMLWithState(target, typed);
    const prog = el.querySelector(".ln-prog");
    if (prog) prog.textContent = num(Math.round((typed.length / target.length) * 100)) + "٪";
    const acc = el.querySelector(".ln-acc");
    if (acc) acc.textContent = num(total ? Math.round((correct / total) * 100) : 100) + "٪";
    const wpm = el.querySelector(".ln-wpm");
    if (wpm && startTime) {
      const sec = (performance.now() - startTime) / 1000;
      wpm.textContent = num(sec > 0 ? Math.round((correct / 5) / (sec / 60)) : 0);
    }
    const nextCh = target[typed.length] || null;
    const ls = LESSONS[step];
    renderKeyboard(ls.keys, nextCh);
    const nextFinger = nextCh ? FINGER_OF[nextCh] : null;
    renderHands(nextFinger ? [nextFinger] : [...new Set(ls.keys.map(k => FINGER_OF[k]).filter(Boolean))]);
  }

  function onPracticeInput(input) {
    const target = currentTarget(); if (!target) return;
    let v = input.value.replace(/[\r\n\t]/g, "");
    if (v.length > target.length) { v = v.slice(0, target.length); input.value = v; }
    if (!startTime && v.length) startTime = performance.now();
    if (v.length > typed.length) {
      for (let i = typed.length; i < v.length; i++) {
        total++;
        const exp = target[i];
        const got = v[i] === "ي" || v[i] === "ى" ? "ی" : v[i] === "ك" ? "ک" : v[i];
        if (got === exp) correct++;
      }
    }
    typed = v;
    updatePractice(input);
    if (typed.length === target.length) {
      const el = $("lnPractice");
      const msg = el && el.querySelector(".ln-msg");
      const allOk = correct === total && total > 0;
      if (msg) {
        msg.innerHTML = '<span class="ln-done-msg">' + esc(t().done) + "</span> " +
          '<button type="button" class="st-btn ln-next-ex">' + esc(ex + 1 < LESSONS[step].targets.length ? t().nextEx : t().next) + "</button> " +
          '<button type="button" class="st-btn ln-retry">' + esc(t().tryAgain) + "</button>";
        msg.querySelector(".ln-next-ex").addEventListener("click", () => {
          if (ex + 1 < LESSONS[step].targets.length) { ex++; typed = ""; correct = 0; total = 0; startTime = 0; renderPractice(); const inp = $("lnPractice").querySelector(".ln-input"); if (inp) inp.focus(); }
          else if (step + 1 < LESSONS.length) goStep(step + 1);
          else showDone();
        });
        msg.querySelector(".ln-retry").addEventListener("click", () => { typed = ""; correct = 0; total = 0; startTime = 0; renderPractice(); const inp = $("lnPractice").querySelector(".ln-input"); if (inp) inp.focus(); });
      }
      void allOk;
    }
  }

  function showDone() {
    const done = $("lnDone"); if (!done) return;
    done.classList.remove("hidden");
    done.innerHTML = '<h2 class="ln-h2">' + esc(t().goType) + "</h2>" +
      '<p class="ln-text">' + esc(t().goTypeSub) + "</p>" +
      '<button type="button" class="primary ln-go">' + esc(t().goTypeBtn) + "</button>";
    done.querySelector(".ln-go").addEventListener("click", goTyping);
    done.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function goStep(i) {
    if (i < 0 || i >= LESSONS.length) return;
    step = i;
    renderLesson();
    const view = $("learnView");
    if (view) view.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function goTyping() {
    if (window.__stories && window.__stories.goTyping) { window.__stories.goTyping(); return; }
    try { const u = new URL(location.href); u.hash = ""; history.pushState(null, "", u.href.replace(/#$/, "")); } catch (e) {}
    document.body.classList.remove("learn-mode");
    const lv = $("learnView"); if (lv) lv.classList.add("hidden");
    if (window.__ptype) window.__ptype.reset();
  }

  function render() { renderLesson(); }

  window.__learn = { open: () => render(), render, goStep, goTyping };
  document.addEventListener("ptype:lang", () => {
    if (document.body.classList.contains("learn-mode")) render();
  });
  // اگر صفحه مستقیم با #learn باز شد، stories.js مسیریابی را انجام می‌دهد؛
  // اینجا فقط مطمئن می‌شویم رندر اولیه آماده است.
  if (location.hash === "#learn") render();
})();
