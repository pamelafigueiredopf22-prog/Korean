"""Book 5 - Sudoku for Kids: 4x4 then 6x6, getting harder through the book."""
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks import sudoku as SD
from kdpbooks.icons import draw_icon
from kdpbooks.mazebook import certificate_page, draw_stars
from kdpbooks.qa import Report, audit_sudoku_print, standard_checks
from kdpbooks.registry import Registry

BOOK_ID = "book05-sudoku-kids"
META = {
    "title": "Sudoku for Kids",
    "subtitle": "100 Easy to Tricky 4x4 and 6x6 Puzzles",
    "tagline": "Ages 6-10. Learn it, love it, master it!",
}
N4, N6 = 36, 64
ICONS = ["star", "heart", "sun", "flower", "fish", "bee", "rocket", "moon", "kite", "frog",
         "bunny", "bird", "snail", "cloud", "puppy", "mouse"]


def plan(k):
    """k = 0..99 -> (n, clues, max_level, stars)."""
    if k < N4:
        t = k / (N4 - 1)
        return 4, round(11 - t * 6.5), (0 if t < 0.5 else 1), 1 + (3 * k) // N4
    j = k - N4
    t = j / (N6 - 1)
    return 6, round(22 - t * 12), (0 if t < 0.35 else 1), 1 + (3 * j) // N6


def puzzle_block(c, s, idx, top, k, stars):
    n = s.n
    c.setFont(L.DISPLAY, 26)
    c.drawString(L.CONTENT_L, top - 0.32 * inch, f"Puzzle {idx}")
    draw_stars(c, L.CONTENT_R - 1.0 * inch, top - 0.22 * inch, stars, size=18)
    c.setFont(L.BODY_BOLD, 14)
    digits = " ".join(str(d) for d in range(1, n + 1))
    c.drawString(L.CONTENT_L, top - 0.62 * inch, f"Use the numbers {digits}")
    draw_icon(c, ICONS[idx % len(ICONS)], L.CONTENT_R - 0.4 * inch, top - 0.3 * inch, 0.62 * inch, 3)
    size = 3.55 * inch
    x = (L.PAGE_W - size) / 2
    y = top - 0.8 * inch - size
    SD.draw_sudoku(c, s, x, y, size, thick=4.5, thin=1.6, given_frac=0.55)
    return (s, x, y, size)


def how_sudoku_works(book, sample):
    c = book.new_page(role="front")
    L.centred(c, "How Sudoku Works", L.CONTENT_T - 0.6 * inch, L.DISPLAY, 38)
    L.centred(c, "Fill every empty square so that each number 1, 2, 3, 4 appears", L.CONTENT_T - 1.05 * inch,
              L.BODY, 15)
    L.centred(c, "just once in every ROW, every COLUMN and every BOX.", L.CONTENT_T - 1.3 * inch, L.BODY_BOLD, 15)
    size = 2.0 * inch
    gap = (L.CONTENT_W - 3 * size) / 2
    y = L.CONTENT_T - 1.75 * inch - size
    full = SD.Sudoku(4, sample.solution, sample.solution)
    labels = ["ROW", "COLUMN", "BOX"]
    for k in range(3):
        x = L.CONTENT_L + k * (size + gap)
        cell = size / 4
        c.setFillGray(0.85)
        if k == 0:
            c.rect(x, y + size - cell, size, cell, stroke=0, fill=1)
        elif k == 1:
            c.rect(x, y, cell, size, stroke=0, fill=1)
        else:
            c.rect(x, y + size / 2, size / 2, size / 2, stroke=0, fill=1)
        c.setFillGray(0)
        SD.draw_sudoku(c, full, x, y, size, thick=3.5, thin=1.2)
        L_ = labels[k]
        c.setFont(L.DISPLAY, 20)
        c.drawCentredString(x + size / 2, y - 0.38 * inch, L_)
        c.setFont(L.BODY, 12)
        c.drawCentredString(x + size / 2, y - 0.62 * inch, "1, 2, 3, 4: one of each!")
    # worked example
    yy = y - 1.25 * inch
    c.setFont(L.DISPLAY, 22)
    c.drawString(L.CONTENT_L, yy, "Try it!")
    c.setFont(L.BODY, 14)
    tips = ["Look at a row that is almost full.",
            "Which number is missing? Write it in!",
            "Keep going until every square is filled.",
            "Use a pencil so you can erase."]
    for i, tip in enumerate(tips):
        c.drawString(L.CONTENT_L, yy - 0.4 * inch - i * 0.32 * inch, f"{i + 1}.  {tip}")
    s2 = 2.4 * inch
    SD.draw_sudoku(c, sample, L.CONTENT_R - s2, yy - s2 + 0.15 * inch, s2, thick=4, thin=1.4)
    c.setFont(L.BODY, 11)
    c.drawCentredString(L.CONTENT_R - s2 / 2, yy - s2 - 0.1 * inch, "(answer at the back)")


