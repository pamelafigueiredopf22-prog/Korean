"""Book 9 - Bold & Easy Shapes Coloring Book for Kids, ages 3-6."""
import math
import os
import random

from reportlab.lib.units import inch

from kdpbooks import layout as L
from kdpbooks.icons import ICONS, Pen, draw_icon
from kdpbooks.qa import Report, colorable_regions, standard_checks
from kdpbooks.registry import Registry, fingerprint

BOOK_ID = "book09-bold-shapes"
META = {
    "title": "Bold & Easy Shapes Coloring Book",
    "subtitle": "40 Big, Simple Pages for Toddlers and Preschoolers",
    "tagline": "Ages 3-6. Thick lines, big spaces, first shapes and friendly pictures",
}
LW = 7.0              # main outline weight (pt)
TINY_MM = 3.0         # kids: anything smaller than 3 x 3 mm counts as too small


def poly_unit(n, rot=90, r=1.0):
    return [(r * math.cos(math.radians(rot + 360 * k / n)), r * math.sin(math.radians(rot + 360 * k / n)))
            for k in range(n)]


def star_pts(r=1.0, inner=0.45, dy=-0.06):
    return [((r if k % 2 == 0 else r * inner) * math.cos(math.radians(90 + 36 * k)),
             (r if k % 2 == 0 else r * inner) * math.sin(math.radians(90 + 36 * k)) + dy) for k in range(10)]


def heart_pts(s=1.0, dy=0.08):
    out = []
    for i in range(121):
        t = 2 * math.pi * i / 120
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        out.append((s * x / 17, s * y / 17 + dy))
    return out


def ellipse_pts(rx, ry, cx=0, cy=0, n=90):
    return [(cx + rx * math.cos(2 * math.pi * k / n), cy + ry * math.sin(2 * math.pi * k / n)) for k in range(n)]


def scale(pts, f, cx=0, cy=0):
    return [(cx + (x - cx) * f, cy + (y - cy) * f) for x, y in pts]


# shape name -> outline points in [-1,1]
SHAPES = {
    "CIRCLE": lambda: ellipse_pts(0.95, 0.95),
    "SQUARE": lambda: [(-0.85, -0.85), (0.85, -0.85), (0.85, 0.85), (-0.85, 0.85)],
    "TRIANGLE": lambda: [(-0.98, -0.75), (0.98, -0.75), (0, 0.95)],
    "RECTANGLE": lambda: [(-0.98, -0.6), (0.98, -0.6), (0.98, 0.6), (-0.98, 0.6)],
    "STAR": lambda: star_pts(),
    "HEART": lambda: heart_pts(),
    "DIAMOND": lambda: [(0, -0.98), (0.7, 0), (0, 0.98), (-0.7, 0)],
    "OVAL": lambda: ellipse_pts(0.98, 0.65),
    "HEXAGON": lambda: poly_unit(6, 90, 0.97),
    "PENTAGON": lambda: [(x, y - 0.05) for x, y in poly_unit(5, 90, 0.98)],
    "OCTAGON": lambda: poly_unit(8, 22.5, 0.97),
    "CRESCENT": None,
}


def outlined_word(c, word, y, size=84, lw=2.8, font=L.DISPLAY_REG):
    """Hollow letters to colour. The regular weight has roomier counters (holes in A, O, R)."""
    size = L.fit_size(word, font, size, L.CONTENT_W - 0.2 * inch)
    t = c.beginText()
    t.setTextRenderMode(1)            # outline only, so the letters can be coloured
    t.setFont(font, size)
    w = c.stringWidth(word, font, size)
    t.setTextOrigin((L.PAGE_W - w) / 2, y)
    t.textOut(word)
    c.setLineWidth(lw)
    c.setLineJoin(1)
    c.drawText(t)


