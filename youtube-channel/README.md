# Animated psychology channel

Animated explainers made entirely from code: original characters, no stock footage and no third-party art.

| Folder | What it is |
|---|---|
| `engine/` | Shared tools: `core.js` (characters, props, drawing helpers), `page.html`, `build.js` (narration → timeline), `render.js` (frames → MP4), `kokoro_tts.py` (AI voice) |
| `video-01/` | Introvert, Shy, or Socially Anxious? |
| `video-02/` | Why You Can't Forget That Embarrassing Moment |

Each video folder has `script.json` (the narration, which you edit), `scenes.js` (its animation), `SCRIPT.md` (the generated recording sheet), `UPLOAD.md` (title, description, sources and settings) and `build/` (outputs, not in git).

## Make a video
```bash
npm install                          # fonts
pip install kokoro-onnx soundfile    # free AI narrator voice (Kokoro, Apache-2.0)
node engine/build.js video-02        # audio, timeline, captions, chapters
node engine/render.js video-02       # → video-02/build/video-02.mp4  (~5 min on 4 cores)
node engine/render.js video-02 --thumb          # → build/thumbnail.png
node engine/render.js video-02 --snap lines     # still frames, one per narration line, for checking
```
Preview in a browser: serve this folder (`python3 -m http.server`) and open `engine/page.html?v=video-02&t=60` (space plays).

The voice model isn't in git. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` into `voices/` from github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0).
To change the voice: `VOICE=am_michael node engine/build.js video-02`. Good options: `af_heart` (default, best rated), `af_bella`, `am_michael`, `bf_emma`, `bm_george`. `SPEED=0.92` is the default.

## Use your own voice (recommended)
1. Read the video's `SCRIPT.md`. Record each numbered line as its own file in `<video>/voice/`, e.g. `voice/open_1.wav` (wav, mp3, m4a or ogg).
2. Run `build.js` and `render.js` again. The animation re-times itself to your recording, and any line you haven't recorded falls back to the AI voice.

## Fact-check notes
Every claim is checked against its source before rendering. The hedged wording ("many introverts describe…", "popular estimates…", "still debated") is deliberate, because the evidence behind those points is softer. Keep it if you edit a script. Sources are listed in each `UPLOAD.md`.
