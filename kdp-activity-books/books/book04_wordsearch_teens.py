"""Book 4 - Word Search for Teens: 60 themed puzzles, all 8 directions."""
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks import wordsearch as WS
from kdpbooks.blocklist import blocklist
from kdpbooks.qa import Report, standard_checks
from kdpbooks.registry import Registry
from books.book04_data import THEMES
from books.book03_wordsearch_kids import verify_printed_text

BOOK_ID = "book04-wordsearch-teens"
META = {
    "title": "Word Search for Teens",
    "subtitle": "60 Challenging Themed Puzzles with Backwards and Diagonal Words",
    "tagline": "Music, myths, gaming, science, food and more",
}
N = 60
H = L.HEAVY              # headings: cleaner, more grown-up than the kids' display font


def plan(i, n=N):
    t = i / (n - 1)
    title, words = THEMES[i]
    size = 15 + round(t * 3)                                    # 15x15 -> 18x18
    n_words = 16 + round(t * 6)                                 # 16 -> 22 words
    if i < 12:
        dirs = ["E", "S", "SE", "NE"]                           # warm-up: no backwards
    elif i < 30:
        dirs = ["E", "S", "SE", "NE", "W", "N"]
    else:
        dirs = WS.ALL8
    stars = 1 + (3 * i) // n
    return title, words.split(), size, n_words, dirs, stars


def make_puzzle(rng, i):
    title, words, size, n_words, dirs, _ = plan(i)
    words = [w for w in words if len(WS.grid_text(w)) <= size]
    rng.shuffle(words)
    chosen = WS.pick_compatible(words, n_words)
    ws = WS.WordSearch(size, [w.replace("_", " ").upper() for w in chosen], dirs)
    letters = "".join(ws.keys)
    # fill mostly with letters from the word list -> lots of near-misses (harder)
    fill = letters * 3 + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    ws.build(rng, fill_letters=fill, overlap_pref=0.45)
    return ws


def draw_level(c, x_right, y, stars):
    c.setFont(L.BODY_BOLD, 11)
    label = ["", "WARM-UP", "CHALLENGE", "EXPERT"][stars]
    w = c.stringWidth(label, L.BODY_BOLD, 11) + 16
    c.setLineWidth(1.2)
    c.roundRect(x_right - w, y - 6, w, 20, 10, stroke=1, fill=0)
    c.drawCentredString(x_right - w / 2, y, label)


