// Render an ASMR short (vertical 1080x1920) frame by frame and mux it with build/audio.wav.
// usage: node asmr/render_short.js asmr/short-01 [--workers 4] [--snap 3,8,25] [--from s --to s]
const { chromium } = require('playwright'); const { spawn, execFileSync } = require('child_process'); const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const DIR = path.resolve(args[0]); const CH = path.resolve(__dirname, '..'); const NAME = path.basename(DIR);
const ev = JSON.parse(fs.readFileSync(path.join(DIR, 'events.json')));
const FPS = +opt('fps', ev.fps || 60), WORKERS = +opt('workers', 4), T0 = +opt('from', 0), T1 = +opt('to', ev.duration);
const OUT = opt('out', path.join(DIR, 'build', NAME + '.mp4')), SEG = path.join(DIR, 'build/seg'), N = Math.round((T1 - T0) * FPS);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(CH, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
(async () => {
  const URL = `http://localhost:${srv.address().port}/${path.relative(CH, DIR)}/short.html?headless`;
  const b = await chromium.launch(); fs.mkdirSync(SEG, { recursive: true });
  const page = async () => { const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.error('page error:', e.message)); await p.goto(URL); await p.evaluate(() => window.ready); return p; };
  if (opt('snap')) {
    const p = await page(), dir = path.join(DIR, 'build/snaps'); fs.mkdirSync(dir, { recursive: true });
    for (const t of opt('snap').split(',').map(Number)) { await p.evaluate(t => render(t), t); await p.locator('canvas').screenshot({ path: `${dir}/t${t.toFixed(2).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 75 }); }
    console.log('snaps in', dir); await b.close(); srv.close(); return;
  }
  const per = Math.ceil(N / WORKERS), start = Date.now(), done = new Array(WORKERS).fill(0);
  const tick = setInterval(() => { const d = done.reduce((a, c) => a + c, 0), s = (Date.now() - start) / 1000; console.log(`${d}/${N} frames, ${(d / s).toFixed(1)} fps`); }, 20000);
  await Promise.all([...Array(WORKERS)].map(async (_, w) => {
    const a = w * per, z = Math.min(N, a + per); if (a >= z) return;
    const p = await page();
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-threads', '1', path.join(SEG, `${w}.mp4`)]);
    for (let f = a; f < z; f++) {
      const url = await p.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }, T0 + f / FPS);
      if (!ff.stdin.write(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      done[w]++;
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  clearInterval(tick); await b.close(); srv.close();
  fs.writeFileSync(path.join(SEG, 'segs.txt'), [...Array(WORKERS).keys()].filter(w => fs.existsSync(path.join(SEG, `${w}.mp4`))).map(w => `file '${w}.mp4'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(SEG, 'segs.txt'), '-ss', String(T0), '-t', String(T1 - T0), '-i', path.join(DIR, 'build/audio.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT]);
  console.log('wrote', OUT, ((Date.now() - start) / 60000).toFixed(1), 'min');
})();
