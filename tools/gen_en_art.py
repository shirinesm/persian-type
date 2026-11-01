#!/usr/bin/env python3
"""Generates the English-mode scene artwork (original drawings, no copied images):
a flame-like cypress and village hills as a homage to Van Gogh's The Starry Night (public domain),
plus bold flowers and tropical leaves *inspired by* Mexican folk/Frida-Kahlo-era motifs (original designs).
Run: python3 tools/gen_en_art.py  -> assets/en/*.svg"""
import math, random, os
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "en")
f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")

def stroke_path(pts):
    d = f"M{f(pts[0][0])} {f(pts[0][1])}"
    for i in range(1, len(pts) - 1, 2):
        a, b = pts[i], pts[i + 1]
        d += f"Q{f(a[0])} {f(a[1])} {f(b[0])} {f(b[1])}"
    return d

# ---------------- cypress ----------------
def cypress():
    R = random.Random(7); W, H = 220, 640
    def cx(y): t = 1 - y / H; return 110 + 14 * math.sin(t * 9) * t
    def hw(y):
        t = 1 - y / H                      # 0 bottom .. 1 top
        base = 78 * (1 - t) ** .85 * min(1, (t + .06) * 4.2)
        return max(1.5, base * (1 + .16 * math.sin(t * 38)))   # flame tongues
    L, Rr = [], []
    for i in range(0, 161):
        y = H - i * H / 160
        L.append((cx(y) - hw(y) - (6 * math.sin(i * 1.7) if i % 4 == 0 else 0), y))
        Rr.append((cx(y) + hw(y) + (6 * math.sin(i * 2.3) if i % 5 == 0 else 0), y))
    sil = "M" + " L".join(f"{f(x)} {f(y)}" for x, y in L + Rr[::-1]) + "Z"
    pal = ["#0f2a1c", "#14331f", "#1b4428", "#245a30", "#3a7535", "#55843c", "#2a2414", "#48391c", "#0b1d2e"]
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax meet">',
         f'<defs><clipPath id="c"><path d="{sil}"/></clipPath></defs>',
         f'<path d="{sil}" fill="#0c2118"/><g clip-path="url(#c)" fill="none" stroke-linecap="round">']
    for _ in range(520):
        y = R.uniform(10, H); x = cx(y) + R.uniform(-1, 1) * hw(y)
        pts = [(x, y)]; ang = -math.pi / 2 + R.uniform(-.3, .3); curl = R.choice([-1, 1]) * R.uniform(.05, .16)
        for k in range(6):
            ang += curl; x += math.cos(ang) * 9; y += math.sin(ang) * 9; pts.append((x, y))
        c = R.choice(pal[:6] if R.random() < .8 else pal[6:])
        s.append(f'<path d="{stroke_path(pts)}" stroke="{c}" stroke-width="{f(R.uniform(3, 7))}" opacity="{f(R.uniform(.6, 1))}"/>')
    s.append('</g>')
    # bright outline strokes like the painting's contour lines
    for side in (L, Rr):
        for i in range(0, 150, 3):
            a, b = side[i], side[min(i + 4, 160)]
            s.append(f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}" stroke="#4f7a36" stroke-width="2.4" stroke-linecap="round" opacity=".55" fill="none"/>')
    s.append('</svg>'); return "".join(s)

