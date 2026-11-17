"""Book 6 - Sudoku for Teens: 100 9x9 puzzles, Easy -> Expert, graded by technique."""
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks import sudoku as SD
from kdpbooks.qa import Report, audit_sudoku_print, standard_checks
from kdpbooks.registry import Registry

BOOK_ID = "book06-sudoku-teens"
META = {
    "title": "Sudoku for Teens",
    "subtitle": "100 Puzzles from Easy to Expert, with Solving Tips and Answers",
    "tagline": "Every puzzle has one solution. No guessing required.",
}
H = L.HEAVY
# name, count, clue range (first -> last), allowed logic levels (see SD.TECHNIQUES)
LEVELS = [("EASY", 25, (38, 34), (0, 1)),
          ("MEDIUM", 30, (32, 29), (2, 2)),
          ("HARD", 25, (28, 27), (3, 4)),
          ("EXPERT", 20, (26, 25), (5, 6))]


def plan():
    out = []
    for name, count, (c0, c1), (lo, hi) in LEVELS:
        for j in range(count):
            t = j / max(1, count - 1)
            out.append((name, round(c0 + (c1 - c0) * t), lo, hi))
    return out


def gen(rng, clues, lo, hi):
    while True:
        try:
            return SD.make_sudoku(rng, 9, clues, max_level=hi, min_level=lo, symmetric=True, tries=40)
        except RuntimeError:
            continue


def pill(c, x_right, y, text):
    c.setFont(L.BODY_BOLD, 11)
    w = c.stringWidth(text, L.BODY_BOLD, 11) + 18
    c.setLineWidth(1.2)
    c.roundRect(x_right - w, y - 6, w, 20, 10, stroke=1, fill=0)
    c.drawCentredString(x_right - w / 2, y, text)


def puzzle_block(c, s, idx, level, top):
    size = 4.05 * inch
    x = (L.PAGE_W - size) / 2
    c.setFont(H, 18)
    c.drawString(x, top - 0.22 * inch, f"Puzzle {idx}")
    pill(c, x + size, top - 0.2 * inch, level)
    c.setFont(L.BODY, 10)
    c.setFillGray(0.35)
    c.drawString(x + c.stringWidth(f"Puzzle {idx}", H, 18) + 14, top - 0.2 * inch, "Time: ________")
    c.setFillGray(0)
    y = top - 0.38 * inch - size
    SD.draw_sudoku(c, s, x, y, size, thick=3.0, thin=0.8, given_frac=0.6)
    return (s, x, y, size)


def techniques_page(book):
    c = book.new_page(role="front")
    L.centred(c, "Solving Techniques", L.CONTENT_T - 0.6 * inch, H, 34)
    items = [
        ("Naked single  (Easy)", "A square where only one number is still possible. Check its row, column and box."),
        ("Hidden single  (Easy)", "A number that fits in only one square of a row, column or box, even if that "
                                 "square has other options."),
        ("Pointing  (Medium)", "If a number's only spots inside a box all sit in one row (or column), it can't go "
                               "anywhere else in that row outside the box."),
        ("Naked / hidden pairs  (Hard)", "Two squares in a unit that can only hold the same two numbers: remove those "
                                         "numbers from the rest of the unit. Hidden pairs work the other way round."),
        ("Triples and X-Wing  (Expert)", "Three squares sharing three candidates act like a pair. In an X-Wing a number's "
                                         "only spots in two rows line up in two columns, clearing those columns."),
    ]
    y = L.CONTENT_T - 1.25 * inch
    for title, text in items:
        c.setFont(L.BODY_BOLD, 17)
        c.drawString(L.CONTENT_L + 0.2 * inch, y, title)
        y = L.paragraph(c, text, L.CONTENT_L + 0.2 * inch, y - 0.34 * inch, L.CONTENT_W - 0.4 * inch,
                        L.BODY, 14) - 0.3 * inch
    y -= 0.1 * inch
    c.setLineWidth(1.2)
    c.roundRect(L.CONTENT_L + 0.2 * inch, y - 1.45 * inch, L.CONTENT_W - 0.4 * inch, 1.5 * inch, 12)
    c.setFont(L.BODY_BOLD, 16)
    c.drawString(L.CONTENT_L + 0.45 * inch, y - 0.3 * inch, "Pencil marks")
    L.paragraph(c, "On harder puzzles, write small candidate numbers in the corners of empty squares and "
                   "erase them as you go. Every puzzle in this book can be solved with the techniques on "
                   "this page, with no guessing.", L.CONTENT_L + 0.45 * inch, y - 0.62 * inch,
                L.CONTENT_W - 0.9 * inch, L.BODY, 13.5)


def answer_pages(book, puzzles):
    cols, rows = 2, 3
    gw = L.CONTENT_W / cols
    gh = (L.CONTENT_H - 0.45 * inch) / rows
    size = min(gw - 0.5 * inch, gh - 0.45 * inch)
    out = {}
    for s0 in range(0, len(puzzles), cols * rows):
        c = book.new_page(role="answers")
        c.setFont(H, 20)
        c.drawCentredString(L.PAGE_W / 2, L.CONTENT_T - 0.25 * inch, "Answers")
        pl = []
        for k, (idx, s) in enumerate(puzzles[s0:s0 + cols * rows]):
            col, row = k % cols, k // cols
            x = L.CONTENT_L + col * gw + (gw - size) / 2
            y = L.CONTENT_T - 0.45 * inch - (row + 1) * gh + 0.1 * inch
            c.setFont(L.BODY_BOLD, 11)
            c.drawCentredString(x + size / 2, y + size + 0.08 * inch, f"Puzzle {idx}")
            SD.draw_sudoku(c, s, x, y, size, show_solution=True, thick=1.8, thin=0.5, given_frac=0.6)
            pl.append((s, x, y, size))
        out[book.page] = pl
    return out


