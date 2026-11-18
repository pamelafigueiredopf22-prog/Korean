"""Procedural ASMR sound library (numpy/scipy). Everything is synthesized from scratch, so it's copyright-free.

All generators return mono float32 arrays at SR. Use Mix to place them in a stereo buffer
with equal-power panning (-1 = left, +1 = right) and an optional moving pan.
"""
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(7)


def t_axis(n):
    return np.arange(n) / SR


def noise(n, color='white'):
    x = rng.standard_normal(n)
    if color == 'pink':  # Voss-like approximation via filtering
        b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
        x = signal.lfilter(b, a, x)
    return x.astype(np.float32)


def bp(x, lo, hi, order=4):
    sos = signal.butter(order, [lo, hi], btype='bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x).astype(np.float32)


def lp(x, hi, order=4):
    return signal.sosfilt(signal.butter(order, hi, btype='lowpass', fs=SR, output='sos'), x).astype(np.float32)


def hp(x, lo, order=4):
    return signal.sosfilt(signal.butter(order, lo, btype='highpass', fs=SR, output='sos'), x).astype(np.float32)


def env(n, a=0.01, d=0.1, sustain=None):
    """attack (s), decay (s) envelope over n samples; optional flat sustain in the middle."""
    t = t_axis(n)
    e = np.minimum(1, t / max(a, 1e-4))
    rel = np.clip((n / SR - t) / max(d, 1e-4), 0, 1)
    return (e * rel).astype(np.float32)


def secs(s):
    return int(s * SR)


# ---------- elementary sounds
def bubble(f0, tau, sigma=None, amp=1.0):
    """Minnaert bubble: decaying sine whose pitch rises (sigma ~ rise rate)."""
    dur = tau * 6
    n = max(8, secs(dur))
    t = t_axis(n)
    sigma = sigma if sigma is not None else 0.1 * f0 / tau / 1000
    f = f0 * (1 + sigma * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    a = np.exp(-t / tau) * np.minimum(1, t / 0.0006)
    return (amp * a * np.sin(ph)).astype(np.float32)


def click(dur=0.003, lo=1500, hi=8000, amp=1.0):
    n = secs(dur) + 64
    x = noise(n) * np.exp(-t_axis(n) / (dur / 3))
    return (amp * bp(x, lo, min(hi, SR / 2 - 100), 2)).astype(np.float32)


def ring(freq, tau, amp=1.0, partials=((1, 1),)):
    n = secs(tau * 7)
    t = t_axis(n)
    out = np.zeros(n, np.float32)
    for ratio, g in partials:
        out += g * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t / (tau / (0.6 + ratio * 0.4)))
    return (amp * out * np.minimum(1, t / 0.001)).astype(np.float32)


def thump(f0=110, f1=55, dur=0.06, amp=1.0):
    n = secs(dur)
    t = t_axis(n)
    f = f0 + (f1 - f0) * (t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur / 3))
    return (amp * s).astype(np.float32)


# ---------- composite ASMR sounds
def spray_pump():
    n = secs(0.5)
    hiss = bp(noise(n), 2500, 11000) * env(n, 0.006, 0.22)
    hiss *= (1 - 0.35 * np.exp(-t_axis(n) / 0.04))
    trig = np.zeros(n, np.float32)
    c = click(0.004, 1200, 5000, 0.8)
    trig[:len(c)] += c
    pff = lp(noise(n), 900) * env(n, 0.01, 0.12) * 0.5
    return hiss * 0.9 + trig + pff


def mist_landing(dur=1.2, density=60):
    n = secs(dur)
    out = np.zeros(n, np.float32)
    for _ in range(int(density * dur)):
        b = bubble(rng.uniform(5000, 11000), rng.uniform(0.0008, 0.002), amp=rng.uniform(.05, .18))
        i = int(rng.uniform(0, n - len(b)) * rng.uniform(.3, 1))
        out[i:i + len(b)] += b
    return out


def foam_pump():
    n = secs(0.6)
    squelch = lp(noise(n), 1400) * env(n, 0.02, 0.25) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * t_axis(n)))
    g = thump(260, 120, 0.12, 0.6)
    out = squelch * 0.8
    out[:len(g)] += g
    out += foam_fizz(0.6, 380, start_fade=0.1)
    return out


