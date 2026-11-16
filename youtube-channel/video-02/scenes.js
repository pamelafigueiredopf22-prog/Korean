// Video 02 scenes: "Why You Can't Forget That Embarrassing Moment". Uses engine/core.js helpers.
// Each S.<type>(lt, L, Le, D, at): lt = time in scene, L/Le = line start/end times, at(i,f) = f-fraction through line i.

// ---------- helpers for this video
function bedroom(o = {}) {
  const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#1F2547'); wall.addColorStop(1, '#2C3360'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  // window + moon
  g.fillStyle = '#121633'; rr(1380, 140, 360, 330, 12); g.fill(); g.fillStyle = '#F6E7B8'; g.beginPath(); g.arc(1640, 220, 38, 0, 7); g.fill();
  g.fillStyle = '#121633'; g.beginPath(); g.arc(1622, 208, 34, 0, 7); g.fill();
  g.fillStyle = '#fff'; for (let i = 0; i < 14; i++) { g.globalAlpha = .4 + .4 * Math.sin(TT * 2 + i); g.beginPath(); g.arc(1400 + (i * 67) % 320, 160 + (i * 41) % 280, 2, 0, 7); g.fill(); } g.globalAlpha = 1;
  g.lineWidth = 14; g.strokeStyle = '#141833'; rr(1380, 140, 360, 330, 12); g.stroke(); line(1560, 140, 1560, 470, 10, '#141833');
  const mg = g.createRadialGradient(1560, 300, 20, 1560, 500, 700); mg.addColorStop(0, 'rgba(160,190,255,.12)'); mg.addColorStop(1, 'rgba(160,190,255,0)'); g.fillStyle = mg; g.fillRect(800, 0, 1120, H);
  // nightstand + clock
  g.fillStyle = '#3A2F4F'; rr(220, 640, 220, 220, 14); g.fill(); g.fillStyle = '#16131F'; rr(250, 570, 160, 70, 12); g.fill();
  txt(o.clock || '2:00', 330, 607, { size: 44, color: '#FF6B6B', weight: 700 });
  // floor
  g.fillStyle = '#171B36'; g.fillRect(0, 860, W, H - 860);
  // bed frame + mattress + pillow
  g.fillStyle = '#5B4A6E'; rr(500, 520, 60, 360, 18); g.fill(); g.fillStyle = '#4A3C5C'; rr(500, 780, 900, 100, 18); g.fill();
  g.fillStyle = '#E8E2F0'; rr(540, 700, 860, 90, 30); g.fill();
  g.fillStyle = '#F7F4FA'; rr(560, 620, 200, 100, 46); g.fill();
}
function blanket(x0, x1, y, c = '#6C8EBF') { g.fillStyle = c; rr(x0, y, x1 - x0, 140, 50); g.fill(); g.fillStyle = light(c, .18); rr(x0, y, x1 - x0, 36, 18); g.fill();
  g.strokeStyle = dark(c, .12); g.lineWidth = 4; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x0 + i * (x1 - x0) / 4, y + 50); g.lineTo(x0 + i * (x1 - x0) / 4 + 20, y + 130); g.stroke(); } }
function waiter(x, y, s, o = {}) { ch(Object.assign({ x, y, c: '#3E4A61', s, expr: 'smile', sd: 8, arms: 'down' }, o));
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-34, -132); g.lineTo(34, -132); g.lineTo(0, -95); g.fill();
  g.fillStyle = COL.red; g.beginPath(); g.moveTo(0, -125); g.lineTo(-22, -138); g.lineTo(-22, -112); g.fill(); g.beginPath(); g.moveTo(0, -125); g.lineTo(22, -138); g.lineTo(22, -112); g.fill(); g.restore(); }
function bear(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#FFFFFF'; g.strokeStyle = COL.ink; g.lineWidth = 6;
  [[-44, -54], [44, -54]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 22, 0, 7); g.fill(); g.stroke(); }); ell(0, 0, 80, 70); g.fill(); g.stroke();
  g.fillStyle = COL.ink; ell(-26, -10, 7, 7); g.fill(); ell(26, -10, 7, 7); g.fill(); ell(0, 18, 14, 10); g.fill(); g.restore(); }
function car(x, y, s, cardText) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = COL.alex; rr(-150, -70, 300, 80, 24); g.fill(); rr(-90, -130, 170, 70, 22); g.fill();
  g.fillStyle = '#BFE3F2'; rr(-75, -118, 65, 48, 10); g.fill(); rr(0, -118, 65, 48, 10); g.fill(); g.fillStyle = COL.ink; [-90, 90].forEach(a => { g.beginPath(); g.arc(a, 14, 32, 0, 7); g.fill(); });
  g.restore(); if (cardText) memCard(x, y - 180 * s, 230, 80, cardText, { size: 34 }); }
function fly(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = 'rgba(200,230,255,.8)'; const fl = Math.sin(TT * 40) * .3; ell(-14, -16, 16, 9, -.6 + fl); g.fill(); ell(14, -16, 16, 9, .6 - fl); g.fill();
  g.fillStyle = COL.ink; ell(0, 0, 18, 14); g.fill(); g.beginPath(); g.arc(-18, -2, 10, 0, 7); g.fill(); g.fillStyle = '#C0392B'; g.beginPath(); g.arc(-22, -5, 4, 0, 7); g.fill(); g.restore(); }


