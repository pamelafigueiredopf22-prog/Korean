"""Book 10 - Italian-English Word Search for Kids: 40 themed vocabulary puzzles."""
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks import wordsearch as WS
from kdpbooks.blocklist import blocklist
from kdpbooks.icons import draw_icon
from kdpbooks.mazebook import certificate_page
from kdpbooks.qa import Report, standard_checks
from kdpbooks.registry import Registry
from books.book10_data import THEMES
from books.book03_wordsearch_kids import verify_printed_text

BOOK_ID = "book10-italian-wordsearch"
META = {
    "title": "Italian-English Word Search for Kids",
    "subtitle": "40 Themed Puzzles to Learn 400 Italian Words",
    "tagline": "Impara giocando! Learn while you play!",
}
ARTICLES = ("il", "lo", "la", "i", "gli", "le")
IT_ALPHABET = "ABCDEFGHILMNOPQRSTUVZ"      # the 21-letter Italian alphabet (no J K W X Y)


def it_word(entry):
    """'il gatto' -> 'gatto', "l'ape" -> 'ape', 'per favore' -> 'per favore'."""
    w = entry
    if w.startswith("l'"):
        return w[2:]
    head, _, rest = w.partition(" ")
    return rest if head in ARTICLES and rest else w


def plan(i, n=len(THEMES)):
    t = i / (n - 1)
    size = 12 if t < 0.5 else 13
    dirs = ["E", "S"] if t < 0.5 else ["E", "S", "SE"]
    stars = 1 + (3 * i) // n
    return size, dirs, stars


def make_puzzle(rng, i):
    it_title, en_title, icon, pairs = THEMES[i]
    size, dirs, _ = plan(i)
    words = [it_word(it).upper() for it, _ in pairs]
    ws = WS.WordSearch(size, words, dirs)
    ws.build(rng, fill_letters=IT_ALPHABET, bad_words=blocklist(("en", "it")),
             overlap_pref=0.2 + 0.2 * i / len(THEMES))
    return ws


