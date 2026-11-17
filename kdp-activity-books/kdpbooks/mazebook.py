"""Reusable pieces for maze books: puzzle page, answer pages, certificate, QA."""
import math

from reportlab.lib.units import inch

from . import layout as L
from .icons import Pen, draw_icon, star
from .mazes import CircleMaze, draw_maze
from .qa import audit_maze_pixels, standard_checks


def draw_stars(c, x_right, y, filled, total=3, size=22):
    for k in range(total):
        cx = x_right - (total - 1 - k) * (size + 6) - size / 2
        p = Pen(c, cx, y, size, 1.8)
        if k < filled:
            pts = []
            for j in range(10):
                r = 0.95 if j % 2 == 0 else 0.42
                a = math.radians(90 + 36 * j)
                pts.append((r * math.cos(a), r * math.sin(a) - 0.05))
            p.poly(pts, gray=0.15)
        else:
            star(p)
        p.done()


def wall_width(m, geo, lo, hi, frac=0.11):
    unit = geo["unit"] if isinstance(m, CircleMaze) else geo["cell"]
    return max(lo, min(hi, unit * frac))


def maze_page(book, idx, m, pair, stars, heading=None, prompt=None,
              icon=0.85 * inch, lw_range=(2.6, 9.0)):
    """One maze per page: title, prompt, star level, start/finish pictures."""
    c = book.new_page(role="puzzle")
    start_icon, goal_icon, story = pair
    top = L.CONTENT_T
    c.setFont(L.DISPLAY, 34)
    c.drawString(L.CONTENT_L, top - 0.45 * inch, heading or f"Maze {idx}")
    draw_stars(c, L.CONTENT_R, top - 0.33 * inch, stars)
    text = prompt or story
    c.setFont(L.BODY_BOLD, L.fit_size(text, L.BODY_BOLD, 19, L.CONTENT_W))
    c.drawString(L.CONTENT_L, top - 0.9 * inch, text)

    circle = isinstance(m, CircleMaze)
    box_top = top - 1.2 * inch - icon - 0.12 * inch
    box_bot = L.CONTENT_B + 0.25 * inch + (0 if circle else icon + 0.12 * inch)
    box = (L.CONTENT_L, box_bot, L.CONTENT_W, box_top - box_bot)

    # first pass to learn the scale, then draw with the right wall width
    from reportlab.pdfgen.canvas import Canvas
    import io
    probe = draw_maze(Canvas(io.BytesIO()), m, *box, 1)
    lw = wall_width(m, probe, *lw_range)
    geo = draw_maze(c, m, *box, lw)

    sx, sy = geo["start_xy"]
    draw_icon(c, start_icon, sx, sy + 0.12 * inch + icon / 2, icon, 4)
    labels = [(sx, sy + 0.12 * inch + icon / 2 - 7, "START")]
    if circle:
        draw_icon(c, goal_icon, geo["cx"], geo["cy"], geo["core"] * 1.45, 3.5)
    else:
        gx, gy = geo["goal_xy"]
        draw_icon(c, goal_icon, gx, gy - 0.12 * inch - icon / 2, icon, 4)
        labels.append((gx, gy - 0.12 * inch - icon / 2 - 7, "FINISH"))
    c.setFont(L.DISPLAY, 18)
    for x, yy, label in labels:
        if x <= L.PAGE_W / 2:
            c.drawString(x + icon / 2 + 0.12 * inch, yy, label)
        else:
            c.drawRightString(x - icon / 2 - 0.12 * inch, yy, label)
    return geo


def answer_pages(book, mazes, per=4, lw=2.0):
    cols = 2
    rows = math.ceil(per / cols)
    gap = 0.3 * inch
    cw = (L.CONTENT_W - gap) / cols
    ch = (L.CONTENT_H - 0.7 * inch - gap * (rows - 1)) / rows
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
            draw_maze(c, m, x + 0.15 * inch, y + 0.1 * inch, cw - 0.3 * inch,
                      ch - 0.45 * inch, lw, solution=True)


