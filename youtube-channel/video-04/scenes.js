// Video 04 scenes: "The Dark Triad". Uses engine/core.js helpers.

const NINA = { c: '#E05A9C', top: 'crown', sd: 7.1 }, MACK = { c: '#3E7C6B', top: 'part', sd: 8.3 }, PIERCE = { c: '#6C7A89', top: 'slick', sd: 9.7 };
const DARK = '#2A1E3D', PURP = '#8A5CF6';

// ---------- helpers for this video
function office() {
  g.fillStyle = '#E9E4DA'; g.fillRect(0, 0, W, H);
  [[120, 120], [560, 120], [1000, 120]].forEach(([x, y]) => { g.fillStyle = '#9CC3DA'; rr(x, y, 360, 330, 10); g.fill(); g.fillStyle = '#7FA8C2'; [[20, 200, 60, 130], [100, 150, 70, 180], [190, 230, 50, 100], [260, 180, 80, 150]].forEach(([a, b, w, h]) => g.fillRect(x + a, y + b, w, h)); g.lineWidth = 10; g.strokeStyle = '#B8B0A2'; rr(x, y, 360, 330, 10); g.stroke(); });
  g.fillStyle = '#B8B0A2'; g.fillRect(1500, 260, 240, 600); g.fillStyle = '#A39A8B'; g.fillRect(1520, 280, 200, 560); g.fillStyle = '#F2D27A'; g.beginPath(); g.arc(1700, 580, 9, 0, 7); g.fill();
  g.fillStyle = '#4E8A5B'; [[-30, -60, -.5], [0, -80, 0], [30, -60, .5]].forEach(([a, b, r]) => { ell(1400 + a, 800 + b, 22, 56, r); g.fill(); }); g.fillStyle = '#B5653D'; rr(1355, 790, 90, 70, 10); g.fill();
  g.fillStyle = '#CFC7B8'; g.fillRect(0, 860, W, 220); g.fillStyle = '#BDB4A3'; g.fillRect(0, 856, W, 10);
}
function aura(x, y, s, a) { if (a <= 0) return; const gr = g.createRadialGradient(x, y - 120 * s, 20, x, y - 120 * s, 260 * s); gr.addColorStop(0, `rgba(80,30,120,${.55 * a})`); gr.addColorStop(1, 'rgba(80,30,120,0)'); g.fillStyle = gr; g.fillRect(x - 300 * s, y - 420 * s, 600 * s, 520 * s); }
function sparkle(x, y, s, a = 1) { withA(a, () => { g.save(); g.translate(x, y); g.rotate(TT * 2); g.scale(s, s); g.fillStyle = '#FFD447'; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 6 : 20, an = i * Math.PI / 4; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.fill(); g.restore(); }); }
function chessPiece(x, y, s, c = COL.ink, king = false) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = c; rr(-40, -16, 80, 20, 6); g.fill(); g.beginPath(); g.moveTo(-26, -16); g.lineTo(-14, -80); g.lineTo(14, -80); g.lineTo(26, -16); g.fill();
  g.beginPath(); g.arc(0, -96, 24, 0, 7); g.fill(); if (king) { g.fillRect(-4, -146, 8, 34); g.fillRect(-14, -136, 28, 8); } g.restore(); }
