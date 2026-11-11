/* Diary helper: rule-based hints for common mistakes made by Italian speakers.
   It can't find every mistake — it's a friendly first check. */
window.Checker = (function () {
  const NUMW = "(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|many|several|a few)";
  const UNIT = "(?:years?|months?|weeks?|days?|hours?|minutes?)";
  const AUX_BEFORE = new Set(["did","does","do","didn't","doesn't","don't","can","could","will","would","should","must","might","may","to","let","help","make","not","can't","won't","shall","and","or"]);
  const DAYS = "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?";
  const MONTHS = "(?:january|february|march|april|may|june|july|august|september|october|november|december)";
  const PAST = "went|saw|bought|came|did|had|made|took|gave|got|said|ate|was|were|knew|told|felt|left|met|thought|wanted|liked|worked|played|lived|called|watched|cooked|visited|spoke|wrote|found|paid|sent|began|drank|drove|slept|forgot|lost|understood";

  function thirdS(v) {
    const m = { have: "has", do: "does", go: "goes", say: "says" };
    if (m[v]) return m[v];
    if (/(s|sh|ch|x|z|o)$/.test(v)) return v + "es";
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + "ies";
    return v + "s";
  }
  function comp(a) {
    const irr = { good: "better", bad: "worse", far: "further" };
    if (irr[a]) return irr[a];
    if (/e$/.test(a)) return a + "r";
    if (/[^aeiou]y$/.test(a)) return a.slice(0, -1) + "ier";
    if (/^(big|hot|fat|thin|sad|wet)$/.test(a)) return a + a.slice(-1) + "er";
    return a + "er";
  }
  function base(v) {
    const m = { went:"go", saw:"see", bought:"buy", came:"come", did:"do", had:"have", made:"make", took:"take", gave:"give", got:"get", said:"say", ate:"eat", was:"be", were:"be", knew:"know", told:"tell", felt:"feel", left:"leave", met:"meet", thought:"think", spoke:"speak", wrote:"write", found:"find", paid:"pay", sent:"send", began:"begin", drank:"drink", drove:"drive", slept:"sleep", forgot:"forget", lost:"lose", understood:"understand" };
    if (m[v]) return m[v];
    if (/ied$/.test(v)) return v.slice(0, -3) + "y";
    if (/(ked|ved|ted|zed|ced)$/.test(v) && !/(wanted|visited|started)$/.test(v)) return v.slice(0, -1);
    return v.replace(/ed$/, "");
  }
  function ing(v) {
    if (v === "be" || v === "see") return v + "ing";
    if (/ie$/.test(v)) return v.slice(0, -2) + "ying";
    if (/[^e]e$/.test(v)) return v.slice(0, -1) + "ing";
    if (/^(get|put|run|sit|stop|swim|shop|begin|forget)$/.test(v)) return v + v.slice(-1) + "ing";
    return v + "ing";
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // type: "err" (probably a mistake) or "tip" (check / advice)
  const R = [
    { re: /\b(I|you|he|she|we|they|my \w+) (have|has) (\d{1,3}|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\w-]* years( old)?\b/gi,
      fix: m => `${m[1]} ${/^(I)$/i.test(m[1]) ? "am" : /^(you|we|they)$/i.test(m[1]) ? "are" : "is"} ${m[3]}`,
      en: "For age, use “be”, not “have”.", it: "Per l'età si usa “be”: I'm 54." , g: "be-age"},
    { re: /\b(have|has) (hungry|thirsty|sleepy|right|reason|fear)\b/gi, fix: m => "be " + (m[2].toLowerCase() === "reason" ? "right" : m[2].toLowerCase() === "fear" ? "afraid" : m[2]),
      en: "Use “be”: I'm hungry, you're right, I'm afraid.", it: "Si usa “be”: I'm hungry, you're right.", g: "be-age" },
    { re: /\b(informations|advices|furnitures|luggages|homeworks|knowledges|equipments|accommodations|feedbacks|breads|hairs)\b/gi, fix: m => m[1].replace(/s$/i, ""),
      en: "This word is uncountable — no plural -s.", it: "Questa parola è non numerabile: niente -s.", g: "countable" },
    { re: /\b(an?) ((?:good |bad |useful |great )?(?:information|advice|furniture|luggage|homework|news|weather|traffic|accommodation))\b/gi, fix: m => "some " + m[2],
      en: "No “a/an” with uncountable nouns. Use “some” or “a piece of”.", it: "Niente a/an con i non numerabili: usa “some”.", g: "countable" },
    { re: /\bnews (are|were)\b/gi, fix: m => "news " + (m[1].toLowerCase() === "are" ? "is" : "was"),
      en: "“News” is singular.", it: "“News” è singolare.", g: "countable" },
    { re: /\bpeople (is|was|has)\b/gi, fix: m => "people " + ({ is: "are", was: "were", has: "have" })[m[1].toLowerCase()],
      en: "“People” is plural.", it: "“People” è plurale.", g: "countable" },
    { re: /\bhow much (people|friends|children|times|days|hours|books|cars|years|eggs|apples|things)\b/gi, fix: m => "how many " + m[1],
      en: "Countable nouns → how many.", it: "Con i numerabili → how many.", g: "countable" },
    { re: new RegExp(`\\b(since|from) (${NUMW}) (${UNIT})\\b`, "gi"), fix: m => `for ${m[2]} ${m[3]}`,
      en: "For a period of time use “for” (since = a starting point).", it: "Per un periodo si usa “for”; “since” solo con un momento preciso.", g: "for-since" },
    { re: new RegExp(`\\b(I|we|they|you) (live|work|am|are|know|study|wait|stay)\\b[^.!?]*?\\b(since \\w+|for ${NUMW} ${UNIT})`, "gi"),
      fix: m => `${m[1]} have ${({ live: "lived", work: "worked", am: "been", are: "been", know: "known", study: "studied", wait: "been waiting", stay: "stayed" })[m[2].toLowerCase()]}…`,
      en: "For how long up to now, use the present perfect: I've lived here for 10 years.", it: "Per “da quanto tempo” si usa il present perfect: I've lived here for 10 years.", g: "for-since" },
    { re: /\b(am|is|are|'m|'re) agree\b/gi, fix: () => "agree",
      en: "“Agree” is a verb: I agree (not I am agree).", it: "“Agree” è un verbo: I agree.", g: null },
    { re: /\b(make|makes|made|making) (a |the |some )?(photos?|pictures?|questions?|shower|bath|party|walk|holiday)\b/gi,
      fix: m => { const w = m[3].toLowerCase(); const v = /photo|picture/.test(w) ? "take" : /question/.test(w) ? "ask" : /walk/.test(w) ? "go for" : /holiday/.test(w) ? "go on" : "have"; return `${v} ${m[2] || ""}${m[3]}`; },
      en: "Italian “fare” isn't always “make”: take a photo, ask a question, have a shower, go for a walk.", it: "“Fare” non è sempre “make”: take a photo, ask a question, have a shower.", g: "make-do" },
    { re: /\b(do|does|did|doing|done) (a |the |many |some |lots of |a lot of )?(mistakes?|decisions?|noise|friends)\b/gi, fix: m => `make ${m[2] || ""}${m[3]}`,
      en: "We say “make” a mistake / a decision / friends.", it: "Si dice “make” a mistake / a decision.", g: "make-do" },
    { re: /\b(make|makes|made|making) (my |the |your |his |her |our |some )?(homework|shopping|housework|exercise|washing|washing-up)\b/gi, fix: m => `do ${m[2] || ""}${m[3]}`,
      en: "We say “do” the shopping / homework / exercise.", it: "Si dice “do” the shopping / homework.", g: "make-do" },
    { re: /\bexplain(s|ed|ing)? (me|him|her|us|them)\b/gi, fix: m => `explain${m[1] || ""} (it) to ${m[2]}`,
      en: "Explain something TO someone.", it: "Explain qualcosa TO qualcuno.", g: "verb-prep" },
    { re: /\b(say|says|said|saying) (me|him|her|us|them)\b/gi, fix: m => `${({ say: "tell", says: "tells", said: "told", saying: "telling" })[m[1].toLowerCase()]} ${m[2]}`,
      en: "Use “tell” + person: tell me, told her.", it: "Con la persona si usa “tell”: tell me.", g: "say-tell" },
    { re: /\bdepend(s|ed|ing)? (from|of)\b/gi, fix: m => `depend${m[1] || ""} on`, en: "depend ON.", it: "Dipende da = depend on.", g: "verb-prep" },
    { re: /\bdiscuss(ed|es|ing)? about\b/gi, fix: m => `discuss${m[1] || ""}`, en: "“Discuss” has no preposition.", it: "“Discuss” non vuole “about”.", g: "verb-prep" },
    { re: /\bmarried with\b/gi, fix: () => "married to", en: "married TO someone.", it: "Sposata con = married to.", g: "verb-prep" },
    { re: /\blisten(s|ed|ing)? (music|the radio|the news|songs?|podcasts?|me|him|her)\b/gi, fix: m => `listen${m[1] || ""} to ${m[2]}`, en: "listen TO something.", it: "Ascoltare = listen to.", g: "verb-prep" },
    { re: /\bwait(s|ed|ing)? (the|my|your|his|her|our) (bus|train|doctor|turn|husband|wife|friend|son|daughter|results?)\b/gi, fix: m => `wait${m[1] || ""} for ${m[2]} ${m[3]}`, en: "wait FOR something.", it: "Aspettare = wait for.", g: "verb-prep" },
    { re: /\b(go|goes|went|going|come|came|coming|get|got|arrive[sd]?|return(ed)?) to home\b/gi, fix: m => `${m[1]} home`, en: "No “to” before home: go home.", it: "Niente “to” prima di home: go home.", g: "prep-place" },
    { re: /\bin the (bus|train|plane|tube)\b/gi, fix: m => `on the ${m[1]}`, en: "Public transport: ON the bus/train.", it: "Mezzi pubblici: on the bus.", g: "prep-place" },
    { re: /\barrive(s|d)? to\b/gi, fix: m => `arrive${m[1] || ""} in / at`, en: "arrive IN a town, AT a building — never “to”.", it: "Arrive in (città) / at (edificio), mai “to”.", g: "prep-place" },
    { re: new RegExp(`\\b(in|at) (${DAYS})\\b`, "gi"), fix: m => `on ${cap(m[2])}`, en: "Days: ON Monday.", it: "Giorni: on Monday.", g: "prep-time" },
    { re: new RegExp(`\\b(on|at) (${MONTHS})\\b`, "gi"), fix: m => `in ${cap(m[2])}`, en: "Months: IN May.", it: "Mesi: in May.", g: "prep-time", skip: (m) => /^may$/i.test(m[2]) },
    { re: /\bat the (morning|afternoon|evening)\b/gi, fix: m => `in the ${m[1]}`, en: "IN the morning/afternoon/evening (but AT night).", it: "In the morning, ma at night.", g: "prep-time" },
    { re: /\b(on|in) the weekend\b/gi, fix: () => "at the weekend", en: "In British English: AT the weekend.", it: "In inglese britannico: at the weekend.", g: "prep-time", type: "tip" },
    { re: /\bin (next|last|this) (week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend)\b/gi, fix: m => `${m[1]} ${m[2]}`, en: "No preposition before next / last / this.", it: "Niente preposizione con next / last / this.", g: "prep-time" },
    { re: new RegExp(`\\b(have|has|'ve) (\\w+ed|been|gone|seen|done|had|made|bought|met|said|got|taken|eaten|written|spoken)\\b[^.!?]*?\\b(yesterday|last (?:week|month|year|night|summer|winter|weekend|${DAYS})|\\w+ ago|in (?:19|20)\\d\\d)\\b`, "gi"),
      fix: () => "past simple (e.g. I went, I saw)", en: "With a finished time (yesterday, last…, ago), use the past simple.", it: "Con un tempo finito (yesterday, last…, ago) si usa il past simple.", g: "past-simple",
      skip: (m) => /\bsince\b/i.test(m[0]) },
    { re: new RegExp(`\\b(yesterday|last (?:week|month|year|night|summer|winter|weekend|${DAYS})|(?:\\w+ )ago|in (?:19|20)\\d\\d)\\b[^.!?]*?\\b(have|has|'ve) (\\w+ed|been|gone|seen|done|had|made|bought|met|said|got|taken|eaten|written|spoken)\\b`, "gi"),
      fix: () => "past simple (e.g. I went, I saw)", en: "With a finished time (yesterday, last…, ago), use the past simple.", it: "Con un tempo finito (yesterday, last…, ago) si usa il past simple.", g: "past-simple" },
    { re: /\b(have|has|'ve|had|haven't|hasn't) (went|saw|did|came|ate|wrote|spoke|took|gave|drank|began|ran|forgot|knew|drove|broke|chose|stole|swam|sang|flew)\b/gi,
      fix: m => `${m[1]} ${({ went: "gone", saw: "seen", did: "done", came: "come", ate: "eaten", wrote: "written", spoke: "spoken", took: "taken", gave: "given", drank: "drunk", began: "begun", ran: "run", forgot: "forgotten", knew: "known", drove: "driven", broke: "broken", chose: "chosen", stole: "stolen", swam: "swum", sang: "sung", flew: "flown" })[m[2].toLowerCase()]}`,
      en: "After have/has, use the past participle (gone, seen, done…).", it: "Dopo have/has serve il participio (gone, seen, done…).", g: "pres-perfect" },
    { re: /\bmore (better|worse|bigger|smaller|cheaper|easier|older|younger|nicer|faster|happier|colder|hotter|longer|shorter)\b/gi, fix: m => m[1], en: "Don't use “more” with -er.", it: "Niente “more” con -er.", g: "comparatives" },
    { re: /\bmore (good|bad|big|small|cheap|easy|old|young|nice|fast|happy|hot|cold|long|short|tall|far|quick|slow|warm)\b/gi, fix: m => comp(m[1].toLowerCase()), en: "Short adjectives: -er (cheaper, bigger, better).", it: "Aggettivi corti: -er.", g: "comparatives" },
    { re: /\b(better|worse|bigger|smaller|cheaper|older|younger|taller|shorter|faster|slower|nicer|easier|harder|richer|happier|colder|hotter|warmer|longer) of\b/gi, fix: m => `${m[1]} than`, en: "Comparisons use “than”.", it: "Nel confronto “di” = than.", g: "comparatives" },
    { re: /\benough (big|small|good|tall|old|warm|hot|cold|cheap|fast|strong|long|easy|early)\b/gi, fix: m => `${m[1]} enough`, en: "“Enough” goes after the adjective.", it: "“Enough” va dopo l'aggettivo.", g: "too-enough" },
    { re: /\b(he|she|it) don't\b/gi, fix: m => `${m[1]} doesn't`, en: "He/she/it → doesn't.", it: "Con he/she/it → doesn't.", g: "pres-simple" },
    { re: /\b(he|she|it|my (?:husband|wife|son|daughter|mother|father|mum|dad|friend|sister|brother|boss|neighbour)) (like|want|go|live|work|have|do|need|eat|say|make|know|think|watch|play|drink|speak|come|get|take|feel|love|hate|cook|read|study|walk|drive|start|finish)\b/gi,
      fix: m => `${m[1]} ${thirdS(m[2].toLowerCase())}`, en: "He / she / it: add -s to the verb.", it: "Con he/she/it il verbo prende la -s.", g: "pres-simple",
      skip: (m, text) => { const before = text.slice(0, m.index).trim().split(/\s+/).pop() || ""; return AUX_BEFORE.has(before.toLowerCase().replace(/[^a-z']/g, "")); } },
    { re: new RegExp(`\\b(didn't|did not|doesn't|does not|don't|do not) (${PAST})\\b`, "gi"), fix: m => `${m[1]} ${base(m[2].toLowerCase())}`, en: "After did/didn't/don't, use the base verb.", it: "Dopo did/didn't il verbo torna alla forma base.", g: "past-simple" },
    { re: new RegExp(`\\b(did|does|do) (you|he|she|it|we|they|i) (${PAST})\\b`, "gi"), fix: m => `${m[1]} ${m[2]} ${base(m[3].toLowerCase())}`, en: "After “did”, use the base verb.", it: "Dopo “did” il verbo torna alla forma base.", g: "past-simple" },
    { re: /\b(can|could|must|should|will|would|might|may) to (\w+)/gi, fix: m => `${m[1]} ${m[2]}`, en: "No “to” after can / must / should / will.", it: "Niente “to” dopo can / must / should.", g: "modals" },
    { re: /\b(want|wants|wanted|need|needs|needed|decided?|hope|hoped|would like|'d like) (go|do|make|see|buy|learn|improve|have|get|come|eat|visit|speak|work|travel|try|say|know|find|start)\b/gi, fix: m => `${m[1]} to ${m[2]}`, en: "want / need / decide / would like + TO + verb.", it: "want / need / would like + to + verbo.", g: "gerund-inf" },
    { re: /\b(enjoy|enjoyed|enjoys|mind|finish|finished|avoid|suggest|suggested|keep) to (\w+)\b/gi, fix: m => `${m[1]} ${ing(m[2].toLowerCase())}`, en: "enjoy / mind / finish / avoid + -ing.", it: "enjoy / mind / finish + -ing.", g: "gerund-inf" },
    { re: /\b(before|after|without|for|about) to (\w+)\b/gi, fix: m => `${m[1]} ${ing(m[2].toLowerCase())}`, en: "After a preposition, use -ing: before leaving.", it: "Dopo una preposizione si usa -ing.", g: "gerund-inf" },
    { re: /\b(am|is|are|'m|'s|'re) used to (go|get|do|work|live|drive|eat|speak|wake|cook|take|be|have|wait)\b/gi, fix: m => `${m[1]} used to ${ing(m[2].toLowerCase())}`, en: "be used to + -ing (I'm used to getting up early).", it: "be used to + -ing.", g: "used-to" },
    { re: /\b(go|goes|went|going) to (shopping|swimming|walking|running|dancing|fishing)\b/gi, fix: m => `${m[1]} ${m[2]}`, en: "No “to”: go shopping, go swimming.", it: "Niente “to”: go shopping.", g: null },
    { re: /\b(would like|want|wanted|'d like) that (you|he|she|they|we|him|her|them)\b/gi, fix: m => `${m[1]} ${({ he: "him", she: "her", they: "them", we: "us" })[m[2].toLowerCase()] || m[2]} to…`, en: "I'd like you to… (not “that you”).", it: "Vorrei che tu… = I'd like you to…", g: "gerund-inf" },
    { re: /\bthe (life|nature|love|money|happiness|society|music|coffee) (is|are|was|can)\b/gi, fix: m => `${cap(m[1])} ${m[2]}`, en: "Talking in general: no “the”.", it: "Parlando in generale: niente “the”.", g: "articles" },
    { re: /\bI am (nurse|teacher|cleaner|carer|cook|chef|doctor|waiter|waitress|receptionist|hairdresser|student|housewife|shop assistant)\b/gi, fix: m => `I am a ${m[1]}`, en: "Jobs need a/an: I'm a nurse.", it: "Con le professioni serve a/an.", g: "articles" },
    { re: /\b(a) ((?:a|e|i|o|u)\w*)\b/gi, fix: m => `an ${m[2]}`, en: "Use “an” before a vowel sound.", it: "Si usa “an” davanti a suono vocalico.", g: "articles",
      skip: m => /^(uni|use|usu|uk|eu|one|once|ur)/i.test(m[2]) },
    { re: /\b(a) (hour|honest|honour)\b/gi, fix: m => `an ${m[2]}`, en: "The h is silent here → an hour.", it: "La h è muta → an hour.", g: "articles" },
    { re: /\b(an) ([bcdfgjklmnpqrstvwxyz]\w*)\b/gi, fix: m => `a ${m[2]}`, en: "Use “a” before a consonant sound.", it: "Si usa “a” davanti a consonante.", g: "articles",
      skip: m => /^(hour|honest|hono)/i.test(m[2]) },
    { re: /\bwhat means\b/gi, fix: () => "what does … mean?", en: "Question: What does it mean?", it: "Cosa significa = What does it mean?", g: "questions" },
    { re: /\bhow (is|are) (it |this |that )?called\b/gi, fix: () => "what is it called?", en: "We say: What is it called?", it: "Come si chiama = What is it called?", g: "questions" },
    { re: /\bborrow (me|you|him|her|us|them)\b/gi, fix: m => `lend ${m[1]}`, en: "Give = lend. Take = borrow.", it: "Prestare = lend; farsi prestare = borrow.", g: null },
    { re: /\bremember (me|him|her|us|them) to\b/gi, fix: m => `remind ${m[1]} to`, en: "Help someone remember = remind.", it: "Ricordare a qualcuno = remind.", g: null },
    { re: /\bassist(ed|ing|s)? (at|to)\b/gi, fix: () => "attend / watch", en: "To be present at = attend (assist = help).", it: "Assistere a = attend / watch.", g: null },
    { re: /\blike(d)? very much (the|my|this|that|to|\w+ing)\b/gi, fix: m => `really like${m[1] || ""} ${m[2]}…`, en: "Put “very much” at the end: I like it very much — or say “I really like…”.", it: "“Very much” va alla fine, oppure “I really like…”.", g: null },
    { re: /(^|[.!?]\s+)(is|was) (raining|snowing|cold|hot|sunny|windy|important|possible|necessary|nice|difficult|easy|true|late|early|very|too|a|the|so)\b/gi,
      fix: m => `It ${m[2].toLowerCase()} ${m[3]}`, en: "English needs a subject: It is…", it: "In inglese serve il soggetto: It is…", g: "subject",
      skip: (m, text) => { const rest = text.slice(m.index + m[0].length); const end = rest.search(/[.!?]/); return end >= 0 && rest[end] === "?"; } },
    { re: /(^|[\s"(])i(?=[\s',.!?]|$)/g, fix: () => "I", en: "“I” is always a capital letter.", it: "“I” si scrive sempre maiuscola.", g: null, type: "tip" },
    { re: /\bactually\b/gi, fix: () => "actually = in realtà", en: "Check: “actually” means “in fact / really” — not “currently” (attualmente).", it: "Attenzione: actually = in realtà, non “attualmente” (= currently).", g: null, type: "tip" },
    { re: /\beventually\b/gi, fix: () => "eventually = alla fine", en: "Check: “eventually” means “in the end” — not “eventualmente” (= possibly).", it: "Eventually = alla fine; “eventualmente” = possibly.", g: null, type: "tip" },
    { re: /\bsympathetic\b/gi, fix: () => "nice / friendly?", en: "If you mean “simpatico”, say nice or friendly. Sympathetic = understanding.", it: "Simpatico = nice / friendly. Sympathetic = comprensivo.", g: null, type: "tip" },
    { re: /\bsensible\b/gi, fix: () => "sensitive?", en: "If you mean “sensibile”, say sensitive. Sensible = reasonable.", it: "Sensibile = sensitive. Sensible = ragionevole.", g: null, type: "tip" },
    { re: /\blibrary\b/gi, fix: () => "bookshop?", en: "Library = biblioteca. If you bought a book, it's a bookshop.", it: "Library = biblioteca. Libreria = bookshop.", g: null, type: "tip" },
    { re: /\bparents\b/gi, fix: () => "relatives?", en: "Parents = mum and dad only. Other family = relatives.", it: "Parents = genitori. Parenti = relatives.", g: null, type: "tip" }
  ];

  function check(text) {
    const out = [];
    const seen = new Set();
    for (const r of R) {
      r.re.lastIndex = 0;
      let m;
      while ((m = r.re.exec(text)) !== null) {
        if (m[0] === "") { r.re.lastIndex++; continue; }
        if (r.skip && r.skip(m, text)) continue;
        // trim leading separator for sentence-start rules
        let start = m.index, str = m[0];
        const lead = str.match(/^(\s*[.!?]?\s*["(]?)/)[0];
        if (lead && /^[\s.!?"(]/.test(str)) { start += lead.length; str = str.slice(lead.length); }
        const key = start + ":" + str.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ start, end: start + str.length, found: str, fix: typeof r.fix === "function" ? r.fix(m) : r.fix, en: r.en, it: r.it, g: r.g, type: r.type || "err" });
      }
    }
    out.sort((a, b) => a.start - b.start);
    // drop overlaps (keep first / errors over tips)
    const res = [];
    for (const h of out) {
      const prev = res[res.length - 1];
      if (prev && h.start < prev.end) { if (prev.type === "tip" && h.type === "err") res[res.length - 1] = h; continue; }
      res.push(h);
    }
    return res;
  }
  return { check };
})();
