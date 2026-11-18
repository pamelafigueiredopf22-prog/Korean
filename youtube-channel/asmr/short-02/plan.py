"""Plan short-02 (heavy ball vs a row of objects): simulate the ball, decide every break/pop time,
and pre-generate every fragment. Writes events.json, which BOTH short.html and sound.py read,
so each sound lands exactly on its frame. Re-run after changing anything here."""
import json, math, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(3)
FPS, R, G, CRUISE = 60, 190.0, 2600.0, 400.0
S, BALL_SX = 1.6, 330  # world->screen scale, ball's screen x while the camera follows

def dC(h):  # horizontal ball-centre distance to an object's left edge at first touch
    hh = min(h, R); return math.sqrt(R * R - (R - hh) ** 2)

# ---- the row ----
spec = [
    dict(type='jelly', w=270, h=250, hf=22, soft=True, vt=150),
    dict(type='crayons', w=7 * 38, h=250, hf=10, hold=0.5, vt=190),
    dict(type='wrap', w=7 * 72, h=40, hf=8, vt=170),
    dict(type='cupcake', w=260, h=320, hf=30, soft=True, vt=130),
    dict(type='crystal', w=280, h=280, hf=14, hold=1.2, vt=220),
    dict(type='sand', w=320, h=250, hf=34, soft=True, vt=105),
    dict(type='wafers', w=290, h=230, hf=16, hold=0.7, vt=220),
]
x = 560.0
for o in spec:
    o['x0'] = x; x += o['w'] + 470
END_X = spec[-1]['x0'] + spec[-1]['w']
CAM_STOP = END_X + 260 - BALL_SX / S

# ---- simulate the ball ----
dt = 1 / 240
t, bx, v = 0.0, 0.0, CRUISE
state = {i: dict(tc=None, th=None, tb=None, hits=[]) for i in range(len(spec))}
for o in spec:
    if o['type'] == 'crayons': o['cx'] = [o['x0'] + 19 + 38 * j for j in range(7)]
    if o['type'] == 'wrap': o['bx'] = [o['x0'] + 36 + 72 * j for j in range(7)]
track = []
next_frame = 0.0
while True:
    vt = CRUISE
    for i, o in enumerate(spec):
        st, x0, w = state[i], o['x0'], o['w']
        touch = x0 - dC(o['h'])
        if st['tc'] is None and bx >= touch + 4: st['tc'] = t
        if 'hold' in o:  # hard: stop on contact, build pressure, then break through
            stop = touch + 14
            if st['tb'] is None and bx > touch - 400:
                vt = min(vt, max(0.0, (stop - bx) * 4))
                if st['th'] is None and stop - bx < 1: st['th'] = t
                if st['th'] is not None and t >= st['th'] + o['hold']:
                    st['tb'] = t; v = 300.0
            elif st['tb'] is not None and bx < x0 + w + 40:
                vt = min(vt, o['vt'])
        elif touch - 60 < bx < x0 + w * .6:
            vt = min(vt, o['vt'])
        if o['type'] == 'crayons' and st['tb'] is not None:
            for j, cx in enumerate(o['cx']):
                if len(st['hits']) == j and bx >= cx - math.sqrt(R * R - (R - o['h'] / 2) ** 2): st['hits'].append(t)
        if o['type'] == 'wrap':
            for j, b in enumerate(o['bx']):
                if len(st['hits']) == j and bx >= b - 4: st['hits'].append(t)
        if o.get('soft') and st['tb'] is None:
            lim = x0 + w * .3 if o['type'] == 'sand' else x0 - R * .25
            if bx >= lim: st['tb'] = t
    v += (vt - v) * min(1, 6 * dt)
    if vt == 0: v = min(v, vt + (stop - bx) * 4 + 1)
    bx += v * dt
    if t >= next_frame - 1e-9:
        track.append(bx); next_frame += 1 / FPS
    t += dt
    if bx > CAM_STOP + 1080 / S + R + 60: break
DUR = round(len(track) / FPS + 0.5, 2)
while len(track) < DUR * FPS + 1: track.append(track[-1] + CRUISE / FPS)

for i, o in enumerate(spec):
    if o['type'] == 'wrap': state[i]['tb'] = state[i]['hits'][-1]

def lift_at(i_frame):
    bx, t = track[i_frame], i_frame / FPS; L = 0.0
    for i, o in enumerate(spec):
        st = state[i]; start = st['tc'] if (o.get('soft') or o['type'] == 'wrap') else st['tb']
        if start is None or t < start: continue
        a = min(1, max(0, (bx - (o['x0'] - 40)) / 90)) * min(1, max(0, (o['x0'] + o['w'] + 70 - bx) / 90))
        L += o['hf'] * a
    return L
lift = [lift_at(i) for i in range(len(track))]

