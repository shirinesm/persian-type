#!/usr/bin/env python3
"""Build stories-fa.js / stories-en.js for the «داستان کوتاه پیدا کن» section.

Persian: complete tales (≤100 words) from Saadi's Golestan and Jami's Baharestan,
taken verbatim from the ganjoor.net API (cached by fetch_gj.py into gj_all.json).
English: complete public-domain fables (Aesop tr. Townsend, PG #21; Bierce, PG #374)
plus a few clearly-marked opening excerpts of famous short stories.
Every item is re-checked against its source by tools/verify_stories.py.
"""
import json, re, sys, os
SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/fix"
OUT = os.path.join(os.path.dirname(__file__), "..")
FA_NUM = "۰۱۲۳۴۵۶۷۸۹"
fanum = lambda n: "".join(FA_NUM[int(c)] for c in str(n))

# ---------------- Persian ----------------
gj = json.load(open(os.path.join(SRC, "gj_all.json"), encoding="utf-8"))
AR = re.compile(r"[ةىًٌٍ]")
NARR = re.compile(r"گفت|دید|رفت|آمد|بود")
EXCLUDE = {  # unsuitable (ethnic/religious slurs, crude, aphorism rather than story, or non-narrative)
  "/saadi/golestan/gbab1/sh29", "/saadi/golestan/gbab2/sh30", "/saadi/golestan/gbab4/sh9",
  "/saadi/golestan/gbab5/sh1", "/saadi/golestan/gbab5/sh2", "/saadi/golestan/gbab5/sh3", "/saadi/golestan/gbab5/sh6",
  "/saadi/golestan/gbab7/sh13", "/saadi/golestan/gbab7/sh15", "/saadi/golestan/gbab3/sh5",
  "/jami/baharestan/rowze2/sh11", "/jami/baharestan/rowze2/sh17", "/jami/baharestan/rowze3/sh5",
  "/jami/baharestan/rowze4/sh3", "/jami/baharestan/rowze6/sh6", "/jami/baharestan/rowze6/sh16",
  "/jami/baharestan/rowze6/sh26", "/jami/baharestan/rowze6/sh27", "/jami/baharestan/rowze6/sh29",
  "/jami/baharestan/rowze6/sh47", "/jami/baharestan/rowze8/sh17",
}
WORK = {"golestan": ("سعدی", "گلستان", "۶۵۶ ق / ۱۲۵۸ م"), "baharestan": ("جامی", "بهارستان", "۸۹۲ ق / ۱۴۸۷ م")}
def wc(x): return sum(len(t.split()) for _, _, t in x["verses"])
def arab(x):
    return any(AR.search(t) or len(re.findall(r"(?:^|\s)ال\S{2,}", t)) >= 2 for _, _, t in x["verses"])
def parts_of(x):
    parts, cur = [], None
    for pos, ci, t in x["verses"]:
        t = t.strip()
        if pos == -1: parts.append(["p", t]); cur = None
        elif pos == 0: cur = ["b", t]; parts.append(cur)
        elif pos == 1 and cur and len(cur) == 2: cur.append(t); cur = None
        else: parts.append(["b", t])
    return parts
fa = []
for x in gj:
    u = x["url"]
    if not (20 <= wc(x) <= 100) or arab(x) or not x["verses"] or x["verses"][0][0] != -1: continue
    if not NARR.search(x["verses"][0][2]): continue
    if "rowze7" in u or "rowze1" in u and not u.endswith("/sh30"): continue
    if x["title"].startswith("حکمت") or u in EXCLUDE: continue
    key = u.split("/")[2]
    a, w, y = WORK[key]
    n = re.sub(r"\D", "", x["title"].translate(str.maketrans(FA_NUM, "0123456789")))
    label = ("حکایت " if key == "golestan" else "بخش ") + fanum(n)
    fa.append({"id": "fa%d" % len(fa), "t": label, "a": a, "w": w, "ch": x["cat"], "y": y,
               "u": "https://ganjoor.net" + u, "parts": parts_of(x)})

