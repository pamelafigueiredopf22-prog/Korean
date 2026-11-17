"""Book 10 vocabulary: (Italian theme title, English theme title, icon, [(italiano, english), ...]).
Italian nouns carry their article; the grid hides the word without the article and
without accents. PLEASE REVIEW: every Italian spelling here is listed in
listings/book10-italian-vocabulary-review.md for checking."""

THEMES = [
    ("Gli animali domestici", "Pets", "puppy", [
        ("il cane", "dog"), ("il gatto", "cat"), ("il pesce", "fish"), ("il coniglio", "rabbit"),
        ("il criceto", "hamster"), ("il pappagallo", "parrot"), ("la tartaruga", "turtle"),
        ("il cucciolo", "puppy"), ("il gattino", "kitten"), ("il topo", "mouse")]),
    ("La fattoria", "The farm", "house", [
        ("la mucca", "cow"), ("il maiale", "pig"), ("il cavallo", "horse"), ("la pecora", "sheep"),
        ("la capra", "goat"), ("l'anatra", "duck"), ("la gallina", "hen"), ("il gallo", "rooster"),
        ("l'asino", "donkey"), ("l'agnello", "lamb")]),
    ("Gli animali selvatici", "Wild animals", "bunny", [
        ("il leone", "lion"), ("la tigre", "tiger"), ("l'elefante", "elephant"), ("la giraffa", "giraffe"),
        ("la zebra", "zebra"), ("la scimmia", "monkey"), ("l'orso", "bear"), ("il lupo", "wolf"),
        ("la volpe", "fox"), ("il serpente", "snake")]),
    ("Gli insetti", "Bugs", "bee", [
        ("l'ape", "bee"), ("la formica", "ant"), ("la farfalla", "butterfly"), ("la coccinella", "ladybug"),
        ("il ragno", "spider"), ("la mosca", "fly"), ("la zanzara", "mosquito"), ("il grillo", "cricket"),
        ("la lumaca", "snail"), ("il bruco", "caterpillar")]),
    ("Gli animali del mare", "Sea animals", "fish", [
        ("la balena", "whale"), ("lo squalo", "shark"), ("il delfino", "dolphin"), ("il polpo", "octopus"),
        ("il granchio", "crab"), ("la medusa", "jellyfish"), ("la foca", "seal"), ("la conchiglia", "shell"),
        ("l'aragosta", "lobster"), ("l'alga", "seaweed")]),
    ("Gli uccelli", "Birds", "bird", [
        ("l'uccello", "bird"), ("l'aquila", "eagle"), ("il gufo", "owl"), ("il pinguino", "penguin"),
        ("il cigno", "swan"), ("il passero", "sparrow"), ("il corvo", "crow"), ("il pettirosso", "robin"),
        ("la colomba", "dove"), ("il fenicottero", "flamingo")]),
    ("La frutta", "Fruit", "cheese", [
        ("la mela", "apple"), ("la banana", "banana"), ("l'arancia", "orange"), ("l'uva", "grapes"),
        ("la fragola", "strawberry"), ("la pera", "pear"), ("la ciliegia", "cherry"), ("la pesca", "peach"),
        ("il limone", "lemon"), ("l'anguria", "watermelon")]),
    ("La verdura", "Vegetables", "carrot", [
        ("la carota", "carrot"), ("il pomodoro", "tomato"), ("la patata", "potato"), ("la cipolla", "onion"),
        ("l'insalata", "lettuce"), ("il peperone", "pepper"), ("i piselli", "peas"), ("il cavolo", "cabbage"),
        ("il mais", "corn"), ("la zucchina", "zucchini")]),
    ("La colazione", "Breakfast", "sun", [
        ("il latte", "milk"), ("il pane", "bread"), ("il burro", "butter"), ("la marmellata", "jam"),
        ("il succo", "juice"), ("il caffè", "coffee"), ("lo yogurt", "yogurt"), ("i biscotti", "cookies"),
        ("il cornetto", "croissant"), ("i cereali", "cereal")]),
    ("A tavola", "At the table", "house", [
        ("il piatto", "plate"), ("il bicchiere", "glass"), ("la forchetta", "fork"), ("il coltello", "knife"),
        ("il cucchiaio", "spoon"), ("il tovagliolo", "napkin"), ("la tazza", "cup"), ("la bottiglia", "bottle"),
        ("la sedia", "chair"), ("il tavolo", "table")]),
    ("I dolci", "Sweets", "heart", [
        ("la torta", "cake"), ("il gelato", "ice cream"), ("il cioccolato", "chocolate"), ("la caramella", "candy"),
        ("il biscotto", "cookie"), ("la crostata", "tart"), ("il budino", "pudding"), ("la panna", "cream"),
        ("lo zucchero", "sugar"), ("il miele", "honey")]),
    ("I colori", "Colors", "flower", [
        ("rosso", "red"), ("blu", "blue"), ("verde", "green"), ("giallo", "yellow"), ("arancione", "orange"),
        ("viola", "purple"), ("rosa", "pink"), ("nero", "black"), ("bianco", "white"), ("marrone", "brown"),
        ("grigio", "gray")]),
    ("I numeri", "Numbers", "star", [
        ("uno", "one"), ("due", "two"), ("tre", "three"), ("quattro", "four"), ("cinque", "five"),
        ("sei", "six"), ("sette", "seven"), ("nove", "nine"), ("dieci", "ten"), ("venti", "twenty"),
        ("cento", "one hundred")]),
    ("La famiglia", "Family", "heart", [
        ("la mamma", "mom"), ("il papà", "dad"), ("il fratello", "brother"), ("la sorella", "sister"),
        ("il nonno", "grandpa"), ("la nonna", "grandma"), ("lo zio", "uncle"), ("la zia", "aunt"),
        ("il cugino", "cousin"), ("il bambino", "baby")]),
    ("Il corpo", "The body", "bunny", [
        ("la testa", "head"), ("il naso", "nose"), ("la bocca", "mouth"), ("l'occhio", "eye"),
        ("l'orecchio", "ear"), ("la mano", "hand"), ("il piede", "foot"), ("il braccio", "arm"),
        ("la gamba", "leg"), ("i capelli", "hair")]),
    ("I vestiti", "Clothes", "kite", [
        ("la maglietta", "T-shirt"), ("i pantaloni", "pants"), ("la gonna", "skirt"), ("il vestito", "dress"),
        ("la giacca", "jacket"), ("il cappello", "hat"), ("le scarpe", "shoes"), ("i calzini", "socks"),
        ("la sciarpa", "scarf"), ("i guanti", "gloves")]),
    ("La casa", "The house", "house", [
        ("la casa", "house"), ("la porta", "door"), ("la finestra", "window"), ("il tetto", "roof"),
        ("la cucina", "kitchen"), ("il bagno", "bathroom"), ("la camera", "bedroom"), ("il letto", "bed"),
        ("il divano", "sofa"), ("la scala", "stairs")]),
    ("La scuola", "School", "star", [
        ("la scuola", "school"), ("la maestra", "teacher"), ("il libro", "book"), ("la matita", "pencil"),
        ("la penna", "pen"), ("la gomma", "eraser"), ("lo zaino", "backpack"), ("il quaderno", "notebook"),
        ("la lavagna", "board"), ("il banco", "desk")]),
    ("Il tempo", "Weather", "cloud", [
        ("il sole", "sun"), ("la pioggia", "rain"), ("la neve", "snow"), ("il vento", "wind"),
        ("la nuvola", "cloud"), ("il temporale", "storm"), ("la nebbia", "fog"), ("l'arcobaleno", "rainbow"),
        ("il fulmine", "lightning"), ("il ghiaccio", "ice")]),
    ("Stagioni e mesi", "Seasons and months", "leaf", [
        ("la primavera", "spring"), ("l'estate", "summer"), ("l'autunno", "autumn"), ("l'inverno", "winter"),
        ("gennaio", "January"), ("febbraio", "February"), ("marzo", "March"), ("aprile", "April"),
        ("maggio", "May"), ("giugno", "June")]),
    ("I giorni", "Days of the week", "sun", [
        ("lunedì", "Monday"), ("martedì", "Tuesday"), ("mercoledì", "Wednesday"), ("giovedì", "Thursday"),
        ("venerdì", "Friday"), ("sabato", "Saturday"), ("domenica", "Sunday"), ("oggi", "today"),
        ("domani", "tomorrow"), ("ieri", "yesterday")]),
    ("Lo spazio", "Space", "rocket", [
        ("la luna", "moon"), ("la stella", "star"), ("il pianeta", "planet"), ("il razzo", "rocket"),
        ("l'astronauta", "astronaut"), ("la cometa", "comet"), ("il cielo", "sky"), ("la Terra", "Earth"),
        ("il satellite", "satellite"), ("il telescopio", "telescope")]),
    ("I trasporti", "Transportation", "car", [
        ("la macchina", "car"), ("l'autobus", "bus"), ("il treno", "train"), ("l'aereo", "airplane"),
        ("la bicicletta", "bicycle"), ("la nave", "ship"), ("la barca", "boat"), ("il camion", "truck"),
        ("la moto", "motorcycle"), ("l'elicottero", "helicopter")]),
    ("In città", "In town", "house", [
        ("la strada", "street"), ("il negozio", "shop"), ("il parco", "park"), ("la piazza", "square"),
        ("il ponte", "bridge"), ("la chiesa", "church"), ("l'ospedale", "hospital"), ("la banca", "bank"),
        ("il museo", "museum"), ("il mercato", "market")]),
    ("La natura", "Nature", "leaf", [
        ("l'albero", "tree"), ("il fiore", "flower"), ("la foglia", "leaf"), ("l'erba", "grass"),
        ("il fiume", "river"), ("il lago", "lake"), ("la montagna", "mountain"), ("il bosco", "woods"),
        ("la roccia", "rock"), ("il prato", "meadow")]),
    ("Al mare", "At the beach", "island", [
        ("la spiaggia", "beach"), ("la sabbia", "sand"), ("l'onda", "wave"), ("l'ombrellone", "beach umbrella"),
        ("il secchiello", "bucket"), ("la paletta", "spade"), ("il costume", "swimsuit"),
        ("l'asciugamano", "towel"), ("il bagnino", "lifeguard"), ("la crema", "sunscreen")]),
    ("I giocattoli", "Toys", "kite", [
        ("la palla", "ball"), ("la bambola", "doll"), ("l'aquilone", "kite"), ("il trenino", "toy train"),
        ("l'orsacchiotto", "teddy bear"), ("i dadi", "dice"), ("l'altalena", "swing"), ("lo scivolo", "slide"),
        ("la trottola", "spinning top"), ("il gioco", "game")]),
    ("Lo sport", "Sports", "star", [
        ("il calcio", "soccer"), ("il nuoto", "swimming"), ("il tennis", "tennis"), ("la pallavolo", "volleyball"),
        ("lo sci", "skiing"), ("la corsa", "running"), ("la danza", "dance"), ("il ciclismo", "cycling"),
        ("la squadra", "team"), ("la partita", "match")]),
    ("La musica", "Music", "bird", [
        ("la musica", "music"), ("la chitarra", "guitar"), ("il pianoforte", "piano"), ("il violino", "violin"),
        ("il tamburo", "drum"), ("la tromba", "trumpet"), ("il flauto", "flute"), ("la canzone", "song"),
        ("il cantante", "singer"), ("la nota", "note")]),
    ("Le emozioni", "Feelings", "heart", [
        ("felice", "happy"), ("triste", "sad"), ("arrabbiato", "angry"), ("stanco", "tired"),
        ("contento", "glad"), ("spaventato", "scared"), ("sorpreso", "surprised"), ("calmo", "calm"),
        ("timido", "shy"), ("coraggioso", "brave")]),
    ("I mestieri", "Jobs", "car", [
        ("il medico", "doctor"), ("l'infermiere", "nurse"), ("il pompiere", "firefighter"),
        ("il poliziotto", "police officer"), ("il cuoco", "cook"), ("il contadino", "farmer"),
        ("il pilota", "pilot"), ("il postino", "mail carrier"), ("il pittore", "painter"), ("il dentista", "dentist")]),
    ("Le azioni", "Action words", "frog", [
        ("correre", "to run"), ("saltare", "to jump"), ("mangiare", "to eat"), ("bere", "to drink"),
        ("dormire", "to sleep"), ("giocare", "to play"), ("leggere", "to read"), ("scrivere", "to write"),
        ("cantare", "to sing"), ("ballare", "to dance")]),
    ("I contrari", "Opposites", "moon", [
        ("grande", "big"), ("piccolo", "small"), ("alto", "tall"), ("basso", "short"), ("caldo", "hot"),
        ("freddo", "cold"), ("veloce", "fast"), ("lento", "slow"), ("nuovo", "new"), ("vecchio", "old")]),
    ("Il compleanno", "Birthday", "star", [
        ("la festa", "party"), ("il regalo", "present"), ("la candela", "candle"), ("il palloncino", "balloon"),
        ("gli auguri", "best wishes"), ("il cappellino", "party hat"), ("gli amici", "friends"),
        ("il biglietto", "card"), ("la sorpresa", "surprise"), ("l'invito", "invitation")]),
    ("Il giardino", "The garden", "flower", [
        ("il giardino", "garden"), ("il cespuglio", "bush"), ("il seme", "seed"), ("la pianta", "plant"),
        ("il tulipano", "tulip"), ("il girasole", "sunflower"), ("il verme", "worm"), ("la siepe", "hedge"),
        ("la panchina", "bench"), ("il vaso", "flowerpot")]),
    ("In cucina", "Cooking", "cheese", [
        ("la pentola", "pot"), ("la padella", "frying pan"), ("il forno", "oven"), ("il frigorifero", "fridge"),
        ("la farina", "flour"), ("l'uovo", "egg"), ("il sale", "salt"), ("l'olio", "oil"),
        ("la ricetta", "recipe"), ("il grembiule", "apron")]),
    ("Pasta e pizza", "Italian food", "cheese", [
        ("la pasta", "pasta"), ("la pizza", "pizza"), ("gli spaghetti", "spaghetti"), ("le lasagne", "lasagna"),
        ("il risotto", "risotto"), ("la mozzarella", "mozzarella"), ("il parmigiano", "parmesan"),
        ("il basilico", "basil"), ("il pesto", "pesto"), ("il sugo", "sauce")]),
    ("In viaggio", "Travel", "boat", [
        ("la valigia", "suitcase"), ("il passaporto", "passport"), ("il treno", "train"), ("la mappa", "map"),
        ("l'albergo", "hotel"), ("la stazione", "station"), ("l'aeroporto", "airport"), ("la vacanza", "vacation"),
        ("la fotografia", "photo"), ("la cartolina", "postcard")]),
    ("Le forme", "Shapes", "star", [
        ("il cerchio", "circle"), ("il quadrato", "square"), ("il triangolo", "triangle"),
        ("il rettangolo", "rectangle"), ("il cuore", "heart"), ("il rombo", "diamond"), ("l'ovale", "oval"),
        ("la linea", "line"), ("il punto", "dot"), ("la croce", "cross")]),
    ("Parole gentili", "Kind words", "heart", [
        ("ciao", "hi / bye"), ("grazie", "thank you"), ("prego", "you're welcome"), ("scusa", "sorry"),
        ("buongiorno", "good morning"), ("buonanotte", "good night"), ("arrivederci", "goodbye"),
        ("per favore", "please"), ("benvenuto", "welcome"), ("salve", "hello")]),
]
