// Video 07 scenes: "Willpower Is a Myth (Sort Of)". Uses engine/core.js helpers.

// ---------- helpers for this video
function heading(s, y = 120, c = COL.ink, size = 76) { txt(s, W / 2, y, { size, weight: 700, color: c }); }
function tipTag7(n, s) { g.fillStyle = COL.ink; rr(60, 60, 120 + s.length * 26, 80, 40); g.fill(); g.fillStyle = COL.sam; g.beginPath(); g.arc(100, 100, 28, 0, 7); g.fill(); txt(String(n), 100, 102, { size: 36, weight: 700 }); txt(s, 145, 102, { size: 40, color: '#fff', align: 'left' }); }
function donut(x, y, s, bite = 0) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#D9A066'; g.beginPath(); g.arc(0, 0, 50, 0, 7); g.fill(); g.fillStyle = '#F28DB2'; g.beginPath(); g.arc(0, -4, 44, 0, 7); g.fill();
  [[-20, -24, COL.sam], [18, -20, COL.ivy], [26, 8, '#fff'], [-28, 10, COL.max], [0, -36, '#fff']].forEach(([a, b, c]) => { g.fillStyle = c; g.save(); g.translate(a, b); g.rotate(a); g.fillRect(-7, -2, 14, 4); g.restore(); });
  g.fillStyle = '#F4EDE1'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); if (bite) { g.globalCompositeOperation = 'destination-out'; [[40, -26], [48, 0], [36, 24]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 18, 0, 7); g.fill(); }); g.globalCompositeOperation = 'source-over'; } g.restore(); }
function donutBox(x, y, s, n = 6, open = 1) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#F5D9B8'; rr(-200, -40, 400, 120, 10); g.fill(); g.lineWidth = 5; g.strokeStyle = '#C9A77C'; g.stroke();
  for (let i = 0; i < n; i++) donut(-130 + (i % 3) * 130, -4 + Math.floor(i / 3) * 0, .7); g.fillStyle = '#F5D9B8'; g.save(); g.translate(-200, -40); g.rotate(-1.2 * open); rr(0, -100, 400, 100, 10); g.fill(); g.stroke(); txt('DONUTS', 200, -50, { size: 40, weight: 700, color: '#C8553D' }); g.restore(); g.restore(); }
function officeBg() { g.fillStyle = '#E9E4DA'; g.fillRect(0, 0, W, H); [[160, 140], [620, 140]].forEach(([x, y]) => { g.fillStyle = '#9CC3DA'; rr(x, y, 380, 300, 10); g.fill(); g.lineWidth = 10; g.strokeStyle = '#B8B0A2'; rr(x, y, 380, 300, 10); g.stroke(); });
  g.fillStyle = '#CFC7B8'; g.fillRect(0, 860, W, 220); g.fillStyle = '#BDB4A3'; g.fillRect(0, 856, W, 10); g.fillStyle = '#B8B0A2'; rr(1260, 620, 560, 40, 8); g.fill(); g.fillStyle = '#A39A8B'; g.fillRect(1280, 660, 520, 200); }
function radish(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#4E8A5B'; [-14, 0, 14].forEach(d => { ell(d, -46, 8, 22, d / 30); g.fill(); }); g.fillStyle = '#D1495B'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-6, 28); g.lineTo(0, 46); g.lineTo(6, 28); g.fill(); g.restore(); }
function cookie7(x, y, s) { g.fillStyle = '#C98B5B'; g.beginPath(); g.arc(x, y, 36 * s, 0, 7); g.fill(); g.fillStyle = '#5A3A22'; [[-12, -10], [14, -4], [-4, 14]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a * s, y + b * s, 6 * s, 0, 7); g.fill(); }); }
function plate(x, y, s) { g.fillStyle = '#fff'; ell(x, y, 160 * s, 40 * s); g.fill(); g.lineWidth = 4; g.strokeStyle = '#D0D4DE'; g.stroke(); }
function glass(x, y, s, c = '#FFE07A') { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = 'rgba(200,230,255,.5)'; g.beginPath(); g.moveTo(-50, -110); g.lineTo(50, -110); g.lineTo(40, 60); g.lineTo(-40, 60); g.closePath(); g.fill(); g.fillStyle = c; g.beginPath(); g.moveTo(-46, -60); g.lineTo(46, -60); g.lineTo(40, 60); g.lineTo(-40, 60); g.fill(); g.lineWidth = 5; g.strokeStyle = COL.ink; g.beginPath(); g.moveTo(-50, -110); g.lineTo(-40, 60); g.lineTo(40, 60); g.lineTo(50, -110); g.stroke(); g.fillStyle = '#FFD447'; g.beginPath(); g.arc(30, -100, 26, 0, 7); g.fill(); g.restore(); }
function marshmallow(x, y, s) { g.fillStyle = '#FFFDF6'; rr(x - 40 * s, y - 50 * s, 80 * s, 70 * s, 22 * s); g.fill(); g.lineWidth = 4; g.strokeStyle = '#D9D2C4'; g.stroke(); g.fillStyle = '#F4EDE1'; ell(x, y - 50 * s, 40 * s, 12 * s); g.fill(); g.stroke(); }
function beeper(x, y, s, on) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = COL.ink; rr(-60, -90, 120, 180, 20); g.fill(); g.fillStyle = on ? '#9BF0C0' : '#3E6B55'; rr(-44, -70, 88, 60, 8); g.fill(); g.fillStyle = COL.red; g.beginPath(); g.arc(0, 40, 16, 0, 7); g.fill(); g.restore();
  if (on) { g.strokeStyle = COL.ink; g.lineWidth = 4; [-1, 1].forEach(k => { for (let i = 1; i < 3; i++) { g.beginPath(); g.arc(x, y, 110 * s + i * 16, k > 0 ? -.5 : Math.PI - .5, k > 0 ? .5 : Math.PI + .5); g.stroke(); } }); } }
