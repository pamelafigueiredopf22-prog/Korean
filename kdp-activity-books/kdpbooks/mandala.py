"""Procedural mandalas: concentric bands, each filled with a motif repeated
with N-fold rotational symmetry.  Everything is drawn as white-filled, black
outlined shapes, painted from the outside in so layers overlap cleanly.

A mandala is fully described by its *recipe* (list of band dicts), which is what
gets fingerprinted for the no-duplicates check.
"""
import math

from .registry import fingerprint

TAU = 2 * math.pi
MOTIFS = ["petal", "round_petal", "nested_petal", "leaf", "drop", "scallop", "zigzag",
          "dots", "diamond", "rays", "shell", "arch", "beads"]
# smallest comfortable size of one repeat (arc width, inches) and band height (inches)
# so that no closed area becomes too small to colour
MIN_UNIT = {"petal": 0.17, "round_petal": 0.17, "drop": 0.17, "scallop": 0.2, "dots": 0.17,
            "arch": 0.28, "zigzag": 0.26, "rays": 0.3, "shell": 0.34, "diamond": 0.34,
            "beads": 0.3, "nested_petal": 0.36, "leaf": 0.38, "lattice": 0.4}
MIN_H = {"shell": 0.3, "diamond": 0.3, "beads": 0.28, "nested_petal": 0.32, "leaf": 0.34,
         "arch": 0.26, "zigzag": 0.24, "rays": 0.24}
SIMPLE = ["petal", "round_petal", "drop", "scallop", "dots"]


