# ASMR Shorts

Animated "satisfying skincare" Shorts (vertical, 1080×1920, 60 fps, under 60 s).
Everything is generated from one timeline file, so each sound lands on its frame.

## How a short is built
| File | What it does |
|---|---|
| `short-XX/events.json` | The timeline: when each step happens and where on the face. **Edit this to re-time anything.** |
| `short-XX/sound.py` | Builds the soundtrack from `events.json` using the sound library `synth.py`. |
| `short-XX/short.html` | The animation, drawn on a canvas from the same `events.json`. Open it in a browser to preview (`?t=20&play`, space = pause, arrows = skip). |
| `render_short.js` | Renders every frame with headless Chromium and muxes with the audio. |

```bash
cd youtube-channel/asmr/short-01
python3 sound.py
ffmpeg -y -i build/raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 build/audio.wav
cd ../..
node asmr/render_short.js asmr/short-01              # full render, about 5–10 min
node asmr/render_short.js asmr/short-01 --snap 5,20  # quick still frames for checking
```

## About the sound
All sounds are synthesized (bubbles, foam fizz, brush strokes, mask crackle, peel, pops, drops, pats).
That keeps them 100% copyright-free, but real recordings are still the gold standard for ASMR.
To upgrade later, swap any generator in `sound.py` for a recorded WAV:
- record your own with a phone or a binaural mic,
- or use CC0 sounds from freesound.org.

Load the WAV with `scipy.io.wavfile.read` and `mix.add(...)` it at the same event time.

## Short 01: Deep Pore Cleanse (41 s)
Rose mist → foam cleanser → silicone scrubber → rinse → charcoal peel-off mask (brush on, dry, crackle, peel) → extractor on 5 stubborn blackheads → golden serum drops → fingertip pats → glow.

**Title:** Deep Pore Cleanse ASMR 🫧 (charcoal peel-off mask + blackhead removal)
**Description:** Satisfying deep pore cleanse, animated. 🎧 headphones on. #asmr #skincare #satisfying #blackheads #shorts
**Pinned comment idea:** "Which part was the most satisfying, the peel or the pops?" (drives comments)

## Things to know before posting
- **Label it animated.** Make it clear this is an animation, not a medical how-to.
  - Don't claim skincare results.
  - Dermatologists advise against squeezing or extracting at home.
  - A line like "animation, not skincare advice" in the description is enough.
- **Shorts pay less than long videos:** roughly $0.03–0.10 per 1,000 views.
  - Their value is reach.
  - Point viewers to the long-form channel, or build a dedicated ASMR channel.
- **Vary every short.** YouTube demonetizes "repetitive / templated" content.
  - Change the routine, the face, the colors, and the tools each time.
  - Don't just re-skin the same 41 seconds.
