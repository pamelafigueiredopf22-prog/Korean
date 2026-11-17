"""Book 3 - Word Search for Kids, ages 6-9: animals, food, space, ocean, weather."""
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks import wordsearch as WS
from kdpbooks.blocklist import blocklist
from kdpbooks.icons import draw_icon
from kdpbooks.qa import Report, standard_checks
from kdpbooks.registry import Registry

BOOK_ID = "book03-wordsearch-kids"
META = {
    "title": "Word Search for Kids Ages 6-9",
    "subtitle": "50 Large-Print Puzzles: Animals, Food, Space, Ocean and Weather",
    "tagline": "Find it, circle it, check it off!",
}

THEMES = {
    "Animals": (["puppy", "bunny", "frog", "bird", "mouse", "snail", "bee", "fish", "puppy", "frog"], [
        ("Farm Animals", "cow pig horse sheep goat duck hen rooster donkey lamb chick turkey"),
        ("Pets", "dog cat fish hamster rabbit parrot turtle puppy kitten mouse lizard pony"),
        ("In the Jungle", "tiger monkey parrot snake gorilla jaguar toucan sloth frog lemur panther chimp"),
        ("On Safari", "lion zebra giraffe hippo rhino cheetah hyena ostrich meerkat elephant gazelle warthog"),
        ("Forest Friends", "bear deer fox owl wolf badger squirrel moose raccoon hedgehog beaver skunk"),
        ("Bugs", "bee ant beetle moth spider ladybug cricket worm snail wasp firefly butterfly"),
        ("Birds", "robin eagle sparrow penguin peacock flamingo pelican crow swan pigeon parakeet hawk"),
        ("Polar Animals", "penguin seal walrus orca reindeer husky puffin narwhal caribou beluga lemming polar_bear"),
        ("Baby Animals", "calf foal cub joey fawn duckling piglet kitten tadpole owlet lamb cygnet"),
        ("Reptiles and Frogs", "snake lizard turtle gecko iguana toad frog newt crocodile tortoise chameleon salamander"),
    ]),
    "Food": (["carrot", "cheese", "flower", "carrot", "cheese", "carrot", "cheese", "carrot", "cheese", "leaf"], [
        ("Fruit", "apple banana grape orange lemon mango pear cherry peach plum kiwi melon"),
        ("Vegetables", "carrot pea corn bean potato onion pepper celery lettuce cabbage spinach broccoli"),
        ("Breakfast", "toast eggs cereal milk juice pancake waffle bacon bagel muffin oatmeal yogurt"),
        ("Sweet Treats", "cake cookie candy donut pie brownie pudding jelly fudge custard lollipop sorbet"),
        ("Picnic Time", "sandwich basket blanket lemonade chips salad grapes pickle cheese napkin plate cup"),
        ("In the Kitchen", "spoon fork knife bowl plate oven pan pot kettle whisk toaster fridge"),
        ("Pizza Party", "pizza cheese tomato crust sauce olives basil ham mushroom peppers onions slice"),
        ("Drinks", "water milk juice tea cocoa smoothie lemonade soda shake cider punch broth"),
        ("Lunchbox", "sandwich apple crackers yogurt carrots cheese raisins pretzel grapes wrap thermos napkin"),
        ("Healthy Snacks", "nuts berries hummus popcorn oats seeds dates figs raisins avocado cucumber prunes"),
    ]),
    "Space": (["rocket", "moon", "star", "rocket", "moon", "star", "rocket", "moon", "star", "rocket"], [
        ("Planets", "mercury venus earth mars jupiter saturn neptune pluto sun moon orbit planet"),
        ("Astronauts", "rocket helmet spacesuit launch capsule gloves oxygen crew pilot mission gravity boots"),
        ("Night Sky", "star moon comet meteor galaxy twinkle crescent night telescope planet sky shadow"),
        ("Rocket Launch", "countdown blastoff engine fuel flames smoke tower booster liftoff thrust zero rocket"),
        ("Space Station", "module dock robot panel lab airlock hatch radio antenna window float earth"),
        ("Moon Mission", "crater rover lander flag dust rocks footprint lunar base orbit astronaut moon"),
        ("Solar System", "sun orbit asteroid comet planet moon rings dwarf belt gravity spin axis"),
        ("Aliens and UFOs", "alien saucer beam antenna green visit spaceship friend planet laser robot signal"),
        ("Telescope Time", "lens zoom focus mirror tripod nebula cluster view bright dark chart stars"),
        ("Space Words", "cosmos satellite eclipse universe vacuum space light zero stars orbit probe launch"),
    ]),
    "Ocean": (["fish", "boat", "island", "fish", "boat", "island", "fish", "boat", "island", "fish"], [
        ("Sea Creatures", "whale shark dolphin octopus squid crab lobster jellyfish seahorse starfish eel clam"),
        ("At the Beach", "sand waves shell bucket spade towel sunhat surf pier kite sandcastle seagull"),
        ("Coral Reef", "coral clownfish turtle sponge anemone ray parrotfish reef urchin grouper shrimp tang"),
        ("Under the Sea", "deep bubbles kelp seaweed current tide salt ocean diver submarine anchor treasure"),
        ("Boats", "sail yacht canoe ferry raft tugboat ship rowboat anchor deck mast oar"),
        ("Pirates", "pirate map treasure parrot captain sword chest gold island plank flag compass"),
        ("By the Sea", "dune lighthouse pebbles cliff bay cove shore driftwood gull rocks harbor wave"),
        ("Whales and Dolphins", "whale dolphin orca blowhole flipper tail pod song splash beluga calf krill"),
        ("Shells and Sand", "conch oyster mussel scallop pearl snail sand crab hermit limpet whelk cockle"),
        ("Ocean Explorer", "scuba mask fins snorkel goggles wetsuit dive tank swim camera flashlight map"),
    ]),
    "Weather": (["sun", "cloud", "kite", "sun", "cloud", "kite", "sun", "cloud", "kite", "sun"], [
        ("Weather Words", "sun rain snow wind cloud storm fog hail sleet thunder frost breeze"),
        ("Rainy Day", "umbrella puddle boots raincoat drizzle splash drops wet shower soggy cloudy gutter"),
        ("Snowy Day", "snowman sled mittens scarf icicle flakes skates igloo cocoa shovel chilly blizzard"),
        ("Sunny Day", "sunshine sunscreen hat shade warm bright pool fan picnic sandals heat summer"),
        ("Stormy Weather", "thunder lightning storm gust hurricane tornado flood clouds downpour rumble flash gale"),
        ("Four Seasons", "spring summer autumn winter fall blossom leaves harvest bloom chill warmth snowfall"),
        ("Weather Tools", "barometer windsock forecast radar satellite map vane chart record degrees gauge sensor"),
        ("Windy Day", "breeze gust kite pinwheel windmill sail blow whoosh howl draft flag leaves"),
        ("Clouds and Sky", "cumulus cirrus stratus fluffy mist haze sky blue rainbow sunset sunrise dawn"),
        ("What to Wear", "coat jacket hat gloves scarf boots shorts sweater hood sandals poncho beanie"),
    ]),
}
THEME_ORDER = ["Animals", "Food", "Space", "Ocean", "Weather"]
N = 50


