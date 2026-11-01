#!/usr/bin/env python3
"""Generates the miniature-style SVG art in assets/ (all drawn procedurally / by hand for this project).
Style references: Persian miniature conventions (spongy curly rocks, chi-clouds, cypress, blossoming trees, Simurgh)."""
import math, random, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
GOLD = '#e9c46a'

def f(v): return f'{v:.1f}'

def scallop_path(pts, bulge=0.55, rnd=None, closed=True):
    """Lobed outline through pts: every segment bulges outward (to the left of travel direction)."""
    d = f'M{f(pts[0][0])} {f(pts[0][1])}'
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        mx, my = (x0+x1)/2, (y0+y1)/2
        dx, dy = x1-x0, y1-y0; L = math.hypot(dx, dy) or 1
        b = bulge * (0.7 + 0.6*rnd.random()) if rnd else bulge
        nx, ny = dy/L, -dx/L   # outward normal for clockwise-on-screen travel
        d += f' Q{f(mx+nx*L*b)} {f(my+ny*L*b)} {f(x1)} {f(y1)}'
    return d + (' Z' if closed else '')

def flank(x0, y0, x1, y1, n, rnd, wob):
    pts = []
    for i in range(n+1):
        t = i/n
        # concave/convex flank, with wobble
        x = x0 + (x1-x0)*t + (rnd.uniform(-wob, wob) if 0 < i < n else 0)
        y = y0 + (y1-y0)*(t**0.8) + (rnd.uniform(-wob, wob) if 0 < i < n else 0)
        pts.append((x, y))
    return pts

def rock(xl, xr, base, px, py, rnd, lobe=26):
    """Closed lobed rock: up the left flank, over a curled peak, down the right flank."""
    hl = math.hypot(px-xl, py-base); hr = math.hypot(xr-px, base-py)
    left = flank(xl, base, px-lobe*0.5, py+lobe*0.3, max(2, int(hl/lobe)), rnd, lobe*0.35)
    right = flank(px+lobe*0.5, py+lobe*0.3, xr, base, max(2, int(hr/lobe)), rnd, lobe*0.35)
    # the outline goes left-base -> peak -> right-base, i.e. clockwise on screen => outward normal is (dy,-dx)
    pts = left + [(px, py)] + right
    d = scallop_path(pts, 0.5, rnd, closed=False)
    d += f' L{f(xr)} {f(base+40)} L{f(xl)} {f(base+40)} Z'
    return d

def curl_tip(px, py, s, flip=1):
    """Small spiral 'curl' typical of miniature rock tops."""
    d = f'M{f(px)} {f(py)}'
    a0 = -math.pi/2
    pts = []
    for i in range(22):
        t = i/21
        a = a0 + flip*t*math.pi*1.7
        r = s*(1-t*0.75)
        pts.append((px + flip*s*0.9 - flip*math.cos(a)*r*-1 if False else px + math.cos(a)*r*flip + s*0.0, py + math.sin(a)*r + s))
    for x, y in pts: d += f' L{f(x)} {f(y)}'
    return d

def grad(id_, stops, x2='0', y2='1'):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops)
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'

ROCK_FILLS = [('rA', '#2c3f94', '#0b1236'), ('rB', '#215f78', '#0a1a2e'), ('rC', '#4b4596', '#10123a'), ('rD', '#1d4a8a', '#081028')]

