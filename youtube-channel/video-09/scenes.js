// Video 09 scenes: "Why Do We Dream?". Uses engine/core.js helpers.

// ---------- helpers for this video
function heading(s, y = 120, c = COL.ink, size = 76) { txt(s, W / 2, y, { size, weight: 700, color: c }); }
function tipTag9(n, s) { g.fillStyle = COL.ink; rr(60, 60, 120 + s.length * 26, 80, 40); g.fill(); g.fillStyle = COL.sam; g.beginPath(); g.arc(100, 100, 28, 0, 7); g.fill(); txt(String(n), 100, 102, { size: 36, weight: 700 }); txt(s, 145, 102, { size: 40, color: '#fff', align: 'left' }); }
function dreamSky() { const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#2A1E5C'); sk.addColorStop(1, '#5B3F8F'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { g.globalAlpha = .4 + .4 * Math.sin(TT * 2 + i); g.fillStyle = '#fff'; g.beginPath(); g.arc((i * 331) % W, (i * 137) % H, 2 + i % 2, 0, 7); g.fill(); } g.globalAlpha = 1; }
function nightBed() { const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#171B36'); wall.addColorStop(1, '#232A52'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0F1229'; rr(1440, 140, 320, 300, 12); g.fill(); g.fillStyle = '#F6E7B8'; g.beginPath(); g.arc(1660, 220, 32, 0, 7); g.fill(); g.fillStyle = '#0F1229'; g.beginPath(); g.arc(1645, 210, 28, 0, 7); g.fill();
  g.fillStyle = '#4A3C5C'; rr(420, 780, 1000, 100, 18); g.fill(); g.fillStyle = '#2E2A44'; rr(420, 560, 60, 320, 18); g.fill(); g.fillStyle = '#E8E2F0'; rr(460, 700, 960, 90, 30); g.fill(); g.fillStyle = '#F7F4FA'; rr(480, 620, 200, 100, 46); g.fill(); g.fillStyle = '#121633'; g.fillRect(0, 880, W, 200); }
function blanket9() { g.fillStyle = '#6C8EBF'; rr(700, 640, 700, 140, 50); g.fill(); }
function giraffe(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#F2B84B'; rr(-60, -160, 120, 160, 50); g.fill(); rr(-20, -420, 50, 280, 25); g.fill(); ell(10, -440, 50, 36); g.fill();
  g.fillStyle = '#B5722D'; [[-30, -120], [20, -90], [0, -300], [10, -220], [-20, -60]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 12, 0, 7); g.fill(); }); g.fillStyle = COL.ink; g.beginPath(); g.arc(30, -450, 7, 0, 7); g.fill(); line(-10, -470, -16, -500, 6, '#B5722D'); line(20, -474, 22, -504, 6, '#B5722D');
  line(-40, 0, -40, 60, 14, '#F2B84B'); line(40, 0, 40, 60, 14, '#F2B84B'); g.restore(); }
function meltClock(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-90, -60); g.quadraticCurveTo(0, -120, 90, -60); g.quadraticCurveTo(110, 40 + Math.sin(TT * 2) * 10, 60, 90); g.quadraticCurveTo(30, 160 + Math.sin(TT * 2) * 20, 0, 110); g.quadraticCurveTo(-60, 120, -90, 40); g.closePath(); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke();
  line(0, 0, 30, -40, 6, COL.ink); line(0, 0, -10, 50, 4, COL.red); g.restore(); }