def log_page(book, n):
    c = book.new_page(role="back")
    L.centred(c, "Puzzle Log", L.CONTENT_T - 0.4 * inch, H, 28)
    L.centred(c, "Tick each puzzle and record your time. Can you beat your best?",
              L.CONTENT_T - 0.72 * inch, L.BODY, 12)
    cols, per = 4, 25
    cw = L.CONTENT_W / cols
    rh = (L.CONTENT_H - 1.1 * inch) / per
    c.setLineWidth(0.6)
    for k in range(n):
        col, row = k // per, k % per
        x = L.CONTENT_L + col * cw
        y = L.CONTENT_T - 1.1 * inch - (row + 1) * rh + rh * 0.3
        c.rect(x + 4, y, 9, 9)
        c.setFont(L.BODY, 10)
        c.drawString(x + 20, y + 1, f"{k + 1}")
        c.line(x + 48, y, x + cw - 12, y)


def build(volume=1, out_dir="output"):
    rng = random.Random(f"{BOOK_ID}-vol{volume}")
    reg = Registry(BOOK_ID, volume)
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)

    steps = plan()
    puzzles, results = [], []
    for k, (name, clues, lo, hi) in enumerate(steps):
        while True:
            s = gen(rng, clues, lo, hi)
            if s.claim_in(reg, f"{BOOK_ID} v{volume} puzzle {k+1}"):
                break
        puzzles.append(s)
        results.append(s.verify())

    def deco(c):
        s = puzzles[0]
        SD.draw_sudoku(c, s, L.PAGE_W / 2 - 1.5 * inch, L.CONTENT_B + 0.4 * inch, 3.0 * inch,
                       thick=2.5, thin=0.7)
    L.title_page(book, META["title"] + suffix, META["subtitle"], META["tagline"], decorate=deco, font=H)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, font=H)
    L.how_to_page(book, "How to Play", [
        "Fill the grid so every row, every column and every 3 x 3 box contains the digits 1 to 9 exactly once.",
        "Puzzles go from EASY (1-25) to MEDIUM (26-55), HARD (56-80) and EXPERT (81-100).",
        "Each level needs a new technique. They are explained on the next page.",
        "Every puzzle has exactly one solution and can be solved by logic alone.",
        "Record your time under each puzzle and in the Puzzle Log at the back. Answers follow the puzzles.",
    ], tip="Work in pencil. When you get stuck, scan each digit 1-9 across all nine boxes before "
           "reaching for pencil marks. It's surprising how often a hidden single is waiting.",
        font=H, tip_title="Pro tip", size=15)
    techniques_page(book)

    printed = {}
    for k in range(0, len(puzzles), 2):
        c = book.new_page(role="puzzle")
        pl = []
        for j, top in enumerate((L.CONTENT_T, L.CONTENT_T - 4.75 * inch)):
            pl.append(puzzle_block(c, puzzles[k + j], k + j + 1, steps[k + j][0], top))
        printed[book.page] = (pl, False)
    L.section_page(book, "Answers", font=H)
    ans = answer_pages(book, list(enumerate(puzzles, 1)))
    printed.update({p: (pl, True) for p, pl in ans.items()})
    book.pad_to_even(lambda b: log_page(b, len(puzzles)))
    roles = book.page_roles
    book.save()
    reg.save()

    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    rep.check(f"{len(puzzles)} puzzles generated", len(puzzles) == 100,
              ", ".join(f"{c} {n.lower()}" for n, c, _, _ in LEVELS))
    rep.check("Every solution grid is a valid Sudoku", all(r["valid_solution"] for r in results))
    rep.check("Every puzzle has exactly one solution (exhaustive search)", all(r["unique"] for r in results))
    rep.check("Every puzzle solvable by logic alone, no guessing", all(r["logic_solves"] for r in results))
    ok_lv = all(lo <= r["level"] <= hi for r, (_, _, lo, hi) in zip(results, steps))
    by = {}
    for r, (name, *_ ) in zip(results, steps):
        by.setdefault(name, []).append(r)
    rep.check("Each level needs the techniques it is labelled with (graded by the logic solver)", ok_lv,
              "; ".join(f"{n.lower()}: {min(r['clues'] for r in v)}-{max(r['clues'] for r in v)} clues, "
                        f"hardest step '{SD.TECHNIQUES[max(r['level'] for r in v)]}'" for n, v in by.items()))
    rep.check("Givens are rotationally symmetric (classic look)",
              all(all(bool(s.givens[i]) == bool(s.givens[80 - i]) for i in range(81)) for s in puzzles))
    n, clashes = reg.verify_unique()
    rep.check("No duplicate puzzles within this book or across other books (incl. digit-swapped "
              "and transposed copies)", not clashes and n == len(puzzles),
              f"{n} puzzles; {len(reg.taken)} from other books checked")
    standard_checks(rep, path, roles)
    bad = {p: audit_sudoku_print(path, p, pl, sol) for p, (pl, sol) in printed.items()}
    bad = {p: v for p, v in bad.items() if v}
    rep.check("Printed digits match the verified puzzles and answers (PDF text re-read cell by cell)",
              not bad, f"{len(printed)} pages checked" if not bad else str(bad))
    return path, rep, {}
