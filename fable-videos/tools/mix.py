#!/usr/bin/env python3
"""Put picture, voices and lullaby together into the final video.

  python3 tools/mix.py lion-and-mouse [--music-db -20]

Music sits quietly under the voices and dips a little more while anyone speaks.
Final loudness is a calm -18 LUFS (bedtime: softer than typical YouTube).
"""
import argparse, json, os, subprocess

ap = argparse.ArgumentParser()
ap.add_argument('fable')
ap.add_argument('--music-db', type=float, default=-21)
ap.add_argument('--violin-db', type=float, default=-17)
ap.add_argument('--out', default=None)
a = ap.parse_args()
b = os.path.join('build', a.fable)
tl = json.load(open(os.path.join(b, 'timeline.json')))
music = os.path.join(b, 'music.wav')
if not os.path.exists(music):
    subprocess.run(['python3', 'tools/music.py', str(tl['duration']), music], check=True)
os.makedirs('output', exist_ok=True)
out = a.out or os.path.join('output', f"{a.fable}.mp4")
violin = os.path.join(b, 'violin.wav')
inputs = ['-i', os.path.join(b, 'video.mp4'), '-i', os.path.join(b, 'voice.wav'), '-i', music]
if os.path.exists(violin):  # a soft solo violin (the grasshopper's sleepy song); the music box steps back while it plays
    inputs += ['-i', violin]
    fc = (f"[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=3[v][key][key2];"
          f"[3:a]aresample=48000,volume={a.violin_db}dB,asplit=2[vl][vkey];"
          f"[2:a]aresample=48000,volume={a.music_db}dB[m0];"
          f"[m0][vkey]sidechaincompress=threshold=0.01:ratio=6:attack=400:release=2500[m];"
          f"[m][key]sidechaincompress=threshold=0.03:ratio=3:attack=200:release=1500[md];"
          f"[vl][key2]sidechaincompress=threshold=0.03:ratio=2:attack=200:release=1500[vd];"
          f"[v][md][vd]amix=inputs=3:normalize=0,loudnorm=I=-18:TP=-2:LRA=11[aout]")
else:
    fc = (f"[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=2[v][key];"
          f"[2:a]aresample=48000,volume={a.music_db}dB[m];"
          f"[m][key]sidechaincompress=threshold=0.03:ratio=3:attack=200:release=1500[md];"
          f"[v][md]amix=inputs=2:normalize=0,loudnorm=I=-18:TP=-2:LRA=11[aout]")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', fc, '-map', '0:v', '-map', '[aout]', '-c:v', 'copy',
                '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], check=True)
print(out)
