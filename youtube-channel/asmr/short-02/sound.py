"""ASMR soundtrack for short-02 (3D), built from events.json (written by plan.py).

Sound design aims for "close-mic ASMR" rather than "action movie":
- dry and intimate (tiny room, no big reverb, no booming thumps)
- detail over loudness: dense micro-crackles, wet clicks, grains, crisp snaps
- binaural placement: every sound gets an interaural time delay + head shadow,
  and textures are generated independently for each ear, so they feel like they're around your head
Every event is placed at the exact time the animation shows it."""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from synth import *  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json')))
FPS, R, G = ev['fps'], ev['R'], ev['G']
track = np.array(ev['track'])
mix = Mix(ev['duration'])
U = rng.uniform

def bz_at(t): return float(np.interp(t * FPS, np.arange(len(track)), track))
def pan_of(x, z, t):
    """where a point appears on screen -> stereo position (camera sits right of the row, looking back at the ball)."""
    cx, cz = 1.2 + .25 * np.sin(t * .23), bz_at(t) + 5.6
    return float(np.clip((x - cx) / max(.6, cz - z) / .23 * .9 + .25, -1, 1))

def binaural(x, pan):
    """mono -> (L, R) with level difference, up to 0.6 ms time difference and head-shadow on the far ear."""
    p = float(np.clip(pan, -1, 1)); ang = (p + 1) * np.pi / 4
    gl, gr = np.cos(ang) * 1.2, np.sin(ang) * 1.2
    d = int(abs(p) * 0.0006 * SR)
    far = lp(x, 9000 - 5000 * abs(p), 2) if abs(p) > .05 else x
    near = x
    if p >= 0: L, Rr = np.concatenate([np.zeros(d, np.float32), far]), np.concatenate([near, np.zeros(d, np.float32)])
    else: L, Rr = np.concatenate([near, np.zeros(d, np.float32)]), np.concatenate([np.zeros(d, np.float32), far])
    return (L * gl).astype(np.float32), (Rr * gr).astype(np.float32)

def place(x, at, pan, gain=1.0):
    L, Rr = binaural(x * gain, pan); mix.add_stereo(L, Rr, at)

def place_wide(make, at, pan, gain=1.0, width=.35):
    """a texture generated separately for each ear (decorrelated = wide and immersive)."""
    a, b = make(), make()
    La, Ra = binaural(a * gain, pan - width); Lb, Rb = binaural(b * gain, pan + width)
    n = max(len(La), len(Lb)); pad = lambda v: np.pad(v, (0, n - len(v)))
    mix.add_stereo(pad(La) + pad(Lb), pad(Ra) + pad(Rb), at)

# ---------- textures ----------
def micro(dur, rate, lo, hi, tau=(.0004, .002), amp=.3, shape=None):
    """dense micro-crackle; shape(u) 0..1 sets density and level over the duration."""
    n = secs(dur); out = np.zeros(n + secs(.03), np.float32); k = 0.0
    while k < dur:
        s = shape(k / dur) if shape else 1.0
        k += rng.exponential(1 / max(rate * s, 1))
        if k >= dur: break
        r = ring(U(lo, hi), U(*tau), amp * s * U(.2, 1)); c = click(.0006, lo * .8, min(hi * 1.4, 20000), amp * s * U(.1, .4))
        m = min(len(r), len(c)); r[:m] += c[:m]; i = secs(k); out[i:i + len(r)] += r[:len(out) - i]
    return out[:n]

def wet_clicks(dur, rate, shape):
    """sticky, wet micro-sounds: tiny high bubbles and lip-like clicks."""
    n = secs(dur); out = np.zeros(n + secs(.05), np.float32); k = 0.0
    while k < dur:
        s = shape(k / dur); k += rng.exponential(1 / max(rate * s, 1))
        if k >= dur: break
        if U() < .7: b = bubble(U(900, 3200), U(.002, .006), amp=U(.15, .5) * s)
        else: b = bubble(U(250, 700), U(.008, .02), amp=U(.2, .5) * s)
        i = secs(k); out[i:i + len(b)] += b[:len(out) - i]
    body = bp(noise(n), 150, 1000) * lp(np.abs(noise(n)), 8) * 4 * np.array([shape(u) for u in np.linspace(0, 1, n)], np.float32)
    return out[:n] + body * .25

def grains(dur, rate, shape, amp=.12):
    """kinetic sand: soft dense granular 'shhh' with tiny crunches."""
    n = secs(dur); g = np.zeros(n, np.float32); k = 0.0
    while k < dur:
        s = shape(k / dur); k += rng.exponential(1 / max(rate * s, 1)); i = secs(k)
        if i < n: g[i] += U(-1, 1) * s
    tex = bp(g, 1500, 9000) * 2.2 + lp(g, 1200) * 1.2
    crunch = micro(dur, 90, 500, 2600, (.001, .004), .3, shape)
    return (tex * amp * 2.5 + crunch * .9).astype(np.float32)

def wax_snap():
    n = secs(.09); x = np.zeros(n, np.float32)
    c = click(.0015, 1500, 12000, 1.0); x[:len(c)] += c
    for f, tau, a in [(U(2200, 2800), .007, .55), (U(3800, 4600), .005, .35), (U(1300, 1600), .012, .3)]:
        r = ring(f, tau, a); x[:len(r)] += r[:n]
    x += bp(noise(n), 1200, 7000) * np.exp(-t_axis(n) / .01) * .5
    tail = micro(.08, 300, 2500, 8000, amp=.18, shape=lambda u: 1 - u); m = min(n - secs(.006), len(tail)); x[secs(.006):secs(.006) + m] += tail[:m]
    return lp(x, 11000)

