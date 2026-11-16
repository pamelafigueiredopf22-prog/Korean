// Video 08 scenes: "Why You Can't Stop Scrolling". Uses engine/core.js helpers.

// ---------- helpers for this video
function heading(s, y = 120, c = COL.ink, size = 76) { txt(s, W / 2, y, { size, weight: 700, color: c }); }
function tipTag8(n, s) { g.fillStyle = COL.ink; rr(60, 60, 120 + s.length * 26, 80, 40); g.fill(); g.fillStyle = COL.sam; g.beginPath(); g.arc(100, 100, 28, 0, 7); g.fill(); txt(String(n), 100, 102, { size: 36, weight: 700 }); txt(s, 145, 102, { size: 40, color: '#fff', align: 'left' }); }
const FEED = [COL.alex, COL.ivy, COL.sam, COL.max, '#5B8DEF', '#EF476F', '#06D6A0'];
function feedPhone(x, y, s, off, o = {}) { const { gray = 0, glow = 1 } = o; g.save(); g.translate(x, y); g.scale(s, s);
  if (glow) { const gl = g.createRadialGradient(0, 0, 40, 0, 0, 420); gl.addColorStop(0, `rgba(140,180,255,${.35 * glow})`); gl.addColorStop(1, 'rgba(140,180,255,0)'); g.fillStyle = gl; g.fillRect(-420, -420, 840, 840); }
  g.fillStyle = COL.ink; rr(-110, -200, 220, 400, 30); g.fill(); g.save(); rr(-96, -176, 192, 352, 16); g.clip(); g.fillStyle = '#F5F6FA'; g.fillRect(-96, -176, 192, 352);
  for (let i = -1; i < 5; i++) { const k = Math.floor(off / 120) + i, yy = -176 + i * 120 - (off % 120); const c = gray ? '#9AA0AE' : FEED[((k % 7) + 7) % 7]; g.fillStyle = c; rr(-84, yy + 8, 168, 104, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(-14, yy + 40); g.lineTo(18, yy + 60); g.lineTo(-14, yy + 80); g.fill(); }
  g.restore(); g.restore(); }
function nightRoom() { const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#171B36'); wall.addColorStop(1, '#232A52'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0F1229'; rr(1440, 140, 320, 300, 12); g.fill(); g.fillStyle = '#F6E7B8'; g.beginPath(); g.arc(1660, 220, 32, 0, 7); g.fill(); g.fillStyle = '#0F1229'; g.beginPath(); g.arc(1645, 210, 28, 0, 7); g.fill();
  g.fillStyle = '#3A2F4F'; rr(160, 640, 200, 220, 14); g.fill(); g.fillStyle = '#4A3C5C'; rr(420, 780, 1000, 100, 18); g.fill(); g.fillStyle = '#2E2A44'; rr(420, 560, 60, 320, 18); g.fill(); g.fillStyle = '#E8E2F0'; rr(460, 700, 960, 90, 30); g.fill(); g.fillStyle = '#F7F4FA'; rr(480, 620, 200, 100, 46); g.fill(); g.fillStyle = '#121633'; g.fillRect(0, 880, W, 200); }
function digital(x, y, s) { g.fillStyle = '#16131F'; rr(x - 110, y - 45, 220, 90, 14); g.fill(); txt(s, x, y + 2, { size: 52, color: '#FF6B6B', weight: 700 }); }
function pigeon(x, y, s, peck = 0) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#9AA6B8'; ell(0, -60, 70, 50); g.fill(); g.fillStyle = '#7D8AA0'; ell(-20, -60, 50, 30, -.2); g.fill();
  g.save(); g.translate(50, -100); g.rotate(peck * .6); g.fillStyle = '#8B97AB'; g.beginPath(); g.arc(0, 0, 32, 0, 7); g.fill(); g.fillStyle = COL.ink; g.beginPath(); g.arc(10, -6, 6, 0, 7); g.fill(); g.fillStyle = '#E9A84B'; g.beginPath(); g.moveTo(28, -4); g.lineTo(52, 4); g.lineTo(28, 10); g.fill(); g.restore();
  line(-10, -12, -16, 20, 6, '#E07A5F'); line(14, -12, 20, 20, 6, '#E07A5F'); g.restore(); }
