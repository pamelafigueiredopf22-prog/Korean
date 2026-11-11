// Run: node tests/content.test.js   (add --list to print every romanization for proofreading)
global.window = global;
const H = require('../js/hangul.js');
require('../js/content-book.js');
require('../js/content-scenes.js');
let fail = 0, pass = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('✗ ' + msg); } };

// 1) every pronunciation given in the book matches the engine (or is a documented exception)
for (const ch of BOOK) {
  for (const it of ch.items) {
    if (it.kind === 'sound') {
      ok(H.pronounce(it.ko) === it.pron, `${ch.id} sound ${it.ko}: book [${it.pron}] vs engine [${H.pronounce(it.ko)}]`);
      ok(new Set([it.pron, ...it.wrong]).size >= 3, `${it.ko}: needs 2 distinct distractors`);
    }
    ok(!!it.ko && (it.kind === 'letter' ? !!it.rom : true), `${it.id} missing fields`);
    if (it.kind === 'word' || it.kind === 'phrase') ok(!!it.en, `${it.id} missing English`);
  }
  for (const l of ch.lessons) for (const p of l.pages) for (const b of p.blocks) {
    if (b.t === 'change' || b.t === 'words') for (const w of b.items) if (w.pron) {
      ok(H.pronounce(w.ko) === w.pron || ['앉다', '밟다'].includes(w.ko), `lesson ${l.id} ${w.ko}: [${w.pron}] vs engine [${H.pronounce(w.ko)}]`);
    }
    if (b.t === 'check') ok(b.answer >= 0 && b.answer < b.options.length, `check answer index in ${l.id}`);
  }
  // ids unique
  const ids = ch.items.map(i => i.id);
  ok(new Set(ids).size === ids.length, `${ch.id} duplicate item ids: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
}

// 2) scenes: graph is valid, hint answers and correct chips are accepted
const fill = s => String(s).replace(/\{name\}/g, '파멜라').replace(/\{이에요\}/g, '예요').replace(/\{country\}/g, '브라질');
const expand = say => say === '@countries' ? COUNTRIES.flatMap(([c]) => [`저는 ${c} 사람이에요`]) : say.map(fill);
for (const sc of SCENES) {
  ok(!!sc.steps[sc.start], `${sc.id} start step`);
  for (const [id, st] of Object.entries(sc.steps)) {
    if (st.kind === 'say') {
      const acc = st.responses.flatMap(r => expand(r.say));
      for (const r of st.responses) ok(!!sc.steps[r.next], `${sc.id}.${id} → ${r.next} exists`);
      ok(H.check(fill(st.hint.answer), acc).result === 'exact', `${sc.id}.${id} hint answer accepted: ${fill(st.hint.answer)}`);
      ok(st.chips.map(fill).some(c => H.check(c, acc).result === 'exact'), `${sc.id}.${id} has a correct chip`);
      // romanized hint answer accepted too
      ok(H.check(H.romanize(fill(st.hint.answer)), acc).result === 'exact', `${sc.id}.${id} romanized answer accepted: ${H.romanize(fill(st.hint.answer))}`);
      // wrong answers must not be accepted
      for (const w of (st.wrong || [])) for (const s of expand(w.say)) ok(H.check(s, acc).result === 'wrong', `${sc.id}.${id} wrong "${s}" is not accepted`);
    }
    if (st.kind === 'listen') ok(!!sc.steps[st.next] && st.answer < st.options.length, `${sc.id}.${id} listen`);
  }
}
// name pattern
const nameStep = SCENES[0].steps.name.responses[0];
ok(nameStep.pattern.rom.test(H.normRoman('jeoneun pamela-yeyo')), 'name pattern rom');
ok(nameStep.pattern.ko.test(H.normHangul('저는 파밀라예요')), 'name pattern ko');

if (process.argv.includes('--list')) {
  const all = new Set();
  BOOK.forEach(ch => ch.items.forEach(it => it.kind !== 'letter' && all.add(it.ko)));
  BOOK.forEach(ch => ch.lessons.forEach(l => l.pages.forEach(p => p.blocks.forEach(b => (b.items || []).forEach(w => w && w.ko && w.ko.length > 0 && !Array.isArray(w) && all.add(w.ko))))));
  SCENES.forEach(sc => Object.values(sc.steps).forEach(st => st.npc && all.add(fill(st.npc.ko))));
  for (const k of all) console.log(`${k}\t${H.romanize(k)}\t[${H.pronounce(k)}]`);
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