def rock_group(rnd, xl, xr, base, px, py, fill, lobe, strata=2, stroke_op=.55):
    out = [f'<path d="{rock(xl, xr, base, px, py, rnd, lobe)}" fill="url(#{fill})" stroke="{GOLD}" stroke-opacity="{stroke_op}" stroke-width="1.2" stroke-linejoin="round"/>']
    # inner strata: nested smaller rocks (miniature 'sponge' layering)
    for k in range(strata):
        s = 0.62 - k*0.18
        cx = px + rnd.uniform(-0.15, 0.15)*(xr-xl)
        w = (xr-xl)*s/2
        top = py + (base-py)*(0.25+0.22*k)
        fl = rnd.choice(ROCK_FILLS)[0]
        out.append(f'<path d="{rock(cx-w, cx+w, base, cx+rnd.uniform(-w*.3, w*.3), top, rnd, lobe*0.8)}" fill="url(#{fl})" fill-opacity=".75" stroke="{GOLD}" stroke-opacity="{stroke_op*0.7}" stroke-width="1"/>')
    # miniature 'sponge' details: hollows (eyes) and a curling crest at the peak
    h = base - py
    for _ in range(2 if h > 150 else 1):
        ex = px + rnd.uniform(-.18, .18)*(xr-xl); ey = py + h*rnd.uniform(.28, .5); rx = lobe*rnd.uniform(.35, .6)
        out.append(f'<ellipse cx="{f(ex)}" cy="{f(ey)}" rx="{f(rx)}" ry="{f(rx*.7)}" fill="#070b1d" fill-opacity=".8" stroke="{GOLD}" stroke-opacity="{stroke_op}" stroke-width="1"/>')
    d = 1 if rnd.random() < .5 else -1
    sp = spiral(px + d*lobe*.25, py + lobe*.55, lobe*.5, 1.15, d, -math.pi/2)
    out.append('<path d="M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in sp) + f'" fill="none" stroke="{GOLD}" stroke-opacity="{min(1, stroke_op*1.3)}" stroke-width="1.4" stroke-linecap="round"/>')
    for _ in range(int(h/40)):
        hx = px + rnd.uniform(-.3, .3)*(xr-xl)*(0.4 + 0.6*rnd.random()); hy = py + h*rnd.uniform(.15, .9)
        out.append(f'<path d="M{f(hx)} {f(hy)} q{f(lobe*.3)} {f(-lobe*.3)} {f(lobe*.6)} 0" fill="none" stroke="{GOLD}" stroke-opacity="{stroke_op*.6}" stroke-width="1"/>')
    return out

def defs_rocks():
    return ''.join(grad(i, [(0, a, 1), (1, b, 1)]) for i, a, b in ROCK_FILLS)

# ---------------- far panorama ----------------
def far_mountains():
    rnd = random.Random(7)
    W, H = 1600, 520
    g = []
    peaks = [(-60, 380, 120, 250), (200, 560, 360, 150), (430, 820, 640, 230), (700, 1050, 880, 110), (980, 1330, 1150, 200), (1250, 1660, 1460, 140)]
    for xl, xr, px, py in peaks:
        g += rock_group(rnd, xl, xr, H, px, py, rnd.choice(ROCK_FILLS)[0], 24, strata=2, stroke_op=.45)
    # second, nearer row
    for xl, xr, px, py in [(-100, 300, 90, 360), (250, 700, 480, 330), (650, 1000, 820, 370), (950, 1400, 1180, 320), (1350, 1700, 1520, 350)]:
        g += rock_group(rnd, xl, xr, H, px, py, rnd.choice(ROCK_FILLS)[0], 22, strata=1, stroke_op=.5)
    # little gold grass tufts on the meadow line
    for i in range(40):
        x = rnd.uniform(0, W); y = H - rnd.uniform(4, 30)
        g.append(f'<path d="M{f(x)} {f(y)} q-3 -9 -7 -12 M{f(x)} {f(y)} q1 -11 0 -15 M{f(x)} {f(y)} q4 -8 8 -10" stroke="{GOLD}" stroke-opacity=".35" stroke-width="1" fill="none"/>')
    fade = grad('fade', [(0, '#05070f', 0), (1, '#05070f', .85)])
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice"><defs>{defs_rocks()}{fade}</defs>{"".join(g)}<rect x="0" y="{H*0.45}" width="{W}" height="{H*0.55}" fill="url(#fade)"/></svg>'

# ---------------- cypress & blossoming tree ----------------
def cypress(x, base, h, w, lean=0.0):
    tip = (x + lean*h, base - h)
    d = (f'M{f(x-w*0.18)} {f(base)} C{f(x-w*0.9)} {f(base-h*0.35)} {f(x-w*0.6+lean*h*0.6)} {f(base-h*0.75)} {f(tip[0])} {f(tip[1])} '
         f'C{f(x+w*0.6+lean*h*0.7)} {f(base-h*0.72)} {f(x+w*0.95)} {f(base-h*0.3)} {f(x+w*0.18)} {f(base)} Z')
    lines = ''
    n = int(h/18)
    for i in range(1, n):
        t = i/n; yy = base - h*t; ww = w*0.55*(1-t**1.4)
        cx = x + lean*h*t*t
        lines += f'<path d="M{f(cx-ww)} {f(yy+6)} Q{f(cx)} {f(yy-4)} {f(cx+ww)} {f(yy+6)}" fill="none" stroke="{GOLD}" stroke-opacity=".35" stroke-width="1"/>'
    return f'<path d="{d}" fill="url(#cyp)" stroke="{GOLD}" stroke-opacity=".7" stroke-width="1.2"/>{lines}<path d="M{f(x)} {f(base)} v14" stroke="#6b4a2a" stroke-width="5"/>'

def flower5(cx, cy, r, col, rot):
    pet = ''
    for k in range(5):
        a = rot + k*2*math.pi/5
        pet += f'<circle cx="{f(cx+math.cos(a)*r*0.9)}" cy="{f(cy+math.sin(a)*r*0.9)}" r="{f(r*0.62)}" fill="{col}"/>'
    return pet + f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r*0.42)}" fill="{GOLD}"/>'

