#!/usr/bin/env node
// Render a fable's animation frames with headless Chromium and encode them.
//
//   node tools/render.js lion-and-mouse --stills 5,30,62      # PNG stills for checking
//   node tools/render.js lion-and-mouse --video [--from 0 --to 60] [--fps 24] [--workers 3]
//
// The fable page (fables/<name>/index.html) must define
//   window.FABLE = { async setup(timeline), frame(t) }   drawing into <canvas id="c">.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const fable = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function openPage(browser, port, timeline) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(`http://127.0.0.1:${port}/fables/${fable}/index.html`);
  await page.waitForFunction(() => window.FABLE);
  const t0 = Date.now();
  await page.evaluate((tl) => window.FABLE.setup(tl), timeline);
  console.error(`setup ${(Date.now() - t0) / 1000}s`);
  return page;
}

async function grab(page, t) {
  const b64 = await page.evaluate((t) => { window.FABLE.frame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.94).split(',')[1]; }, t);
  return Buffer.from(b64, 'base64');
}

async function renderRange(browser, port, timeline, fps, f0, f1, outFile) {
  const page = await openPage(browser, port, timeline);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-tune', 'film', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const buf = await grab(page, f / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 240 === 0) console.error(`${path.basename(outFile)} frame ${f - f0}/${f1 - f0} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
}

(async () => {
  const build = path.join(ROOT, 'build', fable);
  const timeline = JSON.parse(fs.readFileSync(path.join(build, 'timeline.json')));
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--disable-web-security'] });
  try {
    if (opt('stills')) {
      const page = await openPage(browser, port, timeline);
      fs.mkdirSync(path.join(build, 'stills'), { recursive: true });
      for (const t of String(opt('stills')).split(',').map(Number)) {
        const f = path.join(build, 'stills', `t${String(t).padStart(6, '0')}.jpg`);
        fs.writeFileSync(f, await grab(page, t));
        console.log(f);
      }
    } else {
      const fps = Number(opt('fps', 24));
      const from = Number(opt('from', 0)), to = Number(opt('to', timeline.duration));
      const workers = Number(opt('workers', 3));
      const F0 = Math.round(from * fps), F1 = Math.round(to * fps);
      const per = Math.ceil((F1 - F0) / workers);
      const segs = [];
      const jobs = [];
      for (let w = 0; w < workers; w++) {
        const a = F0 + w * per, b = Math.min(F1, a + per);
        if (a >= b) break;
        const out = path.join(build, `seg${w}.mp4`); segs.push(out);
        jobs.push(renderRange(browser, port, timeline, fps, a, b, out));
      }
      await Promise.all(jobs);
      const list = path.join(build, 'segs.txt');
      fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(build, 'video.mp4')]);
      segs.forEach((s) => fs.unlinkSync(s));
      console.log(path.join(build, 'video.mp4'));
    }
  } finally {
    await browser.close(); srv.close();
  }
})();
