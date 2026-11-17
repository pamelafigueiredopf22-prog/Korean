"""Geometric pattern pages: tessellations, tiles and optical (op-art) patterns.

Each generator draws into a rectangular box (already clipped by the caller) using
only outlines, so every enclosed area can be coloured.  A page is described by
(kind, params, seed): that tuple is fingerprinted for the no-duplicates check.
"""
import math

SQ3 = math.sqrt(3)


# ---------------------------------------------------------------------------
def _path(c, pts, close=True):
    p = c.beginPath()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    if close:
        p.close()
    c.drawPath(p, stroke=1, fill=0)


def _fit(length, target):
    n = max(1, round(length / target))
    return n, length / n


def _reg_poly(cx, cy, r, n, rot=0.0):
    return [(cx + r * math.cos(rot + 2 * math.pi * k / n), cy + r * math.sin(rot + 2 * math.pi * k / n))
            for k in range(n)]


# ---------------------------------------------------------------------------
# tessellations
# ---------------------------------------------------------------------------
def hexagons(c, box, rng, size=0.55, inner="hex"):
    x0, y0, w, h = box
    s = size * 72
    rows = int(h / (1.5 * s)) + 3
    cols = int(w / (SQ3 * s)) + 3
    for r in range(-1, rows):
        for k in range(-1, cols):
            cx = x0 + SQ3 * s * (k + 0.5 * (r % 2))
            cy = y0 + 1.5 * s * r
            pts = _reg_poly(cx, cy, s, 6, math.pi / 6)
            _path(c, pts)
            if inner == "hex":
                _path(c, _reg_poly(cx, cy, s * 0.55, 6, math.pi / 6))
            elif inner == "star":
                _path(c, _reg_poly(cx, cy, s * 0.8, 3, math.pi / 2))
                _path(c, _reg_poly(cx, cy, s * 0.8, 3, -math.pi / 2))
            elif inner == "tri":
                _path(c, [pts[0], pts[2], pts[4]])
            elif inner == "flower":
                for v in pts:
                    _path(c, [(cx, cy), v], close=False)
                c.circle(cx, cy, s * 0.42, stroke=1, fill=0)