# ---------------------------------------------------------------------------
# recipe
# ---------------------------------------------------------------------------
def make_recipe(rng, R, sym, min_band, max_band, motif_pool=MOTIFS, center_frac=(0.11, 0.17),
                detail=1.0, max_count=None, scale=1.0):
    """R: outer radius (pt). sym: base rotational symmetry. Bands from centre outwards."""
    rc = R * rng.uniform(*center_frac)
    bands, r = [], rc
    last = None
    while r < R - min_band * 0.6:
        h = rng.uniform(min_band, max_band) * (0.75 + 0.5 * r / R)
        h = min(h, R - r)
        motif = rng.choice([m for m in motif_pool if m != last] or motif_pool)
        rm = r + h / 2
        count = None
        for attempt in range(2):
            unit = MIN_UNIT.get(motif, 0.17) * 72 * scale
            min_h = MIN_H.get(motif, 0) * 72 * scale
            ideal = TAU * rm / (h * rng.uniform(0.8, 1.5) / detail)
            if motif in ("dots", "beads", "lattice"):
                ideal = TAU * rm / (h * 1.2)
            max_mult = int(TAU * rm / (sym * unit))
            mult = min(max(1, round(ideal / sym)), max_mult)
            if max_count:
                mult = min(mult, max_count // sym)
            if mult >= 1 and h >= min_h:
                count = sym * mult
                break
            motif = rng.choice([m for m in SIMPLE if m in motif_pool and m != last] or SIMPLE)
        if count is None:
            count = sym
        last = motif
        bands.append({
            "r0": round(r, 2), "r1": round(r + h, 2), "motif": motif, "n": count,
            "phase": rng.choice([0.0, 0.5]),
            "back": motif in ("petal", "round_petal", "leaf", "nested_petal")
                    and rng.random() < 0.55,
            "frame": rng.random() < 0.45,
            "width": round(rng.uniform(0.62, 0.82) if motif in ("round_petal", "shell", "nested_petal")
                           else rng.uniform(0.72, 0.92), 2),
        })
        r += h
    center = {"motif": rng.choice(["rosette", "star", "flower", "spiral_dots"]), "r": round(rc, 2),
              "n": sym if sym >= 5 else sym * 2}
    return {"sym": sym, "R": R, "center": center, "bands": bands}


def recipe_fingerprint(rec):
    return fingerprint("mandala", rec["sym"], rec["center"]["motif"],
                       tuple((b["motif"], b["n"], b["phase"], b["back"], b["frame"],
                              round(b["r0"]), round(b["r1"])) for b in rec["bands"]))


def recipe_skeleton(rec):
    """Coarse signature: symmetry + motif sequence. Two mandalas sharing it would
    look like near-copies, so the registry rejects the second one."""
    return fingerprint("mandala-skel", rec["sym"], rec["center"]["motif"],
                       tuple(b["motif"] for b in rec["bands"]))


# ---------------------------------------------------------------------------
# drawing
# ---------------------------------------------------------------------------
class Painter:
    def __init__(self, c, cx, cy, lw):
        self.c, self.cx, self.cy, self.lw = c, cx, cy, lw

    def P(self, r, a):
        return self.cx + r * math.cos(a), self.cy + r * math.sin(a)

    def poly(self, pts, fill=True, close=True):
        c = self.c
        p = c.beginPath()
        p.moveTo(*pts[0])
        for q in pts[1:]:
            p.lineTo(*q)
        if close:
            p.close()
        c.setFillGray(1)
        c.drawPath(p, stroke=1, fill=1 if (fill and close) else 0)

    def circle(self, r, x=None, y=None, fill=True):
        x = self.cx if x is None else x
        y = self.cy if y is None else y
        self.c.setFillGray(1)
        self.c.circle(x, y, r, stroke=1, fill=1 if fill else 0)

    def dot(self, x, y, r):
        self.c.setFillGray(0)
        self.c.circle(x, y, r, stroke=0, fill=1)
        self.c.setFillGray(1)

    # ---- motif primitives ------------------------------------------
    def petal(self, r0, r1, a, hw, prof="pointed", steps=36):
        left, right = [], []
        for k in range(steps + 1):
            t = k / steps
            s = math.sin(math.pi * t)
            f = {"pointed": s, "round": s ** 0.55, "drop": s * (1.15 - 0.85 * t),
                 "rdrop": s * (0.3 + 0.85 * t)}[prof]
            r = r0 + (r1 - r0) * t
            w = hw * f * (r0 + (r1 - r0) * 0.5) / max(r, 1e-6)
            left.append(self.P(r, a + w))
            right.append(self.P(r, a - w))
        self.poly(left + right[::-1])

    def wave_band(self, r0, r1, n, phase, fn, steps=24):
        pts = []
        da = TAU / n
        for i in range(n):
            for k in range(steps):
                u = k / steps
                pts.append(self.P(r0 + (r1 - r0) * fn(u), (i + u + phase) * da))
        self.poly(pts)


def draw_band(p, b):
    r0, r1, n, motif = b["r0"], b["r1"], b["n"], b["motif"]
    h = r1 - r0
    rm = (r0 + r1) / 2
    da = TAU / n
    ph = b["phase"] * da
    w = b["width"]
    if b["back"]:
        for i in range(n):
            p.petal(r0 + h * 0.24, r1 - h * 0.08, (i + 0.5) * da + ph, da * 0.5 * min(w, 0.8), "pointed")
    if motif in ("petal", "round_petal", "drop", "leaf", "nested_petal", "shell"):
        if b["back"]:
            w = min(w, 0.7)
        prof = {"petal": "pointed", "round_petal": "round", "drop": "drop", "leaf": "pointed",
                "nested_petal": "pointed", "shell": "round"}[motif]
        top = r1 if not b["back"] else r0 + h * 0.86
        for i in range(n):
            a = i * da + ph
            p.petal(r0, top, a, da * 0.5 * w, prof)
            if motif == "nested_petal":
                p.petal(r0 + h * 0.18, top - h * 0.18, a, da * 0.3 * w, prof)
            elif motif == "leaf":
                p.poly([p.P(r0 + h * 0.12, a), p.P(top - h * 0.25, a)], close=False)
                for k in (0.42, 0.62):
                    rr = r0 + (top - r0) * k
                    off = da * 0.5 * w * 0.35
                    p.poly([p.P(rr - h * 0.08, a + off), p.P(rr, a), p.P(rr - h * 0.08, a - off)],
                           close=False)
            elif motif == "shell":
                for k in (0.35, 0.65):
                    p.petal(r0, r0 + (top - r0) * k, a, da * 0.5 * w * (0.4 + 0.6 * k), "round")
    elif motif == "scallop":
        p.wave_band(r0, r1, n, b["phase"], lambda u: math.sin(math.pi * u) ** 0.7)
        p.circle(r0, fill=True)
    elif motif == "arch":
        p.wave_band(r0, r1, n, b["phase"], lambda u: math.sin(math.pi * u) ** 0.5)
        p.wave_band(r0, r0 + h * 0.6, n, b["phase"], lambda u: math.sin(math.pi * u) ** 0.5)
        p.circle(r0, fill=True)
    elif motif == "zigzag":
        p.wave_band(r0, r1, n, b["phase"], lambda u: 1 - abs(2 * u - 1), steps=2)
        p.wave_band(r0 + h * 0.2, r0 + h * 0.62, n, b["phase"], lambda u: 1 - abs(2 * u - 1), steps=2)
        p.circle(r0, fill=False)
    elif motif == "diamond":
        p.circle(r1, fill=True)
        for i in range(n):
            a = i * da + ph
            hw = da * 0.5 * w
            p.poly([p.P(r0, a), p.P(rm, a + hw), p.P(r1, a), p.P(rm, a - hw)])
            p.poly([p.P(r0 + h * 0.25, a), p.P(rm, a + hw * 0.5), p.P(r1 - h * 0.25, a),
                    p.P(rm, a - hw * 0.5)])
        p.circle(r0, fill=False)
    elif motif in ("dots", "beads"):
        p.circle(r1, fill=True)
        p.circle(r0, fill=False)
        rr = min(h * 0.3, rm * math.sin(da / 2) * 0.72)
        for i in range(n):
            x, y = p.P(rm, i * da + ph)
            p.circle(rr, x, y)
            if motif == "beads" and rr > 7:
                p.circle(rr * 0.5, x, y)
            else:
                p.dot(x, y, max(0.9, rr * 0.16))
    elif motif == "lattice":
        p.circle(r1, fill=True)
        rr = h * 0.5
        for i in range(n):
            x, y = p.P(rm, i * da + ph)
            p.circle(rr, x, y, fill=False)
        p.circle(r0, fill=False)
    elif motif == "rays":
        p.circle(r1, fill=True)
        for i in range(n):
            a = i * da + ph
            p.poly([p.P(r0, a), p.P(r1, a)], close=False)
            x, y = p.P(rm, a + da / 2)
            p.circle(min(h * 0.2, rm * math.sin(da / 2) * 0.35), x, y)
        p.circle(r0, fill=False)
    if b["frame"]:
        p.circle(r0, fill=False)


def draw_center(p, cen):
    r, n, m = cen["r"], cen["n"], cen["motif"]
    p.circle(r, fill=True)
    da = TAU / n
    if m == "rosette":
        for i in range(n):
            p.petal(r * 0.25, r * 0.95, i * da, da * 0.45, "round")
        p.circle(r * 0.3)
        p.circle(r * 0.12)
    elif m == "star":
        pts = []
        for i in range(2 * n):
            rr = r * (0.95 if i % 2 == 0 else 0.45)
            pts.append(p.P(rr, i * da / 2))
        p.poly(pts)
        p.circle(r * 0.28)
    elif m == "flower":
        k = n if n <= 10 else n // 2
        for i in range(k):
            p.petal(r * 0.3, r * 0.95, i * TAU / k, TAU / k * 0.42, "round")
        p.circle(r * 0.4)
        p.dot(p.cx, p.cy, r * 0.1)
    else:
        for i in range(n):
            x, y = p.P(r * 0.62, i * da)
            p.circle(r * 0.2, x, y)
        p.circle(r * 0.3)


def draw_mandala(c, rec, cx, cy, lw=1.2, outer_lw=None):
    c.saveState()
    c.setLineJoin(1)
    c.setLineCap(1)
    c.setLineWidth(lw)
    c.setStrokeGray(0)
    p = Painter(c, cx, cy, lw)
    for b in reversed(rec["bands"]):           # outside in
        draw_band(p, b)
    draw_center(p, rec["center"])
    c.restoreState()


def mandala_extent(rec):
    return max(b["r1"] for b in rec["bands"])
