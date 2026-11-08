#!/usr/bin/env python3
"""Build a narrated revision video from a lesson script.

Usage: python3 build.py <script.txt> <output.mp4> --voice <voice.onnx> [--work DIR] [--only N]

Script format (one item per line):
  @chapter Name                     start a new chapter (for chapter markers)
  @scene SUBJECT | Topic | Title    start a new screen
  @title Big heading | small line   a centred title card screen
  @need text                        "You need first:" line under the title
  @box Heading | line | line        rule box on the right
  @diagram name                     diagram on the right (see diagrams.py)
  - screen text >> narration        a step: the line appears and is highlighted while spoken
  - >> narration                    narration only (no new line on screen)
  @pause N                          hold the last step N extra seconds
Lines starting with # are comments.
"""
import argparse, html, json, os, re, subprocess, sys, wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from diagrams import DIAGRAMS  # noqa: E402

W, H = 1920, 1080
GAP = 0.65        # silence after each spoken step (seconds)
LEAD = 0.4        # silence at the start of each screen
SR = 22050

# How the voice should say symbols. Subtitles keep the written form.
SAY = [
    ("CO₂", "C O two"), ("H₂O", "H two O"), ("CH₄", "C H four"), ("SO₂", "S O two"),
    ("NOₓ", "N O X"), ("NH₃", "N H three"), ("N₂", "N two"), ("H₂", "H two"), ("O₂", "O two"),
    ("Cl₂", "C L two"), ("C₂H₄", "C two H four"), ("C₂H₆", "C two H six"), ("C₃H₈", "C three H eight"),
    ("C₄H₁₀", "C four H ten"), ("C₁₀H₂₂", "C ten H twenty-two"), ("C₈H₁₈", "C eight H eighteen"),
    ("CₙH₂ₙ₊₂", "C n H two n plus two"), ("CₙH₂ₙ", "C n H two n"),
    ("Rf", "R F"), ("HCF", "H C F"), ("LCM", "L C M"), ("BIDMAS", "bid mass"), ("SOH CAH TOA", "soh cah toa"),
    ("LCA", "L C A"), ("IQR", "I Q R"), ("UV", "U V"), ("KFC", "K F C"),
    ("cm³", "centimetres cubed"), ("cm²", "centimetres squared"), ("m²", "metres squared"), ("m³", "metres cubed"),
    ("x²", "x squared"), ("x³", "x cubed"), ("n²", "n squared"), ("r²", "r squared"),
    ("a²", "a squared"), ("b²", "b squared"), ("c²", "c squared"), ("k²", "k squared"), ("k³", "k cubed"),
    ("√", "root "), ("π", "pi"), ("°", " degrees"), ("%", " percent"), ("÷", " divided by "),
    ("×", " times "), ("≤", " is less than or equal to "), ("≥", " is greater than or equal to "),
    ("⇌", " reversible arrow "), ("→", " to "), ("−", " minus "), ("–", ", "), ("—", ", "),
]


def to_speech(t):
    for a, b in SAY:
        t = t.replace(a, b)
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    return re.sub(r"\s+", " ", t).strip()


def md(t):
    t = html.escape(t)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)


def parse(path):
    scenes, chapter = [], None
    cur = None
    for raw in Path(path).read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("@chapter"):
            chapter = line[8:].strip()
            continue
        if line.startswith("@scene") or line.startswith("@title"):
            kind = "scene" if line.startswith("@scene") else "title"
            parts = [p.strip() for p in line[6:].split("|")]
            cur = {"kind": kind, "parts": parts, "need": None, "box": None, "diagram": None,
                   "steps": [], "chapter": chapter}
            chapter = None
            scenes.append(cur)
            continue
        if line.startswith("@need"):
            cur["need"] = line[5:].strip()
        elif line.startswith("@box"):
            cur["box"] = [p.strip() for p in line[4:].split("|")]
        elif line.startswith("@diagram"):
            cur["diagram"] = line[8:].strip()
        elif line.startswith("@pause"):
            cur["steps"][-1]["pause"] += float(line[6:])
        elif line.startswith("-"):
            body = line[1:]
            screen, _, say = body.partition(">>")
            cur["steps"].append({"screen": screen.strip(), "say": say.strip(), "pause": 0.0})
        else:
            raise SystemExit(f"Cannot parse line: {raw}")
    return scenes