def triangles(c, box, rng, size=0.9, levels=1):
    x0, y0, w, h = box
    a = size * 72
    hgt = a * SQ3 / 2
    rows = int(h / hgt) + 2
    cols = int(w / a) + 3

    def sub(p1, p2, p3, lv):
        _path(c, [p1, p2, p3])
        if lv:
            m12 = ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)
            m23 = ((p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2)
            m31 = ((p3[0] + p1[0]) / 2, (p3[1] + p1[1]) / 2)
            _path(c, [m12, m23, m31])
            if lv > 1:
                sub(p1, m12, m31, lv - 1)

    for r in range(-1, rows):
        for k in range(-1, cols):
            off = (r % 2) * a / 2
            bx, by = x0 + k * a - off, y0 + r * hgt
            sub((bx, by), (bx + a, by), (bx + a / 2, by + hgt), levels)
            sub((bx + a / 2, by + hgt), (bx + a * 1.5, by + hgt), (bx + a, by), 0 if levels < 2 else 1)


def cairo(c, box, rng, size=0.85):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 2
    b = t * 0.46
    for j in range(-1, ny):
        for i in range(-1, nx + 1):
            cx, cy = x0 + (i + 0.5) * t, y0 + (j + 0.5) * t
            L_, R_, B_, T_ = cx - t / 2, cx + t / 2, cy - t / 2, cy + t / 2
            if (i + j) % 2 == 0:
                a1, a2 = (cx - b / 2, cy), (cx + b / 2, cy)
                _path(c, [a1, a2], close=False)
                for p in ((L_, B_), (L_, T_)):
                    _path(c, [a1, p], close=False)
                for p in ((R_, B_), (R_, T_)):
                    _path(c, [a2, p], close=False)
            else:
                a1, a2 = (cx, cy - b / 2), (cx, cy + b / 2)
                _path(c, [a1, a2], close=False)
                for p in ((L_, B_), (R_, B_)):
                    _path(c, [a1, p], close=False)
                for p in ((L_, T_), (R_, T_)):
                    _path(c, [a2, p], close=False)


def tumbling_blocks(c, box, rng, size=0.6, inner=False):
    x0, y0, w, h = box
    s = size * 72
    rows = int(h / (1.5 * s)) + 3
    cols = int(w / (SQ3 * s)) + 3
    for r in range(-1, rows):
        for k in range(-1, cols):
            cx = x0 + SQ3 * s * (k + 0.5 * (r % 2))
            cy = y0 + 1.5 * s * r
            pts = _reg_poly(cx, cy, s, 6, math.pi / 6)
            _path(c, pts)
            for v in (pts[1], pts[3], pts[5]):
                _path(c, [(cx, cy), v], close=False)
            if inner:
                for a, b_ in ((1, 3), (3, 5), (5, 1)):
                    # a smaller rhombus inside each face
                    m = [(cx + (pts[a][0] - cx) * f + (pts[b_][0] - cx) * g,
                          cy + (pts[a][1] - cy) * f + (pts[b_][1] - cy) * g)
                         for f, g in ((0.2, 0.2), (0.8, 0.2), (0.8, 0.8), (0.2, 0.8))]
                    mid = (pts[a][0] + pts[b_][0] - cx, pts[a][1] + pts[b_][1] - cy)
                    q = [(cx + (pts[a][0] - cx) * 0.25 + (pts[b_][0] - cx) * 0.25,
                          cy + (pts[a][1] - cy) * 0.25 + (pts[b_][1] - cy) * 0.25),
                         (cx + (pts[a][0] - cx) * 0.75 + (pts[b_][0] - cx) * 0.25,
                          cy + (pts[a][1] - cy) * 0.75 + (pts[b_][1] - cy) * 0.25),
                         (cx + (pts[a][0] - cx) * 0.75 + (pts[b_][0] - cx) * 0.75,
                          cy + (pts[a][1] - cy) * 0.75 + (pts[b_][1] - cy) * 0.75),
                         (cx + (pts[a][0] - cx) * 0.25 + (pts[b_][0] - cx) * 0.75,
                          cy + (pts[a][1] - cy) * 0.25 + (pts[b_][1] - cy) * 0.75)]
                    _path(c, q)


def octagons(c, box, rng, size=0.9, inner="none"):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 2
    r = t / 2 / math.cos(math.pi / 8)
    for j in range(-1, ny):
        for i in range(-1, nx + 1):
            cx, cy = x0 + (i + 0.5) * t, y0 + (j + 0.5) * t
            _path(c, _reg_poly(cx, cy, r, 8, math.pi / 8))
            if inner == "star":
                _path(c, _reg_poly(cx, cy, r * 0.62, 4, 0))
                _path(c, _reg_poly(cx, cy, r * 0.62, 4, math.pi / 4))
            elif inner == "circle":
                c.circle(cx, cy, t * 0.3, stroke=1, fill=0)
            elif inner == "cross":
                _path(c, _reg_poly(cx, cy, r * 0.62, 8, math.pi / 8))
                _path(c, _reg_poly(cx, cy, r * 0.3, 8, math.pi / 8))


def kagome(c, box, rng, spacing=0.75):
    x0, y0, w, h = box
    d = spacing * 72
    diag = math.hypot(w, h)
    cx, cy = x0 + w / 2, y0 + h / 2
    for fam, ang in enumerate((0, 60, 120)):
        a = math.radians(ang)
        nx, ny = -math.sin(a), math.cos(a)
        off = d / 2 if fam == 0 else 0
        for k in range(-int(diag / d) - 2, int(diag / d) + 3):
            px, py = cx + nx * (k * d + off), cy + ny * (k * d + off)
            _path(c, [(px - math.cos(a) * diag, py - math.sin(a) * diag),
                      (px + math.cos(a) * diag, py + math.sin(a) * diag)], close=False)


# ---------------------------------------------------------------------------
# tiles and quilt blocks
# ---------------------------------------------------------------------------
def truchet_arcs(c, box, rng, size=0.8, double=False):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 1
    for j in range(ny + 1):
        for i in range(nx):
            x, y = x0 + i * t, y0 + j * t
            flip = rng.random() < 0.5
            corners = ((x, y), (x + t, y + t)) if flip else ((x + t, y), (x, y + t))
            starts = (0, 180) if flip else (90, 270)
            radii = (t / 2,) if not double else (t / 3, 2 * t / 3)
            for (px, py), st in zip(corners, starts):
                for r in radii:
                    c.arc(px - r, py - r, px + r, py + r, st, 90)


def truchet_triangles(c, box, rng, size=0.75, inner=False):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 1
    for j in range(ny + 1):
        for i in range(nx):
            x, y = x0 + i * t, y0 + j * t
            c.rect(x, y, t, t, stroke=1, fill=0)
            if rng.random() < 0.5:
                _path(c, [(x, y), (x + t, y + t)], close=False)
            else:
                _path(c, [(x + t, y), (x, y + t)], close=False)
            if inner:
                c.circle(x + t / 2, y + t / 2, t * 0.18, stroke=1, fill=0)


def basketweave(c, box, rng, size=0.9, strips=2):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 1
    for j in range(ny + 1):
        for i in range(nx):
            x, y = x0 + i * t, y0 + j * t
            c.rect(x, y, t, t, stroke=1, fill=0)
            for k in range(1, strips):
                if (i + j) % 2:
                    _path(c, [(x + k * t / strips, y), (x + k * t / strips, y + t)], close=False)
                else:
                    _path(c, [(x, y + k * t / strips), (x + t, y + k * t / strips)], close=False)


def pinwheel(c, box, rng, size=1.1):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 1
    for j in range(ny + 1):
        for i in range(nx):
            x, y = x0 + i * t, y0 + j * t
            m = t / 2
            c.rect(x, y, t, t, stroke=1, fill=0)
            _path(c, [(x + m, y), (x + m, y + t)], close=False)
            _path(c, [(x, y + m), (x + t, y + m)], close=False)
            # one diagonal per quarter, rotating -> pinwheel
            _path(c, [(x, y), (x + m, y + m)], close=False)
            _path(c, [(x + t, y), (x + m, y + m)], close=False)
            _path(c, [(x + t, y + t), (x + m, y + m)], close=False)
            _path(c, [(x, y + t), (x + m, y + m)], close=False)
            _path(c, [(x + m, y), (x, y + m)], close=False)
            _path(c, [(x + t, y + m), (x + m, y)], close=False)
            _path(c, [(x + m, y + t), (x + t, y + m)], close=False)
            _path(c, [(x, y + m), (x + m, y + t)], close=False)


def log_cabin(c, box, rng, size=1.4, logs=3):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 1
    for j in range(ny + 1):
        for i in range(nx):
            x, y = x0 + i * t, y0 + j * t
            rot = (i + j) % 4 if rng.random() < 0.7 else rng.randrange(4)
            c.saveState()
            c.translate(x + t / 2, y + t / 2)
            c.rotate(90 * rot)
            c.rect(-t / 2, -t / 2, t, t, stroke=1, fill=0)
            step = t / (2 * logs + 1)
            core = step / 2
            # spiral of logs around a centre square
            xa, ya, xb, yb = -core, -core, core, core
            c.rect(xa, ya, xb - xa, yb - ya, stroke=1, fill=0)
            for k in range(logs):
                for side in range(4):
                    if side == 0:
                        xb += step
                    elif side == 1:
                        yb += step
                    elif side == 2:
                        xa -= step
                    else:
                        ya -= step
                    c.rect(xa, ya, xb - xa, yb - ya, stroke=1, fill=0)
            c.restoreState()


def whirling_squares(c, box, rng, size=1.4, angle=12, depth=5):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 1
    a = math.radians(angle)
    for j in range(ny + 1):
        for i in range(nx):
            cx, cy = x0 + (i + 0.5) * t, y0 + (j + 0.5) * t
            sgn = 1 if (i + j) % 2 == 0 else -1
            half, rot = t / 2, 0.0
            for d in range(depth):
                r = half * math.sqrt(2)
                _path(c, _reg_poly(cx, cy, r, 4, math.pi / 4 + rot))
                # next square inscribed, rotated by `angle`
                half = half / (math.cos(a) + math.sin(a))
                rot += sgn * a
                if half < 0.22 * 72:
                    break


def fish_scales(c, box, rng, size=0.8, double=False):
    """Overlapping circles drawn from the top row down: each lower circle hides the
    bottom of the ones above, leaving classic scale shapes."""
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    r = t / 2
    rows = int(h / (r * 0.95)) + 3
    c.setFillGray(1)
    for k in range(rows, -2, -1):
        off = (k % 2) * r
        y = y0 + k * r * 0.95
        for i in range(-1, nx + 2):
            x = x0 + i * t + off
            c.circle(x, y, r, stroke=1, fill=1)
            if double:
                c.circle(x, y + r * 0.22, r * 0.5, stroke=1, fill=0)


def orange_peel(c, box, rng, size=0.9, centers=False):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 2
    r = t / math.sqrt(2)
    for j in range(-1, ny + 1):
        for i in range(-1, nx + 2):
            c.circle(x0 + i * t, y0 + j * t, r, stroke=1, fill=0)
    if centers:
        for j in range(-1, ny + 1):
            for i in range(-1, nx + 1):
                c.circle(x0 + (i + 0.5) * t, y0 + (j + 0.5) * t, t * 0.13, stroke=1, fill=0)


def flower_of_life(c, box, rng, radius=0.6):
    x0, y0, w, h = box
    r = radius * 72
    rows = int(h / (r * SQ3 / 2)) + 3
    cols = int(w / r) + 3
    for j in range(-1, rows):
        for i in range(-1, cols):
            c.circle(x0 + i * r + (j % 2) * r / 2, y0 + j * r * SQ3 / 2, r, stroke=1, fill=0)


# ---------------------------------------------------------------------------
# optical patterns
# ---------------------------------------------------------------------------
def bulge_grid(c, box, rng, cells=11, strength=0.45, centers=1, pinch=False):
    x0, y0, w, h = box
    nx = cells
    t = w / nx
    ny = int(math.ceil(h / t))
    cs = [(x0 + w * rng.uniform(0.3, 0.7), y0 + h * rng.uniform(0.3, 0.7))]
    if centers == 2:
        cs = [(x0 + w * 0.3, y0 + h * 0.68), (x0 + w * 0.7, y0 + h * 0.32)]
    R = min(w, h) * (0.55 if centers == 1 else 0.36)
    k = -strength if pinch else strength

    def T(px, py):
        for cx, cy in cs:
            dx, dy = px - cx, py - cy
            d = math.hypot(dx, dy)
            if d < R:
                f = 1 + k * (1 - (d / R) ** 2) ** 2 * (0.2 if pinch else 1)
                f = max(f, 0.3)
                g = (1 - (d / R)) * k
                px, py = cx + dx * (1 + g * 0.9), cy + dy * (1 + g * 0.9)
        return px, py

    steps = 80
    for i in range(nx + 1):
        _path(c, [T(x0 + i * t, y0 + h * s / steps) for s in range(steps + 1)], close=False)
    for j in range(ny + 1):
        _path(c, [T(x0 + w * s / steps, y0 + j * t) for s in range(steps + 1)], close=False)


def radial_checker(c, box, rng, rings=9, spokes=24, swirl=0.0):
    x0, y0, w, h = box
    cx, cy = x0 + w / 2, y0 + h / 2
    Rmax = math.hypot(w, h) / 2
    r0 = 0.45 * 72
    radii = [r0 * (Rmax / r0) ** (k / rings) for k in range(rings + 1)]
    for r in radii:
        c.circle(cx, cy, r, stroke=1, fill=0)
    for k in range(len(radii) - 1):
        n = spokes if radii[k] * 2 * math.pi / spokes > 0.32 * 72 else spokes // 2
        for s in range(n):
            a0 = 2 * math.pi * s / n + swirl * k
            a1 = a0 + swirl
            _path(c, [(cx + radii[k] * math.cos(a0), cy + radii[k] * math.sin(a0)),
                      (cx + radii[k + 1] * math.cos(a1), cy + radii[k + 1] * math.sin(a1))], close=False)


def waves(c, box, rng, lines=16, amp=0.35, period=2.2, verticals=7):
    x0, y0, w, h = box
    gap = h / lines
    A = amp * 72
    P = period * 72
    ph = rng.uniform(0, 2 * math.pi)
    for j in range(-1, lines + 2):
        pts = []
        for s in range(121):
            x = x0 + w * s / 120
            pts.append((x, y0 + j * gap + A * math.sin(2 * math.pi * x / P + ph + j * 0.35)))
        _path(c, pts, close=False)
    for i in range(1, verticals):
        x = x0 + w * i / verticals
        _path(c, [(x, y0), (x, y0 + h)], close=False)


def concentric_tiles(c, box, rng, size=1.15, rings=4, shape="square"):
    x0, y0, w, h = box
    nx, t = _fit(w, size * 72)
    ny = int(h / t) + 1
    for j in range(ny + 1):
        for i in range(nx):
            cx, cy = x0 + (i + 0.5) * t, y0 + (j + 0.5) * t
            alt = (i + j) % 2
            for k in range(rings):
                f = 1 - k / rings
                if shape == "square" or (shape == "mixed" and alt):
                    c.rect(cx - t / 2 * f, cy - t / 2 * f, t * f, t * f, stroke=1, fill=0)
                else:
                    if k == 0:
                        c.rect(cx - t / 2, cy - t / 2, t, t, stroke=1, fill=0)
                    c.circle(cx, cy, t / 2 * f * (0.98 if k == 0 else 1), stroke=1, fill=0)


GENERATORS = {f.__name__: f for f in (
    hexagons, triangles, cairo, tumbling_blocks, octagons, kagome, truchet_arcs, truchet_triangles,
    basketweave, pinwheel, log_cabin, whirling_squares, fish_scales, orange_peel, flower_of_life,
    bulge_grid, radial_checker, waves, concentric_tiles)}
FAMILY = {"hexagons": "Tessellation", "triangles": "Tessellation", "cairo": "Tessellation",
          "tumbling_blocks": "Tessellation", "octagons": "Tessellation", "kagome": "Tessellation",
          "flower_of_life": "Tessellation", "truchet_arcs": "Tiles", "truchet_triangles": "Tiles",
          "basketweave": "Tiles", "pinwheel": "Tiles", "log_cabin": "Tiles", "whirling_squares": "Tiles",
          "fish_scales": "Tiles", "orange_peel": "Tiles", "concentric_tiles": "Tiles",
          "bulge_grid": "Optical", "radial_checker": "Optical", "waves": "Optical"}