function curve9(x0, y0, w, h, pts, prog, c) { g.beginPath(); pts.forEach(([u, v], i) => { if (u > prog) return; const x = x0 + u * w, y = y0 - v * h; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.lineWidth = 8; g.strokeStyle = c; g.lineJoin = 'round'; g.stroke(); }
function eyeMove(x, y, s) { const dx = Math.sin(TT * 10) * 8 * s; g.fillStyle = '#F2B84B'; ell(x, y, 50 * s, 30 * s); g.fill(); g.strokeStyle = COL.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 50 * s, y); g.quadraticCurveTo(x, y + 20 * s, x + 50 * s, y); g.stroke(); g.fillStyle = 'rgba(43,45,66,.3)'; ell(x + dx, y + 4 * s, 14 * s, 10 * s); g.fill(); }
function rat(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#B8B2C4'; ell(0, 0, 60, 34); g.fill(); g.beginPath(); g.arc(52, -14, 26, 0, 7); g.fill(); g.fillStyle = '#E8A0B4'; g.beginPath(); g.arc(46, -38, 12, 0, 7); g.fill(); g.fillStyle = COL.ink; g.beginPath(); g.arc(64, -18, 5, 0, 7); g.fill(); g.strokeStyle = '#E8A0B4'; g.lineWidth = 5; g.beginPath(); g.moveTo(-58, 0); g.quadraticCurveTo(-110, -20, -120, 20); g.stroke(); g.restore(); }
function maze(x, y, s, prog, c = COL.ivy) { g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = COL.ink; g.lineWidth = 8; g.strokeRect(-150, -150, 300, 300); [[-150, -50, 50, -50], [-50, 50, 150, 50], [50, -150, 50, -50], [-50, 50, -50, 150]].forEach(([a, b, c2, d]) => line(a, b, c2, d, 8, COL.ink));
  const path = [[-120, -120], [-120, 0], [0, 0], [0, -100], [100, -100], [100, 0], [100, 120]]; g.strokeStyle = c; g.lineWidth = 10; g.beginPath(); const n = prog * (path.length - 1); for (let i = 0; i <= Math.floor(n); i++) i ? g.lineTo(...path[i]) : g.moveTo(...path[i]);
  if (n % 1 > 0 && Math.floor(n) < path.length - 1) { const a = path[Math.floor(n)], b = path[Math.floor(n) + 1]; g.lineTo(lerp(a[0], b[0], n % 1), lerp(a[1], b[1], n % 1)); } g.stroke(); g.restore(); }

// ---------- scenes
S.dreamOpen = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    nightBed(); lying(P_(SAM, { x: 600, y: 700, s: 1, expr: 'calm' })); blanket9();
    const k = E(lt, at(0, .3), .8); withA(k, () => { thought(1180, 330, 760, 400); g.save(); rr(800, 140, 760, 380, 190); g.clip(); g.fillStyle = '#E8DCC4'; g.fillRect(800, 130, 760, 400);
      g.fillStyle = '#2E5E4E'; rr(900, 170, 400, 160, 8); g.fill(); txt('FINAL EXAM', 1100, 250, { size: 40, weight: 700, color: '#fff' }); ch(P_(SAM, { x: 1400, y: 500, s: .55, expr: 'scared', sweat: true })); g.restore(); });
  }, () => {
    dreamSky(); g.fillStyle = '#E8DCC4'; rr(160, 160, 1600, 760, 30); g.fill(); g.fillStyle = '#2E5E4E'; rr(260, 220, 800, 300, 10); g.fill(); txt('?¿?¿ ∑§ ¿?', 660, 370, { size: 70, weight: 700, color: '#fff' });
    meltClock(1350, 340, 1.2); withA(E(lt, at(1, .55), .6), () => giraffe(1500, 860, .9));
    g.fillStyle = '#fff'; rr(560, 620, 320, 220, 8); g.fill(); for (let i = 0; i < 5; i++) line(590, 660 + i * 34, 840, 660 + i * 34, 4, '#C9C3B8'); ch(P_(SAM, { x: 380, y: 900, s: 1.1, expr: 'scared', sweat: true, shake: .5 }));
  }, () => {
    nightBed(); g.save(); g.translate(0, 0); lying(P_(SAM, { x: 600, y: 700, s: 1, expr: 'o', sweat: true, shake: 1 })); g.restore(); blanket9();
    g.save(); g.translate(960 + Math.sin(TT * 30) * 4, 260); g.scale(B(lt, at(2, .05)), B(lt, at(2, .05))); txt('*GASP*', 0, 0, { size: 120, weight: 700, color: COL.sam }); g.restore();
    withA(E(lt, at(2, .55)), () => pill('finished school 10 years ago', 960, 420, { bg: COL.ink, size: 40 }));
  }, () => {
    dreamSky(); clock(560, 520, 180, 2); txt('~2 hours', 560, 800, { size: 70, weight: 700, color: '#fff', alpha: E(lt, at(3, .1)) }); txt('of dreaming every night', 560, 880, { size: 40, font: 'Nunito', weight: 800, color: '#E0D4FF', alpha: E(lt, at(3, .1)) });
    withA(E(lt, at(3, .5)), () => { for (let i = 0; i < 6; i++) { const a = ((lt - at(3, .5)) * .5 + i * .2) % 1.2; withA(clamp(1 - a / 1.2), () => cloud(1300 + (i % 3) * 150, 400 + Math.floor(i / 3) * 200 - a * 100, .5, false)); } txt('...forgotten in minutes', 1400, 860, { size: 48, weight: 700, color: '#fff' }); });
  }, () => {
    dreamSky(); txt('WHY DO WE DREAM?', W / 2, 420, { size: 110, weight: 700, color: '#fff', alpha: B(lt, at(4, .2)) }); txt('100+ years of debate', W / 2, 560, { size: 50, font: 'Nunito', weight: 800, color: '#E0D4FF', alpha: E(lt, at(4, .5)) });
    ch(P_(SAM, { x: 960, y: 1000, s: 1, expr: 'o' }));
  }]);
};
S.title9 = (lt, L, Le, D, at) => {
  dreamSky(); [['WHY DO WE', COL.white, 280, 120], ['DREAM?', '#FFD86E', 430, 150]].forEach(([s, c, y, sz], i) => { const p = B(lt, .2 + i * .5, .5); g.save(); g.translate(W / 2, y); g.scale(p, p); txt(s, 0, 0, { size: sz, weight: 700, color: c }); g.restore(); });
  const p = E(lt, 1, .7); g.save(); g.translate(0, lerp(300, 0, p)); for (let i = 0; i < 4; i++) cloud(560 + i * 260, 900 + (i % 2) * 40, .9, false); lying(P_(SAM, { x: 820, y: 860, s: .9, expr: 'calm' })); g.restore();
  for (let i = 0; i < 3; i++) { const a = (lt * .5 + i * .33) % 1; txt('z', 1000 + a * 120 + i * 10, 760 - a * 140, { size: 40 + i * 10, color: '#E0D4FF', alpha: clamp(1 - a) }); }
};
S.rem = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    nightBed(); chapter(1, 'Rapid eye movement', lt); lying(P_(SAM, { x: 600, y: 700, s: 1, expr: 'calm' })); blanket9();
    withA(E(lt, at(0, .4)), () => { card(1240, 360, 600, 340); eyeMove(1240, 360, 3); txt('1953', 1240, 220, { size: 50, weight: 700 }); });
  }, () => {
    paperBg('#ECE8F8'); txt('REM', W / 2, 360, { size: 220, weight: 700, color: COL.max, alpha: B(lt, at(1, .1)) }); txt('Rapid Eye Movement sleep', W / 2, 520, { size: 56, weight: 700, alpha: E(lt, at(1, .3)) });
    pill('woken up in REM → "I was dreaming!"', W / 2, 720, { p: B(lt, at(1, .65)), bg: COL.ink, size: 44 }); source('Aserinsky & Kleitman (1953), Science', E(lt, at(1, .3)));
  }, () => {
    paperBg('#ECE8F8'); heading('SLEEP CYCLES (~90 MIN)', 110);
    const x0 = 200, y0 = 320, w = 1500, h = 440; ['awake', 'REM', 'light', 'deep'].forEach((s, i) => txt(s, x0 - 20, y0 + i * (h / 3), { size: 32, weight: 700, align: 'right', color: i === 1 ? COL.max : COL.ink2 }));
    const pts = []; const lvl = [.67, .33, 0, .33, .67, .33, .05, .4, .67, .33, .15, .5, .67, .5, .67]; for (let c = 0; c < 5; c++) { [[.0, .1], [.08, .5], [.14, 1], [.2, .5], [.25, .67]].forEach(([du, v], k) => { const depth = c < 2 ? v : Math.min(v, .6); pts.push([c * .2 + du * .8, 1 - depth]); }); }
    curve9(x0, y0 + h, w, h, pts.map(([u, v]) => [u, v]), E(lt, at(2, .1), 2.5), COL.ink);
    for (let c = 0; c < 5; c++) { const u0 = c * .2 + .25 * .8 - .02, len = .02 + c * .015; withA(E(lt, at(2, .2) + c * .2, .3), () => { g.fillStyle = 'rgba(123,108,246,.4)'; g.fillRect(x0 + u0 * w, y0, len * w, h); }); }
    txt('REM gets longer toward morning', W / 2, 900, { size: 46, weight: 700, color: COL.max, alpha: E(lt, at(2, .6)) });
    txt('babies: ~50% REM · adults: ~20–25%', W / 2, 990, { size: 40, font: 'Nunito', weight: 800, alpha: E(lt, at(2, .85)) });
  }, () => {
    paperBg('#ECE8F8');
    brainChar(560, 520, 1.3, { amyg: .6, hippo: .6, expr: 'joy' }); txt('brain: very active', 560, 860, { size: 46, weight: 700, color: COL.max, alpha: E(lt, at(3, .2)) });
    withA(E(lt, at(3, .5)), () => { lying(P_(SAM, { x: 1220, y: 600, s: 1, expr: 'calm' })); g.fillStyle = '#6C8EBF'; rr(1300, 540, 420, 120, 40); g.fill(); txt('body: muscles paused', 1400, 860, { size: 46, weight: 700, color: COL.ivy }); });
  }, () => {
    paperBg('#ECE8F8'); heading('DREAMS OUTSIDE REM TOO', 120);
    [['REM', 'long, vivid, wild', COL.max, .1], ['other stages', 'shorter, calmer', COL.ivy, .5]].forEach(([h, s, c, f], i) => { const x = 560 + i * 800; withA(E(lt, at(4, f), .4), () => { card(x, 560, 620, 460); txt(h, x, 400, { size: 64, weight: 700, color: c }); g.fillStyle = c; [[-50, 10, 42], [0, -10, 56], [52, 8, 44], [0, 24, 46]].forEach(([a, b, r]) => { g.beginPath(); g.arc(x + a * (i ? .6 : 1.1), 560 + b * (i ? .6 : 1.1), r * (i ? .6 : 1.1), 0, 7); g.fill(); }); txt(s, x, 720, { size: 42, font: 'Nunito', weight: 800 }); }); });
  }]);
};
S.themes = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    dreamSky(); chapter(2, 'What we dream about', lt); txt('SAME DREAMS, ALL OVER THE WORLD', W / 2, 420, { size: 76, weight: 700, color: '#fff', alpha: B(lt, .4) });
    for (let i = 0; i < 8; i++) ch({ x: 240 + i * 205, y: 900, c: [COL.ivy, COL.sam, COL.alex, COL.max, ...EX][i], s: .7, sd: i, expr: 'calm', alpha: E(lt, .6 + i * .05) });
  }, () => {
    paperBg('#ECE8F8'); heading('MOST COMMON DREAMS', 110);
    [['being chased', .81, COL.red, .15], ['falling', .74, COL.max, .35], ['school & exams', .67, COL.sam, .55]].forEach(([s, v, c, f], i) => { const y = 340 + i * 190, p = E(lt, at(1, f), .8); txt(s, 560, y, { size: 46, weight: 700, align: 'right' }); g.fillStyle = '#D9D2C4'; rr(600, y - 40, 900, 80, 20); g.fill(); g.fillStyle = c; rr(600, y - 40, 900 * v * p, 80, 20); g.fill(); txt(Math.round(v * 100 * p) + '%', 620 + 900 * v * p, y, { size: 42, weight: 700, align: 'left' }); });
    txt('% who had it at least once', W / 2, 920, { size: 34, font: 'Nunito', weight: 800, color: COL.ink2 }); source('Nielsen et al. (2003), Typical Dreams Questionnaire', E(lt, at(1, .3)));
  }, () => {
    paperBg('#ECE8F8'); heading('DREAMS LEAN NEGATIVE', 110);
    [['fear', COL.red], ['anxiety', COL.alex], ['frustration', COL.max], ['happiness', COL.sam]].forEach(([s, c], i) => { const r = [130, 115, 100, 70][i]; const x = 420 + i * 360, p = B(lt, at(2, .1 + i * .15)); g.fillStyle = c; g.beginPath(); g.arc(x, 540, r * p, 0, 7); g.fill(); txt(s, x, 760, { size: 42, weight: 700, alpha: p }); });
    txt('illustrative', W / 2, 900, { size: 30, font: 'Nunito', weight: 700, color: COL.ink2 });
  }, () => {
    dreamSky(); heading('THE CONTINUITY HYPOTHESIS', 110, '#fff');
    [['work', '💼'], ['friends', '👥'], ['worries', '😟']].forEach(([s, e], i) => { const x = 360 + i * 260, y = 500; withA(E(lt, at(3, .1 + i * .12), .3), () => { card(x, y, 220, 220); txt(e, x, y - 20, { size: 80 }); txt(s, x, y + 70, { size: 34, weight: 700 }); }); });
    arrowLine(1060, 500, 1220, 500, E(lt, at(3, .45), .5), '#fff', 10); withA(E(lt, at(3, .55)), () => { thought(1500, 500, 460, 260); txt('🌀 remix 🌀', 1500, 500, { size: 56, weight: 700 }); });
  }, () => {
    paperBg('#2A1E5C'); ch({ x: 560, y: 960, c: EX[1], s: 1.3, expr: 'calm', sd: 1 }); g.fillStyle = '#1E1440'; rr(470, 680, 180, 30, 10); g.fill();
    [['sound', '🎵', .15], ['touch', '✋', .3], ['smell', '👃', .45], ['taste', '👅', .6]].forEach(([s, e, f], i) => { const x = 1100 + (i % 2) * 400, y = 360 + Math.floor(i / 2) * 300; withA(E(lt, at(4, f), .3), () => { card(x, y, 320, 220); txt(e, x, y - 20, { size: 70 }); txt(s, x, y + 70, { size: 38, weight: 700 }); }); });
    txt('blind since birth: dreams without images', 560, 360, { size: 40, weight: 700, color: '#fff', maxW: 700, alpha: E(lt, at(4, .1)) });
  }]);
};
S.theories = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6], [() => {
    paperBg('#E8EEF7'); chapter(3, 'Four big ideas', lt); heading('WHY DO WE DREAM?', 380, COL.ink, 100);
    [1, 2, 3, 4].forEach(i => { const p = B(lt, .6 + i * .2); g.fillStyle = COL.max; g.beginPath(); g.arc(480 + i * 190, 600, 64 * p, 0, 7); g.fill(); txt(String(i), 480 + i * 190, 604, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#F4E9D2'); tipTag9(1, 'Hidden wishes (Freud)');
    ch({ x: 520, y: 960, c: '#8C8C8C', s: 1.4, expr: 'smug', sd: 4 }); g.fillStyle = '#E8E4DC'; g.beginPath(); g.moveTo(450, 760); g.quadraticCurveTo(520, 900, 590, 760); g.fill();
    withA(E(lt, at(1, .2)), () => { thought(1240, 420, 640, 160); txt('dreams = disguised wishes', 1240, 422, { size: 44, font: 'Nunito', weight: 800 }); });
    stamp('LITTLE EVIDENCE', 1240, 760, E(lt, at(1, .7), .35), COL.red, -.08, 76);
  }, () => {
    paperBg('#E8EEF7'); tipTag9(2, 'Activation-synthesis');
    for (let i = 0; i < 14; i++) { const a = ((TT * 2 + i * .37) % 1); withA(1 - a, () => { g.fillStyle = [COL.alex, COL.sam, COL.ivy, COL.max][i % 4]; g.beginPath(); g.arc(500 + Math.cos(i * 2.1) * a * 300, 560 + Math.sin(i * 2.1) * a * 300, 16, 0, 7); g.fill(); }); }
    txt('random signals', 500, 900, { size: 46, weight: 700, alpha: E(lt, at(2, .3)) }); arrowLine(860, 560, 1080, 560, E(lt, at(2, .5), .5), COL.ink, 10);
    withA(E(lt, at(2, .6)), () => { bookOpen9(1420, 560, 1.1); txt('...stitched into a story', 1420, 900, { size: 46, weight: 700 }); });
    source('Hobson & McCarley (1977)', E(lt, at(2, .3)));
  }, () => {
    dreamSky(); tipTag9(3, 'Threat simulation');
    const run = (lt * 300) % (W + 400) - 200; ch(P_(SAM, { x: run, y: 900, s: 1, expr: 'scared', sweat: true })); ch({ x: run - 360, y: 900, c: '#3E2A50', s: 1.3, expr: 'determined', sd: 9 });
    withA(E(lt, at(3, .5)), () => { card(W / 2, 360, 900, 160); txt('a safe place to practice escaping', W / 2, 362, { size: 52, weight: 700, color: COL.max }); });
    source('Revonsuo (2000), Behavioral and Brain Sciences', E(lt, at(3, .3)));
  }, () => {
    paperBg('#E2EFEB'); tipTag9(4, 'Processing memories & emotions');
    brainChar(700, 560, 1.3, { hippo: .8, amyg: .5, expr: 'calm' }); ['today\'s lesson', 'a worry', 'a conversation'].forEach((s, i) => withA(E(lt, at(4, .1 + i * .1), .3), () => memCardish(1340, 330 + i * 150, s)));
    withA(E(lt, at(4, .65)), () => { card(1340, 860, 700, 140, 1, '#FFF7DC'); txt('"overnight therapy"? still being tested', 1340, 862, { size: 38, weight: 700, color: dark(COL.sam, .3) }); });
  }, () => {
    paperBg('#E2EFEB'); heading('DREAMING OF THE MAZE', 110);
    maze(460, 520, 1.3, E(lt, at(5, .1), 1.5)); lying(P_(SAM, { x: 860, y: 640, s: .6, expr: 'calm' })); withA(E(lt, at(5, .35)), () => { thought(1000, 360, 240, 110); maze(1000, 360, .25, 1, COL.max); });
    const base = 880; [['didn\'t dream of it', .2, COL.gray, .55], ['dreamed of the maze', .85, COL.ivy, .7]].forEach(([s, v, c, f], i) => { const x = 1300 + i * 320, p = E(lt, at(5, f), .8); bar(x, base, 200, 460, c, v * p); wrap(s, x, base + 50, 280, 40, { size: 32, weight: 700 }); });
    line(1150, base, 1770, base, 6, COL.ink); txt('improvement (illustrative)', 1460, 360, { size: 32, font: 'Nunito', weight: 800 });
    source('Wamsley, Tucker, Payne, Benavides & Stickgold (2010), Current Biology', E(lt, at(5, .3)));
  }, () => {
    paperBg('#ECE8F8'); heading('RATS REPLAY THE MAZE', 110);
    [['awake: running', 0, .1], ['asleep: same pattern', 1, .45]].forEach(([s, sl, f], i) => { const x = 560 + i * 800; withA(E(lt, at(6, f), .4), () => { card(x, 560, 680, 600); maze(x, 500, .9, (TT * .3) % 1, i ? COL.max : COL.ivy); rat(x - 120, 760, .8); txt(s, x, 820, { size: 44, weight: 700 }); if (sl) txt('z z', x + 200, 380, { size: 50, weight: 700, color: COL.max }); }); });
    source('Louie & Wilson (2001), Neuron', E(lt, at(6, .3)));
  }]);
};
function bookOpen9(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#C8553D'; rr(-220, -150, 440, 300, 14); g.fill(); g.fillStyle = '#FFFDF6'; rr(-200, -130, 190, 260, 8); g.fill(); rr(10, -130, 190, 260, 8); g.fill(); for (let i = 0; i < 7; i++) { line(-180, -100 + i * 30, -30, -100 + i * 30, 4, '#C9C3B8'); line(30, -100 + i * 30, 180, -100 + i * 30, 4, '#C9C3B8'); } g.restore(); }
function memCardish(x, y, s) { card(x, y, 460, 110); txt(s, x, y + 2, { size: 40, weight: 700 }); }
S.forget = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    dreamSky(); chapter(4, 'Why we forget our dreams', lt); for (let i = 0; i < 8; i++) { const a = ((lt * .4 + i * .15) % 1.2); withA(clamp(1 - a / 1.2), () => cloud(300 + (i * 197) % 1300, 700 - a * 400, .6 + (i % 3) * .2, false)); }
    txt('where do they go?', W / 2, 960, { size: 60, weight: 700, color: '#fff', alpha: E(lt, at(0, .3)) });
  }, () => {
    paperBg('#ECE8F8'); brainChar(700, 520, 1.3, { expr: 'tired' }); g.fillStyle = 'rgba(255,255,255,.6)'; rr(500, 300, 400, 80, 20); g.fill(); txt('SAVE ↓', 700, 342, { size: 44, weight: 700, color: COL.gray });
    withA(E(lt, at(1, .4)), () => { card(1380, 520, 640, 300); wrap('memory-saving chemicals: lower in REM', 1380, 520, 560, 60, { size: 48, weight: 700, color: COL.max }); });
  }, () => {
    nightBed(); lying(P_(SAM, { x: 600, y: 700, s: 1, expr: lt > at(2, .3) ? 'o' : 'calm' })); blanket9();
    withA(E(lt, at(2, .3)), () => { thought(1100, 360, 400, 140); txt('a dream!', 1100, 362, { size: 44, weight: 700, color: COL.max }); });
    pill('woke up briefly → remembered more', 1100, 560, { p: B(lt, at(2, .65)), bg: COL.ink, size: 38 });
  }, () => {
    dreamSky(); for (let i = 0; i < 5; i++) ch({ x: 300 + i * 330, y: 900, c: EX[i], s: .9, sd: i, expr: 'smile', alpha: .7 });
    withA(E(lt, at(3, .1)), () => { card(W / 2, 360, 1200, 180); txt('"every dream face is someone you\'ve seen"', W / 2, 362, { size: 50, weight: 700 }); });
    stamp('NO SOLID EVIDENCE', W / 2 + 280, 560, E(lt, at(3, .6), .35), '#C9752B', -.08, 70);
  }, () => {
    paperBg('#FFF4DE'); g.save(); g.translate(960, 560); g.rotate(-.04); g.fillStyle = '#FFFDF6'; rr(-320, -320, 640, 640, 16); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke(); g.fillStyle = COL.max; rr(-320, -320, 640, 100, 16); g.fill(); txt('DREAM JOURNAL', 0, -268, { size: 46, weight: 700, color: '#fff' });
    ['giraffe teacher', 'melting clock', 'exam?!'].forEach((s, i) => txt(s, -260, -160 + i * 90, { size: 44, font: 'Nunito', weight: 800, align: 'left', alpha: E(lt, at(4, .3) + i * .15, .3) })); g.restore();
    pill('before you check your phone', 960, 980, { p: B(lt, at(4, .7)), bg: COL.red, size: 40 });
  }]);
};
S.lucid = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    dreamSky(); chapter(5, 'Lucid dreams & sleep paralysis', lt); ch(P_(SAM, { x: 960, y: 900 - Math.sin(TT * 2) * 40, s: 1.3, expr: 'joy', arms: 'up' }));
    withA(E(lt, at(0, .5)), () => { thought(1360, 360, 520, 120); txt('"wait... I\'m dreaming!"', 1360, 362, { size: 44, font: 'Nunito', weight: 800 }); });
  }, () => {
    dreamSky(); heading('LUCID DREAMS', 120, '#FFD86E');
    for (let i = 0; i < 20; i++) { const on = i < 10 && lt > at(1, .3) + i * .05; ch({ x: 200 + (i % 10) * 170, y: 560 + Math.floor(i / 10) * 260, c: on ? COL.max : '#5A4E8A', top: on ? 'spike' : null, s: .55, sd: i, expr: on ? 'joy' : 'calm' }); }
    txt('~1 in 2: at least once · ~1 in 4: regularly', W / 2, 1000, { size: 44, weight: 700, color: '#fff', alpha: E(lt, at(1, .6)) }); source('Saunders et al. (2016), meta-analysis', E(lt, at(1, .4)));
  }, () => {
    paperBg('#ECE8F8'); heading('TALKING TO A DREAMER', 110);
    ch({ x: 420, y: 900, c: '#93B7A8', s: 1.2, expr: 'smile', sd: 2 }); withA(E(lt, at(2, .3)), () => { bubble(560, 460, 300, 110, 'bl'); txt('8 − 6 = ?', 560, 462, { size: 50, weight: 700 }); });
    lying(P_(SAM, { x: 1240, y: 760, s: 1, expr: 'calm' })); g.fillStyle = '#6C8EBF'; rr(1320, 700, 460, 130, 44); g.fill();
    withA(E(lt, at(2, .6)), () => { eyeMove(1140, 500, 2); txt('← → ← →   = "2"', 1140, 620, { size: 50, weight: 700, color: COL.max }); });
    source('Konkoly et al. (2021), Current Biology', E(lt, at(2, .4)));
  }, () => {
    g.fillStyle = '#0E1022'; g.fillRect(0, 0, W, H); heading('SLEEP PARALYSIS', 120, '#FF9A9A');
    lying(P_(SAM, { x: 560, y: 700, s: 1.1, expr: 'scared', sweat: true })); g.fillStyle = '#3B4A70'; rr(640, 640, 700, 140, 50); g.fill();
    withA(.4 + .2 * Math.sin(TT * 2), () => { g.fillStyle = '#000'; ell(1500, 520, 120, 260); g.fill(); eyes(1500, 400, 1, 600, 600, 1, 2); });
    ['awake, but can\'t move', 'usually harmless', '~8% of people'].forEach((s, i) => pill(s, 960, 880 + i * 0 + (i - 1) * 0, { p: 0 }));
    [['awake, but can\'t move', .2], ['usually harmless', .5], ['~8% of people', .75]].forEach(([s, f], i) => pill(s, 560 + i * 420, 940, { p: B(lt, at(3, f)), bg: i === 1 ? COL.ivy : COL.ink2, size: 38 }));
    source('Sharpless & Barber (2011), Sleep Medicine Reviews', E(lt, at(3, .4)));
  }]);
};
S.nightmares = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#E2EFEB'); chapter(6, 'Tips for better dreams', lt); heading('BETTER DREAMS', 380, COL.ink, 110);
    [1, 2, 3, 4].forEach(i => { const p = B(lt, .6 + i * .2); g.fillStyle = COL.ivy; g.beginPath(); g.arc(480 + i * 190, 600, 64 * p, 0, 7); g.fill(); txt(String(i), 480 + i * 190, 604, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#ECE8F8'); tipTag9(1, 'Protect your sleep');
    const x0 = 260, w = 1400; for (let i = 0; i < 8; i++) { const rem = .08 + i * .025; g.fillStyle = '#D9D2C4'; rr(x0 + i * w / 8 + 6, 420, w / 8 - 12, 200, 10); g.fill(); g.fillStyle = COL.max; rr(x0 + i * w / 8 + 6, 620 - 200 * rem * 3, w / 8 - 12, 200 * rem * 3, 10); g.fill(); txt((i + 1) + 'h', x0 + i * w / 8 + w / 16, 660, { size: 30, weight: 700 }); }
    withA(E(lt, at(1, .35)), () => { g.fillStyle = 'rgba(209,73,91,.25)'; g.fillRect(x0 + 6 * w / 8, 400, 2 * w / 8, 240); txt('cut short = less REM', x0 + 7 * w / 8, 360, { size: 40, weight: 700, color: COL.red }); });
    pill('alcohol before bed can suppress REM', W / 2, 860, { p: B(lt, at(1, .7)), bg: COL.ink, size: 42 });
  }, () => {
    paperBg('#FFF4DE'); tipTag9(2, 'Imagery rehearsal for nightmares');
    withA(E(lt, at(2, .1)), () => { card(560, 520, 640, 460, 1, '#E3E4EE'); txt('the nightmare', 560, 340, { size: 50, weight: 700, color: COL.ink2 }); ch(P_(SAM, { x: 560, y: 700, s: .8, expr: 'scared' })); });
    arrowLine(900, 520, 1040, 520, E(lt, at(2, .35), .5), COL.ink, 10);
    withA(E(lt, at(2, .4)), () => { card(1360, 520, 640, 460, 1, '#FFFDF6'); txt('a new ending', 1360, 340, { size: 50, weight: 700, color: COL.ivy }); ch(P_(SAM, { x: 1360, y: 700, s: .8, expr: 'joy', arms: 'up' })); });
    pill('rehearse it a few minutes a day', W / 2, 900, { p: B(lt, at(2, .65)), bg: COL.ivy, size: 42 }); source('Krakow et al. (2001), JAMA', E(lt, at(2, .5)));
  }, () => {
    paperBg('#FFF4DE'); tipTag9(3, 'Keep a dream journal'); g.save(); g.translate(700, 560); g.rotate(-.04); g.fillStyle = '#FFFDF6'; rr(-260, -300, 520, 600, 16); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke(); for (let i = 0; i < 9; i++) line(-220, -220 + i * 56, 200 - (i % 3) * 60, -220 + i * 56, 5, '#C9C3B8'); g.restore();
    withA(E(lt, at(3, .5)), () => { card(1400, 520, 640, 240); txt('patterns:', 1400, 460, { size: 46, weight: 700 }); txt('work stress → being chased', 1400, 550, { size: 40, font: 'Nunito', weight: 800, color: COL.max }); });
  }, () => {
    paperBg('#E2EFEB');
    card(W / 2, 520, 1300, 560, B(lt, L[4] + .2)); withA(E(lt, L[4] + .2), () => { txt('When to get help', W / 2, 310, { size: 70, weight: 700, color: COL.ivy });
      ['frequent nightmares', 'very distressing', 'linked to trauma'].forEach((s, i) => { const t0 = at(4, .12 + i * .14); check(600, 430 + i * 100, 1.3, E(lt, t0, .4), COL.ivy); txt(s, 670, 432 + i * 100, { size: 46, font: 'Nunito', weight: 800, align: 'left', alpha: E(lt, t0, .4) }); });
      pill('talk to a doctor or therapist: effective treatments exist', W / 2, 740, { p: B(lt, at(4, .6)), bg: COL.ivy, size: 36 }); });
  }]);
};
S.outro9 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 2, 3], [() => {
    dreamSky(); g.fillStyle = '#E8DCC4'; rr(160, 160, 1600, 760, 30); g.fill(); meltClock(1350, 340, 1.1); giraffe(1550, 860, .8);
    const fly = E(lt, at(1, .55), 1.5); g.fillStyle = '#9CC3DA'; rr(300, 260, 320, 300, 10); g.fill(); g.lineWidth = 10; g.strokeStyle = '#B8B0A2'; rr(300, 260, 320, 300, 10); g.stroke();
    ch(P_(SAM, { x: lerp(760, 460, fly), y: lerp(900, 300, fly), s: lerp(1.1, .6, fly), expr: lt > at(1, .3) ? 'joy' : 'nervous', arms: fly > 0 ? 'up' : 'down' }));
    withA(E(lt, at(1, .2)) * (1 - E(lt, at(1, .6), .3)), () => { thought(1000, 460, 440, 120); txt('"this is a dream!"', 1000, 462, { size: 44, font: 'Nunito', weight: 800 }); });
  }, () => {
    dreamSky(); txt("What's the weirdest dream you've ever had?", W / 2, 200, { size: 70, weight: 700, color: '#fff', alpha: B(lt, L[2]) });
    bubble(W / 2, 440, 860, 160, 'bl', B(lt, at(2, .3))); txt('tell me in the comments ↓', W / 2, 442, { size: 54, font: 'Nunito', weight: 800, alpha: E(lt, at(2, .3)) });
    [[480, IVY], [740, SAM], [1000, ALEX], [1260, MAX]].forEach(([x, c], i) => ch(P_(c, { x, y: 1000, s: .95, expr: 'joy', arms: i % 2 ? 'wave' : 'up' })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); txt('Sweet dreams!', W / 2, 330, { size: 110, weight: 700, color: COL.white }); txt('See you in the next one.', W / 2, 450, { size: 52, font: 'Nunito', weight: 800, color: COL.sam });
    [[560, IVY], [820, SAM], [1100, ALEX], [1360, MAX]].forEach(([x, c]) => ch(P_(c, { x, y: 960, s: 1.05, expr: 'calm', arms: 'wave' })));
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  dreamSky(); meltClock(1500, 560, 1.6); giraffe(1250, 1000, .8);
  ch(P_(SAM, { x: 560, y: 1260, s: 2.5, expr: 'o' })); for (let i = 0; i < 3; i++) txt('z', 820 + i * 60, 560 - i * 60, { size: 60 + i * 20, weight: 700, color: '#E0D4FF' });
  g.save(); g.translate(W / 2, 150); g.rotate(-.02); g.font = '700 150px Fredoka'; const a = 'WHY DO WE ', b = 'DREAM?'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 150, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 150, weight: 700, color: '#FFD86E', align: 'left' }); g.restore();
  finish(); };
