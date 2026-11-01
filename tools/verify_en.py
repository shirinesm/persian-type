# Verifies every English passage is an exact substring of its Project Gutenberg plain text.
# Usage: python3 tools/verify_en.py [cache_dir]   (downloads pg<ID>.txt if missing)
import re, sys, os, json, urllib.request
cache = sys.argv[1] if len(sys.argv) > 1 else "/tmp/gutenberg"
os.makedirs(cache, exist_ok=True)
src = open(os.path.join(os.path.dirname(__file__), "..", "texts-en.js"), encoding="utf-8").read()
items = re.findall(r'gid: (\d+), author: "([^"]+)", source: "([^"]+)", text: "([^"]+)"', src)
ok = 0
for gid, author, source, text in items:
    f = os.path.join(cache, gid + ".txt")
    if not os.path.exists(f):
        urllib.request.urlretrieve(f"https://www.gutenberg.org/cache/epub/{gid}/pg{gid}.txt", f)
    t = open(f, encoding="utf-8-sig").read()
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r" _\d+ ", " ", t)          # line-number markers in some poetry editions
    found = text in t
    ok += found
    print(("OK  " if found else "FAIL"), gid, author, "|", source, f"({len(text)} chars)")
print(f"{ok}/{len(items)} verified")
sys.exit(0 if ok == len(items) else 1)
