// Video 03 scenes: "Why You Procrastinate (It's Not Laziness)". Uses engine/core.js helpers.

// ---------- helpers for this video
function deskRoom(o = {}) { const { time = 8, panic = 0 } = o;
  const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, mix('#3B3F6B', '#6B2E3B', panic)); wall.addColorStop(1, mix('#4E5280', '#7E3A44', panic)); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1E2243'; rr(150, 140, 320, 300, 12); g.fill(); g.fillStyle = '#F6E7B8'; g.beginPath(); g.arc(380, 210, 26, 0, 7); g.fill(); g.lineWidth = 12; g.strokeStyle = '#2A2D52'; rr(150, 140, 320, 300, 12); g.stroke(); line(310, 140, 310, 440, 8, '#2A2D52');
  // calendar
  g.fillStyle = COL.white; rr(1320, 150, 230, 250, 12); g.fill(); g.fillStyle = COL.red; rr(1320, 150, 230, 60, 12); g.fill(); g.fillRect(1320, 190, 230, 20);
  for (let i = 0; i < 21; i++) { const cx = 1345 + (i % 7) * 30, cy = 240 + Math.floor(i / 7) * 45; g.fillStyle = i === 20 ? COL.red : '#C9C3B8'; g.beginPath(); g.arc(cx + 10, cy + 10, 9, 0, 7); g.fill(); }
  txt('DUE', 1435, 180, { size: 34, weight: 700, color: '#fff' });
  if (o.clock !== false) clock(1000, 230, 90, time);
  // lamp glow
  const lg = g.createRadialGradient(560, 640, 20, 560, 700, 520); lg.addColorStop(0, 'rgba(255,220,150,.35)'); lg.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = lg; g.fillRect(0, 200, 1300, 880);
  g.fillStyle = '#2A2D52'; g.fillRect(0, 900, W, 180);
}
function desk() { g.fillStyle = '#8C5A3C'; rr(380, 760, 1160, 50, 10); g.fill(); g.fillStyle = '#7A4C31'; g.fillRect(420, 810, 40, 200); g.fillRect(1460, 810, 40, 200);
  // laptop
  g.fillStyle = '#C9CED8'; rr(820, 560, 380, 220, 14); g.fill(); g.fillStyle = '#F5F6FA'; rr(840, 578, 340, 182, 8); g.fill(); g.fillStyle = '#AEB4C0'; rr(780, 770, 460, 20, 8); g.fill();
  // lamp
  line(520, 760, 560, 600, 10, COL.ink); line(560, 600, 640, 620, 10, COL.ink); g.fillStyle = '#F2B84B'; g.beginPath(); g.moveTo(610, 600); g.lineTo(690, 620); g.lineTo(660, 680); g.lineTo(600, 660); g.fill(); }
function phone(x, y, s, o = {}) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = COL.ink; rr(-50, -90, 100, 180, 18); g.fill(); g.fillStyle = o.screen || '#5B8DEF'; rr(-40, -72, 80, 140, 8); g.fill();
  if (o.play) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-14, -22); g.lineTo(20, 0); g.lineTo(-14, 22); g.fill(); } g.restore(); }
function docPage(x, y, s, lines = 0, o = {}) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = COL.white; rr(-110, -150, 220, 300, 12); g.fill(); g.lineWidth = 5; g.strokeStyle = COL.ink; g.stroke();
  txt(o.title || 'ESSAY', 0, -110, { size: 34, weight: 700 }); for (let i = 0; i < Math.floor(lines); i++) line(-80, -60 + i * 26, i % 3 === 2 ? 40 : 80, -60 + i * 26, 6, '#9AA0AE');
  if (lines % 1 > 0) line(-80, -60 + Math.floor(lines) * 26, -80 + 160 * (lines % 1), -60 + Math.floor(lines) * 26, 6, '#9AA0AE'); g.restore(); }
function futureSam(x, y, s, o = {}) { ch(Object.assign({ x, y, s, c: mix(COL.sam, '#B8B2A6', .45), top: 'tuft', sd: 6.2, expr: 'smile' }, o));
  g.save(); g.translate(x, y); g.scale(o.flip ? -s : s, s); const ey = -178 + Math.sin(TT * 2.3 + 6.2) * 3; g.strokeStyle = COL.ink; g.lineWidth = 5;
  [-24, 24].forEach(dx => { g.beginPath(); g.arc(dx, ey, 22, 0, 7); g.stroke(); }); line(-2, ey, 2, ey, 5, COL.ink);
  g.fillStyle = '#E8E4DC'; [-14, 0, 14].forEach(d => { ell(d, -244, 10, 6); g.fill(); }); g.restore(); }
function arrowLine(x1, y1, x2, y2, p, c = COL.ink, w = 8) { if (p <= 0) return; const x = lerp(x1, x2, p), y = lerp(y1, y2, p); line(x1, y1, x, y, w, c); const an = Math.atan2(y2 - y1, x2 - x1);
  g.fillStyle = c; g.beginPath(); g.moveTo(x + Math.cos(an) * 18, y + Math.sin(an) * 18); g.lineTo(x + Math.cos(an + 2.4) * 22, y + Math.sin(an + 2.4) * 22); g.lineTo(x + Math.cos(an - 2.4) * 22, y + Math.sin(an - 2.4) * 22); g.fill(); }
