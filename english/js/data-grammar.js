/* Grammar cards — Quick Check + Path + quizzes.
   quiz item: [question, options, correctIndex, whyEN, whyIT] */
window.D = window.D || {};
D.grammarCats = [
  ["basics", "The basics", "Le basi"],
  ["present", "Present", "Presente"],
  ["past", "Past", "Passato"],
  ["future", "Future & if", "Futuro e periodo ipotetico"],
  ["nouns", "Nouns & articles", "Nomi e articoli"],
  ["describe", "Describing & comparing", "Descrivere e confrontare"],
  ["small", "Prepositions", "Preposizioni"],
  ["verbs", "Useful verbs", "Verbi utili"],
  ["b1", "B1 structures", "Strutture B1"]
];
D.grammar = [
{
  id: "subject", cat: "basics", lvl: "A2",
  t: "Always use a subject (it / there)", ti: "Serve sempre il soggetto",
  tags: "it is raining there is subject piove è tardi soggetto omesso c'è ci sono",
  rule: [
    "Every English sentence needs a subject.",
    "Use <b>it</b> for weather, time, distance and opinions: <i>It's cold. It's late.</i>",
    "Use <b>there is / there are</b> to say something exists: <i>There's a bus stop here.</i>"
  ],
  ruleIt: "In italiano il soggetto si può omettere (“Piove”, “È tardi”, “È mia sorella”). In inglese no: serve sempre. Per tempo, ore e opinioni si usa <b>it</b>; per dire che una cosa c'è si usa <b>there is / there are</b>.",
  ex: [
    ["It's raining again.", "Piove di nuovo."],
    ["It's ten o'clock.", "Sono le dieci."],
    ["It's important to rest.", "È importante riposare."],
    ["She's my sister.", "È mia sorella."],
    ["There are two chemists on this street.", "Ci sono due farmacie in questa strada."]
  ],
  mist: [
    ["Is raining.", "It's raining.", "Il tempo atmosferico vuole “it”."],
    ["Is very nice here.", "It's very nice here.", "Serve il soggetto “it”."],
    ["Is a pharmacy near here?", "Is there a pharmacy near here?", "Per chiedere se una cosa c'è: “Is there…?”"]
  ],
  quiz: [
    ["___ very cold today.", ["Is", "It's", "There's"], 1, "Weather needs “it”.", "Per il tempo serve “it”."],
    ["Where's Marco? — ___ at work.", ["Is", "He's", "It's"], 1, "You need a subject: he.", "Serve il soggetto: he."],
    ["___ a nice café near the station.", ["It's", "There's", "Is"], 1, "To say something exists, use “there is”.", "Per dire che qualcosa esiste: “there is”."]
  ]
},
{
  id: "be-age", cat: "basics", lvl: "A2",
  t: "Age, hungry, right: use BE, not HAVE", ti: "Età, fame, ragione: si usa BE",
  tags: "age years old hungry thirsty cold hot right afraid ho anni ho fame ho freddo ho ragione ho paura",
  rule: [
    "Use <b>be</b> (not have) for age: <i>I'm 54.</i>",
    "Also: <b>be</b> hungry, thirsty, cold, hot, right, wrong, afraid, sleepy.",
    "You can say <i>I'm 54</i> or <i>I'm 54 years old</i> — never “I have 54 years”."
  ],
  ruleIt: "In italiano diciamo “ho 54 anni”, “ho fame”, “ho ragione”. In inglese si usa il verbo <b>be</b>: I'm 54, I'm hungry, you're right.",
  ex: [
    ["I'm 54.", "Ho 54 anni."],
    ["How old is your grandson? — He's seven.", "Quanti anni ha tuo nipote? — Ne ha sette."],
    ["I'm really hungry.", "Ho proprio fame."],
    ["You're right, it's Tuesday.", "Hai ragione, è martedì."],
    ["Are you cold? I can close the window.", "Hai freddo? Posso chiudere la finestra."],
    ["I'm afraid of big dogs.", "Ho paura dei cani grandi."]
  ],
  mist: [
    ["I have 54 years.", "I'm 54.", "Per l'età si usa “be”."],
    ["I have hungry.", "I'm hungry.", "“Avere fame” = be hungry."],
    ["You have reason.", "You're right.", "“Avere ragione” = be right."]
  ],
  quiz: [
    ["My son ___ 19.", ["has", "is", "have"], 1, "Age uses “be”.", "L'età si dice con “be”."],
    ["Can you close the window? I ___ cold.", ["have", "am", "make"], 1, "“Avere freddo” = be cold.", "“Avere freddo” = be cold."],
    ["You ___ right, the shop is closed.", ["are", "have", "do"], 0, "“Avere ragione” = be right.", "“Avere ragione” = be right."]
  ]
},
{
  id: "have-got", cat: "basics", lvl: "A2",
  t: "Have got (British English)", ti: "Have got (inglese britannico)",
  tags: "have got possess avere possedere british i've got have you got",
  rule: [
    "In the UK, people often say <b>have got</b> for possession, family and illness: <i>I've got two children. I've got a cold.</i>",
    "Questions: <b>Have you got…?</b> Negative: <b>I haven't got…</b>",
    "<i>I have / Do you have…?</i> is also correct. In the past use <b>had</b>, not “had got”."
  ],
  ruleIt: "Nel Regno Unito si usa molto <b>have got</b> per “avere”: I've got a car = Ho una macchina. Domanda: Have you got…? Negativa: I haven't got…",
  ex: [
    ["I've got three grandchildren.", "Ho tre nipoti."],
    ["Have you got a pen?", "Hai una penna?"],
    ["I haven't got time today.", "Oggi non ho tempo."],
    ["She's got a terrible cold.", "Ha un raffreddore terribile."],
    ["We had a dog when I was young.", "Avevamo un cane quando ero giovane."]
  ],
  mist: [
    ["Have you a pen?", "Have you got a pen? / Do you have a pen?", "Senza “got” suona antiquato."],
    ["I don't have got time.", "I haven't got time.", "Con “got” la negativa è “haven't got”."]
  ],
  quiz: [
    ["___ you got a minute?", ["Do", "Have", "Are"], 1, "Question: Have you got…?", "Domanda: Have you got…?"],
    ["She ___ got a car.", ["hasn't", "doesn't", "haven't"], 0, "He/she/it → hasn't got.", "Con he/she/it: hasn't got."],
    ["I ___ a headache.", ["'ve got", "got have", "have get"], 0, "I've got = I have.", "I've got = Ho."]
  ]
},
{
  id: "questions", cat: "basics", lvl: "A2",
  t: "Making questions (word order)", ti: "Fare domande (ordine delle parole)",
  tags: "question word order do does did where what how domande ordine come si dice cosa significa",
  rule: [
    "Order: <b>(question word) + auxiliary + subject + verb</b>.",
    "Auxiliary = do / does / did / am / is / are / have / can / will…",
    "<i>Where <b>do</b> you live? What time <b>does</b> it close?</i>",
    "Polite indirect questions use normal order: <i>Could you tell me where the station <b>is</b>?</i>"
  ],
  ruleIt: "In italiano basta l'intonazione (“Vivi qui?”). In inglese serve un ausiliare <b>prima</b> del soggetto: “Do you live here?”. Ma nelle domande indirette (“Mi sa dire dove…”) l'ordine torna normale.",
  ex: [
    ["Where do you live?", "Dove abiti?"],
    ["What time does the shop close?", "A che ora chiude il negozio?"],
    ["How long did it take?", "Quanto ci è voluto?"],
    ["What does “knackered” mean?", "Cosa significa “knackered”?"],
    ["How do you say “scontrino” in English?", "Come si dice “scontrino” in inglese?"],
    ["Could you tell me where the toilets are?", "Mi sa dire dove sono i bagni?"]
  ],
  mist: [
    ["Where you live?", "Where do you live?", "Manca l'ausiliare “do”."],
    ["What means “queue”?", "What does “queue” mean?", "“Cosa significa” = What does … mean?"],
    ["Could you tell me where is the station?", "Could you tell me where the station is?", "Domanda indiretta: ordine normale."]
  ],
  quiz: [
    ["What time ___ the train leave?", ["is", "does", "do"], 1, "The train = it → does.", "The train = it → does."],
    ["Choose the correct question:", ["How do you say this in English?", "How you say this in English?", "How is said this in English?"], 0, "Question word + do + you + verb.", "Parola interrogativa + do + soggetto + verbo."],
    ["Do you know where ___?", ["is the post office", "the post office is", "is post office"], 1, "Indirect question: normal order.", "Domanda indiretta: ordine normale."]
  ]
},
{
  id: "pres-simple", cat: "present", lvl: "A2",
  t: "Present simple (habits & facts)", ti: "Presente semplice (abitudini e fatti)",
  tags: "present simple habits every day he she it s does doesn't don't presente abitudini terza persona",
  rule: [
    "Use it for routines, habits and facts.",
    "With <b>he / she / it</b> add <b>-s</b>: works, lives, goes, watches, <b>has</b>.",
    "Negative: <b>don't / doesn't</b> + verb. Question: <b>Do / Does</b> + subject + verb."
  ],
  ruleIt: "Si usa per abitudini e fatti. Attenzione alla <b>-s</b> con he/she/it (la dimentichiamo spesso!). Dopo doesn't / does il verbo torna senza -s.",
  ex: [
    ["I work in a hotel.", "Lavoro in un hotel."],
    ["My daughter lives in Bristol.", "Mia figlia vive a Bristol."],
    ["He doesn't drive.", "Lui non guida."],
    ["Do you like tea?", "Ti piace il tè?"],
    ["Does this bus go to the hospital?", "Questo autobus va all'ospedale?"]
  ],
  mist: [
    ["She work on Saturdays.", "She works on Saturdays.", "He/she/it: aggiungi -s."],
    ["He don't like coffee.", "He doesn't like coffee.", "He/she/it: doesn't."],
    ["Does she works here?", "Does she work here?", "Dopo does niente -s."]
  ],
  quiz: [
    ["My husband ___ up at 6 every morning.", ["get", "gets", "getting"], 1, "He → gets.", "He → gets (con la -s)."],
    ["___ your daughter live in London?", ["Do", "Does", "Is"], 1, "Your daughter = she → does.", "Your daughter = she → does."],
    ["She ___ eat meat.", ["don't", "doesn't", "not"], 1, "She → doesn't.", "She → doesn't."]
  ]
},
{
  id: "pres-cont", cat: "present", lvl: "A2",
  t: "Present continuous or present simple?", ti: "Presente progressivo o semplice?",
  tags: "present continuous ing now at the moment sto facendo adesso stative verbs know want like",
  rule: [
    "<b>am / is / are + -ing</b> = now, around now, temporary: <i>I'm cooking.</i>",
    "Present simple = always, usually, every day: <i>I cook every evening.</i>",
    "Some verbs are (almost) never -ing: <b>know, understand, want, need, like, love, believe, remember</b>."
  ],
  ruleIt: "“Sto cucinando” = I'm cooking (adesso). Le abitudini vogliono il present simple. I verbi di stato (know, want, like, understand…) non si usano con -ing: “Capisco” = I understand (non “I'm understanding”).",
  ex: [
    ["I'm cooking — can I call you back?", "Sto cucinando, ti posso richiamare?"],
    ["I usually cook at seven.", "Di solito cucino alle sette."],
    ["She's staying with her sister this week.", "Questa settimana sta da sua sorella."],
    ["What are you doing?", "Cosa stai facendo?"],
    ["I understand now, thank you.", "Adesso capisco, grazie."]
  ],
  mist: [
    ["I'm understanding.", "I understand.", "“Understand” non va con -ing."],
    ["What do you do now? (in this moment)", "What are you doing now?", "Per un'azione in corso: present continuous."],
    ["I'm going to the gym every Monday.", "I go to the gym every Monday.", "Abitudine → present simple."]
  ],
  quiz: [
    ["Shh! The baby ___.", ["sleeps", "is sleeping", "sleep"], 1, "Happening now → is sleeping.", "Sta succedendo ora → is sleeping."],
    ["I ___ what you mean.", ["know", "am knowing", "knowing"], 0, "“Know” is not used with -ing.", "“Know” non si usa con -ing."],
    ["We ___ to the market every Saturday.", ["go", "are going", "goes"], 0, "Habit → present simple.", "Abitudine → present simple."]
  ]
},
{
  id: "frequency", cat: "present", lvl: "A2",
  t: "Always, usually, never… (word order)", ti: "Always, usually, never… (posizione)",
  tags: "adverbs frequency always usually often sometimes never position sempre spesso mai di solito",
  rule: [
    "<b>always, usually, often, sometimes, rarely, never</b> go <b>before</b> the main verb: <i>I usually take the bus.</i>",
    "…but <b>after</b> the verb <b>be</b>: <i>She is always late.</i>",
    "Longer expressions go at the end: <i>once a week, twice a month, every day.</i>"
  ],
  ruleIt: "Gli avverbi di frequenza vanno <b>prima</b> del verbo principale (I always take…), ma <b>dopo</b> “be” (She is always…). In italiano li mettiamo dopo il verbo: attenzione!",
  ex: [
    ["I usually take the bus to work.", "Di solito prendo l'autobus per andare al lavoro."],
    ["She's always late.", "Lei è sempre in ritardo."],
    ["We go to the market once a week.", "Andiamo al mercato una volta alla settimana."],
    ["I never drink coffee after six.", "Non bevo mai caffè dopo le sei."],
    ["I call my mum twice a week.", "Chiamo mia mamma due volte alla settimana."]
  ],
  mist: [
    ["I take always the bus.", "I always take the bus.", "L'avverbio va prima del verbo."],
    ["She always is late.", "She is always late.", "Con “be” l'avverbio va dopo."],
    ["two times a week", "twice a week", "Si dice once, twice, three times."]
  ],
  quiz: [
    ["Choose the correct sentence:", ["I go often to the gym.", "I often go to the gym.", "Often I go to gym."], 1, "Adverb before the main verb.", "L'avverbio va prima del verbo."],
    ["Choose the correct sentence:", ["He is never at home.", "He never is at home.", "He is at home never."], 0, "After “be”.", "Dopo “be”."],
    ["I call my sister ___ a week.", ["two", "twice", "two times of"], 1, "Once, twice, three times…", "Once, twice, three times…"]
  ]
},
{
  id: "past-simple", cat: "past", lvl: "A2",
  t: "Past simple (finished past)", ti: "Past simple (passato concluso)",
  tags: "past simple yesterday last ago ed irregular did didn't passato prossimo remoto ieri sono andata ho fatto",
  rule: [
    "Use it for finished actions at a finished time: <i>yesterday, last week, in 2012, two days ago.</i>",
    "Regular verbs: <b>+ed</b> (worked, lived). Many common verbs are irregular (go → <b>went</b>, buy → <b>bought</b>) — see the Irregular verbs table.",
    "Negative / question: <b>didn't / Did</b> + base verb: <i>I didn't go. Did you go?</i>"
  ],
  ruleIt: "Il past simple corrisponde spesso al <b>passato prossimo</b> italiano! “Ieri sono andata dal medico” = Yesterday I <b>went</b> to the doctor (non “I have been”). Dopo did/didn't il verbo torna alla forma base.",
  ex: [
    ["I went to the doctor yesterday.", "Ieri sono andata dal medico."],
    ["We moved to the UK in 2012.", "Ci siamo trasferiti nel Regno Unito nel 2012."],
    ["I didn't see her at the party.", "Non l'ho vista alla festa."],
    ["Did you buy milk?", "Hai comprato il latte?"],
    ["She called me two hours ago.", "Mi ha chiamato due ore fa."]
  ],
  mist: [
    ["Yesterday I have been to the doctor.", "Yesterday I went to the doctor.", "Con “yesterday” → past simple."],
    ["I didn't went.", "I didn't go.", "Dopo didn't: forma base."],
    ["Did you saw him?", "Did you see him?", "Dopo did: forma base."]
  ],
  quiz: [
    ["Last Saturday we ___ to the seaside.", ["have gone", "went", "go"], 1, "Finished time (last Saturday) → past simple.", "Tempo finito → past simple."],
    ["I didn't ___ your message.", ["saw", "see", "seen"], 1, "After didn't → base verb.", "Dopo didn't → forma base."],
    ["___ you sleep well?", ["Did", "Have", "Were"], 0, "Past question → Did.", "Domanda al passato → Did."],
    ["She ___ me a lovely present.", ["gived", "gave", "given"], 1, "give → gave (irregular).", "give → gave (irregolare)."]
  ]
},
{
  id: "past-cont", cat: "past", lvl: "A2",
  t: "Past continuous (was doing)", ti: "Past continuous (stavo facendo)",
  tags: "past continuous was were ing while when interrupted stavo facendo imperfetto mentre",
  rule: [
    "<b>was / were + -ing</b> = an action in progress in the past.",
    "Often “interrupted” by a short action in the past simple: <i>I was cooking <b>when</b> the phone rang.</i>",
    "<b>while</b> + past continuous: <i>While I was waiting, it started to rain.</i>"
  ],
  ruleIt: "Corrisponde all'imperfetto “stavo facendo / facevo” per un'azione in corso. L'azione breve che la interrompe va al past simple.",
  ex: [
    ["I was cooking when the phone rang.", "Stavo cucinando quando ha squillato il telefono."],
    ["What were you doing at eight?", "Cosa stavi facendo alle otto?"],
    ["While I was waiting, it started to rain.", "Mentre aspettavo, ha cominciato a piovere."],
    ["It was snowing when we arrived.", "Nevicava quando siamo arrivati."]
  ],
  mist: [
    ["I was walk home when…", "I was walking home when…", "Was/were + -ing."],
    ["When the phone was ringing, I answered.", "When the phone rang, I answered.", "L'azione breve va al past simple."]
  ],
  quiz: [
    ["I ___ a shower when you called.", ["had", "was having", "have"], 1, "Action in progress → was having.", "Azione in corso → was having."],
    ["They were watching TV when the lights ___ off.", ["went", "were going", "go"], 0, "Short action → past simple.", "Azione breve → past simple."],
    ["What ___ you doing at ten last night?", ["did", "were", "was"], 1, "You → were.", "You → were."]
  ]
},
{
  id: "used-to", cat: "past", lvl: "B1",
  t: "Used to / be used to", ti: "Used to / be used to",
  tags: "used to past habit be used to accustomed abituata imperfetto una volta",
  rule: [
    "<b>used to + verb</b> = past habits or states that are not true now: <i>I used to live in Naples.</i>",
    "Negative / question: <b>didn't use to / Did you use to…?</b> (no -d).",
    "Different meaning: <b>be used to + -ing / noun</b> = be accustomed: <i>I'm used to the rain.</i>"
  ],
  ruleIt: "<b>used to</b> ≈ imperfetto per abitudini passate (“Una volta abitavo a Napoli”). <b>be used to + -ing</b> = essere abituata a (“Sono abituata ad alzarmi presto” = I'm used to getting up early).",
  ex: [
    ["I used to live in Naples.", "Una volta abitavo a Napoli."],
    ["She didn't use to like tea.", "Prima non le piaceva il tè."],
    ["Did you use to smoke?", "Fumavi, una volta?"],
    ["I'm used to the rain now.", "Ormai sono abituata alla pioggia."],
    ["I'm used to getting up early.", "Sono abituata ad alzarmi presto."]
  ],
  mist: [
    ["I use to work in a shop. (past)", "I used to work in a shop.", "Al passato: used to."],
    ["I'm used to get up early.", "I'm used to getting up early.", "Be used to + -ing."]
  ],
  quiz: [
    ["When I was a child, I ___ play in the street.", ["used to", "use to", "was used to"], 0, "Past habit → used to.", "Abitudine passata → used to."],
    ["After 10 years in England, I'm used to ___ on the left.", ["drive", "driving", "drove"], 1, "be used to + -ing.", "be used to + -ing."],
    ["Did you ___ smoke?", ["used to", "use to", "using to"], 1, "After did → use to.", "Dopo did → use to."]
  ]
},
{
  id: "pres-perfect", cat: "past", lvl: "B1",
  t: "Present perfect (have done)", ti: "Present perfect (have done)",
  tags: "present perfect have has been ever never just already yet esperienza passato prossimo sei mai stata ho già",
  rule: [
    "<b>have / has + past participle</b> (been, seen, done, finished…).",
    "Use it for: experiences (<b>ever / never</b>), recent news (<b>just</b>), <b>already / yet</b>, and time periods not finished (today, this week).",
    "Do <b>not</b> use it with a finished time (yesterday, last year, ago) → use past simple."
  ],
  ruleIt: "Sembra il passato prossimo, ma si usa <b>solo</b> quando non c'è un tempo finito. “Ho già mangiato” = I've already eaten. Ma “Ieri ho mangiato” = Yesterday I ate. <b>yet</b> = già (nelle domande) / ancora (nelle negative).",
  ex: [
    ["Have you ever been to Scotland?", "Sei mai stata in Scozia?"],
    ["I've never tried haggis.", "Non ho mai assaggiato l'haggis."],
    ["I've just finished work.", "Ho appena finito di lavorare."],
    ["Have you paid the bill yet?", "Hai già pagato la bolletta?"],
    ["I haven't seen it yet.", "Non l'ho ancora visto."],
    ["She's lost her keys.", "Ha perso le chiavi (e non le trova)."]
  ],
  mist: [
    ["I have seen him yesterday.", "I saw him yesterday.", "Con “yesterday” → past simple."],
    ["Did you ever go to Wales?", "Have you ever been to Wales?", "Esperienze → present perfect."],
    ["I have finished already it.", "I've already finished it.", "already va prima del participio."]
  ],
  quiz: [
    ["I ___ my keys! I can't open the door.", ["lost", "have lost", "lose"], 1, "Past action, result now → present perfect.", "Azione passata con effetto ora → present perfect."],
    ["We ___ to Spain last summer.", ["went", "have gone", "have been"], 0, "Last summer = finished time → past simple.", "Last summer = tempo finito → past simple."],
    ["Have you finished ___?", ["already", "yet", "just"], 1, "Questions/negatives at the end → yet.", "Domande/negative alla fine → yet."],
    ["___ you ever eaten fish and chips?", ["Did", "Have", "Are"], 1, "Experience with ever → Have.", "Esperienza con ever → Have."]
  ]
},
{
  id: "for-since", cat: "past", lvl: "B1",
  t: "For, since, ago (I've lived here for…)", ti: "For, since, ago (vivo qui da…)",
  tags: "for since ago how long have lived da quanto tempo vivo qui da anni fa present perfect continuous",
  rule: [
    "To say how long something has continued up to now, use the <b>present perfect</b> — not the present simple.",
    "<b>for</b> + a period: <i>for ten years, for two weeks.</i> <b>since</b> + a starting point: <i>since 2014, since March, since I was 30.</i>",
    "For actions: <b>have been + -ing</b>: <i>I've been waiting for 20 minutes.</i>",
    "<b>ago</b> = “fa”, with the past simple: <i>I came here twelve years ago.</i>"
  ],
  ruleIt: "Errore classico! “Vivo qui <b>da</b> 10 anni” = I've lived here <b>for</b> 10 years (non “I live here since 10 years”). <b>Da</b> + periodo = for; <b>da</b> + momento preciso = since; <b>fa</b> = ago.",
  ex: [
    ["I've lived in the UK for fifteen years.", "Vivo nel Regno Unito da quindici anni."],
    ["I've known her since 2010.", "La conosco dal 2010."],
    ["I've been waiting for twenty minutes.", "Aspetto da venti minuti."],
    ["How long have you worked there?", "Da quanto tempo lavori lì?"],
    ["I came to England twelve years ago.", "Sono venuta in Inghilterra dodici anni fa."]
  ],
  mist: [
    ["I live here since 10 years.", "I've lived here for 10 years.", "Durata fino a ora: present perfect + for."],
    ["I'm waiting since 9 o'clock.", "I've been waiting since 9 o'clock.", "Azione che continua: have been + -ing."],
    ["How long are you here?", "How long have you been here?", "“Da quanto” → How long have you…?"]
  ],
  quiz: [
    ["I've worked at the hospital ___ 2016.", ["for", "since", "from"], 1, "2016 is a starting point → since.", "2016 è un punto d'inizio → since."],
    ["We ___ married for 30 years.", ["are", "have been", "were"], 1, "Up to now → have been.", "Fino a ora → have been."],
    ["I arrived in London ten years ___.", ["ago", "since", "for"], 0, "“Fa” = ago.", "“Fa” = ago."],
    ["She's been ill ___ three days.", ["since", "for", "from"], 1, "A period → for.", "Un periodo → for."]
  ]
},
{
  id: "future", cat: "future", lvl: "A2",
  t: "Future: will, going to, present continuous", ti: "Futuro: will, going to, present continuous",
  tags: "future will going to plans arrangements tomorrow futuro domani vado programmi",
  rule: [
    "<b>will</b> = decisions now, offers, promises, predictions: <i>I'll help you.</i>",
    "<b>going to</b> = plans already decided, or something we can see coming: <i>It's going to rain.</i>",
    "<b>present continuous</b> = fixed arrangements (time / place / other people): <i>I'm seeing the doctor on Friday.</i>"
  ],
  ruleIt: "In italiano usiamo spesso il presente per il futuro (“Domani vado dal dentista”). In inglese no! Per appuntamenti: <b>I'm going</b> to the dentist tomorrow. Per un'offerta o decisione immediata: <b>I'll</b>…",
  ex: [
    ["I'll call you later.", "Ti chiamo più tardi."],
    ["We're going to visit Italy in July.", "A luglio andremo in Italia."],
    ["I'm meeting Anna tomorrow at three.", "Domani alle tre vedo Anna."],
    ["Look at those clouds — it's going to rain.", "Guarda quelle nuvole: pioverà."],
    ["Don't worry, I'll do it.", "Non preoccuparti, lo faccio io."]
  ],
  mist: [
    ["Tomorrow I go to the dentist.", "Tomorrow I'm going to the dentist.", "Appuntamento fissato → present continuous."],
    ["I help you with the bags!", "I'll help you with the bags!", "Offerta → will."]
  ],
  quiz: [
    ["The phone's ringing. — OK, I ___ it.", ["answer", "'ll answer", "am answering"], 1, "Decision now → will.", "Decisione immediata → will."],
    ["I ___ my sister on Saturday. We've booked a table.", ["'ll see", "'m seeing", "see"], 1, "Arrangement → present continuous.", "Appuntamento → present continuous."],
    ["Look at the sky! It ___ rain.", ["is going to", "will to", "goes to"], 0, "We can see it coming → going to.", "Lo vediamo arrivare → going to."]
  ]
},
{
  id: "conditionals", cat: "future", lvl: "B1",
  t: "If… (conditionals 0, 1, 2)", ti: "Se… (periodo ipotetico)",
  tags: "if conditional would will first second zero if i were you se periodo ipotetico avessi farei",
  rule: [
    "<b>Zero</b> — facts: <i>If you heat water, it boils.</i> (if + present, present)",
    "<b>First</b> — real possibility: <i>If it rains, we'll stay at home.</i> (if + present, will)",
    "<b>Second</b> — imaginary: <i>If I had more time, I'd learn to drive.</i> (if + past, would)",
    "Never put <b>will</b> or <b>would</b> after <b>if</b>. Advice: <i>If I were you, I'd…</i>"
  ],
  ruleIt: "Dopo <b>if</b> non si usa mai will/would. “Se piove resto a casa” = If it rains, I'll stay at home. “Se avessi tempo, imparerei” = If I had time, I'd learn. “Se fossi in te” = If I were you.",
  ex: [
    ["If it rains tomorrow, we'll stay at home.", "Se domani piove, restiamo a casa."],
    ["If I had more time, I'd learn to drive.", "Se avessi più tempo, imparerei a guidare."],
    ["If I were you, I'd call them.", "Se fossi in te, li chiamerei."],
    ["If you press this button, the door opens.", "Se premi questo pulsante, la porta si apre."]
  ],
  mist: [
    ["If it will rain…", "If it rains…", "Niente will dopo if."],
    ["If I would have money…", "If I had money…", "Niente would dopo if."],
    ["If I would be you…", "If I were you…", "Si dice “If I were you”."]
  ],
  quiz: [
    ["If you ___ late, call me.", ["will be", "are", "would be"], 1, "No will after if.", "Niente will dopo if."],
    ["If I ___ the lottery, I'd buy a house in Italy.", ["win", "won", "will win"], 1, "Imaginary → if + past.", "Ipotesi → if + past."],
    ["If I were you, I ___ see a doctor.", ["will", "would", "am"], 1, "Advice → would.", "Consiglio → would."]
  ]
},
{
  id: "articles", cat: "nouns", lvl: "A2",
  t: "A, an, the — or nothing?", ti: "A, an, the — o niente?",
  tags: "articles a an the no article general la vita i cani articolo professioni",
  rule: [
    "<b>a / an</b> = one, not specific; also jobs: <i>She's a nurse.</i> (<b>an</b> before a vowel <i>sound</i>: an hour, a university)",
    "<b>the</b> = a specific thing we both know: <i>the dog next door.</i>",
    "<b>No article</b> for things in general (plural or uncountable): <i>Life is short. I like dogs. Coffee is expensive.</i>",
    "No article: <i>at home, at work, go to bed, by bus, have lunch, next week.</i>"
  ],
  ruleIt: "Grande differenza! In italiano “<b>La</b> vita è bella”, “Mi piacciono <b>i</b> cani”. In inglese, quando parliamo in generale, niente “the”: Life is beautiful, I like dogs. Con le professioni serve a/an: “Faccio l'infermiera” = I'm <b>a</b> nurse.",
  ex: [
    ["Life is beautiful.", "La vita è bella."],
    ["I like dogs, but the dog next door is very noisy.", "Mi piacciono i cani, ma il cane dei vicini è molto rumoroso."],
    ["She's a teacher.", "Fa l'insegnante."],
    ["It's an hour by train.", "È un'ora di treno."],
    ["I go to work by bus.", "Vado al lavoro in autobus."]
  ],
  mist: [
    ["The life is hard.", "Life is hard.", "In generale: niente “the”."],
    ["I'm nurse.", "I'm a nurse.", "Professioni: a/an."],
    ["I like the coffee. (in general)", "I like coffee.", "In generale: niente “the”."],
    ["She's at the home.", "She's at home.", "“A casa” = at home."]
  ],
  quiz: [
    ["___ is very expensive in London.", ["The life", "Life", "A life"], 1, "In general → no article.", "In generale → niente articolo."],
    ["My brother is ___ electrician.", ["a", "an", "(no article)"], 1, "Job + vowel sound → an.", "Professione + vocale → an."],
    ["I usually have ___ lunch at one.", ["the", "a", "(no article)"], 2, "Meals → no article.", "Pasti → niente articolo."],
    ["Can you close ___ door, please?", ["a", "the", "(no article)"], 1, "A specific door → the.", "Una porta precisa → the."]
  ]
},
{
  id: "countable", cat: "nouns", lvl: "A2",
  t: "Information, advice, news (uncountable)", ti: "Information, advice, news (non numerabili)",
  tags: "uncountable countable much many some any information advice news people informazioni consigli notizie capelli mobili quanto quanti",
  rule: [
    "Uncountable nouns have <b>no plural</b> and no <b>a/an</b>: information, advice, news, furniture, luggage, homework, money, bread, hair, weather, traffic, work.",
    "Use: <b>some, much, a lot of, a piece of</b>. <i>a piece of advice.</i>",
    "Countable: <b>many, a few</b>. Uncountable: <b>much, a little</b>.",
    "<b>people</b> is plural: <i>people <b>are</b>.</i> <b>news</b> is singular: <i>the news <b>is</b>.</i>"
  ],
  ruleIt: "Alcune parole plurali in italiano sono singolari in inglese: informazioni = <b>information</b>, consigli = <b>advice</b>, notizie = <b>news</b> (+ is), capelli = <b>hair</b>, mobili = <b>furniture</b>, bagagli = <b>luggage</b>. Invece <b>people</b> (la gente) è plurale!",
  ex: [
    ["Can I have some information about the course?", "Posso avere delle informazioni sul corso?"],
    ["She gave me some good advice.", "Mi ha dato dei buoni consigli."],
    ["The news is good.", "Le notizie sono buone."],
    ["How much money do you need?", "Quanti soldi ti servono?"],
    ["How many people came?", "Quante persone sono venute?"],
    ["People are very friendly here.", "La gente qui è molto cordiale."]
  ],
  mist: [
    ["informations", "information", "Niente plurale."],
    ["an advice", "some advice / a piece of advice", "Niente a/an."],
    ["The news are bad.", "The news is bad.", "News è singolare."],
    ["How much people?", "How many people?", "People è numerabile → many."],
    ["People is nice.", "People are nice.", "People è plurale."]
  ],
  quiz: [
    ["Can you give me some ___ about the course?", ["informations", "information", "an information"], 1, "Uncountable — no -s.", "Non numerabile: niente -s."],
    ["How ___ sugar do you take?", ["many", "much", "lot"], 1, "Uncountable → much.", "Non numerabile → much."],
    ["There weren't ___ people at the meeting.", ["much", "many", "some"], 1, "People = countable → many.", "People è numerabile → many."],
    ["The people here ___ very friendly.", ["is", "are", "be"], 1, "People is plural.", "People è plurale."]
  ]
},
{
  id: "possessives", cat: "nouns", lvl: "A2",
  t: "His or her? and 's", ti: "His o her? e 's",
  tags: "possessive his her its their 's suo sua genitivo sassone di mio fratello",
  rule: [
    "<b>his</b> = of a man, <b>her</b> = of a woman, <b>its</b> = of a thing/animal, <b>their</b> = of more people.",
    "The choice depends on the <b>owner</b>, not the thing: <i>Anna and <b>her</b> husband.</i>",
    "For people use <b>'s</b>: <i>my brother's car</i> (not “the car of my brother”).",
    "<b>it's</b> = it is; <b>its</b> = possession."
  ],
  ruleIt: "In italiano “suo/sua” si accorda con la cosa posseduta. In inglese dipende dal <b>possessore</b>: Marco e <b>sua</b> moglie = Marco and <b>his</b> wife; Anna e <b>suo</b> marito = Anna and <b>her</b> husband.",
  ex: [
    ["Marco is here with his wife.", "Marco è qui con sua moglie."],
    ["Anna loves her husband.", "Anna ama suo marito."],
    ["This is my daughter's school.", "Questa è la scuola di mia figlia."],
    ["The cat is eating its dinner.", "Il gatto sta mangiando la sua cena."],
    ["Their house is beautiful.", "La loro casa è bellissima."]
  ],
  mist: [
    ["Anna and his husband", "Anna and her husband", "Anna è una donna → her."],
    ["the car of my brother", "my brother's car", "Per le persone: 's."],
    ["The company and it's staff", "The company and its staff", "its = possesso; it's = it is."]
  ],
  quiz: [
    ["Luca called ___ mother.", ["her", "his", "its"], 1, "Luca is a man → his.", "Luca è un uomo → his."],
    ["My sister lost ___ phone.", ["his", "her", "their"], 1, "My sister → her.", "My sister → her."],
    ["This is ___.", ["the coat of my husband", "my husband's coat", "my husbands coat"], 1, "Person + 's.", "Persona + 's."]
  ]
},
{
  id: "comparatives", cat: "describe", lvl: "A2",
  t: "Comparing: cheaper, more expensive, the best", ti: "Confronti: più… di, il più…",
  tags: "comparative superlative er est more most than better best worse più di meno migliore peggiore",
  rule: [
    "Short adjectives: <b>-er / the -est</b>: cheap → cheaper → the cheapest; big → bigger; easy → easier.",
    "Long adjectives: <b>more / the most</b>: more expensive, the most comfortable.",
    "Irregular: good → <b>better</b> → <b>the best</b>; bad → <b>worse</b> → <b>the worst</b>; far → further.",
    "Use <b>than</b>: <i>cheaper than</i>. Equal: <i>as cold as</i>."
  ],
  ruleIt: "“più … di” = -er than / more … than. Non usare mai “more” insieme a “-er” (more cheaper ✗). “di” nel confronto = <b>than</b>.",
  ex: [
    ["The bus is cheaper than the train.", "L'autobus è più economico del treno."],
    ["This sofa is more comfortable.", "Questo divano è più comodo."],
    ["Today is worse than yesterday.", "Oggi è peggio di ieri."],
    ["She's the best cook in the family.", "È la cuoca migliore della famiglia."],
    ["It isn't as cold as last week.", "Non fa freddo come la settimana scorsa."]
  ],
  mist: [
    ["more cheap", "cheaper", "Aggettivo corto: -er."],
    ["more better", "better", "Better è già comparativo."],
    ["bigger of me", "bigger than me", "“di” = than."]
  ],
  quiz: [
    ["The market is ___ than the supermarket.", ["cheaper", "more cheap", "most cheap"], 0, "Short adjective → -er.", "Aggettivo corto → -er."],
    ["This is the ___ day of my life!", ["better", "best", "most good"], 1, "good → the best.", "good → the best."],
    ["My English is ___ than last year.", ["gooder", "more good", "better"], 2, "good → better.", "good → better."]
  ]
},
{
  id: "too-enough", cat: "describe", lvl: "A2",
  t: "Very, too, enough", ti: "Very, too, enough",
  tags: "too enough very troppo abbastanza molto",
  rule: [
    "<b>very</b> = a lot (good or bad): <i>It's very hot.</i>",
    "<b>too</b> = more than is OK — there's a problem: <i>It's too hot to drink.</i>",
    "<b>enough</b> goes <b>after</b> adjectives (<i>big enough</i>) but <b>before</b> nouns (<i>enough time</i>)."
  ],
  ruleIt: "<b>too</b> = troppo (c'è un problema). <b>enough</b> = abbastanza e va <b>dopo</b> l'aggettivo: “abbastanza grande” = big enough.",
  ex: [
    ["This coat is too big for me.", "Questo cappotto è troppo grande per me."],
    ["It's very hot today.", "Fa molto caldo oggi."],
    ["Is the room warm enough?", "La stanza è abbastanza calda?"],
    ["We haven't got enough chairs.", "Non abbiamo abbastanza sedie."],
    ["I'm too tired to cook tonight.", "Stasera sono troppo stanca per cucinare."]
  ],
  mist: [
    ["enough big", "big enough", "Enough va dopo l'aggettivo."],
    ["too much expensive", "too expensive", "Con l'aggettivo: solo too."],
    ["This cake is too good! (meaning very good)", "This cake is really good!", "Too = problema."]
  ],
  quiz: [
    ["I can't reach the shelf. I'm not ___.", ["tall enough", "enough tall", "too tall"], 0, "Adjective + enough.", "Aggettivo + enough."],
    ["The tea is ___ hot to drink.", ["very", "too", "enough"], 1, "A problem → too.", "C'è un problema → too."],
    ["Have we got ___ milk?", ["enough", "too", "very"], 0, "enough + noun.", "enough + nome."]
  ]
},
{
  id: "ed-ing", cat: "describe", lvl: "B1",
  t: "Bored or boring? (-ed / -ing)", ti: "Bored o boring? (-ed / -ing)",
  tags: "ed ing adjectives bored boring interested interesting tired tiring worried annoiata noioso",
  rule: [
    "<b>-ed</b> = how a person feels: <i>I'm bored, tired, interested, worried, excited.</i>",
    "<b>-ing</b> = what causes the feeling: <i>The film is boring. The news is worrying.</i>"
  ],
  ruleIt: "“Mi annoio” = I'm <b>bored</b>. “Sono noiosa” = I'm <b>boring</b> — attenzione! -ed = come ti senti; -ing = cosa provoca la sensazione.",
  ex: [
    ["I'm bored.", "Mi annoio."],
    ["This programme is really boring.", "Questo programma è proprio noioso."],
    ["I was so embarrassed!", "Che imbarazzo! (embarrassed ≠ incinta)"],
    ["I'm interested in history.", "Mi interessa la storia."],
    ["It was a tiring day.", "È stata una giornata stancante."]
  ],
  mist: [
    ["I'm boring. (meaning bored)", "I'm bored.", "Come ti senti → -ed."],
    ["I'm very interesting in art.", "I'm very interested in art.", "Come ti senti → -ed."]
  ],
  quiz: [
    ["The film was long and ___.", ["bored", "boring"], 1, "It causes the feeling → -ing.", "Causa la sensazione → -ing."],
    ["I'm ___ about my exam tomorrow.", ["worried", "worrying"], 0, "How I feel → -ed.", "Come mi sento → -ed."],
    ["I'm ___ in learning more.", ["interesting", "interested"], 1, "How I feel → -ed.", "Come mi sento → -ed."]
  ]
},
{
  id: "prep-time", cat: "small", lvl: "A2",
  t: "In, on, at (time)", ti: "In, on, at (tempo)",
  tags: "prepositions time in on at weekend monday morning night preposizioni tempo lunedì mattina weekend",
  rule: [
    "<b>at</b> + clock times, at night, <b>at the weekend</b> (UK), at Christmas.",
    "<b>on</b> + days and dates: on Monday, on 3rd May, on my birthday.",
    "<b>in</b> + months, years, seasons, parts of the day: in May, in 2015, in the morning.",
    "<b>No preposition</b> with: tomorrow, yesterday, next / last / this / every…"
  ],
  ruleIt: "In inglese britannico si dice <b>at the weekend</b>. Con i giorni: <b>on</b> Monday. Con next, last, this, every: nessuna preposizione (“next week”, non “in next week”).",
  ex: [
    ["The meeting is at half past ten.", "La riunione è alle dieci e mezza."],
    ["See you on Friday!", "Ci vediamo venerdì!"],
    ["I was born in 1971.", "Sono nata nel 1971."],
    ["What are you doing at the weekend?", "Cosa fai nel fine settimana?"],
    ["I go swimming in the morning.", "Vado a nuotare la mattina."],
    ["I'll see you next week.", "Ci vediamo la settimana prossima."]
  ],
  mist: [
    ["in Monday", "on Monday", "Giorni: on."],
    ["at the morning", "in the morning", "Parti del giorno: in (ma at night)."],
    ["on the weekend (American)", "at the weekend (British)", "Nel Regno Unito: at the weekend."],
    ["in next week", "next week", "Con next: niente preposizione."]
  ],
  quiz: [
    ["My appointment is ___ Tuesday.", ["in", "on", "at"], 1, "Days → on.", "Giorni → on."],
    ["I start work ___ 8 o'clock.", ["in", "at", "on"], 1, "Clock times → at.", "Orari → at."],
    ["We're going to Italy ___ August.", ["in", "on", "at"], 0, "Months → in.", "Mesi → in."],
    ["See you ___ week!", ["next", "in next", "on next"], 0, "next → no preposition.", "next → niente preposizione."]
  ]
},
{
  id: "prep-place", cat: "small", lvl: "A2",
  t: "In, on, at (place) & go home", ti: "In, on, at (luogo) e go home",
  tags: "prepositions place in on at home bus floor street arrive preposizioni luogo a casa sull'autobus piano arrivare",
  rule: [
    "<b>in</b> = inside; towns and countries: in the kitchen, in Leeds, in a queue.",
    "<b>on</b> = surfaces, floors, streets, buses and trains: on the table, on the second floor, on the bus.",
    "<b>at</b> = a point or place for an activity: at the bus stop, at the doctor's, at home, at work, at 14 Park Road.",
    "<b>arrive in</b> (a town) / <b>arrive at</b> (a building). <b>go home</b> — no “to”!"
  ],
  ruleIt: "“Sono a casa” = I'm <b>at</b> home; “Vado a casa” = I'm going home (senza “to”!). “In autobus/treno” = <b>on</b> the bus/train. “Al secondo piano” = <b>on</b> the second floor.",
  ex: [
    ["I live at 22 Park Road.", "Abito al numero 22 di Park Road."],
    ["She lives on Park Road.", "Abita in Park Road."],
    ["We arrived in Birmingham at six.", "Siamo arrivati a Birmingham alle sei."],
    ["I'm on the bus — I'll be there soon.", "Sono sull'autobus, arrivo presto."],
    ["I'll meet you at the station.", "Ci vediamo alla stazione."],
    ["I'm going home.", "Vado a casa."]
  ],
  mist: [
    ["I go to home.", "I go home.", "Home senza “to”."],
    ["I'm in the bus.", "I'm on the bus.", "Mezzi pubblici: on."],
    ["We arrived to London.", "We arrived in London.", "Arrive in / at, mai “to”."],
    ["at the second floor", "on the second floor", "Piani: on."]
  ],
  quiz: [
    ["I live ___ the third floor.", ["in", "on", "at"], 1, "Floors → on.", "Piani → on."],
    ["We arrived ___ the airport very early.", ["to", "at", "in"], 1, "Building → arrive at.", "Edificio → arrive at."],
    ["What time do you go ___?", ["home", "to home", "at home"], 0, "go home — no “to”.", "go home, senza “to”."]
  ]
},
{
  id: "verb-prep", cat: "small", lvl: "B1",
  t: "Depend on, listen to, wait for…", ti: "Verbi + preposizione",
  tags: "verb preposition depend on listen to wait for married to explain discuss dipende da sposata con spiegami",
  rule: [
    "Many verbs and adjectives have a fixed preposition — often different from Italian:",
    "<b>depend on, listen to, wait for, look for, ask for, pay for, worry about, agree with, belong to, married to, good at, afraid of, interested in</b>.",
    "<b>explain something TO someone</b>: <i>Can you explain it to me?</i>",
    "<b>discuss</b> has <b>no</b> preposition: <i>We discussed the problem.</i>"
  ],
  ruleIt: "Dipende <b>da</b> = depend <b>on</b>; sposata <b>con</b> = married <b>to</b>; aspettare l'autobus = wait <b>for</b> the bus; ascoltare la musica = listen <b>to</b> music; “spiegami” = explain <b>to</b> me; discutere <b>di</b> = discuss (senza preposizione).",
  ex: [
    ["It depends on the weather.", "Dipende dal tempo."],
    ["I'm listening to the radio.", "Sto ascoltando la radio."],
    ["Can you explain this to me?", "Me lo puoi spiegare?"],
    ["We discussed the problem.", "Abbiamo discusso del problema."],
    ["I'm waiting for the bus.", "Sto aspettando l'autobus."],
    ["She's married to a Scottish man.", "È sposata con uno scozzese."]
  ],
  mist: [
    ["It depends from…", "It depends on…", "Depend on."],
    ["Explain me.", "Explain to me. / Explain it to me.", "Explain + to + persona."],
    ["We discussed about it.", "We discussed it.", "Discuss senza about."],
    ["I'm waiting the bus.", "I'm waiting for the bus.", "Wait for."],
    ["I listen music.", "I listen to music.", "Listen to."]
  ],
  quiz: [
    ["It depends ___ the price.", ["from", "of", "on"], 2, "depend on.", "depend on."],
    ["Can you explain ___?", ["me this", "this to me", "to me this"], 1, "explain something to someone.", "explain qualcosa to qualcuno."],
    ["She's married ___ a Scottish man.", ["with", "to", "at"], 1, "married to.", "married to."],
    ["We need to discuss ___ plan.", ["about the", "the", "of the"], 1, "discuss + object (no about).", "discuss senza about."]
  ]
},
{
  id: "make-do", cat: "verbs", lvl: "A2",
  t: "Make or do? (and take, have, ask)", ti: "Make o do? (e take, have, ask)",
  tags: "make do take have ask fare una foto fare la doccia fare una domanda fare la spesa fare un errore",
  rule: [
    "<b>do</b> = tasks, jobs, general activity: do the shopping, do the washing-up, do homework, do exercise, do a course, do someone a favour.",
    "<b>make</b> = create or produce: make dinner, make a cake, make a mistake, make a decision, make an appointment, make a phone call, make a noise, make friends.",
    "Italian “fare” can also be: <b>take</b> a photo, <b>have</b> a shower, <b>have</b> breakfast, <b>ask</b> a question, <b>go</b> for a walk."
  ],
  ruleIt: "Il verbo “fare” si traduce in molti modi: fare la spesa = <b>do</b> the shopping; fare un errore = <b>make</b> a mistake; fare una foto = <b>take</b> a photo; fare la doccia = <b>have</b> a shower; fare una domanda = <b>ask</b> a question; fare una passeggiata = <b>go for</b> a walk.",
  ex: [
    ["I do the shopping on Fridays.", "Faccio la spesa il venerdì."],
    ["I made a mistake.", "Ho fatto un errore."],
    ["I'd like to make an appointment.", "Vorrei prendere un appuntamento."],
    ["Can I ask a question?", "Posso fare una domanda?"],
    ["Let's take a photo!", "Facciamo una foto!"],
    ["I'll have a shower and then go for a walk.", "Mi faccio la doccia e poi vado a fare una passeggiata."]
  ],
  mist: [
    ["make my homework", "do my homework", "Compiti → do."],
    ["do a mistake", "make a mistake", "Errore → make."],
    ["make a photo", "take a photo", "Foto → take."],
    ["make a question", "ask a question", "Domanda → ask."],
    ["make a shower", "have a shower", "Doccia → have."]
  ],
  quiz: [
    ["I need to ___ an appointment with the dentist.", ["do", "make", "take"], 1, "make an appointment.", "make an appointment."],
    ["Can I ___ you a question?", ["make", "do", "ask"], 2, "ask a question.", "ask a question."],
    ["Who's ___ the washing-up tonight?", ["doing", "making", "taking"], 0, "Housework → do.", "Faccende → do."],
    ["Let's ___ a photo of the view.", ["make", "take", "do"], 1, "take a photo.", "take a photo."]
  ]
},
{
  id: "say-tell", cat: "verbs", lvl: "A2",
  t: "Say, tell, speak, talk", ti: "Say, tell, speak, talk",
  tags: "say tell speak talk dire raccontare parlare dimmi",
  rule: [
    "<b>say</b> something (to someone): <i>She said hello. What did he say?</i>",
    "<b>tell</b> someone something: <i>Tell me the truth.</i> Also: tell a story, a joke, a lie, the time.",
    "<b>speak</b> = languages, formal, phone: <i>Do you speak Italian? Could I speak to the manager?</i>",
    "<b>talk</b> = conversation: <i>We talked for hours. Talk to me.</i>"
  ],
  ruleIt: "“Dimmi” = <b>tell</b> me (mai “say me”). Tell ha sempre la persona subito dopo. “Parlo italiano” = I <b>speak</b> Italian.",
  ex: [
    ["What did he say?", "Cosa ha detto?"],
    ["Can you tell me the time?", "Mi sa dire che ore sono?"],
    ["She told me a funny story.", "Mi ha raccontato una storia divertente."],
    ["Do you speak Italian?", "Parli italiano?"],
    ["Could I speak to Mr Jones, please?", "Potrei parlare con il signor Jones?"],
    ["We talked about the holiday.", "Abbiamo parlato della vacanza."]
  ],
  mist: [
    ["Say me.", "Tell me.", "Tell + persona."],
    ["He told that he was tired.", "He said that he was tired.", "Senza persona → say."],
    ["I talk Italian.", "I speak Italian.", "Lingue → speak."]
  ],
  quiz: [
    ["Can you ___ me your address?", ["say", "tell", "speak"], 1, "tell + person.", "tell + persona."],
    ["She ___ she was tired.", ["said", "told", "talked"], 0, "No person after → said.", "Senza persona → said."],
    ["Do you ___ English at home?", ["say", "tell", "speak"], 2, "Languages → speak.", "Lingue → speak."]
  ]
},
{
  id: "modals", cat: "verbs", lvl: "A2",
  t: "Can, must, have to, should", ti: "Can, must, have to, should",
  tags: "modals can could must mustn't have to don't have to should potere dovere devo dovresti vietato",
  rule: [
    "<b>can / can't</b> = ability, permission. <b>could</b> = past ability, or polite.",
    "<b>must</b> = strong rule or personal feeling. <b>mustn't</b> = it's not allowed.",
    "<b>have to</b> = obligation (from outside). <b>don't have to</b> = it's not necessary.",
    "<b>should</b> = advice. After modals: base verb — no “to”, no “-s”."
  ],
  ruleIt: "<b>mustn't</b> = è vietato; <b>don't have to</b> = non è necessario (significati molto diversi!). Dopo can/must/should il verbo va senza “to”. Al passato “ho dovuto” = <b>had to</b>.",
  ex: [
    ["Can you swim?", "Sai nuotare?"],
    ["You must wear a seatbelt.", "Devi allacciare la cintura."],
    ["You mustn't smoke here.", "Qui è vietato fumare."],
    ["You don't have to come if you're busy.", "Non sei obbligata a venire se hai da fare."],
    ["You should see a doctor.", "Dovresti andare dal medico."],
    ["I had to work on Sunday.", "Ho dovuto lavorare domenica."]
  ],
  mist: [
    ["I must to go.", "I must go.", "Dopo must niente “to”."],
    ["She cans swim.", "She can swim.", "Can non prende -s."],
    ["I musted wait.", "I had to wait.", "Passato: had to."]
  ],
  quiz: [
    ["You ___ pay now. You can pay next week.", ["mustn't", "don't have to", "can't"], 1, "Not necessary → don't have to.", "Non è necessario → don't have to."],
    ["You look tired. You ___ go to bed.", ["should", "must to", "have"], 0, "Advice → should.", "Consiglio → should."],
    ["Yesterday I ___ wait two hours.", ["must", "had to", "have to"], 1, "Past obligation → had to.", "Obbligo passato → had to."],
    ["You ___ park here. It's for ambulances.", ["mustn't", "don't have to", "shouldn't to"], 0, "Not allowed → mustn't.", "Vietato → mustn't."]
  ]
},
{
  id: "polite", cat: "verbs", lvl: "A2",
  t: "Being polite the British way", ti: "Essere cortesi all'inglese",
  tags: "polite requests could would mind please i'd like cortesia richieste vorrei potrebbe le dispiace",
  rule: [
    "In the UK, direct orders can sound rude. Make requests softer:",
    "<b>Could I have…? Could you…? Would you mind + -ing? Do you mind if I…? I'd like…</b>",
    "Use <b>please</b>, <b>thank you</b> and <b>sorry</b> a lot. “Sorry?” = I didn't hear you."
  ],
  ruleIt: "Gli inglesi sono molto indiretti. “Voglio un caffè” suona maleducato: meglio “Could I have a coffee, please?”. Would you mind + <b>-ing</b> (non “to”). “Sorry?” si usa per dire “Come, scusi?”.",
  ex: [
    ["Could I have a latte, please?", "Potrei avere un latte, per favore?"],
    ["Could you repeat that, please?", "Potrebbe ripetere, per favore?"],
    ["Would you mind speaking more slowly?", "Le dispiacerebbe parlare più lentamente?"],
    ["Do you mind if I open the window?", "Le dispiace se apro la finestra?"],
    ["I'd like to make an appointment.", "Vorrei prendere un appuntamento."]
  ],
  mist: [
    ["I want a coffee.", "Could I have a coffee, please?", "“I want” suona brusco."],
    ["Would you mind to help me?", "Would you mind helping me?", "Mind + -ing."],
    ["Give me the bill.", "Could we have the bill, please?", "Richiesta indiretta."]
  ],
  quiz: [
    ["___ I have the bill, please?", ["Could", "Would", "Do"], 0, "Could I have…?", "Could I have…?"],
    ["Would you mind ___ the door?", ["close", "to close", "closing"], 2, "mind + -ing.", "mind + -ing."],
    ["Which is the most polite?", ["Repeat!", "Could you say that again, please?", "Say again."], 1, "Could you…, please?", "Could you…, please?"]
  ]
},
{
  id: "gerund-inf", cat: "verbs", lvl: "B1",
  t: "Enjoy doing / want to do", ti: "Enjoy doing / want to do",
  tags: "gerund infinitive ing to enjoy want decide mind before after prima di dopo avere",
  rule: [
    "<b>+ -ing</b> after: enjoy, mind, finish, stop, avoid, suggest, keep, (can't) stand — and after <b>all prepositions</b> (before leaving, good at cooking, thank you for helping).",
    "<b>+ to</b> after: want, would like, need, decide, hope, plan, try, learn, forget, agree, promise.",
    "like / love / hate + -ing or to (both OK)."
  ],
  ruleIt: "Dopo una <b>preposizione</b> si usa sempre -ing: “prima di uscire” = before <b>leaving</b>; “grazie per avermi aiutata” = thank you for <b>helping</b> me. “Pensare di fare” = think <b>of/about doing</b>.",
  ex: [
    ["I enjoy walking by the river.", "Mi piace camminare lungo il fiume."],
    ["I want to improve my English.", "Voglio migliorare il mio inglese."],
    ["I'm thinking about changing jobs.", "Sto pensando di cambiare lavoro."],
    ["Don't forget to lock the door.", "Non dimenticare di chiudere la porta a chiave."],
    ["She stopped smoking last year.", "Ha smesso di fumare l'anno scorso."],
    ["Thank you for helping me.", "Grazie per avermi aiutata."]
  ],
  mist: [
    ["I enjoy to cook.", "I enjoy cooking.", "Enjoy + -ing."],
    ["I want improve.", "I want to improve.", "Want + to."],
    ["before to leave", "before leaving", "Preposizione + -ing."],
    ["I'm thinking to move.", "I'm thinking of moving.", "Think of/about + -ing."]
  ],
  quiz: [
    ["I've decided ___ an English course.", ["doing", "to do", "do"], 1, "decide + to.", "decide + to."],
    ["Do you mind ___ a few minutes?", ["waiting", "to wait", "wait"], 0, "mind + -ing.", "mind + -ing."],
    ["Thank you for ___ me.", ["help", "to help", "helping"], 2, "Preposition + -ing.", "Preposizione + -ing."]
  ]
},
{
  id: "phrasal", cat: "verbs", lvl: "B1",
  t: "Everyday phrasal verbs", ti: "Phrasal verbs di tutti i giorni",
  tags: "phrasal verbs fill in find out look for pick up run out of turn down hold on get on with sort out verbi frasali",
  rule: [
    "Verb + small word (up, out, on, off…) = a new meaning. They are everywhere in spoken British English.",
    "Learn them like new words: <b>fill in</b> (a form), <b>find out</b>, <b>pick up</b>, <b>run out of</b>, <b>hold on</b>, <b>sort out</b>, <b>get on with</b>.",
    "With <i>it / them</i> the small word goes after: <i>fill <b>it</b> in</i> (not “fill in it”)."
  ],
  ruleIt: "Sono difficili perché il significato cambia completamente. Imparali come vocaboli. Con i pronomi (it/them) la particella va alla fine: fill it in, pick them up.",
  ex: [
    ["Could you fill in this form, please?", "Può compilare questo modulo, per favore?"],
    ["I need to find out the opening times.", "Devo scoprire gli orari di apertura."],
    ["We've run out of milk.", "È finito il latte."],
    ["Can you pick me up at six?", "Mi vieni a prendere alle sei?"],
    ["Hold on a minute, please.", "Attenda un momento, per favore."],
    ["I get on well with my neighbours.", "Vado d'accordo con i miei vicini."]
  ],
  mist: [
    ["Fill in it.", "Fill it in.", "Pronome prima della particella."],
    ["We are finished the milk.", "We've run out of milk.", "Finire una scorta = run out of."]
  ],
  quiz: [
    ["Please ___ this form.", ["fill in", "fill on", "fill up with"], 0, "fill in a form = compilare.", "fill in = compilare."],
    ["We've ___ bread. Can you buy some?", ["run out of", "run off", "run over"], 0, "run out of = finire (una scorta).", "run out of = rimanere senza."],
    ["Could you ___ the TV? It's too loud.", ["turn up", "turn down", "turn off of"], 1, "turn down = abbassare.", "turn down = abbassare."]
  ]
},
{
  id: "question-tags", cat: "b1", lvl: "B1",
  t: "Question tags (…, isn't it?)", ti: "Question tags (…, vero?)",
  tags: "question tags isn't it aren't you don't you vero no small talk",
  rule: [
    "Short questions at the end, like “vero?” in Italian.",
    "Positive sentence → negative tag: <i>It's cold, <b>isn't it</b>?</i> Negative sentence → positive tag: <i>You aren't busy, <b>are you</b>?</i>",
    "Use the same auxiliary (be / do / have / can…). With other verbs use do/does/did: <i>You live here, <b>don't you</b>?</i>"
  ],
  ruleIt: "Si usano tantissimo nelle chiacchiere (soprattutto sul tempo!). Non si dice “no?” alla fine: si ripete l'ausiliare. Bella giornata, vero? = Lovely day, <b>isn't it</b>?",
  ex: [
    ["It's a lovely day, isn't it?", "Bella giornata, vero?"],
    ["You're Italian, aren't you?", "Sei italiana, vero?"],
    ["You didn't see my keys, did you?", "Non hai visto le mie chiavi, vero?"],
    ["She can drive, can't she?", "Lei sa guidare, vero?"],
    ["They live upstairs, don't they?", "Abitano al piano di sopra, vero?"]
  ],
  mist: [
    ["It's cold, no?", "It's cold, isn't it?", "Si ripete l'ausiliare."],
    ["You live here, isn't it?", "You live here, don't you?", "Live → do."]
  ],
  quiz: [
    ["It's freezing today, ___?", ["isn't it", "is it", "doesn't it"], 0, "Positive → negative tag.", "Positiva → tag negativo."],
    ["You've been to Bath, ___?", ["haven't you", "didn't you", "aren't you"], 0, "have → haven't.", "have → haven't."],
    ["He doesn't eat fish, ___?", ["doesn't he", "does he", "is he"], 1, "Negative → positive tag.", "Negativa → tag positivo."]
  ]
},
{
  id: "relative", cat: "b1", lvl: "B1",
  t: "Who, which, that, where, whose", ti: "Who, which, that, where, whose (che, dove, il cui)",
  tags: "relative clauses who which that where whose che il quale dove il cui pronomi relativi",
  rule: [
    "<b>who</b> = people, <b>which</b> = things, <b>that</b> = people or things (informal).",
    "<b>where</b> = places, <b>whose</b> = possession.",
    "You can leave out who/which/that when it's the object: <i>The book (that) you gave me.</i>"
  ],
  ruleIt: "“Che” si traduce con <b>who</b> (persone) o <b>which/that</b> (cose). “Dove” = where; “il cui / la cui” = whose.",
  ex: [
    ["The woman who lives next door is a nurse.", "La donna che abita accanto è infermiera."],
    ["This is the bus which goes to the hospital.", "Questo è l'autobus che va all'ospedale."],
    ["That's the shop where I bought my coat.", "Quello è il negozio dove ho comprato il cappotto."],
    ["The book you gave me is great.", "Il libro che mi hai regalato è bellissimo."],
    ["He's the man whose dog barks all night.", "È l'uomo il cui cane abbaia tutta la notte."]
  ],
  mist: [
    ["The man which lives here", "The man who lives here", "Persone → who."],
    ["The town that I was born", "The town where I was born", "Luogo → where."]
  ],
  quiz: [
    ["The doctor ___ I saw was very kind.", ["which", "who", "where"], 1, "People → who.", "Persone → who."],
    ["This is the café ___ we first met.", ["which", "where", "who"], 1, "Place → where.", "Luogo → where."],
    ["Is this the bag ___ you lost?", ["that", "who", "where"], 0, "Things → that / which.", "Cose → that/which."]
  ]
},
{
  id: "passive", cat: "b1", lvl: "B1",
  t: "The passive (it was built, it is made)", ti: "Il passivo (è stato costruito, si fa)",
  tags: "passive voice be past participle was built is made si dice si parla passivo",
  rule: [
    "<b>be + past participle</b> when the action is more important than who does it.",
    "Present: <i>is made</i>. Past: <i>was built</i>. Present perfect: <i>has been sent</i>. Future: <i>will be delivered</i>.",
    "Very common in signs, letters and news. Who did it: <b>by</b>…"
  ],
  ruleIt: "“Qui si parla inglese” = English <b>is spoken</b> here. “Mi hanno rubato la macchina” = My car <b>was stolen</b>. Lettere e avvisi ufficiali nel Regno Unito usano molto il passivo.",
  ex: [
    ["English is spoken here.", "Qui si parla inglese."],
    ["My car was stolen last night.", "Ieri notte mi hanno rubato la macchina."],
    ["Your parcel has been delivered.", "Il suo pacco è stato consegnato."],
    ["The bins are collected on Thursdays.", "I bidoni vengono svuotati il giovedì."],
    ["This house was built in 1890.", "Questa casa è stata costruita nel 1890."]
  ],
  mist: [
    ["My bag was stole.", "My bag was stolen.", "Serve il participio (stolen)."],
    ["The letter has sent.", "The letter has been sent.", "Has been + participio."]
  ],
  quiz: [
    ["The shop ___ in 1990.", ["opened was", "was opened", "has opening"], 1, "was + past participle.", "was + participio."],
    ["Your prescription ___ ready tomorrow.", ["will be", "will been", "is be"], 0, "Future → will be.", "Futuro → will be."],
    ["Our flat ___ last year.", ["painted", "was painted", "was paint"], 1, "was + past participle.", "was + participio."]
  ]
},
{
  id: "reported", cat: "b1", lvl: "B1",
  t: "Reported speech (she said that…)", ti: "Discorso indiretto (ha detto che…)",
  tags: "reported speech said told asked ha detto che mi ha chiesto discorso indiretto",
  rule: [
    "<b>said (that)…</b> / <b>told me (that)…</b> — the tense often moves back: <i>“I'm tired.” → She said she <b>was</b> tired.</i>",
    "will → <b>would</b>; can → <b>could</b>; present perfect → had + participle.",
    "Questions: normal word order: <i>He asked me where I <b>lived</b>.</i> Requests: <i>She asked me <b>to wait</b>.</i>"
  ],
  ruleIt: "Come in italiano, il tempo spesso “va indietro”. Nelle domande riferite non c'è inversione: “Mi ha chiesto dove abitavo” = He asked me where I lived. “Mi ha chiesto di aspettare” = She asked me <b>to</b> wait.",
  ex: [
    ["She said she was tired.", "Ha detto che era stanca."],
    ["He told me he would call back.", "Mi ha detto che avrebbe richiamato."],
    ["The doctor asked me how I felt.", "Il medico mi ha chiesto come stavo."],
    ["They asked me to wait.", "Mi hanno chiesto di aspettare."]
  ],
  mist: [
    ["He asked me where did I live.", "He asked me where I lived.", "Domanda riferita: niente inversione."],
    ["She said me…", "She told me… / She said to me…", "Tell + persona."],
    ["He said he will come.", "He said he would come.", "Will → would."]
  ],
  quiz: [
    ["“I'm hungry.” → She said she ___ hungry.", ["is", "was", "has"], 1, "is → was.", "is → was."],
    ["He asked me what time ___.", ["was it", "it was", "is it"], 1, "Normal order: it was.", "Ordine normale: it was."],
    ["The receptionist told me ___ a seat.", ["take", "to take", "taking"], 1, "tell someone + to.", "tell qualcuno + to."]
  ]
}
];
