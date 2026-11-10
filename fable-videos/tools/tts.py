#!/usr/bin/env python3
"""Turn a fable's script.json into voiced audio clips plus a timeline.

Uses Kokoro (free, offline neural TTS). Each character gets its own voice,
speed and pitch from voices.json, and ffmpeg adds a soft, warm finish.

Usage:
  python3 tools/tts.py fables/lion-and-mouse [--scenes s1_evening,s2_caught]

Writes build/<fable>/clips/*.wav, build/<fable>/voice.wav and
build/<fable>/timeline.json (start time of every line, in seconds).
"""
import argparse, json, os, subprocess, sys
import numpy as np
import soundfile as sf

MODELS = os.environ.get("KOKORO_DIR", "/tmp/claude-0/models")
SR = 24000
LEAD_IN = 2.5   # quiet seconds before the first line
TAIL = 6.0      # quiet seconds after the last line


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def elevenlabs(text, v, speed_scale, out):
    """ElevenLabs text-to-speech. The API key is added by the session's network proxy
    (or set ELEVENLABS_API_KEY when running elsewhere)."""
    import urllib.request
    settings = {"stability": v.get("stability", 0.45), "similarity_boost": v.get("similarity", 0.75),
                "style": v.get("style", 0.35), "use_speaker_boost": True,
                "speed": max(0.7, min(1.2, v.get("speed", 1.0) * speed_scale))}
    body = json.dumps({"text": text, "model_id": v.get("model", "eleven_multilingual_v2"), "voice_settings": settings}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{v['voice_id']}?output_format=mp3_44100_128", data=body,
                                 headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected"), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        open(out, "wb").write(r.read())


def voice_style(kokoro, spec):
    """A voice can be a single name or a weighted blend {"bf_emma": 0.6, ...}."""
    if isinstance(spec, str):
        return spec
    total = sum(spec.values())
    return sum(kokoro.get_voice_style(n) * (w / total) for n, w in spec.items())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fable_dir")
    ap.add_argument("--scenes", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", default="", help="re-voice only these speakers, e.g. lion,mouse")
    ap.add_argument("--set", action="append", default=[], help='override a voice: lion=\'{"voice": "bm_george", "pitch": 0.98}\'')
    a = ap.parse_args()

    from kokoro_onnx import Kokoro
    kokoro = Kokoro(f"{MODELS}/kokoro.onnx", f"{MODELS}/voices.bin")

    fable = os.path.basename(os.path.normpath(a.fable_dir))
    script = json.load(open(os.path.join(a.fable_dir, "script.json")))
    voices = json.load(open(os.path.join(a.fable_dir, "voices.json")))
    for o in a.set:
        who, spec = o.split("=", 1)
        voices[who] = {**voices[who], **json.loads(spec)}
        voices[who].pop("pitch", None) if json.loads(spec).get("pitch") == 1.0 else None
    out = os.path.join("build", fable)
    clips = os.path.join(out, "clips")
    os.makedirs(clips, exist_ok=True)

    wanted = set(filter(None, a.scenes.split(",")))
    lines = [l for l in script["lines"] if not wanted or l["scene"] in wanted]

    lead = voices.get('lead_in', LEAD_IN)
    timeline, t = [], lead
    pieces = [np.zeros(int(lead * SR), dtype=np.float32)]
    for line in lines:
        v = voices[line["speaker"]]
        final = os.path.join(clips, f"{line['id']}.wav")
        only = set(filter(None, a.only.split(",")))
        if (a.force and (not only or line["speaker"] in only)) or not os.path.exists(final):
            raw = os.path.join(clips, f"{line['id']}.raw" + (".mp3" if v.get("engine") == "elevenlabs" else ".wav"))
            if v.get("engine") == "elevenlabs":
                elevenlabs(line["text"], v, line.get("speed_scale", 1.0), raw)
            else:
                audio, sr = kokoro.create(line["text"], voice=voice_style(kokoro, v["voice"]),
                                          speed=v.get("speed", 1.0) * line.get("speed_scale", 1.0), lang=v.get("lang", "en-us"))
                sf.write(raw, audio, sr)
            filters = []
            if v.get("pitch", 1.0) != 1.0:
                filters.append(f"rubberband=pitch={v['pitch']}:formant=preserved")
            filters += v.get("filters", [])
            filters.append(f"aresample={SR}")
            run(["ffmpeg", "-y", "-i", raw, "-af", ",".join(filters), "-ac", "1", final])
            os.remove(raw)
        audio, _ = sf.read(final, dtype="float32")
        audio *= v.get("gain", 1.0)
        dur = len(audio) / SR
        # loudness envelope at 24 fps, for lip-sync
        hop = SR // 24
        env = [float(np.sqrt(np.mean(audio[i:i + hop] ** 2))) for i in range(0, len(audio), hop)]
        peak = max(env) or 1.0
        env = [round(min(1.0, e / (peak * 0.7)), 2) for e in env]
        timeline.append({**line, "start": round(t, 3), "end": round(t + dur, 3), "env": env})
        pause = line.get("pause", 1.0) * voices.get("pause_scale", 1.0)
        pieces += [audio, np.zeros(int(pause * SR), dtype=np.float32)]
        t += dur + pause
        print(f"{t:7.2f}s  {line['speaker']:8s} {line['text'][:60]}", file=sys.stderr)

    pieces.append(np.zeros(int(TAIL * SR), dtype=np.float32))
    voice = np.concatenate(pieces)
    sf.write(os.path.join(out, "voice.wav"), voice, SR)
    duration = len(voice) / SR
    json.dump({"title": script["title"], "duration": round(duration, 3), "lines": timeline},
              open(os.path.join(out, "timeline.json"), "w"), indent=1)
    print(f"total {duration:.1f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