# ---------------- village & hills ----------------
def village():
    R = random.Random(11); W, H = 1600, 420
    def hill(y0, amp, fr, ph): return [(x, y0 + amp * math.sin(x / W * fr * 6.283 + ph) + amp * .4 * math.sin(x / W * fr * 15 + ph * 2)) for x in range(0, W + 21, 20)]
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">']
    layers = [(140, 34, 1.1, .4, "#22336e", ["#2c418a", "#3a55a3", "#1b2a5e", "#5470b8"]),
              (230, 22, 1.7, 2.1, "#18265a", ["#22357a", "#2e4790", "#13204c", "#3c5aa0"]),
              (330, 14, 2.3, 4.0, "#0e1838", ["#16244e", "#1d2f62", "#0a1230", "#263c74"])]
    for li, (y0, amp, fr, ph, fill, pal) in enumerate(layers):
        pts = hill(y0, amp, fr, ph)
        d = "M0 " + f(H) + " L" + " L".join(f"{x} {f(y)}" for x, y in pts) + f" L{W} {H}Z"
        s.append(f'<path d="{d}" fill="{fill}"/>')
        for _ in range(260):
            x = R.uniform(0, W); yt = y0 + amp * math.sin(x / W * fr * 6.283 + ph)
            y = R.uniform(yt + 6, min(H, yt + 120)); sl = amp * fr * 6.283 / W * math.cos(x / W * fr * 6.283 + ph)
            ln = R.uniform(14, 34); dx = ln / math.sqrt(1 + sl * sl); dy = dx * sl
            s.append(f'<path d="M{f(x)} {f(y)}q{f(dx/2)} {f(dy/2 - 3)} {f(dx)} {f(dy)}" stroke="{R.choice(pal)}" stroke-width="{f(R.uniform(3, 6))}" stroke-linecap="round" fill="none" opacity=".8"/>')
        if li == 1:   # village sits on the middle hill
            for i in range(26):
                x = 260 + i * 44 + R.uniform(-10, 10)
                if 600 < x < 700: continue
                y = y0 + amp * math.sin(x / W * fr * 6.283 + ph) + 18 + R.uniform(0, 26)
                w, h = R.uniform(22, 36), R.uniform(16, 26)
                s.append(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="{R.choice(["#1d2a55", "#26345f", "#2a2f4f"])}"/>')
                s.append(f'<path d="M{f(x-3)} {f(y)}L{f(x+w/2)} {f(y-12)}L{f(x+w+3)} {f(y)}Z" fill="{R.choice(["#121a38", "#3a2d3c", "#1a2448"])}"/>')
                for _ in range(R.choice([1, 1, 2])):
                    s.append(f'<rect class="win" x="{f(x+R.uniform(4, w-10))}" y="{f(y+R.uniform(4, h-10))}" width="6" height="7" fill="#f4cc54" opacity=".95"/>')
            # church with a tall spire
            x, y = 640, y0 + amp * math.sin(640 / W * fr * 6.283 + ph) + 10
            s.append(f'<rect x="{x}" y="{f(y)}" width="44" height="40" fill="#1b2650"/><rect x="{x+12}" y="{f(y-44)}" width="18" height="46" fill="#202d5c"/>'
                     f'<path d="M{x+8} {f(y-44)}L{x+21} {f(y-150)}L{x+34} {f(y-44)}Z" fill="#141d42" stroke="#3c55a0" stroke-width="2"/>'
                     f'<rect x="{x+18}" y="{f(y+16)}" width="8" height="12" fill="#f4cc54"/>')
            for i in range(12):   # round olive-tree blobs between houses
                x = R.uniform(200, 1450); y = y0 + amp * math.sin(x / W * fr * 6.283 + ph) + R.uniform(10, 50)
                s.append(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(R.uniform(14, 24))}" ry="{f(R.uniform(10, 16))}" fill="#14301f" opacity=".95"/>')
    s.append('</svg>'); return "".join(s)

# ---------------- flowers & tropical leaves (original, inspired-by) ----------------
def petal_ring(cx, cy, n, r1, r2, w, col, rot, out, edge):
    for i in range(n):
        a = rot + i * 2 * math.pi / n
        x1, y1 = cx + r1 * math.cos(a), cy + r1 * math.sin(a)
        x2, y2 = cx + r2 * math.cos(a), cy + r2 * math.sin(a)
        nx, ny = -math.sin(a) * w, math.cos(a) * w
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        out.append(f'<path d="M{f(x1)} {f(y1)}Q{f(mx+nx)} {f(my+ny)} {f(x2)} {f(y2)}Q{f(mx-nx)} {f(my-ny)} {f(x1)} {f(y1)}Z" fill="{col}" stroke="{edge}" stroke-width="1.6"/>')

def dahlia(cx, cy, r, cols, out, R):
    rings = [(18, .35, 1.0, .2, cols[0]), (14, .25, .78, .19, cols[1]), (10, .15, .52, .17, cols[2])]
    for n, a, b, w, c in rings:
        petal_ring(cx, cy, n, r * a, r * b, r * w, c, R.uniform(0, 1), out, "rgba(40,0,20,.35)")
    out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r*.18)}" fill="{cols[3]}"/>')
    for i in range(10):
        a = i * .628; out.append(f'<circle cx="{f(cx+r*.1*math.cos(a))}" cy="{f(cy+r*.1*math.sin(a))}" r="{f(r*.03)}" fill="#3a1a08"/>')

def marigold(cx, cy, r, out, R):
    for k, c in enumerate(["#e86a12", "#f28c28", "#f7b538", "#ffd25a"]):
        rr = r * (1 - k * .22)
        for i in range(22):
            a = i * .2856 + k * .3; out.append(f'<circle cx="{f(cx+rr*.7*math.cos(a))}" cy="{f(cy+rr*.7*math.sin(a))}" r="{f(rr*.3)}" fill="{c}" stroke="#b5470c" stroke-width="1"/>')