// ---------- scenes
S.bedOpen = (lt, L, Le, D, at) => {
  const memIn = at(1, .2), cr = at(1, .97);
  panels(lt, L, [0, 4], [() => {
    g.save(); camera([[0, 960, 540, 1.08], [cr, 900, 560, 1.18], [cr + .4, 900, 600, 1.3], [D, 900, 600, 1.3]], lt);
    bedroom({ clock: '2:0' + Math.min(9, Math.floor(lt / 6)) });
    const cringe = lt > cr; const pull = E(lt, cr, .4);
    lying(P_(SAM, { x: 690, y: 700, s: 1, expr: cringe ? 'scared' : lt > memIn ? 'o' : 'calm', shake: cringe ? 1 : 0, sweat: cringe }));
    blanket(lerp(760, 610, pull), 1380, lerp(660, 630, pull));
    if (lt < memIn) for (let i = 0; i < 3; i++) { const a = (lt * .5 + i * .33) % 1; txt('z', 780 + a * 120 + i * 10, 560 - a * 140, { size: 40 + i * 10, color: '#B9C3F0', alpha: clamp(1 - a) * (1 - E(lt, memIn - .5, .4)) }); }
    // memory bubble
    const mb = E(lt, memIn, .5) * (1 - E(lt, cr + .2, .4));
    withA(mb, () => { g.save(); g.translate(0, 60); thought(1120, 290, 760, 400); g.save(); rr(1120 - 370, 100, 740, 380, 190); g.clip();
      g.fillStyle = '#FBE6C8'; g.fillRect(740, 90, 760, 400); g.fillStyle = '#C98B5B'; rr(1060, 360, 240, 26, 8); g.fill(); g.fillRect(1100, 380, 14, 90); g.fillRect(1250, 380, 14, 90);
      ch(P_(SAM, { x: 1230, y: 460, s: .5, expr: lt > at(1, .82) ? 'joy' : 'smile' })); waiter(980, 470, .55, { arms: 'cup' }); g.restore();
      bubble(940, 140, 330, 80, 'bl', B(lt, at(1, .55))); txt('Enjoy your meal!', 940, 142, { size: 34, font: 'Nunito', weight: 800, alpha: E(lt, at(1, .55)) });
      bubble(1320, 160, 230, 80, 'br', B(lt, at(1, .82))); txt('You too!', 1320, 162, { size: 36, font: 'Nunito', weight: 800, alpha: E(lt, at(1, .82)) }); g.restore(); });
    if (cringe) { const k = E(lt, cr, .3); for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; const r = 220 + 20 * Math.sin(TT * 10 + i); const px = 760 + Math.cos(an) * r * 1.3, py = 640 + Math.sin(an) * r * .7;
      withA(k, () => { g.strokeStyle = COL.sam; g.lineWidth = 6; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 12, py + 14); g.lineTo(px - 4, py + 24); g.lineTo(px + 10, py + 38); g.stroke(); }); }
      g.save(); g.translate(1000 + Math.sin(TT * 40) * 6, 330); g.rotate(-.08); g.scale(B(lt, cr, .4), B(lt, cr, .4)); txt('CRINGE', 0, 0, { size: 150, weight: 700, color: COL.sam }); g.restore();
      pill('a.k.a. the "cringe attack"', 1000, 470, { p: B(lt, at(3, .6)), bg: COL.ink, size: 40 }); }
    g.restore();
  }, () => {
    paperBg('#E9E6F5');
    withA(B(lt, L[4] + .2), () => { card(520, 520, 680, 620); txt('2 seconds, years ago', 520, 290, { size: 50, weight: 700 }); memCard(520, 520, 420, 170, '"You too!"', { size: 64, hl: E(lt, L[4] + .6, .6) }); txt('perfectly preserved', 520, 720, { size: 40, font: 'Nunito', weight: 800, color: COL.ivy }); });
    withA(B(lt, at(4, .6)), () => { card(1400, 520, 680, 620); txt('lunch last Tuesday?', 1400, 290, { size: 50, weight: 700 }); g.save(); g.filter = 'blur(10px)'; memCard(1400, 520, 420, 170, 'sandwich?', { size: 60 }); g.restore(); txt('???', 1400, 720, { size: 60, weight: 700, color: COL.ink2 }); });
  }]);
};
S.title2 = (lt, L, Le, D, at) => {
  g.fillStyle = COL.night; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = .08; g.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc((i * 397) % W, (i * 211) % H, 1.5 + (i % 3), 0, 7); g.fill(); } g.restore();
  [['WHY YOU CAN\'T FORGET', COL.white, 230], ['THAT EMBARRASSING MOMENT', COL.sam, 370]].forEach(([s, c, y], i) => { const p = B(lt, .2 + i * .5, .5); g.save(); g.translate(W / 2, y); g.scale(p, p); txt(s, 0, 0, { size: 110, weight: 700, color: c }); g.restore(); });
  txt('...and how to make it hurt less', W / 2, 500, { size: 54, font: 'Nunito', weight: 800, color: '#B9C3F0', alpha: E(lt, 1.6, .6) });
  const p = E(lt, 1, .7); ch(P_(SAM, { x: 960, y: 1080 + lerp(300, 20, p), s: 1.4, expr: 'scared', arms: 'hug', sweat: true }));
  withA(p, () => { g.fillStyle = 'rgba(231,90,80,.45)'; ell(905, 1080 + lerp(300, 20, p) - 1.4 * 150, 30, 16); g.fill(); ell(1015, 1080 + lerp(300, 20, p) - 1.4 * 150, 30, 16); g.fill(); });
};
S.brain = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 4, 5], [() => {
    paperBg('#F6E9EE'); chapter(1, 'Your brain\'s highlighter', lt);
    ch(P_(SAM, { x: 560, y: 900, s: 1.4, expr: 'smile', arms: 'wave', look: 1 })); pill('SAM', 560, 470, { p: B(lt, .5), bg: COL.sam, color: COL.ink, size: 46 });
    brainChar(1320, 600, 1.2 * B(lt, at(0, .45)), { expr: 'smirk' }); pill('his brain', 1320, 330, { p: B(lt, at(0, .6)), bg: '#D9738F', size: 46 });
  }, () => {
    paperBg('#F6E9EE');
    brainChar(960, 300, .7, { expr: 'smile' });
    g.fillStyle = '#8D99AE'; rr(120, 760, 1400, 40, 20); g.fill(); for (let i = 0; i < 14; i++) { g.fillStyle = COL.ink2; g.beginPath(); g.arc(150 + i * 100 + (lt * 120 % 100), 780, 8, 0, 7); g.fill(); }
    // bin
    g.fillStyle = '#6C7A92'; g.beginPath(); g.moveTo(1560, 720); g.lineTo(1800, 720); g.lineTo(1770, 1000); g.lineTo(1590, 1000); g.fill(); g.fillStyle = '#56637A'; rr(1540, 700, 280, 34, 10); g.fill();
    const items = ['brushed teeth', 'bus ride', 'emails', 'cereal', 'traffic', 'meeting', 'laundry'];
    items.forEach((s, i) => { const t = (lt - L[1]) * 260 - i * 230; if (t < 0) return; let x = 120 + t, y = 690, r = 0, a = 1;
      if (x > 1560) { const f = (x - 1560) / 200; y = 690 + f * f * 200; x = 1560 + Math.min(120, (x - 1560) * .4); r = f * .6; a = clamp(1.4 - f); }
      memCard(x, y, 220, 80, s, { size: 30, rot: r, a }); });
    txt('most of your day quietly fades', W / 2, 960, { size: 46, font: 'Nunito', weight: 800, color: COL.ink2, alpha: E(lt, at(1, .5)) });
  }, () => {
    paperBg('#F6E9EE');
    const hl = E(lt, at(3, .3), .9);
    brainChar(640, 560, 1.6, { amyg: E(lt, at(2, .4), .6), hippo: E(lt, at(3, .1), .6) });
    label('amygdala', 330, 880, 590, 680, E(lt, at(2, .5), .6), '#E25B32');
    label('hippocampus', 1000, 880, 690, 670, E(lt, at(3, .12), .6), COL.ivy);
    withA(E(lt, L[3]), () => { memCard(1440, 470, 520, 190, '"You too!"', { size: 70, hl });
      const px = lerp(1240, 1640, hl); g.save(); g.translate(px, 440 - 30); g.rotate(-.6); g.fillStyle = '#FFD447'; rr(-22, -120, 44, 120, 10); g.fill(); g.fillStyle = COL.ink; rr(-22, -150, 44, 34, 8); g.fill(); g.fillStyle = '#E8B800'; g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.lineTo(8, 26); g.lineTo(-8, 26); g.fill(); g.restore();
      pill('+ adrenaline', 1440, 680, { p: B(lt, at(3, .45)), bg: COL.red, size: 40 }); txt('= "this is important!"', 1440, 790, { size: 48, weight: 700, alpha: E(lt, at(3, .7)) }); });
  }, () => {
    paperBg('#F6E9EE');
    [['wedding day', COL.red, .1], ['car accident', COL.ink2, .3], ['"you too!"', COL.sam, .55]].forEach(([s, c, f], i) => { const x = 420 + i * 540, p = B(lt, at(4, f));
      g.save(); scaleAt(x, 520, p); memCard(x, 520, 440, 300, s, { size: 54, hl: E(lt, at(4, f) + .3, .5) }); g.restore();
      if (i === 0) heart(x, 410, 1.6 * p); if (i === 1) txt('!', x, 410, { size: 70, weight: 700, color: COL.red, alpha: p }); if (i === 2) txt(':(', x, 410, { size: 54, weight: 700, alpha: p }); });
    txt('strong emotion → vivid memory', W / 2, 850, { size: 56, weight: 700, alpha: E(lt, at(4, .2)) });
  }, () => {
    paperBg('#EEF1F6');
    const fl = Math.max(0, 1 - (lt - L[5] - .1) * 3); if (lt > L[5]) { g.fillStyle = `rgba(255,255,255,${fl})`; }
    txt('"FLASHBULB" MEMORIES', W / 2, 140, { size: 76, weight: 700 });
    const ch_ = clamp((lt - at(5, .35)) / 2.5); const det = [['Tuesday', 'Wednesday'], ['blue shirt', 'red shirt'], ['at noon', 'at 3pm']];
    card(640, 540, 700, 520); det.forEach(([a, b], i) => { const k = clamp(ch_ * 3 - i); txt(a, 640, 400 + i * 120, { size: 52, weight: 600, alpha: 1 - k }); txt(b, 640, 400 + i * 120, { size: 52, weight: 600, color: COL.red, alpha: k }); });
    [['CONFIDENCE', 1, COL.ivy], ['ACCURACY', lerp(1, .45, ch_), COL.red]].forEach(([s, v, c], i) => { const x = 1280 + i * 300; g.fillStyle = '#DAD5CC'; rr(x - 60, 300, 120, 480, 20); g.fill(); bar(x, 780, 120, 480, c, v); txt(s, x, 840, { size: 38, weight: 700, color: c }); });
    if (lt > L[5] && fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
    source('Talarico & Rubin (2003), flashbulb memories of 9/11', E(lt, at(5, .6)));
  }]);
};
S.tribe = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 2, 3], [() => {
    g.fillStyle = '#141833'; g.fillRect(0, 0, W, H); chapter(2, 'Why embarrassment hits so hard', lt);
    g.save(); g.globalAlpha = .6; g.fillStyle = '#fff'; for (let i = 0; i < 80; i++) { g.beginPath(); g.arc((i * 331) % W, (i * 137) % 520, 1.4 + i % 2, 0, 7); g.fill(); } g.restore();
    g.fillStyle = '#1C2140'; g.fillRect(0, 860, W, 220);
    const fx = 760, fy = 860; const gl = g.createRadialGradient(fx, fy - 60, 20, fx, fy - 60, 620); gl.addColorStop(0, 'rgba(255,170,80,.55)'); gl.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gl; g.fillRect(0, 200, 1500, 880);
    for (let i = 0; i < 3; i++) { const k = Math.sin(TT * 9 + i * 2) * 8; g.fillStyle = ['#FF7B2E', '#FFB13B', '#FFE07A'][i]; g.beginPath(); g.moveTo(fx - 60 + i * 20, fy); g.quadraticCurveTo(fx - 40 + i * 10 + k, fy - 90 + i * 25, fx + k * .5, fy - 160 + i * 45); g.quadraticCurveTo(fx + 40 - i * 10 - k, fy - 90 + i * 25, fx + 60 - i * 20, fy); g.fill(); }
    g.fillStyle = '#6B4B33'; rr(fx - 80, fy - 14, 160, 22, 10); g.fill();
    const out = E(lt, at(1, .7), 1.4);
    [[360, 0], [520, 2], [1000, 1], [1160, 4], [880, 6]].forEach(([x, ci], i) => ch({ x, y: 880, c: EX[ci], s: .85, expr: 'joy', sd: i, look: x > fx ? -1 : 1 }));
    ch(P_(SAM, { x: lerp(640, 1640, out), y: 880, s: .85, expr: out > .3 ? 'sad' : 'smile', flip: out > 0, gray: out * .5 }));
    withA(E(lt, at(1, .85), .8), () => { eyes(1820, 640, 1, 1640, 760, 1, 1); eyes(1760, 520, .8, 1640, 760, 1, 3); });
    pill('belonging = food, protection, survival', 760, 200, { p: B(lt, at(1, .25)), bg: COL.sam, color: COL.ink, size: 40 });
    withA(E(lt, at(1, .8)), () => txt('alone = danger', 1640, 400, { size: 52, weight: 700, color: '#FF8A8A' }));
  }, () => {
    paperBg('#F7EDD3');
    ch(P_(SAM, { x: 760, y: 920, s: 1.6, expr: 'worried', sweat: true }));
    const ring = Math.sin(TT * 30) * .18 * E(lt, L[2] + .2);
    g.save(); g.translate(760, 330); g.rotate(ring); g.fillStyle = '#F2B84B'; g.beginPath(); g.moveTo(-90, 60); g.quadraticCurveTo(-90, -90, 0, -90); g.quadraticCurveTo(90, -90, 90, 60); g.closePath(); g.fill(); g.lineWidth = 8; g.strokeStyle = COL.ink; g.stroke();
    g.fillStyle = COL.ink; rr(-110, 52, 220, 26, 12); g.fill(); g.beginPath(); g.arc(0, 90, 18, 0, 7); g.fill(); g.restore();
    if (lt > L[2] + .2) for (let i = 0; i < 2; i++) [-1, 1].forEach(k => { g.strokeStyle = COL.red; g.lineWidth = 7; g.beginPath(); g.arc(760, 330, 140 + i * 40, k > 0 ? -.5 : Math.PI - .5, k > 0 ? .5 : Math.PI + .5); g.stroke(); });
    withA(E(lt, at(2, .5)), () => { bubble(1400, 450, 720, 250, 'bl'); txt('CAREFUL!', 1400, 395, { size: 66, weight: 700, color: COL.red }); txt('they might think less of you', 1400, 485, { size: 42, font: 'Nunito', weight: 800 }); });
    txt('EMBARRASSMENT = SOCIAL ALARM', 960, 120, { size: 64, weight: 700, alpha: E(lt, at(2, .3)) });
  }, () => {
    paperBg('#EDEAF4');
    const a = B(lt, at(3, .12)), b = B(lt, at(3, .35));
    g.save(); scaleAt(540, 520, a); card(540, 520, 680, 640, 1, '#FFF7DC'); txt('EMBARRASSMENT', 540, 270, { size: 60, weight: 700, color: dark(COL.sam, .3) }); txt('"I did something awkward"', 540, 360, { size: 38, font: 'Nunito', weight: 800 });
    ch(P_(SAM, { x: 540, y: 780, s: 1, expr: lt > at(3, .75) ? 'joy' : 'nervous' })); withA(E(lt, at(3, .75)), () => txt('ha... oops', 540, 470, { size: 40, weight: 700, color: COL.alex })); g.restore();
    g.save(); scaleAt(1380, 520, b); card(1380, 520, 680, 640, 1, '#DCDDE6'); txt('SHAME', 1380, 270, { size: 60, weight: 700, color: COL.ink2 }); txt('"I am bad"', 1380, 360, { size: 38, font: 'Nunito', weight: 800 });
    g.fillStyle = COL.ink; rr(1290, 420, 180, 120, 16); g.fill(); txt('heavy', 1380, 482, { size: 40, weight: 700, color: '#fff' }); ch({ x: 1380, y: 800, c: '#9AA0AE', s: .9, expr: 'sad', sd: 4 }); g.restore();
    pill('lighter, and often funny later', 540, 940, { p: B(lt, at(3, .7)), bg: COL.sam, color: COL.ink, size: 38 });
    source('Tangney et al. (1996), embarrassment vs. shame', E(lt, at(3, .5)));
  }]);
};
S.pain = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1], [() => {
    paperBg('#EEF1F6'); const m = E(lt, .4, 1.2);
    g.globalAlpha = .75; g.fillStyle = COL.red; g.beginPath(); g.arc(lerp(520, 800, m), 520, 280, 0, 7); g.fill(); g.fillStyle = '#5B8DEF'; g.beginPath(); g.arc(lerp(1400, 1120, m), 520, 280, 0, 7); g.fill(); g.globalAlpha = 1;
    txt('PHYSICAL PAIN', lerp(470, 700, m), 520, { size: 46, weight: 700, color: COL.white }); txt('SOCIAL PAIN', lerp(1450, 1220, m), 520, { size: 46, weight: 700, color: COL.white });
    pill('some shared brain regions', 960, 880, { p: B(lt, at(0, .2)), bg: COL.ink, size: 42 });
    stamp('STILL DEBATED', 960, 170, E(lt, at(0, .42), .4), '#C9752B', -.06, 72);
    withA(E(lt, at(0, .75)), () => { g.fillStyle = 'rgba(255,255,255,.0)'; }); source('Eisenberger et al. (2003); later studies question how close the overlap is', E(lt, at(0, .4)));
  }, () => {
    paperBg('#EEF1F6'); txt('THE NEGATIVITY BIAS', W / 2, 120, { size: 76, weight: 700, alpha: B(lt, L[1]) });
    const tilt = E(lt, at(1, .6), 1) * .22; const cx = 960, cy = 420;
    g.fillStyle = COL.ink; g.beginPath(); g.moveTo(cx - 80, 900); g.lineTo(cx + 80, 900); g.lineTo(cx + 12, cy); g.lineTo(cx - 12, cy); g.fill();
    g.save(); g.translate(cx, cy); g.rotate(-tilt); line(-520, 0, 520, 0, 16, COL.ink); g.restore();
    const lx = cx - Math.cos(tilt) * 520, ly = cy + Math.sin(tilt) * 520, rx = cx + Math.cos(tilt) * 520, ry = cy - Math.sin(tilt) * 520;
    [[lx, ly], [rx, ry]].forEach(([x, y]) => { line(x, y, x - 120, y + 200, 4, COL.ink2); line(x, y, x + 120, y + 200, 4, COL.ink2); g.fillStyle = '#B0A7A0'; g.beginPath(); g.moveTo(x - 160, y + 200); g.lineTo(x + 160, y + 200); g.quadraticCurveTo(x, y + 280, x - 160, y + 200); g.fill(); });
    withA(B(lt, at(1, .25)), () => { g.fillStyle = '#3A3F55'; rr(lx - 80, ly + 80, 160, 120, 20); g.fill(); txt('1 awkward', lx, ly + 125, { size: 32, color: '#fff' }); txt('comment', lx, ly + 165, { size: 32, color: '#fff' }); });
    for (let i = 0; i < 10; i++) { const p = B(lt, at(1, .4) + i * .06); heart(rx - 110 + (i % 5) * 55, ry + 175 - Math.floor(i / 5) * 45, 1.2 * p, COL.red); }
    txt('10 compliments', rx, ry + 300, { size: 36, weight: 700, alpha: E(lt, at(1, .5)) });
    source('Baumeister et al. (2001), "Bad is stronger than good"', E(lt, at(1, .4)));
  }]);
};
S.teen = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#EDEAF4'); chapter(3, 'Why so many are from your teens', lt);
    const cards = [['age 14', -.12, 380, 330], ['age 15', .08, 760, 280], ['age 16', -.05, 1150, 340], ['age 13', .1, 1530, 300], ['age 17', -.08, 560, 640], ['age 15', .06, 1340, 650]];
    cards.forEach(([s, r, x, y], i) => memCard(x, y, 300, 150, ['school play', 'first crush', 'braces', 'class photo', 'the dance', 'voice crack'][i], { sub: s, rot: r, size: 38, a: B(lt, .4 + i * .25) }));
    withA(E(lt, at(0, .6)), () => { card(W / 2, 900, 1000, 120); txt('not a coincidence', W / 2, 902, { size: 52, weight: 700 }); });
  }, () => {
    paperBg('#EDEAF4'); txt('THE REMINISCENCE BUMP', W / 2, 120, { size: 76, weight: 700 });
    const x0 = 260, x1 = 1660, yb = 860, age = a => x0 + (x1 - x0) * a / 70, f = a => 40 + 300 * Math.exp(-Math.pow((a - 20) / 7, 2)) + 260 * Math.exp(-Math.pow((a - 70) / 6, 2)) + 30;
    line(x0, yb, x1, yb, 6, COL.ink); line(x0, yb, x0, 300, 6, COL.ink); txt('age at the time', W / 2, yb + 90, { size: 36, font: 'Nunito', weight: 800 }); txt('how many memories', x0 + 10, 250, { size: 32, font: 'Nunito', weight: 800, align: 'left' });
    [0, 10, 20, 30, 40, 50, 60, 70].forEach(a => txt(String(a), age(a), yb + 40, { size: 32, weight: 600, color: COL.ink2 }));
    const p = E(lt, L[1] + .2, 1.6); g.save(); g.beginPath(); g.rect(0, 0, x0 + (x1 - x0) * p, H); g.clip();
    g.beginPath(); g.moveTo(x0, yb); for (let a = 0; a <= 70; a += .5) g.lineTo(age(a), yb - f(a) + (a < 3 ? 40 : 0)); g.lineTo(x1, yb); g.closePath(); g.fillStyle = 'rgba(123,108,246,.25)'; g.fill();
    g.beginPath(); for (let a = 0; a <= 70; a += .5) g.lineTo(age(a), yb - f(a) + (a < 3 ? 40 : 0)); g.lineWidth = 7; g.strokeStyle = COL.max; g.stroke(); g.restore();
    withA(E(lt, at(1, .4)), () => { g.fillStyle = 'rgba(242,184,75,.25)'; g.fillRect(age(10), 300, age(30) - age(10), yb - 300); });
    pill('ages ~10–30', age(20), 330, { p: B(lt, at(1, .45)), bg: COL.sam, color: COL.ink, size: 38 });
    ['first crush', 'first job', 'first big mistakes'].forEach((s, i) => pill(s, 1300, 360 + i * 80, { p: B(lt, at(1, .7) + i * .3), bg: COL.ink, size: 34 }));
    txt('(for someone looking back at age 70)', age(52), 720, { size: 28, font: 'Nunito', weight: 700, color: COL.ink2, alpha: E(lt, at(1, .5)) });
    source('Rubin et al., research on autobiographical memory', E(lt, at(1, .3)));
  }, () => {
    paperBg('#F6E3DC'); txt('EMBARRASSMENT WHEN WATCHED BY A PEER', W / 2, 120, { size: 62, weight: 700 });
    const base = 820; [['children', .55, COL.ivy, .25], ['teens', 1, COL.alex, .45], ['adults', .55, COL.max, .65]].forEach(([s, v, c, f], i) => { const x = 620 + i * 340, p = E(lt, at(2, f), .8);
      bar(x, base, 200, 520, c, v * p); txt(s, x, base + 60, { size: 44, weight: 700 }); });
    line(400, base, 1500, base, 7, COL.ink);
    ch(P_(SAM, { x: 1700, y: 900, s: .9, expr: 'scared', sweat: true, c: mix(COL.sam, '#E63946', .3) })); eyes(1700, 420, 1.4, 1700, 900, E(lt, at(2, .3)), 2);
    source('Somerville et al. (2013), Psychological Science; illustrative', E(lt, at(2, .3)));
  }, () => {
    paperBg('#F7EDD3'); txt('THE RECIPE', W / 2, 130, { size: 80, weight: 700 });
    const a = B(lt, at(3, .2)), b = B(lt, at(3, .45)), c = B(lt, at(3, .75));
    g.save(); scaleAt(400, 520, a); card(400, 520, 460, 340); txt('lots of firsts', 400, 520, { size: 52, weight: 700 }); g.restore();
    txt('+', 760, 520, { size: 100, weight: 700, alpha: b });
    g.save(); scaleAt(1110, 520, b); card(1110, 520, 520, 340); wrap('max sensitivity to embarrassment', 1110, 520, 440, 60, { size: 48, weight: 700 }); g.restore();
    txt('=', W / 2, 800, { size: 100, weight: 700, alpha: c });
    withA(c, () => { g.fillStyle = '#8C6A4E'; rr(1420, 700, 360, 260, 18); g.fill(); for (let i = 0; i < 4; i++) memCard(1600, 690 - i * 26, 300, 60, ['braces', 'voice crack', 'the dance', 'school play'][i], { size: 26, rot: (i - 1.5) * .05 }); txt('lifetime cringe collection', 1600, 1010, { size: 36, weight: 700 }); });
  }]);
};
S.popup = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#F7EDD3'); chapter(4, 'Why it pops up out of nowhere', lt);
    const op = E(lt, at(0, .45), .3); const bx = 1150, by = 760;
    g.fillStyle = '#5B8DEF'; rr(bx - 170, by - 260, 340, 280, 16); g.fill(); g.fillStyle = '#4A78D0'; g.fillRect(bx - 170, by - 120, 340, 20);
    line(bx + 170, by - 150, bx + 240, by - 150, 12, COL.ink); line(bx + 240, by - 150, bx + 240 + Math.cos(TT * 4) * 40, by - 150 + Math.sin(TT * 4) * 40, 12, COL.ink);
    const spring = op * (1 + .12 * Math.sin((lt - at(0, .45)) * 14) * Math.exp(-(lt - at(0, .45)) * 2));
    if (op > 0) { g.strokeStyle = COL.ink2; g.lineWidth = 8; g.beginPath(); for (let i = 0; i <= 12; i++) g.lineTo(bx + (i % 2 ? -30 : 30), by - 260 - i * 22 * spring); g.stroke(); memCard(bx, by - 330 - 264 * spring, 360, 130, '"You too!"', { size: 56, rot: Math.sin(TT * 5) * .08 }); }
    g.save(); g.translate(bx - 170, by - 260); g.rotate(-op * 1.9); g.fillStyle = '#3E6BC0'; g.fillRect(0, -18, 340, 22); g.restore();
    ch(P_(SAM, { x: 540, y: 900, s: 1.3, expr: op > .5 ? 'scared' : 'smile', look: 1, hop: op > .5 ? 10 * E(lt, at(0, .45), .2) : 0 }));
  }, () => {
    paperBg('#F7EDD3'); txt('INVOLUNTARY MEMORIES', W / 2, 150, { size: 80, weight: 700, alpha: B(lt, L[1]) });
    const who = [IVY, SAM, ALEX, MAX, { c: EX[2], sd: 9 }];
    who.forEach((c, i) => { const x = 300 + i * 330; ch(P_(c, { x, y: 940, s: 1, expr: 'o' })); const ph = (lt - L[1] - i * .5) % 2.6; const a = ph > 0 && ph < 1.6 ? E(ph, 0, .2) * (1 - E(ph, 1.3, .3)) : 0;
      withA(a, () => { thought(x + 30, 540, 200, 110); txt(['oops', '!!', 'ugh', 'why?!', '...'][i], x + 30, 542, { size: 44, weight: 700 }); }); });
    txt('normal, and almost everyone has them', W / 2, 260, { size: 44, font: 'Nunito', weight: 800, color: COL.ink2, alpha: E(lt, at(1, .5)) });
  }, () => {
    paperBg('#F7EDD3'); txt('TRIGGERED BY A CUE', W / 2, 120, { size: 72, weight: 700 });
    const tx = 1460, ty = 560; memCard(tx, ty, 420, 160, '"You too!"', { size: 60, hl: E(lt, at(2, .85), .5) });
    const cues = [[.12, 'a waiter'], [.28, 'a song'], [.42, 'a smell'], [.6, 'a similar word']];
    cues.forEach(([f, s], i) => { const y = 260 + i * 190, x = 420, p = B(lt, at(2, f)); withA(p, () => { g.save(); scaleAt(x, y, p); card(x, y, 400, 150);
      if (i === 0) waiter(x - 120, y + 60, .42); if (i === 1) { note(x - 140, y + 20, 1.3, 1); note(x - 100, y + 6, 1.1, 1); }
      if (i === 2) { g.strokeStyle = COL.ink2; g.lineWidth = 6; for (let k = 0; k < 3; k++) { g.beginPath(); for (let j = 0; j < 6; j++) g.lineTo(x - 160 + k * 26 + Math.sin(j + TT * 3) * 8, y + 40 - j * 16); g.stroke(); } }
      if (i === 3) txt('"two"', x - 140, y, { size: 34, weight: 700, color: COL.max });
      txt(s, x + 60, y, { size: 38, weight: 600 }); g.restore(); });
      const lp = E(lt, at(2, f) + .2, .5); if (lp > 0) { g.setLineDash([12, 10]); line(x + 200, y, lerp(x + 200, tx - 210, lp), lerp(y, ty, lp), 5, COL.ink2); g.setLineDash([]); } });
  }, () => {
    paperBg('#E8EEF7'); txt('WHEN YOUR MIND IS IDLE', W / 2, 120, { size: 72, weight: 700 });
    [['shower', .1], ['walk', .3], ['bed', .55]].forEach(([s, f], i) => { const x = 360 + i * 600, p = B(lt, at(3, f)); withA(E(lt, at(3, f), .3), () => { g.save(); scaleAt(x, 600, p); card(x, 600, 520, 620);
      if (i === 0) { g.fillStyle = '#BFE3F2'; rr(x - 250, 300, 500, 590, 28); g.fill(); line(x + 120, 340, x + 120, 300, 10, COL.ink2); g.fillStyle = COL.ink2; rr(x + 60, 330, 120, 30, 12); g.fill();
        g.fillStyle = '#5B8DEF'; for (let k = 0; k < 12; k++) { const yy = 380 + ((TT * 400 + k * 53) % 300); g.fillRect(x + 70 + (k * 23) % 100, yy, 4, 16); } ch(P_(SAM, { x: x - 20, y: 860, s: .9, expr: 'calm' })); }
      if (i === 1) { g.fillStyle = '#DDEFD6'; rr(x - 250, 300, 500, 590, 28); g.fill(); for (let k = 0; k < 3; k++) { const tx2 = x - 300 + ((k * 230 - TT * 60) % 690 + 690) % 690; g.fillStyle = '#4E8A5B'; g.beginPath(); g.arc(tx2, 520, 60, 0, 7); g.fill(); g.fillStyle = '#7A5A3A'; g.fillRect(tx2 - 10, 570, 20, 120); }
        ch(P_(SAM, { x, y: 860, s: .9, expr: 'neutral', hop: Math.abs(Math.sin(TT * 6)) * 6 })); }
      if (i === 2) { g.fillStyle = '#2C3360'; rr(x - 250, 300, 500, 590, 28); g.fill(); g.fillStyle = '#E8E2F0'; rr(x - 220, 740, 440, 70, 24); g.fill(); lying(P_(SAM, { x: x - 40, y: 740, s: .7, expr: 'o' })); blanket(x + 0, x + 220, 700); }
      txt(s, x, 960, { size: 46, weight: 700 }); g.restore();
      const tb = E(lt, at(3, f) + .5, .4); withA(tb, () => { thought(x + 120, 360, 200, 90); txt('"you too"', x + 120, 362, { size: 32, weight: 700 }); }); }); });
  }, () => {
    paperBg('#E3E6EE'); txt('MOOD-CONGRUENT MEMORY', W / 2, 120, { size: 72, weight: 700 });
    ch(P_(SAM, { x: 480, y: 920, s: 1.4, expr: 'tired' })); cloud(480, 330, 1.2, true);
    g.fillStyle = '#8C6A4E'; rr(1000, 360, 700, 560, 20); g.fill();
    const k = E(lt, at(4, .35), 1.2); const cards = [['birthday', 0], ['"you too!"', 1], ['vacation', 0], ['failed test', 1], ['tripped', 1], ['best day', 0]];
    cards.forEach(([s, sad], i) => { const y = 440 + i * 76, out = sad ? k * 120 : 0; memCard(1350 - out, y, 420, 64, s, { size: 30, fill: sad ? mix('#FFFFFF', '#9DB4C0', k) : '#FFFFFF', a: sad ? 1 : 1 - k * .5 }); });
    txt('a low mood pulls up low memories', 1350, 990, { size: 40, font: 'Nunito', weight: 800, alpha: E(lt, at(4, .5)) });
  }, () => {
    paperBg('#F7EDD3'); txt('REPLAY = PRACTICE', W / 2, 140, { size: 76, weight: 700 });
    const n = Math.floor(clamp((lt - L[5] - .3) / (Le[5] - L[5] - .3)) * 20) + 1; const bold = clamp(n / 20);
    g.save(); g.translate(960, 560); g.scale(1 + bold * .35, 1 + bold * .35); memCard(0, 0, 520, 220, '"You too!"', { size: 70 + bold * 10, hl: bold }); g.restore();
    g.lineWidth = 4 + bold * 14; g.strokeStyle = COL.ink; rr(960 - 270 * (1 + bold * .35), 560 - 115 * (1 + bold * .35), 540 * (1 + bold * .35), 230 * (1 + bold * .35), 22); g.stroke();
    g.fillStyle = COL.red; g.beginPath(); g.arc(1500, 300, 70, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(1480, 265); g.lineTo(1530, 300); g.lineTo(1480, 335); g.fill();
    pill('replayed ×' + n, 1500, 420, { bg: COL.ink, size: 44 });
  }]);
};
S.twist = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6], [() => {
    paperBg('#EDEAF4'); chapter(5, 'Plot twist', lt); confetti(lt, .2);
    const p = B(lt, .2, .6); g.save(); g.translate(W / 2, 480); g.rotate(-.05); g.scale(p, p); txt('PLOT TWIST', 0, 0, { size: 180, weight: 700, color: COL.max }); g.restore();
    txt('...nobody remembers it.', W / 2, 700, { size: 60, font: 'Nunito', weight: 800, alpha: E(lt, at(0, .5)) });
  }, () => {
    room({ door: 0 });
    const cone = g.createLinearGradient(0, 0, 0, H); cone.addColorStop(0, 'rgba(255,240,200,0)'); cone.addColorStop(1, 'rgba(255,240,200,.35)'); g.fillStyle = cone; g.beginPath(); g.moveTo(920, 0); g.lineTo(1000, 0); g.lineTo(1120, 900); g.lineTo(850, 900); g.fill();
    [[400, 0, 1], [560, 3, -1], [1300, 1, 1], [1450, 5, -1], [1600, 2, -1]].forEach(([x, ci, lk], i) => ch({ x, y: 880, c: EX[ci], s: .92, expr: 'smile', look: lk, sd: i, arms: i % 2 ? 'cup' : 'down' }));
    ch(P_(SAM, { x: 985, y: 900, s: 1, expr: 'nervous', sweat: true }));
    card(W / 2, 170, 1000, 150, B(lt, at(1, .3))); txt('the spotlight effect', W / 2, 172, { size: 60, alpha: B(lt, at(1, .3)) });
    withA(E(lt, at(1, .6)), () => { [[400, 'talking'], [1450, 'snacks?'], [1600, 'phone']].forEach(([x, s]) => { thought(x, 560, 200, 80); txt(s, x, 562, { size: 32, font: 'Nunito', weight: 800 }); }); });
  }, () => {
    paperBg('#F6E3DC'); txt('THE ILLUSION OF TRANSPARENCY', W / 2, 120, { size: 70, weight: 700 });
    [['HOW IT FEELS', 1], ['HOW IT LOOKS', 0]].forEach(([s, big], i) => { const x = 560 + i * 800, p = B(lt, at(2, .1 + i * .4)); withA(E(lt, at(2, .1 + i * .4), .3), () => { g.save(); scaleAt(x, 580, p); card(x, 580, 640, 720); txt(s, x, 290, { size: 54, weight: 700, color: COL.alex });
      ch(P_(SAM, { x, y: 860, s: 1.3, c: big ? mix(COL.sam, '#E63946', .65) : COL.sam, expr: big ? 'scared' : 'smile', sweat: !!big, shake: big ? .6 : 0 }));
      if (big) { for (let k = 0; k < 3; k++) { const a = (TT * .8 + k * .33) % 1; withA(1 - a, () => cloud(x - 60 + k * 60, 470 - a * 100, .35)); } }
      else { g.fillStyle = 'rgba(231,90,80,.35)'; ell(x - 50, 860 - 1.3 * 150, 16, 9); g.fill(); ell(x + 50, 860 - 1.3 * 150, 16, 9); g.fill(); }
      g.restore(); }); });
  }, () => {
    paperBg('#EEF1F6'); txt('HOW HARSHLY WILL THEY JUDGE ME?', W / 2, 130, { size: 66, weight: 700 });
    const base = 860; bar(680, base, 300, 560, COL.red, E(lt, at(3, .45), 1)); bar(1240, base, 300, 560, COL.ivy, .42 * E(lt, at(3, .7), 1)); line(420, base, 1500, base, 8, COL.ink);
    wrap('what people EXPECTED', 680, base + 70, 420, 50, { size: 40, weight: 700, alpha: E(lt, at(3, .45)) }); wrap('what others ACTUALLY thought', 1240, base + 70, 460, 50, { size: 40, weight: 700, alpha: E(lt, at(3, .7)) });
    source('Savitsky, Epley & Gilovich (2001), illustrative, not to scale', E(lt, at(3, .5)));
  }, () => {
    paperBg('#F4EDE1');
    g.fillStyle = '#D9C9B0'; g.fillRect(0, 880, W, 200); g.fillStyle = '#8C5A3C'; g.fillRect(1560, 380, 220, 500); txt('KITCHEN', 1670, 340, { size: 44, weight: 700 });
    const wx = lerp(1050, 1640, E(lt, L[4], 3)); waiter(wx, 900, 1.1, { flip: true, arms: 'cup', expr: 'smile' });
    withA(E(lt, at(4, .2)), () => { thought(wx - 40, 430, 280, 120); g.fillStyle = '#F2B84B'; g.beginPath(); g.arc(wx - 40, 432, 40, 0, 7); g.fill(); g.fillStyle = COL.red; [[-14, -8], [12, 6], [-4, 18]].forEach(([a, b]) => { g.beginPath(); g.arc(wx - 40 + a, 432 + b, 8, 0, 7); g.fill(); }); txt('pizza for table 6', wx - 40, 520, { size: 26, font: 'Nunito', weight: 800 }); });
    ch(P_(SAM, { x: 420, y: 920, s: 1.4, expr: 'sad', arms: 'hug' }));
    withA(B(lt, at(4, .55)), () => { g.save(); g.translate(560, 640); g.rotate(-.1); g.fillStyle = COL.ink; rr(-110, -60, 220, 120, 12); g.fill(); g.fillStyle = '#fff'; rr(-80, -30, 160, 46, 6); g.fill(); txt('"you too"', 0, -6, { size: 30, weight: 700 }); g.restore();
      pill('the only copy', 560, 500, { bg: COL.red, size: 40 }); });
  }, () => {
    paperBg('#EEF1F6'); txt('THE SELF-REFERENCE EFFECT', W / 2, 110, { size: 72, weight: 700, alpha: B(lt, at(5, .45)) });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const i = r * 6 + c, x = 290 + c * 268, y = 450 + r * 290; g.fillStyle = '#C9B79C'; rr(x - 100, y - 30, 200, 40, 8); g.fill();
      ch({ x, y: y - 20, c: EX[i % 7], s: .62, expr: ['smile', 'o', 'joy', 'neutral'][i % 4], sd: i, alpha: lerp(1, .35, E(lt, at(5, .3), 1)) });
      withA(E(lt, at(5, .12) + i * .05, .3) * (1 - E(lt, at(5, .32), .5)), () => { thought(x + 20, y - 250, 120, 60); txt(['oops', 'uh..', '!?'][i % 3], x + 20, y - 248, { size: 26, weight: 700 }); }); }
    withA(E(lt, at(5, .3), .6), () => { txt('???', 960, 300, { size: 90, weight: 700, color: COL.ink2 }); });
    withA(E(lt, at(5, .6)), () => { ch(P_(SAM, { x: 960, y: 1060, s: .95, expr: 'nervous', glow: 1 })); pill('main character', 960, 800, { bg: COL.sam, color: COL.ink, size: 40 }); });
    source('Rogers, Kuiper & Kirker (1977)', E(lt, at(5, .5)));
  }, () => {
    paperBg('#E2EFEB'); txt('THE BRIGHT SIDE OF BLUSHING', W / 2, 120, { size: 72, weight: 700, color: COL.ivy });
    ch(P_(SAM, { x: 960, y: 900, s: 1.5, expr: 'smile' })); g.fillStyle = 'rgba(231,90,80,.55)'; ell(905, 900 - 1.5 * 150, 22, 12); g.fill(); ell(1015, 900 - 1.5 * 150, 22, 12); g.fill();
    [[520, IVY], [1400, MAX], [300, { c: EX[2], sd: 9 }]].forEach(([x, c], i) => { ch(P_(c, { x, y: 900, s: 1.1, expr: 'joy', look: x < 960 ? 1 : -1 })); heart(x + 30, 520 - Math.abs(Math.sin(TT * 3 + i)) * 20, 1.6 * B(lt, at(6, .3) + i * .2)); });
    pill('more trustworthy', 960, 300, { p: B(lt, at(6, .35)), bg: COL.ivy, size: 48 }); pill('people want you around', 960, 400, { p: B(lt, at(6, .55)), bg: COL.sam, color: COL.ink, size: 40 });
    source('Feinberg, Willer & Keltner (2012), "Flustered and faithful"', E(lt, at(6, .3)));
  }]);
};
S.helps = (lt, L, Le, D, at) => {
  const tag = (n, s) => { g.fillStyle = COL.ink; rr(60, 60, 120 + s.length * 26, 80, 40); g.fill(); g.fillStyle = COL.sam; g.beginPath(); g.arc(100, 100, 28, 0, 7); g.fill(); txt(String(n), 100, 102, { size: 36, weight: 700 }); txt(s, 145, 102, { size: 40, color: '#fff', align: 'left' }); };
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6, 7], [() => {
    paperBg('#E2EFEB'); chapter(6, 'How to make it hurt less', lt);
    txt('HOW TO MAKE IT HURT LESS', W / 2, 380, { size: 100, weight: 700, alpha: B(lt, .3) });
    [1, 2, 3, 4, 5].forEach(i => { const p = B(lt, .8 + i * .2); g.fillStyle = COL.ivy; g.beginPath(); g.arc(390 + i * 190, 620, 64 * p, 0, 7); g.fill(); txt(String(i), 390 + i * 190, 624, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#E8EEF7'); tag(1, 'Be a fly on the wall');
    g.fillStyle = '#F4EDE1'; rr(560, 260, 1000, 660, 24); g.fill(); g.lineWidth = 8; g.strokeStyle = COL.ink; g.stroke();
    g.save(); rr(560, 260, 1000, 660, 24); g.clip(); g.fillStyle = '#FBE6C8'; g.fillRect(560, 260, 1000, 660); g.fillStyle = '#C98B5B'; rr(1000, 760, 300, 30, 8); g.fill();
    waiter(860, 900, .7); ch(P_(SAM, { x: 1180, y: 900, s: .7, expr: 'joy' })); bubble(1220, 560, 200, 80, 'br'); txt('You too!', 1220, 562, { size: 32, font: 'Nunito', weight: 800 }); g.restore();
    fly(300, 400, 2.2); g.setLineDash([12, 10]); line(340, 410, 600, 520, 5, COL.ink2); g.setLineDash([]);
    wrap('watch it from the outside', 290, 560, 400, 46, { size: 34, font: 'Nunito', weight: 800, alpha: E(lt, at(1, .4)) });
    const t = lerp(.9, .35, E(lt, at(1, .55), 1.5)); g.fillStyle = '#fff'; rr(1680, 300, 70, 520, 35); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke(); bar(1715, 800, 46, 480, t > .6 ? COL.red : COL.sam, t);
    txt('upset', 1715, 870, { size: 34, weight: 700 }); source('Kross & Ayduk: self-distancing research', E(lt, at(1, .3)));
  }, () => {
    paperBg('#F7EDD3'); tag(2, 'Talk to yourself by name');
    ch(P_(SAM, { x: 400, y: 920, s: 1.5, expr: lt > at(2, .45) ? 'smile' : 'worried', look: 1 }));
    withA(E(lt, at(2, .1)), () => { bubble(1100, 380, 860, 150, 'bl'); txt('"Why did I do that?!"', 1100, 382, { size: 54, weight: 700 }); strike(1100, 382, 640, E(lt, at(2, .38), .4)); });
    withA(E(lt, at(2, .45)), () => { bubble(1100, 680, 1000, 190, 'bl', 1, '#FFF7DC'); wrap('"Sam, everyone says weird things sometimes."', 1100, 680, 880, 64, { size: 52, weight: 700, color: dark(COL.sam, .3) }); });
    source('Kross et al. (2014), "Self-talk as a regulatory mechanism"', E(lt, at(2, .7)));
  }, () => {
    paperBg('#E2EFEB'); tag(3, 'What would you tell a friend?');
    g.fillStyle = '#9C8C76'; rr(460, 640, 1000, 220, 50); g.fill(); g.fillStyle = '#B0A089'; rr(420, 560, 140, 300, 50); g.fill(); rr(1360, 560, 140, 300, 50); g.fill();
    ch(P_(IVY, { x: 780, y: 800, s: 1.3, expr: 'joy', look: 1, arms: 'up' })); ch(P_(SAM, { x: 1140, y: 800, s: 1.3, expr: lt > at(3, .4) ? 'joy' : 'nervous', look: -1 }));
    withA(E(lt, at(3, .3)), () => { txt('HA HA', 960, 360, { size: 70, weight: 700, color: COL.ivy }); });
    pill('self-compassion', 960, 960, { p: B(lt, at(3, .65)), bg: COL.ivy, size: 48 });
  }, () => {
    paperBg('#F7EDD3'); tag(4, 'Find the funny side');
    const k = E(lt, at(4, .55), .8);
    card(560, 560, 620, 520, 1, mix('#D9DCE6', '#FFF4D6', k)); txt(k > .5 ? 'best party story' : 'horror story', 560, 380, { size: 50, weight: 700, color: k > .5 ? dark(COL.sam, .3) : COL.ink2 });
    ch(P_(SAM, { x: 560, y: 760, s: 1.1, expr: k > .5 ? 'joy' : 'worried', sweat: k < .5 }));
    [[1200, IVY], [1420, MAX], [1640, { c: EX[2], sd: 9 }]].forEach(([x, c], i) => { ch(P_(c, { x, y: 900, s: 1, expr: k > .5 ? 'joy' : 'smile', arms: k > .5 ? 'up' : 'down', look: -1, alpha: E(lt, at(4, .6) + i * .15, .4) })); });
    withA(k, () => txt('HA HA HA', 1420, 520, { size: 60, weight: 700, color: COL.alex }));
    source('Samson & Gross (2012), humor as emotion regulation', E(lt, at(4, .3)));
  }, () => {
    paperBg('#EEF1F6'); tag(5, 'Don\'t fight it, let it pass');
    const half = at(5, .62);
    withA(1 - E(lt, half, .4), () => { ch(P_(SAM, { x: 420, y: 920, s: 1.4, expr: 'worried', sweat: true })); thought(1100, 470, 760, 520);
      const k = 1 + E(lt, at(5, .2), 2.5) * .9; bear(1100, 480, k * 1.4); txt("DON'T think about the white bear", 1100, 860, { size: 44, weight: 700, color: COL.red }); });
    withA(E(lt, half, .4), () => { g.fillStyle = '#9AA3B5'; g.fillRect(0, 760, W, 160); g.fillStyle = '#fff'; for (let i = 0; i < 10; i++) g.fillRect(i * 220 + 40, 834, 120, 12);
      car(lerp(-300, 2200, clamp((lt - half) / (Le[5] - half + .6))), 840, 1.1, '"you too"'); ch(P_(SAM, { x: 260, y: 740, s: 1.1, expr: 'calm' })); });
    source('Wegner et al. (1987), thought suppression', E(lt, at(5, .3)));
  }, () => {
    paperBg('#E2EFEB');
    card(W / 2, 520, 1240, 560, B(lt, L[6] + .2)); withA(E(lt, L[6] + .2), () => { txt('When to get help', W / 2, 310, { size: 70, weight: 700, color: COL.ivy });
      ['memories are constant', 'very distressing', 'stopping you from living your life'].forEach((s, i) => { const t0 = at(6, .12 + i * .14); check(620, 430 + i * 100, 1.3, E(lt, t0, .4), COL.ivy); txt(s, 690, 432 + i * 100, { size: 46, font: 'Nunito', weight: 800, align: 'left', alpha: E(lt, t0, .4) }); });
      pill('talk to a professional: it is very treatable', W / 2, 740, { p: B(lt, at(6, .6)), bg: COL.ivy, size: 40 }); });
  }, () => {
    paperBg('#F6E3DC');
    const p = B(lt, L[7] + .3, .6); heart(960, 420, 11.5 * p * (1 + .04 * Math.sin(TT * 4)), COL.red);
    txt('it means you care', 960, 320, { size: 54, weight: 700, color: '#fff', alpha: E(lt, at(7, .55)) });
    [[IVY, 560], [SAM, 820], [ALEX, 1100], [MAX, 1360]].forEach(([c, x], i) => ch(P_(c, { x, y: 960, s: .9, expr: 'smile', arms: i % 2 ? 'wave' : 'down', alpha: B(lt, at(7, .3) + i * .1) })));
  }]);
};
S.outro2 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 2, 4], [() => {
    bedroom({ clock: '2:14' }); lying(P_(SAM, { x: 690, y: 700, s: 1, expr: 'calm' })); blanket(760, 1380, 660);
    for (let i = 0; i < 3; i++) { const a = (lt * .5 + i * .33) % 1; txt('z', 780 + a * 120 + i * 10, 560 - a * 140, { size: 40 + i * 10, color: '#B9C3F0', alpha: clamp(1 - a) }); }
    withA(E(lt, at(0, .4)) * (1 - E(lt, at(1, .55))), () => { thought(1180, 290, 520, 170); memCard(1180, 290, 300, 90, '"you too"', { size: 40, a: .6 }); });
    withA(E(lt, at(1, .4)), () => { card(1260, 290, 800, 170); txt('an old alarm, a bit too loud', 1260, 270, { size: 48, weight: 700 }); txt('...and nobody else remembers', 1260, 330, { size: 36, font: 'Nunito', weight: 800, color: COL.ink2 }); });
  }, () => {
    paperBg(); txt("What's your most unforgettable cringe moment?", W / 2, 200, { size: 68, weight: 700, alpha: B(lt, L[2]) });
    bubble(W / 2, 470, 900, 200, 'bl', B(lt, at(2, .3))); txt('tell me in the comments ↓', W / 2, 472, { size: 56, font: 'Nunito', weight: 800, alpha: E(lt, at(2, .3)) });
    [[IVY, 560], [SAM, 820], [ALEX, 1100], [MAX, 1360]].forEach(([c, x], i) => ch(P_(c, { x, y: 960, s: 1, expr: i === 1 ? 'nervous' : 'joy', arms: i % 2 ? 'wave' : 'up' })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); txt('Thanks for watching!', W / 2, 330, { size: 110, weight: 700, color: COL.white }); txt('See you in the next one.', W / 2, 450, { size: 52, font: 'Nunito', weight: 800, color: COL.sam });
    [[IVY, 560], [SAM, 820], [ALEX, 1100], [MAX, 1360]].forEach(([c, x], i) => ch(P_(c, { x, y: 960, s: 1.05, expr: 'joy', arms: 'wave' })));
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  bedroom({ clock: '2:00' }); g.fillStyle = 'rgba(15,18,40,.45)'; g.fillRect(0, 0, W, H);
  const gl = g.createRadialGradient(560, 700, 50, 560, 700, 520); gl.addColorStop(0, 'rgba(242,184,75,.35)'); gl.addColorStop(1, 'rgba(242,184,75,0)'); g.fillStyle = gl; g.fillRect(0, 150, 1200, 930);
  ch(P_(SAM, { x: 540, y: 1330, s: 3, expr: 'scared', sweat: true }));
  g.fillStyle = '#6C8EBF'; rr(-40, 880, 1160, 300, 60); g.fill(); g.fillStyle = '#86A5D1'; rr(-40, 880, 1160, 70, 35); g.fill();
  [[400, 885, -1], [690, 885, 1]].forEach(([x, y, k]) => { g.fillStyle = dark(COL.sam, .12); ell(x, y, 46, 30, k * .3); g.fill(); });
  memCard(1430, 600, 640, 240, '"You too!"', { size: 104, hl: 1, rot: .06 });
  g.save(); g.translate(1430, 430); g.rotate(.06); pill('waiter: "enjoy your meal!"', 0, 0, { bg: COL.ink, size: 38 }); g.restore();
  g.save(); g.translate(W / 2, 140); g.rotate(-.02); g.font = '700 140px Fredoka'; const a = 'WHY CAN\'T I ', b = 'FORGET THIS?'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 140, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 140, weight: 700, color: COL.sam, align: 'left' }); g.restore();
  finish(); };
