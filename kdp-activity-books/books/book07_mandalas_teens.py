"""Book 7 - Mandala Coloring Book for Teens: 40 unique mandalas, varied symmetry."""
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks import mandala as MD
from kdpbooks.qa import Report, colorable_regions, render_pages, standard_checks
from kdpbooks.registry import Registry

BOOK_ID = "book07-mandalas-teens"
META = {
    "title": "Mandala Coloring Book for Teens",
    "subtitle": "40 Unique Mandalas for Relaxation, Focus and Creativity",
    "tagline": "Single-sided pages, so markers never bleed onto the next design",
}
N = 40
H = L.HEAVY
SYMS = [5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24]
FRAMES = ["none", "corners_frame", "none", "frame", "none", "corners_frame"]


def design(rng, i):
    sym = SYMS[i % len(SYMS)] if i < len(SYMS) else rng.choice(SYMS)
    R = 3.45 * inch
    rec = MD.make_recipe(rng, R, sym, 0.22 * inch, 0.55 * inch)
    rec["frame_style"] = FRAMES[i % len(FRAMES)]
    rec["corner"] = MD.make_recipe(rng, 1.3 * inch, rng.choice([6, 8, 12]), 0.26 * inch, 0.42 * inch,
                                   motif_pool=["petal", "round_petal", "scallop", "arch", "drop"])
    for b in rec["corner"]["bands"]:
        b["back"] = False
    return rec


def draw_page(c, rec):
    cx, cy = L.PAGE_W / 2, L.PAGE_H / 2
    style = rec["frame_style"]
    box = (L.CONTENT_L, L.CONTENT_B + 0.2 * inch, L.CONTENT_W, L.CONTENT_H - 0.2 * inch)
    if "corners" in style:
        c.saveState()
        p = c.beginPath()
        p.roundRect(box[0] + 6, box[1] + 6, box[2] - 12, box[3] - 12, 14)
        c.clipPath(p, stroke=0)
        for x, y in ((box[0], box[1]), (box[0] + box[2], box[1]), (box[0], box[1] + box[3]),
                     (box[0] + box[2], box[1] + box[3])):
            MD.draw_mandala(c, rec["corner"], x, y, lw=1.1)
        c.restoreState()
    if "frame" in style:
        c.setLineWidth(1.6)
        c.roundRect(*box, 18, stroke=1, fill=0)
        c.setLineWidth(0.9)
        c.roundRect(box[0] + 6, box[1] + 6, box[2] - 12, box[3] - 12, 14, stroke=1, fill=0)
    MD.draw_mandala(c, rec, cx, cy, lw=1.25)


def color_test_page(book):
    c = book.new_page(role="coloring")
    L.centred(c, "Color Test Page", L.CONTENT_T - 0.5 * inch, H, 30)
    L.centred(c, "Try your pens, pencils and markers here before you start.", L.CONTENT_T - 0.85 * inch,
              L.BODY, 13)
    rng = random.Random("book07-test")
    cols, rows = 5, 6
    cw = L.CONTENT_W / cols
    rh = (L.CONTENT_H - 1.3 * inch) / rows
    for r in range(rows):
        for k in range(cols):
            x = L.CONTENT_L + k * cw + cw / 2
            y = L.CONTENT_T - 1.3 * inch - (r + 0.5) * rh
            c.setLineWidth(1.3)
            c.circle(x, y, min(cw, rh) * 0.4, stroke=1, fill=0)
            c.setLineWidth(0.8)
            c.line(x - 40, y - min(cw, rh) * 0.48, x + 40, y - min(cw, rh) * 0.48)


def build(volume=1, out_dir="output"):
    rng = random.Random(f"{BOOK_ID}-vol{volume}")
    reg = Registry(BOOK_ID, volume)
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)

    recs = []
    for i in range(N):
        while True:
            rec = design(rng, i)
            if reg.claim(MD.recipe_fingerprint(rec), f"{BOOK_ID} v{volume} mandala {i+1}",
                         alt_fps=(MD.recipe_skeleton(rec),)):
                break
        recs.append(rec)

    def deco(c):
        small = MD.make_recipe(random.Random("b7title"), 1.5 * inch, 12, 0.2 * inch, 0.35 * inch)
        MD.draw_mandala(c, small, L.PAGE_W / 2, L.CONTENT_B + 2.0 * inch, lw=1.0)
    L.title_page(book, META["title"] + suffix, META["subtitle"], META["tagline"], decorate=deco, font=H)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, font=H)
    L.how_to_page(book, "How to Use This Book", [
        "Every mandala is printed on its own page with a blank back, so markers and gel pens won't spoil "
        "the next design.",
        "Slip a sheet of card behind the page you're coloring for extra protection.",
        "Start in the centre and work outwards, or pick one colour per ring. There is no wrong way.",
        "Try your pens on the Color Test Page first.",
        "Each design is unique: different symmetry, rings and patterns on every page.",
    ], tip="Coloring mandalas is a great way to unwind. Put on some music, slow down and let the "
           "repeating patterns do the rest.", font=H, tip_title="Take a breath", size=15)
    color_test_page(book)
    book.blank_page()
    coloring_pages = []
    for rec in recs:
        c = book.new_page(role="coloring")
        draw_page(c, rec)
        coloring_pages.append(book.page)
        book.blank_page()
    roles = book.page_roles
    book.save()
    reg.save()

    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    rep.check(f"{N} mandalas", len(recs) == N)
    syms = sorted({r["sym"] for r in recs})
    rep.check("Varied symmetry", len(syms) >= 8, f"{len(syms)} different symmetries: " + ", ".join(map(str, syms)) + "-fold")
    rep.check("Every mandala different (exact recipe and motif-sequence skeleton both unique)",
              len({MD.recipe_fingerprint(r) for r in recs}) == N and len({MD.recipe_skeleton(r) for r in recs}) == N)
    n, clashes = reg.verify_unique()
    rep.check("No duplicate designs across other books", not clashes,
              f"{len(reg.taken)} designs from other books checked")
    stats = {}

    def hook(pno, img):
        if pno in coloring_pages:
            stats[pno] = colorable_regions(img)

    standard_checks(rep, path, roles, coloring=True, page_hook=hook)
    regions = [s[0] for s in stats.values()]
    tiny = sum(s[1] for s in stats.values())
    rep.check("Colorable areas: almost none too tiny to colour (< 1.2 mm)",
              tiny <= 0.02 * sum(regions),
              f"{min(regions)}-{max(regions)} areas per page; {tiny} tiny of {sum(regions)} total")
    return path, rep, {"coloring_pages": coloring_pages}
