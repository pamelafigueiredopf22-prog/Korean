// Video 10 scenes: "Impostor Syndrome". Uses engine/core.js helpers.

// ---------- helpers for this video
function heading(s, y = 120, c = COL.ink, size = 76) { txt(s, W / 2, y, { size, weight: 700, color: c }); }
function tipTag10(n, s) { g.fillStyle = COL.ink; rr(60, 60, 120 + s.length * 26, 80, 40); g.fill(); g.fillStyle = COL.sam; g.beginPath(); g.arc(100, 100, 28, 0, 7); g.fill(); txt(String(n), 100, 102, { size: 36, weight: 700 }); txt(s, 145, 102, { size: 40, color: '#fff', align: 'left' }); }
function office10() { g.fillStyle = '#E9E4DA'; g.fillRect(0, 0, W, H); [[160, 140], [620, 140], [1080, 140]].forEach(([x, y]) => { g.fillStyle = '#9CC3DA'; rr(x, y, 380, 300, 10); g.fill(); g.lineWidth = 10; g.strokeStyle = '#B8B0A2'; rr(x, y, 380, 300, 10); g.stroke(); });
  g.fillStyle = '#CFC7B8'; g.fillRect(0, 860, W, 220); g.fillStyle = '#BDB4A3'; g.fillRect(0, 856, W, 10); }
function cake(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#F7D6E0'; rr(-120, -80, 240, 100, 16); g.fill(); g.fillStyle = '#fff'; rr(-130, -100, 260, 30, 14); g.fill(); g.fillStyle = '#E05A9C'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-100 + i * 50, -100, 12, 0, 7); g.fill(); }
  g.fillStyle = COL.sky; rr(-10, -170, 20, 70, 6); g.fill(); g.fillStyle = '#FFD166'; ell(0, -184 + Math.sin(TT * 9) * 2, 9, 15); g.fill(); g.restore(); }
function mask(x, y, s, a = 1) { withA(a, () => { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-120, -40); g.quadraticCurveTo(0, -90, 120, -40); g.quadraticCurveTo(110, 60, 0, 70); g.quadraticCurveTo(-110, 60, -120, -40); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke();
  g.fillStyle = COL.ink; ell(-50, -10, 26, 16); g.fill(); ell(50, -10, 26, 16); g.fill(); g.restore(); }); }
function fileBox(x, y, s, n) { g.save(); g.translate(x, y); g.scale(s, s); for (let i = 0; i < n; i++) { g.save(); g.translate(0, -i * 16); g.rotate((i % 2 ? -1 : 1) * .03); g.fillStyle = '#fff'; rr(-180, -120, 360, 220, 10); g.fill(); g.lineWidth = 4; g.strokeStyle = '#C9C3B8'; g.stroke(); g.restore(); }
  g.fillStyle = '#E9A84B'; rr(-200, -40, 400, 180, 14); g.fill(); g.fillStyle = '#D99A2B'; rr(-200, -40, 140, 40, 10); g.fill(); txt('EVIDENCE', 0, 70, { size: 44, weight: 700, color: '#fff' }); g.restore(); }
function team(lt, clap = 1) { [[300, EX[0]], [500, EX[2]], [1420, EX[4]], [1620, MAX]].forEach(([x, c], i) => ch({ x, y: 900, c: c.c || c, top: c.top, s: 1, sd: i, expr: 'joy', arms: clap ? 'up' : 'down', look: x < 960 ? 1 : -1 })); }