def level_up_page(book):
    c = book.new_page(role="section")
    L.centred(c, "Level Up!", L.CONTENT_T - 1.2 * inch, L.DISPLAY, 56)
    L.centred(c, "Now the puzzles are 6 x 6. Use the numbers 1 to 6.", L.CONTENT_T - 1.8 * inch, L.BODY_BOLD, 17)
    L.centred(c, "Each box is 2 rows tall and 3 squares wide.", L.CONTENT_T - 2.15 * inch, L.BODY, 16)
    size = 3.6 * inch
    x, y = (L.PAGE_W - size) / 2, L.CONTENT_T - 2.6 * inch - size
    cell = size / 6
    c.setFillGray(0.85)
    c.rect(x, y + size - 2 * cell, 3 * cell, 2 * cell, stroke=0, fill=1)
    c.setFillGray(0)
    SD.draw_sudoku(c, SD.Sudoku(6, [0] * 36, [0] * 36), x, y, size, thick=4.5, thin=1.6)
    c.setFont(L.BODY_BOLD, 13)
    c.drawCentredString(x + 1.5 * cell, y + size + 0.12 * inch, "one box")
    draw_icon(c, "rocket", L.CONTENT_L + 0.6 * inch, L.CONTENT_B + 0.9 * inch, 1.1 * inch, 4)
    draw_icon(c, "star", L.CONTENT_R - 0.6 * inch, L.CONTENT_B + 0.9 * inch, 1.0 * inch, 4)


def answer_pages(book, puzzles, extra=None):
    cols, rows = 3, 4
    per = cols * rows
    gw = L.CONTENT_W / cols
    gh = (L.CONTENT_H - 0.5 * inch) / rows
    size = min(gw, gh) - 0.55 * inch
    placements_by_page = {}
    items = ([extra] if extra else []) + puzzles
    for s0 in range(0, len(items), per):
        c = book.new_page(role="answers")
        c.setFont(L.DISPLAY, 24)
        c.drawCentredString(L.PAGE_W / 2, L.CONTENT_T - 0.3 * inch, "Answers")
        pl = []
        for k, (label, s) in enumerate(items[s0:s0 + per]):
            col, row = k % cols, k // cols
            x = L.CONTENT_L + col * gw + (gw - size) / 2
            y = L.CONTENT_T - 0.5 * inch - (row + 1) * gh + 0.15 * inch
            c.setFont(L.DISPLAY, 13)
            c.drawCentredString(x + size / 2, y + size + 0.1 * inch, label)
            SD.draw_sudoku(c, s, x, y, size, show_solution=True, thick=2.2, thin=0.7)
            pl.append((s, x, y, size))
        placements_by_page[book.page] = pl
    return placements_by_page


def make_your_own(book):
    c = book.new_page(role="back")
    L.centred(c, "Make Your Own Sudoku!", L.CONTENT_T - 0.5 * inch, L.DISPLAY, 32)
    L.centred(c, "Fill a whole grid first, then rub out some numbers and give it to a friend.",
              L.CONTENT_T - 0.95 * inch, L.BODY, 13)
    size = 3.2 * inch
    for k, n in enumerate((4, 4, 6, 6)):
        col, row = k % 2, k // 2
        x = L.CONTENT_L + 0.15 * inch + col * (L.CONTENT_W / 2)
        y = L.CONTENT_T - 1.35 * inch - (row + 1) * (size + 0.35 * inch)
        SD.draw_sudoku(c, SD.Sudoku(n, [0] * n * n, [0] * n * n), x, y, size, thick=3.5, thin=1.2)


