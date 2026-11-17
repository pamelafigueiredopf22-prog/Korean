"""Book 8 - Geometric Pattern Coloring Book: tessellations, tiles and optical patterns."""
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks import patterns as PT
from kdpbooks.qa import Report, colorable_regions, standard_checks
from kdpbooks.registry import Registry, fingerprint
from books.book07_mandalas_teens import color_test_page

BOOK_ID = "book08-geometric"
META = {
    "title": "Geometric Pattern Coloring Book",
    "subtitle": "40 Tessellations, Tiles and Optical Illusions to Color",
    "tagline": "Single-sided pages for markers, pens and pencils",
}
H = L.HEAVY

# (generator, params, title). Every entry is a distinct design.
DESIGNS = [
    ("hexagons", {"size": 0.6, "inner": "hex"}, "Honeycomb"),
    ("truchet_arcs", {"size": 0.95}, "Winding Paths"),
    ("bulge_grid", {"cells": 11, "strength": 0.45}, "Bulging Grid"),
    ("cairo", {"size": 0.95}, "Cairo Pentagons"),
    ("log_cabin", {"size": 1.4, "logs": 3}, "Log Cabin Quilt"),
    ("radial_checker", {"rings": 10, "spokes": 32}, "Hypnotic Circles"),
    ("tumbling_blocks", {"size": 0.62}, "Tumbling Blocks"),
    ("fish_scales", {"size": 0.85}, "Dragon Scales"),
    ("whirling_squares", {"size": 1.4, "angle": 12}, "Whirling Squares"),
    ("octagons", {"size": 0.95, "inner": "none"}, "Octagons and Squares"),
    ("waves", {"lines": 15, "amp": 0.35, "period": 2.4, "verticals": 7}, "Ocean Waves"),
    ("triangles", {"size": 1.0, "levels": 1}, "Triangle Mosaic"),
    ("orange_peel", {"size": 0.95}, "Orange Peel"),
    ("pinwheel", {"size": 1.2}, "Pinwheels"),
    ("octagons", {"size": 1.15, "inner": "cross"}, "Nested Octagons"),
    ("hexagons", {"size": 0.7, "inner": "star"}, "Star Hexagons"),
    ("truchet_triangles", {"size": 0.8}, "Random Triangles"),
    ("bulge_grid", {"cells": 13, "strength": 0.4, "centers": 2}, "Double Bulge"),
    ("flower_of_life", {"radius": 0.65}, "Flower Circles"),
    ("concentric_tiles", {"size": 1.15, "rings": 4, "shape": "square"}, "Nested Squares"),
    ("basketweave", {"size": 0.95, "strips": 2}, "Basketweave"),
    ("radial_checker", {"rings": 9, "spokes": 24, "swirl": 0.18}, "Spiral Vortex"),
    ("octagons", {"size": 1.05, "inner": "star"}, "Octagon Stars"),
    ("truchet_arcs", {"size": 1.1, "double": True}, "Ribbon Maze"),
    ("tumbling_blocks", {"size": 0.72, "inner": True}, "Framed Cubes"),
    ("whirling_squares", {"size": 1.6, "angle": 18, "depth": 4}, "Spinning Tiles"),
    ("hexagons", {"size": 0.72, "inner": "flower"}, "Hexagon Flowers"),
    ("waves", {"lines": 12, "amp": 0.5, "period": 3.2, "verticals": 5}, "Big Swell"),
    ("fish_scales", {"size": 1.0, "double": True}, "Mermaid Scales"),
    ("concentric_tiles", {"size": 1.2, "rings": 3, "shape": "mixed"}, "Circles in Squares"),
    ("cairo", {"size": 1.15}, "Big Pentagons"),
    ("triangles", {"size": 1.3, "levels": 2}, "Triangle Fractal"),
    ("bulge_grid", {"cells": 12, "strength": 0.5, "pinch": True}, "Pinched Grid"),
    ("log_cabin", {"size": 1.65, "logs": 4}, "Courthouse Steps"),
    ("orange_peel", {"size": 1.1, "centers": True}, "Petal Lattice"),
    ("basketweave", {"size": 1.15, "strips": 3}, "Triple Weave"),
    ("octagons", {"size": 1.0, "inner": "circle"}, "Octagon Circles"),
    ("truchet_triangles", {"size": 0.95, "inner": True}, "Diamond Dots"),
    ("hexagons", {"size": 0.85, "inner": "tri"}, "Hexagon Triangles"),
    ("radial_checker", {"rings": 8, "spokes": 20, "swirl": -0.25}, "Whirlpool"),
]


