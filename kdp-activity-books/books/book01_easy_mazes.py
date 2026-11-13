"""Book 1 - Easy Mazes for Kids, ages 4-6."""
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks.icons import STORY_PAIRS, draw_icon, Pen, star
from kdpbooks.mazes import make_grid_maze, draw_grid_maze
from kdpbooks.qa import Report, standard_checks, audit_grid_maze_pixels
from kdpbooks.registry import Registry

BOOK_ID = "book01-easy-mazes"
N_MAZES = 60
META = {
    "title": "Easy Mazes for Kids Ages 4-6",
    "subtitle": "60 Big, Fun Mazes to Build Pencil Control, Focus and Problem-Solving Skills",
    "tagline": "Start easy, finish proud!",
}


def level_size(i, n=N_MAZES):
    """Grid size grows gently from 4x4 to 12x10."""
    t = i / (n - 1)
    cols = round(4 + t * 8)
    rows = max(4, round(cols * 0.84))
    return cols, rows


def level_stars(i, n=N_MAZES):
    return 1 + (3 * i) // n


def draw_stars(c, x_right, y, filled, total=3, size=22):
    for k in range(total):
        cx = x_right - (total - 1 - k) * (size + 6) - size / 2
        p = Pen(c, cx, y, size, 1.8)
        if k < filled:
            c.setFillGray(0)
            pts = []
            import math
            for j in range(10):
                r = 0.95 if j % 2 == 0 else 0.42
                a = math.radians(90 + 36 * j)
                pts.append((r * math.cos(a), r * math.sin(a) - 0.05))
            p.poly(pts, gray=0.15)
        else:
            star(p)
        p.done()


def decorate_title(c):
    icons = ["bee", "flower", "bunny", "carrot", "rocket", "moon"]
    xs = [L.CONTENT_L + 0.55 * inch + k * (L.CONTENT_W - 1.1 * inch) / 5 for k in range(6)]
    for name, x in zip(icons, xs):
        draw_icon(c, name, x, L.CONTENT_B + 1.3 * inch, 0.85 * inch, 3.5)
    # a little sample maze motif at the top
    rng = random.Random(4242)
    m = make_grid_maze(rng, 6, 3)
    draw_grid_maze(c, m, L.PAGE_W / 2 - 1.5 * inch, L.CONTENT_T - 1.75 * inch, 3 * inch, 1.5 * inch, 4)


def decorate_belongs(c):
    draw_icon(c, "star", L.CONTENT_L + 0.9 * inch, L.CONTENT_T - 1.2 * inch, 1.1 * inch, 4)
    draw_icon(c, "sun", L.CONTENT_R - 0.9 * inch, L.CONTENT_T - 1.2 * inch, 1.2 * inch, 4)
    draw_icon(c, "snail", L.CONTENT_L + 1.0 * inch, L.CONTENT_B + 1.2 * inch, 1.2 * inch, 4)
    draw_icon(c, "frog", L.CONTENT_R - 1.0 * inch, L.CONTENT_B + 1.2 * inch, 1.2 * inch, 4)