def wrap_pop():
    n = secs(.06); t = t_axis(n)
    x = hp(noise(n), 1200) * np.exp(-t / .0018) * 1.0 + bp(noise(n), 300, 1600) * np.exp(-t / .012) * .4
    r = ring(U(1500, 2600), .004, .3); x[:len(r)] += r[:n]
    return lp(x, 12000)

def ice_crack():
    n = secs(.6); t = t_axis(n)
    x = hp(noise(n), 2500) * np.exp(-t / .006) * .8
    for _ in range(26):
        r = ring(U(2500, 9500), U(.01, .09), U(.05, .22), partials=((1, 1), (2.6, .35))); i = secs(U(0, .05) ** 1.3 * 3)
        x[i:i + len(r)] += r[:n - i]
    m = micro(.25, 600, 3000, 9000, amp=.12, shape=lambda u: 1 - u); x[:len(m)] += m
    return lp(x, 13000)

def tinkle(a):
    return ring(U(3500, 8500), U(.04, .12), a, partials=((1, 1), (2.45, .3), (4.1, .1)))

def wafer_crunch():
    x = micro(.14, 2600, 1200, 9000, (.0003, .0015), .45, lambda u: (1 - u) ** 1.5)
    x += bp(noise(len(x)), 400, 2500) * np.exp(-t_axis(len(x)) / .03) * .3
    return lp(x, 12000)

def tiny_tick(lo, hi, a, tau=.004):
    r = ring(U(lo, hi), tau, a); c = click(.0008, lo, min(hi * 1.5, 20000), a * .5); m = min(len(r), len(c)); r[:m] += c[:m]; return r

# ---------- 1. the ball: a soft, close wooden roll, quiet enough to sit under the textures ----------
n = secs(ev['duration']); fr = t_axis(n) * FPS
v = np.gradient(track) * FPS; sp = np.clip(np.interp(fr, np.arange(len(v)), v) / 1.1, 0, 1.2).astype(np.float32)
for side in (-1, 1):
    roll = bp(noise(n, 'pink'), 90, 900) * 2.2 * sp + micro(ev['duration'], 25, 1800, 6000, amp=.05) * sp
    place(roll, 0, -.15 + side * .2, .3)

# ---------- 2. each object ----------
for o in ev['objects']:
    ty, tc, tb, th = o['type'], o['tc'], o['tb'], o.get('th')
    zc = o['z0'] + o['d'] / 2; P = lambda t, x=0.0: pan_of(x, zc, t)
    if ty == 'jelly':
        d = tb - tc + .9
        place_wide(lambda: wet_clicks(d, 180, lambda u: np.sin(np.pi * min(1, u * 1.15)) ** .6), tc, P(tc), .3)
        for k in range(6): place(bubble(U(300, 520), .02, amp=.35), tb + .1 + k * .07, P(tb) + U(-.3, .3))  # soft "shlorp" tail
    if ty == 'sand':
        d = tb - tc + .7
        place_wide(lambda: grains(d, 700, lambda u: min(1, u / .15) * (1 - max(0, u - .8) / .2)), tc, P(tc), .85)
    if ty == 'crayons':
        for j, h in o['hits'].items(): place(wax_snap(), h, P(h) + U(-.1, .1), 1.25)
    if ty == 'wrap':
        place_wide(lambda: micro(tb - tc + .3, 60, 3000, 11000, amp=.07), tc, P(tc), 1.0)  # the plastic sheet crinkling
        for j, h in o['hits'].items():
            x = o['bub'][int(j)][0]; place(wrap_pop(), h, P(h, x * 3), U(1.1, 1.4))
    if ty == 'ice':
        place_wide(lambda: micro(tb - th, 160, 3500, 9500, (.0008, .003), .22, lambda u: .1 + .9 * u ** 2), th, P(th), .8)
        place(ice_crack(), tb, P(tb), .9)
    if ty == 'wafers':
        place_wide(lambda: micro(tb - th, 70, 1500, 7000, (.0004, .0015), .16, lambda u: .2 + .8 * u), th, P(th), .8)
        for L, h in o['hits'].items(): place(wafer_crunch(), h, P(h) + U(-.15, .15), 1.2)

# ---------- 3. every piece landing ----------
for f in ev['frags']:
    t1 = f['t0'] + f['t1']
    if t1 >= ev['duration'] - .05: continue
    x = f['p'][0] + f['v'][0] * f['t1']; z = f['p'][2] + f['v'][2] * f['t1']; p = pan_of(x, z, t1); k = f['k']
    vy1 = f['v'][1] - G * f['t1']; t2 = t1 + 2 * f['e'] * abs(vy1) / G
    if k in ('shard', 'glint'):
        a = .14 if k == 'shard' else .05; place(tinkle(a * U(.6, 1.2)), t1, p)
        if f['e'] > 0: place(tinkle(a * .35), t2, p)
    elif k == 'chalf': place(tiny_tick(1600, 2800, .22, .008), t1, p); place(tiny_tick(1800, 3000, .08, .006), t2, p)
    elif k == 'wchunk': place(micro(.04, 900, 1500, 7000, amp=.2, shape=lambda u: 1 - u), t1, p)
    elif k in ('chip', 'crumb'): place(tiny_tick(3000, 8000, U(.04, .09)), t1, p)
    elif k == 'grain': place(tiny_tick(2500, 7000, U(.015, .035), .002), t1, p)
    elif k == 'blob': place(bubble(U(380, 650), .012, amp=.25), t1, p)

# tiny dry room + gentle close-mic warmth
mix.reverb(mix=.05, tau=.025, length=.25)
for ch in ('L', 'R'):
    x = getattr(mix, ch); setattr(mix, ch, (x + lp(x, 250, 2) * .35).astype(np.float32))
os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
mix.write(os.path.join(HERE, 'build', 'raw.wav'))
print('wrote build/raw.wav')