def puzzle_page(book, idx, ws, i):
    title, *_, dirs, stars = plan(i)
    c = book.new_page(role="puzzle")
    top = L.CONTENT_T
    c.setFont(H, L.fit_size(title, H, 30, L.CONTENT_W - 1.6 * inch))
    c.drawString(L.CONTENT_L, top - 0.38 * inch, title)
    c.setFont(L.BODY, 12)
    c.setFillGray(0.3)
    c.drawString(L.CONTENT_L, top - 0.66 * inch, f"Puzzle {idx}")
    c.setFillGray(0)
    draw_level(c, L.CONTENT_R, top - 0.32 * inch, stars)
    WS.draw_direction_hint(c, L.CONTENT_L + 0.9 * inch, top - 0.62 * inch, dirs, size=11,
                           label="")
    c.setLineWidth(0.8)
    c.line(L.CONTENT_L, top - 0.85 * inch, L.CONTENT_R, top - 0.85 * inch)

    ncols = 4
    rows = -(-len(ws.words) // ncols)
    list_h = rows * 12 * 1.6 + 0.15 * inch
    grid_top = top - 1.0 * inch
    grid_bot = L.CONTENT_B + 0.25 * inch + list_h + 0.2 * inch
    WS.draw_grid(c, ws, L.CONTENT_L, grid_bot, L.CONTENT_W, grid_top - grid_bot,
                 max_cell=0.42 * inch, letter_frac=0.52)
    WS.draw_word_list(c, ws.words, L.CONTENT_L + 0.1 * inch,
                      L.CONTENT_B + 0.25 * inch + list_h - 0.25 * inch,
                      L.CONTENT_W - 0.1 * inch, ncols, size=12, leading=1.6, font=L.BODY)


def answer_pages(book, puzzles):
    per, cols = 4, 2
    gap = 0.25 * inch
    cw = (L.CONTENT_W - gap) / cols
    ch = (L.CONTENT_H - 0.55 * inch - gap) / 2
    for s in range(0, len(puzzles), per):
        c = book.new_page(role="answers")
        c.setFont(H, 20)
        c.drawCentredString(L.PAGE_W / 2, L.CONTENT_T - 0.25 * inch, "Answers")
        for k, (idx, ws, title) in enumerate(puzzles[s:s + per]):
            col, row = k % cols, k // cols
            x = L.CONTENT_L + col * (cw + gap)
            y = L.CONTENT_T - 0.55 * inch - (row + 1) * ch - row * gap
            c.setFont(H, 12)
            c.drawCentredString(x + cw / 2, y + ch - 0.2 * inch, f"{idx}. {title}")
            WS.draw_grid(c, ws, x, y + 0.05 * inch, cw, ch - 0.35 * inch,
                         frame=False, answers=True, letter_frac=0.6)


def decorate_title(c):
    rng = random.Random("book04-title")
    ws = WS.WordSearch(9, ["SEEK", "FIND", "SOLVE", "WORDS", "HIDDEN"], ["E", "S", "SE", "W"])
    ws.build(rng)
    WS.draw_grid(c, ws, L.PAGE_W / 2 - 1.5 * inch, L.CONTENT_B + 0.4 * inch, 3.0 * inch, 3.0 * inch,
                 answers=True, hl_gray=0.85)


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
        puzzles.append((i + 1, ws, plan(i)[0]))
        checks.append(ws.check(bad))

    L.title_page(book, META["title"] + suffix, META["subtitle"], META["tagline"],
                 decorate=decorate_title, font=H)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, font=H)
    L.how_to_page(book, "How to Use This Book", [
        "Each puzzle has a theme and a list of hidden words below the grid.",
        "Words can run across, down and diagonally. Later puzzles also hide words backwards.",
        "The arrows next to the puzzle number show every direction used in that puzzle.",
        "Spaces in two-word answers are left out of the grid (ICE CREAM is hidden as ICECREAM).",
        "Puzzles are ranked Warm-Up, Challenge and Expert. Answers are at the back.",
    ], tip="The grids are filled with letters taken from the word list, so watch out for "
           "near-misses. Scan for rare letters (J, Q, X, Z, K) or double letters first.",
        font=H, tip_title="Pro tip", size=15)

    for (idx, ws, _), i in zip(puzzles, range(N)):
        puzzle_page(book, idx, ws, i)

    L.section_page(book, "Answers", font=H)
    answer_pages(book, puzzles)
    book.pad_to_even()
    roles = book.page_roles
    book.save()
    reg.save()

    list_issues = [f"#{idx}: {p}" for idx, ws, _ in puzzles for p in WS.list_problems(ws.words, bad)]
    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    rep.check("Word lists: no word hidden inside another, no palindromes, none blocklisted",
              not list_issues, "; ".join(list_issues[:6]))
    rep.check(f"{N} puzzles generated", len(puzzles) == N,
              f"{sum(len(ws.words) for _, ws, _ in puzzles)} hidden words in total")
    rep.check("Every listed word is in its grid", all(not ch["missing"] for ch in checks))
    rep.check("Every word appears exactly once (all 8 directions searched)",
              all(not ch["multiple"] for ch in checks))
    rep.check("Words only run in the directions shown on the page",
              all(not ch["wrong_dir"] for ch in checks) and
              all(ws.placed[k][2] in ws.dirs for _, ws, _ in puzzles for k in ws.keys))
    used = {ws.placed[k][2] for _, ws, _ in puzzles[30:] for k in ws.keys}
    rep.check("Expert puzzles use all 8 directions, including backwards", used == set(WS.ALL8))
    rep.check("No rude/unsuitable words anywhere in any grid (8 directions)",
              all(not ch["rude"] for ch in checks), f"{len(bad)} blocked words screened")
    n, clashes = reg.verify_unique()
    rep.check("No duplicate puzzles within this book or across other books", not clashes and n == N,
              f"{n} grids; {len(reg.taken)} puzzles from other books checked")
    standard_checks(rep, path, roles)
    rep.check("Printed grids match generated grids (text extracted from PDF)",
              *verify_printed_text(path, puzzles))
    return path, rep, {}