// ---------- scenes
S.promoOpen = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    office10(); team(lt); ch(P_(IVY, { x: 960, y: 920, s: 1.3, expr: 'joy', arms: 'up' })); cake(1180, 760, .8); confetti(lt, .2);
    pill('PROMOTED!', 960, 400, { p: B(lt, at(0, .2)), bg: COL.ivy, size: 60 }); for (let i = 0; i < 4; i++) { const a = ((lt) * .8 + i * .3) % 1.4; withA(clamp(1 - a / 1.4), () => txt('👏', [300, 500, 1420, 1620][i], 560 - a * 100, { size: 50 })); }
  }, () => {
    office10(); team(lt); ch(P_(IVY, { x: 960, y: 920, s: 1.3, expr: 'smile' })); g.fillStyle = 'rgba(30,30,50,.35)'; g.fillRect(0, 0, W, H);
    const sp = g.createRadialGradient(960, 760, 40, 960, 760, 380); sp.addColorStop(0, 'rgba(255,240,200,.35)'); sp.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = sp; g.fillRect(560, 360, 800, 800); ch(P_(IVY, { x: 960, y: 920, s: 1.3, expr: 'smile' }));
    withA(E(lt, at(1, .4)), () => { thought(1240, 380, 440, 120); txt('...', 1240, 376, { size: 60, weight: 700 }); });
  }, () => {
    g.fillStyle = '#2A1E3D'; g.fillRect(0, 0, W, H); ch(P_(IVY, { x: 560, y: 960, s: 1.5, expr: 'worried', sweat: true }));
    [['"they made a mistake"', .05], ['"I just got lucky"', .25], ['"not as good as they think"', .45], ['"someone will find out"', .7]].forEach(([s, f], i) => withA(E(lt, at(2, f), .3), () => { thought(1280 + (i % 2) * 120, 220 + i * 200, 640, 120); txt(s, 1280 + (i % 2) * 120, 222 + i * 200, { size: 40, font: 'Nunito', weight: 800 }); }));
  }, () => {
    paperBg('#E2EFEB'); ch(P_(IVY, { x: 520, y: 960, s: 1.4, expr: 'worried' }));
    [['years of hard work', .1], ['excellent results', .35]].forEach(([s, f], i) => pill(s, 1300, 380 + i * 140, { p: B(lt, at(3, f)), bg: COL.ivy, size: 48 }));
    withA(E(lt, at(3, .6)), () => { mask(1300, 760, 1.4); txt('fraud?', 1300, 920, { size: 60, weight: 700, color: COL.red }); });
  }, () => {
    paperBg('#ECE8F8'); for (let i = 0; i < 10; i++) ch({ x: 180 + i * 175, y: 900, c: [COL.ivy, COL.sam, COL.alex, COL.max, ...EX][i], s: .7, sd: i, expr: 'worried', alpha: E(lt, at(4, .1) + i * .05, .3) });
    withA(E(lt, at(4, .2)), () => { card(W / 2, 360, 1000, 160); txt("you're in good company", W / 2, 362, { size: 60, weight: 700, color: COL.max }); });
  }]);
};
S.title10 = (lt, L, Le, D, at) => {
  g.fillStyle = COL.night; g.fillRect(0, 0, W, H); g.save(); g.globalAlpha = .08; g.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc((i * 397) % W, (i * 211) % H, 1.5 + (i % 3), 0, 7); g.fill(); } g.restore();
  [['IMPOSTOR', COL.white, 260, 140], ['SYNDROME', COL.ivy, 410, 140]].forEach(([s, c, y, sz], i) => { const p = B(lt, .2 + i * .5, .5); g.save(); g.translate(W / 2, y); g.scale(p, p); txt(s, 0, 0, { size: sz, weight: 700, color: c }); g.restore(); });
  const p = E(lt, 1, .7); ch(P_(IVY, { x: 960, y: 1080 + lerp(300, 30, p), s: 1.4, expr: 'worried' })); mask(960, 1080 + lerp(300, 30, p) - 1.4 * 178, .55, .9);
};
S.what10 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#F4EDE1'); chapter(1, 'What is impostor syndrome?', lt);
    card(W / 2, 360, 900, 240, B(lt, .4)); withA(E(lt, .4), () => { txt('Clance & Imes · 1978', W / 2, 330, { size: 64, weight: 700 }); txt('high-achieving women', W / 2, 410, { size: 42, font: 'Nunito', weight: 800, color: COL.ink2 }); });
    ['top grades 🎓', 'degrees 📜', 'awards 🏆'].forEach((s, i) => pill(s, 560 + i * 400, 640, { p: B(lt, at(0, .4 + i * .15)), bg: COL.ivy, size: 44 }));
  }, () => {
    paperBg('#F4EDE1'); [[560, IVY], [960, { c: EX[5], sd: 5 }], [1360, { c: EX[1], sd: 1 }]].forEach(([x, c], i) => { ch(P_(c, { x, y: 940, s: 1.1, expr: 'worried' })); withA(E(lt, at(1, .2) + i * .15, .3), () => mask(x, 940 - 1.1 * 178, .45)); });
    withA(E(lt, at(1, .65)), () => { card(W / 2, 260, 1000, 150); txt('the impostor phenomenon', W / 2, 262, { size: 64, weight: 700, color: COL.max }); });
  }, () => {
    paperBg('#ECE8F8'); heading('NOT A DIAGNOSIS: A THINKING PATTERN', 110, COL.ink, 60);
    [["I'm not as capable as people think", .2], ['my success was luck, charm, or a mistake', .45], ["I'm about to be exposed", .7]].forEach(([s, f], i) => withA(E(lt, at(2, f), .4), () => { card(W / 2, 330 + i * 200, 1300, 150); txt((i + 1) + '.', W / 2 - 590, 332 + i * 200, { size: 60, weight: 700, color: COL.max }); txt('"' + s + '"', W / 2 + 30, 332 + i * 200, { size: 48, weight: 700 }); }));
  }, () => {
    paperBg('#F4EDE1'); heading('THE IMPOSTOR SCALE', 110);
    g.fillStyle = '#B0805A'; rr(460, 220, 1000, 760, 20); g.fill(); g.fillStyle = '#fff'; rr(490, 260, 940, 680, 10); g.fill();
    [['I can give the impression that I\'m more competent than I really am.', .1], ['I\'m afraid people important to me may find out that I\'m not as capable as they think.', .5]].forEach(([s, f], i) => withA(E(lt, at(3, f), .4), () => { wrap(s, 960, 420 + i * 260, 820, 56, { size: 44, font: 'Nunito', weight: 800 }); for (let k = 0; k < 5; k++) { g.strokeStyle = COL.ink; g.lineWidth = 4; g.beginPath(); g.arc(760 + k * 100, 520 + i * 260, 18, 0, 7); g.stroke(); } }));
    source('Clance (1985), Clance Impostor Phenomenon Scale', E(lt, at(3, .3)));
  }, () => {
    paperBg('#ECE8F8'); heading('HOW COMMON?', 110);
    const x0 = 360, x1 = 1560, y = 520; g.fillStyle = '#D9D2C4'; rr(x0, y - 30, x1 - x0, 60, 30); g.fill(); const p = E(lt, at(4, .25), 1.2); g.fillStyle = COL.max; rr(lerp(x0, x0 + .09 * (x1 - x0), 1), y - 30, (.82 - .09) * (x1 - x0) * p, 60, 30); g.fill();
    txt('9%', x0 + .09 * (x1 - x0), y + 80, { size: 50, weight: 700, alpha: p }); txt('82%', x0 + .82 * (x1 - x0), y + 80, { size: 50, weight: 700, alpha: p }); txt('depending on who and how it was measured', W / 2, y - 100, { size: 40, font: 'Nunito', weight: 800, alpha: E(lt, at(4, .4)) });
    ['men & women', 'students', 'professionals', 'many fields'].forEach((s, i) => pill(s, 420 + i * 360, 820, { p: B(lt, at(4, .6) + i * .1), bg: COL.ivy, size: 40 }));
    source('Bravata et al. (2020), systematic review of 62 studies', E(lt, at(4, .3)));
  }, () => {
    paperBg('#F4E9D2'); g.fillStyle = '#C8553D'; for (let i = 0; i < 11; i++) { g.fillStyle = ['#C8553D', '#3E6BC0', '#4E8A5B', '#E9A84B'][i % 4]; rr(360 + i * 60, 520 - (i % 3) * 20, 50, 300 + (i % 3) * 20, 6); g.fill(); }
    txt('11 books', 690, 920, { size: 50, weight: 700, alpha: E(lt, at(5, .2)) });
    withA(E(lt, at(5, .45)), () => { thought(1360, 480, 640, 200); txt('"uh oh, they\'re going', 1360, 450, { size: 44, font: 'Nunito', weight: 800 }); txt('to find out now"', 1360, 510, { size: 44, font: 'Nunito', weight: 800 }); });
    source('Maya Angelou, as often quoted', E(lt, at(5, .4)));
  }]);
};
S.cycle = (lt, L, Le, D, at) => {
  const nodes = [['new task', COL.ink2], ['anxiety & doubt', COL.red], ['over-prepare / procrastinate', COL.max], ['success', COL.green], ['"luck" or "just effort"', COL.alex], ['doubt returns', COL.ink]];
  paperBg('#ECE8F8'); chapter(2, 'The impostor cycle', lt);
  const cx = 960, cy = 580, R = 330; g.lineWidth = 10; g.strokeStyle = '#C9C3B8'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  const shown = [0, at(1, .1), at(1, .5), at(2, .2), at(3, .2), at(4, .1)];
  nodes.forEach(([s, c], i) => { const an = -Math.PI / 2 + i / 6 * Math.PI * 2; pill(s, cx + Math.cos(an) * R, cy + Math.sin(an) * R * .9, { p: B(lt, shown[i] + .3), bg: c, size: 38 }); });
  if (lt > L[4]) { const spin = (lt - L[4]) * 1.2; g.strokeStyle = COL.ink; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, R, spin, spin + 1); g.stroke(); }
  ch(P_(IVY, { x: cx, y: cy + 150, s: .9, expr: lt > at(3, .1) && lt < at(3, .5) ? 'smile' : 'worried' }));
  if (lt > L[2] && lt < L[3]) withA(E(lt, at(2, .3), .4) * (1 - E(lt, L[3] - .3, .3)), () => { card(cx, cy - 60, 520, 160); txt('💪 working 3× harder', cx, cy - 90, { size: 36, weight: 700 }); txt('or 😬 last-minute rush', cx, cy - 30, { size: 36, weight: 700 }); });
  source('Clance (1985), The Impostor Phenomenon', E(lt, L[0] + .8));
};
S.why10 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6], [() => {
    paperBg('#F7EDD3'); chapter(3, 'Why does it happen?', lt); heading('5 INGREDIENTS', 380, COL.ink, 110);
    [1, 2, 3, 4, 5].forEach(i => { const p = B(lt, .6 + i * .2); g.fillStyle = COL.alex; g.beginPath(); g.arc(390 + i * 190, 600, 64 * p, 0, 7); g.fill(); txt(String(i), 390 + i * 190, 604, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#F7EDD3'); tipTag10(1, 'Messy insides, polished outsides');
    ch(P_(IVY, { x: 560, y: 960, s: 1.3, expr: 'worried', sweat: true })); withA(E(lt, at(1, .2)), () => { thought(620, 420, 420, 140); txt('🌀 panic 🌀', 620, 422, { size: 48, weight: 700 }); });
    [[1200, EX[0]], [1420, EX[3]], [1640, MAX]].forEach(([x, c], i) => { ch({ x, y: 960, c: c.c || c, top: c.top, s: 1, sd: i, expr: 'smile' }); withA(E(lt, at(1, .55), .4), () => pill('✨ fine ✨', x, 640, { bg: COL.ivy, size: 30 })); });
  }, () => {
    paperBg('#ECE8F8'); heading('PLURALISTIC IGNORANCE', 110, COL.max);
    for (let i = 0; i < 6; i++) { const x = 260 + i * 280; ch({ x, y: 940, c: [COL.ivy, COL.sam, COL.alex, COL.max, EX[1], EX[5]][i], top: ['bun', 'tuft', 'hood', 'spike', null, null][i], s: .9, sd: i, expr: 'worried' }); withA(E(lt, at(2, .2) + i * .08, .3), () => { thought(x + 20, 560, 220, 90); txt('only me?', x + 20, 562, { size: 32, font: 'Nunito', weight: 800 }); }); }
  }, () => {
    paperBg('#F7EDD3'); tipTag10(2, 'Being "the only one" in the room');
    for (let i = 0; i < 7; i++) ch({ x: 300 + i * 200, y: 900, c: '#9AA0AE', s: .9, sd: i, expr: 'smile' }); ch(P_(IVY, { x: 1700, y: 900, s: .9, expr: 'worried' }));
    ['first in family at university', 'few people like you in your field'].forEach((s, i) => pill(s, W / 2, 300 + i * 120, { p: B(lt, at(3, .25 + i * .2)), bg: COL.ink, size: 44 }));
  }, () => {
    paperBg('#E2EFEB'); tipTag10(3, 'The more you know...');
    const base = 860; [['how well they did', .9, COL.ivy, .3], ['how well they THOUGHT they did', .7, COL.gray, .55]].forEach(([s, v, c, f], i) => { const x = 760 + i * 400, p = E(lt, at(4, f), .8); bar(x, base, 260, 560, c, v * p); wrap(s, x, base + 60, 320, 44, { size: 36, weight: 700 }); });
    line(520, base, 1400, base, 8, COL.ink); txt('top performers (illustrative)', W / 2, 260, { size: 40, weight: 700 });
    source('Kruger & Dunning (1999), JPSP', E(lt, at(4, .3)));
  }, () => {
    paperBg('#F7EDD3'); tipTag10(4, 'Family labels');
    [['"the smart one"', EX[3], 760], ['"the sensitive one"', COL.ivy, 1160]].forEach(([s, c, x], i) => { ch({ x, y: 940, c: c.c || c, top: i ? 'bun' : null, s: 1.2, sd: i, expr: i ? 'worried' : 'smile' }); pill(s, x, 520, { p: B(lt, at(5, .15 + i * .2)), bg: i ? COL.ivy : COL.ink2, size: 44 }); });
    withA(E(lt, at(5, .6)), () => { card(W / 2, 220, 1100, 120); txt('...and the label stuck', W / 2, 222, { size: 52, weight: 700 }); });
    source('Clance & Imes (1978)', E(lt, at(5, .3)));
  }, () => {
    paperBg('#FBE3EE'); tipTag10(5, 'Perfectionism');
    const scores = [99, 97, 100, 95]; scores.forEach((n, i) => withA(E(lt, at(6, .1) + i * .12, .3), () => { card(360 + i * 400, 480, 300, 260); txt(n + '%', 360 + i * 400, 470, { size: 90, weight: 700, color: n < 100 ? COL.red : COL.ivy }); txt(n < 100 ? '= failure?' : 'phew', 360 + i * 400, 570, { size: 36, font: 'Nunito', weight: 800 }); }));
    ch(P_(IVY, { x: 960, y: 1020, s: .9, expr: 'nervous', sweat: true }));
  }]);
};
S.cost = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#E3E4EE'); chapter(4, 'The cost, and a surprising upside', lt);
    [['anxiety', COL.red], ['depression', COL.max], ['burnout', COL.alex]].forEach(([s, c], i) => pill(s, 560 + i * 400, 320, { p: B(lt, at(0, .1 + i * .1)), bg: c, size: 50 }));
    ch(P_(IVY, { x: 760, y: 960, s: 1.2, expr: 'sad' })); withA(E(lt, at(0, .6)), () => { card(1360, 700, 560, 300); txt('PROMOTION', 1360, 640, { size: 50, weight: 700 }); txt('apply?', 1360, 720, { size: 40, font: 'Nunito', weight: 800 }); cross(1360, 760, 50, E(lt, at(0, .8), .4)); });
  }, () => {
    paperBg('#E2EFEB'); heading('A SURPRISING TWIST', 110, COL.ivy);
    ch(P_(IVY, { x: W / 2, y: 940, s: 1.3, expr: 'smile' })); [[560, EX[0]], [1360, EX[4]]].forEach(([x, c], i) => { ch({ x, y: 940, c, s: 1.1, sd: i, expr: 'joy', look: x < 960 ? 1 : -1 }); heart(x + 30, 560, 1.6 * B(lt, at(1, .4) + i * .2)); });
    ['more likable', 'more collaborative'].forEach((s, i) => pill(s, W / 2, 300 + i * 110, { p: B(lt, at(1, .55 + i * .15)), bg: COL.ivy, size: 46 }));
    source('Tewfik (2022), Academy of Management Journal', E(lt, at(1, .3)));
  }, () => {
    paperBg('#E2EFEB'); ch(P_(IVY, { x: 760, y: 940, s: 1.4, expr: 'calm', look: 1 })); ch({ x: 1200, y: 940, c: EX[3], s: 1.2, sd: 3, expr: 'joy', look: -1 });
    withA(E(lt, at(2, .3)), () => { bubble(1200, 460, 420, 110, 'br'); txt('"...and then?"', 1200, 462, { size: 44, font: 'Nunito', weight: 800 }); });
    pill('more effort into listening & connecting', W / 2, 220, { p: B(lt, at(2, .5)), bg: COL.ink, size: 42 });
  }, () => {
    paperBg('#FFF7DC'); mask(700, 520, 1.8, 1 - E(lt, at(3, .4), .6)); ch(P_(IVY, { x: 700, y: 960, s: 1.3, expr: lt > at(3, .4) ? 'joy' : 'worried' }));
    withA(E(lt, at(3, .2)), () => { card(1340, 440, 680, 200); txt('feeling like an impostor', 1340, 400, { size: 46, weight: 700 }); txt("≠ being one", 1340, 480, { size: 56, weight: 700, color: COL.ivy }); });
    pill('it can mean you care', 1340, 700, { p: B(lt, at(3, .65)), bg: COL.sam, color: COL.ink, size: 46 });
  }]);
};
S.tips10 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6, 7], [() => {
    paperBg('#E2EFEB'); chapter(5, 'What actually helps', lt); heading('WHAT HELPS', 330, COL.ink, 110);
    pill('honest note: research on treatments is still limited', W / 2, 470, { p: B(lt, at(0, .3)), bg: COL.ink2, size: 38 });
    [1, 2, 3, 4, 5, 6, 7].forEach(i => { const p = B(lt, at(0, .5) + i * .12); g.fillStyle = COL.ivy; g.beginPath(); g.arc(200 + i * 190, 680, 64 * p, 0, 7); g.fill(); txt(String(i), 200 + i * 190, 684, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#ECE8F8'); tipTag10(1, 'Name it'); ch(P_(IVY, { x: 560, y: 960, s: 1.4, expr: 'calm' }));
    withA(E(lt, at(1, .2)), () => { thought(1200, 380, 600, 130); txt('"you\'re a fraud"', 1200, 382, { size: 48, font: 'Nunito', weight: 800, color: COL.red }); });
    withA(E(lt, at(1, .5)), () => { card(1200, 680, 760, 160, 1, '#FFFDF6'); txt('"there\'s the impostor feeling again"', 1200, 682, { size: 42, weight: 700, color: COL.ivy }); });
  }, () => {
    paperBg('#ECE8F8'); tipTag10(2, 'Talk about it'); ch(P_(IVY, { x: 760, y: 960, s: 1.3, expr: 'smile', look: 1 })); ch(P_(MAX, { x: 1160, y: 960, s: 1.3, expr: lt > at(2, .5) ? 'o' : 'smile', look: -1 }));
    withA(E(lt, at(2, .55)), () => { bubble(1260, 460, 460, 110, 'br'); txt('"wait, you too?"', 1260, 462, { size: 46, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#FFF4DE'); tipTag10(3, 'Keep an evidence file'); fileBox(700, 680, 1.2, Math.floor(clamp((lt - L[3]) / 3) * 5) + 1);
    [['"thank you so much!"', .2], ['great feedback ⭐', .4], ['problem solved ✓', .6]].forEach(([s, f], i) => pill(s, 1360, 360 + i * 140, { p: B(lt, at(3, f)), bg: COL.sam, color: COL.ink, size: 44 }));
  }, () => {
    paperBg('#ECE8F8'); tipTag10(4, 'Feelings aren\'t facts');
    withA(E(lt, at(4, .1)), () => { card(560, 520, 640, 360, 1, '#E3E4EE'); txt('FEELING', 560, 400, { size: 56, weight: 700, color: COL.ink2 }); txt('"I don\'t belong"', 560, 520, { size: 46, font: 'Nunito', weight: 800 }); txt('real, but not proof', 560, 620, { size: 38, font: 'Nunito', weight: 800, color: COL.red }); });
    withA(E(lt, at(4, .5)), () => { card(1360, 520, 640, 360, 1, '#FFFDF6'); txt('FRIEND TEST', 1360, 400, { size: 56, weight: 700, color: COL.ivy }); wrap('what would I say to a friend with my track record?', 1360, 540, 560, 54, { size: 40, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#E2EFEB'); tipTag10(5, 'Fraud → learner');
    const k = E(lt, at(5, .3), .8); withA(1 - k, () => txt('FRAUD', W / 2, 460, { size: 180, weight: 700, color: COL.red })); withA(k, () => txt('LEARNER', W / 2, 460, { size: 180, weight: 700, color: COL.ivy }));
    ch(P_(IVY, { x: W / 2, y: 1000, s: 1, expr: k > .5 ? 'joy' : 'worried', arms: k > .5 ? 'book' : 'down' }));
  }, () => {
    paperBg('#ECE8F8'); tipTag10(6, 'Find a mentor');
    g.fillStyle = '#C9C3B8'; for (let i = 0; i < 5; i++) { g.fillRect(400 + i * 240, 900 - i * 90, 250, 90 + i * 90); }
    ch(P_(IVY, { x: 520, y: 900, s: .9, expr: 'worried', look: 1 })); ch({ x: 1240, y: 900 - 3 * 90, c: '#93B7A8', s: .9, sd: 2, expr: 'smile', look: -1, arms: 'wave' });
    withA(E(lt, at(6, .4)), () => { bubble(1300, 360, 480, 110, 'bl'); txt('"I felt that too!"', 1300, 362, { size: 44, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#E2EFEB');
    card(W / 2, 520, 1300, 560, B(lt, L[7] + .2)); withA(E(lt, L[7] + .2), () => { txt('When to get help', W / 2, 310, { size: 70, weight: 700, color: COL.ivy });
      ['constant impostor feelings', 'with anxiety or low mood', 'or exhaustion'].forEach((s, i) => { const t0 = at(7, .12 + i * .14); check(620, 430 + i * 100, 1.3, E(lt, t0, .4), COL.ivy); txt(s, 690, 432 + i * 100, { size: 46, font: 'Nunito', weight: 800, align: 'left', alpha: E(lt, t0, .4) }); });
      pill('a therapist can help: CBT works with these thoughts', W / 2, 740, { p: B(lt, at(7, .6)), bg: COL.ivy, size: 38 }); });
  }]);
};
S.outro10 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 2, 3, 4], [() => {
    office10(); ch(P_(IVY, { x: 760, y: 920, s: 1.3, expr: lt > at(1, .5) ? 'joy' : 'worried', look: 1 })); ch(P_(SAM, { x: 1160, y: 920, s: 1.3, expr: lt > L[1] ? 'joy' : 'smile', look: -1 }));
    withA(E(lt, at(1, .1)), () => { bubble(1260, 440, 640, 140, 'br'); txt('"every single day,', 1260, 410, { size: 40, font: 'Nunito', weight: 800 }); txt('for three years"', 1260, 462, { size: 40, font: 'Nunito', weight: 800 }); });
    if (lt > at(1, .6)) for (let i = 0; i < 4; i++) { const a = ((lt - at(1, .6)) * .8 + i * .3) % 1.4; heart(900 + i * 60, 560 - a * 150, 1.3, COL.red, clamp(1 - a / 1.4)); }
  }, () => {
    paperBg('#FFF4DE'); fileBox(760, 680, 1.3, 1); withA(E(lt, at(2, .3)), () => { card(1340, 460, 700, 220); txt('entry #1', 1340, 400, { size: 40, weight: 700, color: COL.ink2 }); txt('"my team clapped.', 1340, 470, { size: 46, font: 'Nunito', weight: 800 }); txt('they meant it."', 1340, 530, { size: 46, font: 'Nunito', weight: 800 }); });
    ch(P_(IVY, { x: 1340, y: 1000, s: .9, expr: 'joy' }));
  }, () => {
    paperBg(); txt('Ever felt like an impostor?', W / 2, 200, { size: 80, weight: 700, alpha: B(lt, L[3]) });
    bubble(W / 2, 440, 860, 160, 'bl', B(lt, at(3, .3))); txt('tell me in the comments ↓', W / 2, 442, { size: 54, font: 'Nunito', weight: 800, alpha: E(lt, at(3, .3)) });
    withA(E(lt, at(3, .7)), () => pill('feeling like one ≠ being one', W / 2, 620, { bg: COL.ivy, size: 46 }));
    [[480, IVY], [740, SAM], [1000, ALEX], [1260, MAX]].forEach(([x, c], i) => ch(P_(c, { x, y: 1000, s: .95, expr: 'joy', arms: i % 2 ? 'wave' : 'up' })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); txt('You belong here.', W / 2, 330, { size: 110, weight: 700, color: COL.white }); txt('See you in the next one.', W / 2, 450, { size: 52, font: 'Nunito', weight: 800, color: COL.sam });
    [[560, IVY], [820, SAM], [1100, ALEX], [1360, MAX]].forEach(([x, c]) => ch(P_(c, { x, y: 960, s: 1.05, expr: 'joy', arms: 'wave' })));
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  const bg = g.createRadialGradient(W / 2, H * .6, 100, W / 2, H / 2, W * .7); bg.addColorStop(0, '#3E3466'); bg.addColorStop(1, '#1A1530'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  ch(P_(IVY, { x: 640, y: 1260, s: 2.6, expr: 'worried', sweat: true })); mask(1360, 560, 2.2);
  g.save(); g.translate(1360, 860); g.rotate(-.05); pill('"they\'ll find out..."', 0, 0, { bg: COL.red, size: 56 }); g.restore();
  g.save(); g.translate(W / 2, 140); g.rotate(-.02); g.font = '700 140px Fredoka'; const a = 'FEEL LIKE A ', b = 'FRAUD?'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 140, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 140, weight: 700, color: COL.ivy, align: 'left' }); g.restore();
  finish(); };
