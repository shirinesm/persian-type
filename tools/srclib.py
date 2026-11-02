"""Shared source access + normalisation for build_stories.py / verify_stories.py.
Wiki pages are fetched with the MediaWiki parse API (cached as JSON in CACHE/wsc); Gutenberg texts as plain .txt."""
import os, re, json, html, time, unicodedata, urllib.request, urllib.parse
CACHE = os.environ.get("STORY_CACHE", "/tmp/fix")
UA = {"User-Agent": "persian-type-builder/1.0 (https://github.com/shirinesm/persian-type)"}

def http(u, tries=5):
    err = None
    for k in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read().decode("utf-8")
        except Exception as e:
            err = e; time.sleep(2 + 3 * k)
    raise err

def wiki_html(host, title, live=False):
    os.makedirs(os.path.join(CACHE, "wsc"), exist_ok=True)
    fn = os.path.join(CACHE, "wsc", urllib.parse.quote(host + "|" + title, safe="")[:200] + ".json")
    if os.path.exists(fn) and not live:
        return json.load(open(fn, encoding="utf-8"))["html"]
    q = urllib.parse.urlencode(dict(action="parse", page=title, prop="text|displaytitle", redirects=1, disableeditsection=1, format="json"))
    d = json.loads(http(f"https://{host}/w/api.php?{q}"))
    r = {"title": d["parse"]["title"], "html": d["parse"]["text"]["*"]}
    if not live: json.dump(r, open(fn, "w", encoding="utf-8"), ensure_ascii=False)
    return r["html"]

def wiki_paras(h):
    h = re.sub(r"(?s)<(style|script|table)[^>]*>.*?</\1>", "", h)
    h = re.sub(r'(?s)<div class="(?:ws-noexport|noprint|reference)[^"]*".*?</div>', "", h)
    h = re.sub(r"(?s)<sup[^>]*>.*?</sup>", "", h)
    h = re.sub(r'(?s)<span[^>]*class="[^"]*pagenum[^"]*"[^>]*>.*?</span>', "", h)
    h = re.sub(r"<br\s*/?>", "\n", h)
    h = re.sub(r"</(p|div|h\d|li|dd|dt|center)>", "\n\n", h)
    t = html.unescape(re.sub(r"<[^>]+>", "", h))
    return [re.sub(r"[ \t\u00a0]+", " ", p).strip() for p in re.split(r"\n\s*\n", t) if p.strip()]

def wiki_text(h):
    """whole page as text (tags removed without inserting spaces) — used for substring checks"""
    h = re.sub(r"(?s)<(style|script)[^>]*>.*?</\1>", "", h)
    h = re.sub(r"(?s)<sup[^>]*>.*?</sup>", "", h)
    h = re.sub(r"<br\s*/?>|</(p|div|h\d|li|dd|dt|center|td|tr)>", "\n", h)
    return html.unescape(re.sub(r"<[^>]+>", "", h))

def quotes(host, title):
    from bs4 import BeautifulSoup
    s = BeautifulSoup(wiki_html(host, title), "lxml"); out = []; sec = ""
    for el in s.find_all(["h2", "h3", "h4", "li"]):
        if el.name in ("h2", "h3", "h4"): sec = el.get_text("", strip=True); continue
        if el.find_parent("li") or el.find_parent(class_=re.compile("toc|navbox|reflist|references")): continue
        sub = el.find("ul"); cite = ""
        if sub: cite = " || ".join(x.get_text("").strip() for x in sub.find_all("li")); sub.extract()
        for sup in el.find_all("sup"): sup.extract()
        for br in el.find_all("br"): br.replace_with(" ")
        out.append((sec, re.sub(r"\s+", " ", el.get_text("")).strip(), re.sub(r"\s+", " ", cite)))
    return out

def pg_text(n, live=False):
    fn = os.path.join(CACHE, {21: "aesop.txt", 374: "bierce.txt"}.get(n, "pg%d.txt" % n))
    if os.path.exists(fn) and not live: return open(fn, encoding="utf-8").read()
    return http("https://www.gutenberg.org/cache/epub/%d/pg%d.txt" % (n, n))

BIDI = re.compile(r"[\u200e\u200f\u202a-\u202e\u2066-\u2069\u00ad]")
def norm(s, lower=True):
    s = unicodedata.normalize("NFKC", s)
    s = BIDI.sub("", s).replace("_", "")
    s = re.sub(r"\[\d+\]|\(\d\)", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s.lower() if lower else s
def core(p):
    """paragraph as it must appear in the source: drop the ellipsis we add at a cut and outer «» quotes"""
    p = norm(p)
    p = re.sub(r"^[«“\"]+|[»”\"]+$", "", p.strip())
    p = re.sub(r"\s*(…|\.\.\.)$", "", p).strip()   # NFKC turns … into ...
    p = re.sub(r"^(…|\.\.\.)\s*", "", p).strip()
    return p
def words(st): return sum(len(" ".join(x[1:]).split()) for x in st["parts"])