def foam_fizz(dur, rate, start_fade=0.0, lo=2500, hi=9000):
    """Dense tiny bubble pops: the 'fizz' of foam."""
    n = secs(dur)
    out = np.zeros(n + secs(0.05), np.float32)
    count = int(rate * dur)
    starts = np.sort(rng.uniform(0, n, count)).astype(int)
    for i in starts:
        b = bubble(rng.uniform(lo, hi), rng.uniform(0.001, 0.004), amp=rng.uniform(0.02, 0.12))
        out[i:i + len(b)] += b[:len(out) - i]
    out = out[:n]
    if start_fade:
        out *= np.minimum(1, t_axis(n) / start_fade)
    return out


def squish_layer(dur, motion):
    """Wet squishy rubbing, amplitude follows a motion-speed curve (array len n, 0..1)."""
    n = secs(dur)
    base = bp(noise(n), 300, 2600) * 0.55 + bp(noise(n), 2600, 7000) * 0.25
    wet = lp(noise(n), 500) * 0.6
    return (base + wet) * motion


def water_rinse(dur):
    n = secs(dur)
    t = t_axis(n)
    mod = 0.65 + 0.35 * lp(noise(n), 6, 2) * 40
    stream = (bp(noise(n), 300, 5000) * 0.35 + lp(noise(n), 300) * 0.25) * np.clip(mod, 0.2, 1.2)
    stream *= env(n, 0.35, 0.8)
    out = stream.copy()
    for _ in range(int(dur * 22)):
        b = bubble(rng.uniform(450, 1600), rng.uniform(0.01, 0.04), sigma=rng.uniform(3, 9), amp=rng.uniform(.05, .22))
        i = int(rng.uniform(0, n - len(b)))
        out[i:i + len(b)] += b * env(n, 0.35, 0.8)[i]
    return out


def brush_stroke(dur):
    n = secs(dur)
    t = t_axis(n) / dur
    speed = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.5  # ease in/out
    body = bp(noise(n), 700, 4500) * 0.7 + bp(noise(n), 4500, 10000) * 0.2
    goo = lp(noise(n), 350) * 0.5
    out = (body + goo) * speed
    # sticky micro-clicks
    for _ in range(int(dur * 90)):
        c = click(rng.uniform(0.0008, 0.002), 2000, 9000, rng.uniform(.05, .25))
        i = int(rng.uniform(0, n - len(c)))
        out[i:i + len(c)] += c * speed[i]
    smack = thump(220, 90, 0.07, 0.45)
    out[:len(smack)] += smack
    return out


def crackle(dur, rate_from, rate_to, amp=0.35, lo=1800, hi=9000, tau=(0.0006, 0.0025)):
    n = secs(dur)
    out = np.zeros(n + secs(0.03), np.float32)
    t = 0.0
    while t < dur:
        r = rate_from + (rate_to - rate_from) * (t / dur)
        t += rng.exponential(1 / max(r, 1e-3))
        if t >= dur:
            break
        i = int(t * SR)
        f = rng.uniform(lo, hi)
        b = ring(f, rng.uniform(*tau), amp * rng.uniform(.25, 1))
        c = click(0.0008, 2000, 12000, amp * rng.uniform(.1, .4))
        m = min(len(b), len(c)); b[:m] += c[:m]
        out[i:i + len(b)] += b[:len(out) - i]
    return out[:n]


def peel_layer(dur, speed):
    """Sticky peel: micro-pop density and tearing noise follow the peel speed (array len n, 0..1)."""
    n = secs(dur)
    out = np.zeros(n + secs(0.03), np.float32)
    i = 0
    while i < n:
        s = speed[min(i, n - 1)]
        rate = 40 + 1400 * s
        i += int(rng.exponential(1 / rate) * SR) + 1
        if i >= n:
            break
        f = rng.uniform(1200, 7000)
        b = ring(f, rng.uniform(0.0005, 0.002), rng.uniform(.08, .32) * (0.4 + s))
        out[i:i + len(b)] += b[:len(out) - i]
    out = out[:n]
    tear = (bp(noise(n), 900, 4200) * 0.35 + bp(noise(n), 4200, 9000) * 0.12) * speed
    return out + tear


def plug_snap(amp=1.0):
    """A blackhead plug letting go: crisp pop with a tiny wet tail."""
    out = np.zeros(secs(0.12), np.float32)
    c = click(0.0015, 1500, 9000, 0.9 * amp)
    out[:len(c)] += c
    r = ring(rng.uniform(2200, 3400), 0.004, 0.6 * amp)
    out[:len(r)] += r
    th = thump(180, 70, 0.04, 0.35 * amp)
    out[:len(th)] += th
    w = bubble(rng.uniform(1500, 2500), 0.008, sigma=6, amp=0.25 * amp)
    out[secs(0.01):secs(0.01) + len(w)] += w
    return out


