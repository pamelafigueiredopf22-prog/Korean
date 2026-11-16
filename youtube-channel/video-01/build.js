// Step 1: narration -> audio clips -> timeline.
// For each script line: use your own recording from voice/<sceneId>_<n>.(wav|mp3|m4a) if present,
// otherwise generate an AI narrator voice with Kokoro TTS (free, Apache-2.0; set VOICE=... to change). Produces:
//   build/narration.wav, build/timeline.json, build/captions.srt, SCRIPT.md
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const B = path.join(ROOT, 'build');
const RATE = 24000;
const LEAD = 0.4, GAP = 0.55, TAIL = 0.9;

fs.mkdirSync(path.join(B, 'tts'), { recursive: true });
fs.mkdirSync(path.join(B, 'lines'), { recursive: true });
const script = JSON.parse(fs.readFileSync(path.join(ROOT, 'script.json'), 'utf8'));

function readPcm(file) { // 16-bit mono wav -> Buffer of samples (finds the "data" chunk)
  const buf = fs.readFileSync(file);
  let p = 12;
  while (p < buf.length) {
    const id = buf.toString('ascii', p, p + 4), size = buf.readUInt32LE(p + 4);
    if (id === 'data') return buf.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size & 1);
  }
  throw new Error('no data chunk in ' + file);
}
function wavHeader(n) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + n, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(n, 40);
  return h;
}
const silence = s => Buffer.alloc(Math.round(s * RATE) * 2);

const VOICE = process.env.VOICE || 'af_heart', SPEED = +(process.env.SPEED || 0.92);
const ttsPath = text => path.join(B, 'tts', crypto.createHash('sha1').update(`${text}|${VOICE}|${SPEED}`).digest('hex').slice(0, 12) + '.wav');
const ownPath = (id, i) => ['wav', 'mp3', 'm4a', 'ogg'].map(e => path.join(ROOT, 'voice', `${id}_${i + 1}.${e}`)).find(fs.existsSync);
// generate all missing AI-voice clips in one batch (model loads once)
const jobs = [];
for (const sc of script.scenes) sc.lines.forEach((text, i) => { if (!ownPath(sc.id, i) && !fs.existsSync(ttsPath(text))) jobs.push({ text, out: ttsPath(text), voice: VOICE, speed: SPEED }); });
if (jobs.length) { fs.writeFileSync(path.join(B, 'jobs.json'), JSON.stringify(jobs)); console.log(`generating ${jobs.length} clips with Kokoro voice ${VOICE}...`);
  execFileSync('python3', [path.join(ROOT, 'kokoro_tts.py'), path.join(B, 'jobs.json')], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] }); }

function clipFor(sceneId, i, text) {
  const own = ownPath(sceneId, i);
  const src = own || ttsPath(text);
  const out = path.join(B, 'lines', `${sceneId}_${i + 1}.wav`);
  // normalise every clip: mono, 22.05 kHz, trim edge silence, consistent loudness
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-af',
    'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5',
    '-ar', String(RATE), '-ac', '1', '-c:a', 'pcm_s16le', out]);
  return { pcm: readPcm(out), own: !!own };
}

const parts = [];
let t = 0, ownCount = 0, total = 0;
const timeline = { title: script.title, scenes: [] };
for (const sc of script.scenes) {
  const scene = { id: sc.id, type: sc.type, start: t, lines: [] };
  parts.push(silence(LEAD)); t += LEAD;
  sc.lines.forEach((text, i) => {
    const { pcm, own } = clipFor(sc.id, i, text);
    ownCount += own; total++;
    const d = pcm.length / 2 / RATE;
    scene.lines.push({ text, start: t, end: t + d });
    parts.push(pcm); t += d;
    if (i < sc.lines.length - 1) { parts.push(silence(GAP)); t += GAP; }
  });
  const tail = sc.type === 'title' ? 1.4 : TAIL;
  parts.push(silence(tail)); t += tail;
  scene.end = t;
  timeline.scenes.push(scene);
}
timeline.duration = t;
const pcm = Buffer.concat(parts);
fs.writeFileSync(path.join(B, 'narration.wav'), Buffer.concat([wavHeader(pcm.length), pcm]));
fs.writeFileSync(path.join(B, 'timeline.json'), JSON.stringify(timeline, null, 1));
fs.writeFileSync(path.join(B, 'timeline.js'), 'window.TIMELINE = ' + JSON.stringify(timeline) + ';');

// captions (.srt) for YouTube upload
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
let n = 0;
const srt = timeline.scenes.flatMap(s => s.lines).map(l => `${++n}\n${ts(l.start)} --> ${ts(l.end)}\n${l.text}\n`).join('\n');
fs.writeFileSync(path.join(B, 'captions.srt'), srt);

// readable recording script
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
let md = `# ${script.title}\n\nRecording script. Record each numbered line as its own file in \`voice/\` (e.g. \`voice/open_1.wav\`) and rebuild: the animation re-times itself to your voice.\n\n`;
const words = script.scenes.flatMap(s => s.lines).join(' ').split(/\s+/).length;
md += `**${words} words** · scratch-voice length ${mmss(t)} · at a natural 150 words/min your read will be about ${mmss(words / 150 * 60 + timeline.scenes.length * 1.2)}\n\n`;
script.scenes.forEach((sc, k) => {
  md += `## ${k + 1}. \`${sc.id}\` (${mmss(timeline.scenes[k].start)})\n*Visual: ${sc.note}*\n\n`;
  sc.lines.forEach((l, i) => { md += `${i + 1}. ${l}  \n   ↳ \`voice/${sc.id}_${i + 1}.wav\`\n`; });
  md += '\n';
});
fs.writeFileSync(path.join(ROOT, 'SCRIPT.md'), md);
console.log(`timeline ${mmss(t)} (${t.toFixed(1)}s), ${timeline.scenes.length} scenes, ${total} lines, ${ownCount} from your own recordings, ${words} words`);

// YouTube chapters (paste into the description). First chapter must be 0:00.
const CH = { open: 'You\'ve probably met all three', ivy: 'The introvert', sam: 'Shyness', grid: 'Introvert vs shy: mix & match', alex: 'Social anxiety', myths: '3 myths', check: 'Quick self-check', tips: 'What actually helps', recap: 'Back to the party' };
const chapters = timeline.scenes.filter(s => CH[s.id]).map((s, i) => `${i ? mmss(s.start) : '0:00'} ${CH[s.id]}`).join('\n');
fs.writeFileSync(path.join(B, 'chapters.txt'), chapters + '\n');