def draw_page(c, kind, params, seed, title):
    box = (L.CONTENT_L, L.CONTENT_B + 0.25 * inch, L.CONTENT_W, L.CONTENT_H - 0.25 * inch)
    inner = (box[0] + 6, box[1] + 6, box[2] - 12, box[3] - 12)
    c.saveState()
    p = c.beginPath()
    p.roundRect(*inner, 14)
    c.clipPath(p, stroke=0)
    c.setLineWidth(1.4)
    c.setLineJoin(1)
    c.setLineCap(1)
    PT.GENERATORS[kind](c, inner, random.Random(seed), **params)
    c.restoreState()
    c.setLineWidth(2.2)
    c.roundRect(*box, 18, stroke=1, fill=0)
    c.setLineWidth(1.4)
    c.roundRect(*inner, 14, stroke=1, fill=0)
    c.setFont(L.BODY, 10)
    c.setFillGray(0.35)
    c.drawRightString(L.CONTENT_R, L.CONTENT_B, title)
    c.setFillGray(0)


def build(volume=1, out_dir="output"):
    rng = random.Random(f"{BOOK_ID}-vol{volume}")
    reg = Registry(BOOK_ID, volume)
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)

    designs = []
    for i, (kind, params, title) in enumerate(DESIGNS):
        while True:
            seed = f"{BOOK_ID}-{volume}-{i}-{rng.random()}"
            # randomised generators (truchet, bulge, waves) get a fresh seed per volume;
            # fixed ones are identified by kind+params, so a later volume must change them
            seeded = kind in ("truchet_arcs", "truchet_triangles", "bulge_grid", "waves", "log_cabin")
            fp = fingerprint("pattern", kind, tuple(sorted(params.items())), seed if seeded else "")
            if reg.claim(fp, f"{BOOK_ID} v{volume} page {i+1}",
                         alt_fps=(fingerprint("pattern-skel", kind, tuple(sorted(params.items()))),)
                         if not seeded else ()):
                break
            if not seeded:
                raise RuntimeError(f"design {title} already used in another volume: change its params")
        designs.append((kind, params, seed, title))

    def deco(c):
        box = (L.PAGE_W / 2 - 1.6 * inch, L.CONTENT_B + 0.4 * inch, 3.2 * inch, 2.6 * inch)
        c.saveState()
        p = c.beginPath()
        p.roundRect(*box, 12)
        c.clipPath(p, stroke=0)
        c.setLineWidth(1.2)
        PT.tumbling_blocks(c, box, random.Random(1), size=0.4)
        c.restoreState()
        c.setLineWidth(2)
        c.roundRect(*box, 12, stroke=1, fill=0)
    L.title_page(book, META["title"] + suffix, META["subtitle"], META["tagline"], decorate=deco, font=H)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, font=H)
    L.how_to_page(book, "How to Use This Book", [
        "Every design is printed on its own page with a blank back, so markers won't bleed onto the next one.",
        "Tessellations are shapes that fit together with no gaps. Try coloring each shape type in its own colour.",
        "Tiles and quilt blocks look completely different depending on where you put light and dark colours.",
        "Optical patterns work best in two alternating colours, like a checkerboard. Watch them pop off the page!",
        "Test your colours on the Color Test Page first.",
    ], tip="Pick a small palette (three to five colours) for each page. Limiting your colours makes "
           "geometric patterns look striking and is very relaxing.", font=H, tip_title="Colour tip", size=15)
    color_test_page(book)
    book.blank_page()
    pages = []
    for kind, params, seed, title in designs:
        c = book.new_page(role="coloring")
        draw_page(c, kind, params, seed, title)
        pages.append(book.page)
        book.blank_page()
    roles = book.page_roles
    book.save()
    reg.save()

    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    fams = {}
    for kind, *_ in designs:
        fams[PT.FAMILY[kind]] = fams.get(PT.FAMILY[kind], 0) + 1
    rep.check(f"{len(designs)} designs", len(designs) == 40,
              ", ".join(f"{v} {k.lower()}" for k, v in fams.items()) +
              f"; {len({d[0] for d in designs})} pattern families")
    rep.check("Every design different (kind + parameters + seed fingerprint)",
              len({(d[0], tuple(sorted(d[1].items()))) for d in designs}) == len(designs))
    n, clashes = reg.verify_unique()
    rep.check("No duplicate designs across other books/volumes", not clashes,
              f"{len(reg.taken)} designs from other books checked")
    stats = {}

    def hook(pno, img):
        if pno in pages:
            stats[pno] = colorable_regions(img)

    standard_checks(rep, path, roles, coloring=True, page_hook=hook)
    regions = [s[0] for s in stats.values()]
    tiny = sum(s[1] for s in stats.values())
    worst = max(stats.items(), key=lambda kv: kv[1][1] / max(1, kv[1][0]))
    rep.check("Colorable areas: almost none too tiny to colour (< 1.2 mm)",
              tiny <= 0.02 * sum(regions),
              f"{min(regions)}-{max(regions)} areas per page; {tiny} tiny of {sum(regions)} total; "
              f"worst page {worst[0]}: {worst[1][1]}/{worst[1][0]}")
    return path, rep, {"stats": stats, "pages": pages}