function flask(x, y, s, c) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = c; g.beginPath(); g.moveTo(-10, -40); g.lineTo(10, -40); g.lineTo(10, -10); g.lineTo(30, 30); g.lineTo(-30, 30); g.lineTo(-10, -10); g.closePath(); g.fill(); g.restore(); }

// ---------- scenes
S.donutOpen = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    officeBg(); donutBox(1540, 600, 1, 6, 1); calendarTag();
    ch(P_(ALEX, { x: 600, y: 900, s: 1.3, expr: 'determined', look: 1 })); withA(E(lt, at(0, .6)), () => { thought(760, 420, 520, 120); txt('"healthy week!"', 760, 422, { size: 44, font: 'Nunito', weight: 800 }); });
  }, () => {
    officeBg(); donutBox(1540, 600, 1, 6, 1); const times = [9, 11, 14]; const k = Math.min(2, Math.floor(clamp((lt - L[1]) / (Le[1] - L[1])) * 3));
    clock(260, 230, 100, times[k] % 12); ch(P_(ALEX, { x: lerp(500, 1200, ((lt - L[1]) * .4) % 1), y: 900, s: 1.2, expr: k === 2 ? 'nervous' : 'determined', look: 1, sweat: k > 0 }));
    pill(['resist!', 'resist!!', 'resist!!!'][k], 960, 300, { bg: COL.red, size: 50 + k * 8 });
  }, () => {
    officeBg(); clock(260, 230, 100, 4); donutBox(1540, 600, 1, 4, 1);
    ch(P_(ALEX, { x: 1100, y: 900, s: 1.3, expr: 'joy', arms: 'up' })); donut(980, 560, .9, 1); donut(1220, 560, .9, lt > at(2, .5) ? 1 : 0);
    withA(E(lt, at(2, .4)), () => { card(W / 2, 160, 700, 120); txt('4 p.m.: two donuts', W / 2, 162, { size: 56, weight: 700, color: COL.alex }); });
  }, () => {
    officeBg(); donutBox(1540, 600, .8, 4, 1); g.fillStyle = '#8C5A3C'; rr(380, 700, 420, 30, 8); g.fill(); g.fillStyle = '#C9CED8'; rr(500, 590, 200, 110, 10); g.fill(); ch(P_(IVY, { x: 260, y: 900, s: 1.3, expr: 'calm', look: 1 }));
    withA(E(lt, at(3, .4)), () => { thought(650, 420, 340, 100); txt('donuts? what donuts?', 650, 422, { size: 34, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#ECE8F8'); ch(P_(IVY, { x: 560, y: 940, s: 1.4, expr: 'calm' })); ch(P_(ALEX, { x: 1360, y: 940, s: 1.4, expr: 'sad' }));
    pill('more willpower?', 560, 420, { p: B(lt, at(4, .15)), bg: COL.ink, size: 46 }); withA(E(lt, at(4, .55)), () => { card(W / 2, 200, 1000, 130, 1, '#FFF7DC'); txt('the science says something surprising', W / 2, 202, { size: 48, weight: 700, color: COL.max }); });
  }]);
};
function calendarTag() { g.fillStyle = '#fff'; rr(1100, 140, 160, 180, 12); g.fill(); g.fillStyle = COL.red; rr(1100, 140, 160, 50, 12); g.fill(); txt('MON', 1180, 168, { size: 30, weight: 700, color: '#fff' }); txt('9', 1180, 255, { size: 70, weight: 700 }); }
S.title7 = (lt, L, Le, D, at) => {
  g.fillStyle = COL.night; g.fillRect(0, 0, W, H); g.save(); g.globalAlpha = .08; g.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc((i * 397) % W, (i * 211) % H, 1.5 + (i % 3), 0, 7); g.fill(); } g.restore();
  [['WILLPOWER IS A MYTH', COL.white, 270, 120], ['(sort of)', COL.sam, 400, 80]].forEach(([s, c, y, sz], i) => { const p = B(lt, .2 + i * .5, .5); g.save(); g.translate(W / 2, y); g.scale(p, p); txt(s, 0, 0, { size: sz, weight: 700, color: c }); g.restore(); });
  const p = E(lt, 1, .7); ch(P_(ALEX, { x: 860, y: 1080 + lerp(300, 30, p), s: 1.4, expr: 'nervous' })); donut(1080, 900 + lerp(300, 0, p), 1.2);
};
S.batteryTheory = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#E8EEF7'); chapter(1, 'The willpower battery', lt); battery(960, 520, 1.6, 1 - .2 * E(lt, 1, 2)); txt('WILLPOWER', W / 2, 920, { size: 70, weight: 700, color: COL.green, alpha: B(lt, .4) });
  }, () => {
    paperBg('#F4EDE1'); heading('THE COOKIE EXPERIMENT', 110);
    plate(560, 560, 1.1); for (let i = 0; i < 5; i++) cookie7(470 + (i % 3) * 90, 530 + Math.floor(i / 3) * 40, 1); txt('ate cookies', 560, 680, { size: 44, weight: 700, alpha: E(lt, at(1, .45)) });
    withA(E(lt, at(1, .55)), () => { plate(1360, 560, 1.1); for (let i = 0; i < 4; i++) radish(1260 + (i % 2) * 120 + Math.floor(i / 2) * 60, 520 + Math.floor(i / 2) * 40, 1); txt('had to resist: radishes', 1360, 680, { size: 44, weight: 700 }); });
    ch({ x: 560, y: 1000, c: EX[2], s: .9, expr: 'joy', sd: 2 }); ch({ x: 1360, y: 1000, c: EX[4], s: .9, expr: lt > at(1, .6) ? 'sad' : 'neutral', sd: 4 });
    source('Baumeister, Bratslavsky, Muraven & Tice (1998), JPSP', E(lt, at(1, .3)));
  }, () => {
    paperBg('#F4EDE1'); heading('THE IMPOSSIBLE PUZZLE', 110);
    g.save(); g.translate(W / 2, 360); g.strokeStyle = COL.ink; g.lineWidth = 8; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(0, 0, 60 + i * 40, i * .8 + TT * .3, i * .8 + TT * .3 + 4.6); g.stroke(); } txt('?', 0, 4, { size: 90, weight: 700, color: COL.red }); g.restore();
    const base = 900; [['cookie eaters', .8, COL.sam, .35], ['radish eaters', .4, COL.alex, .55]].forEach(([s, v, c, f], i) => { const x = 760 + i * 400, p = E(lt, at(2, f), .8); bar(x, base, 240, 300, c, v * p); txt(s, x, base + 50, { size: 38, weight: 700 }); });
    line(560, base, 1360, base, 6, COL.ink); txt('time before giving up (illustrative)', W / 2, base + 120, { size: 30, font: 'Nunito', weight: 700, color: COL.ink2 });
  }, () => {
    paperBg('#E8EEF7'); heading('"EGO DEPLETION"', 120, COL.max);
    const d = E(lt, at(3, .1), 2.5); battery(1300, 540, 1.3, 1 - d * .85); ch(P_(ALEX, { x: 600, y: 940, s: 1.4, expr: d > .6 ? 'tired' : 'determined', sweat: d > .3 }));
    withA(E(lt, at(3, .6)), () => pill('used up → give in', 600, 420, { bg: COL.red, size: 46 }));
  }, () => {
    paperBg('#FFF4DE'); heading('A SUGAR RECHARGE?', 120);
    glass(620, 600, 2.2); battery(1300, 540, 1.3, .2 + .7 * E(lt, at(4, .4), 1.5)); bolt(1450, 360, 1.3, E(lt, at(4, .4)));
    pill('brain running low on fuel?', 960, 950, { p: B(lt, at(4, .6)), bg: COL.ink, size: 42 });
  }, () => {
    officeBg(); clock(260, 230, 100, 4); battery(1600, 360, .8, .05); donutBox(1540, 760, .7, 4, 1);
    ch(P_(ALEX, { x: 900, y: 920, s: 1.3, expr: 'tired' })); withA(E(lt, at(5, .6)), () => { card(W / 2, 160, 600, 120); txt('game over', W / 2, 162, { size: 60, weight: 700, color: COL.red }); });
  }]);
};
S.crack = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6], [() => {
    paperBg('#EDEAF4'); chapter(2, 'Then the battery cracked', lt);
    txt('THE REPLICATION CRISIS', W / 2, 420, { size: 100, weight: 700, alpha: B(lt, .3) });
    for (let i = 0; i < 3; i++) withA(E(lt, at(0, .4) + i * .2, .4), () => { g.save(); g.translate(660 + i * 300, 680); g.rotate((i - 1) * .1); card(0, 0, 220, 280); for (let k = 0; k < 5; k++) line(-80, -80 + k * 36, 80, -80 + k * 36, 6, '#C9C3B8'); g.restore(); });
    pill('repeat famous experiments, with bigger samples', W / 2, 920, { p: B(lt, at(0, .7)), bg: COL.ink, size: 40 });
  }, () => {
    paperBg('#EDEAF4'); heading('100 STUDIES, REPEATED', 120);
    for (let i = 0; i < 100; i++) { const x = 330 + (i % 20) * 64, y = 300 + Math.floor(i / 20) * 64, ok = i % 3 === 0; withA(E(lt, at(1, .1) + i * .01, .2), () => { g.fillStyle = lt > at(1, .45) ? (ok ? COL.ivy : '#D3D6DE') : COL.gray; g.beginPath(); g.arc(x, y, 24, 0, 7); g.fill(); }); }
    txt('only about 1 in 3 clearly replicated', W / 2, 720, { size: 52, weight: 700, color: COL.ivy, alpha: E(lt, at(1, .5)) });
    pill('small samples + flexible statistics', W / 2, 860, { p: B(lt, at(1, .75)), bg: COL.ink, size: 40 });
    source('Open Science Collaboration (2015), Science', E(lt, at(1, .3)));
  }, () => {
    paperBg('#EDEAF4'); heading('23 LABS · 2,141 PEOPLE', 120);
    for (let i = 0; i < 23; i++) { const x = 220 + (i % 12) * 120, y = 280 + Math.floor(i / 12) * 140; withA(E(lt, at(2, .1) + i * .04, .3), () => flask(x, y, 1.4, [COL.ivy, COL.max, COL.alex, COL.sam][i % 4])); }
    const base = 900; [['effect in older studies', .62, COL.gray, .5], ['effect in 23 labs', .04, COL.red, .7]].forEach(([s, v, c, f], i) => { const x = 760 + i * 400, p = E(lt, at(2, f), .8); bar(x, base, 240, 380, c, v * p + .01); txt(s, x, base + 50, { size: 34, weight: 700 }); });
    line(560, base, 1360, base, 6, COL.ink); withA(E(lt, at(2, .85)), () => pill('close to zero', 1160, 820, { bg: COL.red, size: 40 }));
    source('Hagger et al. (2016), Perspectives on Psychological Science', E(lt, at(2, .3)));
  }, () => {
    paperBg('#EDEAF4'); heading('36 LABS · 3,531 PEOPLE', 120);
    for (let i = 0; i < 36; i++) { const x = 240 + (i % 12) * 120, y = 300 + Math.floor(i / 12) * 130; withA(E(lt, at(3, .1) + i * .03, .3), () => flask(x, y, 1.2, [COL.ivy, COL.max, COL.alex, COL.sam][i % 4])); }
    stamp('NO CLEAR EFFECT', W / 2, 820, E(lt, at(3, .65), .35), COL.red, -.08, 80);
    source('Vohs et al. (2021), Psychological Science', E(lt, at(3, .3)));
  }, () => {
    paperBg('#FFF4DE'); glass(700, 600, 2); cross(700, 560, 150, E(lt, at(4, .2), .5));
    withA(E(lt, at(4, .35)), () => { card(1340, 480, 720, 220); wrap('self-control uses only a tiny bit of the brain\'s energy', 1340, 480, 640, 56, { size: 44, weight: 700 }); });
    pill("later studies struggled to repeat it", 1340, 720, { p: B(lt, at(4, .7)), bg: COL.ink, size: 38 });
  }, () => {
    paperBg('#EDEAF4'); ch(P_(ALEX, { x: 560, y: 960, s: 1.3, expr: 'worried' }));
    withA(E(lt, at(5, .1)), () => { thought(760, 420, 620, 140); txt('"my willpower is limited"', 760, 422, { size: 44, font: 'Nunito', weight: 800 }); });
    withA(E(lt, at(5, .55)), () => { card(1400, 700, 640, 220); txt('2023 replication', 1400, 660, { size: 48, weight: 700 }); txt('effect not found', 1400, 740, { size: 44, font: 'Nunito', weight: 800, color: COL.red }); });
    source('Job, Dweck & Walton (2010); Carruth, Ramos & Miyake (2023), PLOS ONE', E(lt, at(5, .4)));
  }, () => {
    paperBg('#E8EEF7');
    battery(560, 520, 1.4, .6); g.strokeStyle = COL.ink; g.lineWidth = 8; g.beginPath(); g.moveTo(520, 380); g.lineTo(580, 460); g.lineTo(540, 520); g.lineTo(600, 620); g.stroke();
    withA(E(lt, at(6, .3)), () => { ch(P_(ALEX, { x: 1300, y: 900, s: 1.2, expr: 'tired' })); pill('tired · bored · less motivated: real', 1300, 420, { bg: COL.ivy, size: 38 }); });
    withA(E(lt, at(6, .7)), () => { card(W / 2, 1000, 1100, 110); txt('the simple battery story: much weaker than we thought', W / 2, 1002, { size: 40, weight: 700 }); });
  }]);
};
S.secret = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#E2EFEB'); chapter(3, 'The real secret of self-control', lt);
    beeper(960, 520, 1.6, Math.sin(TT * 4) > 0); txt('Wilhelm Hofmann', W / 2, 860, { size: 60, weight: 700, alpha: E(lt, at(0, .4)) });
  }, () => {
    paperBg('#E2EFEB'); heading('205 PEOPLE · 1 WEEK', 110);
    for (let i = 0; i < 30; i++) ch({ x: 180 + (i % 10) * 175, y: 420 + Math.floor(i / 10) * 200, c: [COL.ivy, COL.sam, COL.alex, COL.max, ...EX][i % 11], s: .45, sd: i, expr: 'smile', alpha: E(lt, at(1, .05) + i * .02, .3) });
    const n = Math.floor(7827 * E(lt, at(1, .5), 1.5)); txt(n.toLocaleString('en-US') + ' reports', W / 2, 1000, { size: 64, weight: 700, color: COL.ivy, alpha: E(lt, at(1, .5)) });
    source('Hofmann, Baumeister, Förster & Vohs (2012), JPSP', E(lt, at(1, .3)));
  }, () => {
    paperBg('#E2EFEB'); heading('HIGH SELF-CONTROL PEOPLE...', 110);
    [['had desires', 'just as many', COL.ink2, .1, '='], ['desires were', 'weaker', COL.ivy, .35, '↓'], ['tried to resist', 'less often', COL.ivy, .6, '↓']].forEach(([a, b, c, f, sym], i) => { const x = 360 + i * 600, p = B(lt, at(2, f)); withA(E(lt, at(2, f), .3), () => { g.save(); scaleAt(x, 560, p);
      card(x, 560, 520, 520); txt(a, x, 380, { size: 44, weight: 700 }); txt(sym, x, 560, { size: 150, weight: 700, color: c }); txt(b, x, 730, { size: 52, weight: 700, color: c }); g.restore(); }); });
  }, () => {
    paperBg('#F4EDE1'); heading('AVOID THE BATTLE');
    g.fillStyle = '#D9D2C4'; g.fillRect(0, 620, W, 140); [[600, 'bakery'], [1300, 'snack bar']].forEach(([x, s]) => { g.fillStyle = '#E8A0B4'; rr(x - 140, 380, 280, 240, 12); g.fill(); txt(s, x, 420, { size: 36, weight: 700, color: '#fff' }); donut(x, 520, .8); });
    g.setLineDash([16, 12]); g.lineWidth = 8; g.strokeStyle = COL.ivy; g.beginPath(); g.moveTo(100, 900); g.quadraticCurveTo(960, 1040, 1820, 900); g.stroke(); g.setLineDash([]);
    const p = E(lt, at(3, .1), 2.4); const x = lerp(100, 1820, p); ch(P_(IVY, { x, y: 960 + Math.sin(p * Math.PI) * 60, s: .8, expr: 'calm' }));
  }, () => {
    paperBg('#E2EFEB'); heading('WHAT PREDICTED REACHING GOALS?', 110);
    const base = 860; [['how hard they fought temptation', .2, COL.gray, .3], ['how many temptations they met', .75, COL.red, .55]].forEach(([s, v, c, f], i) => { const x = 700 + i * 520, p = E(lt, at(4, f), .8); bar(x, base, 280, 560, c, v * p); wrap(s, x, base + 60, 380, 44, { size: 36, weight: 700 }); });
    line(460, base, 1460, base, 8, COL.ink); txt('illustrative', W / 2, base + 160, { size: 28, font: 'Nunito', weight: 700, color: COL.ink2 });
    source('Milyavskaya & Inzlicht (2017), Social Psychological and Personality Science', E(lt, at(4, .3)));
  }, () => {
    paperBg('#E2EFEB'); ch(P_(IVY, { x: 760, y: 940, s: 1.4, expr: 'joy' }));
    [['own snack', .1], ['phone in bag', .35], ['no kitchen detour', .55]].forEach(([s, f], i) => pill(s, 1400, 380 + i * 140, { p: B(lt, at(5, f)), bg: COL.ivy, size: 44 }));
    withA(E(lt, at(5, .75)), () => { card(W / 2, 160, 900, 120, 1, '#FFF7DC'); txt('not a superpower: good planning', W / 2, 162, { size: 52, weight: 700, color: dark(COL.sam, .3) }); });
  }]);
};
S.marsh = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#FBE3EE'); chapter(4, 'The marshmallow test, revisited', lt); plate(960, 600, 1.4); marshmallow(960, 590, 2.4);
    txt('THE MARSHMALLOW TEST', W / 2, 860, { size: 80, weight: 700, alpha: B(lt, .4) });
  }, () => {
    paperBg('#FBE3EE'); g.fillStyle = '#C99A72'; rr(560, 700, 800, 40, 10); g.fill(); plate(860, 690, .7); marshmallow(860, 680, 1.2);
    ch({ x: 1000, y: 750, c: '#C9B8D9', top: 'baby', s: .8, expr: 'o', sd: 3 }); g.fillStyle = '#C99A72'; rr(560, 740, 800, 300, 10); g.fill();
    withA(E(lt, at(1, .35)), () => { card(560, 320, 460, 200); txt('1 now', 560, 322, { size: 70, weight: 700 }); marshmallow(700, 330, .8); });
    withA(E(lt, at(1, .55)), () => { card(1360, 320, 460, 200, 1, '#FFF7DC'); txt('2 if you wait', 1360, 322, { size: 64, weight: 700, color: dark(COL.sam, .3) }); });
    source('Mischel and colleagues, Stanford (1960s–70s)', E(lt, at(1, .3)));
  }, () => {
    paperBg('#FBE3EE'); heading('HOW THE BEST WAITERS DID IT', 110);
    [['covered eyes', .1], ['sang songs', .3], ['turned around', .5], ['"it\'s just a picture"', .7]].forEach(([s, f], i) => { const x = 270 + i * 460, p = B(lt, at(2, f)); withA(E(lt, at(2, f), .3), () => { g.save(); scaleAt(x, 560, p); card(x, 560, 400, 520);
      ch({ x, y: 720, c: '#C9B8D9', top: 'baby', s: .7, expr: i === 0 ? 'calm' : i === 1 ? 'joy' : 'smile', sd: i, flip: i === 2, arms: i === 0 ? 'up' : 'down' }); if (i === 1) note(x + 90, 420, 1.2, 1);
      if (i === 3) { g.strokeStyle = COL.ink; g.lineWidth = 6; g.strokeRect(x - 60, 360, 120, 100); marshmallow(x, 430, .6); } txt(s, x, 790, { size: 36, weight: 700, maxW: 370 }); g.restore(); }); });
    withA(E(lt, at(2, .85)), () => pill('they changed what they paid attention to', W / 2, 960, { bg: COL.max, size: 40 }));
  }, () => {
    paperBg('#FBE3EE'); heading('DOES IT PREDICT YOUR FUTURE?', 110);
    const base = 860; [['earlier follow-ups', .8, COL.gray, .1], ['2018: bigger study', .4, COL.alex, .4], ['+ family background', .14, COL.ivy, .7]].forEach(([s, v, c, f], i) => { const x = 560 + i * 400, p = E(lt, at(3, f), .8); bar(x, base, 240, 560, c, v * p); wrap(s, x, base + 60, 300, 44, { size: 36, weight: 700 }); });
    line(360, base, 1560, base, 8, COL.ink); txt('strength of the link (illustrative)', W / 2, base + 160, { size: 30, font: 'Nunito', weight: 700, color: COL.ink2 });
    source('Watts, Duncan & Quan (2018), Psychological Science', E(lt, at(3, .3)));
  }, () => {
    paperBg('#FBE3EE'); heading('A TWIST: TRUST', 110, COL.max);
    [['adult broke a promise', .25, COL.red, .2], ['adult kept their word', .9, COL.ivy, .45]].forEach(([s, v, c, f], i) => { const x = 700 + i * 520, base = 860, p = E(lt, at(4, f), .8); bar(x, base, 280, 560, c, v * p); wrap(s, x, base + 60, 380, 44, { size: 36, weight: 700 }); });
    line(460, 860, 1460, 860, 8, COL.ink); txt('how long children waited (illustrative)', W / 2, 1020, { size: 30, font: 'Nunito', weight: 700, color: COL.ink2 });
    source('Kidd, Palmeri & Aslin (2013), Cognition', E(lt, at(4, .3)));
  }, () => {
    paperBg('#FBE3EE'); stamp('NOT DESTINY', 700, 460, E(lt, at(5, .1), .35), COL.red, -.1, 100);
    withA(E(lt, at(5, .45)), () => { card(1340, 600, 720, 300, 1, '#FFF7DC'); txt('but the strategies?', 1340, 540, { size: 52, weight: 700 }); txt('super useful for adults', 1340, 640, { size: 48, weight: 700, color: COL.ivy }); });
    ch(P_(ALEX, { x: 560, y: 1000, s: 1, expr: 'smile' }));
  }]);
};
S.tips7 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6], [() => {
    paperBg('#E2EFEB'); chapter(5, 'How to have more self-control', lt); heading('5 STRATEGIES THAT WORK', 380, COL.ink, 96);
    [1, 2, 3, 4, 5].forEach(i => { const p = B(lt, .8 + i * .2); g.fillStyle = COL.ivy; g.beginPath(); g.arc(390 + i * 190, 620, 64 * p, 0, 7); g.fill(); txt(String(i), 390 + i * 190, 624, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#E2EFEB'); tipTag7(1, 'Avoid the battle');
    [['snacks out of your desk', .15], ['notifications muted', .35], ['a different route', .55]].forEach(([s, f], i) => { withA(E(lt, at(1, f), .4), () => { card(560 + i * 420, 520, 380, 300); txt(s, 560 + i * 420, 600, { size: 34, weight: 700, maxW: 340 }); }); });
    donut(560, 470, 1); cross(560, 470, 50, E(lt, at(1, .25), .4)); g.fillStyle = COL.ink; rr(940, 400, 80, 140, 12); g.fill(); g.fillStyle = '#5B8DEF'; rr(948, 412, 64, 110, 6); g.fill(); line(910, 380, 1050, 560, 10, COL.red);
    arrowLine(1310, 500, 1430, 430, E(lt, at(1, .6), .5), COL.ivy, 8);
    pill('what people like Ivy do naturally', W / 2, 860, { p: B(lt, at(1, .8)), bg: COL.ivy, size: 40 });
  }, () => {
    paperBg('#E8EEF7'); tipTag7(2, 'Change your focus');
    const cool = E(lt, at(2, .5), 1); g.save(); g.filter = `grayscale(${cool}) blur(${cool * 2}px)`; donut(620, 520, 3); g.restore();
    withA(1 - cool, () => txt('warm, delicious donut', 620, 820, { size: 46, weight: 700, color: COL.alex })); withA(cool, () => txt('a ring of fried dough + sugar', 620, 820, { size: 46, weight: 700, color: COL.ink2 }));
    ch(P_(ALEX, { x: 1400, y: 940, s: 1.3, expr: cool > .5 ? 'calm' : 'nervous', flip: cool > .5 })); for (let i = 0; i < 3; i++) { const a = (TT * .7 + i * .33) % 1; note(1500 + a * 100, 520 - a * 150, 1.1, clamp(1 - a) * cool); }
  }, () => {
    g.fillStyle = '#BFE3F2'; g.fillRect(0, 0, W, H); g.fillStyle = '#3E6BC0'; g.fillRect(0, 760, W, 320); tipTag7(3, 'Decide in advance');
    for (let i = 0; i < 12; i++) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(((i * 170 + TT * 40) % (W + 100)) - 50, 800 + (i % 3) * 60, 30, Math.PI, 0); g.stroke(); }
    g.fillStyle = '#8C5A3C'; g.beginPath(); g.moveTo(300, 740); g.lineTo(1000, 740); g.lineTo(900, 860); g.lineTo(400, 860); g.fill(); g.fillRect(640, 260, 20, 480); g.fillStyle = '#F4EDE1'; g.beginPath(); g.moveTo(670, 280); g.lineTo(900, 600); g.lineTo(670, 600); g.fill();
    ch({ x: 650, y: 740, c: EX[3], s: 1, expr: 'determined', sd: 5, arms: 'hug' }); g.strokeStyle = '#C9A77C'; g.lineWidth = 10; [560, 620, 680].forEach(y => { g.beginPath(); g.moveTo(590, y); g.lineTo(710, y + 10); g.stroke(); }); txt('ULYSSES', 650, 220, { size: 48, weight: 700 });
    [['savings you can\'t easily touch', .4], ['a friend holds you accountable', .55], ['book the class', .7]].forEach(([s, f], i) => pill(s, 1430, 360 + i * 120, { p: B(lt, at(3, f)), bg: COL.ink, size: 38 }));
  }, () => {
    paperBg('#E2EFEB'); tipTag7(4, 'Build habits');
    ch(P_(ALEX, { x: 700, y: 940, s: 1.4, expr: 'calm', arms: 'book' })); withA(E(lt, at(4, .3)), () => { thought(980, 420, 400, 110); txt('autopilot ✓', 980, 422, { size: 46, weight: 700, color: COL.ivy }); });
    pill('healthy lunch = routine', 1400, 600, { p: B(lt, at(4, .55)), bg: COL.ivy, size: 44 }); pill('nothing left to resist', 1400, 720, { p: B(lt, at(4, .75)), bg: COL.ink, size: 40 });
  }, () => {
    paperBg('#FFF4DE'); tipTag7(5, 'Rest, eat, be kind to yourself');
    [['tired', '😴'], ['hungry', '🍽️'], ['stressed', '😣']].forEach(([s, e], i) => { withA(E(lt, at(5, .08 + i * .12), .3), () => { card(420 + i * 400, 440, 340, 240); txt(e, 420 + i * 400, 410, { size: 80 }); txt(s, 420 + i * 400, 500, { size: 44, weight: 700 }); }); });
    withA(E(lt, at(5, .35)), () => txt('= temptations feel stronger', 820, 640, { size: 46, weight: 700, color: COL.red }));
    ch(P_(ALEX, { x: 1560, y: 960, s: 1.2, expr: lt > at(5, .65) ? 'smile' : 'sad', arms: 'hug' })); heart(1560, 560, 2 * B(lt, at(5, .7)));
  }, () => {
    paperBg('#FFF7DC'); tipTag7('+', 'Bonus: want-to goals');
    [['"have to"', COL.gray, .15, 0], ['"want to"', COL.ivy, .45, 1]].forEach(([s, c, f, ok], i) => { const x = 560 + i * 800; withA(E(lt, at(6, f), .4), () => { card(x, 560, 640, 560, 1, ok ? '#FFFDF6' : '#E3E4EE'); txt(s, x, 340, { size: 70, weight: 700, color: c }); ch(P_(ALEX, { x, y: 800, s: .9, expr: ok ? 'joy' : 'tired' })); if (!ok) { donut(x + 170, 520, .7); cookie7(x - 170, 520, 1); } }); });
    source('Milyavskaya, Inzlicht, Hope & Koestner (2015), JPSP', E(lt, at(6, .4)));
  }]);
};
S.outro7 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 2, 3, 4], [() => {
    officeBg(); donutBox(1540, 600, .8, 6, 1); g.fillStyle = '#8C5A3C'; rr(380, 700, 420, 30, 8); g.fill();
    ch(P_(ALEX, { x: 260, y: 900, s: 1.2, expr: 'joy', look: 1 })); g.fillStyle = '#6B8F3A'; rr(520, 640, 120, 60, 10); g.fill(); txt('lunch', 580, 672, { size: 26, weight: 700, color: '#fff' });
    withA(E(lt, at(0, .6)), () => { card(W / 2, 160, 720, 120); txt('never walks past the box', W / 2, 162, { size: 52, weight: 700 }); });
    withA(E(lt, at(1, .2)), () => pill('no battle · better setup', 960, 320, { bg: COL.ivy, size: 46 }));
  }, () => {
    paperBg('#ECE8F8'); withA(E(lt, at(2, .1)), () => { card(W / 2, 400, 1100, 200, 1, '#E3E4EE'); txt('willpower: not a myth, just overrated', W / 2, 402, { size: 56, weight: 700, color: COL.ink2 }); });
    withA(E(lt, at(2, .5)), () => { card(W / 2, 680, 1100, 200, 1, '#FFF7DC'); txt('make the right choice the easy one', W / 2, 682, { size: 56, weight: 700, color: COL.ivy }); });
  }, () => {
    paperBg(); txt("What temptation do you fight every day?", W / 2, 200, { size: 72, weight: 700, alpha: B(lt, L[3]) });
    bubble(W / 2, 440, 860, 160, 'bl', B(lt, at(3, .4))); txt('tell me in the comments ↓', W / 2, 442, { size: 54, font: 'Nunito', weight: 800, alpha: E(lt, at(3, .4)) });
    [[480, IVY], [740, SAM], [1000, ALEX], [1260, MAX]].forEach(([x, c], i) => ch(P_(c, { x, y: 1000, s: .95, expr: 'joy', arms: i % 2 ? 'wave' : 'up' })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); txt('Thanks for watching!', W / 2, 330, { size: 110, weight: 700, color: COL.white }); txt('See you in the next one.', W / 2, 450, { size: 52, font: 'Nunito', weight: 800, color: COL.sam });
    [[560, IVY], [820, SAM], [1100, ALEX], [1360, MAX]].forEach(([x, c]) => ch(P_(c, { x, y: 960, s: 1.05, expr: 'joy', arms: 'wave' })));
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  const bg = g.createRadialGradient(W / 2, H * .6, 100, W / 2, H / 2, W * .7); bg.addColorStop(0, '#3A4A7A'); bg.addColorStop(1, '#1A2040'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  battery(1450, 600, 1.5, .08); g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.moveTo(1400, 420); g.lineTo(1470, 520); g.lineTo(1420, 600); g.lineTo(1500, 720); g.stroke();
  ch(P_(ALEX, { x: 600, y: 1260, s: 2.6, expr: 'nervous', sweat: true })); donut(950, 640, 2.2);
  g.save(); g.translate(W / 2, 140); g.rotate(-.02); g.font = '700 140px Fredoka'; const a = 'WILLPOWER IS A ', b = 'MYTH?'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 140, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 140, weight: 700, color: COL.sam, align: 'left' }); g.restore();
  finish(); };
