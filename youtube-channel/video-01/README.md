# Video 01: Introvert, Shy, or Socially Anxious?

An animated explainer, made entirely from code: original characters, no stock footage and no third-party art.

| File | What it is |
|---|---|
| `script.json` | The narration, split into scenes and lines. **Edit this to change the words.** |
| `SCRIPT.md` | The same script as a recording sheet (generated). |
| `render.html` | The animation: characters, scenes and the timing of each scene. Open it in a browser to preview (`?t=60` jumps to 1:00, space plays). |
| `build.js` | Turns the narration into audio + `build/timeline.json` + captions + chapters. |
| `render.js` | Renders every frame and encodes `build/video-01.mp4` with the narration. |
| `UPLOAD.md` | Title, description, sources, tags and YouTube settings. |

## Make the video
```bash
npm install                 # fonts (and playwright, if not installed)
pip install piper-tts       # scratch AI voice (only needed for lines you haven't recorded)
node build.js               # audio + timeline
node render.js              # → build/video-01.mp4  (~6 min on 4 cores)
node thumb.js               # → build/thumbnail.png (needs: python3 -m http.server 8765)
```
The scratch voice model (`voices/en_US-ryan-medium.onnx`, about 60 MB) isn't in git. Download it from huggingface.co/rhasspy/piper-voices (en/en_US/ryan/medium).

## Use your own voice (recommended)
1. Read `SCRIPT.md`. Record each numbered line as its own file in `voice/`, e.g. `voice/open_1.wav`, `voice/open_2.m4a`, … (wav, mp3, m4a or ogg).
2. Run `node build.js && node render.js`. The animation re-times itself to your recording, and any line you haven't recorded falls back to the AI voice.