# ---- fragments: analytic flight, one bounce, slide to rest (same formulas in short.html) ----
frags = []
def frag(t0, x, y, vx, vy, s, kind, color, e=0.3, z=None, spin=None):
    f = dict(t0=round(t0, 4), x=round(x, 1), y=round(y, 1), vx=round(vx, 1), vy=round(vy, 1), s=round(s, 1), k=kind, c=color, e=e,
             r=round(rng.uniform(0, 6.28), 2), w=round(spin if spin is not None else rng.uniform(-12, 12), 2), z=z if z is not None else int(rng.random() < .45))
    yg = -s * .4; y = min(y, yg); f['y'] = round(y, 1); f['t1'] = round((-vy + math.sqrt(vy * vy - 2 * G * (y - yg))) / G, 4)
    frags.append(f); return f
U = rng.uniform
for i, o in enumerate(spec):
    st, x0, w, h = state[i], o['x0'], o['w'], o['h']; tb = st['tb']; ty = o['type']
    if ty == 'jelly':
        for _ in range(24): frag(tb + U(0, .08), x0 + U(20, 220), -U(40, h * .8), U(-200, 700), U(-1050, -250), U(22, 60), 'blob', ['#ff6fa0', '#ff8fb6', '#f0508a'][int(U(0, 3))], e=0)
    if ty == 'crayons':
        cols = ['#e8403c', '#f39a2a', '#f5d23a', '#53b956', '#3f8fe0', '#7a5bd6', '#e05aa6']
        for j, th in enumerate(st['hits']):
            cx = o['cx'][j]
            frag(th, cx, -h + 20, U(200, 650), U(-1100, -600), 26, 'ctip', cols[j], e=.35)
            frag(th, cx, -h * .6, U(150, 500), U(-800, -400), 30, 'crect', cols[j], e=.35)
            frag(th + .01, cx, -h * .3, U(-100, 300), U(-500, -200), 28, 'crect', cols[j], e=.35)
    if ty == 'cupcake':
        for _ in range(12): frag(tb + U(0, .1), x0 + U(30, 210), -h + U(0, 110), U(-200, 700), U(-1000, -350), U(16, 40), 'blob', '#ffb3cf', e=0)
        for _ in range(26): frag(tb + U(0, .12), x0 + U(30, 210), -h + U(0, 100), U(-300, 800), U(-1200, -400), 10, 'spr', ['#ff5d8f', '#59c3ff', '#ffd23f', '#7ee081', '#b38cff'][int(U(0, 5))], e=.4)
        for _ in range(10): frag(tb + U(0, .1), x0 + U(30, 210), -U(30, 140), U(-100, 500), U(-600, -200), U(10, 18), 'crumb', '#c98a4b', e=.2)
        frag(tb, x0 + w / 2, -h - 20, 520, -1250, 44, 'cherry', '#e3263f', e=.45, z=1, spin=7)
    if ty == 'crystal':
        for _ in range(46): frag(tb + U(0, .05), x0 + U(10, 240), -U(20, h), U(-350, 950), U(-1350, -300), U(10, 42), 'shard', ['#c9b6ff', '#9fe3ff', '#ffc4ec', '#e6dcff'][int(U(0, 4))], e=.3, spin=U(-20, 20))
    if ty == 'sand':
        cols = ['#ff9cc2', '#9de3c8', '#b9a6ff', '#ffe08a']
        for _ in range(150):
            tt = U(st['tc'], tb + .4); fr = min(len(track) - 1, int(tt * FPS)); front = track[fr] + R * .78
            hy = U(0, h); frag(tt, min(front, x0 + w), -hy, U(40, 260), U(-260, 40), U(6, 12), 'grain', cols[min(3, int(hy / h * 4))], e=0)
    if ty == 'wafers':
        st['hits'] = [round(tb + j * .055, 4) for j in range(6)]
        for j, th in enumerate(st['hits']):
            y = -h + h / 6 * (j + .45)
            frag(th, x0 + U(60, 220), y, U(150, 650), U(-900, -350), U(34, 52), 'wchunk', '#e9b765', e=.25)
            for _ in range(7): frag(th + U(0, .05), x0 + U(20, 250), y, U(-250, 750), U(-900, -200), U(6, 14), 'crumb', '#e2a955', e=.25)

# ---- camera (same formula in short.html) ----
def camx(bx): return min(bx - BALL_SX / S, CAM_STOP)

ev = dict(title='Heavy Ball vs Everything', fps=FPS, duration=DUR, R=R, G=G, S=S, ballSX=BALL_SX, camStop=round(CAM_STOP, 1),
          track=[round(v, 2) for v in track], lift=[round(v, 2) for v in lift],
          objects=[dict(**{k: v for k, v in o.items() if k not in ('soft',)}, soft=bool(o.get('soft')),
                        tc=round(state[i]['tc'], 4), th=round(state[i]['th'], 4) if state[i]['th'] else None,
                        tb=round(state[i]['tb'], 4), hits=[round(h, 4) for h in state[i]['hits']]) for i, o in enumerate(spec)],
          frags=frags)
json.dump(ev, open(os.path.join(HERE, 'events.json'), 'w'))
print(f"duration {DUR}s, {len(frags)} fragments")
for o in ev['objects']: print(f"  {o['type']:8s} tc {o['tc']:6.2f}  th {o['th'] or 0:6.2f}  tb {o['tb']:6.2f}  hits {len(o['hits'])}")
