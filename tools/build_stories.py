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
# keep the selection secular in tone (the owner asked for no explicitly Islamic-era religious motifs)
RELIG = re.compile(r"کعبه|نماز|اسلام|کافر|قرآن|مسلمان|مکه|(?<![\w])حج(?![\w])|حاجی|خلیفه|مأمون|هارون|روزه|مسجد|امام|منبر|صحاب|پیغمبر|رسول|حدیث|مؤذن")
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
    if any(RELIG.search(t) for _, _, t in x["verses"]): continue
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
for i, s in enumerate(en): s["id"] = "en%d" % i

def dump(name, var, data, note):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write("// " + note + "\n// generated by tools/build_stories.py — verified by tools/verify_stories.py\n")
        f.write("window.%s = " % var + json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("},{", "},\n{") + ";\n")
dump("stories-fa.js", "STORIES_FA", fa, "حکایت‌های کامل گلستان سعدی و بهارستان جامی، عیناً از گنجور (ganjoor.net)")
dump("stories-en.js", "STORIES_EN", en, "Public-domain fables (Aesop tr. Townsend; Bierce) and marked opening excerpts, verbatim from Project Gutenberg / Wikisource")
print("fa", len(fa), "en", len(en), "(excerpts %d)" % len(exc))
from collections import Counter
print(Counter(s["w"] for s in fa), Counter(s["a"] for s in en))
print("max words fa", max(sum(len(" ".join(p[1:]).split()) for p in s["parts"]) for s in fa),
      "en", max(sum(len(" ".join(p[1:]).split()) for p in s["parts"]) for s in en))
