#!/usr/bin/env python3
"""Quality check for the narration: transcribe every spoken line with speech recognition,
and re-record (up to N takes) any line that does not match the script, keeping the clearest take.

Usage: python3 retake.py <work_dir> --voice <voice.onnx> [--takes 4] [--speed 1.08]
Run it after build.py, then run build.py again (it reuses the improved audio).
"""
import argparse, difflib, glob, io, re, subprocess, wave
import numpy as np
from num2words import num2words
from faster_whisper import WhisperModel
from piper import PiperVoice, SynthesisConfig


def words(t):
    t = t.lower().replace("%", " percent ").replace("×", " times ").replace("-", " ")
    t = re.sub(r"(\d+)\.(\d+)", lambda m: num2words(int(m[1])) + " point " + " ".join(num2words(int(d)) for d in m[2]), t)
    t = re.sub(r"\d+", lambda m: num2words(int(m[0])), t)
    t = t.replace("nought", "zero").replace("colour", "color").replace("sulph", "sulf")
    return re.sub(r"[^a-z ]", " ", t).replace(" and ", " ").split()


def score(want, got):
    return difflib.SequenceMatcher(None, words(want), words(got)).ratio()


def load16(raw_wav_bytes):
    with wave.open(io.BytesIO(raw_wav_bytes)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        sr = w.getframerate()
    return np.interp(np.arange(0, len(a), sr / 16000), np.arange(len(a)), a).astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work"); ap.add_argument("--voice", required=True)
    ap.add_argument("--takes", type=int, default=4); ap.add_argument("--speed", type=float, default=1.08)
    ap.add_argument("--threshold", type=float, default=0.85)
    a = ap.parse_args()
    asr = WhisperModel("base.en", device="cpu", compute_type="int8")
    voice = PiperVoice.load(a.voice)
    cfg = SynthesisConfig(length_scale=a.speed)
    hear = lambda b: " ".join(s.text for s in asr.transcribe(load16(b), beam_size=5, language="en")[0])
    fixed = still = 0
    for txt in sorted(glob.glob(f"{a.work}/wav/[0-9]*.txt")):
        wp = txt[:-4] + ".wav"
        spoken = open(txt).read().rsplit("|", 1)[0]
        best = open(wp, "rb").read()
        best_s = score(spoken, hear(best))
        if best_s >= a.threshold:
            continue
        start = best_s
        for _ in range(a.takes):
            b = io.BytesIO()
            with wave.open(b, "wb") as w:
                voice.synthesize_wav(spoken, w, syn_config=cfg)
            s = score(spoken, hear(b.getvalue()))
            if s > best_s:
                best, best_s = b.getvalue(), s
            if best_s >= a.threshold:
                break
        open(wp, "wb").write(best)
        if best_s >= a.threshold:
            fixed += 1
        else:
            still += 1
            print(f"{best_s:.2f} (was {start:.2f}) {txt.rsplit('/',1)[-1]}: {spoken}")
    print(f"re-recorded and fixed: {fixed}; still below threshold: {still}")


if __name__ == "__main__":
    main()
