import re
from srclib import wiki_html, wiki_paras
STOP = re.compile(r"^(و )?چون (شب|قصه)|شهرزاد لب از داستان")
CONJ = re.compile(r"\s(?=(?:چون|پس|آنگاه|ناگاه|روزی|و چون)\s)")
def hezar(title):
    ps = wiki_paras(wiki_html("fa.wikisource.org", "هزار و یکشب/" + title))
    i = next((k for k, p in enumerate(ps) if re.match(r"^\d+هزار و یکشب —", p)), None)
    if i is None: return None
    j = i + 1
    if j < len(ps) and re.match(r"^\(?\s*حکایت", ps[j]) and len(ps[j].split()) < 15: j += 1
    body = []
    for p in ps[j:]:
        if re.match(r"^(و )?چون (شب|قصه)", p) or (body and len(p.split()) < 12): break
        p = re.split(r"\s(?:و )?(?:چون )?(?:بامداد|سپیده|صبح)\S* (?:شد|بدمید|دمید|برآمد|بر آمد)[^\n]{0,30}شهرزاد|\sشهرزاد لب", p)[0]
        body.append(re.sub(r"\s+", " ", p))
    txt = " ".join(body); w = txt.split()
    if len(w) < 30: return None
    head = " ".join(w[:95])
    best = None
    for m in CONJ.finditer(head):
        if 55 <= len(head[:m.start()].split()) <= 95: best = m.start()
    if best is None: best = len(" ".join(w[:90]))
    return [head[:best].rstrip() + " …"]
