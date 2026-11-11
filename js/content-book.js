/* The Book: chapters → lessons (pages of blocks) + review items.
 * Inline Korean in text: [[한국어]] becomes a tappable, speakable word.
 * Sources for rules: 표준 발음법 (Standard Pronunciation, 국립국어원),
 * 국어의 로마자 표기법 (Revised Romanization), 훈민정음 해례본 for letter origins.
 */
window.BOOK = [
// =============================================================================
{
  id: 'c1', n: 1, title: 'Vowels', ko: '모음',
  blurb: 'How Hangul works, and the 21 vowels.',
  lessons: [
    { id: 'c1l1', title: 'How Hangul works', ko: '한글', pages: [
      { title: 'An alphabet made on purpose', blocks: [
        { t: 'p', html: 'Hangul ([[한글]]) was created in 1443 under King Sejong and published in 1446 in a book called <em>Hunminjeongeum</em> — “the correct sounds for teaching the people”. It was designed to be easy to learn, and it is: there are only 24 basic letters.' },
        { t: 'p', html: 'Letters are not written in a line like English. They are grouped into <b>syllable blocks</b>. Each block is one syllable and always starts with a consonant.' },
        { t: 'blocks', items: [
          { ko: '한', parts: ['ㅎ h', 'ㅏ a', 'ㄴ n'] },
          { ko: '글', parts: ['ㄱ g', 'ㅡ eu', 'ㄹ l'] },
        ] },
        { t: 'tip', html: 'Tap any Korean word in the app to hear it. Romanization (like <i>han-geul</i>) is shown to help you, but try to read the Hangul — you can hide romanization in Settings later.' },
      ] },
      { title: 'The silent placeholder ㅇ', blocks: [
        { t: 'p', html: 'Since every block must start with a consonant, a syllable that starts with a vowel sound uses <b>ㅇ</b> as a silent placeholder at the start. So the vowel ㅏ (a) written alone as a syllable is [[아]].' },
        { t: 'p', html: '(At the <i>bottom</i> of a block, ㅇ is not silent: it sounds like the <b>ng</b> in “song”. You’ll see that in chapter 3.)' },
        { t: 'check', q: 'Which block is the syllable “a” on its own?', options: ['아', 'ㅏ', '가'], answer: 0,
          explain: 'A syllable can’t start with a bare vowel, so we write the silent ㅇ first: 아.' },
      ] },
      { title: 'Where the vowel goes', blocks: [
        { t: 'p', html: 'Vowels are built from three shapes: a dot (the sky), a horizontal line ㅡ (the earth), and a vertical line ㅣ (a person). In modern writing the dot became a short stroke.' },
        { t: 'p', html: '<b>Tall vowels</b> (built on ㅣ, like ㅏ ㅓ ㅣ) go to the <b>right</b> of the consonant: [[아]], [[어]], [[이]].' },
        { t: 'p', html: '<b>Flat vowels</b> (built on ㅡ, like ㅗ ㅜ ㅡ) go <b>under</b> the consonant: [[오]], [[우]], [[으]].' },
        { t: 'check', q: 'ㅇ + ㅗ is written…', options: ['오', 'ㅇㅗ', '아'], answer: 0, explain: 'ㅗ is a flat vowel, so it goes under the ㅇ.' },
      ] },
    ] },
    { id: 'c1l2', title: 'The basic vowels', ko: '기본 모음', pages: [
      { title: 'Six simple vowels', blocks: [
        { t: 'p', html: 'Tap each letter to hear it. The romanization is the official Revised Romanization used in Korea (on road signs, maps, and so on).' },
        { t: 'letters', items: [
          { ko: 'ㅏ', say: '아', rom: 'a', note: 'a as in “father”' },
          { ko: 'ㅓ', say: '어', rom: 'eo', note: 'open “aw”, like the “u” in “up” with a rounder mouth' },
          { ko: 'ㅗ', say: '오', rom: 'o', note: 'rounded “o”, like “oh” but without gliding into “w”' },
          { ko: 'ㅜ', say: '우', rom: 'u', note: '“oo” as in “moon”' },
          { ko: 'ㅡ', say: '으', rom: 'eu', note: 'like “oo” but with flat, spread lips (as if smiling)' },
          { ko: 'ㅣ', say: '이', rom: 'i', note: '“ee” as in “see”' },
        ] },
        { t: 'tip', html: '<b>eo</b> and <b>eu</b> are two letters in romanization but just <b>one</b> sound each. ㅓ is not “e-o”.' },
      ] },
      { title: 'ㅐ and ㅔ', blocks: [
        { t: 'letters', items: [
          { ko: 'ㅐ', say: '애', rom: 'ae', note: 'like “e” in “bed” (a bit more open)' },
          { ko: 'ㅔ', say: '에', rom: 'e', note: 'like “e” in “bed”' },
        ] },
        { t: 'p', html: 'In the past these were different sounds. Today, most Koreans pronounce [[애]] and [[에]] the same, so don’t worry about hearing a difference. You still need to learn which one a word is <i>spelled</i> with: [[개]] (dog) vs [[게]] (crab).' },
      ] },
      { title: 'First words', blocks: [
        { t: 'p', html: 'You can already read these words, made only of vowels and the silent ㅇ:' },
        { t: 'words', items: [
          { ko: '아이', en: 'child' }, { ko: '오이', en: 'cucumber' }, { ko: '우유', en: 'milk' },
          { ko: '이', en: 'two / tooth' }, { ko: '오', en: 'five' }, { ko: '아우', en: 'younger sibling (literary)' },
        ] },
        { t: 'check', q: 'How do you read 오이?', options: ['oi (cucumber)', 'ai (child)', 'ui'], answer: 0, explain: 'ㅗ = o, ㅣ = i → oi, “cucumber”.' },
      ] },
    ] },
    { id: 'c1l3', title: 'Y-vowels and combined vowels', ko: '이중 모음', pages: [
      { title: 'Add a stroke, add a “y”', blocks: [
        { t: 'p', html: 'Doubling the short stroke adds a <b>y</b> sound in front of the vowel:' },
        { t: 'letters', items: [
          { ko: 'ㅑ', say: '야', rom: 'ya', note: 'ㅏ + y' }, { ko: 'ㅕ', say: '여', rom: 'yeo', note: 'ㅓ + y' },
          { ko: 'ㅛ', say: '요', rom: 'yo', note: 'ㅗ + y' }, { ko: 'ㅠ', say: '유', rom: 'yu', note: 'ㅜ + y' },
          { ko: 'ㅒ', say: '얘', rom: 'yae', note: 'ㅐ + y' }, { ko: 'ㅖ', say: '예', rom: 'ye', note: 'ㅔ + y' },
        ] },
        { t: 'words', items: [ { ko: '여우', en: 'fox' }, { ko: '우유', en: 'milk' }, { ko: '예', en: 'yes (very polite)' }, { ko: '여유', en: 'spare time, leisure' } ] },
      ] },
      { title: 'Combine two, get a “w”', blocks: [
        { t: 'p', html: 'Writing ㅗ or ㅜ together with another vowel makes a <b>w</b> sound:' },
        { t: 'letters', items: [
          { ko: 'ㅘ', say: '와', rom: 'wa', note: 'ㅗ + ㅏ' }, { ko: 'ㅙ', say: '왜', rom: 'wae', note: 'ㅗ + ㅐ' },
          { ko: 'ㅚ', say: '외', rom: 'oe', note: 'ㅗ + ㅣ — today said like “we”' }, { ko: 'ㅝ', say: '워', rom: 'wo', note: 'ㅜ + ㅓ' },
          { ko: 'ㅞ', say: '웨', rom: 'we', note: 'ㅜ + ㅔ' }, { ko: 'ㅟ', say: '위', rom: 'wi', note: 'ㅜ + ㅣ' },
        ] },
        { t: 'tip', html: 'ㅙ, ㅚ and ㅞ sound almost the same in everyday speech (“we”). Again: hear one sound, learn the spelling.' },
      ] },
      { title: 'The special one: ㅢ', blocks: [
        { t: 'letters', items: [ { ko: 'ㅢ', say: '의', rom: 'ui', note: 'ㅡ + ㅣ, glide from “eu” to “i”' } ] },
        { t: 'p', html: 'ㅢ changes depending on where it is (Standard Pronunciation, art. 5):' },
        { t: 'table', head: ['Where', 'Sounds like', 'Example'], rows: [
          ['At the start of a word', '[의]', '[[의자]] chair'],
          ['After a consonant', '[이]', '[[희망]] hope → [히망]'],
          ['Later in a word', '[의] or [이]', '[[주의]] caution'],
          ['The particle 의 (“of”)', '[의] or [에]', '[[나의]] my'],
        ] },
        { t: 'p', html: 'Romanization always writes it <b>ui</b>, whatever the sound.' },
      ] },
      { title: 'Read these', blocks: [
        { t: 'words', items: [ { ko: '와', en: 'wow! / and' }, { ko: '왜', en: 'why' }, { ko: '위', en: 'top, above' }, { ko: '외우다', en: 'to memorize' }, { ko: '의의', en: 'significance' } ] },
        { t: 'check', q: 'Which vowel is in 왜 (why)?', options: ['ㅙ (wae)', 'ㅚ (oe)', 'ㅞ (we)'], answer: 0, explain: '왜 = ㅇ + ㅙ (ㅗ + ㅐ). The three sound alike, but the spelling is ㅙ.' },
      ] },
    ] },
  ],
  items: [
    ...[['ㅏ','아','a'],['ㅓ','어','eo'],['ㅗ','오','o'],['ㅜ','우','u'],['ㅡ','으','eu'],['ㅣ','이','i'],['ㅐ','애','ae'],['ㅔ','에','e'],
        ['ㅑ','야','ya'],['ㅕ','여','yeo'],['ㅛ','요','yo'],['ㅠ','유','yu'],['ㅒ','얘','yae'],['ㅖ','예','ye'],
        ['ㅘ','와','wa'],['ㅙ','왜','wae'],['ㅚ','외','oe'],['ㅝ','워','wo'],['ㅞ','웨','we'],['ㅟ','위','wi'],['ㅢ','의','ui']]
      .map(([ko, say, rom]) => ({ id: 'v-' + rom, kind: 'letter', ko, say, rom })),
    ...[['아이','child'],['오이','cucumber'],['우유','milk'],['여우','fox'],['왜','why'],['위','top, above'],['예','yes (very polite)'],['여유','spare time, leisure'],['외우다','to memorize'],['의자','chair']]
      .map(([ko, en]) => ({ id: 'w-' + ko, kind: 'word', ko, en })),
  ],
  quizzes: [
    { id: 'q1-1', q: 'In which block is the vowel written UNDER the consonant?', options: ['우', '어', '이', '아'], answer: 0, explain: 'ㅜ is a flat vowel (built on ㅡ), so it goes under the consonant.' },
    { id: 'q1-2', q: 'What does the ㅇ in 아 do?', options: ['Nothing — it’s a silent placeholder', 'It sounds like “ng”', 'It sounds like “o”'], answer: 0, explain: 'At the start of a block ㅇ is silent. Only at the bottom is it “ng”.' },
    { id: 'q1-3', q: '개 (dog) and 게 (crab) sound…', options: ['The same for most speakers today', 'Very different', 'Like “gay” and “gee”'], answer: 0, explain: 'ㅐ and ㅔ have merged in modern speech. Spelling still tells them apart.' },
    { id: 'q1-4', q: '희망 (hope) is pronounced…', options: ['[히망]', '[희망] with a clear “ui”', '[흐망]'], answer: 0, explain: 'After a consonant, ㅢ is pronounced [ㅣ].' },
  ],
},
// =============================================================================
{
  id: 'c2', n: 2, title: 'Consonants', ko: '자음',
  blurb: 'The 19 consonants: plain, aspirated and tense.',
  lessons: [
    { id: 'c2l1', title: 'The basic consonants', ko: '기본 자음', pages: [
      { title: 'Shapes of the mouth', blocks: [
        { t: 'p', html: 'The basic consonants were designed to picture the mouth making the sound: ㄱ is the back of the tongue blocking the throat, ㄴ is the tongue tip touching behind the teeth, ㅁ is the closed mouth, ㅅ is a tooth, and ㅇ is the open throat.' },
        { t: 'letters', items: [
          { ko: 'ㄱ', say: '가', rom: 'g / k', note: 'between g and k', name: '기역' },
          { ko: 'ㄴ', say: '나', rom: 'n', note: 'n', name: '니은' },
          { ko: 'ㄷ', say: '다', rom: 'd / t', note: 'between d and t', name: '디귿' },
          { ko: 'ㄹ', say: '라', rom: 'r / l', note: 'a light flap (like the “tt” in American “butter”); “l” at the end', name: '리을' },
          { ko: 'ㅁ', say: '마', rom: 'm', note: 'm', name: '미음' },
          { ko: 'ㅂ', say: '바', rom: 'b / p', note: 'between b and p', name: '비읍' },
          { ko: 'ㅅ', say: '사', rom: 's', note: 's — but “sh” before ㅣ and y-vowels', name: '시옷' },
          { ko: 'ㅇ', say: '아', rom: '– / ng', note: 'silent at the start, “ng” at the end', name: '이응' },
          { ko: 'ㅈ', say: '자', rom: 'j', note: 'between j and ch', name: '지읒' },
          { ko: 'ㅎ', say: '하', rom: 'h', note: 'h', name: '히읗' },
        ] },
        { t: 'tip', html: 'Each letter also has a name, like [[기역]] for ㄱ. Koreans use the names when spelling words out loud.' },
      ] },
      { title: 'Why “g / k”?', blocks: [
        { t: 'p', html: 'ㄱ ㄷ ㅂ ㅈ are soft, relaxed sounds. At the very start of a word they sound close to a soft <b>k, t, p, ch</b> (no voice). Between two vowels they become voiced: <b>g, d, b, j</b>.' },
        { t: 'p', html: 'Listen to the ㄱ in [[고기]] (meat): the first one is softer, almost a k; the second is a clear g. Romanization writes both as <b>g</b>: <i>gogi</i>.' },
        { t: 'words', items: [ { ko: '고기', en: 'meat' }, { ko: '바다', en: 'sea' }, { ko: '두부', en: 'tofu' }, { ko: '지도', en: 'map' } ] },
      ] },
      { title: 'Build some words', blocks: [
        { t: 'words', items: [
          { ko: '나무', en: 'tree' }, { ko: '하나', en: 'one' }, { ko: '모자', en: 'hat' }, { ko: '나비', en: 'butterfly' },
          { ko: '머리', en: 'head, hair' }, { ko: '소리', en: 'sound' }, { ko: '사자', en: 'lion' }, { ko: '시계', en: 'clock, watch' },
          { ko: '가구', en: 'furniture' }, { ko: '어머니', en: 'mother' }, { ko: '라디오', en: 'radio' },
        ] },
        { t: 'tip', html: 'Notice [[시계]]: ㅅ before ㅣ sounds like “sh” — <i>shi</i>. Romanization still writes <b>s</b>: <i>sigye</i>.' },
        { t: 'check', q: 'How is 나비 (butterfly) read?', options: ['nabi', 'rami', 'nagi'], answer: 0, explain: 'ㄴ = n, ㅏ = a, ㅂ = b, ㅣ = i → nabi.' },
      ] },
    ] },
    { id: 'c2l2', title: 'Aspirated consonants', ko: '거센소리', pages: [
      { title: 'A puff of air', blocks: [
        { t: 'p', html: 'Adding a stroke to a soft consonant makes an <b>aspirated</b> one — said with a strong puff of air. Hold your hand in front of your mouth: you should feel it.' },
        { t: 'letters', items: [
          { ko: 'ㅋ', say: '카', rom: 'k', note: 'strong k (ㄱ + stroke)', name: '키읔' },
          { ko: 'ㅌ', say: '타', rom: 't', note: 'strong t (ㄷ + stroke)', name: '티읕' },
          { ko: 'ㅍ', say: '파', rom: 'p', note: 'strong p', name: '피읖' },
          { ko: 'ㅊ', say: '차', rom: 'ch', note: 'strong ch (ㅈ + stroke)', name: '치읓' },
        ] },
        { t: 'words', items: [ { ko: '커피', en: 'coffee' }, { ko: '기차', en: 'train' }, { ko: '치마', en: 'skirt' }, { ko: '토마토', en: 'tomato' }, { ko: '피자', en: 'pizza' }, { ko: '카드', en: 'card' } ] },
      ] },
    ] },
    { id: 'c2l3', title: 'Tense consonants', ko: '된소리', pages: [
      { title: 'Doubled letters, tight sounds', blocks: [
        { t: 'p', html: 'Doubled letters are <b>tense</b>: tighten your throat, no puff of air, and the sound comes out sharp — like the “k” in “sky” or the “p” in “spy”.' },
        { t: 'letters', items: [
          { ko: 'ㄲ', say: '까', rom: 'kk', name: '쌍기역' }, { ko: 'ㄸ', say: '따', rom: 'tt', name: '쌍디귿' },
          { ko: 'ㅃ', say: '빠', rom: 'pp', name: '쌍비읍' }, { ko: 'ㅆ', say: '싸', rom: 'ss', name: '쌍시옷' },
          { ko: 'ㅉ', say: '짜', rom: 'jj', name: '쌍지읒' },
        ] },
        { t: 'words', items: [ { ko: '아빠', en: 'dad' }, { ko: '오빠', en: 'older brother (said by a female)' }, { ko: '토끼', en: 'rabbit' }, { ko: '아저씨', en: 'mister, middle-aged man' }, { ko: '찌개', en: 'stew' }, { ko: '꼬리', en: 'tail' } ] },
      ] },
      { title: 'Plain, aspirated, tense', blocks: [
        { t: 'p', html: 'Korean has three-way sets. Changing the type changes the word! Tap each one and listen:' },
        { t: 'triples', items: [
          [ { ko: '불', en: 'fire' }, { ko: '풀', en: 'grass' }, { ko: '뿔', en: 'horn' } ],
          [ { ko: '달', en: 'moon' }, { ko: '탈', en: 'mask' }, { ko: '딸', en: 'daughter' } ],
          [ { ko: '자다', en: 'to sleep' }, { ko: '차다', en: 'to kick' }, { ko: '짜다', en: 'to be salty' } ],
          [ { ko: '사다', en: 'to buy' }, null, { ko: '싸다', en: 'to be cheap' } ],
        ] },
        { t: 'tip', html: 'Plain = relaxed and a little breathy. Aspirated = big puff. Tense = tight, no puff. It takes time to hear — the Review Room will drill it.' },
        { t: 'check', q: 'Which one means “daughter”?', options: ['딸', '달', '탈'], answer: 0, explain: '딸 (tense ㄸ) = daughter; 달 = moon; 탈 = mask.' },
      ] },
      { title: 'All the vowels + consonants', blocks: [
        { t: 'p', html: 'Now you can read any block without a final consonant. Try these:' },
        { t: 'words', items: [
          { ko: '사과', en: 'apple' }, { ko: '과자', en: 'snack, cookie' }, { ko: '돼지', en: 'pig' }, { ko: '뭐', en: 'what' },
          { ko: '귀', en: 'ear' }, { ko: '회사', en: 'company, office' }, { ko: '가게', en: 'shop' }, { ko: '휴지', en: 'tissue' },
          { ko: '바지', en: 'trousers' }, { ko: '개', en: 'dog' }, { ko: '게', en: 'crab' },
        ] },
      ] },
    ] },
  ],
  items: [
    ...[['ㄱ','가','g'],['ㄴ','나','n'],['ㄷ','다','d'],['ㄹ','라','r'],['ㅁ','마','m'],['ㅂ','바','b'],['ㅅ','사','s'],['ㅈ','자','j'],['ㅎ','하','h'],
        ['ㅋ','카','k'],['ㅌ','타','t'],['ㅍ','파','p'],['ㅊ','차','ch'],['ㄲ','까','kk'],['ㄸ','따','tt'],['ㅃ','빠','pp'],['ㅆ','싸','ss'],['ㅉ','짜','jj']]
      .map(([ko, say, rom]) => ({ id: 'c-' + rom, kind: 'letter', ko, say, rom, accept: rom === 'g' ? ['g','k'] : rom === 'd' ? ['d','t'] : rom === 'b' ? ['b','p'] : rom === 'r' ? ['r','l'] : [rom] })),
    ...[['나무','tree'],['바다','sea'],['하나','one'],['모자','hat'],['나비','butterfly'],['고기','meat'],['두부','tofu'],['머리','head, hair'],
        ['소리','sound'],['지도','map'],['시계','clock, watch'],['어머니','mother'],['커피','coffee'],['기차','train'],['치마','skirt'],['피자','pizza'],
        ['카드','card'],['아빠','dad'],['토끼','rabbit'],['아저씨','mister'],['찌개','stew'],['사과','apple'],['돼지','pig'],['뭐','what'],
        ['귀','ear'],['회사','company, office'],['가게','shop'],['바지','trousers'],['개','dog'],['게','crab'],
        ['불','fire'],['풀','grass'],['뿔','horn'],['달','moon'],['탈','mask'],['딸','daughter'],['사다','to buy'],['싸다','to be cheap'],
        ['자다','to sleep'],['짜다','to be salty']]
      .map(([ko, en]) => ({ id: 'w-' + ko, kind: 'word', ko, en })),
  ],
  quizzes: [
    { id: 'q2-1', q: 'Which consonant is aspirated (with a puff of air)?', options: ['ㅌ', 'ㄸ', 'ㄷ'], answer: 0, explain: 'ㅌ = aspirated, ㄸ = tense, ㄷ = plain.' },
    { id: 'q2-2', q: '싸다 means “to be cheap”. What does 사다 mean?', options: ['to buy', 'to sleep', 'to be salty'], answer: 0, explain: 'Plain ㅅ vs tense ㅆ: 사다 to buy, 싸다 to be cheap.' },
    { id: 'q2-3', q: 'Between two vowels (as in 고기), the second ㄱ sounds like…', options: ['g (voiced)', 'k with a puff', 'kk'], answer: 0, explain: 'Plain ㄱ ㄷ ㅂ ㅈ become voiced between vowels: g d b j.' },
    { id: 'q2-4', q: 'How does 시 sound?', options: ['shi', 'si (like “sit”)', 'ssi'], answer: 0, explain: 'ㅅ before ㅣ sounds like “sh”.' },
    { id: 'q2-5', q: 'Which letter is called 기역?', options: ['ㄱ', 'ㅋ', 'ㄲ'], answer: 0, explain: 'ㄱ 기역, ㅋ 키읔, ㄲ 쌍기역.' },
  ],
},
// =============================================================================
{
  id: 'c3', n: 3, title: 'Final consonants', ko: '받침',
  blurb: 'The bottom of the block, and its 7 sounds.',
  lessons: [
    { id: 'c3l1', title: 'The bottom of the block', ko: '받침', pages: [
      { title: 'Consonant at the bottom', blocks: [
        { t: 'p', html: 'A block can end with a consonant at the bottom. This final consonant is called [[받침]] (literally “support”, “what holds it up”).' },
        { t: 'blocks', items: [
          { ko: '밥', parts: ['ㅂ b', 'ㅏ a', 'ㅂ p'] },
          { ko: '물', parts: ['ㅁ m', 'ㅜ u', 'ㄹ l'] },
          { ko: '강', parts: ['ㄱ g', 'ㅏ a', 'ㅇ ng'] },
        ] },
        { t: 'p', html: 'The final consonant always goes at the bottom, whether the vowel is tall (밥) or flat (물).' },
      ] },
      { title: 'First words with 받침', blocks: [
        { t: 'words', items: [
          { ko: '밥', en: 'rice, a meal' }, { ko: '물', en: 'water' }, { ko: '집', en: 'house, home' }, { ko: '문', en: 'door' },
          { ko: '방', en: 'room' }, { ko: '산', en: 'mountain' }, { ko: '강', en: 'river' }, { ko: '곰', en: 'bear' },
          { ko: '사람', en: 'person' }, { ko: '김치', en: 'kimchi' }, { ko: '한국', en: 'Korea' }, { ko: '빵', en: 'bread' },
        ] },
        { t: 'tip', html: 'ㄹ at the bottom is an “l” sound: [[물]] <i>mul</i>. ㅇ at the bottom is “ng”: [[방]] <i>bang</i>.' },
      ] },
    ] },
    { id: 'c3l2', title: 'Only seven final sounds', ko: '일곱 개의 소리', pages: [
      { title: 'Many letters, seven sounds', blocks: [
        { t: 'p', html: 'Almost any consonant can be written at the bottom, but at the end of a syllable Korean only <b>pronounces seven sounds</b> (Standard Pronunciation, art. 8). The k, t, p sounds are “unreleased”: your mouth closes but no air bursts out.' },
        { t: 'table', head: ['Written', 'Sounds like', 'Romanized'], rows: [
          ['ㄱ ㄲ ㅋ', '[ㄱ]', 'k'],
          ['ㄴ', '[ㄴ]', 'n'],
          ['ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ', '[ㄷ]', 't'],
          ['ㄹ', '[ㄹ]', 'l'],
          ['ㅁ', '[ㅁ]', 'm'],
          ['ㅂ ㅍ', '[ㅂ]', 'p'],
          ['ㅇ', '[ㅇ]', 'ng'],
        ] },
      ] },
      { title: 'Same sound, different spelling', blocks: [
        { t: 'p', html: 'That’s why these all sound like [낟] <i>nat</i>:' },
        { t: 'words', items: [ { ko: '낫', en: 'sickle' }, { ko: '낮', en: 'daytime' }, { ko: '낯', en: 'face (literary)' } ] },
        { t: 'p', html: 'More examples:' },
        { t: 'change', items: [
          { ko: '밖', pron: '박', note: 'outside — ㄲ → [ㄱ]' },
          { ko: '부엌', pron: '부억', note: 'kitchen — ㅋ → [ㄱ]' },
          { ko: '옷', pron: '옫', note: 'clothes — ㅅ → [ㄷ]' },
          { ko: '꽃', pron: '꼳', note: 'flower — ㅊ → [ㄷ]' },
          { ko: '밭', pron: '받', note: 'field — ㅌ → [ㄷ]' },
          { ko: '앞', pron: '압', note: 'front — ㅍ → [ㅂ]' },
        ] },
        { t: 'check', q: 'How is 꽃 (flower) pronounced on its own?', options: ['[꼳] kkot', '[꼿] kkoch', '[꼬] kko'], answer: 0, explain: 'ㅊ at the end is pronounced as [ㄷ], romanized t.' },
      ] },
    ] },
    { id: 'c3l3', title: 'Double final consonants', ko: '겹받침', pages: [
      { title: 'Two letters, one sound', blocks: [
        { t: 'p', html: 'Some words have <b>two</b> consonants at the bottom, like [[닭]] (chicken). When nothing follows (or a consonant follows), you only pronounce <b>one</b> of them (art. 10–11):' },
        { t: 'table', head: ['Written', 'Say', 'Example'], rows: [
          ['ㄳ', '[ㄱ]', '[[넋]] soul → [넉]'],
          ['ㄵ', '[ㄴ]', '[[앉다]] to sit → [안따]'],
          ['ㄼ', '[ㄹ]', '[[여덟]] eight → [여덜]'],
          ['ㅄ', '[ㅂ]', '[[값]] price → [갑]'],
          ['ㄺ', '[ㄱ]', '[[닭]] chicken → [닥]'],
          ['ㄻ', '[ㅁ]', '[[삶]] life → [삼]'],
        ] },
        { t: 'tip', html: 'Rule of thumb: for ㄳ ㄵ ㄼ ㅄ say the <b>first</b> letter; for ㄺ ㄻ say the <b>second</b>. (There are a few exceptions, e.g. [[밟다]] → [밥따], and ㄺ before ㄱ: [[읽고]] → [일꼬].)' },
      ] },
      { title: 'Practice reading', blocks: [
        { t: 'words', items: [
          { ko: '값', en: 'price', pron: '갑' }, { ko: '닭', en: 'chicken', pron: '닥' }, { ko: '삶', en: 'life', pron: '삼' },
          { ko: '여덟', en: 'eight', pron: '여덜' }, { ko: '흙', en: 'soil, earth', pron: '흑' },
        ] },
        { t: 'check', q: '값 (price) sounds like…', options: ['[갑] gap', '[갓] gat', '[감] gam'], answer: 0, explain: 'For ㅄ, pronounce the first letter, ㅂ → [갑].' },
      ] },
    ] },
  ],
  items: [
    ...[['밥','rice, a meal'],['물','water'],['집','house, home'],['문','door'],['방','room'],['산','mountain'],['강','river'],['곰','bear'],
        ['사람','person'],['김치','kimchi'],['한국','Korea'],['빵','bread'],['책','book'],['맛','taste'],['숲','forest'],['옷','clothes'],
        ['꽃','flower'],['밖','outside'],['부엌','kitchen'],['앞','front'],['낮','daytime'],['값','price'],['닭','chicken'],['삶','life'],['여덟','eight'],['흙','soil, earth']]
      .map(([ko, en]) => ({ id: 'w-' + ko, kind: 'word', ko, en })),
    ...[['밖','박',['밖','밬']],['부엌','부억',['부엇','부엉']],['옷','옫',['오','옵']],['꽃','꼳',['꼬','꼽']],['밭','받',['밧','바']],['앞','압',['악','아']],
        ['낮','낟',['나','낙']],['숲','숩',['숙','수']],['값','갑',['갓','감']],['닭','닥',['달','다']],['삶','삼',['살','사']],['여덟','여덜',['여덥','여더']],['흙','흑',['흘','흐']]]
      .map(([ko, pron, wrong]) => ({ id: 'p-' + ko, kind: 'sound', ko, pron, wrong })),
  ],
  quizzes: [
    { id: 'q3-1', q: 'How many different final consonant SOUNDS are there?', options: ['7', '14', '19'], answer: 0, explain: 'ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ — seven.' },
    { id: 'q3-2', q: 'ㅅ ㅈ ㅊ ㅌ ㅎ at the end of a syllable all sound like…', options: ['[ㄷ] t', '[ㅅ] s', '[ㅎ] h'], answer: 0, explain: 'They all neutralize to an unreleased [ㄷ].' },
    { id: 'q3-3', q: 'ㄹ at the bottom of a block (as in 물) sounds like…', options: ['l', 'r', 'n'], answer: 0, explain: 'Final ㄹ is “l”: mul.' },
    { id: 'q3-4', q: 'ㅇ at the bottom of a block (as in 방) sounds like…', options: ['ng', 'nothing', 'o'], answer: 0, explain: 'Final ㅇ = ng, as in “song”.' },
  ],
},
// =============================================================================
{
  id: 'c4', n: 4, title: 'Sound changes', ko: '발음 규칙',
  blurb: 'Why Korean isn’t always read letter by letter.',
  lessons: [
    { id: 'c4l1', title: 'Linking', ko: '연음', pages: [
      { title: 'The final slides over', blocks: [
        { t: 'p', html: 'When a block with a final consonant is followed by a block starting with the silent ㅇ, the final consonant <b>moves over</b> and is pronounced at the start of the next syllable (art. 13).' },
        { t: 'change', items: [
          { ko: '음악', pron: '으막', note: 'music' },
          { ko: '한국어', pron: '한구거', note: 'the Korean language' },
          { ko: '옷이', pron: '오시', note: 'clothes (+ subject marker)' },
          { ko: '꽃이', pron: '꼬치', note: 'flower (+ subject marker) — the real ㅊ comes back!' },
          { ko: '있어요', pron: '이써요', note: 'there is / I have' },
        ] },
        { t: 'tip', html: 'Notice [[꽃이]]: alone, 꽃 is [꼳], but when it links, the original ㅊ is heard. Linking uses the <b>written</b> letter.' },
      ] },
      { title: 'Two finals: one stays, one moves', blocks: [
        { t: 'p', html: 'With a double final, the first stays and the second moves over (art. 14):' },
        { t: 'change', items: [
          { ko: '읽어요', pron: '일거요', note: 'I read' },
          { ko: '앉아요', pron: '안자요', note: 'I sit' },
          { ko: '값이', pron: '갑씨', note: 'the price (+ subject marker) — ㅅ also becomes tense' },
        ] },
      ] },
      { title: 'Except ㅇ and ㅎ', blocks: [
        { t: 'p', html: '<b>ㅇ</b> never moves: [[고양이]] (cat) is just <i>goyangi</i>.' },
        { t: 'p', html: '<b>ㅎ</b> disappears before a vowel (art. 12-4):' },
        { t: 'change', items: [
          { ko: '좋아요', pron: '조아요', note: 'it’s good / I like it' },
          { ko: '많이', pron: '마니', note: 'a lot' },
          { ko: '괜찮아요', pron: '괜차나요', note: 'it’s okay' },
          { ko: '싫어요', pron: '시러요', note: 'I don’t like it' },
        ] },
        { t: 'check', q: 'How is 음악 (music) pronounced?', options: ['[으막] eumak', '[음악] eum-ak with a pause', '[응악]'], answer: 0, explain: 'The ㅁ links into the next syllable: 으-막.' },
      ] },
    ] },
    { id: 'c4l2', title: 'Nasalization', ko: '비음화', pages: [
      { title: 'k, t, p become ng, n, m', blocks: [
        { t: 'p', html: 'A final [ㄱ], [ㄷ] or [ㅂ] sound followed by <b>ㄴ</b> or <b>ㅁ</b> becomes nasal (art. 18):' },
        { t: 'table', head: ['Final sound', '+ ㄴ / ㅁ', 'becomes'], rows: [ ['[ㄱ]', '→', '[ㅇ]'], ['[ㄷ]', '→', '[ㄴ]'], ['[ㅂ]', '→', '[ㅁ]'] ] },
        { t: 'change', items: [
          { ko: '합니다', pron: '함니다', note: 'polite “do” — you’ll hear this constantly' },
          { ko: '감사합니다', pron: '감사함니다', note: 'thank you' },
          { ko: '한국말', pron: '한궁말', note: 'the Korean language (spoken)' },
          { ko: '작년', pron: '장년', note: 'last year' },
          { ko: '거짓말', pron: '거진말', note: 'a lie (ㅅ → [ㄷ] → [ㄴ])' },
          { ko: '앞문', pron: '암문', note: 'front door (ㅍ → [ㅂ] → [ㅁ])' },
        ] },
      ] },
      { title: 'ㄹ becomes ㄴ', blocks: [
        { t: 'p', html: 'After ㅁ or ㅇ, a ㄹ is pronounced [ㄴ] (art. 19). After [ㄱ] or [ㅂ], the ㄹ becomes [ㄴ] <i>and</i> then the final becomes nasal too:' },
        { t: 'change', items: [
          { ko: '종로', pron: '종노', note: 'Jongno, a district in Seoul' },
          { ko: '음료', pron: '음뇨', note: 'drink, beverage' },
          { ko: '독립', pron: '동닙', note: 'independence' },
        ] },
        { t: 'check', q: 'How is 입니다 (polite “is”) pronounced?', options: ['[임니다] imnida', '[입니다] ipnida', '[인니다] innida'], answer: 0, explain: '[ㅂ] + ㄴ → [ㅁ]: 임니다.' },
      ] },
    ] },
    { id: 'c4l3', title: 'ㄹ + ㄴ', ko: '유음화', pages: [
      { title: 'ㄴ and ㄹ together → ㄹㄹ', blocks: [
        { t: 'p', html: 'When ㄴ and ㄹ meet (in either order), both are pronounced as [ㄹ] (art. 20). Romanization writes <b>ll</b>.' },
        { t: 'change', items: [
          { ko: '신라', pron: '실라', note: 'Silla, an ancient kingdom' },
          { ko: '연락', pron: '열락', note: 'contact, getting in touch' },
          { ko: '설날', pron: '설랄', note: 'Lunar New Year' },
          { ko: '편리', pron: '펼리', note: 'convenience' },
          { ko: '일년', pron: '일련', note: 'one year' },
        ] },
        { t: 'tip', html: 'A few Sino-Korean compounds are exceptions and say [ㄴㄴ] instead, e.g. [[의견란]] → [의견난]. You’ll meet them rarely.' },
      ] },
    ] },
    { id: 'c4l4', title: 'Aspiration, palatalization, tensing', ko: '격음화 · 구개음화 · 경음화', pages: [
      { title: 'ㅎ adds a puff', blocks: [
        { t: 'p', html: 'ㄱ ㄷ ㅂ ㅈ next to ㅎ (in either order) merge into the aspirated ㅋ ㅌ ㅍ ㅊ (art. 12):' },
        { t: 'change', items: [
          { ko: '좋다', pron: '조타', note: 'to be good (ㅎ + ㄷ → ㅌ)' },
          { ko: '축하해요', pron: '추카해요', note: 'congratulations (ㄱ + ㅎ → ㅋ)' },
          { ko: '입학', pron: '이팍', note: 'school entrance (ㅂ + ㅎ → ㅍ)' },
          { ko: '못해요', pron: '모태요', note: 'I can’t (ㅅ → [ㄷ] + ㅎ → ㅌ)' },
          { ko: '많다', pron: '만타', note: 'to be many (ㄶ: ㅎ + ㄷ → ㅌ)' },
        ] },
      ] },
      { title: 'ㄷ/ㅌ + 이 → 지/치', blocks: [
        { t: 'p', html: 'A final ㄷ or ㅌ followed by [[이]] becomes [ㅈ] or [ㅊ] (art. 17):' },
        { t: 'change', items: [
          { ko: '같이', pron: '가치', note: 'together' },
          { ko: '굳이', pron: '구지', note: 'insistently, “really have to?”' },
          { ko: '해돋이', pron: '해도지', note: 'sunrise' },
        ] },
      ] },
      { title: 'Tensing', blocks: [
        { t: 'p', html: 'After a final [ㄱ], [ㄷ] or [ㅂ] sound, a following ㄱ ㄷ ㅂ ㅅ ㅈ becomes tense: ㄲ ㄸ ㅃ ㅆ ㅉ (art. 23).' },
        { t: 'change', items: [
          { ko: '학교', pron: '학꾜', note: 'school' },
          { ko: '식당', pron: '식땅', note: 'restaurant' },
          { ko: '학생', pron: '학쌩', note: 'student' },
          { ko: '숙제', pron: '숙쩨', note: 'homework' },
        ] },
        { t: 'tip', html: 'Romanization does <b>not</b> show tensing: [[학교]] is <i>hakgyo</i>, not <i>hakkkyo</i>. So when you type answers in romanization, write it the official way — or the way it sounds; both are accepted.' },
        { t: 'check', q: 'How is 같이 (together) pronounced?', options: ['[가치] gachi', '[가티] gati', '[갇이] gadi'], answer: 0, explain: 'ㅌ + 이 → [치].' },
      ] },
    ] },
  ],
  items: [
    ...[
      ['음악','으막',['음막','으낙'],'music'],['한국어','한구거',['한국거','한구커'],'the Korean language'],['옷이','오시',['오디','옫이'],'clothes (subject)'],
      ['꽃이','꼬치',['꼬디','꼬시'],'flower (subject)'],['있어요','이써요',['이서요','잇어요'],'there is / I have'],['읽어요','일거요',['이거요','익어요'],'I read'],
      ['앉아요','안자요',['아나요','안아요'],'I sit'],['좋아요','조아요',['조하요','조타요'],'it’s good'],['많이','마니',['만히','만치'],'a lot'],
      ['괜찮아요','괜차나요',['괜찬하요','괜차가요'],'it’s okay'],['합니다','함니다',['합니다','한니다'],'(I) do — formal'],['감사합니다','감사함니다',['감사합니다','감사한니다'],'thank you'],
      ['한국말','한궁말',['한국말','한군말'],'Korean (spoken language)'],['작년','장년',['작년','잔년'],'last year'],['거짓말','거진말',['거짇말','거짐말'],'a lie'],
      ['종로','종노',['종로','존노'],'Jongno (Seoul)'],['음료','음뇨',['음료','을료'],'drink, beverage'],['독립','동닙',['독닙','동립'],'independence'],
      ['신라','실라',['신나','신라'],'Silla (kingdom)'],['연락','열락',['연낙','연락'],'contact'],['설날','설랄',['선날','설날'],'Lunar New Year'],
      ['좋다','조타',['조다','졷다'],'to be good'],['축하해요','추카해요',['축아해요','추가해요'],'congratulations'],['입학','이팍',['이박','입악'],'school entrance'],
      ['못해요','모태요',['모새요','못애요'],'I can’t'],['같이','가치',['가티','가시'],'together'],['해돋이','해도지',['해도디','해도치'],'sunrise'],
      ['학교','학꾜',['하교','학코'],'school'],['식당','식땅',['시당','식탕'],'restaurant'],['학생','학쌩',['하생','학생'],'student'],
    ].map(([ko, pron, wrong, en]) => ({ id: 'p-' + ko, kind: 'sound', ko, pron, wrong, en })),
  ],
  quizzes: [
    { id: 'q4-1', q: 'Why is 감사합니다 pronounced [감사함니다]?', options: ['ㅂ before ㄴ becomes ㅁ (nasalization)', 'ㅂ is silent', 'It’s a spelling mistake'], answer: 0, explain: 'Nasalization: [ㅂ] + ㄴ → [ㅁ].' },
    { id: 'q4-2', q: 'Why is 좋아요 pronounced [조아요]?', options: ['Final ㅎ drops before a vowel', 'ㅎ links to the next syllable', 'ㅎ becomes ㄷ'], answer: 0, explain: 'ㅎ is not pronounced before a vowel.' },
    { id: 'q4-3', q: '설날 (Lunar New Year) is romanized…', options: ['seollal', 'seolnal', 'seonnal'], answer: 0, explain: 'ㄹ + ㄴ → [ㄹㄹ], written ll.' },
    { id: 'q4-4', q: 'Which change is NOT shown in romanization?', options: ['Tensing (학교 → [학꾜])', 'Nasalization (합니다 → [함니다])', 'Linking (음악 → [으막])'], answer: 0, explain: 'Romanization follows the sound but ignores tensing: hakgyo.' },
    { id: 'q4-5', q: 'Which final NEVER links into the next syllable?', options: ['ㅇ', 'ㅅ', 'ㄹ'], answer: 0, explain: 'ㅇ stays put: 고양이 = go-yang-i.' },
  ],
},
// =============================================================================
{
  id: 'c5', n: 5, title: 'First phrases', ko: '첫 표현',
  blurb: 'Greetings, introductions and café survival — learned as set phrases.',
  lessons: [
    { id: 'c5l1', title: 'Hello, thank you, sorry', ko: '인사', pages: [
      { title: 'Polite but friendly', blocks: [
        { t: 'p', html: 'Korean has different levels of politeness. With strangers, staff and people you’ve just met, use the polite <b>-요 (yo)</b> style or the more formal <b>-ㅂ니다 (-mnida)</b> style. Everything in this chapter is safe to use with anyone.' },
        { t: 'phrases', items: [
          { ko: '안녕하세요', en: 'Hello (lit. “Are you at peace?”) — any time of day' },
          { ko: '감사합니다', en: 'Thank you (formal)' },
          { ko: '고맙습니다', en: 'Thank you (formal, a bit warmer)' },
          { ko: '죄송합니다', en: 'I’m sorry (formal apology)' },
          { ko: '미안해요', en: 'Sorry (polite, less formal)' },
          { ko: '괜찮아요', en: 'It’s okay / No thanks / Are you okay?' },
          { ko: '네', en: 'Yes' }, { ko: '아니요', en: 'No' },
        ] },
        { t: 'tip', html: '[[괜찮아요]] is super useful: “it’s fine”, “no thank you” (declining something), or as a question “are you okay?”.' },
      ] },
      { title: 'Two goodbyes', blocks: [
        { t: 'p', html: 'Korean has two ways to say goodbye, depending on <b>who is leaving</b>:' },
        { t: 'phrases', items: [
          { ko: '안녕히 가세요', en: '“Go in peace” — say it to someone who is LEAVING' },
          { ko: '안녕히 계세요', en: '“Stay in peace” — say it when YOU leave and they stay' },
          { ko: '또 만나요', en: 'See you again' },
        ] },
        { t: 'p', html: 'Leaving a shop? The staff stay, so you say [[안녕히 계세요]]. The staff say [[안녕히 가세요]] to you. If you both walk away, you both say [[안녕히 가세요]].' },
        { t: 'check', q: 'You’re leaving a café. You say to the staff:', options: ['안녕히 계세요', '안녕히 가세요', '안녕하세요'], answer: 0, explain: 'They stay, you go: 안녕히 계세요 (“stay in peace”).' },
      ] },
      { title: 'Meeting someone', blocks: [
        { t: 'phrases', items: [
          { ko: '처음 뵙겠습니다', en: 'How do you do? (lit. “I’m seeing you for the first time”) — formal' },
          { ko: '반갑습니다', en: 'Nice to meet you (formal)' },
          { ko: '만나서 반가워요', en: 'Nice to meet you (polite)' },
          { ko: '저도', en: 'Me too / I also' },
          { ko: '저도 반가워요', en: 'Nice to meet you too' },
        ] },
      ] },
    ] },
    { id: 'c5l2', title: 'Introducing yourself', ko: '자기소개', pages: [
      { title: 'I am …', blocks: [
        { t: 'p', html: '[[저는]] means “I” (as the topic: “as for me”). To say “I am X”, add <b>이에요</b> or <b>예요</b> after X:' },
        { t: 'table', head: ['X ends in…', 'add', 'example'], rows: [
          ['a consonant (has 받침)', '이에요', '[[학생이에요]] I’m a student'],
          ['a vowel (no 받침)', '예요', '[[마리아예요]] I’m Maria'],
        ] },
        { t: 'phrases', items: [
          { ko: '저는 민준이에요', en: 'I’m Minjun (준 ends in ㄴ → 이에요)' },
          { ko: '저는 마리아예요', en: 'I’m Maria (아 ends in a vowel → 예요)' },
          { ko: '이름이 뭐예요?', en: 'What’s your name?' },
          { ko: '제 이름은 마리아예요', en: 'My name is Maria' },
        ] },
        { t: 'tip', html: 'When writing foreign names in Hangul, Koreans follow the sound: Pamela → [[파멜라]], Maria → [[마리아]], John → [[존]]. Set your own name in Settings and the role-plays will use it.' },
        { t: 'check', q: '“I’m Minjun” is…', options: ['저는 민준이에요', '저는 민준예요', '저는 민준이요'], answer: 0, explain: '민준 ends in a consonant (ㄴ), so add 이에요.' },
      ] },
      { title: 'Where are you from?', blocks: [
        { t: 'p', html: '[[사람]] means “person”. Country + 사람 = a person from that country.' },
        { t: 'phrases', items: [
          { ko: '어느 나라 사람이에요?', en: 'Which country are you from? (lit. “which country person are you?”)' },
          { ko: '저는 브라질 사람이에요', en: 'I’m Brazilian' },
          { ko: '저는 한국 사람이에요', en: 'I’m Korean' },
        ] },
        { t: 'words', items: [
          { ko: '한국', en: 'Korea' }, { ko: '브라질', en: 'Brazil' }, { ko: '포르투갈', en: 'Portugal' }, { ko: '미국', en: 'USA' },
          { ko: '영국', en: 'UK' }, { ko: '캐나다', en: 'Canada' }, { ko: '이탈리아', en: 'Italy' }, { ko: '스페인', en: 'Spain' },
          { ko: '프랑스', en: 'France' }, { ko: '독일', en: 'Germany' }, { ko: '일본', en: 'Japan' }, { ko: '중국', en: 'China' },
        ] },
      ] },
    ] },
    { id: 'c5l3', title: 'At the café', ko: '카페에서', pages: [
      { title: '… please', blocks: [
        { t: 'p', html: '[[주세요]] means “please give me”. Put what you want in front of it:' },
        { t: 'phrases', items: [
          { ko: '물 주세요', en: 'Water, please' },
          { ko: '이거 주세요', en: 'This one, please' },
          { ko: '아메리카노 한 잔 주세요', en: 'One Americano, please' },
          { ko: '아이스로 주세요', en: 'Iced, please' },
          { ko: '포장해 주세요', en: 'To go, please (lit. “please wrap it”)' },
        ] },
        { t: 'tip', html: 'Counting cups uses [[잔]]: [[한 잔]] one cup, [[두 잔]] two cups. (하나 → 한 and 둘 → 두 before a counter.)' },
      ] },
      { title: 'What staff will say', blocks: [
        { t: 'phrases', items: [
          { ko: '어서 오세요', en: 'Welcome! (when you walk in)' },
          { ko: '주문하시겠어요?', en: 'Would you like to order?' },
          { ko: '따뜻한 걸로 드릴까요, 아이스로 드릴까요?', en: 'Hot or iced?' },
          { ko: '드시고 가세요?', en: 'For here? (lit. “will you eat/drink and go?”)' },
          { ko: '영수증 드릴까요?', en: 'Would you like the receipt?' },
          { ko: '맛있게 드세요', en: 'Enjoy (your food/drink)!' },
        ] },
        { t: 'p', html: 'Answer simply: [[네]], [[아니요, 괜찮아요]] (no, thank you), [[포장해 주세요]].' },
      ] },
      { title: 'Prices', blocks: [
        { t: 'p', html: 'Prices use Sino-Korean numbers: [[일]] 1, [[이]] 2, [[삼]] 3, [[사]] 4, [[오]] 5, [[육]] 6, [[칠]] 7, [[팔]] 8, [[구]] 9 — plus [[백]] 100, [[천]] 1,000, [[만]] 10,000. [[원]] is the currency, won.' },
        { t: 'phrases', items: [
          { ko: '얼마예요?', en: 'How much is it?' },
          { ko: '천 원이에요', en: 'It’s 1,000 won' },
          { ko: '사천오백 원입니다', en: 'It’s 4,500 won (4 × 1,000 + 5 × 100)' },
          { ko: '여기요', en: 'Here you are / Excuse me! (to call staff)' },
          { ko: '카드로 할게요', en: 'I’ll pay by card' },
        ] },
        { t: 'tip', html: 'We say [[천]], not 일천, for 1,000 — and [[만]], not 일만, for 10,000.' },
      ] },
    ] },
    { id: 'c5l4', title: 'Survival phrases', ko: '꼭 필요한 말', pages: [
      { title: 'When you’re stuck', blocks: [
        { t: 'phrases', items: [
          { ko: '다시 한 번 말해 주세요', en: 'Please say that again' },
          { ko: '천천히 말해 주세요', en: 'Please speak slowly' },
          { ko: '잠깐만요', en: 'Just a moment / Excuse me (to get past)' },
          { ko: '저기요', en: 'Excuse me (to get attention)' },
          { ko: '몰라요', en: 'I don’t know' },
          { ko: '알겠습니다', en: 'Understood / Got it' },
        ] },
      ] },
      { title: 'Do you have …? Where is …?', blocks: [
        { t: 'phrases', items: [
          { ko: '물 있어요?', en: 'Do you have water? (있어요 = there is / to have)' },
          { ko: '네, 저기 있어요', en: 'Yes, it’s over there' },
          { ko: '화장실 어디예요?', en: 'Where is the toilet?' },
          { ko: '봉투 필요하세요?', en: 'Do you need a bag?' },
        ] },
        { t: 'tip', html: 'A question in the polite style often looks exactly like the statement — only your rising intonation changes it: [[있어요]]. (there is) / [[있어요?]] (is there?).' },
        { t: 'check', q: 'You didn’t understand. You say:', options: ['다시 한 번 말해 주세요', '맛있게 드세요', '어서 오세요'], answer: 0, explain: '다시 = again, 한 번 = one time, 말해 주세요 = please say.' },
      ] },
    ] },
  ],
  items: [
    ...[['안녕하세요','Hello'],['감사합니다','Thank you (formal)'],['고맙습니다','Thank you (warm formal)'],['죄송합니다','I’m sorry (formal)'],['미안해요','Sorry (polite)'],
        ['괜찮아요','It’s okay / No thanks'],['네','Yes'],['아니요','No'],['안녕히 가세요','Goodbye (to someone leaving)'],['안녕히 계세요','Goodbye (when you leave)'],
        ['또 만나요','See you again'],['처음 뵙겠습니다','How do you do?'],['반갑습니다','Nice to meet you (formal)'],['만나서 반가워요','Nice to meet you'],['저도 반가워요','Nice to meet you too'],
        ['이름이 뭐예요?','What’s your name?'],['저는 학생이에요','I’m a student'],['어느 나라 사람이에요?','Which country are you from?'],['저는 한국 사람이에요','I’m Korean'],
        ['물 주세요','Water, please'],['이거 주세요','This one, please'],['아메리카노 한 잔 주세요','One Americano, please'],['포장해 주세요','To go, please'],
        ['얼마예요?','How much is it?'],['여기요','Here you are / Excuse me!'],['어서 오세요','Welcome!'],['맛있게 드세요','Enjoy your meal/drink!'],
        ['다시 한 번 말해 주세요','Please say that again'],['천천히 말해 주세요','Please speak slowly'],['잠깐만요','Just a moment'],['몰라요','I don’t know'],
        ['물 있어요?','Do you have water?'],['화장실 어디예요?','Where is the toilet?']]
      .map(([ko, en]) => ({ id: 'ph-' + ko, kind: 'phrase', ko, en })),
    ...[['일','1'],['이','2'],['삼','3'],['사','4'],['오','5'],['육','6'],['칠','7'],['팔','8'],['구','9'],['백','100'],['천','1,000'],['만','10,000']]
      .map(([ko, en]) => ({ id: 'n-' + ko, kind: 'word', ko, en })),
  ],
  quizzes: [
    { id: 'q5-1', q: 'A friend is leaving your house. You say:', options: ['안녕히 가세요', '안녕히 계세요', '어서 오세요'], answer: 0, explain: 'They leave → 안녕히 가세요 (“go in peace”).' },
    { id: 'q5-2', q: '“I’m Sofia” (소피아) is…', options: ['저는 소피아예요', '저는 소피아이에요', '저는 소피아요'], answer: 0, explain: '소피아 ends in a vowel → 예요.' },
    { id: 'q5-3', q: '“I’m a student” (학생) is…', options: ['저는 학생이에요', '저는 학생예요', '저는 학생이요'], answer: 0, explain: '생 ends in ㅇ (a consonant) → 이에요.' },
    { id: 'q5-4', q: 'The staff offer you a receipt and you don’t want it. You say:', options: ['아니요, 괜찮아요', '네, 주세요', '죄송합니다'], answer: 0, explain: '괜찮아요 politely declines: “No, it’s okay.”' },
    { id: 'q5-5', q: '사천오백 원 is…', options: ['₩4,500', '₩5,400', '₩450'], answer: 0, explain: '사천 = 4,000, 오백 = 500.' },
    { id: 'q5-6', q: 'How do you say “two cups”?', options: ['두 잔', '둘 잔', '이 잔'], answer: 0, explain: 'Native numbers are used with counters, and 둘 becomes 두.' },
    { id: 'q5-7', q: 'In a café, “to go, please” is…', options: ['포장해 주세요', '드시고 가세요', '맛있게 드세요'], answer: 0, explain: '포장 = wrapping/packaging → take-away.' },
  ],
},
];