function slotMachine(x, y, s, spin, faces) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = COL.red; rr(-220, -260, 440, 520, 40); g.fill(); g.fillStyle = '#FFD447'; rr(-180, -180, 360, 200, 20); g.fill();
  for (let i = 0; i < 3; i++) { g.fillStyle = '#fff'; rr(-160 + i * 110, -160, 100, 160, 10); g.fill(); const f = faces[i]; const yy = spin ? ((TT * 900 + i * 50) % 160) - 80 : 0; txt(spin ? ['🍒', '⭐', '7', '🍋'][Math.floor(TT * 12 + i) % 4] : f, -110 + i * 110, -80 + yy * .2, { size: 60, weight: 700 }); }
  txt('JACKPOT?', 0, -220, { size: 40, weight: 700, color: '#fff' }); line(240, -160, 240, 40, 14, COL.ink); g.fillStyle = COL.ink; g.beginPath(); g.arc(240, -170, 30, 0, 7); g.fill(); g.restore(); }
function bookOpen(x, y, s, end) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#C8553D'; rr(-260, -170, 520, 340, 14); g.fill(); g.fillStyle = '#FFFDF6'; rr(-240, -150, 230, 300, 8); g.fill(); rr(10, -150, 230, 300, 8); g.fill();
  for (let i = 0; i < 8; i++) { line(-220, -120 + i * 30, -30, -120 + i * 30, 4, '#C9C3B8'); if (i < (end ? 4 : 8)) line(30, -120 + i * 30, 220, -120 + i * 30, 4, '#C9C3B8'); } if (end) txt('THE END', 125, 80, { size: 40, weight: 700, color: COL.red }); g.restore(); }