def metal_tap(amp=0.25):
    return ring(rng.uniform(4200, 5200), 0.03, amp, partials=((1, 1), (2.76, .5), (5.4, .25)))


def extractor_press(dur=0.45):
    n = secs(dur)
    sq = lp(noise(n), 900) * env(n, 0.15, 0.2) * 0.45 + bp(noise(n), 1500, 4000) * env(n, 0.2, 0.15) * 0.15
    return sq


def drop_plop(amp=0.8):
    out = np.zeros(secs(0.25), np.float32)
    b = bubble(rng.uniform(550, 750), 0.035, sigma=14, amp=amp)
    out[:len(b)] += b
    sp = hp(noise(secs(0.04)), 2500) * np.exp(-t_axis(secs(0.04)) / 0.008) * 0.25 * amp
    out[:len(sp)] += sp
    return out


def dropper_squeeze():
    n = secs(0.35)
    rub = bp(noise(n), 400, 1800) * env(n, 0.08, 0.15) * 0.25
    sq = ring(1250, 0.02, 0.05)
    rub[secs(0.05):secs(0.05) + len(sq)] += sq
    return rub


def pat(amp=0.7):
    n = secs(0.12)
    th = lp(noise(n), 650) * np.exp(-t_axis(n) / 0.018) * amp
    tb = thump(140, 80, 0.05, 0.4 * amp); th[:len(tb)] += tb
    wet = click(0.002, 3000, 9000, 0.22 * amp)
    th[:len(wet)] += wet
    return th


def chime():
    n = secs(2.6)
    t = t_axis(n)
    out = np.zeros(n, np.float32)
    for f, g, d in [(1568, .5, 1.6), (2093, .4, 1.4), (2637, .35, 1.2), (3136, .25, 1.0), (4186, .15, .8)]:
        out += g * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / d) * np.minimum(1, t / 0.02)
    shimmer = bp(noise(n), 6000, 11000) * np.exp(-t / 0.4) * 0.012
    return out * 0.35 + shimmer


def room_tone(dur):
    n = secs(dur)
    return lp(noise(n, 'pink'), 1200) * 0.004 + bp(noise(n), 2000, 6000) * 0.0008


# ---------- mixing
class Mix:
    def __init__(self, dur):
        self.n = secs(dur)
        self.L = np.zeros(self.n, np.float32)
        self.R = np.zeros(self.n, np.float32)

    def add(self, x, at, pan=0.0, gain=1.0):
        """pan: number (-1..1) or array the same length as x for moving sounds."""
        i = secs(at)
        if i >= self.n:
            return
        x = x[:self.n - i] * gain
        p = np.asarray(pan, dtype=np.float32)
        if p.ndim:
            p = p[:len(x)]
        ang = (np.clip(p, -1, 1) + 1) * np.pi / 4
        self.L[i:i + len(x)] += x * np.cos(ang)
        self.R[i:i + len(x)] += x * np.sin(ang)

    def add_stereo(self, xl, xr, at, gain=1.0):
        i = secs(at)
        m = min(len(xl), self.n - i)
        self.L[i:i + m] += xl[:m] * gain
        self.R[i:i + m] += xr[:m] * gain

    def reverb(self, mix=0.12, tau=0.12, length=0.6):
        n = secs(length)
        t = t_axis(n)
        for ch in ('L', 'R'):
            ir = noise(n) * np.exp(-t / tau)
            ir = lp(ir, 6000)
            ir /= np.sqrt(np.sum(ir ** 2))
            dry = getattr(self, ch)
            wet = signal.fftconvolve(dry, ir)[:self.n].astype(np.float32)
            setattr(self, ch, dry * (1 - mix * .5) + wet * mix)

    def master(self, peak=0.9):
        x = np.stack([self.L, self.R], 1)
        x = hp(x.T, 25, 2).T  # remove rumble/DC
        x = lp(x.T, 15000, 2).T  # soften the very top end
        m = np.max(np.abs(x)) + 1e-9
        x = x / m * peak
        x = np.tanh(x * 1.1) / np.tanh(1.1)  # gentle soft clip
        return x

    def write(self, path):
        from scipy.io import wavfile
        x = self.master()
        wavfile.write(path, SR, (x * 32767).astype(np.int16))