def shape_page(c, name, rng):
    cx, cy = L.PAGE_W / 2, L.CONTENT_B + 3.65 * inch
    size = 2.85 * inch
    p = Pen(c, cx, cy, 2 * size, LW)
    if name == "CRESCENT":
        from kdpbooks.icons import moon
        moon(p)
        p.done()
    else:
        pts = SHAPES[name]()
        p.poly(pts)
        p.width(0.75)
        inner = scale(pts, 0.55, 0, (-0.15 if name == "TRIANGLE" else 0))
        p.poly(inner)
        p.width(1)
        # a few big dots between the outer and inner outline
        k = {"TRIANGLE": 3, "PENTAGON": 5, "HEXAGON": 6, "OCTAGON": 8, "SQUARE": 4, "DIAMOND": 4,
             "STAR": 5, "RECTANGLE": 4}.get(name, 6)
        if name in ("CIRCLE", "OVAL", "HEART"):
            for j in range(k):
                a = 2 * math.pi * (j + 0.5) / k + math.pi / 2
                rx, ry = (0.77, 0.77) if name != "OVAL" else (0.8, 0.53)
                if name == "HEART":
                    rx, ry = 0.66, 0.6
                p.circle(rx * math.cos(a), ry * math.sin(a) + (0.05 if name == "HEART" else 0), 0.09)
        elif name not in ("STAR", "DIAMOND"):
            verts = pts if len(pts) == k else pts[::2]
            for (x, y) in verts:
                mx, my = x * 0.77, y * 0.77 + (-0.03 if name == "TRIANGLE" else 0)
                p.circle(mx, my, 0.07)
        p.done()
    outlined_word(c, name, L.CONTENT_T - 1.05 * inch)


PICTURES = ["sun", "flower", "fish", "bee", "rocket", "house", "car", "boat", "bunny", "carrot", "bird",
            "puppy", "snail", "leaf", "frog", "kite", "cloud", "mouse", "cheese", "island", "nest", "bone"]
PICTURE_WORDS = {"sun": "SUN", "flower": "FLOWER", "fish": "FISH", "bee": "BEE", "rocket": "ROCKET",
                 "house": "HOUSE", "car": "CAR", "boat": "BOAT", "bunny": "BUNNY", "carrot": "CARROT",
                 "bird": "BIRD", "puppy": "PUPPY", "snail": "SNAIL", "leaf": "LEAF", "frog": "FROG",
                 "kite": "KITE", "cloud": "CLOUD", "mouse": "MOUSE", "cheese": "CHEESE", "island": "ISLAND",
                 "nest": "NEST", "bone": "BONE"}
EXTRAS = {"fish": "bubbles", "boat": "sun", "kite": "cloud", "bee": "flowerlet", "bird": "cloud",
          "rocket": "stars", "island": "sun", "frog": "bubbles", "snail": "flowerlet", "car": "sun",
          "house": "sun", "bunny": "flowerlet", "puppy": "heart"}


def picture_page(c, name):
    cx, cy = L.PAGE_W / 2, L.CONTENT_B + 3.55 * inch
    # ground line for things that stand on something
    if name in ("house", "car", "bunny", "puppy", "snail", "frog", "flower", "mouse", "carrot", "bird", "nest"):
        c.setLineWidth(5)
        c.setLineCap(1)
        c.line(L.CONTENT_L + 0.4 * inch, L.CONTENT_B + 0.85 * inch, L.CONTENT_R - 0.4 * inch,
               L.CONTENT_B + 0.85 * inch)
    draw_icon(c, name, cx, cy, 5.6 * inch, LW)
    extra = EXTRAS.get(name)
    small = [(L.CONTENT_L + 1.0 * inch, L.CONTENT_T - 2.5 * inch), (L.CONTENT_R - 1.0 * inch, L.CONTENT_T - 2.5 * inch)]
    if extra == "bubbles":
        for (x, y), r in zip(small + [(L.CONTENT_R - 0.7 * inch, L.CONTENT_B + 1.7 * inch)], (0.35, 0.25, 0.3)):
            c.setLineWidth(5)
            c.circle(x, y, r * inch, stroke=1, fill=0)
    elif extra in ("sun", "cloud", "heart", "flowerlet"):
        nm = {"flowerlet": "flower", "heart": "heart"}.get(extra, extra)
        draw_icon(c, nm, *small[1], 1.8 * inch, 5.5)
    elif extra == "stars":
        for x, y in small:
            draw_icon(c, "star", x, y, 1.5 * inch, 5.5)
    outlined_word(c, PICTURE_WORDS[name], L.CONTENT_T - 1.05 * inch)


