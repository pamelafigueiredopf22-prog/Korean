"""Plan short-02 v2 (3D): a heavy chrome ball rolls TOWARD the camera through a row of objects.
Simulates the ball, decides every break/pop time and pre-generates every flying piece.
Writes events.json, which BOTH short.html (three.js) and sound.py read, so every sound lands on its frame.
World: metres-ish units, table at y=0, the ball rolls along +z (toward the camera)."""
import json, math, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(5)
U = rng.uniform
FPS, R, G, CRUISE = 60, 1.0, 9.0, 1.1

def reach(h):  # horizontal distance (ball centre -> object's near face) at first touch, for an object of height h
    hh = min(h, R); return math.sqrt(R * R - (R - hh) ** 2)

spec = [  # in the order the ball meets them
    dict(type='jelly', w=.95, d=.95, h=.85, soft=True, vt=.45),
    dict(type='crayons', w=1.15, d=6 * .19, h=.15, vt=.55),
    dict(type='sand', w=.95, d=.95, h=.8, soft=True, vt=.38),
    dict(type='wrap', w=.62, d=1.5, h=.075, vt=.5),
    dict(type='ice', w=.8, d=.8, h=.8, hold=1.3, vt=.6),
    dict(type='wafers', w=.95, d=.7, h=.66, hold=.9, vt=.5),
]
z = 2.1
for o in spec:
    o['z0'] = z; z += o['d'] + 1.5  # z0 = the face the ball meets first
END_Z = spec[-1]['z0'] + spec[-1]['d']

# per-type layout
for o in spec:
    if o['type'] == 'crayons': o['cz'] = [o['z0'] + .095 + .19 * j for j in range(6)]; o['cr'] = .07
    if o['type'] == 'wrap':
        o['bub'] = [[round(-.16 + .16 * i, 3), round(o['z0'] + .1 + .18 * j, 3)] for j in range(8) for i in range(3)]

# ---- simulate the ball ----
dt = 1 / 480
t, bz, v = 0.0, 0.0, CRUISE
st = [dict(tc=None, th=None, tb=None, hits={}) for _ in spec]
track, nf = [], 0.0
def ball_bottom_over(x, zq, bz_, cy):
    """lowest point the ball surface reaches above (x, zq) given ball centre z bz_ (swept: ball moved +z)."""
    if abs(x) >= R: return 9.0
    if bz_ >= zq: return cy - math.sqrt(R * R - x * x)
    d2 = x * x + (zq - bz_) ** 2
    return cy - math.sqrt(R * R - d2) if d2 < R * R else 9.0
while True:
    vt = CRUISE
    for i, o in enumerate(spec):
        s, z0 = st[i], o['z0']
        touch = z0 - reach(o['h'])
        if s['tc'] is None and bz >= touch + .005: s['tc'] = t
        if 'hold' in o:
            stop = touch + .025
            if s['tb'] is None and bz > touch - 1.5:
                vt = min(vt, max(0.0, (stop - bz) * 3))
                if s['th'] is None and stop - bz < .002: s['th'] = t
                if s['th'] is not None and t >= s['th'] + o['hold']: s['tb'] = t; v = .7
            elif s['tb'] is not None and bz < z0 + o['d'] + .3: vt = min(vt, o['vt'])
        elif touch - .25 < bz < z0 + o['d'] * (.75 if o.get('soft') else 1.0) + .1:
            vt = min(vt, o['vt'])
        if o['type'] == 'crayons':
            for j, cz in enumerate(o['cz']):
                if j not in s['hits'] and ball_bottom_over(0, cz, bz, R) < 2 * o['cr'] - .03: s['hits'][j] = t
        if o['type'] == 'wrap':
            for j, (bx_, bz_) in enumerate(o['bub']):
                if j not in s['hits'] and ball_bottom_over(bx_, bz_, bz, R + .012) < .075 * .62: s['hits'][j] = t
        if o.get('soft') and s['tb'] is None and bz >= z0 + o['d'] * .55: s['tb'] = t
    v += (vt - v) * min(1, 5 * dt)
    bz += v * dt
    if t >= nf - 1e-9: track.append(bz); nf += 1 / FPS
    t += dt
    if bz > END_Z + 2.2: break
for i, o in enumerate(spec):
    if o['type'] in ('crayons', 'wrap'):
        st[i]['tb'] = max(st[i]['hits'].values())
DUR = round(len(track) / FPS, 2)

# ball height: rides a little on flattened remains / pieces
def lift_at(k):
    bz_, t_ = track[k], k / FPS; L = 0.0
    for i, o in enumerate(spec):
        hf = {'jelly': .05, 'sand': .07, 'wrap': .012, 'crayons': .02, 'ice': .0, 'wafers': .02}[o['type']]
        start = st[i]['tc'] if o.get('soft') or o['type'] in ('wrap', 'crayons') else st[i]['tb']
        if t_ < start: continue
        a = min(1, max(0, (bz_ - (o['z0'] - .1)) / .3)) * min(1, max(0, (o['z0'] + o['d'] + .4 - bz_) / .3))
        L = max(L, hf * a)
    return L
lift = [lift_at(k) for k in range(len(track))]