def blossom_tree(x, base, h, rnd, flip=1):
    out = []; tips = []
    def branch(x0, y0, ang, length, width, depth):
        x1 = x0 + math.cos(ang)*length; y1 = y0 + math.sin(ang)*length
        cx = (x0+x1)/2 + math.cos(ang+math.pi/2)*length*0.25*rnd.choice([-1, 1]); cy = (y0+y1)/2 + math.sin(ang+math.pi/2)*length*0.25
        out.append(f'<path d="M{f(x0)} {f(y0)} Q{f(cx)} {f(cy)} {f(x1)} {f(y1)}" stroke="url(#bark)" stroke-width="{f(width)}" stroke-linecap="round" fill="none"/>')
        if depth == 0 or length < 14:
            tips.append((x1, y1)); return
        for da in (-0.55, 0.45) + ((0.05,) if depth > 2 else ()):
            branch(x1, y1, ang + da + rnd.uniform(-.2, .2), length*rnd.uniform(.62, .78), width*0.62, depth-1)
    branch(x, base, -math.pi/2 + flip*0.12, h*0.32, 9, 4)
    fl = []
    for tx, ty in tips:
        for _ in range(4):
            fx, fy = tx + rnd.uniform(-16, 16), ty + rnd.uniform(-14, 12)
            fl.append(flower5(fx, fy, rnd.uniform(2.6, 4.2), rnd.choice(['#f6c9d4', '#f2a7b8', '#fbeff2', '#f6c9d4']), rnd.uniform(0, 6)))
    return ''.join(out) + ''.join(fl)

def defs_plants():
    return (grad('cyp', [(0, '#1f7a6e', 1), (1, '#0b2f33', 1)]) + grad('bark', [(0, '#8a6038', 1), (1, '#4a2f1a', 1)]))

def near_rocks(side):
    """Corner composition: rocks + cypress + blossoming tree. side='r' for the right corner, mirrored for 'l'."""
    rnd = random.Random(11 if side == 'r' else 23)
    W, H = 640, 520
    g = []
    # trees behind rocks
    if side == 'r':
        g.append(cypress(470, 330, 230, 34, -0.05)); g.append(cypress(540, 360, 170, 26, 0.04))
        g.append(blossom_tree(330, 380, 300, rnd, flip=-1))
    else:
        g.append(cypress(150, 330, 250, 36, 0.06))
        g.append(blossom_tree(300, 390, 280, rnd, flip=1))
    g += rock_group(rnd, 260, 700, H, 520, 300, 'rA', 30, strata=2, stroke_op=.7)
    g += rock_group(rnd, -40, 420, H, 120, 330, 'rB', 28, strata=2, stroke_op=.7)
    g += rock_group(rnd, 120, 560, H, 360, 400, 'rC', 26, strata=1, stroke_op=.7)
    # flowers at the foot
    for i in range(26):
        x = rnd.uniform(20, W-20); y = H - rnd.uniform(6, 60)
        g.append(f'<path d="M{f(x)} {f(y+14)} q{f(rnd.uniform(-6, 6))} -8 0 -14" stroke="#3aa58f" stroke-width="1.4" fill="none"/>')
        g.append(flower5(x, y, rnd.uniform(3, 5), rnd.choice(['#f6c9d4', '#e9c46a', '#fbeff2', '#e86f6f', '#7fd6cf']), rnd.uniform(0, 6)))
    body = ''.join(g)
    if side == 'l': body = f'<g transform="translate({W} 0) scale(-1 1)">{body}</g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><defs>{defs_rocks()}{defs_plants()}</defs>{body}</svg>'

# ---------------- chi cloud ----------------
def spiral(cx, cy, r0, turns, direction, start):
    pts = []
    n = 40
    for i in range(n+1):
        t = i/n
        a = start + direction*t*turns*2*math.pi
        r = r0*(1 - 0.85*t)
        pts.append((cx + math.cos(a)*r, cy + math.sin(a)*r))
    return pts

