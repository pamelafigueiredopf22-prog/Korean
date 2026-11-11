/* Real-life UK situations. dialogue line: [speaker, English, Italiano]. Speaker "Y" = you (role-play). */
window.D = window.D || {};
D.life = [
{
  id: "gp", icon: "🩺", lvl: "A2", t: "Booking a GP appointment", ti: "Prenotare dal medico di base",
  tip: "Most surgeries open their phone lines at 8am — call early. The receptionist will ask why you need to see the doctor. For urgent advice that isn't an emergency, call <b>NHS 111</b>. For emergencies, <b>999</b>.",
  tipIt: "Quasi tutti gli ambulatori aprono le linee alle 8: chiama presto. La receptionist ti chiederà il motivo della visita. Per consigli urgenti (non emergenze) chiama il <b>111</b>; per le emergenze il <b>999</b>.",
  phrases: [
    ["I'd like to make an appointment with a doctor, please.", "Vorrei prendere un appuntamento con un medico, per favore."],
    ["I've had a sore throat for a week.", "Ho mal di gola da una settimana."],
    ["It's quite urgent.", "È abbastanza urgente."],
    ["Is there anything earlier?", "C'è qualcosa prima?"],
    ["Could I have a telephone appointment?", "Potrei avere un appuntamento telefonico?"],
    ["My date of birth is the third of May, 1970.", "Sono nata il 3 maggio 1970."],
    ["Could you spell that, please?", "Può fare lo spelling, per favore?"],
    ["I'm registered at this surgery.", "Sono iscritta a questo ambulatorio."]
  ],
  who: { A: "Receptionist", Y: "You" },
  dlg: [
    ["A", "Good morning, Riverside Surgery. How can I help?", "Buongiorno, ambulatorio Riverside. Come posso aiutarla?"],
    ["Y", "Hello, I'd like to make an appointment with a doctor, please.", "Salve, vorrei prendere un appuntamento con un medico, per favore."],
    ["A", "Of course. Can I have your name and date of birth?", "Certo. Mi dice nome e data di nascita?"],
    ["Y", "It's Maria Rossi. My date of birth is the twelfth of March, 1968.", "Maria Rossi. Sono nata il 12 marzo 1968."],
    ["A", "Thank you. And what's the problem?", "Grazie. E qual è il problema?"],
    ["Y", "I've had a bad cough for about two weeks.", "Ho una brutta tosse da circa due settimane."],
    ["A", "I see. The first appointment is on Thursday at twenty past ten.", "Capisco. Il primo appuntamento è giovedì alle dieci e venti."],
    ["Y", "Is there anything earlier? I'm working on Thursday.", "C'è qualcosa prima? Giovedì lavoro."],
    ["A", "We've got a phone appointment tomorrow morning. The doctor will call you between nine and eleven.", "Abbiamo un appuntamento telefonico domattina. Il medico la chiamerà tra le nove e le undici."],
    ["Y", "That's perfect, thank you.", "Perfetto, grazie."]
  ]
},
{
  id: "pharmacy", icon: "💊", lvl: "A2", t: "At the pharmacy", ti: "In farmacia",
  tip: "Pharmacists can give advice and treatment for many minor problems without a GP appointment. In England you usually pay a fixed charge for prescriptions (free if you're 60+ or have an exemption); they're free in Scotland and Wales.",
  tipIt: "Il farmacista può consigliarti e curare molti disturbi lievi senza passare dal medico. In Inghilterra le ricette hanno un costo fisso (gratis dai 60 anni o con esenzione); in Scozia e Galles sono gratuite.",
  phrases: [
    ["Can you recommend something for a cold?", "Mi può consigliare qualcosa per il raffreddore?"],
    ["I've come to pick up a prescription.", "Sono venuta a ritirare una ricetta."],
    ["Is it OK to take this with ibuprofen?", "Si può prendere insieme all'ibuprofene?"],
    ["How many times a day should I take it?", "Quante volte al giorno devo prenderlo?"],
    ["Does it make you drowsy?", "Fa venire sonno?"],
    ["Have you got it in tablets?", "Ce l'ha in compresse?"],
    ["I'm allergic to penicillin.", "Sono allergica alla penicillina."]
  ],
  who: { A: "Pharmacist", Y: "You" },
  dlg: [
    ["A", "Hi there, can I help?", "Salve, posso aiutarla?"],
    ["Y", "Yes, please. Can you recommend something for a sore throat?", "Sì, grazie. Mi può consigliare qualcosa per il mal di gola?"],
    ["A", "Sure. Are you taking any other medication?", "Certo. Prende altri farmaci?"],
    ["Y", "No, just paracetamol sometimes.", "No, solo paracetamolo ogni tanto."],
    ["A", "OK. These lozenges are good. Take one every three hours.", "Va bene. Queste pastiglie sono buone. Ne prenda una ogni tre ore."],
    ["Y", "Do they make you drowsy?", "Fanno venire sonno?"],
    ["A", "No, they don't. That's four pounds fifty, please.", "No. Sono 4 sterline e 50, per favore."],
    ["Y", "Can I pay by card?", "Posso pagare con la carta?"],
    ["A", "Of course. Contactless is fine.", "Certo. Va bene contactless."]
  ]
},
{
  id: "bank", icon: "🏦", lvl: "B1", t: "Calling the bank: lost card", ti: "Chiamare la banca: carta persa",
  tip: "You can usually freeze your card in your banking app straight away. Remember: your bank will <b>never</b> ask for your full PIN or password on the phone, or ask you to move money to a “safe account” — that's a scam.",
  tipIt: "Di solito puoi bloccare subito la carta dall'app della banca. Ricorda: la banca non ti chiederà <b>mai</b> il PIN completo o la password al telefono, né di spostare soldi su un “conto sicuro”: è una truffa.",
  phrases: [
    ["I've lost my bank card.", "Ho perso la carta della banca."],
    ["Could you cancel it, please?", "Può bloccarla, per favore?"],
    ["I don't recognise this payment.", "Non riconosco questo pagamento."],
    ["I think someone has used my card.", "Penso che qualcuno abbia usato la mia carta."],
    ["How long will the new card take to arrive?", "Quanto ci mette ad arrivare la nuova carta?"],
    ["I'd like to set up a direct debit.", "Vorrei attivare un addebito diretto."],
    ["Could you speak a bit more slowly, please?", "Potrebbe parlare un po' più lentamente, per favore?"]
  ],
  who: { A: "Bank adviser", Y: "You" },
  dlg: [
    ["A", "Thank you for calling. You're speaking to James. How can I help?", "Grazie per aver chiamato. Sono James. Come posso aiutarla?"],
    ["Y", "Hello. I've lost my debit card and I'd like to cancel it.", "Salve. Ho perso la carta di debito e vorrei bloccarla."],
    ["A", "I'm sorry to hear that. Can I take your full name and postcode?", "Mi dispiace. Mi dà nome completo e codice postale?"],
    ["Y", "Yes, it's Maria Rossi, and my postcode is M14 5RT.", "Sì, Maria Rossi, e il codice postale è M14 5RT."],
    ["A", "Thank you. When did you last use the card?", "Grazie. Quando ha usato la carta l'ultima volta?"],
    ["Y", "Yesterday afternoon, at the supermarket.", "Ieri pomeriggio, al supermercato."],
    ["A", "OK, I've cancelled it. A new card will arrive in three to five working days.", "Ok, l'ho bloccata. Una nuova carta arriverà in tre-cinque giorni lavorativi."],
    ["Y", "Great. Can I still use the app?", "Perfetto. Posso ancora usare l'app?"],
    ["A", "Yes, you can still log in and check your account.", "Sì, può ancora accedere e controllare il conto."],
    ["Y", "Thank you for your help.", "Grazie per l'aiuto."]
  ]
},
{
  id: "phone", icon: "📞", lvl: "B1", t: "Phoning about a bill", ti: "Telefonare per una bolletta",
  tip: "Phone menus say “Press 1 for…”. Have your account number ready. If they speak too fast, it's completely normal to say “Sorry, could you say that more slowly?” — British people say sorry all the time!",
  tipIt: "I menu telefonici dicono “Press 1 for…” (prema 1 per…). Tieni pronto il numero di conto. Se parlano troppo veloce, è normalissimo chiedere di rallentare: gli inglesi dicono “sorry” in continuazione!",
  phrases: [
    ["I'm calling about my last bill.", "Chiamo per la mia ultima bolletta."],
    ["I think there's a mistake on my bill.", "Penso che ci sia un errore nella bolletta."],
    ["My account number is…", "Il mio numero di conto è…"],
    ["Sorry, could you say that again, a bit more slowly?", "Scusi, può ripetere un po' più lentamente?"],
    ["Sorry, the line is bad.", "Scusi, la linea è disturbata."],
    ["Could you send me that by email?", "Me lo può mandare per email?"],
    ["I'll hold.", "Resto in linea."],
    ["Could I speak to a manager, please?", "Potrei parlare con un responsabile, per favore?"]
  ],
  who: { A: "Customer service", Y: "You" },
  dlg: [
    ["A", "Hello, you're through to Customer Services. My name's Priya.", "Salve, ha chiamato il servizio clienti. Mi chiamo Priya."],
    ["Y", "Hi Priya. I'm calling about my electricity bill. I think it's wrong.", "Ciao Priya. Chiamo per la bolletta della luce. Penso che sia sbagliata."],
    ["A", "Let me have a look. Can you give me your account number?", "Controllo. Mi dà il suo numero di conto?"],
    ["Y", "Yes, it's 4 7 2 9 1 0 5.", "Sì, è 4 7 2 9 1 0 5."],
    ["A", "Thanks. I can see the bill is an estimate. Could you give me a meter reading?", "Grazie. Vedo che la bolletta è una stima. Mi può dare la lettura del contatore?"],
    ["Y", "Sorry, could you say that again, a bit more slowly?", "Scusi, può ripetere un po' più lentamente?"],
    ["A", "Of course. We need the numbers on your electricity meter.", "Certo. Ci servono i numeri sul suo contatore della luce."],
    ["Y", "Ah, OK. Hold on, I'll check. It's 0 3 4 5 6.", "Ah, ok. Un attimo, controllo. È 0 3 4 5 6."],
    ["A", "Perfect. I'll send you a new bill by email.", "Perfetto. Le mando una nuova bolletta per email."],
    ["Y", "Thank you, that's very helpful.", "Grazie, è stata molto gentile."]
  ]
},
{
  id: "shop", icon: "🛍️", lvl: "A2", t: "Returning something to a shop", ti: "Restituire un articolo",
  tip: "Keep your receipt! Most shops accept returns within 28 days. If something is faulty, you have a legal right to a refund. “Hiya, are you alright there?” from a shop assistant just means “Can I help you?”.",
  tipIt: "Conserva lo scontrino! Molti negozi accettano resi entro 28 giorni. Se un prodotto è difettoso hai diritto per legge al rimborso. “Are you alright there?” detto dal commesso significa “Posso aiutarla?”.",
  phrases: [
    ["I'd like to return this, please.", "Vorrei restituire questo, per favore."],
    ["It doesn't fit.", "Non mi va bene (di taglia)."],
    ["It's faulty. / It's broken.", "È difettoso. / È rotto."],
    ["Could I exchange it for a bigger size?", "Potrei cambiarlo con una taglia più grande?"],
    ["Can I have a refund?", "Posso avere un rimborso?"],
    ["I've got the receipt.", "Ho lo scontrino."],
    ["Have you got this in a medium?", "Ce l'ha in taglia media?"],
    ["Where are the fitting rooms?", "Dove sono i camerini?"]
  ],
  who: { A: "Shop assistant", Y: "You" },
  dlg: [
    ["A", "Hiya, are you alright there?", "Salve, posso aiutarla?"],
    ["Y", "Yes, thanks. I'd like to return this jumper, please.", "Sì, grazie. Vorrei restituire questo maglione."],
    ["A", "No problem. Is there anything wrong with it?", "Nessun problema. C'è qualcosa che non va?"],
    ["Y", "It's too small. Have you got it in a large?", "È troppo piccolo. Ce l'ha in taglia L?"],
    ["A", "Let me check. Sorry, we've only got it in blue.", "Controllo. Mi dispiace, ce l'abbiamo solo in blu."],
    ["Y", "Oh, never mind. Can I have a refund, then?", "Ah, fa niente. Allora posso avere un rimborso?"],
    ["A", "Sure. Have you got the receipt?", "Certo. Ha lo scontrino?"],
    ["Y", "Yes, here you are.", "Sì, ecco."],
    ["A", "Lovely. The money will go back on your card.", "Perfetto. I soldi torneranno sulla sua carta."]
  ]
},
{
  id: "cafe", icon: "☕", lvl: "A2", t: "At a café", ti: "Al bar / caffè",
  tip: "In most cafés and all pubs you order and pay at the counter or bar. You'll hear “Eat in or take away?”. Tap water is free — just ask. A “flat white” is close to an Italian cappuccino with less foam.",
  tipIt: "Nei caffè e nei pub di solito ordini e paghi al bancone. Ti chiederanno “Eat in or take away?” (qui o da portare via?). L'acqua del rubinetto è gratis: basta chiederla.",
  phrases: [
    ["Could I have a cappuccino, please?", "Potrei avere un cappuccino, per favore?"],
    ["Eat in, please. / Take away, please.", "Qui, per favore. / Da portare via, per favore."],
    ["Could I have it with oat milk?", "Potrei averlo con latte d'avena?"],
    ["Is this seat free?", "È libero questo posto?"],
    ["Just a glass of tap water, please.", "Solo un bicchiere d'acqua del rubinetto, per favore."],
    ["Could we have the bill, please?", "Potremmo avere il conto, per favore?"],
    ["Do you take cards?", "Accettate carte?"]
  ],
  who: { A: "Barista", Y: "You" },
  dlg: [
    ["A", "Hi, what can I get you?", "Ciao, cosa ti preparo?"],
    ["Y", "Could I have a flat white and a slice of carrot cake, please?", "Potrei avere un flat white e una fetta di torta di carote, per favore?"],
    ["A", "Sure. Eat in or take away?", "Certo. Qui o da portare via?"],
    ["Y", "Eat in, please.", "Qui, per favore."],
    ["A", "Anything else?", "Altro?"],
    ["Y", "No, that's all, thanks.", "No, è tutto, grazie."],
    ["A", "That's seven pounds twenty, please.", "Sono 7 sterline e 20, per favore."],
    ["Y", "Here you go.", "Ecco a lei."],
    ["A", "Thanks. I'll bring it over to you.", "Grazie. Te lo porto al tavolo."],
    ["Y", "Cheers!", "Grazie!"]
  ]
},
{
  id: "neighbours", icon: "🏡", lvl: "A2", t: "Small talk with a neighbour", ti: "Chiacchiere con un vicino",
  tip: "The weather is the safest topic in the UK! “You alright?” just means hello — answer briefly (“Yeah, not bad, thanks. You?”) and ask back. To end a chat politely: “Anyway, I'd better get going.”",
  tipIt: "Il tempo è l'argomento più sicuro nel Regno Unito! “You alright?” significa solo “ciao” — rispondi brevemente e ricambia la domanda. Per chiudere con gentilezza: “Anyway, I'd better get going.”",
  phrases: [
    ["Lovely day, isn't it?", "Bella giornata, vero?"],
    ["It's freezing this morning!", "Si gela stamattina!"],
    ["Did you have a nice weekend?", "Hai passato un bel fine settimana?"],
    ["Not bad, thanks. And you?", "Non c'è male, grazie. E tu?"],
    ["Are you up to anything nice?", "Hai in programma qualcosa di bello?"],
    ["Let me know if you need anything.", "Fammi sapere se ti serve qualcosa."],
    ["Anyway, I'd better get going.", "Comunque, devo proprio andare."]
  ],
  who: { A: "Neighbour", Y: "You" },
  dlg: [
    ["A", "Morning! You alright?", "Buongiorno! Tutto bene?"],
    ["Y", "Morning! Yes, not bad, thanks. And you?", "Buongiorno! Sì, non c'è male, grazie. E tu?"],
    ["A", "Oh, can't complain. Cold today, isn't it?", "Oh, non mi lamento. Fa freddo oggi, vero?"],
    ["Y", "Yes, it's freezing! But at least it's sunny.", "Sì, si gela! Ma almeno c'è il sole."],
    ["A", "True. Did you have a nice weekend?", "Vero. Hai passato un bel weekend?"],
    ["Y", "Yes, lovely, thanks. My daughter came to visit.", "Sì, bellissimo, grazie. È venuta a trovarmi mia figlia."],
    ["A", "Oh, that's nice. Anyway, I'd better get going.", "Che bello. Comunque, devo andare."],
    ["Y", "Me too. See you later!", "Anch'io. Ci vediamo!"],
    ["A", "See you!", "Ciao!"]
  ]
},
{
  id: "work", icon: "💼", lvl: "B1", t: "Asking your manager for a day off", ti: "Chiedere un giorno libero",
  tip: "British people make requests very softly: “I was wondering if…”, “Would it be possible to…?”. It's normal to follow up in writing (an email) for annual leave.",
  tipIt: "Gli inglesi fanno le richieste in modo molto morbido: “I was wondering if…” (mi chiedevo se…), “Would it be possible to…?”. Per le ferie è normale confermare per email.",
  phrases: [
    ["Have you got a minute?", "Hai un minuto?"],
    ["I was wondering if I could have Friday off.", "Mi chiedevo se potessi avere venerdì libero."],
    ["Could I swap shifts with someone?", "Potrei scambiare il turno con qualcuno?"],
    ["I'm afraid I'm not feeling well today.", "Purtroppo oggi non mi sento bene."],
    ["I'll be about ten minutes late.", "Arriverò con circa dieci minuti di ritardo."],
    ["Sorry, I didn't catch that.", "Scusa, non ho capito bene."],
    ["Could you show me how to do this?", "Mi puoi mostrare come si fa?"],
    ["Is it OK if I leave early today?", "Va bene se oggi esco prima?"]
  ],
  who: { A: "Manager", Y: "You" },
  dlg: [
    ["Y", "Hi Sarah, have you got a minute?", "Ciao Sarah, hai un minuto?"],
    ["A", "Sure, what's up?", "Certo, cosa c'è?"],
    ["Y", "I was wondering if I could have next Friday off. It's my nephew's wedding.", "Mi chiedevo se potessi avere libero venerdì prossimo. C'è il matrimonio di mio nipote."],
    ["A", "Oh, lovely! Let me check the rota.", "Che bello! Fammi controllare i turni."],
    ["Y", "I can swap shifts with Tom, if that helps.", "Posso scambiare il turno con Tom, se aiuta."],
    ["A", "That would be great. Can you send me an email about it?", "Sarebbe perfetto. Mi mandi un'email?"],
    ["Y", "Of course. I'll do it today.", "Certo. Lo faccio oggi."],
    ["A", "Thanks. That should be fine.", "Grazie. Dovrebbe andare bene."],
    ["Y", "Brilliant, thank you so much.", "Fantastico, grazie mille."]
  ]
},
{
  id: "train", icon: "🚆", lvl: "A2", t: "Buying a train ticket", ti: "Comprare un biglietto del treno",
  tip: "Buy your ticket before you get on, or you might pay a penalty. Off-peak tickets (usually after 9:30am) are much cheaper. A railcard saves you a third on most fares.",
  tipIt: "Compra il biglietto prima di salire, altrimenti rischi una multa. I biglietti off-peak (di solito dopo le 9:30) costano molto meno. Una railcard ti fa risparmiare un terzo su quasi tutte le tariffe.",
  phrases: [
    ["A return to Manchester, please.", "Un'andata e ritorno per Manchester, per favore."],
    ["Is it an off-peak ticket?", "È un biglietto off-peak?"],
    ["Which platform does it leave from?", "Da che binario parte?"],
    ["Do I need to change?", "Devo cambiare?"],
    ["Is this the train to York?", "È questo il treno per York?"],
    ["What time is the next train?", "A che ora è il prossimo treno?"],
    ["Excuse me, is this seat taken?", "Mi scusi, è occupato questo posto?"]
  ],
  who: { A: "Ticket office", Y: "You" },
  dlg: [
    ["Y", "Hello, could I have an off-peak return to Leeds, please?", "Salve, potrei avere un'andata e ritorno off-peak per Leeds, per favore?"],
    ["A", "Are you coming back today?", "Torna oggi?"],
    ["Y", "No, on Sunday.", "No, domenica."],
    ["A", "OK. Have you got a railcard?", "Ok. Ha una railcard?"],
    ["Y", "Yes, here it is.", "Sì, eccola."],
    ["A", "That's twenty-four pounds sixty, please.", "Sono 24 sterline e 60, per favore."],
    ["Y", "Which platform does it leave from?", "Da che binario parte?"],
    ["A", "Platform four. The next one is at quarter past ten, but it's running five minutes late.", "Binario quattro. Il prossimo è alle dieci e un quarto, ma ha cinque minuti di ritardo."],
    ["Y", "Do I need to change?", "Devo cambiare?"],
    ["A", "No, it's direct.", "No, è diretto."]
  ]
},
{
  id: "landlord", icon: "🔧", lvl: "B1", t: "Reporting a problem to your landlord", ti: "Segnalare un guasto al padrone di casa",
  tip: "Report repairs in writing too (text or email) and take photos. Landlords must fix heating and hot water within a reasonable time. If you're renting through an agency, contact the agent.",
  tipIt: "Segnala i guasti anche per iscritto (messaggio o email) e fai delle foto. Il padrone di casa deve riparare riscaldamento e acqua calda in tempi ragionevoli. Se l'affitto è tramite agenzia, contatta l'agenzia.",
  phrases: [
    ["The boiler isn't working.", "La caldaia non funziona."],
    ["There's a leak in the bathroom.", "C'è una perdita in bagno."],
    ["There's some mould on the bedroom wall.", "C'è della muffa sul muro della camera."],
    ["When can someone come and fix it?", "Quando può venire qualcuno a ripararlo?"],
    ["I'll be in all day on Tuesday.", "Martedì sarò a casa tutto il giorno."],
    ["It's been like this for a week.", "È così da una settimana."],
    ["I've sent you some photos.", "Ti ho mandato delle foto."]
  ],
  who: { A: "Landlord", Y: "You" },
  dlg: [
    ["Y", "Hi Mark, it's Maria from flat 3.", "Ciao Mark, sono Maria dell'appartamento 3."],
    ["A", "Hi Maria. Is everything OK?", "Ciao Maria. Tutto bene?"],
    ["Y", "Not really. The boiler stopped working last night, so there's no hot water.", "Non proprio. La caldaia ha smesso di funzionare ieri sera, quindi non c'è acqua calda."],
    ["A", "Oh no. Have you tried resetting it?", "Oh no. Hai provato a resettarla?"],
    ["Y", "Yes, I have, but it still doesn't work.", "Sì, ma continua a non funzionare."],
    ["A", "OK, I'll call the plumber. Will you be in tomorrow morning?", "Ok, chiamo l'idraulico. Domattina sei a casa?"],
    ["Y", "I'll be in until twelve. After that I'm at work.", "Sono a casa fino a mezzogiorno. Dopo sono al lavoro."],
    ["A", "Fine. I'll text you when I know the time.", "Va bene. Ti mando un messaggio quando so l'orario."],
    ["Y", "Thanks. I've sent you a photo of the error message.", "Grazie. Ti ho mandato una foto del messaggio di errore."]
  ]
},
{
  id: "invite", icon: "🍝", lvl: "A2", t: "Inviting a friend round", ti: "Invitare un'amica a casa",
  tip: "“Come round” = come to my house. If someone invites you to dinner, it's polite to ask “Can I bring anything?” and to bring a small gift (wine, flowers, chocolates). Times are often said like “half seven” (7:30).",
  tipIt: "“Come round” = vieni da me. Se ti invitano a cena, è gentile chiedere “Can I bring anything?” e portare un piccolo regalo. Gli orari si dicono spesso così: “half seven” = le sette e mezza.",
  phrases: [
    ["Are you free on Saturday?", "Sei libera sabato?"],
    ["Would you like to come round for dinner?", "Ti va di venire a cena da me?"],
    ["What time suits you?", "Che ora ti va bene?"],
    ["Shall we meet at the station?", "Ci vediamo alla stazione?"],
    ["I'm afraid I can't make it.", "Purtroppo non riesco a venire."],
    ["How about next week instead?", "Che ne dici della settimana prossima invece?"],
    ["Can I bring anything?", "Porto qualcosa?"],
    ["Looking forward to it!", "Non vedo l'ora!"]
  ],
  who: { A: "Linda", Y: "You" },
  dlg: [
    ["Y", "Hi Linda! Are you free on Saturday evening?", "Ciao Linda! Sei libera sabato sera?"],
    ["A", "I think so. Why?", "Credo di sì. Perché?"],
    ["Y", "Would you like to come round for dinner? I'm making lasagne.", "Ti va di venire a cena da me? Faccio le lasagne."],
    ["A", "Oh, I'd love to! What time?", "Oh, molto volentieri! A che ora?"],
    ["Y", "How about half seven?", "Che ne dici delle sette e mezza?"],
    ["A", "Perfect. Can I bring anything?", "Perfetto. Porto qualcosa?"],
    ["Y", "Maybe some dessert, if you like.", "Magari un dolce, se ti va."],
    ["A", "Great, I'll bring a cheesecake. Looking forward to it!", "Ottimo, porto una cheesecake. Non vedo l'ora!"],
    ["Y", "Me too. See you on Saturday!", "Anch'io. Ci vediamo sabato!"]
  ]
},
{
  id: "emergency", icon: "🚑", lvl: "B1", t: "Calling 999 in an emergency", ti: "Chiamare il 999 in un'emergenza",
  tip: "<b>999</b> (or 112) = police, ambulance, fire. <b>111</b> = NHS urgent medical advice. <b>101</b> = police, not an emergency. Say the service you need, then the address first — slowly and clearly. Stay on the line.",
  tipIt: "<b>999</b> (o 112) = polizia, ambulanza, vigili del fuoco. <b>111</b> = consigli medici urgenti. <b>101</b> = polizia per casi non urgenti. Dì quale servizio ti serve e poi subito l'indirizzo, lentamente. Resta in linea.",
  phrases: [
    ["I need an ambulance.", "Mi serve un'ambulanza."],
    ["The address is 14 Hill Street, Leeds.", "L'indirizzo è 14 Hill Street, Leeds."],
    ["My neighbour has fallen down the stairs.", "Il mio vicino è caduto dalle scale."],
    ["He's breathing, but he's not responding.", "Respira, ma non risponde."],
    ["There's a fire in the kitchen.", "C'è un incendio in cucina."],
    ["Someone has broken into my house.", "Qualcuno è entrato in casa mia (ladri)."],
    ["Please hurry.", "Per favore, fate presto."]
  ],
  who: { A: "Operator", B: "Ambulance", Y: "You" },
  dlg: [
    ["A", "Emergency. Which service do you need?", "Emergenza. Quale servizio le serve?"],
    ["Y", "Ambulance, please.", "Ambulanza, per favore."],
    ["B", "Ambulance service. What's the address of the emergency?", "Servizio ambulanze. Qual è l'indirizzo dell'emergenza?"],
    ["Y", "14 Hill Street, Leeds. The postcode is LS6 2AB.", "14 Hill Street, Leeds. Il codice postale è LS6 2AB."],
    ["B", "Tell me exactly what happened.", "Mi dica esattamente cos'è successo."],
    ["Y", "My neighbour fell down the stairs. He's hurt his head.", "Il mio vicino è caduto dalle scale. Ha battuto la testa."],
    ["B", "Is he awake and breathing?", "È sveglio e respira?"],
    ["Y", "Yes, he's awake, but he's very confused.", "Sì, è sveglio, ma è molto confuso."],
    ["B", "OK. Help is on the way. Don't move him, and stay with him.", "Va bene. I soccorsi stanno arrivando. Non lo muova e resti con lui."],
    ["Y", "OK. Thank you.", "Va bene. Grazie."]
  ]
}
];
