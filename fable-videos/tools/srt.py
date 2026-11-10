#!/usr/bin/env python3
"""Write a YouTube caption file (.srt) from a fable's timeline.

  python3 tools/srt.py lion-and-mouse    -> output/<name>.srt
"""
import json, os, sys

def ts(x):
    h, x = divmod(x, 3600); m, x = divmod(x, 60); s = int(x); ms = int(round((x - s) * 1000))
    return f"{int(h):02d}:{int(m):02d}:{s:02d},{min(ms, 999):03d}"

name = sys.argv[1]
tl = json.load(open(os.path.join('build', name, 'timeline.json')))
lines = sorted(tl['lines'], key=lambda l: l['start'])
out = []
for i, l in enumerate(lines):
    end = l['end'] + 0.6
    if i + 1 < len(lines): end = min(end, lines[i + 1]['start'] - 0.15)
    text = l['text'] if l['speaker'] == 'narrator' else f"“{l['text']}”"
    out.append(f"{i + 1}\n{ts(max(0, l['start'] - 0.15))} --> {ts(end)}\n{text}\n")
os.makedirs('output', exist_ok=True)
path = os.path.join('output', f"{name}.srt")
open(path, 'w').write("\n".join(out))
print(path)
