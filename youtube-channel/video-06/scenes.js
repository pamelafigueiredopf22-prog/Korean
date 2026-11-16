// Video 06 scenes: "Why New Year's Resolutions Fail (And How to Make Habits Stick)". Uses engine/core.js helpers.

// ---------- helpers for this video
function heading(s, y = 120, c = COL.ink, size = 76) { txt(s, W / 2, y, { size, weight: 700, color: c }); }
function tipTag6(n, s) { g.fillStyle = COL.ink; rr(60, 60, 120 + s.length * 26, 80, 40); g.fill(); g.fillStyle = COL.sam; g.beginPath(); g.arc(100, 100, 28, 0, 7); g.fill(); txt(String(n), 100, 102, { size: 36, weight: 700 }); txt(s, 145, 102, { size: 40, color: '#fff', align: 'left' }); }
function fireworks(t, n = 5) { for (let k = 0; k < n; k++) { const per = 2.4, ph = ((t + k * .57) % per) / per, cx = 260 + k * 340, cy = 220 + (k % 2) * 110, c = [COL.sam, COL.alex, COL.ivy, COL.max, '#FF8FB1'][k % 5];
  if (ph < .25) { const y = lerp(1080, cy, ph / .25); g.fillStyle = c; g.beginPath(); g.arc(cx, y, 6, 0, 7); g.fill(); }
  else { const r = (ph - .25) / .75; for (let i = 0; i < 18; i++) { const an = i / 18 * Math.PI * 2; withA(1 - r, () => { g.fillStyle = c; g.beginPath(); g.arc(cx + Math.cos(an) * r * 190, cy + Math.sin(an) * r * 190 + r * r * 60, 11 * (1 - r * .5), 0, 7); g.fill(); }); } } } }
function notebook(x, y, s, items, o = {}) { const { prog = 1, strike: st = [], title = 'RESOLUTIONS' } = o; g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(43,45,66,.18)'; rr(-300 + 12, -380 + 16, 600, 760, 20); g.fill(); g.fillStyle = '#FFFDF6'; rr(-300, -380, 600, 760, 20); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke();
  g.fillStyle = COL.ivy; rr(-300, -380, 600, 110, 20); g.fill(); g.fillRect(-300, -310, 600, 40); txt(title, 0, -320, { size: 48, weight: 700, color: '#fff' });
  for (let i = 0; i < 9; i++) line(-250, -200 + i * 66, 250, -200 + i * 66, 2, '#D9E4F0');
  items.forEach((s, i) => { const a = clamp(prog * items.length - i); if (a <= 0) return; withA(a, () => { g.strokeStyle = COL.ink; g.lineWidth = 4; g.strokeRect(-250, -236 + i * 66, 26, 26); txt(s, -205, -222 + i * 66, { size: 36, font: 'Nunito', weight: 800, align: 'left' }); if (st[i]) strike(0, -222 + i * 66, 470, st[i]); }); });
  g.restore(); }
function shoes(x, y, s, sparkle = 0) { g.save(); g.translate(x, y); g.scale(s, s); [[-50, 0], [50, 8]].forEach(([dx, dy]) => { g.fillStyle = '#EF476F'; g.beginPath(); g.moveTo(dx - 60, dy); g.quadraticCurveTo(dx - 60, dy - 50, dx - 10, dy - 50); g.lineTo(dx + 20, dy - 30); g.quadraticCurveTo(dx + 60, dy - 20, dx + 60, dy); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(dx - 60, dy - 8, 120, 10); });
  g.restore(); if (sparkle) for (let i = 0; i < 3; i++) { const a = (TT * 1.2 + i * .33) % 1; withA((1 - a) * sparkle, () => { g.fillStyle = '#FFD447'; g.save(); g.translate(x - 60 + i * 60, y - 80 - a * 40); g.rotate(TT); g.fillRect(-6, -6, 12, 12); g.restore(); }); } }
function livingRoom(o = {}) { const sky = o.night ? '#1E2547' : '#BFE3F2'; g.fillStyle = '#F2E6D2'; g.fillRect(0, 0, W, 860); g.fillStyle = sky; rr(1240, 140, 420, 360, 12); g.fill(); g.lineWidth = 14; g.strokeStyle = '#C9A77C'; rr(1240, 140, 420, 360, 12); g.stroke(); line(1450, 140, 1450, 500, 10, '#C9A77C');
  g.fillStyle = '#C9A77C'; g.fillRect(0, 860, W, 220); g.fillStyle = '#B5926A'; g.fillRect(0, 856, W, 10); g.fillStyle = '#8C5A3C'; g.fillRect(120, 380, 200, 480); g.fillStyle = '#F2D27A'; g.beginPath(); g.arc(290, 640, 9, 0, 7); g.fill(); }
function couch(x, y) { g.fillStyle = '#5B8DEF'; rr(x - 300, y - 170, 600, 120, 40); g.fill(); g.fillStyle = '#4A78D0'; rr(x - 330, y - 90, 660, 110, 40); g.fill(); rr(x - 360, y - 150, 90, 170, 40); g.fill(); rr(x + 270, y - 150, 90, 170, 40); g.fill(); }
function calPage(x, y, s, top, big, c = COL.red) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = 'rgba(43,45,66,.15)'; rr(-110 + 8, -130 + 10, 220, 260, 16); g.fill(); g.fillStyle = '#fff'; rr(-110, -130, 220, 260, 16); g.fill(); g.lineWidth = 5; g.strokeStyle = COL.ink; g.stroke();
  g.fillStyle = c; rr(-110, -130, 220, 70, 16); g.fill(); g.fillRect(-110, -80, 220, 20); txt(top, 0, -94, { size: top.length > 7 ? 30 : 40, weight: 700, color: '#fff', maxW: 200 }); txt(big, 0, 30, { size: big.length > 3 ? 64 : big.length > 2 ? 84 : 110, weight: 700, maxW: 200 }); g.restore(); }