def monstera(x, y, L, ang, out, R, col="#1f6b45"):
    ca, sa = math.cos(ang), math.sin(ang)
    P = lambda u, v: (x + u * ca - v * sa, y + u * sa + v * ca)
    pts = []
    for side in (1, -1):
        seg = []
        for i in range(0, 13):
            u = L * i / 12; wv = L * .42 * math.sin(math.pi * i / 12) ** .8
            if 2 <= i <= 10 and i % 2 == 0: wv *= .55        # the characteristic splits
            seg.append(P(u, side * wv))
        pts += seg if side == 1 else seg[::-1]
    out.append('<path d="M' + " L".join(f"{f(a)} {f(b)}" for a, b in pts) + f'Z" fill="{col}" stroke="#0e3b25" stroke-width="2" stroke-linejoin="round"/>')
    a, b = P(0, 0), P(L * .95, 0); out.append(f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}" stroke="#8fcf7a" stroke-width="3" opacity=".7"/>')
    for i in range(1, 6):
        for side in (1, -1):
            a, b = P(L * i / 6.5, 0), P(L * i / 6.5 + L * .12, side * L * .3)
            out.append(f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}" stroke="#5fae63" stroke-width="2" opacity=".6"/>')
    for i in (3, 5, 7):
        for side in (1, -1):
            c = P(L * i / 10, side * L * .2); out.append(f'<ellipse cx="{f(c[0])}" cy="{f(c[1])}" rx="{f(L*.035)}" ry="{f(L*.02)}" fill="#0b2a1a"/>')

def banana(x, y, L, ang, bend, out, col):
    pts = []; ctr = []
    for side in (1, -1):
        seg = []
        for i in range(0, 15):
            t = i / 14; u = L * t; v = bend * L * t * t
            w = L * .16 * math.sin(math.pi * t) ** .6 * side
            a = ang; seg.append((x + u * math.cos(a) - (v + w) * math.sin(a), y + u * math.sin(a) + (v + w) * math.cos(a)))
            if side == 1: ctr.append((x + u * math.cos(a) - v * math.sin(a), y + u * math.sin(a) + v * math.cos(a)))
        pts += seg if side == 1 else seg[::-1]
    out.append('<path d="M' + " L".join(f"{f(a)} {f(b)}" for a, b in pts) + f'Z" fill="{col}" stroke="#0d3a22" stroke-width="2"/>')
    out.append('<path d="M' + " L".join(f"{f(a)} {f(b)}" for a, b in ctr) + '" stroke="#b9e08a" stroke-width="2.5" fill="none" opacity=".6"/>')
    for i in range(2, 13):
        a = ctr[i]; out.append(f'<path d="M{f(a[0])} {f(a[1])}l{f(-L*.06*math.sin(ang)+L*.04*math.cos(ang))} {f(L*.06*math.cos(ang)+L*.04*math.sin(ang))}" stroke="#7cc06a" stroke-width="1.6" opacity=".5"/>')

def flowers():
    R = random.Random(23); W, H = 640, 560; o = []
    banana(560, 560, 520, -2.0, .12, o, "#236f42")
    banana(620, 560, 430, -2.35, -.1, o, "#1b5e38")
    monstera(640, 470, 300, -2.6, o, R, "#1f6b45")
    monstera(380, 560, 230, -1.75, o, R, "#2a7d4f")
    banana(250, 560, 300, -1.2, .2, o, "#2f8550")
    for (x, y, l, a) in [(300, 470, 120, -2.4), (470, 380, 130, -2.0), (520, 300, 110, -1.6)]:
        monstera(x, y, l, a, o, R, "#2e8a55")
    dahlia(420, 330, 92, ["#c1121f", "#e63946", "#ff6b6b", "#f7c548"], o, R)
    dahlia(250, 420, 70, ["#b5179e", "#d63aa4", "#f07ccb", "#ffd166"], o, R)
    marigold(560, 230, 46, o, R)
    marigold(150, 500, 38, o, R)
    dahlia(570, 420, 58, ["#e85d04", "#f48c06", "#ffba08", "#6a040f"], o, R)
    for _ in range(26):  # little magenta bougainvillea dots
        x, y = R.uniform(120, 620), R.uniform(250, 540)
        o.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(R.uniform(5, 9))}" fill="{R.choice(["#ff4d9d", "#e0218a", "#ffd23f"])}" stroke="#6b0f3a" stroke-width="1"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMaxYMax meet">' + "".join(o) + '</svg>'

for name, fn in [("cypress", cypress), ("village", village), ("flowers", flowers)]:
    p = os.path.join(OUT, name + ".svg"); open(p, "w").write(fn()); print(p, os.path.getsize(p))