// ---------- scenes
S.scrollOpen = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    nightRoom(); digital(260, 600, '11:00'); lying(P_(SAM, { x: 600, y: 700, s: 1, expr: 'smile' })); feedPhone(720, 470, .6, lt * 40); g.fillStyle = '#6C8EBF'; rr(700, 640, 700, 140, 50); g.fill();
    withA(E(lt, at(0, .6)), () => { thought(1120, 330, 420, 110); txt('"just a minute"', 1120, 332, { size: 44, font: 'Nunito', weight: 800 }); });
  }, () => {
    paperBg('#1E2340'); feedPhone(560, 560, 1.7, (lt - L[1]) * 260);
    [['funny cat 🐱', .1], ['cooking hack 🍳', .3], ['old classmate getting married 💍', .5], ['another video...', .75]].forEach(([s, f], i) => pill(s, 1340, 300 + i * 150, { p: B(lt, at(1, f)), bg: FEED[i], size: 40 }));
  }, () => {
    nightRoom(); digital(260, 600, '1:30'); lying(P_(SAM, { x: 600, y: 700, s: 1, expr: 'o', sweat: true })); feedPhone(720, 470, .6, lt * 40); g.fillStyle = '#6C8EBF'; rr(700, 640, 700, 140, 50); g.fill();
    g.save(); g.translate(960 + Math.sin(TT * 30) * 4, 220); g.scale(B(lt, at(2, .3)), B(lt, at(2, .3))); txt('1:30 A.M.?!', 0, 0, { size: 120, weight: 700, color: COL.alex }); g.restore();
  }, () => {
    paperBg('#ECE8F8'); ch(P_(SAM, { x: 560, y: 960, s: 1.4, expr: 'tired' }));
    withA(E(lt, at(3, .1)), () => { card(1300, 400, 820, 200); txt("didn't decide to", 1300, 370, { size: 52, weight: 700 }); txt('it just happened', 1300, 450, { size: 46, font: 'Nunito', weight: 800, color: COL.ink2 }); });
    withA(E(lt, at(3, .6)), () => { card(1300, 700, 820, 160, 1, '#FFF7DC'); txt('...and tomorrow, again', 1300, 702, { size: 50, weight: 700, color: dark(COL.sam, .3) }); });
  }, () => {
    paperBg('#ECE8F8'); feedPhone(560, 560, 1.4, lt * 60); for (let i = 0; i < 5; i++) { const a = (TT * .8 + i * .2) % 1; g.strokeStyle = `rgba(123,108,246,${1 - a})`; g.lineWidth = 6; g.beginPath(); g.arc(560, 560, 300 + a * 160, -.6, .6); g.stroke(); }
    withA(E(lt, at(4, .2)), () => { card(1340, 420, 760, 160); txt("you're not imagining it", 1340, 422, { size: 50, weight: 700, color: COL.max }); });
    withA(E(lt, at(4, .65)), () => { card(1340, 660, 760, 160, 1, '#FFF7DC'); txt("and you're not weak", 1340, 662, { size: 50, weight: 700, color: dark(COL.sam, .3) }); });
  }]);
};
S.title8 = (lt, L, Le, D, at) => {
  g.fillStyle = COL.night; g.fillRect(0, 0, W, H); feedPhone(1500, 700, 1.2, lt * 120, { glow: 1 });
  [["WHY YOU CAN'T", COL.white, 300, 120], ['STOP SCROLLING', COL.max, 440, 120]].forEach(([s, c, y, sz], i) => { const p = B(lt, .2 + i * .5, .5); g.save(); g.translate(760, y); g.scale(p, p); txt(s, 0, 0, { size: sz, weight: 700, color: c }); g.restore(); });
  const p = E(lt, 1, .7); ch(P_(SAM, { x: 760, y: 1080 + lerp(300, 30, p), s: 1.4, expr: 'tired' }));
};
S.slot = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5], [() => {
    paperBg('#F4EDE1'); chapter(1, 'The slot machine in your pocket', lt);
    card(W / 2, 460, 860, 280, B(lt, .4)); withA(E(lt, .4), () => { txt('B. F. Skinner', W / 2, 420, { size: 76, weight: 700 }); txt('1950s · learning from rewards', W / 2, 510, { size: 42, font: 'Nunito', weight: 800, color: COL.ink2 }); });
  }, () => {
    paperBg('#F4EDE1'); g.fillStyle = '#C9C3B8'; rr(560, 380, 800, 520, 20); g.fill(); g.fillStyle = '#E8DCC4'; rr(580, 400, 760, 480, 14); g.fill();
    g.fillStyle = COL.red; g.beginPath(); g.arc(1180, 560, 40, 0, 7); g.fill(); const pk = Math.max(0, Math.sin(TT * 8)); pigeon(980, 860, 1.6, pk); g.fillStyle = '#C98B5B'; rr(1120, 780, 120, 60, 10); g.fill();
    txt('peck → food', 960, 300, { size: 56, weight: 700, alpha: E(lt, at(1, .4)) });
  }, () => {
    paperBg('#F4EDE1');
    [['every time', 'pecks when hungry, then stops', COL.gray, .05, 0], ['unpredictably', 'keeps pecking... and pecking', COL.alex, .4, 1]].forEach(([h, s, c, f, v], i) => { const x = 560 + i * 800; withA(E(lt, at(2, f), .4), () => { card(x, 560, 680, 620); txt('food comes ' + h, x, 300, { size: 50, weight: 700, color: c }); pigeon(x, 780, 1.2, v ? Math.max(0, Math.sin(TT * 14)) : (Math.sin(TT * 3) > .8 ? 1 : 0)); txt(s, x, 830, { size: 34, font: 'Nunito', weight: 800 }); }); });
  }, () => {
    paperBg('#FFF4DE'); slotMachine(700, 560, 1.4, lt > at(3, .3), ['🍋', '🍒', '7']);
    pill('variable reward schedule', 1420, 380, { p: B(lt, at(3, .1)), bg: COL.ink, size: 46 }); txt('you never know which pull pays out', 1420, 560, { size: 40, weight: 700, alpha: E(lt, at(3, .45)), maxW: 760 });
    withA(E(lt, at(3, .7)), () => { card(1420, 760, 760, 140, 1, '#FADDD3'); txt('hardest habit to stop', 1420, 762, { size: 48, weight: 700, color: COL.red }); });
  }, () => {
    paperBg('#ECE8F8'); const off = (lt - L[4]) * 240; feedPhone(700, 560, 1.6, off);
    ['meh', 'ok', 'meh', 'HILARIOUS!', 'meh', 'your ex?!'].forEach((s, i) => { const a = E(lt, at(4, .1 + i * .13), .3); withA(a, () => txt(s, 1350, 260 + i * 110, { size: s.length > 4 ? 54 : 40, weight: 700, color: s.length > 4 ? COL.alex : COL.gray })); });
  }, () => {
    paperBg('#ECE8F8'); feedPhone(560, 560, 1.4, lt * 200); txt('=', W / 2, 560, { size: 160, weight: 700, alpha: E(lt, at(5, .3)) }); slotMachine(1400, 560, 1.1, true, ['', '', '']);
    pill('every swipe = another pull of the lever', W / 2, 980, { p: B(lt, at(5, .6)), bg: COL.ink, size: 42 });
  }]);
};
S.likes = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#FBE3EE'); chapter(2, 'Likes are rewards, too', lt);
    ch(P_(SAM, { x: 760, y: 960, s: 1.4, expr: 'smile', arms: 'up' })); g.fillStyle = COL.ink; rr(1060, 400, 240, 420, 30); g.fill(); g.fillStyle = '#F5F6FA'; rr(1076, 424, 208, 372, 16); g.fill(); g.fillStyle = COL.sam; rr(1090, 440, 180, 180, 10); g.fill(); txt('POST', 1180, 700, { size: 40, weight: 700 });
  }, () => {
    paperBg('#FBE3EE'); heading('1,000,000+ POSTS · 4,000+ PEOPLE', 120);
    for (let i = 0; i < 160; i++) { const x = 140 + (i % 20) * 82, y = 300 + Math.floor(i / 20) * 70; withA(E(lt, at(1, .1) + i * .006, .2), () => { g.fillStyle = FEED[i % 7]; rr(x - 30, y - 24, 60, 48, 8); g.fill(); }); }
    source('Lindström et al. (2021), Nature Communications', E(lt, at(1, .3)));
  }, () => {
    paperBg('#FBE3EE'); heading('MORE LIKES → POST AGAIN SOONER', 120);
    const n = Math.floor(clamp((lt - L[2]) / (Le[2] - L[2])) * 40); for (let i = 0; i < n; i++) heart(300 + (i * 97) % 600, 300 + (i * 61) % 460, 1.2, COL.red);
    ch(P_(SAM, { x: 1300, y: 940, s: 1.3, expr: 'joy', hop: Math.abs(Math.sin(TT * 8)) * 14 })); pigeon(1600, 940, .9, Math.max(0, Math.sin(TT * 8)));
    txt('same math as animals seeking food', 1400, 400, { size: 40, weight: 700, alpha: E(lt, at(2, .3)), maxW: 760 });
  }, () => {
    paperBg('#FBE3EE'); g.fillStyle = '#fff'; rr(560, 340, 800, 400, 30); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke(); heart(960, 520, 6 * B(lt, at(3, .3)), COL.red); txt('= a little treat', W / 2, 850, { size: 72, weight: 700, alpha: E(lt, at(3, .6)) });
  }]);
};
S.dopa = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#E8EEF7'); chapter(3, 'The dopamine myth', lt); brainChar(700, 560, 1.4, { amyg: .5, expr: 'smile' });
    withA(E(lt, at(0, .2)), () => { card(1380, 460, 680, 200); txt('"the pleasure chemical"', 1380, 462, { size: 52, weight: 700 }); }); stamp('PARTLY WRONG', 1380, 720, E(lt, at(0, .7), .35), '#C9752B', -.08, 72);
  }, () => {
    paperBg('#E8EEF7'); heading('WANTING ≠ LIKING');
    [['WANTING', 'anticipation: "something good is coming!"', COL.max, .2], ['LIKING', 'actual enjoyment', COL.sam, .45]].forEach(([h, s, c, f], i) => { const x = 560 + i * 800; withA(E(lt, at(1, f), .4), () => { card(x, 560, 680, 520); txt(h, x, 380, { size: 70, weight: 700, color: c }); wrap(s, x, 520, 580, 56, { size: 42, font: 'Nunito', weight: 800 }); if (i === 0) pill('dopamine', x, 700, { bg: COL.max, size: 44 }); }); });
    source('Berridge & Robinson, "wanting" vs "liking"', E(lt, at(1, .3)));
  }, () => {
    paperBg('#E8EEF7'); heading('THE SCROLL KEEPS GOING');
    const x0 = 260, y0 = 860, w = 1400, h = 500; line(x0, y0, x0 + w, y0, 6, COL.ink); txt('time scrolling', x0 + w / 2, y0 + 60, { size: 36, font: 'Nunito', weight: 800 });
    const p = E(lt, at(2, .1), 2.5); curve8(x0, y0, w, h, u => .85 - .05 * Math.sin(u * 20), p, COL.max); curve8(x0, y0, w, h, u => .8 * Math.exp(-u * 3) + .05, p, COL.sam);
    withA(p, () => { txt('wanting', x0 + w + 20, y0 - .85 * h, { size: 40, weight: 700, color: COL.max, align: 'left' }); txt('liking', x0 + w + 20, y0 - .1 * h, { size: 40, weight: 700, color: dark(COL.sam, .2), align: 'left' }); }); txt('illustrative', W / 2, y0 + 120, { size: 28, font: 'Nunito', weight: 700, color: COL.ink2 });
  }, () => {
    paperBg('#E2EFEB'); withA(E(lt, at(3, .05)), () => { card(560, 500, 680, 300, 1, '#E3E4EE'); txt('"dopamine detox"', 560, 460, { size: 60, weight: 700, color: COL.ink2 }); txt('not literal', 560, 560, { size: 44, font: 'Nunito', weight: 800, color: COL.red }); });
    withA(E(lt, at(3, .6)), () => { card(1360, 500, 680, 300, 1, '#FFFDF6'); txt('a break from', 1360, 450, { size: 52, weight: 700, color: COL.ivy }); txt('stimulating stuff: fine!', 1360, 540, { size: 44, font: 'Nunito', weight: 800 }); });
    ch(P_(SAM, { x: 960, y: 1040, s: .9, expr: 'calm', arms: 'book' }));
  }]);
};
function curve8(x0, y0, w, h, f, prog, c) { g.beginPath(); for (let u = 0; u <= prog; u += .005) g.lineTo(x0 + u * w, y0 - f(u) * h); g.lineWidth = 8; g.strokeStyle = c; g.lineCap = 'round'; g.stroke(); }
S.stopcues = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3], [() => {
    paperBg('#F7EDD3'); chapter(4, 'No place to stop', lt); bookOpen(W / 2, 520, 1.6, true); txt('natural stopping points', W / 2, 900, { size: 60, weight: 700, alpha: E(lt, at(0, .5)) });
  }, () => {
    paperBg('#F7EDD3');
    [['end of a chapter', '📖'], ['end of an episode', '📺'], ['bottom of the page', '📰']].forEach(([s, e], i) => { withA(E(lt, at(1, .05 + i * .25), .4), () => { card(360 + i * 600, 540, 500, 420); txt(e, 360 + i * 600, 480, { size: 120 }); txt(s, 360 + i * 600, 660, { size: 44, weight: 700 }); }); });
  }, () => {
    paperBg('#ECE8F8'); feedPhone(700, 560, 1.7, (lt - L[2]) * 400);
    withA(E(lt, at(2, .2)), () => { pill('infinite scroll', 1350, 400, { bg: COL.max, size: 50 }); }); withA(E(lt, at(2, .6)), () => { pill('autoplay ▶ next', 1350, 560, { bg: COL.alex, size: 50 }); });
    txt('no bottom', 1350, 760, { size: 70, weight: 700, color: COL.red, alpha: E(lt, at(2, .4)) });
  }, () => {
    paperBg('#ECE8F8'); ch({ x: 520, y: 960, c: '#93B7A8', s: 1.3, expr: 'sad', sd: 2 }); txt('Aza Raskin', 520, 470, { size: 52, weight: 700, alpha: E(lt, at(3, .1)) }); txt('designer of infinite scroll', 520, 540, { size: 34, font: 'Nunito', weight: 800, color: COL.ink2, alpha: E(lt, at(3, .1)) });
    withA(E(lt, at(3, .5)), () => { thought(1300, 420, 760, 160); txt('"do I want to keep going?"', 1300, 422, { size: 50, font: 'Nunito', weight: 800 }); });
    pill('the moment to ask: removed', 1300, 720, { p: B(lt, at(3, .75)), bg: COL.red, size: 44 });
  }]);
};
S.bored = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#E3E4EE'); chapter(5, 'Running from boredom', lt); ch(P_(SAM, { x: 760, y: 960, s: 1.4, expr: 'worried', look: 1 })); feedPhone(1260, 560, 1, lt * 80);
    g.fillStyle = COL.ink2; [[900, 700], [980, 640], [1060, 600]].forEach(([x, y], i) => withA(E(lt, at(0, .3) + i * .1, .3), () => { g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); }));
  }, () => {
    paperBg('#F4EDE1'); heading('15 MINUTES ALONE WITH YOUR THOUGHTS', 120, COL.ink, 64);
    g.fillStyle = '#D9D2C4'; rr(360, 300, 1200, 640, 20); g.fill(); g.fillStyle = '#B0A089'; rr(820, 640, 280, 200, 20); g.fill(); ch({ x: 960, y: 760, c: EX[3], s: 1, expr: 'neutral', sd: 3 });
    g.fillStyle = '#fff'; rr(1240, 560, 200, 200, 20); g.fill(); g.lineWidth = 6; g.strokeStyle = COL.ink; g.stroke(); g.fillStyle = COL.red; g.beginPath(); g.arc(1340, 660, 50, 0, 7); g.fill(); bolt(1340, 660, .8, E(lt, at(1, .7)));
    pill('mild shock button', 1340, 500, { p: B(lt, at(1, .6)), bg: COL.red, size: 34 }); source('Wilson et al. (2014), Science', E(lt, at(1, .3)));
  }, () => {
    paperBg('#F4EDE1'); heading('SHOCKED THEMSELVES AT LEAST ONCE', 120, COL.ink, 64);
    const base = 860; [['men', .67, '#5B8DEF', .2], ['women', .25, COL.alex, .45]].forEach(([s, v, c, f], i) => { const x = 760 + i * 400, p = E(lt, at(2, f), .8); bar(x, base, 260, 600, c, v * p); txt(Math.round(v * 100 * p) + '%', x, base - 600 * v * p - 50, { size: 64, weight: 700, alpha: p }); txt(s, x, base + 60, { size: 46, weight: 700 }); });
    line(520, base, 1400, base, 8, COL.ink); bolt(1620, 500, 2, E(lt, at(2, .4)));
  }, () => {
    paperBg('#E3E4EE'); feedPhone(960, 600, 1.2, lt * 60);
    [['boredom', COL.gray], ['stress', COL.red], ['loneliness', COL.max], ['FOMO', COL.alex]].forEach(([s, c], i) => { const an = i / 4 * Math.PI * 2 - Math.PI / 4; const r = lerp(700, 380, E(lt, at(3, .1) + i * .1, .8)); pill(s, 960 + Math.cos(an) * r, 600 + Math.sin(an) * r * .55, { bg: c, size: 48 }); });
    source('Przybylski et al. (2013), fear of missing out', E(lt, at(3, .6)));
  }, () => {
    paperBg('#E3E4EE'); g.fillStyle = '#8C5A3C'; rr(1100, 260, 360, 560, 20); g.fill(); g.fillStyle = '#2B2440'; rr(1130, 290, 300, 500, 12); g.fill(); feedPhone(1280, 540, .8, lt * 60, { glow: 0 });
    ch(P_(SAM, { x: 700, y: 960, s: 1.3, expr: 'worried', look: 1 })); pill('escape hatch', 1280, 900, { p: B(lt, at(4, .3)), bg: COL.ink, size: 48 });
  }]);
};
S.matter = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4], [() => {
    paperBg('#ECE8F8'); chapter(6, 'Does it actually matter?', lt); heading('IT DEPENDS', 380, COL.max, 120);
    withA(E(lt, at(0, .5)), () => pill('effects often smaller than headlines', W / 2, 600, { bg: COL.ink, size: 46 }));
  }, () => {
    paperBg('#ECE8F8'); heading('4 WEEKS WITHOUT FACEBOOK', 120);
    for (let i = 0; i < 20; i++) ch({ x: 160 + (i % 10) * 175, y: 460 + Math.floor(i / 10) * 230, c: i % 2 ? COL.max : COL.gray, top: i % 2 ? 'spike' : null, s: .55, sd: i, expr: i % 2 && lt > at(1, .5) ? 'joy' : 'smile', alpha: E(lt, at(1, .1) + i * .02, .3) });
    withA(E(lt, at(1, .5)), () => { pill('small boost: happiness · life satisfaction', W / 2, 920, { bg: COL.ivy, size: 40 }); }); withA(E(lt, at(1, .8)), () => pill('...and kept using it less', W / 2, 1010, { bg: COL.ink, size: 36 }));
    source('Allcott, Braghieri, Eichmeyer & Gentzkow (2020), American Economic Review', E(lt, at(1, .3)));
  }, () => {
    paperBg('#ECE8F8'); heading('NOTIFICATIONS ON', 120);
    feedPhone(620, 580, 1.3, 0); for (let i = 0; i < 5; i++) { const a = ((lt - L[2]) * 1.2 + i * .25) % 1.4; withA(clamp(1 - a / 1.4), () => pill('🔔', 620 + Math.cos(i * 1.3) * 300, 580 + Math.sin(i * 1.3) * 300 - a * 60, { bg: COL.red, size: 40 })); }
    withA(E(lt, at(2, .5)), () => { card(1380, 560, 640, 260); txt('more inattention', 1380, 530, { size: 52, weight: 700, color: COL.red }); txt('than with them off', 1380, 610, { size: 40, font: 'Nunito', weight: 800 }); });
    source('Kushlev, Proulx & Dunn (2016), CHI', E(lt, at(2, .3)));
  }, () => {
    paperBg('#E2EFEB'); ch(P_(SAM, { x: 560, y: 960, s: 1.4, expr: 'calm' })); feedPhone(960, 560, .9, 0, { glow: 0 });
    withA(E(lt, at(3, .2)), () => { card(1420, 420, 680, 180, 1, '#E3E4EE'); txt('phones are evil', 1420, 422, { size: 50, weight: 700, color: COL.ink2 }); strike(1420, 422, 420, E(lt, at(3, .35), .4)); });
    withA(E(lt, at(3, .5)), () => { card(1420, 700, 680, 220, 1, '#FFFDF6'); wrap('more use, less intentional than we want', 1420, 700, 600, 56, { size: 44, weight: 700, color: COL.ivy }); });
  }, () => {
    paperBg('#ECE8F8'); heading('TEENS: A REAL BUT TINY LINK', 120);
    [['digital tech use', .08, COL.max, .3], ['eating potatoes', .07, '#C9A44B', .55]].forEach(([s, v, c, f], i) => { const x = 760 + i * 400, base = 860, p = E(lt, at(4, f), .8); bar(x, base, 260, 600, c, v * 4 * p); txt(s, x, base + 60, { size: 40, weight: 700 }); });
    line(520, 860, 1400, 860, 8, COL.ink); txt('link with well-being (illustrative)', W / 2, 1000, { size: 30, font: 'Nunito', weight: 700, color: COL.ink2 });
    source('Orben & Przybylski (2019), Nature Human Behaviour', E(lt, at(4, .3)));
  }]);
};
S.tips8 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 1, 2, 3, 4, 5, 6], [() => {
    paperBg('#E2EFEB'); chapter(7, 'How to take back control', lt); heading('TAKE BACK CONTROL', 380, COL.ink, 100);
    [1, 2, 3, 4, 5, 6].forEach(i => { const p = B(lt, .8 + i * .2); g.fillStyle = COL.ivy; g.beginPath(); g.arc(295 + i * 190, 620, 64 * p, 0, 7); g.fill(); txt(String(i), 295 + i * 190, 624, { size: 64 * p, weight: 700, color: '#fff' }); });
  }, () => {
    paperBg('#E2EFEB'); tipTag8(1, 'Create stopping points'); feedPhone(560, 580, 1.3, Math.min(3, (lt - L[1]) * 1.2) * 120);
    clock(1180, 460, 110, 9 + clamp((lt - L[1]) / 4) * .25); pill('3 videos, then done', 1400, 720, { p: B(lt, at(1, .4)), bg: COL.ivy, size: 46 });
  }, () => {
    paperBg('#E8EEF7'); tipTag8(2, 'Batch notifications');
    [['constant', COL.red, .1, 14], ['3× a day', COL.ivy, .45, 3]].forEach(([s, c, f, n], i) => { const x = 560 + i * 800; withA(E(lt, at(2, f), .4), () => { card(x, 560, 680, 560); txt(s, x, 330, { size: 60, weight: 700, color: c }); for (let k = 0; k < n; k++) pill('🔔', x - 260 + (k % 7) * 86, 460 + Math.floor(k / 7) * 90, { bg: c, size: 30 }); txt(i ? 'more focused, less stressed' : 'scattered', x, 760, { size: 38, font: 'Nunito', weight: 800 }); }); });
    source('Fitz et al. (2019), Computers in Human Behavior', E(lt, at(2, .4)));
  }, () => {
    paperBg('#E3E4EE'); tipTag8(3, 'Make it boring: grayscale');
    feedPhone(620, 580, 1.4, lt * 100); feedPhone(1300, 580, 1.4, lt * 100, { gray: 1 }); arrowLine(860, 580, 1060, 580, E(lt, at(3, .2), .5), COL.ink, 10);
    pill('used their phones less (small study)', W / 2, 980, { p: B(lt, at(3, .55)), bg: COL.ink, size: 40 }); source('Holte & Ferraro (2020)', E(lt, at(3, .4)));
  }, () => {
    nightRoom(); tipTag8(4, 'Phone out of the bedroom'); lying(P_(SAM, { x: 600, y: 700, s: 1, expr: 'calm' })); g.fillStyle = '#6C8EBF'; rr(700, 640, 700, 140, 50); g.fill();
    g.fillStyle = '#C0392B'; rr(200, 560, 120, 90, 14); g.fill(); clock(260, 520, 50, 6.5);
    for (let i = 0; i < 3; i++) { const a = (lt * .5 + i * .33) % 1; txt('z', 780 + a * 120 + i * 10, 560 - a * 140, { size: 40 + i * 10, color: '#B9C3F0', alpha: clamp(1 - a) }); }
    withA(E(lt, at(4, .3)), () => { card(1500, 320, 420, 200); txt('kitchen', 1500, 270, { size: 40, weight: 700 }); feedPhone(1500, 360, .3, 0, { glow: 0 }); });
  }, () => {
    paperBg('#FFF4DE'); tipTag8(5, 'Replace, don\'t just remove');
    [['a book by the bed', '📖'], ['message a friend', '💬'], ['a short walk', '🚶']].forEach(([s, e], i) => { withA(E(lt, at(5, .2 + i * .2), .4), () => { card(360 + i * 600, 560, 500, 420); txt(e, 360 + i * 600, 500, { size: 120 }); txt(s, 360 + i * 600, 680, { size: 44, weight: 700 }); }); });
  }, () => {
    paperBg('#FBE3EE'); tipTag8(6, 'Be kind to yourself'); ch(P_(SAM, { x: 760, y: 960, s: 1.4, expr: 'smile', arms: 'hug' })); heart(760, 480, 2.6 * B(lt, at(6, .5)));
    withA(E(lt, at(6, .2)), () => { card(1400, 520, 700, 260); wrap('designed by smart people to be hard to put down', 1400, 520, 620, 56, { size: 44, weight: 700 }); });
  }]);
};
S.outro8 = (lt, L, Le, D, at) => {
  panels(lt, L, [0, 2, 3], [() => {
    nightRoom(); digital(260, 600, lt > L[1] ? '11:48' : '11:00'); lying(P_(SAM, { x: 600, y: 700, s: 1, expr: lt > at(1, .3) ? 'calm' : 'smile' })); g.fillStyle = '#6C8EBF'; rr(700, 640, 700, 140, 50); g.fill();
    if (lt < at(1, .3)) bookOpen(760, 520, .35, false); else for (let i = 0; i < 3; i++) { const a = (lt * .5 + i * .33) % 1; txt('z', 780 + a * 120 + i * 10, 560 - a * 140, { size: 40 + i * 10, color: '#B9C3F0', alpha: clamp(1 - a) }); }
    withA(E(lt, at(0, .3)), () => { card(1500, 320, 420, 200); txt('kitchen', 1500, 270, { size: 40, weight: 700 }); feedPhone(1500, 360, .3, 0, { glow: 0 }); });
    withA(E(lt, at(1, .4)), () => { card(W / 2, 140, 700, 110); txt('asleep before midnight', W / 2, 142, { size: 50, weight: 700, color: COL.ivy }); });
  }, () => {
    paperBg(); txt('How many hours last week? Be honest.', W / 2, 200, { size: 72, weight: 700, alpha: B(lt, L[2]) });
    bubble(W / 2, 440, 860, 160, 'bl', B(lt, at(2, .4))); txt('tell me in the comments ↓', W / 2, 442, { size: 54, font: 'Nunito', weight: 800, alpha: E(lt, at(2, .4)) });
    [[480, IVY], [740, SAM], [1000, ALEX], [1260, MAX]].forEach(([x, c], i) => ch(P_(c, { x, y: 1000, s: .95, expr: 'joy', arms: i % 2 ? 'wave' : 'up' })));
  }, () => {
    g.fillStyle = COL.night; g.fillRect(0, 0, W, H); txt('your natural stopping point', W / 2, 220, { size: 60, weight: 700, color: COL.sam }); bookOpen(W / 2, 520, .7, true);
    txt('Thanks for watching!', W / 2, 780, { size: 90, weight: 700, color: COL.white, alpha: E(lt, at(3, .3)) });
    [[560, IVY], [820, SAM], [1100, ALEX], [1360, MAX]].forEach(([x, c]) => ch(P_(c, { x, y: 1060, s: .7, expr: 'joy', arms: 'wave' })));
  }]);
};
NODIP_IN = new Set(); NODIP_OUT = new Set();

window.thumb = () => { TT = 1.5; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  nightRoom(); g.fillStyle = 'rgba(10,12,30,.35)'; g.fillRect(0, 0, W, H); digital(1700, 330, '3:12');
  ch(P_(SAM, { x: 560, y: 1300, s: 2.6, expr: 'tired' })); feedPhone(1200, 640, 1.6, 0);
  g.save(); g.translate(W / 2, 140); g.rotate(-.02); g.font = '700 140px Fredoka'; const a = "CAN'T STOP ", b = 'SCROLLING?'; const w1 = g.measureText(a).width, w2 = g.measureText(b).width;
  txt(a, -(w1 + w2) / 2, 0, { size: 140, weight: 700, color: '#fff', align: 'left' }); txt(b, -(w1 + w2) / 2 + w1, 0, { size: 140, weight: 700, color: '#B9A8FF', align: 'left' }); g.restore();
  finish(); };
