import re
SENT_EN = re.compile(r"(?<=[.!?”\"’;])\s+(?=[A-Z“\"‘(—])")
SENT_FA = re.compile(r"(?<=[.!؟?:;؛»])\s+")
def sents(p, fa):
    return [s for s in (SENT_FA if fa else SENT_EN).split(p) if s]
def cut(ps, limit=100, minw=25, fa=False, cont=30):
    """Opening excerpt: whole sentences, ≤limit words; if shorter than minw, finish with a partial sentence + …"""
    out, n = [], 0
    for p in ps:
        ss = sents(p, fa); keep = []
        for s in ss:
            w = len(s.split())
            if n + w > limit: break
            keep.append(s); n += w
        if keep: out.append(" ".join(keep))
        if len(keep) < len(ss):
            if n < minw:  # partial sentence
                rest = ss[len(keep)].split()[: limit - n]
                txt = " ".join(rest)
                m = max(txt.rfind("،"), txt.rfind(","), txt.rfind("؛"))
                if m > len(txt) * .5: txt = txt[:m]
                txt = txt.rstrip("،,;؛: ") + " …"
                if keep: out[-1] += " " + txt
                else: out.append(txt)
                n += len(txt.split()) - 1
            break
        if n >= cont: break
    return out, n