# ---- flying pieces: analytic flight with one bounce (same formula in short.html) ----
frags = []
def frag(t0, p, vel, size, kind, color, e=.3, spin=None, extra=None):
    y0 = max(p[1], size * .5)
    vy = vel[1]; yg = size * .5
    t1 = (vy + math.sqrt(vy * vy + 2 * G * (y0 - yg))) / G
    f = dict(t0=round(t0, 4), p=[round(p[0], 3), round(y0, 3), round(p[2], 3)], v=[round(x, 3) for x in vel], s=round(size, 3), k=kind, c=color, e=e,
             ax=[round(x, 3) for x in rng.normal(size=3)], w=round(spin if spin is not None else U(-10, 10), 2), t1=round(t1, 4))
    if extra: f.update(extra)
    frags.append(f); return f

for i, o in enumerate(spec):
    s, z0, w, d, h, ty = st[i], o['z0'], o['w'], o['d'], o['h'], o['type']
    if ty == 'crayons':
        cols = ['#e8403c', '#f39a2a', '#f5d23a', '#53b956', '#3f8fe0', '#b35bd6']
        for j, cz in enumerate(o['cz']):
            th = s['hits'][j]
            for side in (-1, 1):  # the two halves kick up and outwards
                frag(th, [side * .29, .07, cz], [side * U(.4, .9), U(1.2, 2.0), U(.5, 1.2)], .07, 'chalf', cols[j], e=.35, extra=dict(side=side, len=.55))
            for _ in range(5): frag(th + U(0, .02), [U(-.12, .12), .1, cz], [U(-1, 1), U(.8, 2.0), U(.3, 1.5)], U(.02, .04), 'chip', cols[j], e=.3)
    if ty == 'ice':
        n = 4; cell = w / n
        for a in range(n):
            for b in range(n):
                for c in range(n):
                    cx, cy, cz = -w / 2 + cell * (a + .5), cell * (b + .5), z0 + cell * (c + .5)
                    out = np.array([cx, cy - h * .3, (cz - z0) + .4]); out /= np.linalg.norm(out)
                    sp = U(1.0, 2.6)
                    frag(s['tb'] + U(0, .04), [cx, cy, cz], [out[0] * sp + U(-.3, .3), out[1] * sp + U(.6, 1.6), abs(out[2]) * sp + U(.3, 1.2)], cell * U(.75, 1.0), 'shard',
                         ['#cfe8ff', '#e2d6ff', '#d6fff4', '#ffe0f3'][int(U(0, 4))], e=.3, spin=U(-14, 14))
        for _ in range(60):  # glitter
            frag(s['tb'] + U(0, .08), [U(-.35, .35), U(.1, .7), z0 + U(0, .5)], [U(-1.5, 1.5), U(1, 3.2), U(.5, 2.2)], U(.02, .04), 'glint', '#ffffff', e=.25)
    if ty == 'wafers':
        layers = 5; lh = h / layers
        for L in range(layers):
            tl = s['tb'] + (layers - 1 - L) * .06  # top layer breaks first
            s['hits'][L] = round(tl, 4)
            for a in range(3):
                for b in range(2):
                    frag(tl, [-w / 2 + w / 3 * (a + .5), lh * (L + .5), z0 + d / 2 * (b + .5)], [U(-.8, .8), U(.6, 1.8), U(.4, 1.6)], w / 3 * .95, 'wchunk', '#e6b062', e=.25,
                         spin=U(-8, 8), extra=dict(hh=round(lh * .8, 3), dd=round(d / 2 * .95, 3)))
            for _ in range(14): frag(tl + U(0, .05), [U(-.4, .4), lh * (L + .5), z0 + U(0, d)], [U(-1.2, 1.2), U(.5, 2.0), U(.2, 1.8)], U(.02, .045), 'crumb', '#d99a48', e=.2)
    if ty == 'sand':
        cols = ['#ffe08a', '#b9a6ff', '#9de3c8', '#ff9cc2']
        for _ in range(260):
            tt = U(s['tc'], s['tb'] + .5); k = min(len(track) - 1, int(tt * FPS)); front = track[k] + R * .55
            y = U(.05, h); frag(tt, [U(-w / 2, w / 2) * 1.05, y, min(front, z0 + d)], [U(-.6, .6), U(-.2, .5), U(.15, .8)], U(.015, .035), 'grain', cols[min(3, int(y / h * 4))], e=0)
    if ty == 'jelly':
        for _ in range(10):
            frag(s['tb'] - .3 + U(0, .5), [U(-.5, .5), U(.05, .2), z0 + d * U(.6, 1.0)], [U(-1.2, 1.2), U(.5, 1.6), U(.6, 1.8)], U(.05, .11), 'blob', ['#ff4f8b', '#ff7aa8'][int(U(0, 2))], e=0)

ev = dict(title='Heavy Ball ASMR', fps=FPS, duration=DUR, R=R, G=G,
          track=[round(x, 4) for x in track], lift=[round(x, 4) for x in lift],
          objects=[dict(**{k: v for k, v in o.items() if k != 'soft'}, soft=bool(o.get('soft')),
                        tc=round(st[i]['tc'], 4), th=round(st[i]['th'], 4) if st[i]['th'] else None, tb=round(st[i]['tb'], 4),
                        hits={str(k): round(v, 4) for k, v in st[i]['hits'].items()}) for i, o in enumerate(spec)],
          frags=frags)
json.dump(ev, open(os.path.join(HERE, 'events.json'), 'w'))
print(f"duration {DUR}s, {len(frags)} pieces")
for o in ev['objects']: print(f"  {o['type']:8s} tc {o['tc']:6.2f} th {o['th'] or 0:6.2f} tb {o['tb']:6.2f} hits {len(o['hits'])}")
