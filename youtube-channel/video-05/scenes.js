// Video 05 scenes: "Why You Can Feel Lonely in a Crowd". Uses engine/core.js helpers.

// ---------- helpers for this video
function desat(k, hole) { if (k <= 0) return; g.save(); if (hole) { g.beginPath(); g.rect(-W, -H, 3 * W, 3 * H); g.roundRect(hole[0] - hole[2], hole[1] - hole[3], hole[2] * 2, hole[3] * 2, hole[2]); g.clip('evenodd'); } g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${k})`; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.fillStyle = `rgba(30,32,50,${.35 * k})`; g.fillRect(0, 0, W, H); g.restore(); }
function diningRoom() {
  const wall = g.createLinearGradient(0, 0, 0, 800); wall.addColorStop(0, '#7A3E3E'); wall.addColorStop(1, '#94554A'); g.fillStyle = wall; g.fillRect(0, 0, W, 800);
  g.fillStyle = '#1E2547'; rr(1460, 110, 340, 360, 12); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const x = 1470 + (i * 53) % 320, y = 120 + ((i * 37 + TT * 40) % 340); g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  g.lineWidth = 14; g.strokeStyle = '#4A2A2A'; rr(1460, 110, 340, 360, 12); g.stroke(); line(1630, 110, 1630, 470, 10, '#4A2A2A');
  g.strokeStyle = '#2E6B3F'; g.lineWidth = 22; g.beginPath(); g.moveTo(0, 60); for (let x = 0; x <= 1400; x += 20) g.lineTo(x, 60 + Math.sin(x / 1400 * Math.PI * 3) * 30 + 30); g.stroke();
  for (let i = 0; i < 18; i++) { const x = i * 80 + 30, y = 90 + Math.sin(x / 1400 * Math.PI * 3) * 30, c = ['#FFD166', '#EF476F', '#06D6A0'][i % 3], tw = .6 + .4 * Math.sin(TT * 3 + i);
    const gl = g.createRadialGradient(x, y, 2, x, y, 28); gl.addColorStop(0, c); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = .6 * tw; g.fillStyle = gl; g.fillRect(x - 28, y - 28, 56, 56); g.globalAlpha = 1; g.fillStyle = c; ell(x, y + 6, 8, 11); g.fill(); }
  const lg = g.createRadialGradient(900, 500, 40, 900, 560, 800); lg.addColorStop(0, 'rgba(255,214,150,.35)'); lg.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#4A2A2A'; g.fillRect(0, 800, W, 280);
}
function table() { g.fillStyle = '#F4EDE1'; rr(220, 720, 1440, 80, 20); g.fill(); g.fillStyle = '#E5DACA'; g.fillRect(240, 790, 1400, 220); g.fillStyle = '#C9BBA6'; g.fillRect(240, 790, 1400, 14);
  [[420, '#E9A84B'], [760, '#C8553D'], [1120, '#6B8F3A'], [1460, '#F2D27A']].forEach(([x, c]) => { g.fillStyle = '#fff'; ell(x, 724, 80, 18); g.fill(); g.fillStyle = c; ell(x, 712, 52, 22); g.fill(); });
  g.fillStyle = '#C0392B'; [460, 1250, 1660].forEach((cx, i) => { rr(cx, 640, 16, 80, 6); g.fill(); g.fillStyle = '#FFD166'; ell(cx + 8, 628 + Math.sin(TT * 9 + i) * 2, 8, 14); g.fill(); g.fillStyle = '#C0392B'; }); }
const FAMILY = [[340, 0, 'joy'], [560, 2, 'smile'], [1360, 4, 'joy'], [1560, 6, 'smile']];
function family(lt, o = {}) { FAMILY.forEach(([x, ci, e], i) => ch({ x, y: 790, c: EX[ci], s: .9, expr: o.expr || e, sd: i, look: x < 960 ? 1 : -1, arms: i % 2 ? 'cup' : 'down' })); ch(P_(IVY, { x: 780, y: 790, s: .9, expr: o.expr || 'joy', look: 1 })); ch(P_(SAM, { x: 1150, y: 790, s: .9, expr: o.expr || 'joy', look: -1 })); }
function phone5(x, y, s, buzz = 0) { g.save(); g.translate(x + Math.sin(TT * 60) * 3 * buzz, y); g.scale(s, s); g.fillStyle = COL.ink; rr(-50, -90, 100, 180, 18); g.fill(); g.fillStyle = '#5B8DEF'; rr(-40, -72, 80, 140, 8); g.fill(); g.restore();
  if (buzz) { g.strokeStyle = COL.ink; g.lineWidth = 4; [-1, 1].forEach(k => { for (let i = 1; i < 3; i++) { g.beginPath(); g.arc(x, y, 70 * s + i * 14, k > 0 ? -.5 : Math.PI - .5, k > 0 ? .5 : Math.PI + .5); g.stroke(); } }); } }
function campfire(x, y, s) { for (let i = 0; i < 3; i++) { const k = Math.sin(TT * 9 + i * 2) * 8; g.fillStyle = ['#FF7B2E', '#FFB13B', '#FFE07A'][i]; g.beginPath(); g.moveTo(x - 60 * s + i * 20 * s, y); g.quadraticCurveTo(x - 40 * s + i * 10 * s + k, y - (90 - i * 25) * s, x + k * .5, y - (160 - i * 45) * s); g.quadraticCurveTo(x + 40 * s - i * 10 * s - k, y - (90 - i * 25) * s, x + 60 * s - i * 20 * s, y); g.fill(); }
  g.fillStyle = '#6B4B33'; rr(x - 80 * s, y - 14, 160 * s, 22, 10); g.fill(); }
function heading(s, y = 120, c = COL.ink, size = 76) { txt(s, W / 2, y, { size, weight: 700, color: c }); }
function tipTag5(n, s) { g.fillStyle = COL.ink; rr(60, 60, 120 + s.length * 26, 80, 40); g.fill(); g.fillStyle = COL.sam; g.beginPath(); g.arc(100, 100, 28, 0, 7); g.fill(); txt(String(n), 100, 102, { size: 36, weight: 700 }); txt(s, 145, 102, { size: 40, color: '#fff', align: 'left' }); }
function msg(x, y, w, text, mine, a = 1) { withA(a, () => { g.fillStyle = mine ? '#5B8DEF' : '#fff'; rr(x - w / 2, y - 36, w, 72, 30); g.fill(); if (!mine) { g.lineWidth = 4; g.strokeStyle = '#D0D4DE'; g.stroke(); } txt(text, x, y + 2, { size: 34, font: 'Nunito', weight: 800, color: mine ? '#fff' : COL.ink }); }); }

// ---------- scenes
S.dinnerOpen = (lt, L, Le, D, at) => {
  const gray = E(lt, at(2, .1), 1.6);
  g.save(); camera([[0, 960, 540, 1], [L[1] - .2, 960, 540, 1], [L[1] + .6, 960, 560, 1.25], [L[2] + .2, 960, 560, 1.25], [L[2] + 1.6, 960, 600, 1.55], [D, 960, 600, 1.6]], lt);
  diningRoom(); family(lt); ch(P_(MAX, { x: 960, y: 790, s: .95, expr: gray > .4 ? 'sad' : lt > L[1] ? 'smile' : 'joy' })); table();
  if (lt < L[2]) { const px = lerp(420, 1460, clamp((lt - .5) / 6)); g.fillStyle = '#E9A84B'; ell(px, 700, 50, 22); g.fill(); }
  if (lt < at(2, .3)) for (let i = 0; i < 4; i++) { const a = (lt * .8 + i * .3) % 1.4; withA(clamp(1 - a / 1.4), () => txt(['HA HA', 'haha!', 'more gravy?', 'HA!'][i], [340, 560, 1360, 1560][i], 480 - a * 100, { size: 40, weight: 700, color: '#FFE7B0' })); }
  desat(gray, [960, 660, 58, 112]);
  g.restore();
  g.save(); camera([[0, 960, 540, 1], [L[1] - .2, 960, 540, 1], [L[1] + .6, 960, 560, 1.25], [L[2] + .2, 960, 560, 1.25], [L[2] + 1.6, 960, 600, 1.55], [D, 960, 600, 1.6]], lt);
  if (gray > 0) { const sp = g.createRadialGradient(960, 600, 30, 960, 600, 260); sp.addColorStop(0, `rgba(160,140,255,${.25 * gray})`); sp.addColorStop(1, 'rgba(160,140,255,0)'); g.fillStyle = sp; g.fillRect(600, 300, 720, 600); }
  if (lt > L[1] && lt < L[2] + 1) withA(E(lt, L[1], .4) * (1 - E(lt, L[2] + .3, .5)), () => { phone5(1070, 640, .45, 1); pill('842 followers', 1090, 520, { bg: COL.max, size: 30 }); pill('group chat +99', 1090, 470, { bg: COL.red, size: 26 }); });
  if (gray > .5) withA(E(lt, at(2, .5), .6), () => { thought(1090, 470, 120, 70); txt('...', 1090, 466, { size: 40, weight: 700 }); });
  g.restore();
  withA(E(lt, at(3, .5)), () => { card(W / 2, 140, 820, 120); txt("you're not broken", W / 2, 142, { size: 56, weight: 700, color: COL.max }); });
};
S.title5 = (lt, L, Le, D, at) => {
  g.fillStyle = '#1B2140'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { const x = (i * 263) % W, y = ((i * 131) + TT * 50 * (1 + i % 3)) % H; g.globalAlpha = .6; g.beginPath(); g.arc(x, y, 2 + i % 3, 0, 7); g.fill(); } g.globalAlpha = 1;
  [['LONELY', COL.white, 260, 150], ['IN A CROWD', COL.max, 410, 130]].forEach(([s, c, y, sz], i) => { const p = B(lt, .2 + i * .5, .5); g.save(); g.translate(W / 2, y); g.scale(p, p); txt(s, 0, 0, { size: sz, weight: 700, color: c }); g.restore(); });
  for (let i = 0; i < 10; i++) { if (i === 5) continue; const x = 160 + i * 180; ch({ x, y: 1040, c: '#4A5175', s: .9, expr: 'smile', sd: i, alpha: E(lt, 1 + i * .05) }); }
  const sp = g.createRadialGradient(1060, 900, 30, 1060, 900, 260); sp.addColorStop(0, 'rgba(160,140,255,.35)'); sp.addColorStop(1, 'rgba(160,140,255,0)'); g.fillStyle = sp; g.fillRect(760, 600, 600, 480);
  ch(P_(MAX, { x: 1060, y: 1040, s: .95, expr: 'sad', alpha: E(lt, 1.4) }));
};
S.gap = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#ECE8F8'); chapter(1, 'Lonely is not the same as alone', lt);
    [['ALONE', 'a situation', COL.ivy, .15], ['LONELY', 'a feeling', COL.max, .5]].forEach(([h, s, c, f], i) => { const x = 560 + i * 800, p = B(lt, at(0, f)); withA(E(lt, at(0, f), .3), () => { g.save(); scaleAt(x, 580, p);
      card(x, 580, 640, 640); txt(h, x, 330, { size: 76, weight: 700, color: c }); txt(s, x, 410, { size: 44, font: 'Nunito', weight: 800 });
      if (i === 0) ch(P_(IVY, { x, y: 820, s: 1.1, expr: 'calm', arms: 'book' })); else { ch(P_(MAX, { x, y: 820, s: 1.1, expr: 'sad' })); cloud(x + 150, 520, .5, false); } g.restore(); }); });
  }, () => {
    paperBg('#ECE8F8'); heading('LONELINESS = A GAP');
    const base = 860; bar(700, base, 260, 560, COL.ivy, .9 * E(lt, at(1, .4), .8)); bar(1100, base, 260, 560, COL.max, .35 * E(lt, at(1, .6), .8)); line(480, base, 1320, base, 8, COL.ink);
    wrap('connection you want', 700, base + 70, 300, 46, { size: 38, weight: 700 }); wrap('connection you feel', 1100, base + 70, 300, 46, { size: 38, weight: 700 });
    const gp = E(lt, at(1, .75), .6); if (gp > 0) { g.setLineDash([12, 10]); line(1100, base - 560 * .9, 1100, base - 560 * .35, 6, COL.red); g.setLineDash([]); line(1080, base - 560 * .9, 1120, base - 560 * .9, 6, COL.red); pill('the gap = loneliness', 1500, base - 560 * .62, { p: B(gp, 0, 1), bg: COL.red, size: 42 }); }
    source('Peplau & Perlman (1982)', E(lt, at(1, .3)));
  }, () => {
    paperBg('#ECE8F8');
    withA(E(lt, at(2, .05)), () => { card(520, 560, 720, 720, 1, '#E2EFEB'); txt('lives alone', 520, 260, { size: 50, weight: 700 }); ch(P_(IVY, { x: 520, y: 820, s: 1.1, expr: 'joy' })); pill('friends twice a month', 520, 360, { bg: COL.ivy, size: 36 }); check(520, 480, 2.2, E(lt, at(2, .3), .4), COL.ivy); txt('content', 520, 900, { size: 44, font: 'Nunito', weight: 800, color: COL.ivy }); });
    withA(E(lt, at(2, .5)), () => { card(1400, 560, 720, 720, 1, '#E3E4EE'); txt('surrounded all day', 1400, 260, { size: 50, weight: 700 }); [-200, -100, 100, 200].forEach((d, k) => ch({ x: 1400 + d, y: 760, c: '#9AA0AE', s: .6, sd: k, expr: 'smile' })); ch(P_(MAX, { x: 1400, y: 820, s: 1, expr: 'sad' })); txt('lonely', 1400, 900, { size: 44, font: 'Nunito', weight: 800, color: COL.max }); });
  }, () => {
    paperBg('#ECE8F8'); ch(P_(MAX, { x: 960, y: 960, s: 1.4, expr: lt > at(3, .55) ? 'smile' : 'neutral' })); heart(960, 470, 3 * B(lt, at(3, .6)));
    [['seen', COL.ivy, .35], ['understood', COL.sam, .5], ['like you belong', COL.alex, .65]].forEach(([s, c, f], i) => pill(s, [460, 960, 1460][i], 260, { p: B(lt, at(3, f)), bg: c, color: i === 1 ? COL.ink : '#fff', size: 52 }));
    withA(E(lt, at(3, .1)), () => { txt('not about how many people...', W / 2, 140, { size: 50, weight: 700, color: COL.ink2 }); });
  }]);
};
S.kinds = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#ECE8F8'); chapter(2, 'Three kinds of loneliness', lt); heading('DIFFERENT FLAVORS', 260);
    [[COL.alex, 'emotional'], [COL.ivy, 'social'], [COL.sam, 'collective']].forEach(([c, s], i) => { const p = B(lt, at(0, .3 + i * .15)); g.fillStyle = c; g.beginPath(); g.arc(560 + i * 400, 620, 140 * p, 0, 7); g.fill(); txt('?', 560 + i * 400, 624, { size: 110 * p, weight: 700, color: '#fff' }); });
    source('Weiss (1973), Loneliness: The Experience of Emotional and Social Isolation', E(lt, at(0, .4)));
  }, () => {
    paperBg('#ECE8F8');
    [['EMOTIONAL', 'missing one close person', COL.alex, .05], ['SOCIAL', 'missing a wider circle', COL.ivy, .5]].forEach(([h, s, c, f], i) => { const x = 560 + i * 800, p = B(lt, at(1, f)); withA(E(lt, at(1, f), .3), () => { g.save(); scaleAt(x, 560, p);
      card(x, 560, 680, 640); txt(h, x, 300, { size: 64, weight: 700, color: c }); txt(s, x, 380, { size: 40, font: 'Nunito', weight: 800 });
      if (i === 0) { ch(P_(MAX, { x: x - 90, y: 820, s: .9, expr: 'sad' })); g.setLineDash([10, 10]); g.lineWidth = 6; g.strokeStyle = COL.alex; rr(x + 30, 590, 150, 230, 75); g.stroke(); g.setLineDash([]); }
      else { ch(P_(MAX, { x, y: 820, s: .8, expr: 'sad' })); [-1, 1].forEach(k => { g.setLineDash([10, 10]); g.lineWidth = 5; g.strokeStyle = COL.ivy; g.beginPath(); g.arc(x, 710, 230, 0, 7); g.stroke(); g.setLineDash([]); }); }
      g.restore(); }); });
  }, () => {
    paperBg('#FFF4DE'); heading('COLLECTIVE', 140, '#C98A00', 80); txt('not belonging to a bigger community', W / 2, 230, { size: 44, font: 'Nunito', weight: 800 });
    [['neighborhood', .2], ['club', .35], ['a cause', .5]].forEach(([s, f], i) => pill(s, 560 + i * 400, 340, { p: B(lt, at(2, f)), bg: COL.sam, color: COL.ink, size: 44 }));
    for (let i = 0; i < 7; i++) ch({ x: 1060 + (i % 4) * 170, y: 760 + Math.floor(i / 4) * 200, c: EX[i], s: .6, sd: i, expr: 'joy' });
    ch(P_(MAX, { x: 460, y: 960, s: 1, expr: 'sad', look: 1 }));
    source('Hawkley et al. (2008); Cacioppo & Patrick (2008)', E(lt, at(2, .3)));
  }, () => {
    paperBg('#ECE8F8');
    ch(P_(MAX, { x: 960, y: 960, s: 1.3, expr: 'sad' })); for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2 + TT * .2; ch({ x: 960 + Math.cos(an) * 620, y: 640 + Math.sin(an) * 300, c: '#B8BCCB', s: .45, sd: i, expr: 'smile', alpha: E(lt, at(3, .2) + i * .03) }); }
    pill('huge network', 960, 230, { p: B(lt, at(3, .3)), bg: COL.ivy, size: 44 }); pill('...but missing one person who really gets them', 960, 1010, { p: B(lt, at(3, .65)), bg: COL.alex, size: 40 });
  }]);
};
S.socialMedia = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#E8EEF7'); chapter(6, 'What about social media?', lt); heading('THE RESEARCH IS MIXED', 230);
    g.fillStyle = COL.ink; rr(760, 330, 400, 680, 40); g.fill(); g.fillStyle = '#F5F6FA'; rr(784, 380, 352, 580, 20); g.fill();
    for (let i = 0; i < 4; i++) { const y = 440 + ((i * 140 + (lt * 120)) % 560); g.fillStyle = [COL.alex, COL.ivy, COL.sam, COL.max][i]; rr(810, y, 300, 110, 14); g.fill(); }
    pill('stay in touch ✓', 450, 560, { p: B(lt, at(0, .45)), bg: COL.ivy, size: 42 }); pill('how you use it matters', 1460, 560, { p: B(lt, at(0, .75)), bg: COL.ink, size: 42 });
  }, () => {
    paperBg('#E8EEF7'); heading('LIMIT IT TO ~30 MIN A DAY', 130);
    clock(480, 520, 170, .5); txt('3 weeks', 480, 760, { size: 52, weight: 700, alpha: E(lt, at(1, .3)) });
    const base = 820; bar(1080, base, 240, 520, COL.gray, .7 * E(lt, at(1, .45), .8)); bar(1420, base, 240, 520, COL.ivy, .45 * E(lt, at(1, .55), .8)); line(900, base, 1600, base, 8, COL.ink);
    txt('loneliness', 1250, 270, { size: 40, weight: 700 }); wrap('comparison group', 1080, base + 60, 260, 42, { size: 32, weight: 700 }); wrap('limited to 30 min', 1420, base + 60, 260, 42, { size: 32, weight: 700, color: COL.ivy });
    pill('small study', 480, 900, { p: B(lt, at(1, .8)), bg: COL.ink2, size: 38 }); source('Hunt, Marx, Lipson & Young (2018); illustrative', E(lt, at(1, .3)));
  }, () => {
    paperBg('#E8EEF7');
    [['PASSIVE SCROLLING', 'watching highlights', COL.red, .1, 0], ['ACTIVE CHATTING', 'talking with people', COL.ivy, .45, 1]].forEach(([h, s, c, f, ok], i) => { const x = 560 + i * 800, p = B(lt, at(2, f)); withA(E(lt, at(2, f), .3), () => { g.save(); scaleAt(x, 560, p);
      card(x, 560, 680, 640); txt(h, x, 300, { size: 56, weight: 700, color: c }); txt(s, x, 370, { size: 40, font: 'Nunito', weight: 800 });
      ch(P_(MAX, { x: ok ? x - 90 : x, y: 820, s: .9, expr: ok ? 'joy' : 'sad' })); if (ok) { ch(P_(IVY, { x: x + 90, y: 820, s: .9, expr: 'joy', look: -1 })); heart(x, 520, 1.8); } else phone5(x + 150, 640, .5, 0);
      g.restore(); }); });
    source('Verduyn et al. (2015), Journal of Experimental Psychology: General', E(lt, at(2, .3)));
  }, () => {
    paperBg('#E2EFEB'); heading('A LIFELINE FOR SOME', 140, COL.ivy);
    g.fillStyle = COL.ink; rr(260, 260, 520, 700, 40); g.fill(); g.fillStyle = '#F5F6FA'; rr(284, 310, 472, 600, 20); g.fill();
    ['welcome! 👋', 'same here!', 'you are not alone ❤️'].forEach((s, i) => msg(520, 400 + i * 110, 380, s, i === 1, E(lt, at(3, .1 + i * .15), .3)));
    ch(P_(ALEX, { x: 1300, y: 960, s: 1.3, expr: lt > at(3, .5) ? 'joy' : 'smile', look: -1 })); pill('these are averages', 1300, 420, { p: B(lt, at(3, .05)), bg: COL.ink2, size: 42 });
  }]);
};
S.signal = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#F7EDD3'); chapter(3, 'Why loneliness exists', lt);
    card(W / 2, 460, 900, 300, B(lt, .4)); withA(E(lt, .4), () => { txt('John Cacioppo', W / 2, 410, { size: 70, weight: 700 }); txt('decades of loneliness research', W / 2, 500, { size: 42, font: 'Nunito', weight: 800, color: COL.ink2 }); });
    ch(P_(MAX, { x: 960, y: 1020, s: 1, expr: 'o' }));
  }, () => {
    paperBg('#F7EDD3');
    [['HUNGER', 'find food', COL.sam, .1], ['LONELINESS', 'reconnect with people', COL.max, .5]].forEach(([h, s, c, f], i) => { const y = 340 + i * 360, p = E(lt, at(1, f), .5); withA(p, () => {
      card(560, y, 640, 260); txt(h, 560, y - 40, { size: 64, weight: 700, color: c }); txt('an unpleasant signal', 560, y + 40, { size: 38, font: 'Nunito', weight: 800, color: COL.ink2 });
      arrowLine(900, y, 1180, y, E(lt, at(1, f) + .3, .5), COL.ink, 10); card(1460, y, 520, 200); txt(s, 1460, y + 2, { size: 46, weight: 700, color: c, maxW: 480 }); }); });
  }, () => {
    g.fillStyle = '#141833'; g.fillRect(0, 0, W, H); g.fillStyle = '#1C2140'; g.fillRect(0, 860, W, 220);
    const gl = g.createRadialGradient(760, 800, 20, 760, 800, 600); gl.addColorStop(0, 'rgba(255,170,80,.5)'); gl.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gl; g.fillRect(0, 200, 1500, 880); campfire(760, 860, 1);
    [[420, 0], [560, 2], [960, 1], [1100, 4]].forEach(([x, ci], i) => ch({ x, y: 880, c: EX[ci], s: .85, expr: 'joy', sd: i, look: x > 760 ? -1 : 1 }));
    const back = E(lt, at(2, .55), 1.6); ch(P_(MAX, { x: lerp(1700, 1260, back), y: 880, s: .85, expr: back > .5 ? 'joy' : 'sad', look: -1, flip: false }));
    withA(1 - back, () => { eyes(1840, 640, 1, 1700, 760, 1, 1); txt('dangerous alone', 1700, 560, { size: 40, weight: 700, color: '#FF8A8A' }); });
    withA(back, () => txt('back to the group = survival', 760, 300, { size: 52, weight: 700, color: '#FFE7B0' }));
  }, () => {
    paperBg('#ECE8F8');
    const p = B(lt, L[3] + .2, .6); g.save(); scaleAt(960, 480, p); g.fillStyle = COL.white; rr(700, 320, 520, 320, 16); g.fill(); g.lineWidth = 8; g.strokeStyle = COL.ink; g.stroke(); g.beginPath(); g.moveTo(700, 320); g.lineTo(960, 500); g.lineTo(1220, 320); g.stroke(); heart(960, 560, 2.4); g.restore();
    txt('not a flaw.', W / 2, 760, { size: 72, weight: 700, color: COL.ink2, alpha: E(lt, at(3, .2)) }); txt('a message.', W / 2, 860, { size: 80, weight: 700, color: COL.max, alpha: E(lt, at(3, .6)) });
  }]);
};
S.trap = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#E3E4EE'); chapter(4, 'The loneliness trap', lt);
    [[1300, 0], [1460, 2], [1620, 4]].forEach(([x, ci], i) => ch({ x, y: 900, c: EX[ci], s: 1, expr: 'joy', sd: i, look: -1 }));
    ch(P_(MAX, { x: 600, y: 900, s: 1.2, expr: 'worried', look: 1 }));
    const k = E(lt, at(0, .4), .8); withA(k, () => { g.strokeStyle = 'rgba(120,140,200,.9)'; g.lineWidth = 8; g.fillStyle = 'rgba(180,200,240,.25)'; g.beginPath(); g.arc(600, 760, 230, 0, 7); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(600, 760, 200, -2.4, -1.8); g.stroke(); });
    txt('harder to reconnect', 600, 420, { size: 48, weight: 700, alpha: E(lt, at(0, .5)) });
  }, () => {
    g.fillStyle = '#0F1A2A'; g.fillRect(0, 0, W, H); const cx = 960, cy = 560;
    for (let r = 1; r <= 4; r++) { g.strokeStyle = 'rgba(80,220,140,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r * 110, 0, 7); g.stroke(); }
    g.save(); g.translate(cx, cy); g.rotate(TT * 2); const sw = g.createLinearGradient(0, 0, 440, 0); sw.addColorStop(0, 'rgba(80,220,140,.6)'); sw.addColorStop(1, 'rgba(80,220,140,0)'); g.fillStyle = sw; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 440, -.3, 0); g.fill(); g.restore();
    [[-250, -150], [200, -220], [300, 120], [-180, 230]].forEach(([dx, dy], i) => { const p = E(lt, at(1, .3 + i * .1), .3); withA(p, () => { g.fillStyle = COL.red; g.beginPath(); g.arc(cx + dx, cy + dy, 16, 0, 7); g.fill(); txt('rejection?', cx + dx, cy + dy - 40, { size: 30, weight: 700, color: '#FF8A8A' }); }); });
    ch(P_(MAX, { x: cx, y: cy + 120, s: .9, expr: 'scared', sweat: true })); txt('MORE ALERT TO SOCIAL THREAT', W / 2, 100, { size: 60, weight: 700, color: '#9BF0C0' });
    source('Cacioppo & Hawkley (2009)', E(lt, at(1, .3)));
  }, () => {
    paperBg('#E3E4EE');
    g.fillStyle = COL.ink; rr(260, 220, 420, 720, 40); g.fill(); g.fillStyle = '#F5F6FA'; rr(284, 270, 372, 620, 20); g.fill();
    msg(400, 360, 180, 'ok.', false, E(lt, at(2, .05), .3)); withA(E(lt, at(2, .2)), () => { thought(1000, 330, 560, 120); txt('"they must be annoyed with me"', 1000, 332, { size: 36, font: 'Nunito', weight: 800 }); });
    withA(E(lt, at(2, .45)), () => { card(1040, 620, 440, 200); txt('PARTY SATURDAY', 1040, 590, { size: 40, weight: 700, color: COL.alex }); txt('you coming?', 1040, 650, { size: 34, font: 'Nunito', weight: 800 }); cross(1040, 620, 80, E(lt, at(2, .55), .4)); });
    const back = E(lt, at(2, .7), 1); ch(P_(MAX, { x: lerp(1520, 1720, back), y: 960, s: 1.1, expr: 'sad', flip: back > .1 }));
  }, () => {
    paperBg('#E3E4EE'); heading('THE LOOP');
    const nodes = [['fewer connections', COL.ink2], ['more loneliness', COL.max], ['more alert to rejection', COL.red]], cx = 960, cy = 590, R = 300, spin = (lt - L[3]) * .8;
    g.lineWidth = 10; g.strokeStyle = '#C9C3B8'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.strokeStyle = COL.ink; g.beginPath(); g.arc(cx, cy, R, spin, spin + 1.2); g.stroke();
    nodes.forEach(([s, c], i) => { const an = -Math.PI / 2 + i * Math.PI * 2 / 3; pill(s, cx + Math.cos(an) * R, cy + Math.sin(an) * R, { p: B(lt, at(3, .05 + i * .25)), bg: c, size: 44 }); });
    ch(P_(MAX, { x: cx, y: cy + 130, s: .85, expr: 'tired' }));
  }, () => {
    paperBg('#E2EFEB'); heading('WHAT WORKED BEST?');
    const base = 820; bar(700, base, 300, 520, COL.gray, .3 * E(lt, at(4, .45), .8)); bar(1220, base, 300, 520, COL.ivy, .85 * E(lt, at(4, .7), .8)); line(460, base, 1460, base, 8, COL.ink);
    wrap('more chances to socialize', 700, base + 70, 360, 46, { size: 38, weight: 700 }); wrap('working on negative thoughts', 1220, base + 70, 360, 46, { size: 38, weight: 700, color: COL.ivy });
    txt('illustrative', W / 2, base + 160, { size: 30, font: 'Nunito', weight: 700, color: COL.ink2, alpha: E(lt, at(4, .5)) });
    source('Masi, Chen, Hawkley & Cacioppo (2011), meta-analysis', E(lt, at(4, .3)));
  }]);
};
S.common = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#ECE8F8'); chapter(5, 'How common is it?', lt); heading("YOU'RE IN BIG COMPANY", 220);
    for (let i = 0; i < 24; i++) { const x = 140 + (i % 12) * 150, y = 640 + Math.floor(i / 12) * 260; ch({ x, y, c: [COL.ivy, COL.sam, COL.alex, COL.max, ...EX][i % 11], s: .55, expr: 'neutral', sd: i, alpha: E(lt, .3 + i * .03) }); }
  }, () => {
    paperBg('#ECE8F8'); heading('ABOUT 1 IN 2 US ADULTS', 140, COL.max);
    for (let i = 0; i < 10; i++) { const on = i < 5 && lt > at(1, .3) + i * .15; ch({ x: 220 + i * 165, y: 760, c: on ? COL.max : COL.gray, top: on ? 'spike' : null, s: .8, expr: on ? 'sad' : 'smile', sd: i }); }
    txt('reported loneliness in recent years', W / 2, 880, { size: 46, font: 'Nunito', weight: 800, alpha: E(lt, at(1, .5)) });
    source('US Surgeon General advisory (2023), "Our Epidemic of Loneliness and Isolation"', E(lt, at(1, .3)));
  }, () => {
    paperBg('#ECE8F8'); heading('OFTEN LONELY, BY AGE', 130);
    const base = 820; [['16–24', .40, COL.alex, .3], ['over 75', .27, COL.ivy, .5]].forEach(([s, v, c, f], i) => { const x = 760 + i * 400, p = E(lt, at(2, f), .8); bar(x, base, 260, 1100, c, v * p); txt(Math.round(v * 100 * p) + '%', x, base - 1100 * v * p - 50, { size: 64, weight: 700, alpha: p }); txt(s, x, base + 60, { size: 46, weight: 700 }); });
    line(520, base, 1400, base, 8, COL.ink); pill('self-selected online survey of 55,000+', W / 2, 990, { p: B(lt, at(2, .75)), bg: COL.ink2, size: 34 });
    source('BBC Loneliness Experiment (2018), Qualter, Barreto et al.', E(lt, at(2, .4)));
  }, () => {
    paperBg('#F6E3DC'); heading('IT MATTERS FOR HEALTH', 130, COL.red);
    heart(620, 560, 9 * B(lt, at(3, .1)) * (1 + .04 * Math.sin(TT * 5)), COL.red);
    withA(E(lt, at(3, .3)), () => { txt('+26%', 1300, 470, { size: 150, weight: 700, color: COL.red }); txt('higher risk of early death', 1300, 590, { size: 44, font: 'Nunito', weight: 800 }); });
    pill('linked: not proof of cause', 1300, 720, { p: B(lt, at(3, .65)), bg: COL.ink, size: 40 });
    withA(E(lt, at(3, .8)), () => { g.fillStyle = '#F6E7B8'; g.beginPath(); g.arc(1700, 900, 50, 0, 7); g.fill(); g.fillStyle = '#F6E3DC'; g.beginPath(); g.arc(1680, 885, 46, 0, 7); g.fill(); pill('less restful sleep', 1340, 900, { bg: COL.max, size: 40 }); });
    source(lt > at(3, .75) ? 'Holt-Lunstad et al. (2015); Cacioppo et al. (2002)' : 'Holt-Lunstad et al. (2015), meta-analysis', E(lt, at(3, .3)));
  }]);
};
S.under = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#FFE3B0'); sky.addColorStop(1, '#FFF4DE'); g.fillStyle = sky; g.fillRect(0, 0, W, H); chapter(7, 'Other people want to connect too', lt);
    g.fillStyle = '#FFC857'; g.beginPath(); g.arc(W / 2, 1080, 360 * E(lt, .2, 1.5), Math.PI, 0); g.fill();
    heading('THEY WANT TO CONNECT TOO', 260, '#C98A00', 84);
    [[560, IVY], [820, SAM], [1100, ALEX], [1360, MAX]].forEach(([x, c], i) => ch(P_(c, { x, y: 980, s: 1, expr: 'joy', alpha: E(lt, .8 + i * .15) })));
  }, () => {
    paperBg('#ECE8F8'); heading('THE LIKING GAP');
    ch(P_(MAX, { x: 340, y: 940, s: 1.1, expr: 'worried', look: 1 })); ch({ x: 620, y: 940, c: EX[3], s: 1.1, expr: 'joy', look: -1, sd: 3 });
    const base = 820; bar(1080, base, 240, 520, COL.max, .4 * E(lt, at(1, .4), .8)); bar(1440, base, 240, 520, COL.ivy, .75 * E(lt, at(1, .65), .8)); line(900, base, 1620, base, 8, COL.ink);
    wrap('how much I think they liked me', 1080, base + 70, 320, 44, { size: 34, weight: 700 }); wrap('how much they actually did', 1440, base + 70, 320, 44, { size: 34, weight: 700, color: COL.ivy });
    source('Boothby, Cooney, Sandstrom & Clark (2018); illustrative', E(lt, at(1, .3)));
  }, () => {
    paperBg('#ECE8F8'); heading('JUST CHECKING IN');
    g.fillStyle = COL.ink; rr(260, 220, 420, 720, 40); g.fill(); g.fillStyle = '#F5F6FA'; rr(284, 270, 372, 620, 20); g.fill(); msg(470, 380, 300, 'thinking of you!', true, E(lt, at(2, .2), .3));
    ch(P_(IVY, { x: 1000, y: 920, s: 1.2, expr: lt > at(2, .5) ? 'joy' : 'smile' })); if (lt > at(2, .5)) for (let i = 0; i < 4; i++) { const a = ((lt - at(2, .5)) * .8 + i * .3) % 1.4; heart(940 + i * 40, 540 - a * 160, 1.4, COL.red, clamp(1 - a / 1.4)); }
    [['expected', .3, COL.gray], ['actual', .85, COL.ivy]].forEach(([s, v, c], i) => { const x = 1420 + i * 220; bar(x, 860, 150, 520, c, v * E(lt, at(2, .5 + i * .15), .8)); txt(s, x, 920, { size: 38, weight: 700 }); });
    source('Liu, Rim, Min & Min (2023), JPSP', E(lt, at(2, .4)));
  }, () => {
    g.fillStyle = '#C9D6E3'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) { g.fillStyle = '#9FB7CC'; rr(140 + i * 440, 160, 360, 220, 24); g.fill(); g.fillStyle = '#E7F0F7'; const off = (TT * 300 + i * 200) % 400; g.fillRect(140 + i * 440 + (360 - off % 360), 200, 40, 140); }
    g.fillStyle = '#5A6B80'; g.fillRect(0, 840, W, 240); g.fillStyle = '#3E6BC0'; [380, 900].forEach(x => { rr(x - 160, 640, 320, 220, 30); g.fill(); });
    ch(P_(SAM, { x: 330, y: 820, s: .95, expr: lt > at(3, .55) ? 'joy' : 'nervous', look: 1 })); ch({ x: 520, y: 820, c: EX[5], s: .95, expr: lt > at(3, .55) ? 'joy' : 'smile', sd: 5, look: -1 });
    withA(E(lt, at(3, .3)), () => { card(1420, 400, 640, 300); txt('expected: awkward 😬', 1420, 340, { size: 46, weight: 700, color: COL.ink2 }); txt('actual: pleasant 🙂', 1420, 450, { size: 46, weight: 700, color: COL.ivy, alpha: E(lt, at(3, .6)) }); });
    source('Epley & Schroeder (2014)', E(lt, at(3, .3)));
  }, () => {
    paperBg('#F4E9D2'); heading('SMALL CHATS COUNT TOO');
    g.fillStyle = '#8C5A3C'; rr(900, 640, 900, 60, 12); g.fill(); g.fillStyle = '#7A4C31'; g.fillRect(900, 700, 900, 300); g.fillStyle = '#C9CED8'; rr(1500, 520, 140, 120, 16); g.fill();
    ch({ x: 1350, y: 640, c: EX[4], s: .9, expr: 'joy', sd: 4, look: -1 }); g.fillStyle = '#3E2A20'; rr(1290, 520, 120, 60, 10); g.fill(); txt('barista', 1350, 400, { size: 36, font: 'Nunito', weight: 800 });
    ch(P_(MAX, { x: 640, y: 980, s: 1.2, expr: lt > at(4, .5) ? 'joy' : 'smile', look: 1 }));
    withA(E(lt, at(4, .45)), () => { bubble(780, 520, 380, 100, 'bl'); txt('"Same as always?"', 780, 522, { size: 36, font: 'Nunito', weight: 800 }); });
    pill('happier + more connected', 1350, 860, { p: B(lt, at(4, .7)), bg: COL.ivy, size: 40 });
    source('Sandstrom & Dunn (2014), "the surprising power of weak ties"', E(lt, at(4, .3)));
  }]);
};
S.helps5 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6], [() => {
    paperBg('#E2EFEB'); chapter(8, 'What actually helps', lt); heading('WHAT ACTUALLY HELPS', 380, COL.ink, 100);
    [1, 2, 3, 4, 5, 6].forEach(i => { const p = B(lt, .8 + i * .2); g.fillStyle = COL.ivy; g.beginPath(); g.arc(295 + i * 190, 620, 64 * p, 0, 7); g.fill(); txt(String(i), 295 + i * 190, 624, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#ECE8F8'); tipTag5(1, 'Check your assumptions');
    g.fillStyle = COL.ink; rr(260, 220, 420, 720, 40); g.fill(); g.fillStyle = '#F5F6FA'; rr(284, 270, 372, 620, 20); g.fill(); msg(400, 360, 180, 'ok.', false);
    ['busy day?', 'on the bus?', 'just how they text?'].forEach((s, i) => withA(E(lt, at(1, .35 + i * .15), .3), () => { thought(1100 + (i % 2) * 260, 300 + i * 200, 380, 100); txt(s, 1100 + (i % 2) * 260, 302 + i * 200, { size: 38, font: 'Nunito', weight: 800 }); }));
    ch(P_(MAX, { x: 900, y: 960, s: 1, expr: lt > at(1, .6) ? 'smile' : 'worried', look: 1 }));
  }, () => {
    paperBg('#ECE8F8'); tipTag5(2, 'Reach out first');
    g.fillStyle = COL.ink; rr(1240, 220, 420, 720, 40); g.fill(); g.fillStyle = '#F5F6FA'; rr(1264, 270, 372, 620, 20); g.fill();
    msg(1450, 380, 320, 'hey! how are you?', true, E(lt, at(2, .15), .3)); msg(1450, 470, 320, 'miss our chats :)', true, E(lt, at(2, .3), .3)); msg(1450, 600, 280, 'omg hi!!! ❤️', false, E(lt, at(2, .6), .3));
    ch(P_(MAX, { x: 600, y: 960, s: 1.4, expr: lt > at(2, .6) ? 'joy' : 'smile', look: 1 })); pill('two lines count', 600, 380, { p: B(lt, at(2, .75)), bg: COL.max, size: 46 });
  }, () => {
    paperBg('#ECE8F8'); tipTag5(3, 'Depth, not numbers');
    withA(E(lt, at(3, .1)), () => { card(520, 580, 640, 600, 1, '#E3E4EE'); for (let i = 0; i < 6; i++) ch({ x: 340 + (i % 3) * 180, y: 560 + Math.floor(i / 3) * 260, c: '#9AA0AE', s: .5, sd: i, expr: 'smile' }); txt('crowded room', 520, 340, { size: 46, weight: 700, color: COL.ink2 }); });
    withA(E(lt, at(3, .45)), () => { card(1400, 580, 640, 600, 1, '#FFF7DC'); ch(P_(MAX, { x: 1300, y: 820, s: .9, expr: 'joy', look: 1 })); ch(P_(IVY, { x: 1500, y: 820, s: .9, expr: 'joy', look: -1 })); heart(1400, 470, 2.4); txt('one honest talk', 1400, 340, { size: 46, weight: 700, color: dark(COL.sam, .3) }); });
  }, () => {
    paperBg('#E2EFEB'); tipTag5(4, 'Join something regular');
    [['class', COL.max], ['club', COL.alex], ['team', COL.ivy], ['volunteering', COL.sam]].forEach(([s, c], i) => pill(s, 360 + i * 400, 260, { p: B(lt, at(4, .15 + i * .1)), bg: c, color: i === 3 ? COL.ink : '#fff', size: 46 }));
    const wk = Math.min(4, Math.floor(clamp((lt - L[4] - .5) / (Le[4] - L[4] - .5)) * 5)); txt('week ' + (wk + 1), W / 2, 400, { size: 56, weight: 700, color: COL.ink2 });
    [[660, EX[1]], [880, EX[3]], [1100, MAX], [1320, EX[5]]].forEach(([x, c], i) => ch({ x, y: 900, c: c.c || c, top: c.top, s: 1, sd: i, expr: wk >= 2 ? 'joy' : 'smile', look: x < 960 ? 1 : -1 }));
    for (let i = 0; i < wk; i++) heart(700 + i * 160, 560, 1.4, COL.red);
  }, () => {
    paperBg('#ECE8F8'); tipTag5(5, 'Give it time');
    const x0 = 280, x1 = 1640, y = 560, hx = h => lerp(x0, x1, h / 220), p = E(lt, at(5, .2), 2.2) * 220;
    g.fillStyle = '#D9D2C4'; rr(x0, y - 30, x1 - x0, 60, 30); g.fill(); g.fillStyle = COL.max; rr(x0, y - 30, hx(p) - x0, 60, 30); g.fill();
    [[50, 'casual friend', .35], [200, 'close friend', .7]].forEach(([h, s, f]) => { line(hx(h), y - 60, hx(h), y + 60, 6, COL.ink); txt(h + ' hours', hx(h), y - 100, { size: 46, weight: 700 }); txt(s, hx(h), y + 110, { size: 40, font: 'Nunito', weight: 800, alpha: E(lt, at(5, f), .4) }); });
    txt('acquaintance', x0, y + 110, { size: 36, font: 'Nunito', weight: 800, color: COL.ink2 });
    ch(P_(MAX, { x: hx(p), y: y - 150, s: .7, expr: 'joy' }));
    source('Hall (2019), Journal of Social and Personal Relationships', E(lt, at(5, .4)));
  }, () => {
    paperBg('#E2EFEB');
    card(W / 2, 520, 1300, 560, B(lt, L[6] + .2)); withA(E(lt, L[6] + .2), () => { txt('When to get help', W / 2, 310, { size: 70, weight: 700, color: COL.ivy });
      ['loneliness that has lasted a long time', 'feeling hopeless', "you don't need to be in crisis"].forEach((s, i) => { const t0 = at(6, .12 + i * .2); check(560, 430 + i * 100, 1.3, E(lt, t0, .4), COL.ivy); txt(s, 630, 432 + i * 100, { size: 46, font: 'Nunito', weight: 800, align: 'left', alpha: E(lt, t0, .4) }); });
      pill('talk to a professional, or call a helpline', W / 2, 740, { p: B(lt, at(6, .7)), bg: COL.ivy, size: 40 }); });
  }]);
};
S.outro5 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 2, 3, 4], [() => {
    const warm = 1 - E(lt, .3, 2.5) * 0 ;
    diningRoom(); family(lt, {}); ch(P_(MAX, { x: 960, y: 790, s: .95, expr: lt > at(0, .35) ? 'joy' : 'smile', look: 1 })); table(); desat(.7 * (1 - E(lt, at(0, .35), 1.5)), [960, 660, 58, 112]);
    withA(E(lt, at(0, .5)), () => { bubble(820, 440, 600, 110, 'br'); txt('"What\'s been on your mind lately?"', 820, 442, { size: 36, font: 'Nunito', weight: 800 }); });
    if (lt > L[1]) for (let i = 0; i < 5; i++) { const a = ((lt - L[1]) * .7 + i * .3) % 1.6; heart(900 + i * 50, 560 - a * 150, 1.2, COL.red, clamp(1 - a / 1.6)); }
    withA(E(lt, at(1, .4)), () => { card(W / 2, 170, 900, 120); txt('the best part of the evening', W / 2, 172, { size: 54, weight: 700, color: COL.alex }); });
  }, () => {
    diningRoom(); family(lt, {}); ch(P_(MAX, { x: 960, y: 790, s: .95, expr: 'joy' })); table();
    g.fillStyle = 'rgba(20,20,40,.45)'; g.fillRect(0, 0, W, H); const sp = g.createRadialGradient(560, 650, 30, 560, 650, 260); sp.addColorStop(0, 'rgba(255,240,200,.5)'); sp.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = sp; g.fillRect(200, 300, 720, 700);
    withA(E(lt, at(2, .5)), () => { card(W / 2, 170, 1000, 120); txt('one small question can change an evening', W / 2, 172, { size: 46, weight: 700, color: COL.ivy }); });
  }, () => {
    paperBg(); txt('What helps you feel connected?', W / 2, 200, { size: 76, weight: 700, alpha: B(lt, L[3]) });
    bubble(W / 2, 440, 860, 160, 'bl', B(lt, at(3, .6))); txt('tell me in the comments ↓', W / 2, 442, { size: 54, font: 'Nunito', weight: 800, alpha: E(lt, at(3, .6)) });
    withA(E(lt, at(3, .15)), () => { g.fillStyle = COL.ink; rr(1560, 560, 200, 340, 26); g.fill(); g.fillStyle = '#5B8DEF'; rr(1574, 580, 172, 300, 14); g.fill(); txt('send ✉', 1660, 730, { size: 36, weight: 700, color: '#fff' }); });
    [[480, IVY], [740, SAM], [1000, ALEX], [1260, MAX]].forEach(([x, c], i) => ch(P_(c, { x, y: 1000, s: .95, expr: 'joy', arms: i % 2 ? 'wave' : 'up' })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); txt('Thanks for watching!', W / 2, 330, { size: 110, weight: 700, color: COL.white }); txt('See you in the next one.', W / 2, 450, { size: 52, font: 'Nunito', weight: 800, color: COL.sam });
    [[560, IVY], [820, SAM], [1100, ALEX], [1360, MAX]].forEach(([x, c]) => ch(P_(c, { x, y: 960, s: 1.05, expr: 'joy', arms: 'wave' })));
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  g.fillStyle = '#2A2F4A'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) { if (r === 1 && i === 4) continue; const x = 120 + i * 210 + (r ? 105 : 0), y = 760 + r * 330; ch({ x, y, c: '#5A6185', s: 1.05 - r * .05 + .2 * r, expr: 'joy', sd: i + r * 9 }); }
  const sp = g.createRadialGradient(960, 900, 40, 960, 900, 420); sp.addColorStop(0, 'rgba(180,160,255,.55)'); sp.addColorStop(1, 'rgba(180,160,255,0)'); g.fillStyle = sp; g.fillRect(500, 400, 920, 680);
  ch(P_(MAX, { x: 960, y: 1180, s: 2.4, expr: 'sad' }));
  g.save(); g.translate(W / 2, 150); g.rotate(-.02); g.font = '700 150px Fredoka'; const a = 'LONELY IN A ', b = 'CROWD?'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 150, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 150, weight: 700, color: '#B9A8FF', align: 'left' }); g.restore();
  finish(); };
