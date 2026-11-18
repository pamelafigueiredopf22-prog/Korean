"""Build the soundtrack for short-01 from events.json. Motion formulas here mirror short.html."""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from synth import *  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json')))
mix = Mix(ev['duration'])
smooth = lambda u: u * u * (3 - 2 * u)
xpan = lambda x: float(np.clip((x - 540) / 540 * 0.85, -1, 1))

# 0. room tone
mix.add_stereo(room_tone(ev['duration']), room_tone(ev['duration']), 0)

# 1. mist spray
for t in ev['spray']['pumps']:
    mix.add(spray_pump(), t, pan=0.45, gain=0.55)
    mix.add_stereo(mist_landing(1.0, 70), mist_landing(1.0, 70), t + 0.12, gain=0.8)

# 2. foam pumps
for t in ev['foam']['pumps']:
    mix.add(foam_pump(), t, pan=0.1, gain=0.7)

# 3. scrub: circular silicone brush, pan follows x, swish follows the nubs
sc = ev['scrub']; dur = sc['t1'] - sc['t0']; n = secs(dur); tt = t_axis(n)
ph = 2 * np.pi * sc['turnsPerSec'] * tt
x = sc['cx'] + sc['rx'] * np.cos(ph)
ramp = np.minimum(1, tt / 0.4) * np.minimum(1, (dur - tt) / 0.5)
motion = ramp * (0.55 + 0.45 * np.abs(np.sin(2 * ph)))
pan = np.clip((x - 540) / 540 * 0.9, -1, 1)
mix.add(squish_layer(dur, motion), sc['t0'], pan=pan, gain=0.55)
fz_env = np.concatenate([np.minimum(1, t_axis(secs(dur)) / 0.6), np.linspace(1, 0, secs(2.5)) ** 2]).astype(np.float32)
fzL, fzR = [lp(foam_fizz(dur + 2.5, 300), 10000)[:len(fz_env)] * fz_env for _ in range(2)]
mix.add_stereo(fzL, fzR, sc['t0'], gain=0.55)  # foam keeps fizzing after scrub, then settles

# 4. rinse
r = ev['rinse']; d = r['t1'] - r['t0']
mix.add_stereo(water_rinse(d), water_rinse(d), r['t0'], gain=0.75)

# 5. mask brush strokes (pan travels with the brush)
for s in ev['strokes']:
    d = s['t1'] - s['t0']; n = secs(d); u = smooth(np.clip(t_axis(n) / d, 0, 1))
    xs = [p[0] for p in s['pts']]
    xx = np.interp(u, np.linspace(0, 1, len(xs)), xs)
    mix.add(brush_stroke(d), s['t0'], pan=np.clip((xx - 540) / 540 * 0.9, -1, 1), gain=0.6)

# 6. mask drying: crackle that speeds up, independent in each ear
dr = ev['dry']; d = dr['t1'] - dr['t0']
mix.add_stereo(crackle(d, 2, 16, 0.3), crackle(d, 2, 16, 0.3), dr['t0'], gain=3.0)

# 7. peel: speed curve from the same keyframes as the animation
keys = ev['peel']['keys']; t0, t1 = keys[0][0], keys[-1][0]; d = t1 - t0 + 0.3; n = secs(d); tt = t_axis(n) + t0
def peel_p(t):
    for (ta, pa), (tb, pb) in zip(keys, keys[1:]):
        if ta <= t <= tb:
            return pa + (pb - pa) * smooth((t - ta) / (tb - ta))
    return keys[-1][1] if t > keys[-1][0] else 0
p = np.array([peel_p(t) for t in tt[::48]])
sp = np.abs(np.gradient(p)); sp = sp / sp.max(); sp = np.interp(np.arange(n), np.arange(0, n, 48)[:len(sp)], sp).astype(np.float32)
mix.add_stereo(peel_layer(d, sp), peel_layer(d, sp), t0, gain=0.85)
for k in range(9):  # plugs letting go along the way
    tk = t0 + 0.4 + k * (t1 - t0 - 0.6) / 8 + rng.uniform(-.1, .1)
    if peel_p(tk + .01) - peel_p(tk) > 0.0005:
        mix.add(plug_snap(rng.uniform(.4, .75)), tk, pan=rng.uniform(-.4, .4), gain=0.6)

# 8. extraction: tap, press, pop
for e in ev['extract']:
    pn = xpan(e['x'])
    mix.add(metal_tap(), e['t'] - 0.42, pan=pn, gain=0.8)
    mix.add(extractor_press(0.42), e['t'] - 0.4, pan=pn, gain=0.8)
    mix.add(lp(plug_snap(1.0), 7000), e['t'], pan=pn, gain=0.5)

# 9. serum drops
for s in ev['serum']:
    pn = xpan(s['x'])
    mix.add(dropper_squeeze(), s['t'] - 0.3, pan=pn * .5, gain=0.7)
    mix.add(drop_plop(), s['t'] + 0.18, pan=pn, gain=0.8)

# 10. pats (two hands alternating)
pt = ev['pats']; k = 0; t = pt['t0']
while t < pt['t1']:
    mix.add(pat(rng.uniform(.55, .8)), t, pan=-0.4 if k % 2 == 0 else 0.4, gain=0.9)
    t += pt['step']; k += 1

# 11. finale chime + soft twinkles
mix.add_stereo(chime(), chime(), ev['finale']['chime'], gain=0.55)
for i in range(6):
    mix.add(ring(rng.uniform(3000, 5000), 0.25, 0.06), ev['finale']['chime'] + 0.4 + i * 0.45, pan=rng.uniform(-.7, .7))

mix.reverb(mix=0.14, tau=0.1)
os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
mix.write(os.path.join(HERE, 'build', 'raw.wav'))
print('wrote build/raw.wav')