def build(volume=1, out_dir="output"):
    rng = random.Random(f"{BOOK_ID}-vol{volume}")
    reg = Registry(BOOK_ID, volume)
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)

    puzzles, results = [], []
    for k in range(N4 + N6):
        n, clues, lvl, _ = plan(k)
        while True:
            s = SD.make_sudoku(rng, n, clues, max_level=lvl)
            if s.claim_in(reg, f"{BOOK_ID} v{volume} puzzle {k+1}"):
                break
        puzzles.append(s)
        results.append(s.verify())
    sample = SD.make_sudoku(random.Random(f"{BOOK_ID}-sample-{volume}"), 4, 10, max_level=0)

    L.title_page(book, META["title"] + suffix, META["subtitle"], META["tagline"],
                 decorate=lambda c: [draw_icon(c, nm, L.CONTENT_L + 0.55 * inch + k * (L.CONTENT_W - 1.1 * inch) / 5,
                                               L.CONTENT_B + 1.3 * inch, 0.8 * inch, 3.5)
                                     for k, nm in enumerate(["star", "rocket", "bee", "fish", "sun", "frog"])])
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, decorate=lambda c: [draw_icon(c, nm, x, y, 1.1 * inch, 4) for nm, x, y in (
        ("star", L.CONTENT_L + 0.9 * inch, L.CONTENT_T - 1.2 * inch),
        ("moon", L.CONTENT_R - 0.9 * inch, L.CONTENT_T - 1.2 * inch),
        ("bee", L.CONTENT_L + 1.0 * inch, L.CONTENT_B + 1.2 * inch),
        ("flower", L.CONTENT_R - 1.0 * inch, L.CONTENT_B + 1.2 * inch))])
    L.how_to_page(book, "How to Use This Book", [
        "Start with the picture page: it shows the three Sudoku rules.",
        "Puzzles 1 to 36 are small 4 x 4 grids. Then you level up to 6 x 6!",
        "Every puzzle has only one right answer, and you never need to guess.",
        "The stars show how tricky a puzzle is. They get harder as you go.",
        "Stuck? Look for a row, column or box with only one empty square.",
        "Check your answers at the back of the book.",
    ], tip="Sudoku builds logic, number sense and patience. Encourage a pencil and eraser, and "
           "celebrate effort: mistakes are how puzzle skills grow!")
    how_sudoku_works(book, sample)

    printed = {}
    for k in range(0, len(puzzles), 2):
        if k == N4:
            level_up_page(book)
        c = book.new_page(role="puzzle")
        pl = []
        for j, top in enumerate((L.CONTENT_T, L.CONTENT_T - 4.75 * inch)):
            if k + j < len(puzzles):
                pl.append(puzzle_block(c, puzzles[k + j], k + j + 1, top, k + j, plan(k + j)[3]))
        printed[book.page] = (pl, False)

    L.section_page(book, "Answers", "Check your work!")
    ans = answer_pages(book, [(f"Puzzle {k+1}", s) for k, s in enumerate(puzzles)],
                       extra=("Try it! page", sample))
    printed.update({p: (pl, True) for p, pl in ans.items()})
    certificate_page(book, f"You solved all {len(puzzles)} Sudoku puzzles!")
    book.pad_to_even(make_your_own)
    roles = book.page_roles
    book.save()
    reg.save()

    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    rep.check(f"{len(puzzles)} puzzles generated", len(puzzles) == N4 + N6,
              f"{N4} of 4x4, {N6} of 6x6")
    rep.check("Every solution grid is a valid Sudoku", all(r["valid_solution"] for r in results))
    rep.check("Every puzzle has exactly one solution (exhaustive search)", all(r["unique"] for r in results))
    rep.check("Every puzzle solvable by logic alone, no guessing (step-by-step solver)",
              all(r["logic_solves"] for r in results))
    clues4 = [r["clues"] for r in results[:N4]]
    clues6 = [r["clues"] for r in results[N4:]]
    rep.check("Gets harder: clues never increase within each section",
              clues4 == sorted(clues4, reverse=True) and clues6 == sorted(clues6, reverse=True),
              f"4x4: {clues4[0]} -> {clues4[-1]} clues; 6x6: {clues6[0]} -> {clues6[-1]} clues")
    n, clashes = reg.verify_unique()
    rep.check("No duplicate puzzles within this book or across other books (incl. digit-swapped "
              "and mirrored copies)", not clashes and n == len(puzzles),
              f"{n} puzzles; {len(reg.taken)} from other books checked")
    standard_checks(rep, path, roles)
    bad = {p: audit_sudoku_print(path, p, pl, sol) for p, (pl, sol) in printed.items()}
    bad = {p: v for p, v in bad.items() if v}
    rep.check("Printed digits match the verified puzzles and answers (PDF text re-read cell by cell)",
              not bad, f"{len(printed)} pages checked" if not bad else str(bad))
    return path, rep, {}
