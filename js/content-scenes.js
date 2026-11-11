/* Live It: scripted, branching role-play scenes.
 * Placeholders: {name} = learner's Korean name, {이에요} = 이에요/예요 matching {name}, {country}.
 * Step kinds:
 *   say    – learner types / taps / speaks. responses: [{say:[...], next, react?}], wrong: [{say:[...], tip}]
 *   listen – comprehension multiple choice about the NPC line
 *   end    – scene complete
 */
window.COUNTRIES = [
  ['브라질', 'Brazil'], ['포르투갈', 'Portugal'], ['미국', 'USA'], ['영국', 'UK'], ['캐나다', 'Canada'], ['호주', 'Australia'],
  ['이탈리아', 'Italy'], ['스페인', 'Spain'], ['프랑스', 'France'], ['독일', 'Germany'], ['일본', 'Japan'], ['중국', 'China'],
  ['멕시코', 'Mexico'], ['인도', 'India'], ['한국', 'Korea'],
];

const GOODBYE_OK = ['아니요 괜찮아요', '괜찮아요', '아니요', '아니요 괜찮습니다', '괜찮습니다'];

window.SCENES = [
// -----------------------------------------------------------------------------
{
  id: 's1', title: 'First meeting', ko: '처음 만났어요', emoji: '🤝', requires: ['c5'], level: 1,
  setting: 'A language-exchange meetup in Seoul. Minjun walks over to your table.',
  mission: ['Greet Minjun', 'Tell him your name', 'Say where you’re from', 'Say goodbye properly'],
  npc: { name: '민준', en: 'Minjun', emoji: '🧑🏻' },
  needsName: true,
  start: 'hello',
  steps: {
    hello: {
      kind: 'say', npc: { ko: '안녕하세요! 처음 뵙겠습니다.', en: 'Hello! How do you do? (lit. “I’m seeing you for the first time.”)' },
      goal: 'Greet him back.',
      chips: ['안녕하세요!', '안녕히 가세요!', '감사합니다!'],
      responses: [{ say: ['안녕하세요', '안녕하세요 처음 뵙겠습니다', '처음 뵙겠습니다', '반갑습니다', '안녕하세요 반갑습니다', '반가워요', '안녕하세요 반가워요', '만나서 반가워요'], next: 'name' }],
      wrong: [
        { say: ['안녕히 가세요', '안녕히 계세요'], tip: 'That’s “goodbye” — you’ve only just met! Use 안녕하세요 (hello).' },
        { say: ['감사합니다', '고맙습니다'], tip: '“Thank you” is polite, but he greeted you. Greet back with 안녕하세요.' },
      ],
      hint: { words: [['안녕하세요', 'hello'], ['반갑습니다', 'nice to meet you']], partial: '안녕…', answer: '안녕하세요.', why: '안녕하세요 is the all-purpose polite “hello”. You could also say 반갑습니다 (nice to meet you).' },
    },
    name: {
      kind: 'say', npc: { ko: '저는 민준이에요. 이름이 뭐예요?', en: 'I’m Minjun. What’s your name?' },
      goal: 'Tell him your name.',
      chips: ['저는 {name}{이에요}.', '이름이 뭐예요?', '네, 감사합니다.'],
      responses: [{
        say: ['저는 {name}{이에요}', '제 이름은 {name}{이에요}', '{name}{이에요}', '저는 {name}입니다', '제 이름은 {name}입니다', '{name}입니다'],
        pattern: { ko: /^(저는|제이름은)?.+(이에요|예요|입니다)$/, rom: /^(jeoneun|jeireumeun)?[a-z]+(ieyo|yeyo|imnida)$/ },
        next: 'country', react: { ko: '{name} 씨, 반가워요!', en: 'Nice to meet you, {name}!' },
      }],
      wrong: [{ say: ['이름이 뭐예요'], tip: 'That’s asking HIS name — he just told you: 민준. Now tell him yours: 저는 … 이에요/예요.' }],
      hint: { words: [['저는', 'I (as for me)'], ['{name}', 'your name'], ['{이에요}', 'am']], partial: '저는 {name}…', answer: '저는 {name}{이에요}.', why: 'Use 이에요 after a name ending in a consonant (민준이에요) and 예요 after a vowel (마리아예요). Your name {name} takes {이에요}.' },
    },
    country: {
      kind: 'say', npc: { ko: '{name} 씨는 어느 나라 사람이에요?', en: '{name}, which country are you from?' },
      goal: 'Say where you’re from.',
      chips: ['저는 {country} 사람이에요.', '저는 {name}{이에요}.', '어느 나라 사람이에요?'],
      responses: [{
        say: '@countries', // expanded at runtime
        pattern: { ko: /^(저는)?.+사람이에요$/, rom: /^(jeoneun)?[a-z]+saramieyo$/ },
        next: 'nice', react: { ko: '아, 그래요? 저는 한국 사람이에요.', en: 'Oh, really? I’m Korean.' },
      }],
      wrong: [{ say: ['저는 {name}{이에요}'], tip: 'You already told him your name. Now say your country + 사람이에요.' }],
      hint: { words: [['{country}', 'your country'], ['사람', 'person'], ['이에요', 'am']], partial: '저는 {country}…', answer: '저는 {country} 사람이에요.', why: 'Country + 사람 = “a person from that country”. 사람 ends in ㅁ, so it takes 이에요.' },
    },
    nice: {
      kind: 'say', npc: { ko: '만나서 반가워요!', en: 'Nice to meet you!' },
      goal: 'Say “Nice to meet you too.”',
      chips: ['저도 반가워요!', '죄송합니다.', '안녕히 계세요.'],
      responses: [{ say: ['저도 반가워요', '저도 만나서 반가워요', '네 저도 반가워요', '반가워요', '저도요', '반갑습니다', '저도 반갑습니다', '만나서 반가워요', '네 반가워요'], next: 'bye' }],
      wrong: [{ say: ['죄송합니다', '미안해요'], tip: 'That’s “I’m sorry”. Try 저도 반가워요 — “me too, nice to meet you”.' }],
      hint: { words: [['저도', 'me too / I also'], ['반가워요', '(I’m) glad to meet you']], partial: '저도 …', answer: '저도 반가워요.', why: '저도 = “me too”. 저도 반가워요 = “I’m glad to meet you too.”' },
    },
    bye: {
      kind: 'say', npc: { ko: '아, 저 이제 가 봐야 돼요. 안녕히 계세요!', en: 'Oh, I have to go now. Goodbye! (he’s leaving, you’re staying)' },
      goal: 'He’s leaving and you’re staying. Say goodbye.',
      chips: ['안녕히 가세요!', '안녕히 계세요!', '안녕하세요!'],
      responses: [{ say: ['안녕히 가세요', '네 안녕히 가세요', '안녕히 가세요 또 만나요', '네 또 만나요', '또 만나요', '네 안녕히 가세요 또 만나요'], next: 'end' }],
      wrong: [
        { say: ['안녕히 계세요', '네 안녕히 계세요'], tip: 'Close! 안녕히 계세요 is what the person LEAVING says. He’s leaving, so you say 안녕히 가세요 (“go in peace”).' },
        { say: ['안녕하세요'], tip: 'That’s hello. For goodbye to someone leaving: 안녕히 가세요.' },
      ],
      hint: { words: [['안녕히', 'in peace'], ['가세요', 'go (polite)'], ['계세요', 'stay (polite)']], partial: '안녕히 …', answer: '안녕히 가세요.', why: 'He goes, you stay → you wish him 안녕히 가세요 (“go in peace”).' },
    },
    end: { kind: 'end', npc: { ko: '네, 또 만나요!', en: 'Yes, see you again!' } },
  },
},
// -----------------------------------------------------------------------------
{
  id: 's2', title: 'At the café', ko: '카페에서', emoji: '☕', requires: ['c5'], level: 1,
  setting: 'A busy café near the station. You walk up to the counter.',
  mission: ['Order ONE ICED Americano', 'Take it to go', 'Pay by card', 'No receipt, thanks'],
  npc: { name: '직원', en: 'Barista', emoji: '🧑🏻‍🍳' },
  start: 'order',
  steps: {
    order: {
      kind: 'say', npc: { ko: '어서 오세요! 주문하시겠어요?', en: 'Welcome! Would you like to order?' },
      goal: 'Order one Americano.',
      chips: ['아메리카노 한 잔 주세요.', '아메리카노 한 잔 있어요.', '안녕히 계세요.'],
      responses: [
        { say: ['아이스 아메리카노 한 잔 주세요', '아이스 아메리카노 주세요', '아이스 아메리카노 하나 주세요', '아이스 아메리카노 한 잔이요', '아이스 아메리카노 하나요', '아이스 아메리카노 한 잔 주세요'], next: 'here', react: { ko: '네, 아이스 아메리카노 한 잔이요.', en: 'Sure, one iced Americano.' } },
        { say: ['아메리카노 한 잔 주세요', '아메리카노 주세요', '아메리카노 하나 주세요', '아메리카노 한 잔이요', '아메리카노 하나요', '안녕하세요 아메리카노 한 잔 주세요'], next: 'temp' },
      ],
      wrong: [
        { say: ['카페라테 한 잔 주세요', '카페라떼 한 잔 주세요', '녹차 한 잔 주세요', '아메리카노 두 잔 주세요'], tip: 'That’s good Korean — but check your mission card: ONE Americano (한 잔).' },
        { say: ['아메리카노 한 잔 있어요'], tip: '있어요 means “there is / I have”. To ask for something, use 주세요 (please give me).' },
      ],
      hint: { words: [['아메리카노', 'Americano'], ['한 잔', 'one cup'], ['주세요', 'please give me']], partial: '아메리카노 한 잔 …', answer: '아메리카노 한 잔 주세요.', why: 'Thing + number + counter + 주세요. 잔 is the counter for cups.' },
    },
    temp: {
      kind: 'say', npc: { ko: '따뜻한 걸로 드릴까요, 아이스로 드릴까요?', en: 'Would you like it hot or iced?' },
      goal: 'Ask for it iced.',
      chips: ['아이스로 주세요.', '따뜻한 걸로 주세요.', '여기요.'],
      responses: [{ say: ['아이스로 주세요', '아이스요', '아이스로요', '아이스', '아이스 주세요', '아이스로 할게요'], next: 'here' }],
      wrong: [{ say: ['따뜻한 걸로 주세요', '따뜻한 거요', '따뜻한 걸로요'], tip: '따뜻한 = warm/hot. Your mission says ICED: 아이스로 주세요.' }],
      hint: { words: [['아이스', 'iced'], ['따뜻한 거', 'a hot one'], ['-로 주세요', '(make it) … please']], partial: '아이스로 …', answer: '아이스로 주세요.', why: '-로 here means “as / in the form of”: 아이스로 주세요 = “(make it) iced, please”.' },
    },
    here: {
      kind: 'say', npc: { ko: '드시고 가세요?', en: 'Is it for here? (lit. “will you drink it and go?”)' },
      goal: 'Say no — you want it to go.',
      chips: ['아니요, 포장해 주세요.', '네, 여기서 마실게요.', '감사합니다.'],
      responses: [{ say: ['아니요 포장해 주세요', '포장해 주세요', '아니요 포장이요', '포장이요', '포장', '아니요 가져갈게요', '가져갈게요', '테이크아웃이요', '아니요 테이크아웃이요', '아니요 포장해 주세요'], next: 'price' }],
      wrong: [{ say: ['네', '네 여기서 마실게요', '여기서 마실게요'], tip: '네 means yes — that would be for here. Your mission says to go: 아니요, 포장해 주세요.' }],
      hint: { words: [['아니요', 'no'], ['포장', 'wrapping → take-away'], ['해 주세요', 'please do']], partial: '아니요, 포장…', answer: '아니요, 포장해 주세요.', why: '포장해 주세요 literally means “please wrap it”, which is how you ask for take-away.' },
    },
    price: {
      kind: 'listen', npc: { ko: '사천오백 원입니다.', en: 'That’s 4,500 won.' },
      question: 'How much does the barista say?',
      options: ['₩4,500', '₩5,400', '₩4,000', '₩500'], answer: 0,
      explain: '사천 = 4 × 1,000, 오백 = 5 × 100 → ₩4,500.',
      next: 'pay',
    },
    pay: {
      kind: 'say', npc: null,
      goal: 'Hand over your card and say “here you are” (or “I’ll pay by card”).',
      chips: ['여기요.', '얼마예요?', '몰라요.'],
      responses: [{ say: ['여기요', '여기 있어요', '카드로 할게요', '카드요', '여기 있습니다', '네 여기요', '카드로 할게요 여기요', '네 카드로 할게요'], next: 'receipt' }],
      wrong: [{ say: ['얼마예요'], tip: 'She already told you: 사천오백 원 (₩4,500). Just hand over your card: 여기요.' }],
      hint: { words: [['여기요', 'here you are'], ['카드로 할게요', 'I’ll pay by card']], partial: '여기…', answer: '여기요.', why: '여기요 (“here”) is what you say when handing something over.' },
    },
    receipt: {
      kind: 'say', npc: { ko: '영수증 드릴까요?', en: 'Would you like the receipt?' },
      goal: 'Politely decline.',
      chips: ['아니요, 괜찮아요.', '네, 주세요.', '안녕하세요.'],
      responses: [{ say: GOODBYE_OK, next: 'ready' }],
      wrong: [{ say: ['네 주세요', '네', '주세요'], tip: 'Perfect Korean — but your mission says no receipt. Try 아니요, 괜찮아요.' }],
      hint: { words: [['아니요', 'no'], ['괜찮아요', 'it’s okay → no thanks']], partial: '아니요, …', answer: '아니요, 괜찮아요.', why: '괜찮아요 (“it’s fine”) is the polite way to say “no thanks”.' },
    },
    ready: {
      kind: 'say', npc: { ko: '아이스 아메리카노 나왔습니다. 맛있게 드세요!', en: 'Your iced Americano is ready. Enjoy!' },
      goal: 'Thank the barista.',
      chips: ['감사합니다!', '맛있게 드세요!', '죄송합니다.'],
      responses: [{ say: ['감사합니다', '고맙습니다', '감사해요', '고마워요', '네 감사합니다'], next: 'end' }],
      wrong: [{ say: ['맛있게 드세요'], tip: 'Ha — that’s what SHE says to YOU (“enjoy!”). Just say thank you: 감사합니다.' }],
      hint: { words: [['감사합니다', 'thank you']], partial: '감사…', answer: '감사합니다.', why: '감사합니다 = thank you (formal).' },
    },
    end: { kind: 'end', npc: { ko: '감사합니다. 안녕히 가세요!', en: 'Thank you. Goodbye!' } },
  },
},
// -----------------------------------------------------------------------------
{
  id: 's3', title: 'At the convenience store', ko: '편의점에서', emoji: '🏪', requires: ['c5'], level: 2,
  setting: 'A 24-hour convenience store. You’re thirsty.',
  mission: ['Ask if they have water', 'Ask the price', 'No bag', 'Ask them to repeat when you don’t understand', 'Say goodbye as you leave'],
  npc: { name: '점원', en: 'Clerk', emoji: '👩🏻' },
  start: 'enter',
  steps: {
    enter: {
      kind: 'say', npc: { ko: '어서 오세요!', en: 'Welcome!' },
      goal: 'Say hello and ask if they have water.',
      chips: ['안녕하세요. 물 있어요?', '물 주세요.', '안녕히 계세요.'],
      responses: [
        { say: ['안녕하세요 물 있어요', '물 있어요', '저기요 물 있어요', '안녕하세요 저기요 물 있어요'], next: 'where' },
        { say: ['안녕하세요'], next: 'what' },
        { say: ['물 주세요', '안녕하세요 물 주세요'], next: 'where', react: { ko: '물이요? 네, 저기 있어요.', en: 'Water? Yes, it’s over there.' }, note: 'Understood! In a shop it’s more natural to ask 물 있어요? (do you have water?).' },
      ],
      wrong: [{ say: ['안녕히 계세요', '안녕히 가세요'], tip: 'You just walked in — that’s goodbye! Start with 안녕하세요.' }],
      hint: { words: [['물', 'water'], ['있어요?', 'is there? / do you have?']], partial: '물 …?', answer: '안녕하세요. 물 있어요?', why: '있어요 with a rising tone = “is there…? / do you have…?”' },
    },
    what: {
      kind: 'say', npc: { ko: '네, 안녕하세요. 뭐 찾으세요?', en: 'Hello. What are you looking for?' },
      goal: 'Ask if they have water.',
      chips: ['물 있어요?', '몰라요.', '네, 감사합니다.'],
      responses: [{ say: ['물 있어요', '물이요', '물 주세요', '저기요 물 있어요'], next: 'where' }],
      hint: { words: [['물', 'water'], ['있어요?', 'do you have?']], partial: '물 …', answer: '물 있어요?', why: 'Thing + 있어요? = “Do you have …?”' },
    },
    where: {
      kind: 'say', npc: { ko: '네, 저기 있어요.', en: 'Yes, it’s over there.' },
      goal: 'Thank her.',
      chips: ['감사합니다!', '죄송합니다.', '여기요.'],
      responses: [{ say: ['감사합니다', '고맙습니다', '네 감사합니다', '감사해요', '고마워요'], next: 'counter' }],
      hint: { words: [['감사합니다', 'thank you']], partial: '감사…', answer: '감사합니다.', why: 'Simple and polite.' },
    },
    counter: {
      kind: 'say', npc: null,
      goal: 'You bring the water to the counter. Ask how much it is.',
      chips: ['이거 얼마예요?', '이거 주세요.', '화장실 어디예요?'],
      responses: [{ say: ['이거 얼마예요', '얼마예요', '저기요 이거 얼마예요', '물 얼마예요'], next: 'price' }],
      wrong: [{ say: ['화장실 어디예요'], tip: 'That asks where the toilet is! Ask the price: 얼마예요?' }],
      hint: { words: [['이거', 'this'], ['얼마예요?', 'how much is it?']], partial: '이거 …?', answer: '이거 얼마예요?', why: '얼마 = how much, 예요 = is.' },
    },
    price: {
      kind: 'listen', npc: { ko: '천 원이에요.', en: 'It’s 1,000 won.' },
      question: 'How much is the water?', options: ['₩1,000', '₩10,000', '₩100', '₩1,500'], answer: 0,
      explain: '천 = 1,000 (만 = 10,000, 백 = 100).', next: 'bag',
    },
    bag: {
      kind: 'say', npc: { ko: '봉투 필요하세요?', en: 'Do you need a bag?' },
      goal: 'You don’t need one. Decline politely.',
      chips: ['아니요, 괜찮아요.', '네, 주세요.', '얼마예요?'],
      responses: [{ say: GOODBYE_OK, next: 'points' }],
      wrong: [{ say: ['네 주세요', '네'], tip: 'It’s only a small bottle — your mission says no bag: 아니요, 괜찮아요.' }],
      hint: { words: [['아니요', 'no'], ['괜찮아요', 'no thanks']], partial: '아니요, …', answer: '아니요, 괜찮아요.', why: '괜찮아요 politely declines.' },
    },
    points: {
      kind: 'say', npc: { ko: '포인트 적립하시겠어요?', en: '(She says something very fast…)', fast: true, hideEn: true },
      goal: 'She spoke too fast. Ask her to say it again.',
      chips: ['다시 한 번 말해 주세요.', '네, 감사합니다.', '안녕히 계세요.'],
      responses: [{ say: ['다시 한 번 말해 주세요', '다시 말해 주세요', '네', '천천히 말해 주세요', '죄송합니다 다시 한 번 말해 주세요', '한 번 더 말해 주세요', '다시 한번 말해 주세요', '죄송합니다 천천히 말해 주세요'], next: 'points2' }],
      hint: { words: [['다시', 'again'], ['한 번', 'one time'], ['말해 주세요', 'please say']], partial: '다시 한 번 …', answer: '다시 한 번 말해 주세요.', why: 'A life-saver. 천천히 말해 주세요 (“please speak slowly”) also works.' },
    },
    points2: {
      kind: 'say', npc: { ko: '포인트… 적립… 하시겠어요?', en: 'Would you like to… collect… points? (store loyalty points)', slow: true },
      goal: 'You don’t have a points card. Say no thanks.',
      chips: ['아니요, 괜찮아요.', '네, 주세요.', '몰라요.'],
      responses: [{ say: GOODBYE_OK, next: 'bye' }],
      hint: { words: [['아니요, 괜찮아요', 'no thanks']], partial: '아니요, …', answer: '아니요, 괜찮아요.', why: 'Same polite “no thanks” as before.' },
    },
    bye: {
      kind: 'say', npc: { ko: '네, 감사합니다. 안녕히 가세요!', en: 'Okay, thank you. Goodbye!' },
      goal: 'You’re leaving and the clerk stays. Say goodbye.',
      chips: ['안녕히 계세요!', '안녕히 가세요!', '어서 오세요!'],
      responses: [{ say: ['안녕히 계세요', '감사합니다 안녕히 계세요', '네 안녕히 계세요', '고맙습니다 안녕히 계세요'], next: 'end' }],
      wrong: [{ say: ['안녕히 가세요', '네 안녕히 가세요'], tip: 'That’s what SHE says to you, because you’re leaving. You say 안녕히 계세요 (“stay in peace”).' }],
      hint: { words: [['안녕히', 'in peace'], ['계세요', 'stay (polite)']], partial: '안녕히 …', answer: '안녕히 계세요.', why: 'You go, she stays → 안녕히 계세요.' },
    },
    end: { kind: 'end', npc: null },
  },
},
];
