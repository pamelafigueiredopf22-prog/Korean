// Run: node tests/hangul.test.js
const H = require('../js/hangul.js');
let fail = 0, pass = 0;
const eq = (label, got, want) => {
  if (got === want) pass++; else { fail++; console.log(`✗ ${label}: got "${got}", want "${want}"`); }
};

// Official examples from 국어의 로마자 표기법 (Revised Romanization), 제3장 제1항
const RR = {
  '백마': 'baengma', '신문로': 'sinmunno', '종로': 'jongno', '왕십리': 'wangsimni', '별내': 'byeollae',
  '신라': 'silla', '해돋이': 'haedoji', '같이': 'gachi', '굳히다': 'guchida', '좋고': 'joko', '놓다': 'nota',
  '잡혀': 'japyeo', '낳지': 'nachi', '압구정': 'apgujeong', '낙동강': 'nakdonggang', '죽변': 'jukbyeon',
  '낙성대': 'nakseongdae', '합정': 'hapjeong', '팔당': 'paldang', '샛별': 'saetbyeol', '울산': 'ulsan',
  '구미': 'gumi', '영동': 'yeongdong', '백암': 'baegam', '옥천': 'okcheon', '합덕': 'hapdeok', '호법': 'hobeop',
  '월곶': 'wolgot', '벚꽃': 'beotkkot', '한밭': 'hanbat', '구리': 'guri', '설악': 'seorak', '칠곡': 'chilgok',
  '임실': 'imsil', '울릉': 'ulleung', '대관령': 'daegwallyeong', '광희문': 'gwanghuimun', '오죽헌': 'ojukheon',
};
for (const [k, v] of Object.entries(RR)) {
  // RR keeps ㅎ in nouns after ㄱ ㄷ ㅂ (e.g. 묵호 Mukho, 오죽헌 Ojukheon)
  const got = k === '오죽헌' ? H.romanize(k, { keepH: true }) : H.romanize(k);
  eq('RR ' + k, got, v);
}
eq('RR 묵호 (keepH)', H.romanize('묵호', { keepH: true }), 'mukho');
eq('RR 집현전 (keepH)', H.romanize('집현전', { keepH: true }), 'jiphyeonjeon');

// Pronunciation (표준 발음법 examples)
const PRON = {
  '음악': '으막', '한국어': '한구거', '옷이': '오시', '꽃이': '꼬치', '있어요': '이써요', '좋아요': '조아요',
  '많이': '마니', '싫어요': '시러요', '읽어요': '일거요', '앉아요': '안자요', '값이': '갑씨', '닭': '닥',
  '합니다': '함니다', '감사합니다': '감사함니다', '한국말': '한궁말', '작년': '장년', '국물': '궁물',
  '거짓말': '거진말', '끝나다': '끈나다', '앞문': '암문', '종로': '종노', '음료': '음뇨', '독립': '동닙',
  '신라': '실라', '연락': '열락', '설날': '설랄', '편리': '펼리', '좋다': '조타', '축하': '추카',
  '입학': '이팍', '많다': '만타', '못해요': '모태요', '같이': '가치', '굳이': '구지', '해돋이': '해도지',
  '학교': '학꾜', '식당': '식땅', '학생': '학쌩', '숙제': '숙쩨', '희망': '히망', '부엌': '부억', '밖': '박',
  '꽃': '꼳', '앞': '압', '값': '갑', '삶': '삼', '여덟': '여덜', '흙': '흑', '읽고': '일꼬', '놓는': '논는',
  '괜찮아요': '괜차나요', '반갑습니다': '반갑씀니다', '맛있어요': '마시써요', '밖에': '바께',
};
for (const [k, v] of Object.entries(PRON)) eq('pron ' + k, H.pronounce(k), v);

// Common phrases
const PH = {
  '안녕하세요': 'annyeonghaseyo', '감사합니다': 'gamsahamnida', '괜찮아요': 'gwaenchanayo',
  '처음 뵙겠습니다': 'cheoeum boepgetseumnida', '안녕히 계세요': 'annyeonghi gyeseyo',
  '맛있게 드세요': 'masitge deuseyo', '따뜻한': 'ttatteutan', '축하해요': 'chukahaeyo',
  '포장해 주세요': 'pojanghae juseyo', '빨리': 'ppalli', '이탈리아': 'itallia',
};
for (const [k, v] of Object.entries(PH)) eq('phrase ' + k, H.romanize(k), v);

// Jamo composition (keyboard)
eq('jamo 한국', H.composeJamo(['ㅎ','ㅏ','ㄴ','ㄱ','ㅜ','ㄱ']), '한국');
eq('jamo 앉아', H.composeJamo(['ㅇ','ㅏ','ㄴ','ㅈ','ㅇ','ㅏ']), '앉아');
eq('jamo 앉아 (carry)', H.composeJamo(['ㅇ','ㅏ','ㄴ','ㅈ','ㅏ']), '안자');
eq('jamo 과', H.composeJamo(['ㄱ','ㅗ','ㅏ']), '과');
eq('jamo 값', H.composeJamo(['ㄱ','ㅏ','ㅂ','ㅅ']), '값');
eq('jamo ㅋㅋ', H.composeJamo(['ㅋ','ㅋ']), 'ㅋㅋ');

// Romanization → Hangul (generic)
const R2H = { annyeong: '안녕', saram: '사람', ppalli: '빨리', gwaenchana: '괜차나', 'han-guk': '한국',
  mul: '물', juseyo: '주세요', kimchi: '킴치', gimchi: '김치', 'eolmayeyo': '얼마예요' };
for (const [k, v] of Object.entries(R2H)) eq('r2h ' + k, H.romanWordToHangul(k), v);

// Answer checking
const chk = (inp, acc) => H.check(inp, acc).result;
eq('check hangul', chk('감사합니다', ['감사합니다']), 'exact');
eq('check spaces', chk('안녕히가세요', ['안녕히 가세요']), 'exact');
eq('check rom', chk('gamsahamnida', ['감사합니다']), 'exact');
eq('check naive rom', chk('gamsahapnida', ['감사합니다']), 'exact');
eq('check spaced rom', chk('Annyeong haseyo!', ['안녕하세요']), 'exact');
eq('check McCune-ish', chk('kamsahamnida', ['감사합니다']), 'close');
eq('check wrong', chk('annyeonghi gaseyo', ['안녕히 계세요']), 'wrong');
eq('check hangul wrong', chk('안녕히 가세요', ['안녕히 계세요']), 'wrong');
eq('check particle', chk('jeoneun', ['저는']), 'exact');
eq('copula 민준', H.copula('민준'), '이에요');
eq('copula 마리아', H.copula('마리아'), '예요');

// Smart conversion
H.addToDictionary(['한국어', '감사합니다', '저는']);
eq('smart 한국어', H.romanToHangul('hangugeo'), '한국어');
eq('smart expected', H.romanToHangul('gamsahamnida', ['감사합니다.']), '감사합니다');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