def word_display(w):
    return w.replace("_", " ").upper()


def plan(i, n=N):
    t = i / (n - 1)
    theme = THEME_ORDER[i % 5]
    k = i // 5
    title, words = THEMES[theme][1][k]
    icon = THEMES[theme][0][k]
    n_words = 7 + round(t * 5)                          # 7 -> 12 words
    size = 9 + round(t * 4)                             # 9x9 -> 13x13
    dirs = ["E", "S"] if t < 0.38 else (["E", "S", "SE"] if t < 0.72 else ["E", "S", "SE", "NE"])
    stars = 1 + (3 * i) // n
    return theme, title, icon, words.split(), n_words, size, dirs, stars


def make_puzzle(rng, i):
    theme, title, icon, words, n_words, size, dirs, stars = plan(i)
    words = [w for w in words if len(WS.grid_text(w)) <= size]
    # early puzzles prefer shorter words
    words = sorted(words, key=lambda w: (len(w) + rng.random() * 4 * (i / N) * 3))
    chosen = WS.pick_compatible(words, n_words)
    ws = WS.WordSearch(size, [word_display(w) for w in chosen], dirs)
    ws.build(rng, overlap_pref=0.15 + 0.3 * i / N)
    return ws


def puzzle_page(book, idx, ws, i):
    theme, title, icon, *_ , dirs, stars = plan(i)
    c = book.new_page(role="puzzle")
    top = L.CONTENT_T
    c.setFont(L.DISPLAY, L.fit_size(title, L.DISPLAY, 36, L.CONTENT_W - 1.4 * inch))
    c.drawString(L.CONTENT_L, top - 0.45 * inch, title)
    c.setFont(L.BODY_BOLD, 13)
    c.setFillGray(0.3)
    c.drawString(L.CONTENT_L, top - 0.78 * inch, f"Puzzle {idx}  •  {theme}")
    c.setFillGray(0)
    draw_icon(c, icon, L.CONTENT_R - 0.5 * inch, top - 0.45 * inch, 0.95 * inch, 3.5)
    WS.draw_direction_hint(c, L.CONTENT_L, top - 1.18 * inch, ws.dirs)

    n_rows_list = -(-len(ws.words) // 3)
    list_h = n_rows_list * 17 * 1.75 + 0.2 * inch
    grid_top = top - 1.55 * inch
    grid_bot = L.CONTENT_B + 0.3 * inch + list_h + 0.25 * inch
    geo = WS.draw_grid(c, ws, L.CONTENT_L + 0.2 * inch, grid_bot, L.CONTENT_W - 0.4 * inch,
                       grid_top - grid_bot, max_cell=0.6 * inch)
    WS.draw_word_list(c, ws.words, L.CONTENT_L + 0.35 * inch, L.CONTENT_B + 0.3 * inch + list_h - 0.32 * inch,
                      L.CONTENT_W - 0.5 * inch, 3, size=17)
    return geo


def answer_pages(book, puzzles):
    per, cols = 4, 2
    gap = 0.3 * inch
    cw = (L.CONTENT_W - gap) / cols
    ch = (L.CONTENT_H - 0.6 * inch - gap) / 2
    for s in range(0, len(puzzles), per):
        c = book.new_page(role="answers")
        c.setFont(L.DISPLAY, 24)
        c.drawCentredString(L.PAGE_W / 2, L.CONTENT_T - 0.3 * inch, "Answers")
        for k, (idx, ws, title) in enumerate(puzzles[s:s + per]):
            col, row = k % cols, k // cols
            x = L.CONTENT_L + col * (cw + gap)
            y = L.CONTENT_T - 0.6 * inch - (row + 1) * ch - row * gap
            c.setFont(L.DISPLAY, 15)
            c.drawCentredString(x + cw / 2, y + ch - 0.25 * inch, f"{idx}. {title}")
            WS.draw_grid(c, ws, x + 0.15 * inch, y + 0.1 * inch, cw - 0.3 * inch, ch - 0.55 * inch,
                         frame=False, answers=True)


def decorate_title(c):
    rng = random.Random("book03-title")
    ws = WS.WordSearch(7, ["FIND", "WORDS", "FUN", "LOOK"], ["E", "S"])
    ws.build(rng)
    WS.draw_grid(c, ws, L.PAGE_W / 2 - 1.2 * inch, L.CONTENT_T - 2.5 * inch, 2.4 * inch, 2.4 * inch,
                 answers=True, hl_gray=0.85)
    for name, x in zip(["puppy", "carrot", "rocket", "fish", "sun", "cloud"],
                       [L.CONTENT_L + 0.55 * inch + k * (L.CONTENT_W - 1.1 * inch) / 5 for k in range(6)]):
        draw_icon(c, name, x, L.CONTENT_B + 1.3 * inch, 0.8 * inch, 3.5)


def decorate_belongs(c):
    for name, x, y in (("puppy", L.CONTENT_L + 0.9 * inch, L.CONTENT_T - 1.2 * inch),
                       ("rocket", L.CONTENT_R - 0.9 * inch, L.CONTENT_T - 1.2 * inch),
                       ("fish", L.CONTENT_L + 1.0 * inch, L.CONTENT_B + 1.2 * inch),
                       ("sun", L.CONTENT_R - 1.0 * inch, L.CONTENT_B + 1.2 * inch)):
        draw_icon(c, name, x, y, 1.15 * inch, 4)


def make_your_own(book):
    c = book.new_page(role="back")
    L.centred(c, "Make Your Own Word Search!", L.CONTENT_T - 0.5 * inch, L.DISPLAY, 30)
    L.centred(c, "Write your words in the grid, fill the gaps with any letters, then swap with a friend!",
              L.CONTENT_T - 0.95 * inch, L.BODY, 13)
    n, cell = 10, 0.58 * inch
    x0 = L.PAGE_W / 2 - n * cell / 2
    y0 = L.CONTENT_T - 1.3 * inch
    c.setLineWidth(1.2)
    for k in range(n + 1):
        c.line(x0 + k * cell, y0, x0 + k * cell, y0 - n * cell)
        c.line(x0, y0 - k * cell, x0 + n * cell, y0 - k * cell)
    c.setFont(L.DISPLAY, 18)
    c.drawString(L.CONTENT_L + 0.3 * inch, y0 - n * cell - 0.45 * inch, "My words:")
    c.setLineWidth(1.5)
    for k in range(4):
        yy = y0 - n * cell - 0.85 * inch - k * 0.38 * inch
        c.line(L.CONTENT_L + 0.3 * inch, yy, L.PAGE_W / 2 - 0.2 * inch, yy)
        c.line(L.PAGE_W / 2 + 0.2 * inch, yy, L.CONTENT_R - 0.3 * inch, yy)


def build(volume=1, out_dir="output"):
    rng = random.Random(f"{BOOK_ID}-vol{volume}")
    reg = Registry(BOOK_ID, volume)
    bad = blocklist()
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)

    puzzles, checks = [], []
    for i in range(N):
        while True:
            ws = make_puzzle(rng, i)
            if ws.claim_in(reg, f"{BOOK_ID} v{volume} puzzle {i+1}"):
                break
        puzzles.append((i + 1, ws, plan(i)[1]))
        checks.append(ws.check(bad))

    L.title_page(book, META["title"] + suffix, "50 Large-Print Puzzles", META["tagline"],
                 decorate=decorate_title)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, decorate=decorate_belongs)
    L.how_to_page(book, "How to Use This Book", [
        "Read the word list at the bottom of the page.",
        "Look for each word hiding in the letter grid.",
        "The arrows at the top show which way the words go: across, down, or slanting.",
        "When you find a word, draw a circle around it and tick its box.",
        "The puzzles get a little bigger and trickier as you go. All the answers are at the back.",
    ], tip="Word searches build spelling, letter recognition and focus. For younger children, "
           "read the words aloud together first and run a finger along each row of the grid.")

    for (idx, ws, title), i in zip(puzzles, range(N)):
        puzzle_page(book, idx, ws, i)

    L.section_page(book, "Answers", "Did you find them all?")
    answer_pages(book, puzzles)
    from kdpbooks.mazebook import certificate_page
    certificate_page(book, f"You found every word in all {N} puzzles!")
    book.pad_to_even(make_your_own)
    roles = book.page_roles
    book.save()
    reg.save()

    list_issues = [f"#{idx}: {p}" for idx, ws, _ in puzzles for p in WS.list_problems(ws.words, bad)]
    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    rep.check("Word lists: no word hidden inside another, no palindromes, none blocklisted",
              not list_issues, "; ".join(list_issues[:6]))
    rep.check(f"{N} puzzles generated", len(puzzles) == N)
    rep.check("Every listed word is in its grid", all(not ch["missing"] for ch in checks))
    rep.check("Every word appears exactly once (all 8 directions searched)",
              all(not ch["multiple"] for ch in checks))
    rep.check("Words only run in the directions shown on the page",
              all(not ch["wrong_dir"] for ch in checks) and
              all(ws.placed[k][2] in ws.dirs for _, ws, _ in puzzles for k in ws.keys))
    rep.check("No rude/unsuitable words anywhere in any grid (8 directions)",
              all(not ch["rude"] for ch in checks), f"{len(bad)} blocked words screened")
    n, clashes = reg.verify_unique()
    rep.check("No duplicate puzzles within this book or across other books", not clashes and n == N,
              f"{n} grids; {len(reg.taken)} puzzles from other books checked")
    standard_checks(rep, path, roles)
    rep.check("Printed grids match generated grids (text extracted from PDF)",
              *verify_printed_text(path, puzzles))
    return path, rep, {}


def verify_printed_text(path, puzzles, first_page=5):
    import subprocess
    bad = []
    for k, (idx, ws, _) in enumerate(puzzles):
        p = first_page + k
        txt = subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), "-layout", path, "-"],
                             capture_output=True, text=True).stdout
        flat = "".join(ch for ch in txt if ch.isalpha() and ch.isupper())
        if "".join("".join(r) for r in ws.grid) not in flat:
            bad.append(idx)
    return not bad, (f"{len(puzzles)} puzzle pages checked" if not bad else f"mismatch on {bad}")