def maze_page(book, idx, m, pair):
    c = book.new_page(role="puzzle")
    start_icon, goal_icon, prompt = pair
    top = L.CONTENT_T
    c.setFont(L.DISPLAY, 34)
    c.drawString(L.CONTENT_L, top - 0.45 * inch, f"Maze {idx}")
    draw_stars(c, L.CONTENT_R, top - 0.33 * inch, level_stars(idx - 1))
    c.setFont(L.BODY_BOLD, 19)
    c.drawString(L.CONTENT_L, top - 0.9 * inch, prompt)

    icon = 0.95 * inch
    box_top = top - 1.2 * inch - icon - 0.12 * inch
    box_bot = L.CONTENT_B + 0.25 * inch + icon + 0.12 * inch
    cell_guess = min(L.CONTENT_W / m.cols, (box_top - box_bot) / m.rows)
    lw = max(4.0, min(9.0, cell_guess * 0.1))
    geo = draw_grid_maze(c, m, L.CONTENT_L, box_bot, L.CONTENT_W, box_top - box_bot, lw)

    sx, sy = geo["start_xy"]
    gx, gy = geo["goal_xy"]
    draw_icon(c, start_icon, sx, sy + 0.12 * inch + icon / 2, icon, 4)
    draw_icon(c, goal_icon, gx, gy - 0.12 * inch - icon / 2, icon, 4)
    c.setFont(L.DISPLAY, 18)
    for (x, yy, label) in ((sx, sy + 0.12 * inch + icon / 2 - 7, "START"),
                           (gx, gy - 0.12 * inch - icon / 2 - 7, "FINISH")):
        if x < L.PAGE_W / 2:
            c.drawString(x + icon / 2 + 0.12 * inch, yy, label)
        else:
            c.drawRightString(x - icon / 2 - 0.12 * inch, yy, label)
    return geo


def answer_pages(book, mazes):
    per = 4
    cols, rows = 2, 2
    gap = 0.3 * inch
    cw = (L.CONTENT_W - gap) / cols
    ch = (L.CONTENT_H - 0.7 * inch - gap) / rows
    for start in range(0, len(mazes), per):
        c = book.new_page(role="answers")
        c.setFont(L.DISPLAY, 24)
        c.drawCentredString(L.PAGE_W / 2, L.CONTENT_T - 0.3 * inch, "Answers")
        for k, (idx, m) in enumerate(mazes[start:start + per]):
            col, row = k % cols, k // cols
            x = L.CONTENT_L + col * (cw + gap)
            y = L.CONTENT_T - 0.7 * inch - (row + 1) * ch - row * gap
            c.setFont(L.DISPLAY, 16)
            c.drawCentredString(x + cw / 2, y + ch - 0.22 * inch, f"Maze {idx}")
            draw_grid_maze(c, m, x + 0.15 * inch, y + 0.1 * inch, cw - 0.3 * inch,
                           ch - 0.45 * inch, 2.2, solution=True)


def certificate_page(book):
    c = book.new_page(role="back")
    w, h = L.CONTENT_W - 0.3 * inch, 6.2 * inch
    x, y = (L.PAGE_W - w) / 2, (L.PAGE_H - h) / 2
    L.rounded_frame(c, x, y, w, h, r=30, lw=6)
    L.rounded_frame(c, x + 14, y + 14, w - 28, h - 28, r=22, lw=1.5, dash=(6, 5))
    L.centred(c, "Great Job!", y + h - 1.2 * inch, L.DISPLAY, 54)
    L.centred(c, "You finished all 60 mazes!", y + h - 1.75 * inch, L.BODY_BOLD, 20)
    c.setLineWidth(2.5)
    c.line(x + 1.0 * inch, y + 2.4 * inch, x + w - 1.0 * inch, y + 2.4 * inch)
    L.centred(c, "name", y + 2.1 * inch, L.BODY, 13, gray=0.3)
    c.line(x + 2.0 * inch, y + 1.25 * inch, x + w - 2.0 * inch, y + 1.25 * inch)
    L.centred(c, "date", y + 0.95 * inch, L.BODY, 13, gray=0.3)
    for k, name in enumerate(["star", "heart", "star"]):
        draw_icon(c, name, L.PAGE_W / 2 + (k - 1) * 1.3 * inch, y + h - 2.8 * inch, 0.9 * inch, 4)