def puzzle_page(book, idx, ws, i):
    it_title, en_title, icon, pairs = THEMES[i]
    size, dirs, stars = plan(i)
    c = book.new_page(role="puzzle")
    top = L.CONTENT_T
    c.setFont(L.DISPLAY, L.fit_size(it_title, L.DISPLAY, 34, L.CONTENT_W - 1.4 * inch))
    c.drawString(L.CONTENT_L, top - 0.42 * inch, it_title)
    c.setFont(L.BODY_BOLD, 15)
    c.setFillGray(0.3)
    c.drawString(L.CONTENT_L, top - 0.75 * inch, f"{en_title}  •  Puzzle {idx}")
    c.setFillGray(0)
    draw_icon(c, icon, L.CONTENT_R - 0.5 * inch, top - 0.45 * inch, 0.9 * inch, 3.5)
    WS.draw_direction_hint(c, L.CONTENT_L, top - 1.13 * inch, dirs, label="Parole:")

    rows = -(-len(pairs) // 2)
    list_h = rows * 15 * 1.7 + 0.15 * inch
    grid_top = top - 1.45 * inch
    grid_bot = L.CONTENT_B + 0.3 * inch + list_h + 0.2 * inch
    WS.draw_grid(c, ws, L.CONTENT_L + 0.2 * inch, grid_bot, L.CONTENT_W - 0.4 * inch,
                 grid_top - grid_bot, max_cell=0.52 * inch)
    # bilingual list: [ ] GATTO  cat
    y0 = L.CONTENT_B + 0.3 * inch + list_h - 0.3 * inch
    colw = (L.CONTENT_W - 0.4 * inch) / 2
    for k, (it, en) in enumerate(pairs):
        col, row = k // rows, k % rows
        x = L.CONTENT_L + 0.3 * inch + col * colw
        y = y0 - row * 15 * 1.7
        c.setLineWidth(1.4)
        c.rect(x, y - 1.5, 12, 12, stroke=1, fill=0)
        word = it_word(it).upper()
        c.setFont(L.BODY_BOLD, 15)
        c.drawString(x + 20, y, word)
        wx = x + 20 + c.stringWidth(word, L.BODY_BOLD, 15) + 8
        c.setFont(L.BODY, 13)
        c.setFillGray(0.3)
        c.drawString(wx, y, en)
        c.setFillGray(0)


def tips_page(book):
    c = book.new_page(role="front")
    L.centred(c, "Italian Tips", L.CONTENT_T - 0.6 * inch, L.DISPLAY, 38)
    blocks = [
        ("Little words: il, lo, la, l'", "Italian nouns have a small word in front that means \"the\". "
         "Use il or lo for boy words (il gatto, lo zaino), la for girl words (la mela), and l' before a vowel "
         "(l'ape). For more than one: i, gli, le. The puzzles hide only the main word: GATTO, not IL GATTO."),
        ("Accents", "Some words have an accent: caffè, papà, lunedì. In the grid the accent is left "
         "off, so look for CAFFE, PAPA and LUNEDI."),
        ("Two-word phrases", "Phrases like per favore are hidden without the space: PERFAVORE."),
        ("Say it out loud!", "Italian is read just as it is written. Every vowel is sounded: "
         "a as in father, e as in pet, i as in machine, o as in or, u as in rule. "
         "C and G are soft before e and i (cena, gelato) and hard before a, o, u (casa, gatto)."),
    ]
    y = L.CONTENT_T - 1.4 * inch
    for head, text in blocks:
        c.setFont(L.DISPLAY, 20)
        c.drawString(L.CONTENT_L + 0.2 * inch, y, head)
        y = L.paragraph(c, text, L.CONTENT_L + 0.2 * inch, y - 0.34 * inch, L.CONTENT_W - 0.4 * inch,
                        L.BODY, 15) - 0.35 * inch
    draw_icon(c, "star", L.CONTENT_L + 0.7 * inch, L.CONTENT_B + 0.7 * inch, 0.9 * inch, 3.5)
    draw_icon(c, "heart", L.CONTENT_R - 0.7 * inch, L.CONTENT_B + 0.7 * inch, 0.9 * inch, 3.5)


def answer_pages(book, puzzles):
    per, cols = 4, 2
    gap = 0.3 * inch
    cw = (L.CONTENT_W - gap) / cols
    ch = (L.CONTENT_H - 0.6 * inch - gap) / 2
    for s in range(0, len(puzzles), per):
        c = book.new_page(role="answers")
        c.setFont(L.DISPLAY, 24)
        c.drawCentredString(L.PAGE_W / 2, L.CONTENT_T - 0.3 * inch, "Soluzioni • Answers")
        for k, (idx, ws, title) in enumerate(puzzles[s:s + per]):
            col, row = k % cols, k // cols
            x = L.CONTENT_L + col * (cw + gap)
            y = L.CONTENT_T - 0.6 * inch - (row + 1) * ch - row * gap
            c.setFont(L.DISPLAY, 14)
            c.drawCentredString(x + cw / 2, y + ch - 0.25 * inch, f"{idx}. {title}")
            WS.draw_grid(c, ws, x + 0.15 * inch, y + 0.1 * inch, cw - 0.3 * inch, ch - 0.55 * inch,
                         frame=False, answers=True)


def glossary_pages(book):
    entries = []
    for it_title, en_title, icon, pairs in THEMES:
        for it, en in pairs:
            entries.append((WS.grid_text(it_word(it)), it, en))
    entries = sorted(set(entries))
    cols, per_col = 3, 46
    cw = L.CONTENT_W / cols
    first = True
    for s in range(0, len(entries), cols * per_col):
        c = book.new_page(role="back")
        top = L.CONTENT_T
        if first:
            c.setFont(L.DISPLAY, 26)
            c.drawCentredString(L.PAGE_W / 2, top - 0.3 * inch, "Dizionario • Glossary")
            first = False
        top -= 0.6 * inch
        for k, (_, it, en) in enumerate(entries[s:s + cols * per_col]):
            col, row = k // per_col, k % per_col
            x = L.CONTENT_L + col * cw
            y = top - row * 0.178 * inch
            c.setFont(L.BODY_BOLD, 9.5)
            c.drawString(x, y, it)
            c.setFont(L.BODY, 9.5)
            c.setFillGray(0.3)
            c.drawString(x + c.stringWidth(it, L.BODY_BOLD, 9.5) + 5,
                         y, L.wrap(en, L.BODY, 9.5, cw - c.stringWidth(it, L.BODY_BOLD, 9.5) - 12)[0])
            c.setFillGray(0)
    return len(entries)


def write_review_file(path):
    lines = ["# Book 10 – Italian vocabulary for spelling review", "",
             "Every Italian word in the book, by puzzle. The **Grid** column is exactly what is hidden",
             "in the letter grid (article, accents and spaces removed). Edit `books/book10_data.py` to",
             "change anything, then run `python build.py book10` again.", ""]
    for n, (it_title, en_title, _, pairs) in enumerate(THEMES, 1):
        lines += [f"## {n}. {it_title} ({en_title})", "", "| Italian | English | Grid |", "|---|---|---|"]
        lines += [f"| {it} | {en} | {WS.grid_text(it_word(it))} |" for it, en in pairs]
        lines.append("")
    with open(path, "w") as fh:
        fh.write("\n".join(lines))


def build(volume=1, out_dir="output"):
    rng = random.Random(f"{BOOK_ID}-vol{volume}")
    reg = Registry(BOOK_ID, volume)
    bad = blocklist(("en", "it"))
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)

    puzzles, checks = [], []
    for i in range(len(THEMES)):
        while True:
            ws = make_puzzle(rng, i)
            if ws.claim_in(reg, f"{BOOK_ID} v{volume} puzzle {i+1}"):
                break
        puzzles.append((i + 1, ws, THEMES[i][0]))
        checks.append(ws.check(bad))

    def deco(c):
        ws = WS.WordSearch(7, ["CIAO", "HELLO", "SOLE", "SUN"], ["E", "S"])
        ws.build(random.Random("b10title"), bad_words=bad)
        WS.draw_grid(c, ws, L.PAGE_W / 2 - 1.2 * inch, L.CONTENT_B + 0.6 * inch, 2.4 * inch, 2.4 * inch,
                     answers=True, hl_gray=0.85)
    L.title_page(book, META["title"] + suffix, META["subtitle"], META["tagline"], decorate=deco)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, decorate=lambda c: [draw_icon(c, nm, x, y, 1.1 * inch, 4) for nm, x, y in (
        ("sun", L.CONTENT_L + 0.9 * inch, L.CONTENT_T - 1.2 * inch),
        ("star", L.CONTENT_R - 0.9 * inch, L.CONTENT_T - 1.2 * inch),
        ("cheese", L.CONTENT_L + 1.0 * inch, L.CONTENT_B + 1.2 * inch),
        ("boat", L.CONTENT_R - 1.0 * inch, L.CONTENT_B + 1.2 * inch))])
    L.how_to_page(book, "How to Use This Book", [
        "Each puzzle has a theme. The Italian title is at the top, with the English below it.",
        "The word list shows each Italian word next to its English meaning.",
        "Find the ITALIAN words in the grid. Say each one out loud when you find it!",
        "Arrows show the directions: across and down at first, then slanting too.",
        "Answers and an Italian-English dictionary of all 400 words are at the back.",
    ], tip="Read the word list together before searching, and talk about the English meanings. "
           "Spotting a word over and over in the grid is a fun way to remember its spelling.", size=16)
    tips_page(book)
    for (idx, ws, _), i in zip(puzzles, range(len(THEMES))):
        puzzle_page(book, idx, ws, i)
    L.section_page(book, "Soluzioni", "Answers")
    answer_pages(book, puzzles)
    n_gloss = glossary_pages(book)
    certificate_page(book, "Bravo! Brava! You found all 400 words!")
    book.pad_to_even()
    roles = book.page_roles
    book.save()
    reg.save()
    write_review_file(os.path.join(os.path.dirname(out_dir.rstrip("/")) or ".", "listings",
                                   "book10-italian-vocabulary-review.md"))

    list_issues = [f"#{idx}: {p}" for idx, ws, _ in puzzles for p in WS.list_problems(ws.words, bad)]
    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    rep.check("Word lists: no word hidden inside another, no palindromes, none blocklisted",
              not list_issues, "; ".join(list_issues[:6]))
    rep.check(f"{len(puzzles)} puzzles generated", len(puzzles) == 40,
              f"{sum(len(ws.words) for _, ws, _ in puzzles)} Italian words; glossary {n_gloss} entries")
    rep.check("Every listed word is in its grid", all(not ch["missing"] for ch in checks))
    rep.check("Every word appears exactly once (all 8 directions searched)",
              all(not ch["multiple"] for ch in checks))
    rep.check("Words only run in the directions shown on the page",
              all(not ch["wrong_dir"] for ch in checks))
    rep.check("No rude/unsuitable words in English OR Italian anywhere in any grid",
              all(not ch["rude"] for ch in checks), f"{len(bad)} blocked words screened (EN + IT)")
    rep.check("Grid filler uses only the 21-letter Italian alphabet (no J K W X Y)",
              all(set("".join("".join(r) for r in ws.grid)) - set("".join(ws.keys)) <= set(IT_ALPHABET)
                  for _, ws, _ in puzzles))
    n, clashes = reg.verify_unique()
    rep.check("No duplicate puzzles within this book or across other books", not clashes and n == 40,
              f"{n} grids; {len(reg.taken)} puzzles from other books checked")
    standard_checks(rep, path, roles, min_pages=60)
    rep.check("Printed grids match generated grids (text extracted from PDF)",
              *verify_printed_text(path, puzzles, first_page=6))
    return path, rep, {}
