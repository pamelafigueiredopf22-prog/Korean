# Kokoro TTS (open-source, Apache-2.0: free, commercial use allowed).
# usage: python3 kokoro_tts.py jobs.json   where jobs.json = [{"text","out","voice","speed"}, ...]
import sys, json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("voices/kokoro-v1.0.onnx", "voices/voices-v1.0.bin")
for j in json.load(open(sys.argv[1])):
    samples, sr = k.create(j["text"], voice=j["voice"], speed=j["speed"], lang="en-us" if j["voice"][0] == "a" else "en-gb")
    sf.write(j["out"], samples, sr); print("tts", j["out"], flush=True)
