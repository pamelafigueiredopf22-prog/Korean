"""Soundtrack for short-02, built from events.json (written by plan.py).
Every crush, snap, pop and every fragment landing is placed at the exact time the animation shows it."""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from synth import *  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json')))
FPS, S, R = ev['fps'], ev['S'], ev['R']
track = np.array(ev['track']); lift = np.array(ev['lift'])
mix = Mix(ev['duration'])
U = rng.uniform

def bx_at(t): return float(np.interp(t * FPS, np.arange(len(track)), track))
def camx(t): return min(bx_at(t) - ev['ballSX'] / S, ev['camStop'])
def pan_x(wx, t):  # world x -> stereo position from where it is on screen
    return float(np.clip(((wx - camx(t)) * S - 540) / 540 * 0.85, -1, 1))

# ---------- material sounds ----------
def wet_squish(dur, amp=1.0, lo=200, hi=1600, bub_rate=30):
    n = secs(dur); t = t_axis(n)
    am = lp(np.abs(noise(n)), 12) * 6
    x = bp(noise(n), lo, hi) * am * np.minimum(1, t / .15) * (0.4 + 0.6 * t / dur)
    out = x * 0.5
    k = 0.0
    while k < dur:
        k += rng.exponential(1 / bub_rate)
        b = bubble(U(160, 520), U(.01, .03), amp=U(.2, .6)); i = secs(k)
        if i < n: out[i:i + len(b)] += b[:n - i]
    return (out * amp).astype(np.float32)

def splat(amp=1.0):
    n = secs(.35); t = t_axis(n)
    x = lp(noise(n), 1400) * np.exp(-t / .06) * 1.2
    th = thump(95, 40, .12, .8); x[:len(th)] += th
    for _ in range(14):
        b = bubble(U(180, 600), U(.01, .035), amp=U(.2, .5)); i = secs(U(0, .18)); x[i:i + len(b)] += b[:n - i]
    return (x * amp).astype(np.float32)

def plop(amp=.5):
    b = bubble(U(220, 420), .025, amp=1); c = lp(click(.004, 200, 2500), 2500)
    m = min(len(b), len(c)); b[:m] += c[:m] * .6; return (b * amp).astype(np.float32)

def snap(amp=1.0):  # crayon: woody/waxy crack
    n = secs(.12); x = np.zeros(n, np.float32)
    for f, tau, a in [(U(2100, 2700), .012, .7), (U(3600, 4300), .008, .45), (U(1100, 1400), .02, .35)]:
        r = ring(f, tau, a); x[:len(r)] += r[:n]
    c = click(.002, 1200, 10000, 1.3); x[:len(c)] += c
    nb = bp(noise(n), 900, 6000) * np.exp(-t_axis(n) / .015) * .8; x += nb
    return (x * amp).astype(np.float32)

def tick(lo, hi, amp=.25, tau=.01):
    r = ring(U(lo, hi), tau, 1); c = click(.0015, lo, hi * 1.5, .6); m = min(len(r), len(c)); r[:m] += c[:m]; return (r * amp).astype(np.float32)

def bubble_pop(amp=1.0):
    n = secs(.08); t = t_axis(n)
    x = hp(noise(n), 1500) * np.exp(-t / .0025) * 1.6
    x += bp(noise(n), 400, 2500) * np.exp(-t / .02) * .35
    r = ring(U(900, 1300), .006, .5); x[:len(r)] += r[:n]
    return (x * amp).astype(np.float32)

def creak(dur, rate_from, rate_to, lo, hi, amp=.25, tau=.004):
    """stick-slip pressure ticks that speed up: the build-up before something gives."""
    n = secs(dur); out = np.zeros(n + secs(tau * 8), np.float32); k = 0.0
    while k < dur:
        r = rate_from + (rate_to - rate_from) * (k / dur) ** 1.5; k += rng.exponential(1 / r)
        if k >= dur: break
        g = amp * (0.3 + 0.7 * k / dur) * U(.4, 1)
        b = ring(U(lo, hi), tau, g); i = secs(k); out[i:i + len(b)] += b
    return out[:n]

def shatter(amp=1.0):
    n = secs(1.0); t = t_axis(n)
    x = hp(noise(n), 1500) * np.exp(-t / .07) * .9
    for _ in range(55):
        r = ring(U(2500, 11000), U(.02, .25), U(.05, .3), partials=((1, 1), (2.76, .4))); i = secs(U(0, .12) ** 1.5 * 2)
        x[i:i + len(r)] += r[:n - i]
    th = thump(85, 38, .14, .9); x[:len(th)] += th
    return (x * amp).astype(np.float32)

def tinkle(amp=.2):
    r = ring(U(3500, 9000), U(.05, .14), 1, partials=((1, 1), (2.4, .3))); return (r * amp).astype(np.float32)

def crumble(dur, amp=.6):  # kinetic sand: soft granular "shhh"
    n = secs(dur); t = t_axis(n)
    grains = np.zeros(n, np.float32); k = 0.0
    while k < dur:
        k += rng.exponential(1 / 900); i = secs(k)
        if i < n: grains[i] += U(.2, 1)
    tex = lp(grains, 6000) * 1.5 + bp(noise(n), 1200, 6500) * .25
    env_ = np.minimum(1, t / .3) * np.minimum(1, (dur - t) / .4)
    return (tex * env_ * amp).astype(np.float32)