# ---------------- English ----------------
def paras(lines):
    t = "\n".join(lines).strip()
    return [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", t) if p.strip()]
def pg(fn):
    L = open(os.path.join(SRC, fn), encoding="utf-8").read().split("\n")
    st = [i for i, l in enumerate(L) if l.startswith("*** START OF")][0]
    en = [i for i, l in enumerate(L) if l.startswith("*** END OF")][0]
    return L[st:en]
def fix_caps(ps):
    """Townsend/Gutenberg set the opening words in CAPITALS (small caps in print); show them in normal case."""
    p = ps[0]; m = re.match(r"^((?:[A-Z][A-Z’'\-]*[,]?\s+)+)", p)
    if not m: return ps
    run = m.group(1); rest = " ".join(ps)[len(run):]
    out = []
    for i, w in enumerate(run.split()):
        core = re.sub(r"[^A-Za-z’'\-]", "", w)
        cap = core.capitalize() if core else core
        keep = i == 0 or len(core) > 1 and re.search(r"\b" + re.escape(cap) + r"\b", rest)
        out.append(w.replace(core, cap if keep else core.lower()))
    return [" ".join(out) + " " + p[len(run):]] + ps[1:]
en = []
def wcount(ps): return sum(len(p.split()) for p in ps)
# Aesop
L = pg("aesop.txt")
a = [i for i, l in enumerate(L) if l.strip() == "CONTENTS"][0]; b = [i for i, l in enumerate(L) if l.strip() == "INDEX"][0]
titles = [l.strip() for l in L[a + 1:b] if l.startswith(" ") and l.strip()]; tset = set(titles)
bs = [i for i, l in enumerate(L) if l.strip() == "INDEX"][-1]
fs = [x for x in (i for i, l in enumerate(L) if l.strip() == titles[0]) if x > b][0]
body = L[fs:bs]
starts = [i for i, l in enumerate(body) if l.strip() in tset and not l.startswith(" ") and i + 1 < len(body) and body[i + 1].strip() == ""]
ODD = {"The Gnat and the Lion"}  # Gutenberg typo in the text ("an a woman")
for k, i in enumerate(starts):
    ps = paras(body[i + 1:(starts[k + 1] if k + 1 < len(starts) else len(body))])
    t = re.sub(r"(?<=\s)(And|The|Of|In|A|An|To|With|His|Her|Its|By|At|On)(?=\s)", lambda m: m.group(1).lower(), body[i].strip())
    if not (15 <= wcount(ps) <= 100) or t in ODD: continue
    en.append({"t": t, "a": "Aesop", "w": "Aesop’s Fables", "tr": "tr. George Fyler Townsend", "y": "1867",
               "u": "https://www.gutenberg.org/ebooks/21", "pg": 21, "parts": [["p", p] for p in fix_caps(ps)]})
# Bierce
L = pg("bierce.txt")
idx = [i for i, l in enumerate(L) if l.strip() == "The Tail of the Sphinx"]
titles = [l.strip() for l in L[idx[0]:idx[1]] if l.strip() and not l.strip().isupper()]; tset = set(titles)
body = L[idx[1]:]
starts = [i for i, l in enumerate(body) if l.strip() in tset and i + 2 < len(body) and body[i + 1].strip() == ""]
BAD = re.compile(r"\b(negro|chinaman|chinese|jew|irish|savage|indian|senator|legislat|congress|democrat|republican|politic|statesman|governor|boss|ass|idiot|lunatic)\b", re.I)
for k, i in enumerate(starts):
    ps = paras(body[i + 1:(starts[k + 1] if k + 1 < len(starts) else len(body))])
    while ps and ps[-1].isupper(): ps.pop()  # section headings
    t = body[i].strip()
    if t.endswith(":") or not (12 <= wcount(ps) <= 100) or BAD.search(" ".join(ps) + " " + t): continue
    en.append({"t": t, "a": "Ambrose Bierce", "w": "Fantastic Fables", "y": "1899",
               "u": "https://www.gutenberg.org/ebooks/374", "pg": 374, "parts": [["p", p] for p in ps]})
# Excerpts (opening of famous short stories, cut at a sentence boundary, ≤100 words)
def excerpt(lines):
    ps = paras(lines); out = []; n = 0
    for p in ps:
        sents = re.split(r"(?<=[.!?”\"])\s+(?=[A-Z“\"])", p); keep = []
        for s in sents:
            if n + len(s.split()) > 100: break
            keep.append(s); n += len(s.split())
        if keep: out.append(" ".join(keep))
        if len(keep) < len(sents): break
    return out
def block(fn, first, k=40):
    L = pg(fn) if fn.startswith("pg") else open(os.path.join(SRC, fn), encoding="utf-8").read().split("\n")
    i = [j for j, l in enumerate(L) if l.strip().startswith(first)][-1 if fn == "pg2148.txt" else 0]
    return L[i:i + k]
chopin = [l for l in open(os.path.join(SRC, "chopin.txt"), encoding="utf-8").read().split("\n")]
ci = [j for j, l in enumerate(chopin) if l.startswith("Knowing that Mrs. Mallard")][0]
EXC = [
  ("The Story of an Hour", "Kate Chopin", "The Story of an Hour", "1894", "https://en.wikisource.org/wiki/The_Story_of_an_Hour", None, chopin[ci:ci + 12]),
  ("The Tell-Tale Heart", "Edgar Allan Poe", "The Tell-Tale Heart", "1843", "https://www.gutenberg.org/ebooks/2148", 2148, block("pg2148.txt", "True!—nervous")),
  ("The Cask of Amontillado", "Edgar Allan Poe", "The Cask of Amontillado", "1846", "https://www.gutenberg.org/ebooks/2148", 2148, block("pg2148.txt", "The thousand injuries of Fortunato")),
  ("The Gift of the Magi", "O. Henry", "The Gift of the Magi", "1905", "https://www.gutenberg.org/ebooks/7256", 7256, block("pg7256.txt", "One dollar and eighty-seven")),
  ("The Happy Prince", "Oscar Wilde", "The Happy Prince and Other Tales", "1888", "https://www.gutenberg.org/ebooks/902", 902, block("pg902.txt", "HIGH above the city")),
  ("The Lady with the Dog", "Anton Chekhov", "The Lady with the Dog and Other Stories", "1899", "https://www.gutenberg.org/ebooks/13415", 13415, block("pg13415.txt", "IT was said that a new person")),
  ("The Yellow Wallpaper", "Charlotte Perkins Gilman", "The Yellow Wallpaper", "1892", "https://www.gutenberg.org/ebooks/1952", 1952, block("pg1952.txt", "It is very seldom")),
]
exc = []
for t, a, w, y, u, n, lines in EXC:
    ps = excerpt(lines)
    if a == "Oscar Wilde" or a == "Anton Chekhov": ps = fix_caps(ps)
    ps = [re.sub(r"_([^_]+)_", r"\1", p) for p in ps]
    d = {"t": t, "a": a, "w": w, "y": y, "u": u, "x": 1, "parts": [["p", p] for p in ps]}
    if a == "Anton Chekhov": d["tr"] = "tr. Constance Garnett (1917)"
    if n: d["pg"] = n
    exc.append(d)
en = exc + en

# ======================================================================================
# Expanded corpus (2026-11): more Persian classics, modern Persian prose, Persian translations
# of world authors, and many more English-language / translated authors.
# Rules: public-domain texts — complete if ≤100 words, else an opening excerpt (whole sentences,
# ≤100 words, marked x:1).  Copyrighted works — only a short labelled excerpt (≤80 words, c:1)
# quoted as on Wikiquote, with the citation and link.  Every item gets a source spec in
# tools/stories_sources.json and is re-checked by tools/verify_stories.py.
# ======================================================================================
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from srclib import wiki_html, wiki_paras, quotes, pg_text, norm, core
from excerpt import cut
from hezar import hezar
import unicodedata
SPEC = {}
def clean(s):  # display text: NFKC (Arabic presentation forms), no bidi marks, single spaces
    return norm(s, lower=False)
def P(ps): return [["p", clean(p)] for p in ps if clean(p)]
def nwords(parts): return sum(len(" ".join(x[1:]).split()) for x in parts)

for s in fa: SPEC[s["u"]] = {"k": "gj"}
for s in en:
    if s.get("pg"): s.setdefault("_spec", {"k": "pg", "n": s["pg"]})
    else: s["_spec"] = {"k": "ws", "host": "en.wikisource.org", "title": "The Story of an Hour"}

# ---------- Persian: more ganjoor books ----------
gj2 = json.load(open(os.path.join(SRC, "gj2.json"), encoding="utf-8"))
GW = {
  "/attar/manteghotteyr": ("عطار نیشابوری", "منطق‌الطیر", "قرن ۶ ق / ۱۲ م"),
  "/attar/mosibatname": ("عطار نیشابوری", "مصیبت‌نامه", "قرن ۶ ق / ۱۲ م"),
  "/attar/elahiname": ("عطار نیشابوری", "الهی‌نامه", "قرن ۶ ق / ۱۲ م"),
  "/attar/asrarname": ("عطار نیشابوری", "اسرارنامه", "قرن ۶ ق / ۱۲ م"),
  "/moulavi/masnavi": ("مولوی", "مثنوی معنوی", "۶۶۰–۶۷۲ ق / ۱۲۶۲–۱۲۷۳ م"),
  "/parvin/divanp": ("پروین اعتصامی", "دیوان اشعار", "۱۳۱۴ خ / ۱۹۳۵ م"),
  "/monshi/kelile-demni": ("نصرالله منشی", "کلیله و دمنه", "حدود ۵۳۸ ق / ۱۱۴۴ م"),
  "/varavini/marzbanname": ("سعدالدین وراوینی", "مرزبان‌نامه", "حدود ۶۲۲ ق / ۱۲۲۵ م"),
  "/aroozi/4maghale": ("نظامی عروضی", "چهار مقاله", "حدود ۵۵۱ ق / ۱۱۵۶ م"),
  "/obeyd/aa": ("عبید زاکانی", "اخلاق الاشراف", "۷۴۰ ق / ۱۳۴۰ م"),
}
def gtitle(x):
    t = re.sub(r"^(بخش|شمارهٔ)\s*[۰-۹0-9]+\s*-\s*", "", x["title"]).strip()
    t = re.sub(r"^حکایت\s*[۰-۹0-9]+\s*$", "حکایت", t)
    if t in ("حکایت", "الحكایة و التمثیل", "الحکایة و التمثیل", "") or t.startswith("الحك") or t.startswith("الحک"):
        first = x["verses"][0][2].split()
        t = "حکایت: " + " ".join(first[:5]) + " …"
    w = t.split()
    if len(w) > 11: t = " ".join(w[:10]) + " …"
    return t
def gadd(x, parts, excerpt):
    a, w, y = GW[x["book"]]
    d = {"t": gtitle(x), "a": a, "w": w, "ch": x["cat"], "y": y, "u": "https://ganjoor.net" + x["url"], "parts": parts}
    if excerpt: d["x"] = 1
    SPEC[d["u"]] = {"k": "gj"}
    fa.append(d)
by = {}
for x in gj2: by.setdefault(x["book"], []).append(x)
def complete_ok(x, lo=30, hi=100):
    return lo <= wc(x) <= hi and nwords(parts_of(x)) <= hi and not arab(x) and NARR.search(" ".join(t for _, _, t in x["verses"]))
# Attar: titled «حکایت», complete, narrative — spread over the four books
cnt = {}
for b in ["/attar/manteghotteyr", "/attar/elahiname", "/attar/mosibatname", "/attar/asrarname"]:
    n = 0
    for x in by.get(b, []):
        if "حکایت" not in x["title"] or not complete_ok(x): continue
        gadd(x, parts_of(x), False); n += 1
        if n >= {"/attar/manteghotteyr": 10, "/attar/elahiname": 8, "/attar/mosibatname": 8, "/attar/asrarname": 4}[b]: break
# Masnavi: complete short tales
n = 0
for x in by.get("/moulavi/masnavi", []):
    if re.match(r"^(حکایت|قصهٔ|داستان)", gtitle(x)) and complete_ok(x) and n < 20:
        gadd(x, parts_of(x), False); n += 1
# Parvin: complete narrative poems
n = 0
for x in by.get("/parvin/divanp", []):
    if x["cat"].startswith("مثنویات") and re.search(r" - (?!قطعه|بیت)", x["title"]) and complete_ok(x, 30, 100) and n < 14:
        gadd(x, parts_of(x), False); n += 1
# Prose books: chosen tales; complete if ≤100 words else the opening (≤100 words)
PROSE = {
  "/monshi/kelile-demni": ["shirogav/sh29", "shirogav/sh24", "shirogav/sh34", "shirogav/sh35", "shirogav/sh38", "shirogav/sh39",
      "shirogav/sh40", "shirogav/sh32", "demne/sh6", "demne/sh10", "kzmba/sh12", "boofozagh/sh4", "boofozagh/sh8",
      "boofozagh/sh10", "boofozagh/sh12", "boofozagh/sh13", "shahobaraheme/sh12", "zahedomehman/sh3", "gorbeomoosh/sh2",
      "boozineobakhe/sh6", "paadorpar/sh2"],
  "/varavini/marzbanname": ["mrbab1/sh7", "mrbab1/sh12", "mrbab2/sh2", "mrbab2/sh4", "mrbab2/sh8", "mrbab4/sh4", "mrbab5/sh2",
      "mrbab6/sh2", "mrbab6/sh5", "mrbab6/sh6", "mrbab6/sh12", "mrbab7/sh4", "mrbab8/sh5", "mrbab9/sh3"],
  "/aroozi/4maghale": ["sher/sh4", "sher/sh11", "nojoom/sh3", "nojoom/sh8", "dabiri/sh4", "teb/sh3", "dibache4m/sh8", "nojoom/sh5"],
}
for b, keys in PROSE.items():
    idx = {"/".join(x["url"].split("/")[-2:]): x for x in by.get(b, [])}
    for k in keys:
        x = idx.get(k)
        if not x: print("missing", b, k); continue
        if 20 <= wc(x) <= 100 and x["verses"][0][0] == -1:
            gadd(x, parts_of(x), False); continue
        ps = []
        for pos, ci, t in x["verses"]:
            if pos != -1: break
            ps.append(t.strip())
        out, n = cut(ps, limit=100, minw=25, fa=True, cont=60)
        if n < 15: print("short excerpt", k); continue
        gadd(x, [["p", p] for p in out], True)
# Obeyd: the short complete pieces of اخلاق الاشراف that tell an anecdote
# (Obeyd: the ganjoor text available is اخلاق الاشراف — satirical essays, not anecdotes — so none are used.)

# ---------- Persian: Thousand and One Nights (tr. Tasuji), wikisource ----------
HEZ = ["سفر اول سند باد", "سفر دوم سند باد", "سفر سیم سند باد", "سفر سوم سند باد", "سفر چهارم سند باد", "سفر پنجم سند باد",
       "سفر ششم سند باد", "سفر هفتم سند باد", "روباه و کلاغ", "کلاغ و گربه", "مرغابی و سنگ پشت", "خارپشت و قمری",
       "موش و سموره", "گنجشک و طاوس", "روباه و گرگ", "اسب آبنوس", "معروف پینه دوز", "ملک یونان و حکیم رویان",
       "بازرگان و عفریت", "صیاد و عفریت", "حمال با دختران", "گدای اول", "گدای دوم", "گدای سوم", "خیاط احدب و یهودی",
       "پیر و غزال", "پیر دوم و دو سگش", "شبان و فرشته", "بوزینه و دزد", "دهقانی و خرش", "مدینه نحاس", "عبدالله بری و بحری",
       "خلیفه صیاد", "ابوالحسن وراج", "علی بابا", "علاءالدین ابوالشامات", "انوشیروان و دختر دهاتی", "خواب عجیب"]
got = 0
for t in HEZ:
    try: r = hezar(t)
    except Exception: r = None
    if not r: continue
    d = {"t": t.replace("سند باد", "سندباد"), "a": "هزار و یک شب", "w": "هزار و یک شب", "tr": "ترجمهٔ عبداللطیف طسوجی",
         "y": "۱۲۶۱ ق / ۱۸۴۵ م", "u": "https://fa.wikisource.org/wiki/" + ("هزار و یکشب/" + t).replace(" ", "_"),
         "x": 1, "parts": P(r)}
    d["_spec"] = {"k": "ws", "host": "fa.wikisource.org", "title": "هزار و یکشب/" + t}
    fa.append(d); got += 1
    if got >= 30: break

# ---------- Persian: modern prose on wikisource ----------
from wsfa import ws_excerpt
H = "صادق هدایت"; B = "صمد بهرنگی"
WSFA = [  # (page, author, title, work, year, translator, copyrighted)
  ("بوف کور", H, "بوف کور", "بوف کور", "۱۳۱۵ خ / ۱۹۳۶ م", None, 0),
  ("سه قطره خون/داش آکل", H, "داش آکل", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/سه قطره خون", H, "سه قطره خون", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/آینه شکسته", H, "آینهٔ شکسته", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/صورتکها", H, "صورتک‌ها", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/طلب آمرزش", H, "طلب آمرزش", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/لاله", H, "لاله", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/محلل", H, "محلل", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/مردی که نفسش را کشت", H, "مردی که نفسش را کشت", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/چنگال", H, "چنگال", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/گجسته دژ", H, "گجسته دژ", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("سه قطره خون/گرداب", H, "گرداب", "سه قطره خون", "۱۳۱۱ خ / ۱۹۳۲ م", None, 0),
  ("زنده بگور/آبجی خانم", H, "آبجی خانم", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("زنده بگور/آب زندگی", H, "آب زندگی", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("زنده بگور/آتش‌پرست", H, "آتش‌پرست", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("زنده بگور/اسیر فرانسوی", H, "اسیر فرانسوی", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("زنده بگور/حاجی مراد", H, "حاجی مراد", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("زنده بگور/داود گوژپشت", H, "داود گوژپشت", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("زنده بگور/زنده بگور (داستان کوتاه)", H, "زنده به گور", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("زنده بگور/مادلن", H, "مادلن", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("زنده بگور/مرده‌خورها", H, "مرده‌خورها", "زنده به گور", "۱۳۰۹ خ / ۱۹۳۰ م", None, 0),
  ("بن‌بست (داستان کوتاه)", H, "بن‌بست", "سگ ولگرد", "۱۳۲۱ خ / ۱۹۴۲ م", None, 0),
  ("تاریک‌خانه (داستان کوتاه)", H, "تاریک‌خانه", "سگ ولگرد", "۱۳۲۱ خ / ۱۹۴۲ م", None, 0),
  ("تجلی (داستان کوتاه)", H, "تجلی", "سگ ولگرد", "۱۳۲۱ خ / ۱۹۴۲ م", None, 0),
  ("سگ ولگرد (داستان کوتاه)", H, "سگ ولگرد", "سگ ولگرد", "۱۳۲۱ خ / ۱۹۴۲ م", None, 0),
  ("کاتیا (داستان کوتاه)", H, "کاتیا", "سگ ولگرد", "۱۳۲۱ خ / ۱۹۴۲ م", None, 0),
  ("میهن‌پرست (داستان کوتاه)", H, "میهن‌پرست", "سگ ولگرد", "۱۳۲۱ خ / ۱۹۴۲ م", None, 0),
  ("تخت ابونصر (داستان کوتاه)", H, "تخت ابونصر", "سگ ولگرد", "۱۳۲۱ خ / ۱۹۴۲ م", None, 0),
  ("دن‌ژوان کرج", H, "دن ژوان کرج", "سگ ولگرد", "۱۳۲۱ خ / ۱۹۴۲ م", None, 0),
  ("ماهی سیاه کوچولو", B, "ماهی سیاه کوچولو", "ماهی سیاه کوچولو", "۱۳۴۷ خ / ۱۹۶۸ م", None, 0),
  ("قصه‌های بهرنگ/پسرک لبوفروش", B, "پسرک لبوفروش", "قصه‌های بهرنگ", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("قصه‌های بهرنگ/کچل کفترباز", B, "کچل کفترباز", "قصه‌های بهرنگ", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("قصه‌های بهرنگ/اولدوز و کلاغها", B, "اولدوز و کلاغ‌ها", "قصه‌های بهرنگ", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("قصه‌های بهرنگ/اولدوز و عروسک سخنگو", B, "اولدوز و عروسک سخنگو", "قصه‌های بهرنگ", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("قصه‌های بهرنگ/کوراوغلو و کچل‌حمزه", B, "کوراوغلو و کچل حمزه", "قصه‌های بهرنگ", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("یک هلو و هزار هلو", B, "یک هلو هزار هلو", "قصه‌های بهرنگ", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/تلخون", B, "تلخون", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/قصه ی آه", B, "قصهٔ آه", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/آدی و بودی", B, "آدی و بودی", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/بز ریش سفید", B, "بز ریش سفید", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/به دنبال فلک", B, "به دنبال فلک", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/عادت", B, "عادت", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/موش گرسنه", B, "موش گرسنه", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/پوست نارنج", B, "پوست نارنج", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/گرگ و گوسفند", B, "گرگ و گوسفند", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("تلخون/بی نام", B, "بی‌نام", "تلخون و چند قصهٔ دیگر", "دههٔ ۱۳۴۰ خ / ۱۹۶۰ م", None, 0),
  ("فارسی شکر است", "محمدعلی جمال‌زاده", "فارسی شکر است", "یکی بود یکی نبود", "۱۳۰۰ خ / ۱۹۲۱ م", None, 1),
  ("مسخ/مسخ", "فرانتس کافکا", "مسخ", "مسخ", "۱۹۱۵ م", "ترجمهٔ حسن قائمیان", 1),
  ("مسخ/گراکوس شکارچی", "فرانتس کافکا", "گراکوس شکارچی", "مسخ", "۱۹۱۷ م", "ترجمهٔ حسن قائمیان", 1),
  ("مسخ/مهمان مردگان", "فرانتس کافکا", "مهمان مردگان", "مسخ", "", "ترجمهٔ حسن قائمیان", 1),
  ("مسخ/شمشیر", "فرانتس کافکا", "شمشیر", "مسخ", "", "ترجمهٔ حسن قائمیان", 1),
  ("مسخ/در کنیسه ما", "فرانتس کافکا", "در کنیسهٔ ما", "مسخ", "", "ترجمهٔ حسن قائمیان", 1),
]
SKIPPED = []
for page, a, t, w, y, tr, c in WSFA:
    try:
        out, n = ws_excerpt(page, limit=80 if c else 100)
    except Exception as e:
        SKIPPED.append((page, "no readable text on Wikisource (%s)" % type(e).__name__)); continue
    out = [clean(p) for p in out]
    if n < 15: SKIPPED.append((page, "too little text (%d words)" % n)); continue
    d = {"t": t, "a": a, "w": w, "y": y, "u": "https://fa.wikisource.org/wiki/" + page.replace(" ", "_"), "x": 1, "parts": P(out)}
    if tr: d["tr"] = tr
    if c: d["c"] = 1
    d["_spec"] = {"k": "ws", "host": "fa.wikisource.org", "title": page}
    fa.append(d)

# ---------- Persian: Wikiquote (copyrighted modern prose & translations; ≤80 words) ----------
def wq_pick(host, page, start, lim=80):
    st = core(start)
    for sec, q, cite in quotes(host, page):
        cq = core(q)
        if cq.startswith(st):
            txt = clean(q); txt = re.sub(r"^[«“\"]\s*|\s*[»”\"]$", "", txt).strip()
            if len(txt.split()) > lim or "[...]" in txt or "[…]" in txt: return None
            return txt, sec, cite
    return None
WQFA = [  # page, quote start, author, title, work, year, translator
  ("عباس معروفی", "وقتی آدم یک نفر را دوست داشته باشد", "عباس معروفی", "سمفونی مردگان", "سمفونی مردگان", "۱۳۶۸ خ / ۱۹۸۹ م", None),
  ("عباس معروفی", "جعبه عکس‌هایش را گذاشته بود", "عباس معروفی", "فریدون سه پسر داشت", "فریدون سه پسر داشت", "۱۳۸۲ خ / ۲۰۰۳ م", None),
  ("صادق چوبک", "«تو را ستایش می‌کنیم", "صادق چوبک", "سنگ صبور", "سنگ صبور", "۱۳۴۵ خ / ۱۹۶۶ م", None),
  ("محمدعلی جمال‌زاده", "« شب عید نوروز بود", "محمدعلی جمال‌زاده", "کباب غاز", "کباب غاز", "", None),
  ("بزرگ علوی", "«هر کس در زندگانی", "بزرگ علوی", "ستارهٔ دنباله‌دار", "ستارهٔ دنباله‌دار", "", None),
  ("سیمین دانشور", "«دوست داشتن که عیب نیست", "سیمین دانشور", "سووشون", "سووشون", "۱۳۴۸ خ / ۱۹۶۹ م", None),
  ("سیمین دانشور", "«این‌ها که گفتید", "سیمین دانشور", "سووشون", "سووشون", "۱۳۴۸ خ / ۱۹۶۹ م", None),
  ("سیمین دانشور", "«خانم مدیر خدابیامرز", "سیمین دانشور", "به کی سلام کنم؟", "به کی سلام کنم؟", "۱۳۵۹ خ / ۱۹۸۰ م", None),
  ("سیمین دانشور", "«دخترش که می‌ترسد", "سیمین دانشور", "به کی سلام کنم؟", "به کی سلام کنم؟", "۱۳۵۹ خ / ۱۹۸۰ م", None),
  ("سیمین دانشور", "«بلبل با آوازش صبح را شکافت", "سیمین دانشور", "ساربان سرگردان", "ساربان سرگردان", "۱۳۸۰ خ / ۲۰۰۱ م", None),
  ("شازده کوچولو", "«شازده کوچولو پرسید", "آنتوان دو سنت‌اگزوپری", "شازده کوچولو و روباه", "شازده کوچولو", "۱۹۴۳ م", "ترجمهٔ فارسی"),
  ("شازده کوچولو", "« روباه گفت: باید خیلی خیلی حوصله کنی", "آنتوان دو سنت‌اگزوپری", "اهلی کردن", "شازده کوچولو", "۱۹۴۳ م", "ترجمهٔ فارسی"),
  ("شازده کوچولو", "« روباه گفت: تو هنوز برای من", "آنتوان دو سنت‌اگزوپری", "صدهاهزار روباه", "شازده کوچولو", "۱۹۴۳ م", "ترجمهٔ فارسی"),
  ("شازده کوچولو", "«روباه گفت: خداحافظ", "آنتوان دو سنت‌اگزوپری", "راز روباه", "شازده کوچولو", "۱۹۴۳ م", "ترجمهٔ فارسی"),
  ("شازده کوچولو", "«شبانگاهان که به‌آسمان", "آنتوان دو سنت‌اگزوپری", "ستاره‌های خندان", "شازده کوچولو", "۱۹۴۳ م", "ترجمهٔ فارسی"),
  ("خورخه لوئیس بورخس", "«هر زندگی، هر چقدر", "خورخه لوئیس بورخس", "زندگی‌نامهٔ تادئو ایسیدورو کروس", "الف", "۱۹۴۹ م", "ترجمهٔ فارسی"),
  ("خورخه لوئیس بورخس", "«در آن امپراتوری", "خورخه لوئیس بورخس", "دربارهٔ دقت در علم", "", "۱۹۴۶ م", "ترجمهٔ فارسی"),
  ("خورخه لوئیس بورخس", "«اگر شرف و حکمت", "خورخه لوئیس بورخس", "کتابخانهٔ بابل", "داستان‌های تخیلی", "۱۹۴۱ م", "ترجمهٔ فارسی"),
  ("خورخه لوئیس بورخس", "«هیچ هجایی نیست", "خورخه لوئیس بورخس", "کتابخانهٔ بابل", "داستان‌های تخیلی", "۱۹۴۱ م", "ترجمهٔ فارسی"),
  ("لئو تولستوی", "«ورونسکی در آن نگاه کوتاه", "لئو تولستوی", "آنا کارنینا", "آنا کارنینا", "۱۸۷۸ م", "ترجمهٔ فارسی"),
  ("لئو تولستوی", "«آدم‌ها، اول جوان‌ها را", "لئو تولستوی", "سونات کرویتزر", "سونات کرویتزر", "۱۸۸۹ م", "ترجمهٔ فارسی"),
  ("لئو تولستوی", "«یک گلولهٔ برف را", "لئو تولستوی", "جنگ و صلح", "جنگ و صلح", "۱۸۶۹ م", "ترجمهٔ فارسی"),
  ("گابریل گارسیا مارکز", "«آنچه در آن مکاتیب", "گابریل گارسیا مارکز", "صد سال تنهایی", "صد سال تنهایی", "۱۹۶۷ م", "ترجمهٔ فارسی"),
  ("گابریل گارسیا مارکز", "«زبان بلد بودن", "گابریل گارسیا مارکز", "عشق سال‌های وبا", "عشق سال‌های وبا", "۱۹۸۵ م", "ترجمهٔ فارسی"),
  ("گابریل گارسیا مارکز", "«نوچوانان نسل من", "گابریل گارسیا مارکز", "خاطرات روسپیان غمگین من", "خاطرات روسپیان غمگین من", "۲۰۰۴ م", "ترجمهٔ فارسی"),
  ("گابریل گارسیا مارکز", "«بعضی وقت‌ها بین کاغذهای قدیمی", "گابریل گارسیا مارکز", "زنده‌ام که روایت کنم", "زنده‌ام که روایت کنم", "۲۰۰۲ م", "ترجمهٔ فارسی"),
  ("گابریل گارسیا مارکز", "«زندگی آنچه زیسته‌ایم نیست", "گابریل گارسیا مارکز", "زنده‌ام که روایت کنم", "زنده‌ام که روایت کنم", "۲۰۰۲ م", "ترجمهٔ فارسی"),
  ("هاروکی موراکامی", "«این‌جا تک و تنها", "هاروکی موراکامی", "کتابخانهٔ عجیب", "کتابخانهٔ عجیب", "", "ترجمهٔ فارسی"),
  ("هاروکی موراکامی", "«۱۹۷۱، سال اسپاگتی بود", "هاروکی موراکامی", "سال اسپاگتی", "سال اسپاگتی", "", "ترجمهٔ فارسی"),
  ("هاروکی موراکامی", "«بگذار چیزی بهت بگویم، ماری", "هاروکی موراکامی", "بعد از تاریکی", "بعد از تاریکی", "۲۰۰۴ م", "ترجمهٔ فارسی"),
  ("هاروکی موراکامی", "«دانشگاه یه دغدغه", "هاروکی موراکامی", "دیروز", "زنان بدون مردان", "۲۰۱۴ م", "ترجمهٔ فارسی"),
  ("هاروکی موراکامی", "«مشکل این است که هرگز", "هاروکی موراکامی", "بعد از زلزله", "بعد از زلزله", "۲۰۰۰ م", "ترجمهٔ فارسی"),
  ("هاروکی موراکامی", "«مهم آن است که در قلبت", "هاروکی موراکامی", "دیدن دختر صددرصد دلخواه در صبح زیبای ماه آوریل", "", "۱۹۸۱ م", "ترجمهٔ فارسی"),
  ("هاروکی موراکامی", "«مهم نیست تا کجا فرار کنی", "هاروکی موراکامی", "کافکا در ساحل", "کافکا در ساحل", "۲۰۰۲ م", "ترجمهٔ فارسی"),
]
for page, start, a, t, w, y, tr in WQFA:
    r = wq_pick("fa.wikiquote.org", page, start)
    if not r: SKIPPED.append(("ویکی‌گفتاورد: " + page + " — " + start, "quote not found or longer than 80 words")); continue
    txt, sec, cite = r
    d = {"t": t, "a": a, "w": w or t, "y": y, "u": "https://fa.wikiquote.org/wiki/" + page.replace(" ", "_"),
         "x": 1, "c": 1, "via": "ویکی‌گفتاورد", "parts": [["p", txt]]}
    if tr: d["tr"] = tr
    d["_spec"] = {"k": "wq", "host": "fa.wikiquote.org", "title": page}
    fa.append(d)

# ---------- English: Wikiquote (copyrighted modern fiction; ≤80 words) ----------
WQEN = {  # page: [(index in the page's quote list, work, year, translator)]
  "Raymond Carver": [(i, "What We Talk About When We Talk About Love", "1981", None) for i in (0, 1, 2, 3, 6)],
  "Alice Munro": [(0, "Friend of My Youth", "1990", None), (8, "Too Much Happiness", "2009", None),
                  (10, "Too Much Happiness", "2009", None), (12, "Too Much Happiness", "2009", None), (16, "Dear Life", "2012", None)],
  "Julio Cortázar": [(9, "Cronopios and Famas", "1962", "English translation")],
  "Flannery O'Connor": [(2, "Greenleaf", "1965", None), (21, "A Good Man Is Hard to Find", "1955", None), (22, "A Good Man Is Hard to Find", "1955", None)],
  "Shirley Jackson": [(8, "The Lottery", "1948", None), (12, "The Lottery", "1948", None), (17, "The Haunting of Hill House", "1959", None)],
  "Haruki Murakami": [(14, "Barn Burning", "1983", "English translation"), (20, "Thailand (After the Quake)", "1999", "English translation"),
                      (24, "The Kidney-Shaped Stone That Moves Every Day", "2005", "tr. Jay Rubin"),
                      (32, "Hard-Boiled Wonderland and the End of the World", "1985", "tr. Alfred Birnbaum"),
                      (85, "With the Beatles (First Person Singular)", "2021", "English translation")],
  "Italo Calvino": [(21, "Invisible Cities", "1972", "tr. William Weaver"),
                    (13, "If on a Winter’s Night a Traveller", "1979", "tr. William Weaver")],
  "Jorge Luis Borges": [(22, "The Library of Babel", "1941", "tr. James E. Irby"), (26, "The Library of Babel", "1941", "English translation"),
                        (40, "The Aleph", "1945", "English translation"), (46, "The Immortal", "1949", "tr. Andrew Hurley"),
                        (53, "A Biography of Tadeo Isidoro Cruz", "1949", "tr. Andrew Hurley"), (72, "The Waiting", "1950", "tr. James E. Irby"),
                        (93, "Juan Muraña", "1970", "tr. Andrew Hurley"), (104, "The Other", "1975", "English translation"),
                        (216, "The Garden of Forking Paths", "1941", "English translation"),
                        (219, "The Garden of Forking Paths", "1941", "English translation"),
                        (236, "Funes the Memorious", "1944", "English translation")],
}
for page, picks in WQEN.items():
    Q = quotes("en.wikiquote.org", page)
    for i, w, y, tr in picks:
        txt = clean(Q[i][1]); txt = re.sub(r"^(Translation|Variant):\s*", "", txt)
        if len(txt.split()) > 80 or "[...]" in txt or "[…]" in txt:
            SKIPPED.append(("Wikiquote: %s #%d" % (page, i), "longer than 80 words or elided")); continue
        d = {"t": w, "a": page, "w": w, "y": y, "u": "https://en.wikiquote.org/wiki/" + page.replace(" ", "_"),
             "x": 1, "c": 1, "via": "Wikiquote", "parts": [["p", txt]]}
        if tr: d["tr"] = tr
        d["_spec"] = {"k": "wq", "host": "en.wikiquote.org", "title": page}
        en.append(d)

# ---------- English: Project Gutenberg books (public domain) ----------
def gbody(n):
    L = pg_text(n).replace("\r", "").split("\n")
    st = [i for i, l in enumerate(L) if l.startswith("*** START OF")][0]
    e = [i for i, l in enumerate(L) if l.startswith("*** END OF")][0]
    return L[st + 1:e]
def gsplit(L, minblank=2, maxw=10):
    heads = []
    for i, l in enumerate(L):
        s = l.strip()
        if not s or len(s.split()) > maxw or re.search(r'[.,;:!?"”’]$', s) and not re.match(r'^[IVXLC]+\.$', s): continue
        if i < minblank or any(L[i - k].strip() for k in range(1, minblank + 1)): continue
        if i + 1 < len(L) and L[i + 1].strip() and not (i + 2 < len(L) and not L[i + 2].strip()): continue
        heads.append(i)
    out = []
    for k, i in enumerate(heads):
        j = heads[k + 1] if k + 1 < len(heads) else len(L)
        out.append((L[i].strip(), paras(L[i + 1:j])))
    return out
ROMAN = re.compile(r"^(?:[IVXLC]+\.?|Chapter \d+|PART [IVX]+)$")
SMALL = {"de", "a", "an", "and", "the", "of", "in", "to", "with", "on", "at", "by", "for", "from", "or", "as", "that"}
def tcase(t):
    t = re.sub(r"\s{2,}\d+$", "", t)
    if re.match(r"^chapter \d+$", t): return "Chapter " + t.split()[1]
    if t != t.upper(): return t
    out = []
    for i, w in enumerate(t.split()):
        lw = w.lower()
        if i and lw in SMALL: out.append(lw); continue
        out.append("-".join(x[:1].upper() + x[1:] for x in lw.split("-")))
    return " ".join(out)
SLUR = re.compile(r"\b(nigger|niggers|negro|negroes|negress|darky|darkies|chinaman|kike|jew|jews|squaw|savages?|coolie|wop|dago|gipsy|half-breed)\b", re.I)
def gadd_en(n, a, w, y, tr, t, ps, title_ok=True, merged=False, rename=None):
    ps = [re.sub(r"_([^_]+)_", r"\1", p) for p in ps]
    ps = [p for p in ps if not p.startswith("[Illustration") and not p.startswith("[_")]
    while ps and (ROMAN.match(ps[0]) or ps[0].upper() == t.upper() or ps[0].upper() == ps[0] and len(ps[0].split()) <= 8 or
                  re.match(r"^\(.*\)$", ps[0])):
        ps = ps[1:]
    if not ps: return
    ps = fix_caps(ps)
    n_all = wcount(ps)
    if n_all < 20: return
    if n_all <= 100 and not merged:
        out, x = ps, 0
    else:
        out, k = cut(ps, limit=100, minw=25, fa=False, cont=60); x = 1
        if k < 20: return
    if SLUR.search(" ".join(out)): SKIPPED.append(("%s — %s" % (a, tcase(t)), "contains an ethnic slur")); return
    d = {"t": rename or tcase(t), "a": a, "w": w, "y": y, "u": "https://www.gutenberg.org/ebooks/%d" % n, "pg": n, "parts": [["p", p] for p in out]}
    if x: d["x"] = 1
    if tr: d["tr"] = tr
    d["_spec"] = {"k": "pg", "n": n}
    en.append(d)
def book(n, a, w, y, tr, first=None, last=None, titles=None, skip=(), minblank=2, occ=0, stop=None, cap=999, upper_only=False, rename=None):
    S = gsplit(gbody(n), minblank)
    if titles is not None:
        seen = {}
        for i, (t, ps) in enumerate(S):
            key = t.strip()
            if key in titles and key not in seen:
                c = sum(1 for tt, _ in S[:i] if tt == key)
                if c < occ: continue
                seen[key] = i
        missing = [t for t in titles if t not in seen]
        if missing: print("  missing in pg%d:" % n, missing)
        sel = sorted(seen.values())
    else:
        fi = [i for i, (t, _) in enumerate(S) if t == first][occ]
        li = [i for i, (t, _) in enumerate(S) if t == last and i >= fi][0] if last else len(S) - 1
        sel = list(range(fi, li + 1))
    got = 0
    for i in sel:
        t, ps = S[i]
        if t in skip or t == stop: 
            if t == stop: break
            continue
        if ROMAN.match(t) or t.startswith("[") or upper_only and t != t.upper(): continue
        merged = False
        if not ps and i + 1 < len(S) and ROMAN.match(S[i + 1][0]):
            ps = S[i + 1][1]; merged = True
        before = len(en)
        gadd_en(n, a, w, y, tr, t, ps, merged=merged, rename=rename)
        got += len(en) - before
        if got >= cap: break

book(5616, "Kahlil Gibran", "The Madman", "1918", None, "God", "And When my Joy was Born")
book(54580, "Kahlil Gibran", "The Forerunner", "1920", None, "GOD’S FOOL", "THE LAST WATCH", occ=0)
book(7838, "Lord Dunsany", "Fifty-One Tales", "1915", None, "THE ASSIGNATION", "THE TOMB OF PAN", upper_only=True,
     skip={"THE DEMAGOGUE AND THE DEMI-MONDE"})
book(8935, "Ivan Turgenev", "Poems in Prose", "1882", "tr. Constance Garnett", "A CONVERSATION", "THE RUSSIAN TONGUE",
     skip={"THE END"})
book(38025, "Leo Tolstoy", "Fables and Stories for Children", "1869–1872", "tr. Leo Wiener", "THE ANT AND THE DOVE",
     stop="A PRISONER OF THE CAUCASUS", skip={"THE GNAT AND THE LION"}, upper_only=True)
book(61085, "Ernest Hemingway", "in our time", "1924", None, "chapter 1", "chapter 18")
book(2814, "James Joyce", "Dubliners", "1914", None, "THE SISTERS", "THE DEAD")
book(1429, "Katherine Mansfield", "The Garden Party and Other Stories", "1922", None,
     titles=["At the Bay", "The Garden-Party", "Mr. and Mrs. Dove", "The Young Girl", "Life of Ma Parker", "Marriage à la Mode",
             "The Voyage", "Miss Brill", "Her First Ball", "The Singing Lesson", "The Stranger", "Bank Holiday", "An Ideal Family"])
book(1210, "Lafcadio Hearn", "Kwaidan", "1904", None,
     titles=["THE STORY OF MIMI-NASHI-HŌÏCHI", "OSHIDORI", "THE STORY OF O-TEI", "UBAZAKURA", "DIPLOMACY", "OF A MIRROR AND A BELL",
             "JIKININKI", "MUJINA", "ROKURO-KUBI", "A DEAD SECRET", "YUKI-ONNA", "THE STORY OF AOYAGI", "JIU-ROKU-ZAKURA",
             "THE DREAM OF AKINOSUKÉ", "RIKI-BAKA", "HI-MAWARI", "HŌRAI"])
book(78105, "Ryūnosuke Akutagawa", "Tales Grotesque and Curious", "1930", "tr. Glenn W. Shaw",
     titles=["TOBACCO AND THE DEVIL", "THE NOSE", "THE HANDKERCHIEF", "RASHŌMON", "LICE", "THE SPIDER’S THREAD", "THE WINE WORM",
             "THE BADGER", "THE BALL", "THE PIPE", "MŌRI SENSEI"])
book(1597, "Hans Christian Andersen", "Andersen’s Fairy Tales", "1835–1872", None,
     titles=["THE EMPEROR'S NEW CLOTHES", "THE SWINEHERD", "THE REAL PRINCESS", "THE FIR TREE", "THE LEAP-FROG", "THE ELDERBUSH",
             "THE BELL", "THE OLD HOUSE", "THE HAPPY FAMILY", "THE STORY OF A MOTHER", "THE FALSE COLLAR", "THE SHADOW",
             "THE LITTLE MATCH GIRL", "THE DREAM OF LITTLE TUK", "THE NAUGHTY BOY", "THE RED SHOES"])
book(2518, "Rabindranath Tagore", "The Hungry Stones and Other Stories", "1916", "tr. C. F. Andrews and others",
     titles=["THE HUNGRY STONES", "THE VICTORY", "ONCE THERE WAS A KING", "THE HOME-COMING", "MY LORD, THE BABY",
             "THE KINGDOM OF CARDS", "THE DEVOTEE", "VISION", "THE RENUNCIATION", "THE CABULIWALLAH"])
book(33525, "Rabindranath Tagore", "Stories from Tagore", "1918", None,
     titles=["SUBHA", "THE POSTMASTER", "THE CASTAWAY", "MASTER MASHAI", "THE SON OF RASHMANI"])
book(2591, "Brothers Grimm", "Grimms’ Fairy Tales", "1812–1857", "tr. Edgar Taylor and Marian Edwardes", "THE GOLDEN BIRD",
     upper_only=True, cap=40, skip={"THE ADVENTURES OF CHANTICLEER AND PARTLET"})
book(3090, "Guy de Maupassant", "Original Short Stories", "1880–1890", "tr. A. E. Henderson, Albert M. C. McMaster and others",
     titles=["BOULE DE SUIF", "TWO FRIENDS", "THE PRISONERS", "FATHER MILON", "A DUEL", "MOTHER SAUVAGE", "THE BLIND MAN",
             "THE DONKEY", "THE DIAMOND NECKLACE", "THE WOLF", "THE INN", "MISS HARRIET", "THE PATRON", "THE DOOR", "THE WRECK",
             "MADEMOISELLE FIFI", "TWO LITTLE SOLDIERS", "THE MORIBUND", "THE GAMEKEEPER", "A MEETING"])
book(13415, "Anton Chekhov", "The Lady with the Dog and Other Stories", "1899", "tr. Constance Garnett",
     titles=["A DOCTOR'S VISIT", "AN UPHEAVAL", "IONITCH", "THE HEAD OF THE FAMILY", "THE BLACK MONK", "VOLODYA", "AN ANONYMOUS STORY", "THE HUSBAND"], occ=0)
book(160, "Kate Chopin", "Short stories", "1891–1897", None,
     titles=["BEYOND THE BAYOU", "MA’AME PÉLAGIE", "DÉSIRÉE’S BABY", "A RESPECTABLE WOMAN", "THE KISS", "A PAIR OF SILK STOCKINGS", "THE LOCKET", "A REFLECTION"])
book(5200, "Franz Kafka", "Metamorphosis", "1915", "tr. David Wyllie", titles=["I"], rename="Metamorphosis")
book(1399, "Leo Tolstoy", "Anna Karenina", "1878", "tr. Constance Garnett", titles=["PART ONE"], rename="Anna Karenina (opening)")

# dedupe English by opening text
seen = set(); en2 = []
for s in en:
    k = norm(" ".join(x[1] for x in s["parts"]))[:40]
    if k in seen: continue
    seen.add(k); en2.append(s)
en = en2

def enforce(lang, arr):
    out = []
    for x in arr:
        lim = 80 if x.get("c") else 100
        if nwords(x["parts"]) <= lim: out.append(x); continue
        if not x.get("x") or any(p[0] != "p" for p in x["parts"]):
            SKIPPED.append(("%s — %s" % (x["a"], x["t"]), "over %d words" % lim)); continue
        ps = [re.sub(r"\s*…$", "", p[1]) for p in x["parts"]]
        for L in range(lim, 40, -3):
            o, k = cut(ps, limit=L, minw=25, fa=(lang == "fa"), cont=60)
            if nwords([["p", p] for p in o]) <= lim: break
        if nwords([["p", p] for p in o]) > lim or k < 15:
            SKIPPED.append(("%s — %s" % (x["a"], x["t"]), "could not fit in %d words" % lim)); continue
        x["parts"] = [["p", p] for p in o]; out.append(x)
    return out
fa = enforce("fa", fa); en = enforce("en", en)

def dump(name, var, lang, arr, note):
    for i, x in enumerate(arr):
        x["id"] = "%s%d" % (lang, i)
        spec = x.pop("_spec", None) or SPEC.get(x["u"]) or {"k": "gj"}
        SPECS[x["id"]] = spec
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write("// " + note + "\n// generated by tools/build_stories.py — verified by tools/verify_stories.py\n")
        f.write("window.%s = " % var + json.dumps(arr, ensure_ascii=False, separators=(",", ":")).replace("},{", "},\n{") + ";\n")
SPECS = {}
dump("stories-fa.js", "STORIES_FA", "fa", fa, "داستان‌ها و حکایت‌های فارسی (کامل یا گزیده)، عیناً از گنجور، ویکی‌نبشته و ویکی‌گفتاورد — منبع هر متن در tools/stories_sources.json")
dump("stories-en.js", "STORIES_EN", "en", en, "Stories and fables, complete or as marked excerpts, verbatim from Project Gutenberg / Wikisource / Wikiquote — sources in tools/stories_sources.json")
json.dump(SPECS, open(os.path.join(OUT, "tools", "stories_sources.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
json.dump(SKIPPED, open(os.path.join(SRC, "skipped.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
for lang, arr in (("fa", fa), ("en", en)):
    print(lang, len(arr), "| excerpts", sum(1 for s in arr if s.get("x")), "| ©", sum(1 for s in arr if s.get("c")))
    for a, c in Counter(s["a"] for s in arr).most_common(): print("   %4d  %s" % (c, a))
print("skipped", len(SKIPPED))
