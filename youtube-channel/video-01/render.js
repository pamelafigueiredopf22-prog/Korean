// Step 2: render every frame of render.html with headless Chromium, encode, add narration.
// usage: node render.js [out.mp4] [--fps 30] [--workers 4] [--from s --to s]
const { chromium } = require('playwright'); const { spawn, execFileSync } = require('child_process'); const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const OUT = args[0] && !args[0].startsWith('--') ? args[0] : 'build/video-01.mp4';
const FPS = +opt('fps', 30), WORKERS = +opt('workers', 4);
const tl = JSON.parse(fs.readFileSync('build/timeline.json'));
const T0 = +opt('from', 0), T1 = +opt('to', tl.duration);
const N = Math.ceil((T1 - T0) * FPS);
// tiny static server so fonts load
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
(async () => {
  const port = srv.address().port; const b = await chromium.launch(); fs.mkdirSync('build/seg', { recursive: true });
  const per = Math.ceil(N / WORKERS); const start = Date.now(); const done = new Array(WORKERS).fill(0);
  const tick = setInterval(() => { const d = done.reduce((a, b) => a + b, 0), s = (Date.now() - start) / 1000; console.log(`${d}/${N} frames, ${(d / s).toFixed(1)} fps, eta ${Math.round((N - d) / (d / s || 1))}s`); }, 15000);
  await Promise.all([...Array(WORKERS)].map(async (_, w) => {
    const a = w * per, z = Math.min(N, a + per); if (a >= z) return;
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.goto(`http://localhost:${port}/render.html?headless`); await p.evaluate(() => window.ready);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-threads', '1', `build/seg/${w}.mp4`]);
    for (let f = a; f < z; f++) {
      const url = await p.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, T0 + f / FPS);
      const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      done[w]++;
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  clearInterval(tick); await b.close(); srv.close();
  const list = [...Array(WORKERS).keys()].filter(w => fs.existsSync(`build/seg/${w}.mp4`)).map(w => `file 'seg/${w}.mp4'`).join('\n');
  fs.writeFileSync('build/segs.txt', list);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'build/segs.txt', '-ss', String(T0), '-t', String(T1 - T0), '-i', 'build/narration.wav',
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT]);
  console.log('wrote', OUT, ((Date.now() - start) / 60000).toFixed(1), 'min');
})();
