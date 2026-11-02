#!/usr/bin/env python3
"""Re-fetch every story's source and check it word for word.
fa: ganjoor API — the item's parts must equal the poem's verses exactly (prose / couplets, in order).
en: Gutenberg / Wikisource plain text — every paragraph must occur verbatim in the source
    (whitespace collapsed; italics markers '_' removed; the small-caps opening words compared case-insensitively)."""
import json, re, os, sys, urllib.request, urllib.parse, time
HERE = os.path.join(os.path.dirname(__file__), "..")
def load(fn):
    s = open(os.path.join(HERE, fn), encoding="utf-8").read(); return json.loads(s[s.index("=") + 1:].strip().rstrip(";"))
def get(u):
    for k in range(4):
        try:
            return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "persian-type-verify"}), timeout=60).read().decode("utf-8")
        except Exception as e:
            err = e; time.sleep(2 + k * 3)
    raise err
bad = 0
for s in load("stories-fa.js"):
    path = s["u"].replace("https://ganjoor.net", "")
    j = json.loads(get("https://api.ganjoor.net/api/ganjoor/page?url=" + urllib.parse.quote(path)))
    parts, cur = [], None
    for v in j["poem"]["verses"]:
        t, pos = v["text"].strip(), v["versePosition"]
        if pos == -1: parts.append(["p", t]); cur = None
        elif pos == 0: cur = ["b", t]; parts.append(cur)
        elif pos == 1 and cur and len(cur) == 2: cur.append(t); cur = None
        else: parts.append(["b", t])
    if parts != s["parts"]: bad += 1; print("FA MISMATCH", path)
print("fa checked", len(load("stories-fa.js")))
cache = {}
def norm(x): return re.sub(r"\s+", " ", x.replace("_", "")).strip()
for s in load("stories-en.js"):
    u = s["u"]
    if u not in cache:
        raw = get("https://www.gutenberg.org/cache/epub/%d/pg%d.txt" % (s["pg"], s["pg"])) if s.get("pg") else \
              get("https://en.wikisource.org/w/index.php?action=raw&title=" + u.rsplit("/", 1)[1])
        cache[u] = norm(raw); cache[u + "#l"] = cache[u].lower()
    for i, (_, p) in enumerate(s["parts"]):
        p = norm(p)
        ok = p in cache[u] or (i == 0 and p.lower() in cache[u + "#l"])
        if not ok: bad += 1; print("EN MISMATCH", s["t"], "|", p[:80])
    if sum(len(" ".join(x[1:]).split()) for x in s["parts"]) > 100: bad += 1; print("TOO LONG", s["t"])
print("en checked", len(load("stories-en.js")))
for s in load("stories-fa.js"):
    if sum(len(" ".join(x[1:]).split()) for x in s["parts"]) > 100: bad += 1; print("TOO LONG", s["u"])
print("FAILURES:", bad); sys.exit(1 if bad else 0)