def crunch(amp=1.0):  # wafer layer
    x = crackle(.09, 500, 150, .5, 1500, 9000)
    nb = bp(noise(len(x)), 500, 4500) * np.exp(-t_axis(len(x)) / .03) * .7; x += nb
    th = thump(140, 70, .04, .4); x[:len(th)] += th
    return (x * amp).astype(np.float32)

def paper_crinkle(dur, amp=.3):
    return crackle(dur, 40, 90, amp, 2500, 11000, (.0004, .0015))

# ---------- 1. the ball rolling: low rumble + grit when crushing over debris ----------
n = secs(ev['duration']); tt = t_axis(n); fr = tt * FPS
v = np.gradient(track) * FPS; v_s = np.interp(fr, np.arange(len(v)), v).astype(np.float32)
lf = np.interp(fr, np.arange(len(lift)), lift).astype(np.float32)
sp = np.clip(v_s / 400, 0, 1.3)
rumble = lp(noise(n, 'pink'), 220) * 3.0 * sp ** .8
grit_a = np.clip(lf / 10, 0, 1) * sp
grit = crackle(ev['duration'], 120, 120, .25, 900, 5000) * grit_a
roll = rumble + bp(noise(n), 300, 1200) * .05 * sp + grit
ball_pan = np.array([pan_x(bx_at(x), x) for x in tt[::480]])
mix.add(roll, 0, pan=np.interp(np.arange(n), np.arange(0, n, 480)[:len(ball_pan)], ball_pan).astype(np.float32), gain=.9)

# ---------- 2. each object ----------
for o in ev['objects']:
    ty, tc, tb, th = o['type'], o['tc'], o['tb'], o.get('th')
    cx = o['x0'] + o['w'] / 2; P = lambda t: pan_x(cx, t)
    if ty == 'jelly':
        mix.add(wet_squish(tb - tc, 1.0), tc, P(tc), .4); mix.add(splat(1.0), tb, P(tb), .55)
    if ty == 'cupcake':
        mix.add(wet_squish(tb - tc, .8, 150, 1100, 18), tc, P(tc), .35); mix.add(paper_crinkle(tb - tc + .2), tc, P(tc), .5); mix.add(splat(.8), tb, P(tb), .5)
    if ty == 'crayons':
        mix.add(creak(o['tb'] - th + .2, 25, 90, 500, 1100, .35), th, P(th), .9)
        for j, h in enumerate(o['hits']): mix.add(snap(U(.85, 1)), h, pan_x(o['cx'][j], h), .9)
    if ty == 'wrap':
        for j, h in enumerate(o['hits']): mix.add(bubble_pop(U(.85, 1)), h, pan_x(o['bx'][j], h), .9)
    if ty == 'crystal':
        mix.add(creak(tb - th, 4, 70, 4000, 8000, .3, .003), th, P(th), .8)
        mix.add(creak(tb - th, 2, 12, 250, 500, .25, .03), th, P(th), .7)  # low groan underneath
        mix.add(shatter(1.0), tb, P(tb), .9)
    if ty == 'sand':
        mix.add(crumble(tb - tc + .6), tc, P(tc), .9)
    if ty == 'wafers':
        mix.add(creak(tb - th, 10, 45, 1500, 5000, .2, .002), th, P(th), .8)
        for h in o['hits']: mix.add(crunch(U(.8, 1)), h, P(h), .85)
    if th:  # the heavy ball lurching forward when something gives way
        mix.add(thump(70, 32, .18, .9), tb + .03, P(tb), .7)

# ---------- 3. every fragment landing (and its little bounce) ----------
G = ev['G']
for f in ev['frags']:
    t1 = f['t0'] + f['t1']
    if t1 >= ev['duration'] - .05: continue
    x_land = f['x'] + f['vx'] * f['t1']; p = pan_x(x_land, t1); k = f['k']
    vy1 = f['vy'] + G * f['t1']; t2 = t1 + 2 * f['e'] * vy1 / G
    if k == 'blob': mix.add(plop(U(.25, .5)), t1, p)
    elif k == 'shard':
        mix.add(tinkle(U(.12, .3)), t1, p)
        if f['e'] > 0: mix.add(tinkle(U(.04, .1)), t2, p)
    elif k in ('ctip', 'crect', 'wchunk'):
        mix.add(tick(1400, 2600, U(.2, .35)), t1, p)
        if f['e'] > 0: mix.add(tick(1600, 2800, .1), t2, p)
    elif k == 'cherry':
        mix.add(tick(500, 800, .5, .03), t1, p); mix.add(thump(160, 90, .05, .4), t1, p); mix.add(tick(600, 900, .25, .03), t2, p)
    elif k in ('spr', 'crumb'): mix.add(tick(3000, 7000, U(.05, .12), .004), t1, p)
    elif k == 'grain': mix.add(lp(click(.002, 800, 5000, U(.05, .12)), 4000), t1, p)

mix.reverb(mix=.12, tau=.08)
os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
mix.write(os.path.join(HERE, 'build', 'raw.wav'))
print('wrote build/raw.wav')