function curve(x0, y0, w, h, f, prog, c, lw = 8) { g.beginPath(); for (let u = 0; u <= prog; u += .005) g.lineTo(x0 + u * w, y0 - f(u) * h); g.lineWidth = lw; g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
function axes(x0, y0, w, h, xl, yl) { line(x0, y0, x0 + w, y0, 6, COL.ink); line(x0, y0, x0, y0 - h, 6, COL.ink); txt(xl, x0 + w / 2, y0 + 80, { size: 36, font: 'Nunito', weight: 800 }); txt(yl, x0 + 10, y0 - h - 30, { size: 34, font: 'Nunito', weight: 800, align: 'left' }); }
function cookie(x, y, s) { g.fillStyle = '#C98B5B'; g.beginPath(); g.arc(x, y, 40 * s, 0, 7); g.fill(); g.fillStyle = '#5A3A22'; [[-12, -10], [14, -4], [-4, 16], [16, 18]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a * s, y + b * s, 6 * s, 0, 7); g.fill(); }); }
function mug(x, y, s) { g.fillStyle = '#fff'; rr(x - 40 * s, y - 50 * s, 80 * s, 100 * s, 12 * s); g.fill(); g.lineWidth = 6 * s; g.strokeStyle = COL.ink; g.stroke(); g.beginPath(); g.arc(x + 46 * s, y, 20 * s, -1.2, 1.2); g.stroke();
  for (let i = 0; i < 2; i++) { const a = (TT + i * .5) % 1; withA(1 - a, () => { g.strokeStyle = '#B0A7A0'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 10 + i * 20, y - 60 * s - a * 30); g.quadraticCurveTo(x + i * 20, y - 80 * s - a * 30, x - 10 + i * 20, y - 100 * s - a * 30); g.stroke(); }); } }
const LIST = ['run every morning', 'no more sugar', 'read 50 books', 'learn Italian', 'drink more water', 'meditate'];