def certificate_page(book, line):
    c = book.new_page(role="back")
    w, h = L.CONTENT_W - 0.3 * inch, 6.2 * inch
    x, y = (L.PAGE_W - w) / 2, (L.PAGE_H - h) / 2
    L.rounded_frame(c, x, y, w, h, r=30, lw=6)
    L.rounded_frame(c, x + 14, y + 14, w - 28, h - 28, r=22, lw=1.5, dash=(6, 5))
    L.centred(c, "Great Job!", y + h - 1.2 * inch, L.DISPLAY, 54)
    L.centred(c, line, y + h - 1.75 * inch, L.BODY_BOLD, 20)
    c.setLineWidth(2.5)
    c.line(x + 1.0 * inch, y + 2.4 * inch, x + w - 1.0 * inch, y + 2.4 * inch)
    L.centred(c, "name", y + 2.1 * inch, L.BODY, 13, gray=0.3)
    c.line(x + 2.0 * inch, y + 1.25 * inch, x + w - 2.0 * inch, y + 1.25 * inch)
    L.centred(c, "date", y + 0.95 * inch, L.BODY, 13, gray=0.3)
    for k, name in enumerate(["star", "heart", "star"]):
        draw_icon(c, name, L.PAGE_W / 2 + (k - 1) * 1.3 * inch, y + h - 2.8 * inch, 0.9 * inch, 4)


def draw_your_own_page(book, n_c=10, n_r=11, sp=0.62 * inch):
    c = book.new_page(role="back")
    L.centred(c, "Make Your Own Maze!", L.CONTENT_T - 0.5 * inch, L.DISPLAY, 34)
    L.centred(c, "Connect the dots to draw walls. Then challenge a friend!",
              L.CONTENT_T - 0.95 * inch, L.BODY, 15)
    x0 = L.PAGE_W / 2 - (n_c - 1) * sp / 2
    y0 = L.CONTENT_T - 1.6 * inch
    c.setFillGray(0)
    for r in range(n_r + 1):
        for k in range(n_c):
            c.circle(x0 + k * sp, y0 - r * sp, 3.2, stroke=0, fill=1)


def maze_qa(rep, mazes, reg, verification, geos, path, roles, near_pct):
    """All maze-book checks.  geos: page_no -> (geo, maze)."""
    n = len(mazes)
    rep.check(f"{n} mazes generated", n == len(verification))
    rep.check("Every maze: all cells reachable", all(v["all_cells_reachable"] for v in verification))
    rep.check("Every maze: passages form a tree (no loops)", all(v["is_tree"] for v in verification))
    rep.check("Every maze: exactly one solution (independent path search)",
              all(v["solutions"] == 1 for v in verification))
    rep.check("Every maze: openings only at START (and FINISH for non-circular)",
              all(m.border_openings() == (1 if isinstance(m, CircleMaze) else 2) for _, m in mazes))
    nreg, clashes = reg.verify_unique()
    rep.check("No duplicate mazes within this book or across other books",
              len({m.fingerprint() for _, m in mazes}) == n and not clashes,
              f"{nreg} mazes; {len(reg.taken)} from other books checked; exact/mirror/near-copies "
              f"(<{near_pct}% walls different) rejected and regenerated: "
              f"{reg.rejected_exact + reg.rejected_near}")
    audits = {}

    def hook(pno, img):
        if pno in geos:
            geo, m = geos[pno]
            audits[pno] = audit_maze_pixels(img, m, geo)

    standard_checks(rep, path, roles, page_hook=hook)
    bad = {p: v for p, v in audits.items() if v}
    rep.check("Printed mazes match verified data (pixel re-read of every wall)",
              len(audits) == n and not bad,
              f"{len(audits)} maze pages re-read" if not bad else str(bad))
