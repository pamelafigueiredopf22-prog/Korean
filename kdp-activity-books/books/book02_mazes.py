"""Book 2 - Mazes for Kids, ages 6-8: square, circular and shape mazes."""
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks import mazebook as MB
from kdpbooks.icons import STORY_PAIRS, draw_icon
from kdpbooks.mazes import (SHAPE_ASPECT, SHAPE_LABELS, CircleMaze, draw_maze,
                            make_circle_maze, make_grid_maze, make_shape_maze)
from kdpbooks.qa import Report
from kdpbooks.registry import Registry

BOOK_ID = "book02-mazes-6-8"
N_MAZES = 72
NEAR_DIFF = 0.4
META = {
    "title": "Mazes for Kids Ages 6-8",
    "subtitle": "72 Fun Square, Circle and Shape Mazes",
    "tagline": "From warm-up to brain-buster!",
}
SHAPE_ORDER = ["heart", "star", "house", "fish", "tree", "cloud", "diamond"]
TYPE_CYCLE = ["grid", "circle", "grid", "shape"]       # 36 square, 18 circle, 18 shape


def plan(i, n=N_MAZES):
    """(kind, size params, branchiness, stars) for maze i - difficulty rises through the book."""
    t = i / (n - 1)
    kind = TYPE_CYCLE[i % len(TYPE_CYCLE)]
    branch = 0.08 + 0.3 * t
    stars = 1 + (3 * i) // n
    if kind == "grid":
        cols = round(9 + t * 11)                 # 9 -> 20 columns
        return kind, {"cols": cols, "rows": round(cols * 0.92)}, branch, stars
    if kind == "circle":
        return kind, {"rings": round(6 + t * 6)}, branch, stars    # 6 -> 12 rings
    shape = SHAPE_ORDER[(i // 4) % len(SHAPE_ORDER)]
    cols = round(18 + t * 8)                     # 18 -> 26 columns
    return kind, {"shape": shape, "cols": cols,
                  "rows": round(cols * SHAPE_ASPECT.get(shape, 1.0))}, branch, stars


def generate(rng, i):
    kind, p, branch, _ = plan(i)
    if kind == "grid":
        return make_grid_maze(rng, p["cols"], p["rows"], straight_bias=0.0,
                              min_path_frac=0.2, branchiness=branch)
    if kind == "circle":
        return make_circle_maze(rng, p["rings"], branchiness=branch)
    return make_shape_maze(rng, p["shape"], p["cols"], p["rows"], branchiness=branch)


def decorate_title(c):
    m = make_circle_maze(random.Random("book02-title"), 5)
    draw_maze(c, m, L.PAGE_W / 2 - 1.1 * inch, L.CONTENT_T - 2.3 * inch, 2.2 * inch, 2.2 * inch, 3.5)
    icons = ["rocket", "fish", "bee", "kite", "frog", "star"]
    xs = [L.CONTENT_L + 0.55 * inch + k * (L.CONTENT_W - 1.1 * inch) / 5 for k in range(6)]
    for name, x in zip(icons, xs):
        draw_icon(c, name, x, L.CONTENT_B + 1.3 * inch, 0.8 * inch, 3.5)


def decorate_belongs(c):
    draw_icon(c, "rocket", L.CONTENT_L + 0.9 * inch, L.CONTENT_T - 1.2 * inch, 1.2 * inch, 4)
    draw_icon(c, "moon", L.CONTENT_R - 0.9 * inch, L.CONTENT_T - 1.2 * inch, 1.1 * inch, 4)
    draw_icon(c, "boat", L.CONTENT_L + 1.0 * inch, L.CONTENT_B + 1.2 * inch, 1.2 * inch, 4)
    draw_icon(c, "island", L.CONTENT_R - 1.0 * inch, L.CONTENT_B + 1.2 * inch, 1.2 * inch, 4)


def build(volume=1, out_dir="output"):
    rng = random.Random(f"{BOOK_ID}-vol{volume}")
    reg = Registry(BOOK_ID, volume)
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)

    mazes, verification = [], []
    for i in range(N_MAZES):
        while True:
            m = generate(rng, i)
            if m.claim_in(reg, f"{BOOK_ID} v{volume} maze {i+1}", NEAR_DIFF):
                break
        mazes.append((i + 1, m))
        verification.append(m.verify())

    L.title_page(book, META["title"] + suffix, META["subtitle"], META["tagline"],
                 decorate=decorate_title)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, decorate=decorate_belongs)
    L.how_to_page(book, "How to Use This Book", [
        "Start at the picture marked START and draw a line along the white paths.",
        "You can't cross a black wall. If you reach a dead end, go back and try another way.",
        "Square mazes and shape mazes end at the FINISH picture at the bottom.",
        "Circle mazes start at the top. Your goal is the picture in the very middle!",
        "There is exactly one path through every maze, and the stars show how hard it is. "
        "The mazes get trickier as you go.",
        "Try a pencil first so you can erase. All the answers are at the back.",
    ], tip="Mazes train planning, focus and fine-motor control. If a maze feels too hard, try "
           "tracing backwards from the FINISH, a great problem-solving strategy to teach!")

    geos = {}
    for idx, m in mazes:
        kind, p, _, stars = plan(idx - 1)
        pair = STORY_PAIRS[(idx * 5) % len(STORY_PAIRS)]
        prompt = None
        if kind == "shape":
            prompt = f"{SHAPE_LABELS[p['shape']]} maze! {pair[2]}"
        elif kind == "circle":
            prompt = f"Circle maze! {pair[2]}"
        geo = MB.maze_page(book, idx, m, pair, stars, prompt=prompt,
                           icon=0.8 * inch, lw_range=(2.6, 6.0))
        geos[book.page] = (geo, m)

    L.section_page(book, "Answers", "Try your best before you peek!")
    MB.answer_pages(book, mazes, per=4, lw=1.6)
    MB.certificate_page(book, f"You solved all {N_MAZES} mazes!")
    book.pad_to_even(MB.draw_your_own_page)
    roles = book.page_roles
    book.save()
    reg.save()

    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    kinds = [plan(i)[0] for i in range(N_MAZES)]
    rep.check("Mix of maze types", True, ", ".join(f"{kinds.count(k)} {k}" for k in
                                                     ("grid", "circle", "shape")))
    MB.maze_qa(rep, mazes, reg, verification, geos, path, roles, int(NEAR_DIFF * 100))
    sizes = [len(m.cells) for _, m in mazes]
    rep.check("Difficulty rises through the book (cells per maze, first->last quarter)",
              sum(sizes[:18]) < sum(sizes[18:36]) < sum(sizes[36:54]) < sum(sizes[54:]),
              f"avg {sum(sizes[:18])//18} -> {sum(sizes[18:36])//18} -> "
              f"{sum(sizes[36:54])//18} -> {sum(sizes[54:])//18} cells")
    return path, rep, {}