function circles3(cx, cy, r, sep, a, labels = true, glowD = 0) {
  const cs = [[COL.alex, 'NARCISSISM', -Math.PI / 2], [COL.ivy, 'MACHIAVELLIANISM', Math.PI / 6], [PURP, 'PSYCHOPATHY', Math.PI * 5 / 6]];
  cs.forEach(([c, s, an], i) => { const p = B(a, i * .15, .5); if (p <= 0) return; const x = cx + Math.cos(an) * sep, y = cy + Math.sin(an) * sep; g.globalAlpha = .55; g.fillStyle = c; g.beginPath(); g.arc(x, y, r * p, 0, 7); g.fill(); g.globalAlpha = 1;
    if (labels) txt(s, cx + Math.cos(an) * (sep + r * .62), cy + Math.sin(an) * (sep + r * .62), { size: 36, weight: 700, color: dark(c, .35), alpha: p }); });
  if (glowD > 0) { const gr = g.createRadialGradient(cx, cy, 5, cx, cy, 120); gr.addColorStop(0, `rgba(30,10,50,${.9 * glowD})`); gr.addColorStop(1, 'rgba(30,10,50,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 120, 0, 7); g.fill(); txt('D', cx, cy + 4, { size: 110 * glowD, weight: 700, color: '#fff' }); }
}
function slider(x, y, w, p, label, c, mark) { g.fillStyle = '#D9D2C4'; rr(x, y - 14, w, 28, 14); g.fill(); g.fillStyle = c; rr(x, y - 14, w * p * mark, 28, 14); g.fill(); txt(label, x - 30, y, { size: 40, weight: 700, color: dark(c, .3), align: 'right' });
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x + w * mark * p, y, 26, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke(); }
function heading(s, y = 120, c = COL.ink, size = 76) { txt(s, W / 2, y, { size, weight: 700, color: c }); }

// ---------- scenes
S.officeOpen = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    office(); const w = E(lt, at(0, .2), 2);
    [[300, IVY], [520, SAM], [740, MAX]].forEach(([x, c]) => ch(P_(c, { x, y: 900, s: .95, expr: 'o', look: 1 })));
    [0, 1, 2].forEach(i => ch({ x: lerp(1620, 1050 + i * 170, w), y: 900, c: '#9AA0AE', s: .95, sd: i, expr: 'smile', look: -1, alpha: E(lt, at(0, .2) + i * .2, .4) }));
    pill('new team members', 1250, 300, { p: B(lt, at(0, .6)), bg: COL.ink, size: 40 });
  }, () => {
    office(); const sp = g.createRadialGradient(960, 700, 40, 960, 700, 500); sp.addColorStop(0, 'rgba(255,240,200,.6)'); sp.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = sp; g.fillRect(0, 0, W, H);
    [[560, EX[0], 'joy'], [720, EX[3], 'joy'], [1200, EX[1], 'joy'], [1360, EX[5], 'o']].forEach(([x, c, e], i) => ch({ x, y: 900, c, s: .9, expr: e, sd: i, look: x < 960 ? 1 : -1 }));
    ch(P_(NINA, { x: 960, y: 920, s: 1.25, expr: 'joy', arms: 'up' })); for (let i = 0; i < 6; i++) sparkle(760 + i * 80, 380 + Math.sin(TT * 2 + i) * 30, 1, E(lt, at(1, .2)));
    for (let i = 0; i < 4; i++) { const a = (lt * .8 + i * .3) % 1.4; withA(clamp(1 - a / 1.4) * E(lt, at(1, .5)), () => txt(['HA!', 'wow', 'so fun', 'haha'][i], [560, 1360, 720, 1200][i], 560 - a * 100, { size: 46, weight: 700, color: COL.alex })); }
  }, () => {
    office(); ch(P_(MACK, { x: 960, y: 920, s: 1.2, expr: 'smile' }));
    [[420, IVY, 'Ivy'], [660, SAM, 'Sam'], [1260, MAX, 'Max'], [1500, ALEX, 'Alex']].forEach(([x, c, n], i) => { ch(P_(c, { x, y: 900, s: .9, expr: 'joy', look: x < 960 ? 1 : -1 })); pill(n + ' ✓', x, 560, { p: B(lt, at(2, .1 + i * .15)), bg: COL.ivy, size: 34 }); });
    withA(E(lt, at(2, .65)), () => { bubble(960, 420, 520, 110, 'bl'); txt('"Great idea, Sam!"', 960, 422, { size: 44, font: 'Nunito', weight: 800 }); });
  }, () => {
    office(); ch(P_(PIERCE, { x: 760, y: 920, s: 1.25, expr: 'smile', arms: 'down' })); ch(P_(SAM, { x: 1240, y: 900, s: 1, expr: 'scared', sweat: true, shake: .6 }));
    withA(E(lt, at(3, .3)), () => { card(760, 360, 440, 160); txt('BIG RISK', 760, 330, { size: 48, weight: 700, color: COL.red }); g.fillStyle = '#D9D2C4'; rr(600, 380, 320, 30, 15); g.fill(); g.fillStyle = COL.red; rr(600, 380, 320 * E(lt, at(3, .4), 1), 30, 15); g.fill(); });
    withA(E(lt, at(3, .65)), () => { pill('heart rate: calm', 760, 560, { bg: COL.ivy, size: 36 }); pill('heart rate: 140!', 1240, 560, { bg: COL.red, size: 36 }); });
  }, () => {
    g.fillStyle = DARK; g.fillRect(0, 0, W, H);
    [[560, NINA, 'smug'], [960, MACK, 'smug'], [1360, PIERCE, 'flat']].forEach(([x, c, e], i) => { aura(x, 900, 1.3, E(lt, at(4, .55) + i * .15)); ch(P_(c, { x, y: 900, s: 1.2, expr: E(lt, at(4, .55)) > .5 ? e : 'smile' })); });
    withA(E(lt, at(4, .2)), () => txt('not always bad...', W / 2, 200, { size: 60, weight: 700, color: '#fff' }));
    withA(E(lt, at(4, .6)), () => txt('...but something dark in common', W / 2, 300, { size: 60, weight: 700, color: '#C9A7FF' }));
  }]);
};
S.title4 = (lt, L, Le, D, at) => {
  g.fillStyle = DARK; g.fillRect(0, 0, W, H); g.save(); g.globalAlpha = .08; g.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc((i * 397) % W, (i * 211) % H, 1.5 + (i % 3), 0, 7); g.fill(); } g.restore();
  const p = B(lt, .2, .6); g.save(); g.translate(W / 2, 230); g.scale(p, p); txt('THE DARK TRIAD', 0, 0, { size: 140, weight: 700, color: '#C9A7FF' }); g.restore();
  [['narcissism', COL.alex], ['machiavellianism', COL.ivy], ['psychopathy', PURP]].forEach(([s, c], i) => pill(s, 560 + i * 400, 400, { p: B(lt, 1 + i * .3), bg: c, size: 42 }));
  [[560, NINA, 'smug'], [960, MACK, 'smug'], [1360, PIERCE, 'flat']].forEach(([x, c, e], i) => { const q = E(lt, 1.6 + i * .2, .6); aura(x, 1060, 1.1, q); ch(P_(c, { x, y: 1080 + lerp(300, 20, q), s: 1.1, expr: e })); });
};
S.what = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#EFEAF6'); chapter(1, 'What is the Dark Triad?', lt);
    circles3(960, 580, 230, 170, clamp((lt - .3) / 1.5));
    source('Paulhus & Williams (2002)', E(lt, at(0, .4)));
  }, () => {
    paperBg('#EFEAF6'); heading('EVERYONE IS ON A SPECTRUM');
    [['narcissism', COL.alex, .25], ['machiavellianism', COL.ivy, .2], ['psychopathy', PURP, .12]].forEach(([s, c, m], i) => slider(760, 330 + i * 150, 900, E(lt, at(1, .2 + i * .12), 1), s, c, m));
    txt('low', 760, 760, { size: 36, weight: 700, color: COL.ink2 }); txt('high', 1660, 760, { size: 36, weight: 700, color: COL.ink2 });
    withA(E(lt, at(1, .7)), () => pill('most of us sit fairly low', W / 2, 880, { bg: COL.ink, size: 46 }));
  }, () => {
    paperBg('#FFF4E0'); heading('IMPORTANT', 130, COL.red, 90);
    card(W / 2, 560, 1300, 560); [['a high score ≠ a monster', .1], ["you can't diagnose anyone from a video", .4], ['only trained professionals can', .7]].forEach(([s, f], i) => { const t0 = at(2, f); check(560, 420 + i * 130, 1.4, E(lt, t0, .4), COL.red); txt(s, 630, 422 + i * 130, { size: 50, font: 'Nunito', weight: 800, align: 'left', alpha: E(lt, t0, .4) }); });
  }, () => {
    paperBg('#EFEAF6'); heading('THE DARK CORE: "D"');
    circles3(560, 600, 200, 140, 2, false, E(lt, at(3, .3), .8));
    withA(E(lt, at(3, .45)), () => { card(1340, 580, 860, 520); wrap('putting your own interests first, even when it harms others', 1340, 500, 760, 66, { size: 52, weight: 600 }); txt('+ beliefs that justify it', 1340, 720, { size: 46, font: 'Nunito', weight: 800, color: PURP, alpha: E(lt, at(3, .8)) }); });
    source('Moshagen, Hilbig & Zettler (2018)', E(lt, at(3, .3)));
  }]);
};
S.narc = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#FBE3EE'); chapter(2, 'Narcissism', lt);
    ch(P_(NINA, { x: 960, y: 920, s: 1.6, expr: 'smug', arms: 'up' })); pill('NINA', 960, 420, { p: B(lt, .6), bg: NINA.c, size: 54 }); for (let i = 0; i < 5; i++) sparkle(700 + i * 130, 300 + Math.sin(TT * 2 + i) * 30, 1.2);
  }, () => {
    paperBg('#E3EEF6');
    g.fillStyle = '#6FA8CC'; ell(760, 900, 520, 110); g.fill(); g.save(); ell(760, 900, 520, 110); g.clip(); g.translate(0, 900 * 2); g.scale(1, -1); g.globalAlpha = .45; ch(P_(NINA, { x: 760, y: 900, s: 1.3, expr: 'joy' })); g.restore();
    ch(P_(NINA, { x: 760, y: 810, s: 1.3, expr: 'joy', look: 0, lookY: 1 })); heart(900, 420, 2 * B(lt, at(1, .25)));
    txt('NARCISSUS', 760, 160, { size: 60, weight: 700, alpha: E(lt, at(1, .05)) });
    ['special', 'superior', 'entitled to admiration'].forEach((s, i) => pill(s, 1480, 380 + i * 140, { p: B(lt, at(1, .55 + i * .12)), bg: NINA.c, size: 46 }));
  }, () => {
    paperBg('#FBE3EE'); heading('FIRST IMPRESSIONS');
    ch(P_(NINA, { x: 560, y: 900, s: 1.3, expr: 'joy', arms: 'wave' })); [[1180, EX[0]], [1380, EX[2]], [1580, EX[4]]].forEach(([x, c], i) => { ch({ x, y: 900, c, s: .95, expr: 'joy', sd: i, look: -1 }); heart(x, 560, 1.4 * B(lt, at(2, .3) + i * .1)); });
    ['confident body language', 'stylish appearance'].forEach((s, i) => pill(s, 560, 300 + i * 100, { p: B(lt, at(2, .65 + i * .12)), bg: COL.ink, size: 38 }));
    source('Back, Schmukle & Egloff (2010)', E(lt, at(2, .3)));
  }, () => {
    paperBg('#FBE3EE'); heading('...BUT IT FADES');
    const base = 820; [['meeting 1', .9, COL.green, .1], ['meeting 7', .35, COL.red, .5]].forEach(([s, v, c, f], i) => { const x = 620 + i * 500; bar(x, base, 260, 520, c, v * E(lt, at(3, f), .8)); txt(s, x, base + 60, { size: 44, weight: 700 });
      ch({ x: x + 0, y: base - 520 * v * E(lt, at(3, f), .8) - 10, c: EX[i * 2], s: .5, expr: i ? 'neutral' : 'joy', sd: i, alpha: E(lt, at(3, f) + .5, .4) }); });
    line(400, base, 1400, base, 8, COL.ink); ['arrogant', 'less warm'].forEach((s, i) => pill(s, 1620, 450 + i * 110, { p: B(lt, at(3, .75 + i * .1)), bg: COL.red, size: 40 }));
    source('Paulhus (1998); illustrative', E(lt, at(3, .3)));
  }, () => {
    paperBg('#EFEAF6'); heading('TWO TYPES');
    [['GRANDIOSE', 'loud · confident', NINA.c, .1, 1], ['VULNERABLE', 'insecure · defensive · easily hurt', PURP, .35, 0]].forEach(([h, s, c, f, gr], i) => { const x = 560 + i * 800, p = B(lt, at(4, f)); withA(E(lt, at(4, f), .3), () => { g.save(); scaleAt(x, 560, p);
      card(x, 560, 700, 680); txt(h, x, 280, { size: 60, weight: 700, color: c }); txt(s, x, 350, { size: 36, font: 'Nunito', weight: 800, maxW: 640 });
      if (gr) ch(P_(NINA, { x, y: 820, s: 1.1, expr: 'joy', arms: 'up' })); else { ch(P_(NINA, { x, y: 820, s: 1.1, top: null, expr: 'worried', arms: 'hug', sweat: true })); cloud(x + 150, 470, .5, true); }
      g.restore(); }); });
    pill('both: very focused on the self', W / 2, 990, { p: B(lt, at(4, .8)), bg: COL.ink, size: 40 });
  }, () => {
    paperBg('#FBE3EE'); heading('TRAIT ≠ DIAGNOSIS');
    [['everyday trait', 'a spectrum we all sit on', COL.alex, .1], ['narcissistic personality disorder', 'much rarer: ~0–6% in community samples', PURP, .4]].forEach(([h, s, c, f], i) => { const x = 560 + i * 800, p = B(lt, at(5, f)); withA(E(lt, at(5, f), .3), () => { g.save(); scaleAt(x, 560, p);
      card(x, 560, 720, 520); wrap(h, x, 400, 640, 60, { size: 52, weight: 700, color: c }); wrap(s, x, 620, 620, 54, { size: 42, font: 'Nunito', weight: 800 }); g.restore(); }); });
    source('American Psychiatric Association, DSM-5', E(lt, at(5, .4)));
  }]);
};
S.mach = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#E2EFEB'); chapter(3, 'Machiavellianism', lt);
    ch(P_(MACK, { x: 900, y: 920, s: 1.6, expr: 'smug' })); chessPiece(1180, 900, 1.3, COL.ink, true); pill('MACK', 900, 420, { p: B(lt, .6), bg: MACK.c, size: 54 });
  }, () => {
    paperBg('#F4E9D2');
    g.save(); g.translate(560, 560); g.rotate(-.05); g.fillStyle = '#7A2E2E'; rr(-220, -300, 440, 600, 16); g.fill(); g.fillStyle = '#5C1F1F'; g.fillRect(-220, -300, 40, 600); g.strokeStyle = '#E2B65A'; g.lineWidth = 6; rr(-150, -240, 340, 480, 10); g.stroke();
    txt('IL', 20, -120, { size: 60, weight: 700, color: '#E2B65A' }); txt('PRINCIPE', 20, -40, { size: 56, weight: 700, color: '#E2B65A' }); txt('1532', 20, 160, { size: 36, weight: 600, color: '#E2B65A' }); g.restore();
    txt('Niccolò Machiavelli', 560, 950, { size: 44, weight: 700, alpha: E(lt, at(1, .1)) });
    withA(E(lt, at(1, .6)), () => { card(1340, 520, 820, 380, 1, '#FFFDF6'); wrap('"It is much safer to be feared than loved."', 1340, 500, 700, 74, { size: 60, weight: 600 }); txt('The Prince, ch. 17', 1340, 650, { size: 32, font: 'Nunito', weight: 700, color: COL.ink2 }); });
  }, () => {
    paperBg('#E2EFEB'); heading('THE "MACH" QUESTIONNAIRE');
    g.fillStyle = '#B0805A'; rr(380, 260, 520, 680, 20); g.fill(); g.fillStyle = '#fff'; rr(410, 310, 460, 600, 10); g.fill(); g.fillStyle = '#8C8C8C'; rr(560, 240, 160, 50, 10); g.fill();
    for (let i = 0; i < 5; i++) { const y = 380 + i * 110; g.strokeStyle = COL.ink; g.lineWidth = 5; g.strokeRect(440, y - 22, 44, 44); check(462, y, .9, E(lt, at(2, .1) + i * .25, .3), MACK.c); line(510, y, 820 - (i % 2) * 80, y, 8, '#C9C3B8'); }
    ['cynical view of others', 'relationships as tools'].forEach((s, i) => pill(s, 1360, 450 + i * 160, { p: B(lt, at(2, .55 + i * .15)), bg: MACK.c, size: 48 }));
    source('Christie & Geis (1970), Studies in Machiavellianism', E(lt, at(2, .3)));
  }, () => {
    paperBg('#E2EFEB'); heading('THE LONG GAME', 120, MACK.c);
    const bx = 1060, by = 300, sq = 70; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { g.fillStyle = (r + c) % 2 ? '#8C6A4E' : '#E8D9BC'; g.fillRect(bx + c * sq, by + r * sq, sq, sq); }
    chessPiece(bx + 2.5 * sq, by + 6 * sq + 50, .45, '#fff'); chessPiece(bx + 5.5 * sq, by + 2 * sq + 50, .45, COL.ink, true);
    g.setLineDash([12, 10]); arrowLine(bx + 2.5 * sq, by + 6 * sq, bx + 4.5 * sq, by + 4 * sq, E(lt, at(3, .2), .8), MACK.c, 6); arrowLine(bx + 4.5 * sq, by + 4 * sq, bx + 5.5 * sq, by + 2.6 * sq, E(lt, at(3, .45), .8), MACK.c, 6); g.setLineDash([]);
    ch(P_(MACK, { x: 560, y: 920, s: 1.4, expr: 'smug', look: 1 }));
    ['patient', 'calculating', 'flatters & deceives'].forEach((s, i) => pill(s, 560, 330 + i * 100, { p: B(lt, at(3, .5 + i * .12)), bg: COL.ink, size: 40 }));
  }, () => {
    paperBg('#E2EFEB'); heading('A SURPRISE');
    ch(P_(MACK, { x: 520, y: 940, s: 1.4, expr: lt > at(4, .5) ? 'worried' : 'smug', look: 1 }));
    [[IVY, 'joy'], [SAM, 'nervous'], [ALEX, 'sad']].forEach(([c, e], i) => { const x = 1000 + i * 280; ch(P_(c, { x, y: 760, s: .8, expr: e, look: -1 })); txt('?', x, 420, { size: 80, weight: 700, color: MACK.c, alpha: E(lt, at(4, .35) + i * .1, .3) }); });
    withA(E(lt, at(4, .45)), () => { card(1280, 900, 860, 150); txt('not better at reading emotions', 1280, 880, { size: 44, weight: 700 }); txt('(some studies: a little worse)', 1280, 935, { size: 32, font: 'Nunito', weight: 800, color: COL.ink2 }); });
    source('e.g. Miao et al. (2019), meta-analysis on emotional intelligence', E(lt, at(4, .4)));
  }]);
};
S.psych = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#E8EAF0'); chapter(4, 'Psychopathy', lt);
    ch(P_(PIERCE, { x: 960, y: 920, s: 1.6, expr: 'flat' })); pill('PIERCE', 960, 420, { p: B(lt, .6), bg: PIERCE.c, size: 54 });
  }, () => {
    paperBg('#E8EAF0'); ch(P_(PIERCE, { x: 400, y: 940, s: 1.4, expr: 'flat' }));
    [['bold', COL.ink2], ['thrill-seeking', COL.alex], ['impulsive', COL.sam], ['low empathy', PURP], ['low remorse', PURP]].forEach(([s, c], i) => pill(s, 1180, 260 + i * 140, { p: B(lt, at(1, .08 + i * .14)), bg: c, color: i === 2 ? COL.ink : '#fff', size: i > 2 ? 56 : 46 }));
  }, () => {
    paperBg('#E8EAF0');
    withA(E(lt, at(2, .05)), () => { g.fillStyle = COL.ink; rr(160, 220, 700, 440, 16); g.fill(); g.fillStyle = '#3A1F2B'; rr(184, 244, 652, 392, 10); g.fill(); txt('MOVIE "PSYCHOPATH"', 510, 440, { size: 46, weight: 700, color: '#FF7B7B' }); stamp('MYTH', 510, 560, E(lt, at(2, .25), .35), COL.red, -.1, 70); });
    withA(E(lt, at(2, .3)), () => { ch(P_(PIERCE, { x: 510, y: 1000, s: .8, expr: 'smile', arms: 'cup' })); txt('many are not violent at all', 510, 720, { size: 40, weight: 700 }); });
    withA(E(lt, at(2, .6)), () => { card(1380, 520, 760, 520); txt('Official diagnosis?', 1380, 330, { size: 52, weight: 700 }); txt('Not in the DSM', 1380, 450, { size: 46, font: 'Nunito', weight: 800, color: COL.red }); txt('closest: antisocial', 1380, 560, { size: 44, font: 'Nunito', weight: 800 }); txt('personality disorder', 1380, 620, { size: 44, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#E8EAF0'); heading('HOW COMMON IS IT?');
    [['strictest clinical tool', 1, .1], ['broader questionnaires', 4.5, .5]].forEach(([s, n, f], k) => { const ox = 260 + k * 800; withA(E(lt, at(3, f), .4), () => {
      for (let i = 0; i < 100; i++) { const x = ox + (i % 10) * 60, y = 280 + Math.floor(i / 10) * 60; const on = i < Math.ceil(n * E(lt, at(3, f) + .3, .8)); g.fillStyle = on ? PURP : '#D3D6DE'; if (i === 4 && n === 4.5 && on) g.fillStyle = mix(PURP, '#D3D6DE', .5); g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); }
      txt(k ? '~4–5%' : '~1%', ox + 270, 930, { size: 80, weight: 700, color: PURP }); txt(s, ox + 270, 1010, { size: 38, font: 'Nunito', weight: 800 }); }); });
    pill('more common in men', W / 2, 205, { p: B(lt, at(3, .85)), bg: COL.ink, size: 36 });
    source('Sanz-García et al. (2021), meta-analysis', E(lt, at(3, .3)));
  }, () => {
    paperBg('#E8EAF0'); heading('EMPATHY IN THE BRAIN');
    [['just watching', .2, .15], ['asked to feel with them', .8, .55]].forEach(([s, lv, f], i) => { const x = 560 + i * 800; withA(E(lt, at(4, f), .4), () => { brainChar(x, 520, .95, { expr: 'smile', amyg: lv * E(lt, at(4, f) + .2, .6), hippo: 0 }); txt(s, x, 820, { size: 46, weight: 700 }); }); });
    arrowLine(860, 520, 1060, 520, E(lt, at(4, .55), .5), COL.ink, 10);
    withA(E(lt, at(4, .8)), () => pill('the difference shrank a lot', W / 2, 960, { bg: COL.ink, size: 44 }));
    source('Meffert, Gazzola, den Boer, Bartels & Keysers (2013), Brain', E(lt, at(4, .3)));
  }, () => {
    paperBg('#E8EAF0'); const on = lt > at(5, .55);
    g.fillStyle = '#F4F1EA'; rr(760, 280, 400, 560, 30); g.fill(); g.lineWidth = 8; g.strokeStyle = COL.ink; g.stroke(); g.fillStyle = '#D3D6DE'; rr(880, 380, 160, 360, 20); g.fill();
    g.fillStyle = on ? COL.green : COL.ink2; rr(900, on ? 400 : 560, 120, 160, 16); g.fill(); txt('EMPATHY', 960, 220, { size: 64, weight: 700 });
    txt(on ? 'ON (when they try)' : 'usually OFF', 960, 920, { size: 56, weight: 700, color: on ? COL.green : COL.ink2 });
    ch(P_(PIERCE, { x: 1460, y: 940, s: 1.2, expr: on ? 'smile' : 'flat', look: -1 }));
    withA(E(lt, at(5, .1)), () => { txt('not broken...', 400, 520, { size: 52, weight: 700 }); });
  }]);
};
S.compare4 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 4, 5, 6], [() => {
    paperBg('#EFEAF6'); chapter(5, 'Telling them apart', lt); heading('WHAT DRIVES EACH ONE?', 200);
    [[NINA, 'ADMIRATION', 'needs an audience', COL.alex], [MACK, 'CONTROL', 'plans carefully', COL.ivy], [PIERCE, 'EXCITEMENT', 'wants it right now', PURP]].forEach(([c, h, s, col], i) => { const x = 420 + i * 540, t0 = L[i + 1]; ch(P_(c, { x, y: 960, s: 1.05, expr: lt > t0 ? (i === 2 ? 'joy' : 'smug') : 'smile' }));
      withA(E(lt, t0 - .1, .4), () => { card(x, 480, 460, 260); txt(h, x, 440, { size: 56, weight: 700, color: col }); txt(s, x, 520, { size: 38, font: 'Nunito', weight: 800 });
        if (i === 0) for (let k = 0; k < 3; k++) sparkle(x - 150 + k * 150, 330, .8); if (i === 1) chessPiece(x + 180, 400, .35, COL.ink, true); if (i === 2) bolt(x + 190, 380, .8); }); });
  }, () => {
    paperBg('#EFEAF6'); heading('TIMING');
    const y = 640; arrowLine(1720, y, 220, y, E(lt, at(4, .05), .8), COL.ink, 10); txt('LONG-TERM', 300, y + 70, { size: 46, weight: 700, color: COL.ivy }); txt('RIGHT NOW', 1620, y + 70, { size: 46, weight: 700, color: PURP });
    withA(E(lt, at(4, .2)), () => { ch(P_(MACK, { x: 420, y: y - 40, s: 1, expr: 'smug' })); chessPiece(600, y - 40, .7, COL.ink, true); pill('strategic', 420, 300, { bg: COL.ivy, size: 42 }); });
    withA(E(lt, at(4, .6)), () => { ch(P_(PIERCE, { x: 1500, y: y - 40, s: 1, expr: 'joy' })); bolt(1680, y - 200, 1.2); pill('impulsive', 1500, 300, { bg: PURP, size: 42 }); });
  }, () => {
    paperBg('#EFEAF6'); heading('GENES OR ENVIRONMENT?');
    [['narcissism', .62, COL.alex], ['machiavellianism', .3, COL.ivy], ['psychopathy', .65, PURP]].forEach(([s, v, c], i) => { const y = 340 + i * 180, p = E(lt, at(5, .2 + i * .15), .8);
      txt(s, 640, y, { size: 44, weight: 700, color: dark(c, .3), align: 'right' }); g.fillStyle = '#7FB3D5'; rr(680, y - 40, 900 * v * p, 80, 16); g.fill(); g.fillStyle = '#F2B84B'; rr(680 + 900 * v * p, y - 40, 900 * (1 - v) * p, 80, 16); g.fill(); });
    withA(E(lt, at(5, .3)), () => { pill('mostly genes', 900, 900, { bg: '#5D9BC4', size: 40 }); pill('more environment', 1360, 900, { bg: '#D99A2B', size: 40 }); });
    txt('illustrative', W / 2, 990, { size: 30, font: 'Nunito', weight: 700, color: COL.ink2, alpha: E(lt, at(5, .3)) });
    source('Vernon, Villani, Vickers & Harris (2008), twin study', E(lt, at(5, .3)));
  }, () => {
    paperBg('#EFEAF6'); heading('A FOURTH TRAIT? THE DARK TETRAD');
    circles3(460, 560, 150, 110, 2, false); g.globalAlpha = .55; g.fillStyle = COL.red; g.beginPath(); g.arc(640, 560, 150 * B(lt, at(6, .1)), 0, 7); g.fill(); g.globalAlpha = 1; txt('everyday sadism', 560, 820, { size: 44, weight: 700, color: COL.red, alpha: E(lt, at(6, .15)) });
    withA(E(lt, at(6, .45)), () => { g.fillStyle = '#9AA3B5'; rr(1120, 420, 420, 380, 20); g.fill(); g.fillStyle = '#7C8597'; g.beginPath(); g.moveTo(1200, 420); g.lineTo(1460, 420); g.lineTo(1400, 300); g.lineTo(1260, 300); g.fill(); g.fillStyle = COL.ink; rr(1160, 760, 340, 30, 10); g.fill();
      for (let i = 0; i < 3; i++) { g.fillStyle = COL.ink; ell(1280 + i * 50, 270 - Math.abs(Math.sin(TT * 4 + i)) * 10, 14, 9); g.fill(); } txt('"bug grinder"', 1330, 600, { size: 40, weight: 700, color: '#fff' }); });
    pill('no bugs were actually harmed', 1330, 900, { p: B(lt, at(6, .7)), bg: COL.ivy, size: 40 });
    source('Buckels, Jones & Paulhus (2013)', E(lt, at(6, .3)));
  }]);
};
S.real = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2], [() => {
    office(); chapter(6, 'In the real world', lt); g.fillStyle = 'rgba(233,228,218,.85)'; g.fillRect(0, 0, W, H);
    heading('COUNTERPRODUCTIVE WORK BEHAVIOR', 220, COL.ink, 62); const base = 820;
    [['N', COL.alex], ['M', COL.ivy], ['P', PURP]].forEach(([s, c], i) => { const x = 560 + i * 260; bar(x, base, 180, 400, c, .55 * E(lt, at(0, .45) + i * .1, .8)); txt(s, x, base + 50, { size: 50, weight: 700, color: c }); });
    line(400, base, 1240, base, 8, COL.ink); ['cheating', 'bullying', 'stealing'].forEach((s, i) => pill(s, 1500, 480 + i * 110, { p: B(lt, at(0, .7) + i * .1), bg: COL.red, size: 40 }));
    txt('all three linked to more', 820, 965, { size: 38, font: 'Nunito', weight: 800, alpha: E(lt, at(0, .5)) });
    source("O'Boyle, Forsyth, Banks & McDaniel (2012), meta-analysis", E(lt, at(0, .4)));
  }, () => {
    paperBg('#E2EFEB'); heading('PROTECT YOURSELF', 120, COL.ivy);
    g.save(); g.translate(400, 560); g.fillStyle = COL.ivy; g.beginPath(); g.moveTo(0, -200); g.lineTo(170, -130); g.quadraticCurveTo(170, 120, 0, 220); g.quadraticCurveTo(-170, 120, -170, -130); g.closePath(); g.fill(); check(0, 0, 4, E(lt, at(1, .1), .6), '#fff'); g.restore();
    [['watch actions over time, not first impressions', .12], ['notice when flattery comes with requests', .35], ['trust your boundaries', .55], ['no diagnosis needed to step away', .72]].forEach(([s, f], i) => { withA(E(lt, at(1, f), .4), () => { card(1200, 300 + i * 160, 1060, 120); txt(s, 1200, 302 + i * 160, { size: 42, font: 'Nunito', weight: 800, maxW: 980 }); }); });
  }, () => {
    paperBg('#EFEAF6');
    g.fillStyle = '#B0805A'; rr(1040, 260, 420, 640, 200); g.fill(); g.fillStyle = '#DDEBF2'; rr(1070, 290, 360, 580, 180); g.fill();
    g.save(); rr(1070, 290, 360, 580, 180); g.clip(); ch(P_(SAM, { x: 1250, y: 980, s: 1.5, expr: 'calm', flip: true })); g.restore();
    ch(P_(SAM, { x: 640, y: 940, s: 1.5, expr: lt > at(2, .5) ? 'smile' : 'worried', look: 1 }));
    pill('self-awareness', 640, 380, { p: B(lt, at(2, .35)), bg: PURP, size: 48 }); pill('people can change', 640, 490, { p: B(lt, at(2, .75)), bg: COL.ivy, size: 44 });
  }]);
};
S.light = (lt, L, Le, D, at) => {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#FFF3C4'); sky.addColorStop(1, '#FCE6B8'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, 1180); for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.fillStyle = 'rgba(255,214,90,.18)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, -1400); g.lineTo(90, -1400); g.fill(); } g.restore();
  chapter(7, 'The Light Triad', lt);
  panels(lt, L, [0, 1, 2, 3], [() => {
    const p = B(lt, .3, .6); g.save(); g.translate(W / 2, 320); g.scale(p, p); txt('THE LIGHT TRIAD', 0, 0, { size: 130, weight: 700, color: '#E0A100' }); g.restore();
    [[560, IVY], [820, SAM], [1100, ALEX], [1360, MAX]].forEach(([x, c], i) => ch(P_(c, { x, y: 960, s: 1.05, expr: 'joy', arms: i % 2 ? 'wave' : 'up', alpha: E(lt, .8 + i * .15) })));
    source('Kaufman, Yaden, Hyde & Tsukayama (2019)', E(lt, at(0, .4)));
  }, () => {
    [['KANTIANISM', 'people, not tools', COL.ivy, .08], ['HUMANISM', 'the dignity of every person', COL.sam, .35], ['FAITH IN HUMANITY', 'people are basically good', COL.alex, .62]].forEach(([h, s, c, f], i) => { const x = 360 + i * 600, p = B(lt, at(1, f)); withA(E(lt, at(1, f), .3), () => { g.save(); scaleAt(x, 540, p);
      card(x, 540, 540, 560); g.fillStyle = c; rr(x - 270, 260, 540, 120, 28); g.fill(); g.fillRect(x - 270, 330, 540, 50); txt(h, x, 322, { size: h.length > 12 ? 44 : 54, weight: 700, color: i === 1 ? COL.ink : '#fff' });
      if (i === 0) { ch(P_(IVY, { x: x - 70, y: 680, s: .6, expr: 'joy' })); ch(P_(SAM, { x: x + 70, y: 680, s: .6, expr: 'joy' })); } if (i === 1) heart(x, 560, 3.4); if (i === 2) { g.fillStyle = '#FFD447'; g.beginPath(); g.arc(x, 560, 70, 0, 7); g.fill(); }
      txt(s, x, 760, { size: 38, font: 'Nunito', weight: 800, maxW: 500 }); g.restore(); }); });
  }, () => {
    heading('MORE LIFE SATISFACTION', 175, '#C98A00', 80);
    ch(P_(IVY, { x: 760, y: 960, s: 1.5, expr: 'joy', arms: 'up' })); g.fillStyle = '#FFD447'; g.beginPath(); g.arc(760, 380, 110 * B(lt, at(2, .2)), 0, 7); g.fill();
    g.fillStyle = '#fff'; rr(1300, 260, 90, 600, 45); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke(); bar(1345, 840, 60, 560, COL.green, .2 + .7 * E(lt, at(2, .35), 1.4)); txt('life satisfaction', 1345, 920, { size: 40, weight: 700 });
  }, () => {
    heading('MOST PEOPLE LEAN LIGHT', 175, '#C98A00', 80);
    const base = 820; bar(700, base, 300, 520, '#F2B84B', .78 * E(lt, at(3, .1), 1)); bar(1220, base, 300, 520, '#6B5A8C', .42 * E(lt, at(3, .1), 1)); line(460, base, 1460, base, 8, COL.ink);
    txt('lean light', 700, base + 60, { size: 46, weight: 700 }); txt('lean dark', 1220, base + 60, { size: 46, weight: 700 }); txt('illustrative', 960, base + 105, { size: 30, font: 'Nunito', weight: 700, color: COL.ink2 });
    withA(E(lt, at(3, .6)), () => pill('kindness is surprisingly common', W / 2, 1010, { bg: COL.ivy, size: 44 }));
  }]);
};
S.outro4 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1], [() => {
    paperBg(); txt('Which traits have you noticed?', W / 2, 200, { size: 80, weight: 700, alpha: B(lt, .2) });
    bubble(W / 2, 430, 860, 160, 'bl', B(lt, at(0, .5))); txt('tell me in the comments ↓', W / 2, 432, { size: 54, font: 'Nunito', weight: 800, alpha: E(lt, at(0, .5)) });
    [[400, NINA, 'smug'], [640, MACK, 'smug'], [880, PIERCE, 'flat'], [1120, IVY, 'joy'], [1360, SAM, 'joy'], [1600, ALEX, 'smile']].forEach(([x, c, e]) => ch(P_(c, { x, y: 980, s: .9, expr: e })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); txt('Thanks for watching!', W / 2, 330, { size: 110, weight: 700, color: COL.white }); txt('See you in the next one.', W / 2, 450, { size: 52, font: 'Nunito', weight: 800, color: COL.sam });
    [[400, IVY], [640, SAM], [880, ALEX], [1120, MAX], [1360, NINA], [1600, MACK]].forEach(([x, c]) => ch(P_(c, { x, y: 960, s: .95, expr: 'joy', arms: 'wave' })));
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  const bg = g.createRadialGradient(W / 2, H * .65, 100, W / 2, H / 2, W * .7); bg.addColorStop(0, '#4A2F6E'); bg.addColorStop(1, '#1A1028'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  [[360, NINA, 'smug', 'NARCISSIST', COL.alex], [960, MACK, 'smug', 'MANIPULATOR', COL.ivy], [1560, PIERCE, 'flat', 'PSYCHOPATH', PURP]].forEach(([x, c, e, lab, col], i) => {
    aura(x, 930, 1.9, 1); ch(P_(c, { x, y: 930, s: 1.9, expr: e }));
    g.save(); g.translate(x, 1000); g.rotate((i - 1) * -.03); g.font = '700 80px Fredoka'; const w = g.measureText(lab).width + 60; g.fillStyle = col; rr(-w / 2, -55, w, 110, 26); g.fill(); txt(lab, 0, 4, { size: 80, weight: 700, color: '#fff' }); g.restore(); });
  g.save(); g.translate(W / 2, 140); g.rotate(-.02); g.font = '700 150px Fredoka'; const a = 'THE ', b = 'DARK TRIAD'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 150, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 150, weight: 700, color: '#C9A7FF', align: 'left' }); g.restore();
  finish(); };
