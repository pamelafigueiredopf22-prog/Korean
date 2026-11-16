// Step 2: render every frame of render.html with headless Chromium, encode, add narration.
// usage: node engine/render.js video-02 [--fps 30] [--workers 4] [--from s --to s] [--out file.mp4]
//        node engine/render.js video-02 --thumb      (thumbnail only)
//        node engine/render.js video-02 --snap 10,20  (still JPGs for checking)
const { chromium } = require('playwright'); const { spawn, execFileSync } = require('child_process'); const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const VID = args[0]; const VDIR = path.resolve(VID); const CH = path.resolve(__dirname, '..'); const NAME = path.basename(VDIR);
const OUT = opt('out', path.join(VDIR, 'build', NAME + '.mp4'));
const FPS = +opt('fps', 30), WORKERS = +opt('workers', 4);
const tl = JSON.parse(fs.readFileSync(path.join(VDIR, 'build/timeline.json')));
const SEG = path.join(VDIR, 'build/seg');
const T0 = +opt('from', 0), T1 = +opt('to', tl.duration);
const N = Math.ceil((T1 - T0) * FPS);
// tiny static server so fonts load
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(CH, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
(async () => {
  const port = srv.address().port; const b = await chromium.launch(); fs.mkdirSync(SEG, { recursive: true });
  const URL = `http://localhost:${port}/engine/page.html?v=${NAME}&headless`;
  if (args.includes('--thumb') || args.includes('--snap')) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); await p.goto(URL); await p.evaluate(() => window.ready);
    if (args.includes('--thumb')) { await p.evaluate(() => thumb());
      const u = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(document.getElementById('c'), 0, 0, 1280, 720); return c.toDataURL('image/png'); });
      fs.writeFileSync(path.join(VDIR, 'build/thumbnail.png'), Buffer.from(u.split(',')[1], 'base64')); console.log('wrote thumbnail'); }
    else { const dir = path.join(VDIR, 'build/snaps'); fs.mkdirSync(dir, { recursive: true }); let ts = opt('snap').split(',').map(Number);
      if (opt('snap') === 'lines') ts = tl.scenes.flatMap(s => s.lines.map(l => +(l.start + (l.end - l.start) * .75).toFixed(2)));
      for (const t of ts) { await p.evaluate(t => render(t), t); await p.locator('canvas').screenshot({ path: `${dir}/t${t.toFixed(2).padStart(7, '0')}.jpg`, type: 'jpeg', quality: 70 }); }
      console.log(ts.length, 'snaps in', dir); }
    await b.close(); srv.close(); return; }
  const per = Math.ceil(N / WORKERS); const start = Date.now(); const done = new Array(WORKERS).fill(0);
  const tick = setInterval(() => { const d = done.reduce((a, b) => a + b, 0), s = (Date.now() - start) / 1000; console.log(`${d}/${N} frames, ${(d / s).toFixed(1)} fps, eta ${Math.round((N - d) / (d / s || 1))}s`); }, 15000);
  await Promise.all([...Array(WORKERS)].map(async (_, w) => {
    const a = w * per, z = Math.min(N, a + per); if (a >= z) return;
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.goto(URL); await p.evaluate(() => window.ready);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-threads', '1', path.join(SEG, `${w}.mp4`)]);
    for (let f = a; f < z; f++) {
      const url = await p.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, T0 + f / FPS);
      const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      done[w]++;
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  clearInterval(tick); await b.close(); srv.close();
  const list = [...Array(WORKERS).keys()].filter(w => fs.existsSync(path.join(SEG, `${w}.mp4`))).map(w => `file '${w}.mp4'`).join('\n');
  fs.writeFileSync(path.join(SEG, 'segs.txt'), list);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(SEG, 'segs.txt'), '-ss', String(T0), '-t', String(T1 - T0), '-i', path.join(VDIR, 'build/narration.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT]);
  console.log('wrote', OUT, ((Date.now() - start) / 60000).toFixed(1), 'min');
})();