CSS = """
*{box-sizing:border-box}
body{margin:0;width:1920px;height:1080px;background:#0f1420;color:#eef1f7;font-family:'Inter','Segoe UI',Roboto,system-ui,sans-serif;position:relative;overflow:hidden}
.top{position:absolute;top:0;left:0;right:0;height:96px;background:#1a2133;display:flex;align-items:center;padding:0 60px;font-size:34px;gap:24px}
.pill{padding:6px 18px;border-radius:30px;font-size:26px;font-weight:700;color:#fff}
h1{position:absolute;top:128px;left:100px;right:100px;margin:0;font-size:60px;line-height:1.15}
.need{position:absolute;top:215px;left:100px;font-size:32px;color:#9aa4b8}
.need b{color:#ffd166;font-weight:600}
.steps{position:absolute;top:290px;left:100px;bottom:250px;line-height:1.38}
.steps div{margin-bottom:10px}
.done{color:#c4ccdb;opacity:.62}.now{color:#ffd166}
.steps b{color:#fff}.now b{color:#ffe7a3}
.side{position:absolute;right:90px;top:290px;width:600px;bottom:250px;display:flex;align-items:flex-start;justify-content:center}
.box{width:100%;background:#1a2133;border:3px solid var(--acc);border-radius:24px;padding:30px 34px;font-size:36px;line-height:1.45}
.box .bh{color:var(--acc2);font-weight:700;margin-bottom:6px}
.side svg{width:100%;height:auto;max-height:100%}
.sub{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.78);padding:14px 30px;border-radius:12px;font-size:34px;width:max-content;max-width:1640px;text-align:center;line-height:1.35}
.prog{position:absolute;bottom:0;left:0;height:10px;background:var(--acc)}
.tc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 140px}
.tc h2{font-size:96px;margin:0 0 24px}.tc p{font-size:44px;color:#9aa4b8;margin:0}
.tc .tsteps{margin-top:40px;font-size:42px;line-height:1.5}
"""


def frame_html(sc, k, progress):
    subj = sc["parts"][0] if sc["kind"] == "scene" else ""
    chem = "CHEM" in subj.upper() or sc.get("subject_hint") == "CHEM"
    acc, acc2 = ("#0f8a6a", "#3cc79f") if chem else ("#3a5bd9", "#7d98ff")
    step = sc["steps"][k]
    sub = f'<div class="sub">{md(step["say"])}</div>' if step["say"] else ""
    prog = f'<div class="prog" style="width:{progress*100:.2f}%"></div>'
    if sc["kind"] == "title":
        title, small = (sc["parts"] + [""])[:2]
        lines = "".join(f'<div class="{"now" if i == k else "done"}">{md(s["screen"])}</div>'
                        for i, s in enumerate(sc["steps"][:k + 1]) if s["screen"])
        body = f'<div class="tc"><h2 style="color:{acc2}">{md(title)}</h2><p>{md(small)}</p><div class="tsteps">{lines}</div></div>'
    else:
        _, topic, title = (sc["parts"] + ["", ""])[:3]
        need = f'<div class="need">You need first: <b>{md(sc["need"])}</b></div>' if sc["need"] else ""
        side = ""
        if sc["diagram"]:
            side = f'<div class="side">{DIAGRAMS[sc["diagram"]]}</div>'
        elif sc["box"]:
            bl = "".join(f"<div>{md(x)}</div>" for x in sc["box"][1:])
            side = f'<div class="side"><div class="box"><div class="bh">{md(sc["box"][0])}</div>{bl}</div></div>'
        right = "720px" if side else "100px"
        lines = "".join(f'<div class="{"now" if i == k else "done"}">{md(s["screen"])}</div>'
                        for i, s in enumerate(sc["steps"][:k + 1]) if s["screen"])
        top = sc["need"] and "290px" or "250px"
        body = (f'<div class="top"><span class="pill" style="background:{acc}">{md(subj)} · {md(topic)}</span>{md(title)}</div>'
                f'<h1>{md(title)}</h1>{need}<div class="steps" id="st" style="right:{right};top:{top}">{lines}</div>{side}')
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>'
            f'<body style="--acc:{acc};--acc2:{acc2}">{body}{sub}{prog}'
            '<script>(function(){const s=document.getElementById("st");if(s){let f=50;s.style.fontSize=f+"px";'
            'while(s.scrollHeight>s.clientHeight&&f>26){f-=2;s.style.fontSize=f+"px";}}})();</script></body></html>')