def pattern_page(c, kind):
    box = (L.CONTENT_L + 0.2 * inch, L.CONTENT_B + 0.6 * inch, L.CONTENT_W - 0.4 * inch, L.CONTENT_H - 2.1 * inch)
    x0, y0, w, h = box
    c.saveState()
    c.setLineWidth(5)
    c.setLineJoin(1)
    c.setLineCap(1)
    p = c.beginPath()
    p.roundRect(*box, 24)
    c.clipPath(p, stroke=0)
    title = {"checks": "BIG CHECKS", "dots": "BIG DOTS", "stripes": "STRIPES", "zigzag": "ZIGZAG",
             "rainbow": "RAINBOW", "squares": "SQUARES"}[kind]
    if kind == "checks":
        n = 4
        t = w / n
        for i in range(1, n):
            c.line(x0 + i * t, y0, x0 + i * t, y0 + h)
        for j in range(1, int(h / t) + 1):
            c.line(x0, y0 + j * t, x0 + w, y0 + j * t)
    elif kind == "dots":
        r = 0.55 * inch
        for j in range(5):
            for i in range(4):
                c.circle(x0 + (i + 0.5 + 0.5 * (j % 2)) * w / 4, y0 + (j + 0.5) * h / 5, r, stroke=1, fill=0)
    elif kind == "stripes":
        n = 6
        for i in range(1, n):
            c.line(x0, y0 + i * h / n, x0 + w, y0 + i * h / n)
        for j in range(n):
            c.circle(x0 + w * (0.25 if j % 2 else 0.75), y0 + (j + 0.5) * h / n, 0.28 * inch, stroke=1, fill=0)
    elif kind == "zigzag":
        n, amp = 5, 0.45 * inch
        for j in range(1, n + 1):
            yy = y0 + j * h / (n + 1)
            pts = [(x0 + k * w / 6, yy + (amp if k % 2 else -amp)) for k in range(7)]
            pp = c.beginPath()
            pp.moveTo(*pts[0])
            for q in pts[1:]:
                pp.lineTo(*q)
            c.drawPath(pp, stroke=1, fill=0)
    elif kind == "rainbow":
        cx, cy = x0 + w / 2, y0 + 0.7 * inch
        for k in range(5):
            r = 3.2 * inch - k * 0.5 * inch
            c.circle(cx, cy, r, stroke=1, fill=0)
        c.line(x0, cy, x0 + w, cy)
        draw_icon(c, "cloud", x0 + 1.15 * inch, cy + 0.35 * inch, 2.0 * inch, 5.5)
        draw_icon(c, "cloud", x0 + w - 1.15 * inch, cy + 0.35 * inch, 2.0 * inch, 5.5)
        draw_icon(c, "sun", x0 + w / 2, y0 + h - 1.55 * inch, 2.6 * inch, 6)
    elif kind == "squares":
        n = 3
        t = w / n
        for j in range(int(h / t) + 1):
            for i in range(n):
                for f in (1.0, 0.55):
                    s = t * f
                    c.rect(x0 + i * t + (t - s) / 2, y0 + j * t + (t - s) / 2, s, s, stroke=1, fill=0)
    c.restoreState()
    c.setLineWidth(6)
    c.roundRect(*box, 24, stroke=1, fill=0)
    outlined_word(c, title, L.CONTENT_T - 1.05 * inch, size=66)


