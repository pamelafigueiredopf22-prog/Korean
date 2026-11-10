#!/usr/bin/env python3
"""Turn a spoken clip into a soft whisper in the same voice.

Linear prediction (LPC): for each short frame we keep the shape of the voice (the vocal tract
filter) but replace the buzz of the vocal cords with gentle breath noise, which is what a
whisper is. A little of the original voice is kept underneath so the words stay clear.

  python3 tools/whisper.py in.wav out.wav [--voice 0.12]
"""
import argparse
import numpy as np
import soundfile as sf


def lpc(frame, order):
    r = np.correlate(frame, frame, 'full')[len(frame) - 1:len(frame) + order]
    if r[0] <= 1e-9: return np.zeros(order + 1), 0.0
    a = np.zeros(order + 1); a[0] = 1.0; e = r[0]
    for i in range(1, order + 1):  # Levinson-Durbin
        k = -(r[i] + np.dot(a[1:i], r[i - 1:0:-1])) / e
        a[1:i] = a[1:i] + k * a[i - 1:0:-1]; a[i] = k
        e *= (1 - k * k)
        if e <= 1e-12: break
    return a, max(e, 0.0)


def allpole(a, x, zi):
    y = np.zeros_like(x); order = len(a) - 1; mem = zi.copy()
    for n in range(len(x)):
        v = x[n] - np.dot(a[1:], mem)
        y[n] = v; mem[1:] = mem[:-1]; mem[0] = v
    return y, mem


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('inp'); ap.add_argument('out')
    ap.add_argument('--voice', type=float, default=0.12); ap.add_argument('--order', type=int, default=26)
    a = ap.parse_args()
    x, sr = sf.read(a.inp, dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    pre = np.append(x[0], x[1:] - 0.94 * x[:-1])
    N = int(0.025 * sr); hop = N // 2; win = np.hanning(N)
    rng = np.random.default_rng(3)
    out = np.zeros(len(pre) + N); norm = np.zeros(len(pre) + N); mem = np.zeros(a.order)
    for s in range(0, len(pre) - N, hop):
        fr = pre[s:s + N] * win
        coef, err = lpc(fr, a.order)
        g = np.sqrt(err / N)
        noise = rng.standard_normal(N) * g
        y, mem = allpole(coef, noise, mem)
        out[s:s + N] += y * win; norm[s:s + N] += win ** 2
    w = out[:len(pre)] / np.maximum(norm[:len(pre)], 1e-6)
    # de-emphasis
    for n in range(1, len(w)): w[n] += 0.94 * w[n - 1]
    w *= np.sqrt(np.mean(x ** 2) / max(np.mean(w ** 2), 1e-12)) * 0.75
    y = (1 - a.voice) * w + a.voice * x
    y /= max(1.0, np.abs(y).max() / 0.9)
    sf.write(a.out, y.astype(np.float32), sr)


if __name__ == '__main__':
    main()