def wav_len(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def silence(p, secs):
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"\x00\x00" * int(secs * SR))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("out")
    ap.add_argument("--voice", required=True)
    ap.add_argument("--work", default=None)
    ap.add_argument("--speed", type=float, default=1.08, help="length scale: >1 is slower")
    ap.add_argument("--only", type=int, default=None, help="build only the first N scenes (preview)")
    ap.add_argument("--subject", default="", help="CHEM or MATHS colours for title cards")
    a = ap.parse_args()

    scenes = parse(a.script)
    if a.only:
        scenes = scenes[:a.only]
    for sc in scenes:
        sc["subject_hint"] = a.subject
        if not sc["steps"]:
            sc["steps"].append({"screen": "", "say": "", "pause": 2.0})
    work = Path(a.work or Path(a.out).with_suffix("")).resolve()
    (work / "img").mkdir(parents=True, exist_ok=True)
    (work / "wav").mkdir(parents=True, exist_ok=True)

    # 1. Audio for every step
    from piper import PiperVoice, SynthesisConfig
    voice = PiperVoice.load(a.voice)
    cfg = SynthesisConfig(length_scale=a.speed)
    flat = []
    for si, sc in enumerate(scenes):
        for k, st in enumerate(sc["steps"]):
            n = len(flat)
            wp = work / "wav" / f"{n:04d}.wav"
            text = to_speech(st["say"])
            cache = work / "wav" / f"{n:04d}.txt"
            if text and not (wp.exists() and cache.exists() and cache.read_text() == text + f"|{a.speed}"):
                with wave.open(str(wp), "wb") as w:
                    voice.synthesize_wav(text, w, syn_config=cfg)
                cache.write_text(text + f"|{a.speed}")
            spoken = wav_len(wp) if text else 0.0
            dur = spoken + GAP + st["pause"] + (LEAD if k == 0 else 0.0)
            flat.append({"si": si, "k": k, "wav": wp if text else None, "spoken": spoken, "dur": dur})
    total = sum(f["dur"] for f in flat)
    print(f"{len(scenes)} scenes, {len(flat)} steps, {total/60:.1f} min", flush=True)

    # 2. Frames
    t = 0.0
    pages = []
    for i, f in enumerate(flat):
        pages.append((work / "img" / f"{i:04d}.png", frame_html(scenes[f["si"]], f["k"], (t + f["dur"]) / total)))
        f["start"] = t
        t += f["dur"]
    js = work / "render.js"
    jobs = work / "pages.json"
    jobs.write_text(json.dumps([[str(p), h] for p, h in pages]))
    js.write_text("""
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const jobs=JSON.parse(fs.readFileSync(process.argv[2]));const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1920,height:1080}});
for(const [out,h] of jobs){await p.setContent(h);await p.screenshot({path:out});}
await b.close();})();""")
    subprocess.run(["node", str(js), str(jobs)], check=True)

    # 3. Audio track: lead silence + speech + gap/pause silence, step by step
    parts = []
    for i, f in enumerate(flat):
        if f["k"] == 0:
            sp = work / "wav" / f"lead.wav"; silence(sp, LEAD); parts.append(sp)
        if f["wav"]:
            parts.append(f["wav"])
        gp = work / "wav" / f"gap{i:04d}.wav"; silence(gp, f["dur"] - f["spoken"] - (LEAD if f["k"] == 0 else 0)); parts.append(gp)
    alist = work / "audio.txt"
    alist.write_text("".join(f"file '{p}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(alist),
                    "-ar", str(SR), "-ac", "1", str(work / "audio.wav")], check=True)

    # 4. Video track from still frames with exact durations
    vlist = work / "video.txt"
    lines = []
    for i, f in enumerate(flat):
        lines.append(f"file '{work/'img'/f'{i:04d}.png'}'\nduration {f['dur']:.4f}\n")
    lines.append(f"file '{work/'img'/f'{len(flat)-1:04d}.png'}'\n")
    vlist.write_text("".join(lines))

    # 5. Chapters + subtitles
    meta = [";FFMETADATA1", "title=" + Path(a.out).stem.replace("-", " ")]
    chaps = [(flat[i]["start"], scenes[f["si"]]["chapter"]) for i, f in enumerate(flat) if f["k"] == 0 and scenes[f["si"]]["chapter"]]
    for j, (st, name) in enumerate(chaps):
        end = chaps[j + 1][0] if j + 1 < len(chaps) else total
        meta += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={int(st*1000)}", f"END={int(end*1000)}", f"title={name}"]
    (work / "meta.txt").write_text("\n".join(meta) + "\n")

    def ts(x):
        ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    srt, n = [], 1
    for i, f in enumerate(flat):
        say = scenes[f["si"]]["steps"][f["k"]]["say"]
        if say:
            s0 = f["start"] + (LEAD if f["k"] == 0 else 0)
            srt.append(f"{n}\n{ts(s0)} --> {ts(s0 + f['spoken'] + 0.3)}\n{re.sub(r'[*]', '', say)}\n")
            n += 1
    Path(a.out).with_suffix(".srt").write_text("\n".join(srt), encoding="utf-8")

    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(vlist),
                    "-i", str(work / "audio.wav"), "-i", str(work / "meta.txt"), "-map_metadata", "2", "-map_chapters", "2",
                    "-map", "0:v", "-map", "1:a", "-vf", "fps=25,format=yuv420p", "-c:v", "libx264", "-preset", "medium",
                    "-tune", "stillimage", "-crf", "26", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart",
                    "-shortest", a.out], check=True)
    print("wrote", a.out, f"{total/60:.1f} min")


if __name__ == "__main__":
    main()