def draw_your_own_page(book):
    c = book.new_page(role="back")
    L.centred(c, "Make Your Own Maze!", L.CONTENT_T - 0.5 * inch, L.DISPLAY, 34)
    L.centred(c, "Connect the dots to draw walls. Then ask a grown-up to try it!",
              L.CONTENT_T - 0.95 * inch, L.BODY, 15)
    n_c, n_r = 8, 9
    sp = 0.78 * inch
    x0 = L.PAGE_W / 2 - (n_c - 1) * sp / 2
    y0 = L.CONTENT_T - 1.6 * inch
    c.setFillGray(0)
    for r in range(n_r + 1):
        for k in range(n_c):
            c.circle(x0 + k * sp, y0 - r * sp, 3.5, stroke=0, fill=1)


def build(volume=1, out_dir="output"):
    import os
    rng = random.Random(f"{BOOK_ID}-vol{volume}")
    reg = Registry(BOOK_ID, volume)
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)

    # ---- generate & verify all mazes first ----
    mazes, verification = [], []
    for i in range(N_MAZES):
        cols, rows = level_size(i)
        while True:
            m = make_grid_maze(rng, cols, rows, straight_bias=0.35 - 0.25 * i / N_MAZES)
            if m.claim_in(reg, f"{BOOK_ID} v{volume} maze {i+1}"):
                break
        mazes.append((i + 1, m))
        verification.append(m.verify())

    # ---- front matter ----
    L.title_page(book, META["title"] + suffix, "60 Big, Fun Mazes", META["tagline"],
                 decorate=decorate_title)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, decorate=decorate_belongs)
    L.how_to_page(book, "How to Use This Book", [
        "Find the picture at the START. Put your pencil or crayon there.",
        "Draw a line along the white path. Try not to cross any black lines!",
        "Keep going until you reach the picture at the FINISH.",
        "Stuck? Go back and try another way. Every maze has one way through.",
        "The stars show how tricky a maze is. The mazes get a little harder as you go.",
        "When you are done, color in the pictures!",
    ], tip="Let your child use a crayon or a thick pencil. Mazes build pencil control, patience and "
           "planning. Answers are at the back of the book if anyone gets stuck.")

    # ---- puzzles ----
    geos = {}
    for idx, m in mazes:
        pair = STORY_PAIRS[(idx - 1) % len(STORY_PAIRS)]
        geo = maze_page(book, idx, m, pair)
        geos[book.page] = (geo, m)

    # ---- answers & back matter ----
    L.section_page(book, "Answers", "Peek only if you are stuck!")
    answer_pages(book, mazes)
    certificate_page(book)
    book.pad_to_even(draw_your_own_page)
    roles = book.page_roles
    book.save()
    reg.save()

    # ---- QA ----
    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    rep.check(f"{N_MAZES} mazes generated", len(mazes) == N_MAZES)
    rep.check("Every maze: all cells reachable",
              all(v["all_cells_reachable"] for v in verification))
    rep.check("Every maze: passages form a tree (no loops)", all(v["is_tree"] for v in verification))
    rep.check("Every maze: exactly one solution (path search)",
              all(v["solutions"] == 1 for v in verification))
    rep.check("Every maze: exactly 2 border openings (start, finish)",
              all(m.border_openings() == 2 for _, m in mazes))
    n, clashes = reg.verify_unique()
    rep.check("No duplicate mazes within this book or across other books",
              len({m.fingerprint() for _, m in mazes}) == N_MAZES and not clashes,
              f"{n} mazes; {len(reg.taken)} from other books checked; mirror images and "
              f"near-copies (<40% walls different) rejected: {reg.rejected_exact + reg.rejected_near}")

    audits = {}

    def hook(pno, img):
        if pno in geos:
            geo, m = geos[pno]
            audits[pno] = audit_grid_maze_pixels(img, geo, m)

    standard_checks(rep, path, roles, page_hook=hook)
    bad = {p: v for p, v in audits.items() if v}
    rep.check("Printed mazes match verified data (pixel re-read of every wall)",
              len(audits) == N_MAZES and not bad,
              f"{len(audits)} maze pages re-read" if not bad else str(bad))
    return path, rep, {"maze_pages": sorted(geos), "answer_start": max(geos) + 2}