// ---------- scenes
S.nyOpen = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    g.fillStyle = '#141833'; g.fillRect(0, 0, W, H); fireworks(lt); g.fillStyle = '#1C2140'; g.fillRect(0, 900, W, 180);
    txt('HAPPY NEW YEAR!', W / 2, 140, { size: 90, weight: 700, color: COL.sam, alpha: B(lt, .2) });
    ch(P_(IVY, { x: 760, y: 920, s: 1.5, expr: 'joy', arms: 'book' }));
    withA(B(lt, at(0, .55)), () => { g.save(); g.translate(1180, 640); g.rotate(-.1); g.fillStyle = COL.max; rr(-150, -90, 300, 180, 18); g.fill(); txt('GYM', 0, -20, { size: 60, weight: 700, color: '#fff' }); txt('MEMBER', 0, 40, { size: 36, weight: 700, color: '#fff' }); g.restore(); });
  }, () => {
    paperBg('#E2EFEB'); notebook(1100, 560, 1.15, LIST, { prog: E(lt, L[1], Le[1] - L[1]) });
    ch(P_(IVY, { x: 420, y: 960, s: 1.4, expr: 'joy', arms: 'up' }));
  }, () => {
    livingRoom(); calPage(700, 300, 1, 'JAN', '15'); couch(1100, 900);
    ch(P_(IVY, { x: 1100, y: 860, s: 1.1, expr: 'tired', arms: 'down' }));
    shoes(250, 880, 1, E(lt, at(2, .2))); pill('still clean', 250, 760, { p: B(lt, at(2, .35)), bg: COL.ink, size: 34 });
    withA(E(lt, at(2, .6)), () => { g.fillStyle = '#8C6A4E'; g.fillRect(1500, 860, 380, 60); g.save(); g.translate(1560, 900); g.rotate(.15); g.fillStyle = COL.ivy; rr(-50, -20, 120, 40, 6); g.fill(); g.restore(); txt('under the bed...', 1690, 980, { size: 34, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#E2EFEB'); ch(P_(IVY, { x: 560, y: 960, s: 1.6, expr: lt > at(3, .4) ? 'smile' : 'worried' }));
    withA(E(lt, at(3, .3)), () => { card(1300, 420, 820, 200); txt("not because she's weak", 1300, 422, { size: 54, weight: 700 }); });
    withA(E(lt, at(3, .65)), () => { card(1300, 700, 820, 200, 1, '#FFF7DC'); txt('little to do with willpower', 1300, 702, { size: 50, weight: 700, color: dark(COL.sam, .3) }); });
  }]);
};
S.title6 = (lt, L, Le, D, at) => {
  g.fillStyle = COL.night; g.fillRect(0, 0, W, H); confetti(lt, .2);
  [['WHY RESOLUTIONS FAIL', COL.white, 270, 120], ['(and how to make habits stick)', COL.sam, 400, 64]].forEach(([s, c, y, sz], i) => { const p = B(lt, .2 + i * .5, .5); g.save(); g.translate(W / 2, y); g.scale(p, p); txt(s, 0, 0, { size: sz, weight: 700, color: c }); g.restore(); });
  const p = E(lt, 1, .7); ch(P_(IVY, { x: 860, y: 1080 + lerp(300, 30, p), s: 1.4, expr: 'smile' })); shoes(1100, 1060, 1.2, 1);
};
S.fresh = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#F7EDD3'); chapter(1, 'The fresh start effect', lt);
    const flip = E(lt, .6, 1.2); calPage(960, 480, 1.6, flip > .5 ? 'JAN' : 'DEC', flip > .5 ? '1' : '31', flip > .5 ? COL.ivy : COL.red);
    ch(P_(IVY, { x: 520, y: 960, s: 1.2, expr: 'o', look: 1 })); txt('why January?', 1400, 900, { size: 56, weight: 700, alpha: E(lt, at(0, .3)) });
  }, () => {
    paperBg('#F7EDD3'); heading('SEARCHES FOR "DIET"', 120);
    const x0 = 200, y0 = 860, w = 1500, h = 560, spikes = [.05, .3, .55, .8], f = u => .2 + .05 * Math.sin(u * 40) + spikes.reduce((a, s) => a + .6 * Math.exp(-Math.pow((u - s) / .012, 2)), 0);
    axes(x0, y0, w, h, 'time', 'interest'); curve(x0, y0, w, h, f, E(lt, at(1, .2), 2.5), COL.alex, 6);
    [['new week', .05], ['new month', .3], ['birthday', .55], ['new year', .8]].forEach(([s, u], i) => pill(s, x0 + u * w, y0 - h * .95, { p: B(lt, at(1, .45) + i * .2), bg: COL.ink, size: 30 }));
    source('Dai, Milkman & Riis (2014), Management Science; illustrative', E(lt, at(1, .3)));
  }, () => {
    paperBg('#F7EDD3'); heading('TEMPORAL LANDMARKS');
    [['MON', 'new week', COL.ivy], ['1st', 'new month', COL.max], ['🎂', 'birthday', COL.alex], ['JAN 1', 'new year', COL.red]].forEach(([b, s, c], i) => { const p = B(lt, at(2, .05 + i * .2)); withA(E(lt, at(2, .05 + i * .2), .3), () => { g.save(); scaleAt(330 + i * 420, 520, p); calPage(330 + i * 420, 480, 1.2, s.toUpperCase(), b, c); g.restore(); }); });
  }, () => {
    paperBg('#F7EDD3');
    [['OLD ME', 'who failed', .1, 1], ['NEW ME', 'gets it right this time', .5, 0]].forEach(([h, s, f, old], i) => { const x = 560 + i * 800; withA(E(lt, at(3, f), .4), () => { card(x, 560, 680, 640, 1, old ? '#E3E4EE' : '#FFFDF6'); txt(h, x, 300, { size: 64, weight: 700, color: old ? COL.gray : COL.ivy }); txt(s, x, 370, { size: 40, font: 'Nunito', weight: 800 });
      ch(P_(IVY, { x, y: 820, s: 1, expr: old ? 'sad' : 'joy', gray: old ? .8 : 0, arms: old ? 'down' : 'up' })); }); });
    arrowLine(920, 560, 1060, 560, E(lt, at(3, .45), .5), COL.ink, 10);
  }, () => {
    paperBg('#F7EDD3'); battery(700, 520, 1.4, E(lt, L[4], 1.2)); txt('MOTIVATION: REAL', 700, 860, { size: 52, weight: 700, color: COL.green, alpha: E(lt, at(4, .2)) });
    withA(E(lt, at(4, .55)), () => { txt('?', 1350, 560, { size: 300, weight: 700, color: COL.max }); txt('what we do with it', 1350, 860, { size: 52, weight: 700 }); });
  }]);
};
S.work = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#EDEAF4'); chapter(2, 'Do resolutions really fail?', lt);
    txt('"ALMOST ALL RESOLUTIONS FAIL"', W / 2, 420, { size: 80, weight: 700, alpha: B(lt, .3) }); stamp('NOT QUITE', W / 2 + 300, 600, E(lt, at(0, .6), .35), '#C9752B', -.1, 90);
  }, () => {
    paperBg('#EDEAF4'); heading('STILL ON TRACK AFTER 6 MONTHS');
    const base = 840; [['made a resolution', .46, COL.ivy, .3], ['wanted to change, no resolution', .04, COL.gray, .65]].forEach(([s, v, c, f], i) => { const x = 720 + i * 480, p = E(lt, at(1, f), .8); bar(x, base, 280, 1100, c, v * p); txt(Math.round(v * 100 * p) + '%', x, base - 1100 * v * p - 50, { size: 70, weight: 700, alpha: p }); wrap(s, x, base + 70, 360, 46, { size: 36, weight: 700 }); });
    line(480, base, 1440, base, 8, COL.ink); source('Norcross, Mrykalo & Blagys (2002), Journal of Clinical Psychology', E(lt, at(1, .3)));
  }, () => {
    paperBg('#EDEAF4'); txt('55%', W / 2, 420, { size: 260, weight: 700, color: COL.ivy, alpha: B(lt, at(2, .4)) }); txt('felt successful a full year later', W / 2, 620, { size: 56, font: 'Nunito', weight: 800, alpha: E(lt, at(2, .5)) });
    for (let i = 0; i < 10; i++) ch({ x: 240 + i * 160, y: 1000, c: i < 5 || (i === 5 && lt > at(2, .7)) ? COL.ivy : COL.gray, top: i < 6 ? 'bun' : null, s: .55, sd: i, expr: i < 6 ? 'joy' : 'neutral', alpha: E(lt, at(2, .3) + i * .05) });
    source('Oscarsson, Carlbring, Andersson & Rozental (2020), PLOS ONE, 1,066 participants', E(lt, at(2, .4)));
  }, () => {
    paperBg('#EDEAF4'); heading('WHAT SUCCESSFUL RESOLVERS DO');
    [['changing their surroundings', COL.ivy, .1, 1], ['rewarding themselves', COL.ivy, .3, 1], ['wishful thinking', COL.gray, .55, 0], ['self-blame', COL.gray, .7, 0]].forEach(([s, c, f, ok], i) => { const x = ok ? 560 : 1360, y = 400 + (i % 2) * 220; withA(E(lt, at(3, f), .4), () => { card(x, y, 680, 160, 1, ok ? '#FFFDF6' : '#E3E4EE'); txt(s, x, y + 2, { size: 46, weight: 700, color: ok ? COL.ivy : COL.ink2 }); }); });
    txt('succeeded', 560, 860, { size: 44, font: 'Nunito', weight: 800, color: COL.ivy, alpha: E(lt, at(3, .3)) }); txt('struggled', 1360, 860, { size: 44, font: 'Nunito', weight: 800, color: COL.ink2, alpha: E(lt, at(3, .6)) });
    source('Norcross, Ratzin & Payne (1989), Addictive Behaviors', E(lt, at(3, .3)));
  }, () => {
    paperBg('#EDEAF4'); heading('SPECIFIC BEATS VAGUE');
    withA(E(lt, at(4, .35)), () => { card(560, 560, 680, 360, 1, '#E3E4EE'); txt('"I\'ll get fitter"', 560, 520, { size: 52, weight: 700, color: COL.ink2 }); txt('a wish', 560, 620, { size: 44, font: 'Nunito', weight: 800, color: COL.ink2 }); });
    withA(E(lt, at(4, .65)), () => { card(1360, 560, 680, 360, 1, '#FFFDF6'); wrap('"I\'ll walk 10 minutes after breakfast"', 1360, 510, 600, 58, { size: 46, weight: 700, color: COL.ivy }); txt('a plan', 1360, 650, { size: 44, font: 'Nunito', weight: 800, color: COL.ivy }); });
    source('Locke & Latham, goal-setting theory (e.g. 2002, American Psychologist)', E(lt, at(4, .2)));
  }, () => {
    paperBg('#E8EEF7'); g.fillStyle = '#2E5E8C'; rr(360, 220, 1200, 680, 20); g.fill(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; for (let x = 360; x < 1560; x += 60) line(x, 220, x, 900, 2, 'rgba(255,255,255,.15)'); for (let y = 220; y < 900; y += 60) line(360, y, 1560, y, 2, 'rgba(255,255,255,.15)');
    txt('BETTER DESIGN', W / 2, 400, { size: 100, weight: 700, color: '#fff', alpha: B(lt, at(5, .3)) }); notebook(W / 2, 760, .4, ['one small goal'], { prog: E(lt, at(5, .5)), title: '2.0' });
  }]);
};
S.myth21 = (lt, L, Le, D, at) => {
  const x0 = 260, y0 = 860, w = 1400, h = 520, auto = (d, k) => 1 - Math.exp(-d / k);
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#F6E3DC'); chapter(3, 'The 21-day myth', lt);
    calPage(960, 500, 2, 'DAYS', '21', COL.alex); txt('to form a habit?', W / 2, 860, { size: 60, weight: 700, alpha: E(lt, at(0, .5)) });
  }, () => {
    paperBg('#F6E3DC');
    g.save(); g.translate(620, 540); g.rotate(-.05); g.fillStyle = '#3E6BC0'; rr(-200, -280, 400, 560, 14); g.fill(); g.fillStyle = '#2E5296'; g.fillRect(-200, -280, 36, 560); txt('SELF-HELP', 18, -120, { size: 52, weight: 700, color: '#fff' }); txt('1960s', 18, 0, { size: 60, weight: 700, color: COL.sam }); g.restore();
    stamp('NOT A STUDY', 1300, 480, E(lt, at(1, .5), .35), COL.red, -.12, 84);
  }, () => {
    paperBg('#F6E3DC'); heading('HOW LONG IT REALLY TAKES', 110);
    axes(x0, y0, w, h, 'days', 'how automatic it feels'); const xd = d => x0 + d / 260 * w;
    withA(E(lt, at(2, .6)), () => { g.fillStyle = 'rgba(231,111,81,.15)'; g.fillRect(xd(18), y0 - h, xd(254) - xd(18), h); pill('18 days', xd(18), y0 + 40, { bg: COL.ink2, size: 30 }); pill('~254 days', xd(254) - 20, y0 + 40, { bg: COL.ink2, size: 30 }); });
    curve(x0, y0, w, h, u => .9 * auto(u * 260, 30), E(lt, at(2, .1), 1.6), COL.alex);
    withA(E(lt, at(2, .35)), () => { line(xd(66), y0, xd(66), y0 - h, 5, COL.ink); pill('~66 days on average', xd(66) + 230, y0 - h * .45, { bg: COL.alex, size: 40 }); });
    source('Lally, van Jaarsveld, Potts & Wardle (2010), European Journal of Social Psychology', E(lt, at(2, .3)));
  }, () => {
    paperBg('#F6E3DC'); heading('EASY HABITS FORM FASTER', 110);
    axes(x0, y0, w, h, 'days', 'automatic'); curve(x0, y0, w, h, u => .9 * auto(u * 260, 18), E(lt, at(3, .1), 1.4), COL.ivy); curve(x0, y0, w, h, u => .9 * auto(u * 260, 110), E(lt, at(3, .45), 1.4), COL.red);
    withA(E(lt, at(3, .25)), () => { g.fillStyle = '#BFE3F2'; rr(700, 300, 70, 100, 10); g.fill(); g.strokeStyle = COL.ink; g.lineWidth = 5; g.stroke(); txt('water with breakfast', 940, 350, { size: 36, weight: 700, color: COL.ivy, align: 'left' }); });
    withA(E(lt, at(3, .6)), () => txt('50 sit-ups', 1400, 680, { size: 40, weight: 700, color: COL.red })); txt('illustrative', W / 2, y0 + 130, { size: 28, font: 'Nunito', weight: 700, color: COL.ink2 });
  }, () => {
    paperBg('#E2EFEB'); heading('ONE SLIP ≠ RESET', 110, COL.ivy);
    axes(x0, y0, w, h, 'days', 'automatic'); const miss = .32; curve(x0, y0, w, h, u => .9 * auto(u * 260, 40) - (u > miss && u < miss + .02 ? .03 : 0), E(lt, at(4, .05), 1.6), COL.ivy);
    withA(E(lt, at(4, .35)), () => { const xm = x0 + miss * w, ym = y0 - .9 * auto(miss * 260, 40) * h; cross(xm, ym - 60, 26, 1); pill('missed a day', xm, ym - 130, { bg: COL.red, size: 34 }); });
    withA(E(lt, at(4, .7)), () => pill('...and kept going', 1400, 300, { bg: COL.ivy, size: 44 }));
  }]);
};
S.traps = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#EDEAF4'); chapter(4, 'Why we give up', lt); heading('4 COMMON TRAPS', 300, COL.ink, 100);
    [1, 2, 3, 4].forEach(i => { const p = B(lt, .6 + i * .2); g.fillStyle = COL.alex; g.beginPath(); g.arc(480 + i * 190, 600, 64 * p, 0, 7); g.fill(); txt(String(i), 480 + i * 190, 604, { size: 64 * p, weight: 700, color: '#fff' }); });
    ch(P_(IVY, { x: 960, y: 1040, s: .9, expr: 'worried' }));
  }, () => {
    paperBg('#EDEAF4'); tipTag6(1, 'Too many goals'); ch(P_(IVY, { x: 960, y: 960, s: 1.4, expr: 'scared', arms: 'up', sweat: true }));
    ['run', 'no sugar', '50 books', 'Italian', 'water', 'meditate'].forEach((s, i) => { const an = TT * 1.6 + i / 6 * Math.PI * 2, fall = E(lt, at(1, .7) + i * .08, .6); pill(s, 960 + Math.cos(an) * 380, 480 + Math.sin(an) * 160 + fall * 600, { bg: [COL.alex, COL.ivy, COL.max, COL.red, '#5B8DEF', COL.ink2][i], size: 38 }); });
  }, () => {
    paperBg('#EDEAF4'); heading('FALSE HOPE SYNDROME', 130, COL.alex);
    const steps = ['giant goals', 'fall short', 'feel bad', 'try again next year'], cx = 960, cy = 590, R = 280, spin = (lt - L[2]) * .8;
    g.lineWidth = 10; g.strokeStyle = '#C9C3B8'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.strokeStyle = COL.ink; g.beginPath(); g.arc(cx, cy, R, spin, spin + 1.2); g.stroke();
    steps.forEach((s, i) => { const an = -Math.PI / 2 + i * Math.PI / 2; pill(s, cx + Math.cos(an) * R, cy + Math.sin(an) * R, { p: B(lt, at(2, .3 + i * .12)), bg: [COL.max, COL.red, COL.ink2, COL.alex][i], size: 40 }); });
    ch(P_(IVY, { x: cx, y: cy + 120, s: .8, expr: 'tired' })); source('Polivy & Herman (2002), American Psychologist', E(lt, at(2, .3)));
  }, () => {
    paperBg('#F7EDD3'); tipTag6(2, 'The "what the hell" effect');
    cookie(560, 520, 2.2); withA(E(lt, at(3, .3)), () => { thought(560, 300, 420, 100); txt('diet ruined anyway...', 560, 302, { size: 38, font: 'Nunito', weight: 800 }); });
    withA(E(lt, at(3, .6)), () => { g.fillStyle = '#3E6BC0'; rr(1100, 360, 520, 360, 20); g.fill(); txt('COOKIES', 1360, 440, { size: 60, weight: 700, color: '#fff' }); for (let i = 0; i < 6; i++) cookie(1190 + (i % 3) * 90, 580 + Math.floor(i / 3) * 80, .9); txt('...the whole box', 1360, 800, { size: 48, weight: 700, color: COL.red }); });
    ch(P_(IVY, { x: 900, y: 1000, s: .9, expr: lt > at(3, .6) ? 'nervous' : 'smile' }));
    source('Herman & Mack (1975); Polivy & Herman (1985)', E(lt, at(3, .3)));
  }, () => {
    paperBg('#E2EFEB'); tipTag6(3, 'Only "stop" goals');
    [['APPROACH', '"eat more fruit"', .59, COL.ivy, .2], ['AVOIDANCE', '"stop eating sweets"', .47, COL.gray, .45]].forEach(([h, s, v, c, f], i) => { const x = 720 + i * 480, p = E(lt, at(4, f), .8), base = 860;
      bar(x, base, 280, 900, c, v * p); txt(Math.round(v * 100 * p) + '%', x, base - 900 * v * p - 50, { size: 64, weight: 700, alpha: p }); txt(h, x, base + 60, { size: 44, weight: 700, color: c }); txt(s, x, base + 115, { size: 34, font: 'Nunito', weight: 800 }); });
    line(480, 860, 1440, 860, 8, COL.ink); source('Oscarsson et al. (2020): success after one year', E(lt, at(4, .3)));
  }, () => {
    paperBg('#EDEAF4'); tipTag6(4, 'Willpower alone');
    const tire = E(lt, at(5, .1), 2); ch(P_(IVY, { x: 760, y: 960, s: 1.5, expr: tire > .6 ? 'tired' : 'determined', arms: tire > .6 ? 'down' : 'up', sweat: tire > .4 }));
    battery(1300, 520, 1.2, 1 - tire * .85); txt('willpower', 1300, 300, { size: 50, weight: 700 });
    withA(E(lt, at(5, .65)), () => { card(W / 2, 200, 900, 120); txt('the real secret...', W / 2, 202, { size: 60, weight: 700, color: COL.max }); });
  }]);
};
S.cues = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#E8EEF7'); chapter(5, 'Habits run on cues', lt);
    const p = E(lt, at(0, .2), 1.5) * .43; g.lineWidth = 80; g.strokeStyle = '#D3D6DE'; g.beginPath(); g.arc(620, 560, 220, 0, 7); g.stroke(); g.strokeStyle = COL.max; g.beginPath(); g.arc(620, 560, 220, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.stroke();
    txt(Math.round(p * 100) + '%', 620, 570, { size: 100, weight: 700, color: COL.max }); txt('of daily actions are habits', 620, 900, { size: 44, font: 'Nunito', weight: 800 });
    ch(P_(IVY, { x: 1400, y: 960, s: 1.3, expr: 'calm' })); withA(E(lt, at(0, .6)), () => { thought(1460, 480, 380, 100); txt('...on autopilot', 1460, 482, { size: 38, font: 'Nunito', weight: 800 }); });
    source('Wood, Quinn & Kashy (2002), JPSP', E(lt, at(0, .3)));
  }, () => {
    paperBg('#E8EEF7'); heading('CUE → ROUTINE');
    [['coffee machine', 'phone', .3], ['couch', 'TV', .6]].forEach(([a, b, f], i) => { const y = 420 + i * 300, p = E(lt, at(1, f), .5); withA(p, () => { card(560, y, 520, 180); txt(a, 560, y + 2, { size: 50, weight: 700 }); arrowLine(840, y, 1080, y, E(lt, at(1, f) + .2, .5), COL.ink, 10); card(1360, y, 520, 180, 1, '#FFF7DC'); txt(b, 1360, y + 2, { size: 50, weight: 700, color: dark(COL.sam, .3) }); }); });
    [['a place', .08], ['a time', .14], ['a previous action', .2]].forEach(([s, f], i) => pill(s, 560 + i * 400, 220, { p: B(lt, at(1, f)), bg: COL.ink, size: 36 }));
  }, () => {
    paperBg('#E8EEF7'); heading('NEW PLACE, NEW HABITS');
    withA(E(lt, at(2, .05)), () => { card(560, 580, 700, 600, 1, '#E3E4EE'); txt('old room', 560, 320, { size: 48, weight: 700, color: COL.ink2 }); g.fillStyle = COL.ink; rr(430, 420, 260, 170, 12); g.fill(); g.fillStyle = '#5B8DEF'; rr(445, 435, 230, 140, 8); g.fill(); ch(P_(IVY, { x: 560, y: 820, s: .8, expr: 'tired' })); txt('TV in front of the couch', 560, 900, { size: 32, font: 'Nunito', weight: 800 }); });
    withA(E(lt, at(2, .55)), () => { card(1360, 580, 700, 600, 1, '#FFFDF6'); txt('new room', 1360, 320, { size: 48, weight: 700, color: COL.ivy }); ch(P_(IVY, { x: 1360, y: 820, s: .8, expr: 'calm', arms: 'book' })); txt('TV in another room', 1360, 900, { size: 32, font: 'Nunito', weight: 800 }); });
    source('Wood, Tam & Witt (2005), "Changing circumstances, disrupting habits"', E(lt, at(2, .3)));
  }, () => {
    livingRoom(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, W, H);
    ch(P_(IVY, { x: 960, y: 940, s: 1.4, expr: 'joy', arms: 'up' })); confetti(lt, L[3] + .2);
    withA(E(lt, at(3, .4)), () => { card(W / 2, 200, 1000, 130); txt('a new place or routine = a great moment to start', W / 2, 202, { size: 44, weight: 700 }); });
  }, () => {
    paperBg('#E2EFEB'); heading('HABITS BEHIND SELF-CONTROL', 120, COL.ivy);
    [['self-control', COL.max, 360], ['good habits', COL.ivy, 960], ['better outcomes', COL.sam, 1560]].forEach(([s, c, x], i) => { withA(E(lt, at(4, .1 + i * .15), .4), () => { card(x, 480, 460, 170); txt(s, x, 482, { size: 48, weight: 700, color: dark(c, .2) }); }); if (i < 2) arrowLine(x + 240, 480, x + 360, 480, E(lt, at(4, .2 + i * .15), .4), COL.ink, 8); });
    ch(P_(IVY, { x: 960, y: 980, s: 1.2, expr: 'calm' })); withA(E(lt, at(4, .75)), () => { thought(1180, 700, 360, 100); txt('autopilot ✓', 1180, 702, { size: 40, weight: 700, color: COL.ivy }); });
    source('Galla & Duckworth (2015), JPSP', E(lt, at(4, .3)));
  }]);
};
S.tips6 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6, 7, 8], [() => {
    paperBg('#E2EFEB'); chapter(6, 'How to make habits stick', lt); heading('HOW TO MAKE IT STICK', 380, COL.ink, 100);
    [1, 2, 3, 4, 5, 6, 7].forEach(i => { const p = B(lt, .8 + i * .2); g.fillStyle = COL.ivy; g.beginPath(); g.arc(200 + i * 190, 620, 64 * p, 0, 7); g.fill(); txt(String(i), 200 + i * 190, 624, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#E2EFEB'); tipTag6(1, 'One goal. Make it small.');
    withA(E(lt, at(1, .1)), () => { card(560, 560, 680, 520, 1, '#E3E4EE'); txt('"run every morning"', 560, 420, { size: 46, weight: 700, color: COL.ink2 }); cross(560, 620, 90, E(lt, at(1, .3), .4)); });
    withA(E(lt, at(1, .45)), () => { card(1360, 560, 680, 520, 1, '#FFFDF6'); wrap('shoes on + walk 5 minutes after breakfast', 1360, 430, 580, 56, { size: 44, weight: 700, color: COL.ivy }); shoes(1360, 680, 1); check(1360, 780, 2, E(lt, at(1, .7), .4), COL.ivy); });
  }, () => {
    paperBg('#F7EDD3'); tipTag6(2, 'Attach it to a cue');
    mug(420, 560, 2.2); card(1220, 560, 1100, 400, B(lt, at(2, .1)));
    withA(E(lt, at(2, .1)), () => { txt('AFTER', 800, 470, { size: 70, weight: 700, color: COL.max, align: 'left' }); txt('I pour my coffee,', 1080, 470, { size: 52, weight: 600, align: 'left' }); txt("I'LL", 800, 640, { size: 70, weight: 700, color: COL.ivy, align: 'left', alpha: E(lt, at(2, .4)) }); txt('stretch for 2 minutes', 960, 640, { size: 52, weight: 600, align: 'left', alpha: E(lt, at(2, .4)) }); });
  }, () => {
    paperBg('#FBE3EE'); tipTag6(3, 'Make it enjoyable now');
    ch(P_(IVY, { x: 520, y: 960, s: 1.4, expr: 'joy', arms: 'up', hop: Math.abs(Math.sin(TT * 7)) * 20 })); for (let i = 0; i < 3; i++) { const a = (TT * .7 + i * .33) % 1; note(700 + a * 100, 500 - a * 150, 1.2, clamp(1 - a)); }
    const base = 860; [['enjoying it now', .85, COL.alex, .3], ['long-term benefits', .3, COL.gray, .5]].forEach(([s, v, c, f], i) => { const x = 1200 + i * 360, p = E(lt, at(3, f), .8); bar(x, base, 220, 560, c, v * p); wrap(s, x, base + 60, 300, 44, { size: 34, weight: 700 }); });
    line(1040, base, 1720, base, 8, COL.ink); txt('predicts sticking with it', 1380, 220, { size: 40, weight: 700 }); txt('illustrative', 1380, base + 150, { size: 28, font: 'Nunito', weight: 700, color: COL.ink2 });
    source('Woolley & Fishbach (2017), Personality and Social Psychology Bulletin', E(lt, at(3, .3)));
  }, () => {
    paperBg('#F4EDE1'); tipTag6(4, 'Change your environment');
    g.fillStyle = '#B0805A'; g.fillRect(200, 640, 1520, 40); g.fillStyle = '#C99A72'; g.fillRect(200, 680, 1520, 300);
    g.fillStyle = '#E8DCC4'; rr(1300, 260, 380, 300, 12); g.fill(); g.lineWidth = 6; g.strokeStyle = '#B0805A'; g.stroke(); txt('cookies', 1490, 420, { size: 40, weight: 700, color: COL.ink2, alpha: 1 - E(lt, at(4, .3), .5) }); line(1490, 260, 1490, 560, 4, '#B0805A');
    g.fillStyle = '#fff'; ell(560, 630, 160, 30); g.fill(); [[-80, COL.red], [0, '#F2B84B'], [80, '#6B8F3A'], [-40, '#E9A84B'], [40, COL.red]].forEach(([d, c], i) => { g.fillStyle = c; g.beginPath(); g.arc(560 + d, 600 - (i > 2 ? 50 : 0), 40, 0, 7); g.fill(); });
    pill('fruit on the counter', 560, 460, { p: B(lt, at(4, .15)), bg: COL.ivy, size: 40 }); shoes(1000, 620, .9, 1); pill('shoes by the door', 1000, 480, { p: B(lt, at(4, .5)), bg: COL.alex, size: 40 });
    withA(E(lt, at(4, .75)), () => { card(W / 2, 880, 900, 110); txt('make the good choice the easy one', W / 2, 882, { size: 46, weight: 700 }); });
  }, () => {
    paperBg('#E2EFEB'); tipTag6(5, 'Something to DO');
    [['eat more vegetables', 1, .1], ['never eat junk food', 0, .45]].forEach(([s, ok, f], i) => { const x = 560 + i * 800; withA(E(lt, at(5, f), .4), () => { card(x, 560, 680, 400, 1, ok ? '#FFFDF6' : '#E3E4EE'); txt('"' + s + '"', x, 500, { size: 46, weight: 700, color: ok ? COL.ivy : COL.ink2 }); if (ok) check(x, 640, 2.2, E(lt, at(5, f) + .2, .4), COL.ivy); else cross(x, 640, 60, E(lt, at(5, f) + .2, .4)); }); });
  }, () => {
    paperBg('#E8EEF7'); tipTag6(6, 'Track it');
    for (let i = 0; i < 21; i++) { const x = 360 + (i % 7) * 200, y = 330 + Math.floor(i / 7) * 190, on = lt > at(6, .3) + i * .1; g.fillStyle = '#fff'; rr(x - 70, y - 70, 140, 140, 14); g.fill(); g.lineWidth = 4; g.strokeStyle = COL.ink; g.stroke(); if (on) check(x, y + 6, 1.2, 1, COL.ivy); }
    pill('write it down', W / 2, 930, { p: B(lt, at(6, .6)), bg: COL.ivy, size: 44 });
    source('Harkin et al. (2016), Psychological Bulletin: 138 studies', E(lt, at(6, .25)));
  }, () => {
    paperBg('#E2EFEB'); tipTag6(7, 'Slipped? Start again tomorrow');
    for (let i = 0; i < 14; i++) { const x = 330 + (i % 7) * 210, y = 400 + Math.floor(i / 7) * 240, show = E(lt, at(7, .05) + i * .12, .2); withA(show, () => { g.fillStyle = '#fff'; rr(x - 80, y - 80, 160, 160, 16); g.fill(); g.lineWidth = 5; g.strokeStyle = COL.ink; g.stroke(); txt(String(i + 1), x - 50, y - 50, { size: 28, weight: 700, color: COL.ink2 }); if (i === 5) cross(x, y + 10, 36, 1); else check(x, y + 10, 1.4, 1, COL.ivy); }); }
    pill('one missed day doesn\'t reset the clock', W / 2, 900, { p: B(lt, at(7, .7)), bg: COL.ivy, size: 42 });
  }, () => {
    paperBg('#ECE8F8');
    ch(P_(IVY, { x: 760, y: 940, s: 1.3, expr: 'joy', arms: 'up', look: 1 })); ch(P_(SAM, { x: 1160, y: 940, s: 1.3, expr: 'joy', arms: 'up', look: -1 }));
    withA(E(lt, at(8, .3)), () => { bubble(1180, 380, 420, 100, 'br'); txt('how was the walk? 💪', 1180, 382, { size: 38, font: 'Nunito', weight: 800 }); });
    pill('support helps: tell a friend', W / 2, 200, { p: B(lt, at(8, .55)), bg: COL.max, size: 50 });
    source('Oscarsson et al. (2020): the group with some support did best', E(lt, at(8, .4)));
  }]);
};
S.outro6 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#E2EFEB'); notebook(1100, 560, 1.15, ['walk 10 min after breakfast'], { prog: E(lt, at(0, .4), .8), title: 'THIS YEAR' }); ch(P_(IVY, { x: 420, y: 960, s: 1.4, expr: 'calm', arms: 'book' }));
  }, () => {
    const k = E(lt, at(1, .45), 1.4); const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, mix('#DCE6F0', '#CFEAD5', k)); sky.addColorStop(1, mix('#F4F6FA', '#F0F8E8', k)); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = mix('#FFFFFF', '#9CCB86', k); g.fillRect(0, 860, W, 220); calPage(1620, 260, .9, k > .5 ? 'MAR' : 'FEB', k > .5 ? '1' : '1', k > .5 ? COL.ivy : '#5B8DEF');
    if (k > .3) for (let i = 0; i < 8; i++) { g.fillStyle = ['#FF8FB1', '#FFD447'][i % 2]; g.beginPath(); g.arc(150 + i * 230, 900, 14 * k, 0, 7); g.fill(); }
    const x = lerp(300, 1500, clamp((lt - L[1]) / (Le[1] - L[1] + .5))); ch(P_(IVY, { x, y: 900, s: 1.1, expr: 'joy', hop: k > .5 ? Math.abs(Math.sin(TT * 12)) * 30 : Math.abs(Math.sin(TT * 6)) * 6 }));
    pill(k > .5 ? 'now a run!' : 'feels automatic', x, 560, { bg: k > .5 ? COL.alex : COL.ivy, size: 40 });
  }, () => {
    paperBg('#FFF4DE'); ch(P_(IVY, { x: 560, y: 960, s: 1.5, expr: 'calm' }));
    withA(E(lt, at(2, .1)), () => { card(1300, 420, 820, 180, 1, '#E3E4EE'); txt('change your whole life on Jan 1', 1300, 422, { size: 42, weight: 700, color: COL.ink2 }); strike(1300, 422, 680, E(lt, at(2, .35), .4)); });
    withA(E(lt, at(2, .5)), () => { card(1300, 700, 820, 200, 1, '#FFFDF6'); wrap('make one small thing automatic', 1300, 700, 720, 58, { size: 50, weight: 700, color: COL.ivy }); });
  }, () => {
    paperBg(); txt("What's your ONE goal this year?", W / 2, 200, { size: 76, weight: 700, alpha: B(lt, L[3]) });
    bubble(W / 2, 440, 860, 160, 'bl', B(lt, at(3, .4))); txt('write it in the comments ↓', W / 2, 442, { size: 54, font: 'Nunito', weight: 800, alpha: E(lt, at(3, .4)) });
    pill('make it small', W / 2, 620, { p: B(lt, at(3, .75)), bg: COL.ivy, size: 46 });
    [[480, IVY], [740, SAM], [1000, ALEX], [1260, MAX]].forEach(([x, c], i) => ch(P_(c, { x, y: 1000, s: .95, expr: 'joy', arms: i % 2 ? 'wave' : 'up' })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); fireworks(lt, 4); txt('Happy New Year!', W / 2, 330, { size: 110, weight: 700, color: COL.white }); txt('See you in the next one.', W / 2, 450, { size: 52, font: 'Nunito', weight: 800, color: COL.sam });
    [[560, IVY], [820, SAM], [1100, ALEX], [1360, MAX]].forEach(([x, c]) => ch(P_(c, { x, y: 960, s: 1.05, expr: 'joy', arms: 'wave' })));
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1E2547'); bg.addColorStop(1, '#2E3A6E'); g.fillStyle = bg; g.fillRect(0, 0, W, H); fireworks(1.2, 4);
  notebook(1340, 640, 1.05, LIST, { prog: 1, strike: [1, 1, 1, 1, 1, 1] });
  ch(P_(IVY, { x: 560, y: 1200, s: 2.6, expr: 'worried', sweat: true }));
  g.save(); g.translate(W / 2, 140); g.rotate(-.02); g.font = '700 140px Fredoka'; const a = 'WHY RESOLUTIONS ', b = 'FAIL'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 140, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 140, weight: 700, color: COL.alex, align: 'left' }); g.restore();
  finish(); };