def chi_cloud(seed, w=420):
    rnd = random.Random(seed)
    h = 120
    # ribbon centerline: left spiral (outer→in reversed), wavy body, right spiral
    ls = spiral(40, 60, 26, 1.1, 1, math.pi/2)[::-1]
    body = []
    for i in range(1, 12):
        t = i/12
        body.append((66 + (w-132)*t, 86 - math.sin(t*math.pi*3)*14 - 6*math.sin(t*math.pi)))
    rs = spiral(w-40, 60, 26, 1.1, -1, math.pi/2)
    pts = ls + body + rs
    d = f'M{f(pts[0][0])} {f(pts[0][1])}' + ''.join(f' L{f(x)} {f(y)}' for x, y in pts[1:])
    # upper lobes of the cloud
    lobes = ''
    xs = [w*0.28, w*0.42, w*0.56, w*0.70]
    for i, x in enumerate(xs):
        r = rnd.uniform(18, 28)
        lobes += f'<path d="M{f(x-r)} {f(72)} a{f(r)} {f(r)} 0 0 1 {f(2*r)} 0" />'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><defs>{grad("cg", [(0, "#fbe7ab", 1), (.5, "#e9c46a", 1), (1, "#b8862b", 1)], "1", "0")}</defs>'
            f'<g fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="{d}" stroke="url(#cg)" stroke-width="11"/><path d="{d}" stroke="#0a1030" stroke-width="3.2" stroke-opacity=".75"/>'
            f'<g stroke="url(#cg)" stroke-width="7">{lobes}</g><g stroke="#0a1030" stroke-width="2" stroke-opacity=".7">{lobes}</g></g></svg>')

if __name__ == '__main__':
    files = {
        'mountains-far.svg': far_mountains(),
        'rocks-right.svg': near_rocks('r'),
        'rocks-left.svg': near_rocks('l'),
        'cloud-1.svg': chi_cloud(1, 420),
        'cloud-2.svg': chi_cloud(2, 320),
    }
    for n, s in files.items():
        open(os.path.join(OUT, n), 'w').write(s)
        print(n, len(s))

# ---------------- Simurgh ----------------
def bez(p0, p1, p2, p3, t):
    u = 1-t
    return tuple(u**3*a + 3*u*u*t*b + 3*u*t*t*c + t**3*d for a, b, c, d in zip(p0, p1, p2, p3))

def ribbon(p0, p1, p2, p3, w0, w1=0.0, n=40):
    """Tapered filled ribbon along a cubic bezier."""
    pts = [bez(p0, p1, p2, p3, i/n) for i in range(n+1)]
    L, R = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[max(0, i-1)]; b = pts[min(n, i+1)]
        dx, dy = b[0]-a[0], b[1]-a[1]; l = math.hypot(dx, dy) or 1
        w = (w0 + (w1-w0)*(i/n))/2
        L.append((x - dy/l*w, y + dx/l*w)); R.append((x + dy/l*w, y - dx/l*w))
    poly = L + R[::-1]
    return 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in poly) + ' Z'

def leaf(root, tip, w):
    (x0, y0), (x1, y1) = root, tip
    dx, dy = x1-x0, y1-y0; l = math.hypot(dx, dy); nx, ny = -dy/l*w, dx/l*w
    mx, my = x0+dx*0.45, y0+dy*0.45
    return f'M{f(x0)} {f(y0)} Q{f(mx+nx)} {f(my+ny)} {f(x1)} {f(y1)} Q{f(mx-nx)} {f(my-ny)} {f(x0)} {f(y0)} Z'

