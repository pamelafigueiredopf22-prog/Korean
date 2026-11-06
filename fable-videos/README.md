# Bedtime Fables — watercolor storybook videos

Gentle, animated retellings of Aesop's fables for falling asleep. Everything is
generated from code: painted watercolor scenes, character voices and a lullaby.

## Pipeline

```
fables/<name>/script.json   the story: lines, speaker, scene, pause after
fables/<name>/voices.json   one voice per character (Kokoro blend, speed, pitch)
fables/<name>/story.js      scenes, staging and timing (canvas, watercolor engine)

python3 tools/tts.py fables/<name> [--scenes a,b]   -> build/<name>/voice.wav + timeline.json
node    tools/render.js <name> --stills 5,40        -> quick still frames to check the look
node    tools/render.js <name> --video              -> build/<name>/video.mp4 (1080p, 24 fps)
python3 tools/mix.py <name>                         -> output/<name>.mp4 (voices + lullaby)
```

## Engine

- `engine/watercolor.js` — watercolor washes (layered, deformed glazes on float16 canvases),
  granulation, paper texture, wobbly ink lines, fur strokes, sprites.
- `engine/scenery.js` — trees, foliage, grass, flowers, berries, mushrooms, ferns, hills, clouds.
- `engine/characters/` — reusable characters (lion, mouse) built from painted parts that
  breathe, blink, talk (lip-sync from the voice loudness) and move.
- `engine/fonts/` — IM Fell English (SIL Open Font License).

## Setup

- Voices: [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) (free, offline, Apache-2.0).
  `pip install kokoro-onnx soundfile`, then download `kokoro-v1.0.onnx` and `voices-v1.0.bin`
  from the kokoro-onnx releases into `$KOKORO_DIR` (default `/tmp/claude-0/models`).
- Rendering: Node + Playwright Chromium, ffmpeg (with rubberband).
- Music: numpy only; the lullaby is synthesized, so it is royalty-free.
