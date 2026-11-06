#!/usr/bin/env python3
"""A soft, slow lullaby bed (warm pads + sparse music box), generated from scratch.

Royalty-free by construction, so it is safe for YouTube.

  python3 tools/music.py <seconds> <out.wav> [--seed 3] [--key F]
"""
import argparse
import numpy as np
import soundfile as sf

SR = 44100
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(n, attack, release):
    e = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    e[:a] = np.linspace(0, 1, a) ** 2
    e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def pad_note(f, dur, rng):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.12, 0.0, 0.11):           # gentle chorus
        ff = f * 2 ** (det / 12)
        ph = rng.uniform(0, 6.28)
        out += np.sin(2 * np.pi * ff * t + ph) + 0.18 * np.sin(4 * np.pi * ff * t + ph)
    out *= 1 + 0.15 * np.sin(2 * np.pi * 0.17 * t)  # slow breathing swell
    return out * env(n, 2.2, 2.8) / 3


def bell(f, dur=3.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 3)
            + 0.12 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 6))
    return tone * np.exp(-t * 1.6) * env(n, 0.004, 0.3)


def reverb(x, seconds=3.0, mix=0.35, seed=1):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    size = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return (1 - mix) * x + mix * wet * 0.6


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('seconds', type=float)
    ap.add_argument('out')
    ap.add_argument('--seed', type=int, default=3)
    ap.add_argument('--key', default='F')
    ap.add_argument('--bpm', type=float, default=58)
    a = ap.parse_args()
    rng = np.random.default_rng(a.seed)
    root = 48 + NOTE[a.key]
    beat = 60 / a.bpm
    bar = 4 * beat
    # I - vi - IV - V, then I - iii - IV - I  (scale degrees as semitone triads)
    prog = [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14], [0, 4, 7], [4, 7, 11], [5, 9, 12], [0, 4, 7]]
    scale = [0, 2, 4, 5, 7, 9, 11]
    n = int((a.seconds + 4) * SR)
    pads, box = np.zeros(n), np.zeros(n)
    t, i = 0.0, 0
    while t < a.seconds:
        chord = prog[i % len(prog)]
        s = int(t * SR)
        for k, iv in enumerate(chord + [chord[0] + 12]):
            x = pad_note(hz(root + iv), bar + 2.5, rng) * (0.9 if k else 1.1)
            pads[s:s + len(x)] += x[: n - s]
        # sparse music-box melody over the chord: a few notes per bar, sometimes a rest
        for b in range(4):
            if rng.random() < (0.55 if b % 2 == 0 else 0.25):
                pick = chord[rng.integers(0, 3)] if rng.random() < 0.7 else scale[rng.integers(0, 7)]
                m = root + 24 + pick + (12 if rng.random() < 0.25 else 0)
                x = bell(hz(m)) * rng.uniform(0.5, 0.85)
                st = int((t + b * beat + rng.normal(0, 0.02)) * SR)
                if 0 <= st < n:
                    box[st:st + len(x)] += x[: n - st]
        t += bar
        i += 1
    mix = 0.55 * pads / (np.max(np.abs(pads)) or 1) + 0.32 * box / (np.max(np.abs(box)) or 1)
    mix = reverb(mix, seed=a.seed)
    # soften the top end, like an old music box in another room
    k = np.exp(-np.arange(64) / 6.0); k /= k.sum()
    mix = np.convolve(mix, k, mode='same')
    mix = mix[: int(a.seconds * SR)]
    fade = int(6 * SR)
    mix[:int(3 * SR)] *= np.linspace(0, 1, int(3 * SR))
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix /= np.max(np.abs(mix)) or 1
    sf.write(a.out, np.stack([mix, mix], axis=1) * 0.8, SR)


if __name__ == '__main__':
    main()