def build(volume=1, out_dir="output"):
    reg = Registry(BOOK_ID, volume)
    suffix = "" if volume == 1 else f" Vol. {volume}"
    path = os.path.join(out_dir, f"{BOOK_ID}-vol{volume}.pdf")
    book = L.Book(path, META["title"] + suffix)
    rng = random.Random(f"{BOOK_ID}-{volume}")

    pages = [("shape", s) for s in SHAPES] + [("picture", p) for p in PICTURES] + \
            [("pattern", k) for k in ("checks", "dots", "stripes", "zigzag", "rainbow", "squares")]
    # interleave: shape, picture, picture, ..., pattern every ~7 pages
    shapes = [p for p in pages if p[0] == "shape"]
    pics = [p for p in pages if p[0] == "picture"]
    pats = [p for p in pages if p[0] == "pattern"]
    order = []
    while shapes or pics or pats:
        for src, k in ((shapes, 1), (pics, 2), (shapes, 1), (pics, 2), (pats, 1)):
            for _ in range(k):
                if src:
                    order.append(src.pop(0))
    for kind, name in order:
        if not reg.claim(fingerprint("bold", kind, name), f"{BOOK_ID} v{volume} {name}"):
            raise RuntimeError(f"{name} already used in another volume")

    def deco(c):
        for k, nm in enumerate(["star", "heart", "sun", "fish", "flower"]):
            draw_icon(c, nm, L.CONTENT_L + 0.6 * inch + k * (L.CONTENT_W - 1.2 * inch) / 4,
                      L.CONTENT_B + 1.4 * inch, 1.0 * inch, 5)
    L.title_page(book, META["title"] + suffix, META["subtitle"], META["tagline"], decorate=deco)
    L.copyright_page(book, META["title"] + suffix, 2026)
    L.belongs_to_page(book, decorate=lambda c: [draw_icon(c, nm, x, y, 1.3 * inch, 5) for nm, x, y in (
        ("heart", L.CONTENT_L + 1.0 * inch, L.CONTENT_T - 1.3 * inch),
        ("star", L.CONTENT_R - 1.0 * inch, L.CONTENT_T - 1.3 * inch),
        ("sun", L.CONTENT_L + 1.0 * inch, L.CONTENT_B + 1.3 * inch),
        ("flower", L.CONTENT_R - 1.0 * inch, L.CONTENT_B + 1.3 * inch))])
    L.how_to_page(book, "How to Use This Book", [
        "Pick a page and say the name of the shape or picture out loud.",
        "Color the big spaces first, then the little ones.",
        "The words are hollow so you can color the letters too!",
        "Every picture has its own page with a blank back, so markers won't come through.",
    ], tip="Chunky crayons and washable markers are perfect for little hands. Talk about colours and "
           "shapes as your child works: \"What colour will the triangle be?\" Praise effort, not neatness.")
    color_pages = []
    for kind, name in order:
        c = book.new_page(role="coloring")
        {"shape": lambda: shape_page(c, name, rng), "picture": lambda: picture_page(c, name),
         "pattern": lambda: pattern_page(c, name)}[kind]()
        color_pages.append(book.page)
        book.blank_page()
    roles = book.page_roles
    book.save()
    reg.save()

    rep = Report(f"{META['title']}{suffix} ({os.path.basename(path)})")
    rep.check(f"{len(order)} coloring pages", len(order) == 40,
              f"{sum(1 for k, _ in order if k == 'shape')} shapes, {sum(1 for k, _ in order if k == 'picture')} "
              f"pictures, {sum(1 for k, _ in order if k == 'pattern')} patterns")
    rep.check("Every page different", len(set(order)) == len(order))
    n, clashes = reg.verify_unique()
    rep.check("No duplicate pages across other books/volumes", not clashes,
              f"{len(reg.taken)} items from other books checked")
    stats = {}

    def hook(pno, img):
        if pno in color_pages:
            stats[pno] = colorable_regions(img, tiny_mm=TINY_MM)

    standard_checks(rep, path, roles, coloring=True, page_hook=hook)
    regions = [s[0] for s in stats.values()]
    tiny = sum(s[1] for s in stats.values())
    worst = max(stats.items(), key=lambda kv: kv[1][1])
    rep.check(f"Big spaces only: almost no area smaller than {TINY_MM:.0f} x {TINY_MM:.0f} mm",
              tiny <= 0.03 * sum(regions),
              f"{min(regions)}-{max(regions)} areas per page; {tiny} small of {sum(regions)}; "
              f"worst page {worst[0]} ({worst[1][1]})")
    rep.check(f"Thick lines for little hands", True, f"main outlines {LW:.0f} pt, patterns 5-6 pt")
    return path, rep, {"stats": stats}
