#!/usr/bin/env python3
"""A very soft solo violin playing Brahms' Lullaby (public domain), synthesised from scratch.

Each note is a bowed tone: a rich harmonic series (like a bowed string), a slow bow swell,
a gentle delayed vibrato and a little bow noise, shaped by a violin-body resonance and a
warm room. Written as a track as long as the video, silent except between --start and --end.

  python3 tools/violin.py <video_seconds> <start> <end> <out.wav> [--key A] [--beat 0.62]
"""
import argparse
import numpy as np
import soundfile as sf

SR = 44100
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
# Brahms' Wiegenlied, written in C (MIDI numbers, beats in 3/4)
E4, F4, G4, A4, B4, C5, D4, C4 = 64, 65, 67, 69, 71, 72, 62, 60
TUNE = [
    (E4, .5), (E4, .5), (G4, 3), (E4, .5), (E4, .5), (G4, 3),
    (E4, .5), (G4, .5), (C5, 1.5), (B4, .5), (A4, 1), (A4, 1), (G4, 2),
    (D4, .5), (E4, .5), (F4, 2), (D4, 1), (D4, .5), (E4, .5), (F4, 2.5),
    (D4, .5), (F4, .5), (B4, 1), (A4, 1), (G4, 1), (B4, 1), (C5, 3),
    (C4, .5), (C4, .5), (C5, 2), (A4, 1), (F4, 1), (G4, 3),
    (E4, .5), (C4, .5), (F4, 1), (G4, 1), (A4, 1), (G4, 3),
    (C4, .5), (C4, .5), (C5, 2), (A4, 1), (F4, 1), (G4, 3),
    (E4, .5), (C4, .5), (F4, 1), (E4, 1), (D4, 1), (C4, 4),
]


def bowed(f, dur, rng):
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    # vibrato: arrives after the note settles, ~5.3 Hz, very gentle
    vib = 1 + 0.0045 * np.sin(2 * np.pi * 5.3 * t + rng.uniform(0, 6)) * np.clip((t - 0.25) / 0.4, 0, 1)
    phase = 2 * np.pi * f * np.cumsum(vib) / SR
    tone = np.zeros(n)
    for h in range(1, 16):
        if f * h > 7000: break
        amp = (1 / h) * (1.0 if h % 2 else 0.85) * np.exp(-h * 0.12)
        tone += amp * np.sin(h * phase + rng.uniform(0, 6))
    noise = np.convolve(rng.standard_normal(n), np.ones(6) / 6, 'same') * 0.02  # a hint of bow hair
    # the bow: slow attack, a soft swell in the middle, gentle release
    a, r = min(0.22, dur * 0.4), 0.35
    env = np.clip(t / a, 0, 1) ** 1.6
    env *= 1 + 0.15 * np.sin(np.pi * np.clip(t / max(dur, 0.1), 0, 1))
    env *= np.clip((dur + r - t) / r, 0, 1) ** 1.3
    return (tone + noise) * env


def body(x):
    # violin-body resonances (around 280, 460, 2800 Hz) and a soft top, done in the frequency domain
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    gain = 0.35 + sum(g * np.exp(-((f - c) / w) ** 2) for c, w, g in [(280, 90, 0.9), (460, 120, 0.8), (1100, 400, 0.35), (2800, 700, 0.45)])
    gain *= 1 / (1 + (f / 5200) ** 4)
    return np.fft.irfft(X * gain, len(x))


def reverb(x, seconds=2.4, mix=0.38, seed=5):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.0); ir[: int(0.015 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << (len(x) + n - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return (1 - mix) * x + mix * wet * 0.7


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('seconds', type=float); ap.add_argument('start', type=float); ap.add_argument('end', type=float); ap.add_argument('out')
    ap.add_argument('--key', default='A'); ap.add_argument('--beat', type=float, default=0.66)
    a = ap.parse_args()
    rng = np.random.default_rng(7)
    shift = NOTE[a.key]
    shift = shift if shift <= 6 else shift - 12   # C -> A is down a minor third
    shift += 12                                   # up an octave: the violin's sweet register
    out = np.zeros(int((a.seconds + 4) * SR))
    t = a.start
    while t < a.end:                              # play the tune, and again if there is time
        for midi, beats in TUNE:
            if t >= a.end: break
            dur = beats * a.beat
            f = 440 * 2 ** ((midi + shift - 69) / 12)
            x = bowed(f, dur * 0.97, rng) * rng.uniform(0.85, 1.0)
            s = int(t * SR); out[s:s + len(x)] += x[: len(out) - s]
            t += dur
        t += 2 * a.beat
    out = body(out)
    out = reverb(out)
    s0, s1 = int(a.start * SR), int(a.end * SR)
    fade = np.ones(len(out)); fade[:s0] = 0
    k = np.arange(len(out))
    fade[s1 - int(6 * SR):] *= np.clip((s1 - k[s1 - int(6 * SR):]) / (6 * SR), 0, 1)  # drifting off as he falls asleep
    out *= fade
    out = out[: int(a.seconds * SR)]
    out /= np.max(np.abs(out)) or 1
    sf.write(a.out, np.stack([out, out], 1) * 0.8, SR)


if __name__ == '__main__':
    main()
