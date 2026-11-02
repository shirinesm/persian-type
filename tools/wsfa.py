import re
from srclib import wiki_html, wiki_paras
from excerpt import cut
BAD = re.compile(r"نوشتهٔ صادق هدایت|از صادق هدایت|از صمد بهرنگی|ترجمهٔ|پروژه‌های خواهر|خورشیدی\)|ویکی|مجموعهٔ داستان|نوشته‌ی|ترجمه‌ی|^\d+")
def ws_excerpt(title, start=None, limit=100):
    ps = [re.sub(r"\s+", " ", p) for p in wiki_paras(wiki_html("fa.wikisource.org", title))]
    if start:
        k = next(i for i, p in enumerate(ps) if p.startswith(start))
    else:
        k = next(i for i, p in enumerate(ps) if len(p.split()) >= 15 and not BAD.search(p))
    return cut(ps[k:], limit=limit, minw=25, fa=True)