function trophy(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#F2B84B'; g.beginPath(); g.moveTo(-60, -100); g.lineTo(60, -100); g.quadraticCurveTo(60, 10, 0, 20); g.quadraticCurveTo(-60, 10, -60, -100); g.fill();
  g.lineWidth = 12; g.strokeStyle = '#F2B84B'; g.beginPath(); g.arc(-60, -60, 26, Math.PI * .5, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(60, -60, 26, -Math.PI * .5, Math.PI * .5); g.stroke();
  g.fillStyle = '#D99A2B'; g.fillRect(-12, 20, 24, 40); rr(-50, 56, 100, 26, 6); g.fill(); g.restore(); }
function tipTag(n, s) { g.fillStyle = COL.ink; rr(60, 60, 120 + s.length * 26, 80, 40); g.fill(); g.fillStyle = COL.sam; g.beginPath(); g.arc(100, 100, 28, 0, 7); g.fill(); txt(String(n), 100, 102, { size: 36, weight: 700 }); txt(s, 145, 102, { size: 40, color: '#fff', align: 'left' }); }
const SAMDESK = (lt, o = {}) => { ch(P_(SAM, Object.assign({ x: 1340, y: 960, s: 1.45, expr: 'smile', look: -1 }, o))); desk(); };

// ---------- scenes
S.deskOpen = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    deskRoom({ time: 8 }); SAMDESK(lt, { expr: 'smile', look: 1 });
    withA(E(lt, at(0, .6)), () => { pill('3 weeks to go', 1435, 460, { bg: COL.red, size: 36 }); });
    docPage(1010, 670, .5, 0);
  }, () => {
    paperBg('#ECE8F8');
    const P3 = [['sock drawer', .12], ['octopus documentary', .38], ['checking phone', .7]];
    P3.forEach(([s, f], i) => { const x = 360 + i * 600, p = B(lt, at(1, f)); withA(E(lt, at(1, f), .3), () => { g.save(); scaleAt(x, 540, p); card(x, 540, 520, 600);
      if (i === 0) { g.fillStyle = '#B0805A'; rr(x - 180, 360, 360, 220, 14); g.fill(); g.fillStyle = '#C99A72'; rr(x - 160, 380, 320, 80, 10); g.fill(); [COL.red, COL.ivy, COL.sam, COL.max, COL.alex].forEach((c, k) => { g.fillStyle = c; rr(x - 150 + k * 62, 480, 50, 80, 14); g.fill(); }); ch(P_(SAM, { x, y: 755, s: .55, expr: 'joy' })); }
      if (i === 1) { g.fillStyle = COL.ink; rr(x - 200, 330, 400, 260, 16); g.fill(); g.fillStyle = '#2E6F8E'; rr(x - 184, 346, 368, 228, 10); g.fill(); g.fillStyle = COL.alex; g.beginPath(); g.arc(x, 430, 50, 0, 7); g.fill();
        g.strokeStyle = COL.alex; g.lineWidth = 12; g.lineCap = 'round'; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x - 40 + k * 16, 470); g.quadraticCurveTo(x - 60 + k * 24 + Math.sin(TT * 3 + k) * 20, 520, x - 50 + k * 20, 560); g.stroke(); }
        g.fillStyle = '#fff'; ell(x - 16, 425, 9, 11); g.fill(); ell(x + 16, 425, 9, 11); g.fill(); ch(P_(SAM, { x, y: 755, s: .5, expr: 'o' })); }
      if (i === 2) { phone(x, 440, 1.3); ch(P_(SAM, { x: x - 150, y: 755, s: .55, expr: 'smile' })); pill('×' + Math.min(100, Math.floor(clamp((lt - at(1, .7)) / 2) * 100)), x + 110, 330, { bg: COL.red, size: 44 }); }
      txt(s, x, 805, { size: 38, weight: 700 }); g.restore(); }); });
  }, () => {
    const pan = .5 + .5 * Math.sin(TT * 6); deskRoom({ time: 11, panic: .6 * pan * E(lt, L[2] + .3) });
    SAMDESK(lt, { expr: lt > at(2, .5) ? 'scared' : 'o', sweat: lt > at(2, .5), shake: lt > at(2, .5) ? 1 : 0 }); docPage(1010, 670, .5, 0);
    g.save(); g.translate(960 + Math.sin(TT * 40) * 5, 470); g.scale(B(lt, at(2, .55)), B(lt, at(2, .55))); txt('PANIC', 0, 0, { size: 160, weight: 700, color: COL.alex }); g.restore();
  }, () => {
    deskRoom({ time: 11.1 }); SAMDESK(lt, { expr: 'worried' }); docPage(1010, 670, .5, 0);
    pill('LAZY?', 1340, 540, { p: B(lt, at(3, .2)), bg: COL.white, color: COL.ink, size: 64 }); strike(1340, 540, 300, E(lt, at(3, .6), .4));
    pill('usually not the real problem', 1340, 430, { p: B(lt, at(3, .75)), bg: COL.ink, size: 38 });
  }, () => {
    paperBg('#ECE8F8');
    [['LAZY', "doesn't want to do it", 0], ['PROCRASTINATING', 'wants to do it... but doesn\'t', 1]].forEach(([h, s, i]) => { const x = 520 + i * 880, p = B(lt, at(4, i ? .4 : .05)); withA(E(lt, at(4, i ? .4 : .05), .3), () => { g.save(); scaleAt(x, 540, p);
      card(x, 540, 720, 760, 1, i ? '#FFF7DC' : '#E3E6EE'); txt(h, x, 230, { size: 64, weight: 700, color: i ? dark(COL.sam, .3) : COL.ink2 }); txt(s, x, 320, { size: 38, font: 'Nunito', weight: 800 });
      if (!i) { g.fillStyle = '#9C8C76'; rr(x - 250, 640, 500, 140, 40); g.fill(); lying({ x: x - 150, y: 650, c: EX[0], s: .7, expr: 'calm', sd: 1 }); txt('zzz', x + 160, 520, { size: 50, weight: 700, color: COL.ink2 }); }
      else { ch(P_(SAM, { x, y: 860, s: 1.1, expr: 'worried', sweat: true })); heart(x + 150, 520, 2.2); txt('cares!', x + 150, 600, { size: 34, weight: 700, color: COL.red }); }
      g.restore(); }); });
  }]);
};
S.title3 = (lt, L, Le, D, at) => {
  g.fillStyle = COL.night; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = .08; g.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc((i * 397) % W, (i * 211) % H, 1.5 + (i % 3), 0, 7); g.fill(); } g.restore();
  [['WHY YOU PROCRASTINATE', COL.white, 260, 120], ["(it's not laziness)", COL.sam, 400, 80]].forEach(([s, c, y, sz], i) => { const p = B(lt, .2 + i * .5, .5); g.save(); g.translate(W / 2, y); g.scale(p, p); txt(s, 0, 0, { size: sz, weight: 700, color: c }); g.restore(); });
  const p = E(lt, 1, .7); ch(P_(SAM, { x: 860, y: 1080 + lerp(300, 30, p), s: 1.4, expr: 'smile', look: 1 })); phone(1060, 1080 + lerp(300, 30, p) - 230, 1.1, { play: true });
};
S.define = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg(); chapter(1, "Procrastination isn't laziness", lt);
    card(W / 2, 560, 1400, 620, B(lt, .4)); withA(E(lt, .4), () => { txt('PROCRASTINATION', W / 2, 330, { size: 80, weight: 700, color: COL.max });
      wrap('voluntarily delaying something you intend to do, even though you expect to be worse off for the delay', W / 2, 560, 1180, 74, { size: 58, weight: 600 }); });
    source('Steel (2007), Psychological Bulletin', E(lt, at(0, .3)));
  }, () => {
    paperBg();
    [['VOLUNTARILY', "nobody's forcing you", COL.ivy, .08], ['INTEND', 'you want to do it', COL.sam, .3], ['WORSE OFF', "you know it'll cost you", COL.alex, .52]].forEach(([w, s, c, f], i) => { const x = 360 + i * 600, p = B(lt, at(1, f)); withA(E(lt, at(1, f), .3), () => { g.save(); scaleAt(x, 500, p);
      card(x, 500, 520, 480); g.fillStyle = c; rr(x - 260, 260, 520, 120, 28); g.fill(); g.fillRect(x - 260, 330, 520, 50); txt(w, x, 322, { size: 56, weight: 700, color: i === 1 ? COL.ink : '#fff' }); wrap(s, x, 540, 440, 60, { size: 46, font: 'Nunito', weight: 800 }); g.restore(); }); });
    withA(E(lt, at(1, .8)), () => { txt("that's what makes it so frustrating", W / 2, 900, { size: 54, weight: 700, color: COL.red }); });
  }, () => {
    paperBg('#ECE8F8'); txt("YOU'RE NOT ALONE", W / 2, 130, { size: 80, weight: 700 });
    [['80–95%', 'of college students procrastinate', COL.max, .25], ['15–20%', 'of adults do it chronically', COL.alex, .65]].forEach(([n, s, c, f], i) => { const x = 560 + i * 800, p = B(lt, at(2, f)); withA(E(lt, at(2, f), .3), () => { g.save(); scaleAt(x, 520, p); card(x, 520, 660, 520);
      txt(n, x, 440, { size: 150, weight: 700, color: c }); wrap(s, x, 620, 540, 56, { size: 44, font: 'Nunito', weight: 800 }); g.restore(); }); });
    for (let i = 0; i < 8; i++) ch({ x: 300 + i * 190, y: 1060, c: [COL.ivy, COL.sam, COL.alex, COL.max][i % 4], top: ['bun', 'tuft', 'hood', 'spike'][i % 4], s: .55, expr: 'nervous', sd: i, alpha: E(lt, L[2] + .4 + i * .05) });
    source('Estimates cited in Steel (2007)', E(lt, at(2, .3)));
  }, () => {
    paperBg('#F4E9D2'); txt('c. 700 B.C.', W / 2, 130, { size: 70, weight: 700, color: '#8C6A4E' });
    [380, 1540].forEach(x => { g.fillStyle = '#E8DCC4'; g.fillRect(x - 60, 260, 120, 640); g.fillStyle = '#D6C7A8'; for (let k = 0; k < 4; k++) g.fillRect(x - 50 + k * 28, 280, 10, 600); g.fillStyle = '#E8DCC4'; rr(x - 90, 230, 180, 50, 8); g.fill(); rr(x - 90, 890, 180, 40, 8); g.fill(); });
    const p = B(lt, at(3, .3)); g.save(); scaleAt(W / 2, 540, p); g.fillStyle = '#F7EED8'; rr(560, 320, 800, 420, 30); g.fill(); g.lineWidth = 6; g.strokeStyle = '#8C6A4E'; g.stroke();
    wrap('"Do not put your work off till tomorrow and the day after."', W / 2, 500, 680, 70, { size: 56, weight: 600, color: '#5A4130' }); txt('— Hesiod', W / 2 + 200, 680, { size: 40, font: 'Nunito', weight: 800, color: '#8C6A4E' }); g.restore();
    ch(P_(SAM, { x: W / 2, y: 1060, s: .8, expr: lt > at(3, .8) ? 'joy' : 'o' }));
    source('Hesiod, Works and Days', E(lt, at(3, .4)));
  }, () => {
    paperBg('#E2EFEB'); txt('DELAY ≠ PROCRASTINATION', W / 2, 130, { size: 76, weight: 700 });
    [['SMART DELAY', ['waiting for more info', 'something more urgent came up'], COL.ivy, .15, 1], ['PROCRASTINATION', ['needless delay', '...and you know it'], COL.alex, .6, 0]].forEach(([h, items, c, f, ok], i) => { const x = 560 + i * 800, p = B(lt, at(4, f)); withA(E(lt, at(4, f), .3), () => { g.save(); scaleAt(x, 560, p);
      card(x, 560, 680, 620); txt(h, x, 320, { size: 58, weight: 700, color: c }); items.forEach((s, k) => txt(s, x, 470 + k * 80, { size: 38, font: 'Nunito', weight: 800, maxW: 620 }));
      if (ok) check(x, 720, 2.4, E(lt, at(4, f) + .3, .4), COL.ivy); else cross(x, 720, 60, E(lt, at(4, f) + .3, .4)); g.restore(); }); });
    source('Pychyl (2013)', E(lt, at(4, .3)));
  }]);
};
S.feelings = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#EEF1F6'); chapter(2, "It's about feelings, not time", lt);
    ch(P_(SAM, { x: 520, y: 920, s: 1.4, expr: 'worried', look: 1 })); docPage(1300, 520, 1.3, 6);
    withA(E(lt, at(0, .5)), () => { cloud(1300, 260, 1.4, true); });
    pill('EMOTIONS', 1300, 860, { p: B(lt, at(0, .65)), bg: COL.ink, size: 54 });
    source('Sirois & Pychyl (2013); Pychyl (2013)', E(lt, at(0, .4)));
  }, () => {
    paperBg('#EEF1F6'); docPage(960, 500, 1.4, 6);
    const em = [['bored', COL.gray], ['anxious', COL.alex], ['confused', COL.max], ['afraid of doing it badly', COL.red]];
    em.forEach(([s, c], i) => { const an = -Math.PI / 2 + i / 4 * Math.PI * 2 + TT * .25; const x = 960 + Math.cos(an) * 480, y = 500 + Math.sin(an) * 280; pill(s, x, y, { p: B(lt, at(1, .15 + i * .14)), bg: c, size: 42 }); });
    withA(E(lt, at(1, .75)), () => { g.fillStyle = COL.green; rr(1500, 820, 300, 110, 16); g.fill(); txt('ESCAPE →', 1650, 877, { size: 52, weight: 700, color: '#fff' }); ch(P_(SAM, { x: lerp(420, 1300, E(lt, at(1, .8), 1.5)), y: 960, s: .9, expr: 'nervous', look: 1 })); });
  }, () => {
    paperBg('#EEF1F6');
    g.fillStyle = '#C9CED8'; rr(240, 300, 620, 380, 18); g.fill(); g.fillStyle = '#FFF'; rr(264, 324, 572, 332, 10); g.fill(); txt('|', 300, 380, { size: 50, alpha: Math.sin(TT * 8) > 0 ? 1 : 0 }); txt('blank document', 550, 730, { size: 40, weight: 700, color: COL.ink2 });
    phone(1300, 470, 1.8, { play: true, screen: COL.alex }); txt('a video', 1300, 730, { size: 40, weight: 700, color: COL.alex });
    const turn = E(lt, at(2, .3), .6); ch(P_(SAM, { x: 860, y: 1000, s: 1, expr: turn > .5 ? 'joy' : 'worried', look: lerp(-1, 1, turn) }));
    const r = E(lt, at(2, .35), 1.2); g.fillStyle = '#fff'; rr(1680, 260, 80, 560, 40); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke(); bar(1720, 800, 56, 520, COL.green, r); txt('relief', 1720, 870, { size: 38, weight: 700 });
  }, () => {
    paperBg('#F6E3DC'); txt('SHORT-TERM MOOD REPAIR', W / 2, 130, { size: 76, weight: 700 });
    withA(B(lt, at(3, .2)), () => { card(520, 560, 620, 560); txt('NOW', 520, 330, { size: 56, weight: 700, color: COL.green }); ch(P_(SAM, { x: 520, y: 650, s: .8, expr: 'joy' })); txt('bad feeling avoided ✓', 520, 720, { size: 40, font: 'Nunito', weight: 800 }); });
    arrowLine(860, 560, 1060, 560, E(lt, at(3, .5), .5), COL.ink, 10);
    withA(B(lt, at(3, .55)), () => { card(1400, 560, 620, 560); txt('LATER', 1400, 330, { size: 56, weight: 700, color: COL.red }); cloud(1400, 520, 1.5, true); txt('bigger problem', 1400, 760, { size: 40, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#EEF1F6'); txt('THE AVOIDANCE LOOP', W / 2, 110, { size: 76, weight: 700 });
    const nodes = [['task feels bad', COL.alex], ['avoid it', COL.max], ['relief!', COL.green], ['habit gets stronger', COL.ink2]]; const cx = 960, cy = 580, R = 320;
    const spin = (lt - L[4]) * .6;
    g.lineWidth = 10; g.strokeStyle = '#C9C3B8'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    g.strokeStyle = COL.ink; g.beginPath(); g.arc(cx, cy, R, spin, spin + 1.2); g.stroke();
    nodes.forEach(([s, c], i) => { const an = -Math.PI / 2 + i * Math.PI / 2; pill(s, cx + Math.cos(an) * R, cy + Math.sin(an) * R, { p: B(lt, at(4, .1 + i * .15)), bg: c, size: 44 }); });
    ch(P_(SAM, { x: cx, y: cy + 130, s: .9, expr: 'tired' }));
  }, () => {
    paperBg('#F7EDD3'); txt("TASKS WE PUT OFF", W / 2, 120, { size: 76, weight: 700 });
    ['boring', 'frustrating', 'difficult', 'unclear', 'unstructured', 'not rewarding', 'not meaningful'].forEach((s, i) => { const x = 380 + (i % 4) * 390 + (i >= 4 ? 195 : 0), y = 330 + Math.floor(i / 4) * 150; pill(s, x, y, { p: B(lt, at(5, .08 + i * .09)), bg: [COL.gray, COL.alex, COL.red, COL.max, COL.ivy, COL.ink2, COL.ink][i], size: 46 }); });
    ch(P_(SAM, { x: 960, y: 1000, s: 1.2, expr: lt > at(5, .85) ? 'joy' : 'nervous', hop: lt > at(5, .85) ? Math.abs(Math.sin(TT * 7)) * 10 : 0 }));
    withA(E(lt, at(5, .85)), () => txt('sound familiar?', 960, 650, { size: 60, weight: 700, color: COL.red }));
    source('Pychyl (2013), Solving the Procrastination Puzzle', E(lt, at(5, .3)));
  }]);
};
S.timeScene = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#E8EEF7'); chapter(3, "Why 'later' feels so easy", lt);
    clock(960, 480, 230, 8 + lt * 2); txt('INGREDIENT #2: TIME', W / 2, 860, { size: 70, weight: 700, alpha: B(lt, .6) });
  }, () => {
    paperBg('#E8EEF7'); g.fillStyle = '#B9D3A8'; g.fillRect(0, 420, W, 660); g.fillStyle = '#8C93A3'; g.beginPath(); g.moveTo(860, 420); g.lineTo(1060, 420); g.lineTo(1700, H); g.lineTo(220, H); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const t = i / 6, y = lerp(430, 1060, t * t), w = lerp(4, 30, t); g.fillRect(960 - w / 2, y, w, lerp(10, 60, t)); }
    trophy(960, 440, .35); trophy(1400, 940, 1.6);
    txt('far away: feels small', 960, 330, { size: 40, weight: 700, alpha: E(lt, at(1, .45)) }); txt('close: feels BIG', 1400, 640, { size: 48, weight: 700, color: COL.red, alpha: E(lt, at(1, .25)) });
    ch(P_(SAM, { x: 420, y: 1000, s: 1.1, expr: 'joy', look: 1 })); pill('temporal discounting', 960, 160, { p: B(lt, at(1, .7)), bg: COL.ink, size: 46 });
  }, () => {
    paperBg('#E8EEF7'); txt('MOTIVATION', W / 2, 250, { size: 90, weight: 700, color: COL.max, alpha: B(lt, at(2, .05)) });
    const top = [['CONFIDENCE', COL.ivy, .2], ['×', COL.ink, .3], ['VALUE', COL.sam, .35]], bot = [['IMPULSIVENESS', COL.alex, .6], ['×', COL.ink, .7], ['DELAY', COL.red, .8]];
    txt('=', W / 2, 360, { size: 80, weight: 700, alpha: E(lt, at(2, .15)) });
    top.forEach(([s, c, f], i) => txt(s, [620, 960, 1300][i], 500, { size: s === '×' ? 70 : 64, weight: 700, color: c, alpha: E(lt, at(2, f), .3) }));
    line(400, 590, 1520, 590, 10 * E(lt, at(2, .5), .3) + .01, COL.ink);
    bot.forEach(([s, c, f], i) => txt(s, [620, 960, 1300][i], 690, { size: s === '×' ? 70 : 64, weight: 700, color: c, alpha: E(lt, at(2, f), .3) }));
    txt('(simplified)', W / 2, 820, { size: 34, font: 'Nunito', weight: 700, color: COL.ink2, alpha: E(lt, at(2, .5)) });
    source("Steel & König (2006), Temporal Motivation Theory", E(lt, at(2, .3)));
  }, () => {
    paperBg('#E8EEF7'); txt('STRONGEST PREDICTORS', W / 2, 130, { size: 76, weight: 700 });
    [['task feels unpleasant', COL.alex], ['low confidence', COL.ivy], ['impulsiveness', COL.red], ['easily distracted', COL.max], ['far-away payoff', COL.ink2]].forEach(([s, c], i) => { const y = 290 + i * 130, p = B(lt, at(3, .2 + i * .14));
      withA(E(lt, at(3, .2 + i * .14), .3), () => { g.save(); scaleAt(760, y, p); g.fillStyle = c; rr(420, y - 46, 680, 92, 46); g.fill(); txt(s, 760, y + 2, { size: 46, weight: 600, color: '#fff' }); g.restore(); }); });
    ch(P_(SAM, { x: 1480, y: 960, s: 1.3, expr: 'nervous' })); source('Steel (2007), meta-analysis of 691 correlations', E(lt, at(3, .2)));
  }, () => {
    paperBg('#E8EEF7'); txt('MOTIVATION vs. DEADLINE', W / 2, 110, { size: 70, weight: 700 });
    const x0 = 260, x1 = 1660, yb = 880, f = d => 40 + 520 / (1 + d * 1.6); const xd = d => lerp(x0, x1, 1 - d / 21);
    line(x0, yb, x1, yb, 6, COL.ink); line(x0, yb, x0, 260, 6, COL.ink); txt('motivation', x0 + 10, 240, { size: 34, font: 'Nunito', weight: 800, align: 'left' });
    [21, 14, 7, 0].forEach(d => txt(d === 0 ? 'due!' : d + ' days', xd(d), yb + 44, { size: 32, weight: 600, color: d === 0 ? COL.red : COL.ink2 }));
    const p = E(lt, L[4] + .2, Le[4] - L[4]); const dNow = 21 * (1 - p);
    g.beginPath(); for (let d = 21; d >= dNow; d -= .05) g.lineTo(xd(d), yb - f(d)); g.lineWidth = 8; g.strokeStyle = COL.max; g.stroke();
    g.fillStyle = COL.red; g.beginPath(); g.arc(xd(dNow), yb - f(dNow), 16, 0, 7); g.fill();
    withA(E(lt, at(4, .75)), () => pill('the night before', xd(.6), yb - f(.6) - 70, { bg: COL.red, size: 40 }));
    ch(P_(SAM, { x: 1780, y: 1040, s: .7, expr: p > .8 ? 'scared' : 'calm', sweat: p > .8 }));
  }, () => {
    paperBg('#E8EEF7'); txt('SPACE OUT THE DEADLINES', W / 2, 130, { size: 76, weight: 700 });
    [['ONE FINAL DEADLINE', [1], .15, COL.alex], ['EVENLY SPACED DEADLINES', [.33, .66, 1], .45, COL.ivy]].forEach(([h, fl, f, c], i) => { const y = 380 + i * 330, p = E(lt, at(5, f), .6); withA(p, () => {
      txt(h, 300, y - 80, { size: 44, weight: 700, color: c, align: 'left' }); line(300, y + 40, 1500, y + 40, 8, COL.ink);
      fl.forEach((k, j) => { const x = lerp(300, 1500, k); line(x, y + 40, x, y - 40, 6, COL.ink); g.fillStyle = c; g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x + 60, y - 20); g.lineTo(x, y); g.fill(); }); }); });
    withA(E(lt, at(5, .75)), () => { trophy(1700, 800, .9); pill('better grades', 1700, 600, { bg: COL.ivy, size: 40 }); });
    source('Ariely & Wertenbroch (2002)', E(lt, at(5, .4)));
  }]);
};
S.future = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6], [() => {
    paperBg('#F7EDD3'); chapter(4, 'Meet Future Sam', lt);
    ch(P_(SAM, { x: 560, y: 900, s: 1.3, expr: 'smile', look: 1 })); pill('Sam', 560, 500, { bg: COL.sam, color: COL.ink, size: 44 });
    withA(B(lt, at(0, .5)), () => { futureSam(1360, 900, 1.3, { expr: 'joy', arms: 'wave', look: -1 }); pill('Future Sam', 1360, 500, { bg: COL.ink2, size: 44 }); });
    arrowLine(760, 960, 1160, 960, E(lt, .5, 1), COL.ink2, 6); txt('time', 960, 1010, { size: 34, font: 'Nunito', weight: 800, color: COL.ink2 });
  }, () => {
    paperBg('#F7EDD3');
    const hand = E(lt, at(1, .15), 1.5); ch(P_(SAM, { x: 520, y: 900, s: 1.3, expr: hand > .5 ? 'joy' : 'smile', look: 1 })); futureSam(1400, 900, 1.3, { expr: hand > .8 ? 'worried' : 'smile', look: -1, sweat: hand > .8 });
    const bx = lerp(700, 1200, hand), by = 620 - Math.sin(hand * Math.PI) * 180; g.fillStyle = '#B0805A'; rr(bx - 90, by - 70, 180, 140, 12); g.fill(); txt('ESSAY', bx, by, { size: 40, weight: 700, color: '#fff' });
    withA(E(lt, at(1, .6)), () => { thought(1400, 330, 420, 110); txt('...who is this guy?', 1400, 332, { size: 36, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#F7EDD3'); txt('PROMISES FOR LATER', W / 2, 120, { size: 72, weight: 700 });
    ch(P_(SAM, { x: 520, y: 920, s: 1.3, expr: 'joy', arms: 'up' })); withA(E(lt, at(2, .1)), () => { bubble(560, 420, 600, 140, 'bl'); txt('"Tomorrow: 6 a.m. gym!"', 560, 422, { size: 44, weight: 700 }); });
    withA(E(lt, at(2, .55)), () => { futureSam(1420, 920, 1.3, { expr: 'tired', look: -1 }); clock(1420, 360, 90, 6); txt('who agreed to this?', 1420, 520, { size: 40, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#EDEAF4'); txt('WHAT WILL YOU WATCH?', W / 2, 120, { size: 72, weight: 700 });
    [['LATER', 'serious documentary', COL.ink2, .2], ['RIGHT NOW', 'light comedy', COL.sam, .55]].forEach(([h, s, c, f], i) => { const x = 560 + i * 800, p = B(lt, at(3, f)); withA(E(lt, at(3, f), .3), () => { g.save(); scaleAt(x, 560, p); card(x, 560, 660, 620);
      txt(h, x, 300, { size: 56, weight: 700, color: c }); g.fillStyle = COL.ink; rr(x - 200, 360, 400, 250, 16); g.fill(); g.fillStyle = i ? '#FFE07A' : '#5C6178'; rr(x - 184, 376, 368, 218, 10); g.fill();
      txt(i ? 'HA HA' : '📚', x, 486, { size: 64, weight: 700, color: i ? COL.alex : '#fff' }); txt(s, x, 700, { size: 44, font: 'Nunito', weight: 800 }); g.restore(); }); });
    source('Read, Loewenstein & Kalyanaraman (1999)', E(lt, at(3, .3)));
  }, () => {
    paperBg('#EEF1F6'); txt('BRAIN ACTIVITY', W / 2, 120, { size: 72, weight: 700 });
    [['thinking about\nFUTURE YOU', .15, 420], ['thinking about\nANOTHER PERSON', .45, 1500]].forEach(([s, f, x], i) => { const p = B(lt, at(4, f)); withA(E(lt, at(4, f), .3), () => { g.save(); scaleAt(x, 500, p); brainChar(x, 470, .9, { amyg: 0, hippo: 0, expr: 'smile' });
      s.split('\n').forEach((l, k) => txt(l, x, 760 + k * 56, { size: 44, weight: 700 })); g.restore(); }); });
    withA(E(lt, at(4, .65)), () => { txt('≈', 960, 470, { size: 200, weight: 700, color: COL.max }); pill('in some ways', 960, 650, { bg: COL.max, size: 42 }); });
    source('Ersner-Hershfield, Wimmer & Knutson (2009)', E(lt, at(4, .4)));
  }, () => {
    paperBg('#EEF1F6'); txt('FUTURE YOU = STRANGER?', W / 2, 120, { size: 72, weight: 700 });
    ch(P_(SAM, { x: 520, y: 900, s: 1.3, expr: 'joy', arms: 'up' })); for (let i = 0; i < 6; i++) { const a = (lt * .8 + i * .3) % 1.6; withA(clamp(1 - a / 1.6), () => { g.fillStyle = '#F2B84B'; g.beginPath(); g.arc(700 + a * 300 + i * 20, 600 - a * 160 + Math.sin(i) * 30, 26, 0, 7); g.fill(); txt('$', 700 + a * 300 + i * 20, 602 - a * 160 + Math.sin(i) * 30, { size: 30, weight: 700, color: '#8A5A00' }); }); }
    futureSam(1400, 900, 1.2, { expr: 'sad', look: -1, gray: .3 }); g.fillStyle = '#E8A0B4'; ell(1680, 820, 110, 80); g.fill(); ell(1780, 810, 26, 22); g.fill(); g.beginPath(); g.moveTo(1620, 760); g.lineTo(1640, 720); g.lineTo(1660, 760); g.fill(); g.fillStyle = COL.ink; g.beginPath(); g.arc(1730, 790, 6, 0, 7); g.fill(); g.fillRect(1660, 742, 40, 8); txt('empty', 1680, 830, { size: 32, weight: 700 });
    pill('the least patient with money', W / 2, 980, { p: B(lt, at(5, .5)), bg: COL.ink, size: 40 });
  }, () => {
    paperBg('#E2EFEB'); txt('MEET YOUR FUTURE SELF', W / 2, 120, { size: 72, weight: 700, color: COL.ivy });
    g.fillStyle = '#8C6A4E'; rr(380, 240, 460, 680, 220); g.fill(); g.fillStyle = '#CFE6F0'; rr(410, 270, 400, 620, 200); g.fill();
    g.save(); rr(410, 270, 400, 620, 200); g.clip(); const age = E(lt, at(6, .2), 1.2); if (age < .5) ch(P_(SAM, { x: 610, y: 980, s: 1.6, expr: 'o' })); else futureSam(610, 980, 1.6, { expr: 'smile' }); g.restore();
    const jar = E(lt, at(6, .45), 1.6); g.fillStyle = 'rgba(200,230,255,.6)'; rr(1240, 380, 320, 460, 40); g.fill(); g.lineWidth = 8; g.strokeStyle = COL.ink; g.stroke(); bar(1400, 830, 290, 420, '#F2B84B', .25 + .6 * jar);
    txt('retirement savings ↑', 1400, 910, { size: 44, weight: 700, alpha: E(lt, at(6, .45)) });
    source('Hershfield et al. (2011), age-progressed renderings', E(lt, at(6, .3)));
  }]);
};
S.myths3 = (lt, L, Le, D, at) => {
  paperBg('#EDEAF4'); chapter(5, '3 myths', lt);
  const M = [['Procrastinators are just lazy', 'FALSE', COL.ivy, COL.red], ['Procrastinators are perfectionists', 'WEAK LINK', COL.sam, '#C9752B'], ['"I work better under pressure"', 'USUALLY NOT', COL.alex, COL.red]];
  if (lt < L[1] + .3) { txt('MYTHS', W / 2, 300, { size: 140, weight: 700, alpha: B(lt, .3) * (1 - E(lt, L[1], .3)) }); [0, 1, 2].forEach(i => { withA(B(lt, .6 + i * .2) * (1 - E(lt, L[1], .3)), () => { g.save(); g.translate(560 + i * 400, 700); g.rotate((i - 1) * .08); card(0, 0, 300, 380, 1, M[i][2]); txt('?', 0, 0, { size: 160, weight: 700, color: COL.white }); g.restore(); }); }); }
  M.forEach(([m, st, c, sc], i) => { const t0 = L[i + 1], t1 = Le[i + 1]; const p = E(lt, t0 - .1, .5) * (1 - E(lt, t1 + .2, .4)); if (p <= 0) return;
    g.save(); g.translate(lerp(-1200, 0, p), 0); card(W / 2, 560, 1300, 640, 1); g.fillStyle = c; rr(W / 2 - 650, 240, 1300, 110, 28); g.fill(); g.fillRect(W / 2 - 650, 300, 1300, 50);
    txt('MYTH #' + (i + 1), W / 2, 296, { size: 60, weight: 700, color: i === 1 ? COL.ink : COL.white }); wrap(m, W / 2, 500, 1100, 90, { size: 76, weight: 600 });
    stamp(st, W / 2 + 300, 720, E(lt, at(i + 1, i === 2 ? .25 : .4), .35), sc, -.12, st.length > 6 ? 76 : 96);
    if (i === 2) withA(E(lt, at(3, .6)), () => { txt('+ small links to stress, anxiety & poor sleep', W / 2, 850, { size: 34, font: 'Nunito', weight: 800, color: COL.ink2 }); });
    g.restore(); });
  if (lt > L[2]) source(lt > L[3] ? 'Steel (2007); Johansson et al. (2023), JAMA Network Open' : 'Steel (2007), meta-analysis', 1);
};
S.helps3 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6, 7], [() => {
    paperBg('#E2EFEB'); chapter(6, 'What actually helps', lt); txt('WHAT ACTUALLY HELPS', W / 2, 380, { size: 100, weight: 700, alpha: B(lt, .3) });
    [1, 2, 3, 4, 5, 6].forEach(i => { const p = B(lt, .8 + i * .2); g.fillStyle = COL.ivy; g.beginPath(); g.arc(295 + i * 190, 620, 64 * p, 0, 7); g.fill(); txt(String(i), 295 + i * 190, 624, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#F6E3DC'); tipTag(1, 'Forgive yourself');
    ch(P_(SAM, { x: 420, y: 920, s: 1.5, expr: lt > at(1, .3) ? 'smile' : 'sad', arms: 'hug' })); heart(420, 420, 3 * B(lt, at(1, .3)));
    withA(E(lt, at(1, .08)), () => { bubble(1150, 330, 760, 130, 'bl'); txt('"I\'m hopeless."', 1150, 332, { size: 54, weight: 700 }); strike(1150, 332, 440, E(lt, at(1, .25), .4)); });
    withA(E(lt, at(1, .3)), () => { bubble(1150, 580, 900, 150, 'bl', 1, '#FFF7DC'); txt('"It happened. Let\'s start now."', 1150, 582, { size: 52, weight: 700, color: dark(COL.sam, .3) }); });
    withA(E(lt, at(1, .65)), () => { pill('less procrastination next time', 1150, 820, { bg: COL.ivy, size: 42 }); });
    source('Wohl, Pychyl & Bennett (2010)', E(lt, at(1, .2)));
  }, () => {
    paperBg('#F7EDD3'); tipTag(2, 'Make the first step tiny');
    g.fillStyle = '#C9C3B8'; rr(260, 420, 520, 520, 20); g.fill(); txt('"write the essay"', 520, 380, { size: 44, weight: 700, color: COL.ink2 }); ch(P_(SAM, { x: 520, y: 1000, s: .8, expr: 'scared' })); cross(520, 680, 150, E(lt, at(2, .25), .5));
    g.fillStyle = COL.green; rr(1140, 840, 460, 100, 16); g.fill(); txt('"write ONE sentence"', 1370, 560, { size: 44, weight: 700, color: COL.green, alpha: E(lt, at(2, .3)) });
    ch(P_(SAM, { x: 1370, y: 840, s: .9, expr: 'joy', alpha: E(lt, at(2, .3)) })); docPage(1700, 600, .8, 1 + E(lt, at(2, .5), 2), { title: 'ESSAY' });
  }, () => {
    paperBg('#E8EEF7'); tipTag(3, 'Use if-then plans');
    card(W / 2, 520, 1300, 420, B(lt, at(3, .05))); withA(E(lt, at(3, .05)), () => { txt('IF', 520, 420, { size: 90, weight: 700, color: COL.max }); txt("it's 7 p.m.,", 960, 420, { size: 64, weight: 600 });
      txt('THEN', 540, 610, { size: 90, weight: 700, color: COL.ivy, alpha: E(lt, at(3, .3)) }); txt('I write for 20 minutes', 1080, 610, { size: 64, weight: 600, alpha: E(lt, at(3, .3)) }); });
    clock(1600, 420, 70, 7); pill('noticeably more likely to reach goals', W / 2, 860, { p: B(lt, at(3, .7)), bg: COL.ink, size: 40 });
    source('Gollwitzer & Sheeran (2006), meta-analysis', E(lt, at(3, .6)));
  }, () => {
    paperBg('#EDEAF4'); tipTag(4, 'Make the escape harder');
    g.fillStyle = '#8C5A3C'; g.fillRect(1500, 300, 260, 600); txt('KITCHEN', 1630, 260, { size: 44, weight: 700 });
    const f = E(lt, at(4, .1), 1.2); g.save(); g.translate(lerp(560, 1630, f), 560 - Math.sin(f * Math.PI) * 260); g.rotate(f * 8); phone(0, 0, 1.1, {}); g.restore();
    ch(P_(SAM, { x: 520, y: 940, s: 1.3, expr: f > .9 ? 'determined' : 'smile', arms: f < .3 ? 'up' : 'down' }));
    [0, 1, 2].forEach(i => { const p = E(lt, at(4, .45 + i * .1), .3); withA(1 - p, () => { g.fillStyle = '#C9CED8'; rr(780 + i * 210, 250, 190, 60, 12); g.fill(); txt('tab ' + (i + 1) + '  ×', 875 + i * 210, 282, { size: 30, weight: 600 }); }); });
  }, () => {
    paperBg('#F7EDD3'); tipTag(5, 'Get to know Future You');
    ch(P_(SAM, { x: 420, y: 920, s: 1.3, expr: 'smile', look: 1 }));
    const f = E(lt, at(5, .45), 1.4); g.save(); g.translate(lerp(640, 1230, f), 560 - Math.sin(f * Math.PI) * 120); g.fillStyle = COL.white; rr(-110, -70, 220, 140, 10); g.fill(); g.lineWidth = 5; g.strokeStyle = COL.ink; g.stroke();
    g.beginPath(); g.moveTo(-110, -70); g.lineTo(0, 10); g.lineTo(110, -70); g.stroke(); heart(0, 30, 1, COL.red); g.restore();
    futureSam(1450, 920, 1.3, { expr: f > .9 ? 'joy' : 'smile', look: -1, arms: f > .9 ? 'wave' : 'down' });
    withA(E(lt, at(5, .2)), () => { thought(1450, 330, 460, 110); txt('picture them in detail', 1450, 332, { size: 36, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#EDEAF4'); tipTag(6, 'Temptation bundling');
    g.fillStyle = '#9AA3B5'; rr(1100, 760, 520, 60, 20); g.fill(); g.fillStyle = COL.ink; [1180, 1540].forEach(x => { g.beginPath(); g.arc(x, 860, 46, 0, 7); g.fill(); });
    ch(P_(SAM, { x: 1360, y: 760, s: 1.2, expr: 'joy', hop: Math.abs(Math.sin(TT * 8)) * 12 }));
    g.strokeStyle = COL.ink; g.lineWidth = 10; g.beginPath(); g.arc(1360, 760 - 1.2 * 200, 90, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.fillStyle = COL.max; ell(1272, 760 - 1.2 * 170, 22, 32); g.fill(); ell(1448, 760 - 1.2 * 170, 22, 32); g.fill();
    for (let i = 0; i < 3; i++) { const a = (TT * .7 + i * .33) % 1; note(1500 + a * 120, 420 - a * 160, 1, clamp(1 - a)); }
    withA(E(lt, at(6, .1)), () => { card(560, 480, 720, 420); txt('favorite audiobook', 560, 380, { size: 50, weight: 700, color: COL.max }); txt('+', 560, 470, { size: 70, weight: 700 }); txt('the gym', 560, 560, { size: 50, weight: 700, color: COL.ivy }); });
    pill('more gym visits', 560, 760, { p: B(lt, at(6, .6)), bg: COL.ivy, size: 44 });
    source('Milkman, Minson & Volpp (2014)', E(lt, at(6, .3)));
  }, () => {
    paperBg('#E2EFEB');
    card(W / 2, 520, 1300, 560, B(lt, L[7] + .2)); withA(E(lt, L[7] + .2), () => { txt('When to get help', W / 2, 310, { size: 70, weight: 700, color: COL.ivy });
      ['constant procrastination', 'seriously affecting your life', 'can be linked to ADHD or depression'].forEach((s, i) => { const t0 = at(7, .1 + i * .14); check(600, 430 + i * 100, 1.3, E(lt, t0, .4), COL.ivy); txt(s, 670, 432 + i * 100, { size: 46, font: 'Nunito', weight: 800, align: 'left', alpha: E(lt, t0, .4) }); });
      pill('a professional can help: CBT reduces procrastination', W / 2, 740, { p: B(lt, at(7, .65)), bg: COL.ivy, size: 38 }); });
  }]);
};
S.outro3 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 3, 4], [() => {
    deskRoom({ time: 11 });
    const ph = E(lt, at(1, .35), 1); ch(P_(SAM, { x: 1340, y: 960, s: 1.45, look: -1, expr: lt > at(1, .1) ? 'calm' : 'smile' })); desk();
    heart(1340, 470, 2 * B(lt, at(1, .08)) * (1 - E(lt, at(1, .4), .3)));
    if (ph < 1) { g.save(); g.translate(lerp(1300, 2100, ph), 720 - Math.sin(ph * Math.PI) * 300); g.rotate(ph * 6); phone(0, 0, .6, {}); g.restore(); }
    const lines = E(lt, at(1, .75), .8) + (lt > L[2] ? (lt - L[2]) * 3 : 0);
    g.save(); g.fillStyle = '#F5F6FA'; rr(840, 578, 340, 182, 8); g.fill(); for (let i = 0; i < Math.min(6, Math.floor(lines)); i++) line(860, 600 + i * 26, 1150 - (i % 3) * 40, 600 + i * 26, 6, '#7A8295'); g.restore();
    withA(E(lt, L[2] + .5), () => { futureSam(1740, 960, 1, { expr: 'joy', arms: 'wave', look: -1 }); bubble(1700, 560, 260, 90, 'br'); txt('thanks!', 1700, 562, { size: 40, weight: 700 }); });
  }, () => {
    paperBg(); txt("What have you been putting off?", W / 2, 200, { size: 76, weight: 700, alpha: B(lt, L[3]) });
    bubble(W / 2, 460, 900, 180, 'bl', B(lt, at(3, .2))); txt('write it in the comments ↓', W / 2, 462, { size: 56, font: 'Nunito', weight: 800, alpha: E(lt, at(3, .2)) });
    withA(E(lt, at(3, .6)), () => pill('then take ONE tiny step', W / 2, 640, { bg: COL.ivy, size: 46 }));
    [[IVY, 560], [SAM, 820], [ALEX, 1100], [MAX, 1360]].forEach(([c, x], i) => ch(P_(c, { x, y: 1000, s: .95, expr: 'joy', arms: i % 2 ? 'wave' : 'up' })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); txt('Thanks for watching!', W / 2, 330, { size: 110, weight: 700, color: COL.white }); txt('See you in the next one.', W / 2, 450, { size: 52, font: 'Nunito', weight: 800, color: COL.sam });
    [[IVY, 480], [SAM, 720], [ALEX, 960], [MAX, 1200]].forEach(([c, x]) => ch(P_(c, { x, y: 960, s: 1.05, expr: 'joy', arms: 'wave' }))); futureSam(1440, 960, 1.05, { expr: 'joy', arms: 'wave' });
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  deskRoom({ time: 11.9, panic: .5, clock: false }); g.fillStyle = 'rgba(15,18,40,.25)'; g.fillRect(0, 0, W, H); const band = g.createLinearGradient(0, 0, 0, 330); band.addColorStop(0, 'rgba(20,16,36,.95)'); band.addColorStop(1, 'rgba(20,16,36,0)'); g.fillStyle = band; g.fillRect(0, 0, W, 330);
  ch(P_(SAM, { x: 600, y: 1340, s: 2.8, expr: 'scared', sweat: true })); phone(1000, 830, 1.6, { play: true, screen: COL.alex });
  docPage(1480, 640, 1.5, 0, { title: 'ESSAY' }); g.save(); g.translate(1480, 600); g.rotate(-.15); txt('DUE TOMORROW', 0, 0, { size: 46, weight: 700, color: COL.red }); g.restore(); txt('0 words', 1480, 760, { size: 44, weight: 700, color: COL.ink2 });
  g.save(); g.translate(W / 2, 140); g.rotate(-.02); g.font = '700 140px Fredoka'; const a = "IT'S NOT ", b = 'LAZINESS'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 140, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 140, weight: 700, color: COL.sam, align: 'left' }); g.restore();
  finish(); };
