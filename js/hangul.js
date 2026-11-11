/* Hangul engine
 * - syllable (de)composition
 * - jamo → syllable composition (for the on-screen keyboard)
 * - romanization → Hangul (typing without a Korean keyboard)
 * - standard pronunciation rules (표준 발음법, simplified) → pronounced form
 * - Revised Romanization of Korean (국어의 로마자 표기법, 2000)
 * - answer checking that accepts Hangul or romanization
 * Works in the browser (window.Hangul) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const BASE = 0xAC00;

  const isSyllable = ch => { const c = ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3; };
  const isJamoVowel = ch => JUNG.includes(ch);
  const isJamoConsonant = ch => CHO.includes(ch) || JONG.includes(ch) && ch !== '';
  const hasHangul = s => /[가-힣ㄱ-ㆎ]/.test(s);
  const hasLatin = s => /[a-zA-Z]/.test(s);

  function decompose(ch) {
    const c = ch.charCodeAt(0) - BASE;
    return { cho: CHO[Math.floor(c / 588)], jung: JUNG[Math.floor((c % 588) / 28)], jong: JONG[c % 28] };
  }
  function compose(cho, jung, jong) {
    return String.fromCharCode(BASE + CHO.indexOf(cho) * 588 + JUNG.indexOf(jung) * 28 + JONG.indexOf(jong || ''));
  }
  /** true if the last Hangul syllable of the string has a final consonant */
  function hasBatchim(word) {
    for (let i = word.length - 1; i >= 0; i--) {
      if (isSyllable(word[i])) return decompose(word[i]).jong !== '';
    }
    return false;
  }
  /** 이에요 after a consonant, 예요 after a vowel */
  const copula = word => (hasBatchim(word) ? '이에요' : '예요');

  // ---------------------------------------------------------------------------
  // Jamo sequence → syllables (2-beolsik style automaton)
  const VOWEL_COMBO = { 'ㅗㅏ':'ㅘ','ㅗㅐ':'ㅙ','ㅗㅣ':'ㅚ','ㅜㅓ':'ㅝ','ㅜㅔ':'ㅞ','ㅜㅣ':'ㅟ','ㅡㅣ':'ㅢ' };
  const JONG_COMBO = { 'ㄱㅅ':'ㄳ','ㄴㅈ':'ㄵ','ㄴㅎ':'ㄶ','ㄹㄱ':'ㄺ','ㄹㅁ':'ㄻ','ㄹㅂ':'ㄼ','ㄹㅅ':'ㄽ','ㄹㅌ':'ㄾ','ㄹㅍ':'ㄿ','ㄹㅎ':'ㅀ','ㅂㅅ':'ㅄ' };
  const JONG_SPLIT = {};
  Object.keys(JONG_COMBO).forEach(k => { JONG_SPLIT[JONG_COMBO[k]] = [k[0], k[1]]; });

  function composeJamo(seq) {
    let out = '', cho = null, jung = null, jong = null;
    const flush = () => {
      if (cho && jung) out += compose(cho, jung, jong || '');
      else { if (cho) out += cho; if (jung) out += jung; }
      cho = jung = jong = null;
    };
    for (const j of seq) {
      if (isJamoVowel(j)) {
        if (cho && jung && jong) {
          let carry;
          if (JONG_SPLIT[jong]) { carry = JONG_SPLIT[jong][1]; jong = JONG_SPLIT[jong][0]; }
          else { carry = jong; jong = null; }
          flush(); cho = carry; jung = j;
        } else if (jung && !jong) {
          const combo = VOWEL_COMBO[jung + j];
          if (combo) jung = combo; else { flush(); jung = j; }
        } else if (cho && !jung) {
          jung = j;
        } else { flush(); jung = j; }
      } else if (isJamoConsonant(j)) {
        if (cho && jung && !jong) {
          if (JONG.includes(j)) jong = j; else { flush(); cho = j; }
        } else if (cho && jung && jong) {
          const combo = JONG_COMBO[jong + j];
          if (combo) jong = combo; else { flush(); cho = j; }
        } else { flush(); cho = j; }
      } else { flush(); out += j; }
    }
    flush();
    return out;
  }

  // ---------------------------------------------------------------------------
  // Romanization → Hangul
  const R_VOWELS = [['yae','ㅒ'],['wae','ㅙ'],['yeo','ㅕ'],['ae','ㅐ'],['eo','ㅓ'],['eu','ㅡ'],['ya','ㅑ'],['ye','ㅖ'],
    ['yo','ㅛ'],['yu','ㅠ'],['wa','ㅘ'],['wo','ㅝ'],['we','ㅞ'],['wi','ㅟ'],['oe','ㅚ'],['ui','ㅢ'],
    ['a','ㅏ'],['e','ㅔ'],['i','ㅣ'],['o','ㅗ'],['u','ㅜ']];
  const R_CONS = [['kk','ㄲ'],['tt','ㄸ'],['pp','ㅃ'],['ss','ㅆ'],['jj','ㅉ'],['ch','ㅊ'],['ng','ㅇ'],
    ['g','ㄱ'],['k','ㅋ'],['n','ㄴ'],['d','ㄷ'],['t','ㅌ'],['r','ㄹ'],['l','ㄹ'],['m','ㅁ'],['b','ㅂ'],
    ['p','ㅍ'],['s','ㅅ'],['j','ㅈ'],['h','ㅎ'],['f','ㅍ'],['v','ㅂ'],['z','ㅈ'],['c','ㅋ'],['q','ㅋ'],['x','ㅅ']];
  // how a written final consonant is usually typed
  const R_CODA = { g:'ㄱ',k:'ㄱ',kk:'ㄲ',n:'ㄴ',d:'ㄷ',t:'ㅅ',l:'ㄹ',r:'ㄹ',m:'ㅁ',b:'ㅂ',p:'ㅂ',s:'ㅅ',ss:'ㅆ',
    ng:'ㅇ',j:'ㅈ',ch:'ㅊ',h:'ㅎ',lg:'ㄺ',lk:'ㄺ',lm:'ㄻ',lb:'ㄼ',ps:'ㅄ',bs:'ㅄ',ks:'ㄳ',gs:'ㄳ',nj:'ㄵ',nh:'ㄶ',lh:'ㅀ',lt:'ㄾ',lp:'ㄿ' };

  function tokenizeRoman(word) {
    const toks = []; let i = 0; const w = word.toLowerCase();
    outer: while (i < w.length) {
      for (const [r, j] of R_VOWELS) if (w.startsWith(r, i)) { toks.push({ t: 'V', r, j }); i += r.length; continue outer; }
      for (const [r, j] of R_CONS) if (w.startsWith(r, i)) { toks.push({ t: 'C', r, j }); i += r.length; continue outer; }
      if (w[i] === '-' || w[i] === "'") { toks.push({ t: 'S' }); i++; continue; }
      toks.push({ t: 'X', r: word[i] }); i++;
    }
    return toks;
  }

  /** Convert one romanized word (no spaces) to Hangul with a generic heuristic. */
  function romanWordToHangul(word) {
    const toks = tokenizeRoman(word);
    let out = '';
    let i = 0;
    let pending = null; // {cho, jung} syllable waiting for a coda
    const emitPending = (coda) => { if (pending) { out += compose(pending.cho, pending.jung, coda || ''); pending = null; } };
    while (i < toks.length) {
      // collect a consonant run
      const run = [];
      while (i < toks.length && toks[i].t === 'C') run.push(toks[i++]);
      const next = toks[i];
      if (!next || next.t !== 'V') {
        // run ends at a separator / end / other char → coda for pending
        if (run.length) {
          const s = run.map(t => t.r).join('');
          if (pending && R_CODA[s]) { emitPending(R_CODA[s]); }
          else if (pending && R_CODA[run[0].r]) { emitPending(R_CODA[run[0].r]); out += run.slice(1).map(t => t.j).join(''); }
          else { emitPending(); out += run.map(t => t.j).join(''); }
        } else emitPending();
        if (next) { if (next.t === 'X') out += next.r; i++; }
        continue;
      }
      // next is a vowel: split run into coda (for pending) + onset
      let onset = 'ㅇ', coda = '';
      if (run.length === 1) {
        if (run[0].r === 'ng' && pending) coda = 'ㅇ';
        else if (run[0].r !== 'ng') onset = run[0].j;
      } else if (run.length > 1) {
        const last = run[run.length - 1];
        const codaToks = last.r === 'ng' ? run : run.slice(0, -1);
        if (last.r !== 'ng') onset = last.j;
        const s = codaToks.map(t => t.r).join('');
        if (pending && R_CODA[s]) coda = R_CODA[s];
        else if (pending && R_CODA[codaToks[codaToks.length - 1].r]) {
          coda = R_CODA[codaToks[codaToks.length - 1].r];
          // leftover letters cannot be placed; show them as jamo
          emitPending(coda); coda = null;
          out += codaToks.slice(0, -1).map(t => t.j).join('');
        } else { emitPending(); out += codaToks.map(t => t.j).join(''); coda = null; }
      }
      if (coda !== null) emitPending(coda);
      // vowel(s)
      pending = { cho: onset, jung: next.j };
      i++;
      // consecutive vowels: each starts a new ㅇ syllable
      while (i < toks.length && toks[i].t === 'V') { emitPending(); pending = { cho: 'ㅇ', jung: toks[i].j }; i++; }
    }
    emitPending();
    return out;
  }

  // ---------------------------------------------------------------------------
  // Pronunciation rules
  const ASP = { 'ㄱ':'ㅋ','ㄷ':'ㅌ','ㅂ':'ㅍ','ㅈ':'ㅊ' };
  const NEUTRAL = { 'ㄱ':'ㄱ','ㄲ':'ㄱ','ㅋ':'ㄱ','ㄳ':'ㄱ','ㄺ':'ㄱ','ㄴ':'ㄴ','ㄵ':'ㄴ','ㄶ':'ㄴ',
    'ㄷ':'ㄷ','ㅅ':'ㄷ','ㅆ':'ㄷ','ㅈ':'ㄷ','ㅊ':'ㄷ','ㅌ':'ㄷ','ㅎ':'ㄷ','ㄹ':'ㄹ','ㄼ':'ㄹ','ㄽ':'ㄹ','ㄾ':'ㄹ','ㅀ':'ㄹ',
    'ㄻ':'ㅁ','ㅁ':'ㅁ','ㅂ':'ㅂ','ㅍ':'ㅂ','ㅄ':'ㅂ','ㄿ':'ㅂ','ㅇ':'ㅇ','':'' };
  const NASAL = { 'ㄱ':'ㅇ','ㄷ':'ㄴ','ㅂ':'ㅁ' };
  const TENSE = { 'ㄱ':'ㄲ','ㄷ':'ㄸ','ㅂ':'ㅃ','ㅅ':'ㅆ','ㅈ':'ㅉ' };
  // final + ㅎ → [remaining final, aspirated onset]
  const H_AFTER = { 'ㄱ':['','ㅋ'],'ㄲ':['','ㅋ'],'ㅋ':['','ㅋ'],'ㄺ':['ㄹ','ㅋ'],'ㄳ':['ㄱ','ㅆ'],
    'ㄷ':['','ㅌ'],'ㅅ':['','ㅌ'],'ㅆ':['','ㅌ'],'ㅌ':['','ㅌ'],'ㅈ':['','ㅊ'],'ㅊ':['','ㅊ'],'ㄵ':['ㄴ','ㅊ'],
    'ㅂ':['','ㅍ'],'ㅍ':['','ㅍ'],'ㄼ':['ㄹ','ㅍ'],'ㅄ':['ㅂ','ㅆ'] };

  function toSyllables(word) {
    return Array.from(word).map(ch => isSyllable(ch) ? Object.assign(decompose(ch), { tense: false }) : { raw: ch });
  }

  /** Apply sound-change rules to one word. opts.keepH: don't merge ㄱ/ㄷ/ㅂ + ㅎ (RR rule for nouns). */
  // Words whose pronunciation can't be derived from the general rules
  // (ㄴ+ㄹ → [ㄴㄴ] in some compounds, ㄴ-insertion). Values: sound form without tensing.
  const EXCEPTIONS = {
    '신문로':'신문노','의견란':'의견난','생산량':'생산냥','결단력':'결딴녁','공권력':'공꿘녁','상견례':'상견녜',
    '입원료':'이붠뇨','학여울':'항녀울','알약':'알략','색연필':'생년필','한여름':'한녀름','깻잎':'깬닙',
    '맛없다':'마덥다','맛없어요':'마덥서요','멋없다':'머덥다'
  };

  function applyRules(word, opts) {
    opts = opts || {};
    let key = word;
    for (const k of Object.keys(EXCEPTIONS)) if (word.includes(k)) key = key.replace(k, EXCEPTIONS[k]);
    const s = toSyllables(key);
    for (let i = 0; i < s.length; i++) {
      const a = s[i], b = s[i + 1];
      if (a.raw) continue;
      if (!b || b.raw) { a.jong = a.jong === 'ㄺ' ? 'ㄱ' : NEUTRAL[a.jong]; continue; }
      let J = a.jong;
      if (!J) continue;
      // 1) final ㅎ (incl. ㄶ ㅀ)
      if (J === 'ㅎ' || J === 'ㄶ' || J === 'ㅀ') {
        const rest = J === 'ㅎ' ? '' : (J === 'ㄶ' ? 'ㄴ' : 'ㄹ');
        if (ASP[b.cho] && b.cho !== 'ㅂ') { b.cho = ASP[b.cho]; a.jong = rest; continue; }
        if (b.cho === 'ㅅ') { a.jong = rest; b.tense = true; continue; }
        if (b.cho === 'ㄴ') a.jong = J === 'ㅎ' ? 'ㄴ' : rest;
        else if (b.cho === 'ㅇ') a.jong = rest;
        J = a.jong;
        if (!J) continue;
      }
      // 2) obstruent final + ㅎ → aspiration
      if (b.cho === 'ㅎ' && H_AFTER[J]) {
        if (opts.keepH) { a.jong = NEUTRAL[J]; continue; }
        const [keep, on] = H_AFTER[J];
        a.jong = keep; b.cho = on;
        if (on === 'ㅆ') b.tense = false;
        if ((J === 'ㄷ') && b.jung === 'ㅣ') b.cho = 'ㅊ'; // 굳히다 → [구치다]
        continue;
      }
      // 3) linking (연음) & palatalization (구개음화)
      if (b.cho === 'ㅇ') {
        if (J === 'ㅇ') continue;
        if (b.jung === 'ㅣ' && (J === 'ㄷ' || J === 'ㅌ' || J === 'ㄾ')) {
          if (J === 'ㄾ') { a.jong = 'ㄹ'; b.cho = 'ㅊ'; } else { a.jong = ''; b.cho = J === 'ㄷ' ? 'ㅈ' : 'ㅊ'; }
          continue;
        }
        if (JONG_SPLIT[J]) {
          const [x, y] = JONG_SPLIT[J];
          a.jong = x; b.cho = y;
          if (y === 'ㅅ') b.tense = true; // 값이 → [갑씨]
        } else { a.jong = ''; b.cho = J; }
        continue;
      }
      // 4) neutralize the final
      a.jong = (J === 'ㄺ' && b.cho === 'ㄱ') ? 'ㄹ' : (J === 'ㄺ' ? 'ㄱ' : NEUTRAL[J]);
      const j = a.jong, c = b.cho;
      // 5) nasalization (비음화) and ㄹ rules (유음화)
      if (c === 'ㄹ') {
        if (j === 'ㄴ') a.jong = 'ㄹ';
        else if (j === 'ㅁ' || j === 'ㅇ') b.cho = 'ㄴ';
        else if (NASAL[j]) { b.cho = 'ㄴ'; a.jong = NASAL[j]; }
      } else if (c === 'ㄴ') {
        if (j === 'ㄹ') b.cho = 'ㄹ';
        else if (NASAL[j]) a.jong = NASAL[j];
      } else if (c === 'ㅁ') {
        if (NASAL[j]) a.jong = NASAL[j];
      }
      // 6) tensing after ㄱ ㄷ ㅂ (not written in romanization)
      if ((NASAL[a.jong] || J === 'ㄺ' || J === 'ㄼ') && TENSE[b.cho]) b.tense = true;
    }
    return s;
  }

  function mapWords(text, fn) {
    return text.split(/(\s+)/).map(w => (/^\s+$/.test(w) || w === '') ? w : fn(w)).join('');
  }

  /** Pronounced form in Hangul, e.g. 합니다 → 함니다 */
  function pronounce(text) {
    return mapWords(text, w => applyRules(w).map(x => {
      if (x.raw) return x.raw;
      let cho = x.tense && TENSE[x.cho] ? TENSE[x.cho] : x.cho;
      let jung = x.jung;
      if (jung === 'ㅢ' && cho !== 'ㅇ') jung = 'ㅣ'; // 희망 → [히망]
      return compose(cho, jung, x.jong);
    }).join(''));
  }

  const RR_CHO = { 'ㄱ':'g','ㄲ':'kk','ㄴ':'n','ㄷ':'d','ㄸ':'tt','ㄹ':'r','ㅁ':'m','ㅂ':'b','ㅃ':'pp','ㅅ':'s','ㅆ':'ss',
    'ㅇ':'','ㅈ':'j','ㅉ':'jj','ㅊ':'ch','ㅋ':'k','ㅌ':'t','ㅍ':'p','ㅎ':'h' };
  const RR_JUNG = { 'ㅏ':'a','ㅐ':'ae','ㅑ':'ya','ㅒ':'yae','ㅓ':'eo','ㅔ':'e','ㅕ':'yeo','ㅖ':'ye','ㅗ':'o','ㅘ':'wa',
    'ㅙ':'wae','ㅚ':'oe','ㅛ':'yo','ㅜ':'u','ㅝ':'wo','ㅞ':'we','ㅟ':'wi','ㅠ':'yu','ㅡ':'eu','ㅢ':'ui','ㅣ':'i' };
  const RR_JONG = { '':'','ㄱ':'k','ㄴ':'n','ㄷ':'t','ㄹ':'l','ㅁ':'m','ㅂ':'p','ㅇ':'ng' };
  // letter-by-letter (transliteration) finals
  const TR_JONG = { '':'','ㄱ':'g','ㄲ':'kk','ㄳ':'gs','ㄴ':'n','ㄵ':'nj','ㄶ':'nh','ㄷ':'d','ㄹ':'l','ㄺ':'lg','ㄻ':'lm',
    'ㄼ':'lb','ㄽ':'ls','ㄾ':'lt','ㄿ':'lp','ㅀ':'lh','ㅁ':'m','ㅂ':'b','ㅄ':'bs','ㅅ':'s','ㅆ':'ss','ㅇ':'ng','ㅈ':'j',
    'ㅊ':'ch','ㅋ':'k','ㅌ':'t','ㅍ':'p','ㅎ':'h' };

  function rrFromSyllables(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const x = s[i];
      if (x.raw) { out += x.raw; continue; }
      const prev = s[i - 1];
      let c = RR_CHO[x.cho];
      if (x.cho === 'ㄹ' && prev && !prev.raw && prev.jong === 'ㄹ') c = 'l';
      out += c + RR_JUNG[x.jung] + (RR_JONG[x.jong] !== undefined ? RR_JONG[x.jong] : RR_JONG[NEUTRAL[x.jong]]);
    }
    return out;
  }

  /** Revised Romanization (sound-based), word by word. */
  function romanize(text, opts) {
    return mapWords(text, w => rrFromSyllables(applyRules(w, opts)));
  }
  /** Letter-by-letter transliteration (what a learner might type from the spelling). */
  function transliterate(text) {
    return mapWords(text, w => Array.from(w).map(ch => {
      if (!isSyllable(ch)) return ch;
      const d = decompose(ch);
      return RR_CHO[d.cho] + RR_JUNG[d.jung] + TR_JONG[d.jong];
    }).join(''));
  }
  /** Syllable-by-syllable with each final pronounced as if alone (e.g. gamsahapnida). */
  function naive(text) {
    return mapWords(text, w => Array.from(w).map(ch => {
      if (!isSyllable(ch)) return ch;
      const d = decompose(ch);
      return RR_CHO[d.cho] + RR_JUNG[d.jung] + RR_JONG[d.jong === 'ㄺ' ? 'ㄱ' : NEUTRAL[d.jong]];
    }).join(''));
  }

  // ---------------------------------------------------------------------------
  // Answer checking
  const normHangul = s => s.replace(/[^가-힣ㄱ-ㆎ]/g, '');
  const normRoman = s => s.toLowerCase().replace(/[^a-z]/g, '');
  /** forgiving romanization: merges sounds learners often mix up in spelling */
  const looseRoman = s => normRoman(s)
    .replace(/sh/g, 's').replace(/wae|oe/g, 'we').replace(/ae/g, 'e').replace(/oo/g, 'u').replace(/ee/g, 'i')
    .replace(/g/g, 'k').replace(/d/g, 't').replace(/b/g, 'p').replace(/r/g, 'l')
    .replace(/([a-z])\1+/g, '$1');

  function romanVariants(ko) {
    const set = new Set([romanize(ko), romanize(ko, { keepH: true }), transliterate(ko), naive(ko)].map(normRoman));
    return Array.from(set);
  }

  /**
   * Compare learner input with accepted answers (Hangul strings).
   * Returns { result: 'exact'|'close'|'wrong', match: <accepted answer or null> }
   */
  function check(input, accepted) {
    const list = Array.isArray(accepted) ? accepted : [accepted];
    if (!normHangul(input) && !normRoman(input)) return { result: 'wrong', match: null };
    if (hasHangul(input) && !hasLatin(input)) {
      const n = normHangul(input);
      for (const a of list) if (normHangul(a) === n) return { result: 'exact', match: a };
      // allow a converted-romanization mix, fall through to wrong
      return { result: 'wrong', match: null };
    }
    // romanized (or mixed) input: convert any Hangul parts to romanization first
    const romIn = normRoman(hasHangul(input) ? romanize(input) : input);
    for (const a of list) if (romanVariants(a).includes(romIn)) return { result: 'exact', match: a };
    const looseIn = looseRoman(romIn);
    for (const a of list) if (romanVariants(a).some(v => looseRoman(v) === looseIn)) return { result: 'close', match: a };
    return { result: 'wrong', match: null };
  }

  // ---------------------------------------------------------------------------
  // Typing helper with a dictionary of known words ("smart" conversion)
  const dict = new Map(); // normalized romanization → Hangul
  function addToDictionary(words) {
    for (const w of words) {
      const clean = w.replace(/[^가-힣\s]/g, '').trim();
      if (!clean) continue;
      const parts = clean.split(/\s+/);
      const all = parts.length > 1 ? [clean, ...parts] : parts;
      for (const p of all) for (const v of romanVariants(p)) if (v && !dict.has(v)) dict.set(v, p);
    }
  }
  /** Convert typed romanization to Hangul, preferring known words / expected answers. */
  function romanToHangul(text, expected) {
    if (!text) return '';
    if (expected && expected.length) {
      const n = normRoman(text);
      for (const a of expected) if (romanVariants(a).includes(n)) return a.replace(/[.?!,]/g, '');
    }
    return text.split(/(\s+)/).map(tok => {
      if (/^\s+$/.test(tok) || !tok) return tok;
      const m = tok.match(/^([^a-zA-Z'-]*)([a-zA-Z'-]+)([^a-zA-Z'-]*)$/);
      if (!m) return tok;
      const n = normRoman(m[2]);
      if (!m[2].includes('-') && dict.has(n)) return m[1] + dict.get(n) + m[3];
      return m[1] + romanWordToHangul(m[2]) + m[3];
    }).join('');
  }

  const api = {
    CHO, JUNG, JONG, isSyllable, decompose, compose, hasBatchim, copula, composeJamo,
    romanWordToHangul, romanToHangul, addToDictionary, pronounce, romanize, transliterate, naive,
    romanVariants, check, normHangul, normRoman, looseRoman, hasHangul, hasLatin, applyRules
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Hangul = api;
})(typeof window !== 'undefined' ? window : this);