def simurgh():
    W, H = 560, 280
    g = []
    defs = (grad('sg', [(0, '#fbe7ab', 1), (1, '#c99a3b', 1)]) + grad('st', [(0, '#7fe0d6', 1), (1, '#1f7a8c', 1)])
            + grad('sl', [(0, '#3a56b8', 1), (1, '#16245c', 1)]) + grad('sr', [(0, '#f08a6c', 1), (1, '#b8321f', 1)]))
    # tail plumes (drawn first, behind)
    plumes = [((236, 132), (300, 150), (360, 60), (520, 70), 26, 'sg'), ((238, 136), (320, 170), (400, 120), (540, 140), 22, 'st'),
              ((236, 140), (300, 190), (360, 200), (500, 210), 20, 'sl'), ((232, 138), (280, 120), (330, 30), (450, 30), 16, 'sr'),
              ((234, 142), (290, 210), (380, 250), (440, 262), 14, 'st')]
    for p0, p1, p2, p3, w, col in plumes:
        g.append(f'<path d="{ribbon(p0, p1, p2, p3, w, 3)}" fill="url(#{col})" stroke="{GOLD}" stroke-width=".8"/>')
        cx, cy = p3
        sp = spiral(cx-6, cy, 9, 1.0, 1, 0)
        g.append('<path d="M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in sp) + f'" fill="none" stroke="{GOLD}" stroke-width="2.4" stroke-linecap="round"/>')
        # peacock 'eye' on each plume
        e = bez(p0, p1, p2, p3, 0.72)
        g.append(f'<ellipse cx="{f(e[0])}" cy="{f(e[1])}" rx="6" ry="4" fill="#0a1030" stroke="{GOLD}" stroke-width="1.2"/><circle cx="{f(e[0])}" cy="{f(e[1])}" r="1.8" fill="#7fe0d6"/>')
    # far wing (behind body)
    for i in range(6):
        t = i/5
        root = (150+t*40, 112); tip = (150 + 40*t - 30 + 20*t, 18 + 30*t*t)
        g.append(f'<path d="{leaf(root, tip, 9)}" fill="url(#sl)" stroke="{GOLD}" stroke-opacity=".8" stroke-width=".9"/>')
    # body
    g.append(f'<path d="M98 118 C120 98 176 96 222 112 C246 120 252 132 244 140 C220 150 156 150 120 141 C104 137 94 128 98 118 Z" fill="url(#sg)" stroke="#8a5a1c" stroke-width="1"/>')
    for i in range(7):  # scale pattern
        x = 130 + i*15
        g.append(f'<path d="M{x} 124 q6 8 12 0" fill="none" stroke="#8a5a1c" stroke-opacity=".6" stroke-width="1"/>')
    # neck & head
    g.append(f'<path d="{ribbon((110, 124), (96, 110), (82, 98), (64, 95), 22, 12)}" fill="url(#sg)" stroke="#8a5a1c" stroke-width="1"/>')
    g.append(f'<circle cx="62" cy="93" r="11" fill="url(#sg)" stroke="#8a5a1c" stroke-width="1"/>')
    g.append('<path d="M53 90 L34 97 Q40 103 53 99 Z" fill="#c99a3b" stroke="#8a5a1c" stroke-width="1"/>')
    g.append('<circle cx="59" cy="91" r="2.4" fill="#0a1030"/><circle cx="58.4" cy="90.4" r=".8" fill="#fff"/>')
    g.append(f'<path d="M60 104 q-4 10 4 16 q4 -8 -1 -16" fill="url(#sr)"/>')  # wattle
    for (a, b, c) in [((64, 84), (62, 60), (84, 50)), ((68, 85), (74, 66), (98, 64)), ((60, 84), (48, 66), (60, 54))]:
        g.append(f'<path d="M{a[0]} {a[1]} Q{b[0]} {b[1]} {c[0]} {c[1]}" fill="none" stroke="url(#st)" stroke-width="3" stroke-linecap="round"/>')
        g.append(f'<circle cx="{c[0]}" cy="{c[1]}" r="3.2" fill="{GOLD}"/>')
    # near wing: coverts + long flight feathers fanning up and back
    for i in range(9):
        t = i/8
        root = (130+t*80, 116 - t*4)
        ang = math.radians(-115 + t*75)
        L = 150 - t*40
        tip = (root[0] + math.cos(ang)*L*0.35 + 60*t + 40, root[1] + math.sin(ang)*L)
        col = ['st', 'sg', 'sl'][i % 3]
        g.append(f'<path d="{leaf(root, tip, 11)}" fill="url(#{col})" stroke="{GOLD}" stroke-width="1"/>')
    g.append(f'<path d="M128 118 C140 92 196 86 222 104 C206 114 160 122 128 118 Z" fill="url(#sl)" stroke="{GOLD}" stroke-width="1"/>')
    for i in range(6):
        x = 142 + i*13
        g.append(f'<path d="M{x} 112 q6 -10 12 0" fill="url(#sg)" stroke="#8a5a1c" stroke-width=".8"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -70 {W} {H+70}"><defs>{defs}</defs>{"".join(g)}</svg>'

# ---------------- Rostam on Rakhsh ----------------
def rider():
    W, H = 260, 200
    defs = (grad('hz', [(0, '#d07a52', 1), (1, '#8e3a22', 1)]) + grad('rg', [(0, '#fbe7ab', 1), (1, '#c99a3b', 1)])
            + grad('rb', [(0, '#3a56b8', 1), (1, '#16245c', 1)]) + grad('rt', [(0, '#7fe0d6', 1), (1, '#1f7a8c', 1)]))
    s = f'stroke="{GOLD}" stroke-width="1.1" stroke-linejoin="round"'
    tail = f'<path d="M180 84 C196 74 206 70 214 78 C222 88 236 92 250 84 C240 100 222 100 210 92 C200 86 192 90 182 94 Z" fill="#5a2414" {s}/>'
    # far legs (darker)
    far = (f'<path d="M168 104 C176 118 186 128 200 134 L198 140 C182 136 168 126 158 112 Z" fill="#6e2c18" {s}/>'
           f'<path d="M84 108 C74 120 60 128 44 132 L42 126 C56 120 66 112 72 104 Z" fill="#6e2c18" {s}/>')
    body = (f'<path d="M62 94 C58 80 54 66 50 54 L36 66 C28 72 20 70 22 62 C26 50 34 40 44 34 L46 24 L52 32 '
            f'C64 40 76 54 88 66 C104 70 132 70 152 68 C168 66 180 74 182 88 C186 98 192 106 206 114 L216 128 L210 132 '
            f'L198 120 C186 114 174 108 166 104 C158 108 146 112 136 112 C118 114 100 114 90 110 '
            f'C82 116 70 120 54 120 L36 128 L32 122 L50 112 C58 108 64 102 62 94 Z" fill="url(#hz)" {s}/>')
    # dapples (Rakhsh is 'rose-coloured', spotted)
    dots = ''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#f3c2a2" fill-opacity=".55"/>' for x, y in [(110, 82), (124, 90), (138, 80), (150, 92), (98, 94), (164, 84), (132, 100), (116, 102)])
    mane = f'<path d="M50 36 C62 40 74 52 86 64 L80 66 C70 56 60 48 48 44 Z" fill="#3a160c" {s}/>'
    saddle = (f'<path d="M100 70 C112 64 132 64 142 70 L146 96 C128 102 110 102 96 96 Z" fill="url(#rt)" {s}/>'
              f'<path d="M100 84 C116 90 132 90 146 84" fill="none" stroke="{GOLD}" stroke-width="1.5"/>')
    bridle = f'<path d="M30 62 L48 52 L58 66 M48 52 L104 70" fill="none" stroke="{GOLD}" stroke-width="1.2"/>'
    # rider: leg, torso, head, helmet with plume, raised ox-head mace, flowing sash
    rid = (f'<path d="M108 66 C104 78 104 90 110 100 L120 102 L116 96 C112 88 114 78 118 70 Z" fill="url(#rb)" {s}/>'
           f'<path d="M150 42 C170 36 186 46 204 40 C192 52 172 52 156 50 Z" fill="#b8321f" {s}/>'
           f'<path d="M104 70 C102 56 104 42 112 34 L128 34 C134 44 134 58 130 70 Z" fill="url(#rb)" {s}/>'
           f'<path d="M106 50 L130 50" stroke="{GOLD}" stroke-width="2.5"/>'
           f'<path d="M110 36 C100 30 94 24 88 14 L94 10 C100 20 106 26 116 30 Z" fill="url(#rb)" {s}/>'
           f'<path d="M90 12 L74 -6" stroke="#8a5a1c" stroke-width="3" stroke-linecap="round"/>'
           f'<circle cx="72" cy="-8" r="7" fill="url(#rg)" {s}/><path d="M66 -12 q-4 -6 -8 -4 M78 -12 q4 -6 8 -4" fill="none" stroke="{GOLD}" stroke-width="2"/>'
           f'<circle cx="120" cy="26" r="8" fill="#e7b48c" {s}/>'
           f'<path d="M111 25 C111 12 129 12 129 25 Z" fill="url(#rg)" {s}/><path d="M120 13 L120 4" stroke="{GOLD}" stroke-width="2"/>'
           f'<path d="M120 5 C130 -2 140 0 148 8 C138 6 128 8 120 8 Z" fill="#fbeff2"/>'
           f'<path d="M113 28 q2 6 -2 10 q6 -1 7 -6" fill="#3a160c"/>')
    body_all = tail + far + body + dots + mane + saddle + bridle + rid
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -20 {W} {H+20}"><defs>{defs}</defs>{body_all}</svg>'

if __name__ == '__main__':
    open(os.path.join(OUT, 'simurgh.svg'), 'w').write(simurgh())
    open(os.path.join(OUT, 'rider.svg'), 'w').write(rider())
    print('simurgh+rider')
