#!/usr/bin/env python3
"""Re-fetch every story's source (live) and check it word for word.
Sources are listed per story id in tools/stories_sources.json:
  gj — ganjoor API: a complete item's parts must equal the poem's verses exactly; an excerpt's paragraphs must occur in it
  ws — Wikisource page (MediaWiki parse API): every paragraph must occur in the page text
  wq — Wikiquote page: the quoted passage must occur in the page text
  pg — Project Gutenberg plain text: every paragraph must occur in the book
Comparison: NFKC, bidi marks / italics '_' / footnote marks removed, whitespace collapsed, case-insensitive;
the '…' added at a cut and outer quotation marks are ignored.
Limits: ≤100 words, ≤80 for copyrighted (c:1) items, which must be marked excerpts with a citation link.
Usage: verify_stories.py [--cached]"""
import json, os, sys, re, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from srclib import http, wiki_html, wiki_text, pg_text, norm, core, words
LIVE = "--cached" not in sys.argv
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SPECS = json.load(open(os.path.join(HERE, "tools", "stories_sources.json"), encoding="utf-8"))
def load(fn):
    s = open(os.path.join(HERE, fn), encoding="utf-8").read(); return json.loads(s[s.index("= ") + 2:s.rindex(";")])
memo = {}
def src(key, f):
    if key not in memo: memo[key] = f()
    return memo[key]
def gj_parts(u):
    j = json.loads(http("https://api.ganjoor.net/api/ganjoor/page?url=" + urllib.parse.quote(u.replace("https://ganjoor.net", ""))))
    parts, cur = [], None
    for v in j["poem"]["verses"]:
        t, pos = v["text"].strip(), v["versePosition"]
        if pos == -1: parts.append(["p", t]); cur = None
        elif pos == 0: cur = ["b", t]; parts.append(cur)
        elif pos == 1 and cur and len(cur) == 2: cur.append(t); cur = None
        else: parts.append(["b", t])
    return parts
bad = []; n = 0
for fn in ("stories-fa.js", "stories-en.js"):
    for s in load(fn):
        n += 1; sp = SPECS.get(s["id"]); lab = "%s %s — %s" % (s["id"], s["a"], s["t"])
        try:
            if not sp: bad.append((lab, "no source spec")); continue
            k = sp["k"]
            if k == "gj":
                P = src(s["u"], lambda: gj_parts(s["u"]))
                if not s.get("x"):
                    if [[x[0]] + [norm(y, False) for y in x[1:]] for x in P] != [[x[0]] + [norm(y, False) for y in x[1:]] for x in s["parts"]]:
                        bad.append((lab, "differs from ganjoor")); continue
                    hay = None
                else: hay = norm(" ".join(" ".join(x[1:]) for x in P))
            elif k in ("ws", "wq"):
                hay = src((sp["host"], sp["title"]), lambda: norm(wiki_text(wiki_html(sp["host"], sp["title"], live=LIVE))))
            elif k == "pg":
                hay = src(("pg", sp["n"]), lambda: norm(pg_text(sp["n"], live=LIVE)))
            else: bad.append((lab, "unknown kind")); continue
            if hay is not None:
                for p in s["parts"]:
                    for seg in p[1:]:
                        c = core(seg)
                        if c and c not in hay: bad.append((lab, "not in source: " + c[:70])); break
            lim = 80 if s.get("c") else 100
            if words(s) > lim: bad.append((lab, "%d words > %d" % (words(s), lim)))
            if s.get("c") and not (s.get("x") and s.get("u")): bad.append((lab, "© item not marked as cited excerpt"))
        except Exception as e:
            bad.append((lab, "fetch error: %r" % e))
for b in bad: print("FAIL", *b, sep=" | ")
print("checked", n, "| sources fetched", len(memo), "| live" if LIVE else "| cached")
print("FAILURES:", len(bad)); sys.exit(1 if bad else 0)
