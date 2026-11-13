"""Simple outline icons drawn entirely in code (no clip art).

Every icon is designed in a unit box [-1, 1] x [-1, 1] and drawn with thick,
round-jointed outlines so young children can colour them in.
"""
import math

WHITE, BLACK = 1, 0


def _pts_ellipse(cx, cy, rx, ry, a0=0, a1=360, n=72):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
             cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


class Pen:
    """Draws in icon space; line widths are given in final points."""

    def __init__(self, c, cx, cy, size, lw):
        self.c, self.s, self.lw = c, size / 2.0, lw
        c.saveState()
        c.translate(cx, cy)
        c.scale(self.s, self.s)
        c.setLineJoin(1)
        c.setLineCap(1)
        c.setLineWidth(lw / self.s)
        c.setStrokeGray(BLACK)

    def done(self):
        self.c.restoreState()

    def width(self, mult=1.0):
        self.c.setLineWidth(self.lw * mult / self.s)

    def poly(self, pts, close=True, fill=True, stroke=True, gray=WHITE):
        p = self.c.beginPath()
        p.moveTo(*pts[0])
        for q in pts[1:]:
            p.lineTo(*q)
        if close:
            p.close()
        self.c.setFillGray(gray)
        self.c.drawPath(p, stroke=1 if stroke else 0, fill=1 if (fill and close) else 0)

    def line(self, *pts):
        self.poly(list(zip(pts[::2], pts[1::2])), close=False, fill=False)

    def ellipse(self, cx, cy, rx, ry, fill=True, stroke=True, gray=WHITE):
        self.poly(_pts_ellipse(cx, cy, rx, ry), fill=fill, stroke=stroke, gray=gray)

    def circle(self, cx, cy, r, **kw):
        self.ellipse(cx, cy, r, r, **kw)

    def arc(self, cx, cy, rx, ry, a0, a1):
        self.poly(_pts_ellipse(cx, cy, rx, ry, a0, a1, 40), close=False, fill=False)

    def dot(self, cx, cy, r=0.075):
        self.ellipse(cx, cy, r, r, stroke=False, gray=BLACK)

    def union(self, shapes):
        """Outline of the union of ellipses/polygons: stroke double, then fill white."""
        self.width(2)
        for kind, args in shapes:
            if kind == "e":
                self.ellipse(*args, fill=False)
            else:
                self.poly(args, fill=False)
        self.width(1)
        for kind, args in shapes:
            if kind == "e":
                self.ellipse(*args, stroke=False)
            else:
                self.poly(args, stroke=False)

    def face(self, x, y, r, smile=True):
        self.dot(x - 0.35 * r, y + 0.15 * r, 0.11 * r)
        self.dot(x + 0.35 * r, y + 0.15 * r, 0.11 * r)
        if smile:
            self.arc(x, y - 0.05 * r, 0.32 * r, 0.25 * r, 200, 340)


# ---------------------------------------------------------------------------
def star(p):
    pts = []
    for i in range(10):
        r = 0.95 if i % 2 == 0 else 0.42
        a = math.radians(90 + 36 * i)
        pts.append((r * math.cos(a), r * math.sin(a) - 0.05))
    p.poly(pts)


def heart(p):
    pts = []
    for i in range(121):
        t = 2 * math.pi * i / 120
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x / 17.5, y / 17.5 + 0.1))
    p.poly(pts)


def house(p):
    p.poly([(-0.72, -0.9), (0.72, -0.9), (0.72, 0.15), (-0.72, 0.15)])
    p.poly([(-0.95, 0.1), (0, 0.92), (0.95, 0.1)])
    p.poly([(-0.2, -0.9), (0.2, -0.9), (0.2, -0.32), (-0.2, -0.32)])
    p.poly([(0.33, -0.3), (0.58, -0.3), (0.58, -0.05), (0.33, -0.05)])
    p.poly([(0.45, 0.48), (0.45, 0.85), (0.65, 0.85), (0.65, 0.65)], close=False, fill=False)


def flower(p):
    p.line(0, -0.1, 0, -0.95)
    p.poly([(0, -0.6), (0.35, -0.42), (0.55, -0.55), (0.3, -0.7)], fill=True)
    for i in range(6):
        a = math.radians(90 + 60 * i)
        p.ellipse(0.42 * math.cos(a), 0.32 + 0.42 * math.sin(a), 0.27, 0.27)
    p.circle(0, 0.32, 0.25)
    p.face(0, 0.32, 0.25)


def sun(p):
    for i in range(8):
        a = math.radians(22.5 + 45 * i)
        p.line(0.62 * math.cos(a), 0.62 * math.sin(a), 0.92 * math.cos(a), 0.92 * math.sin(a))
    p.circle(0, 0, 0.48)
    p.face(0, 0, 0.48)


def moon(p):
    # crescent = outer circle minus offset circle, traced numerically
    outer, inner = (0, 0, 0.85), (0.38, 0.2, 0.72)
    pts = []
    for i in range(361):
        a = math.radians(i)
        x, y = outer[0] + outer[2] * math.cos(a), outer[1] + outer[2] * math.sin(a)
        if math.hypot(x - inner[0], y - inner[1]) > inner[2]:
            pts.append((i, x, y))
    # rotate list so the gap is at the end
    idx = [i for i, _, _ in pts]
    start = next((k for k in range(1, len(idx)) if idx[k] - idx[k - 1] > 1), 0)
    pts = pts[start:] + pts[:start]
    outer_pts = [(x, y) for _, x, y in pts]
    x0, y0 = outer_pts[-1]
    x1, y1 = outer_pts[0]
    a0 = math.atan2(y0 - inner[1], x0 - inner[0])
    a1 = math.atan2(y1 - inner[1], x1 - inner[0])
    if a1 > a0:
        a1 -= 2 * math.pi
    inner_pts = [(inner[0] + inner[2] * math.cos(a0 + (a1 - a0) * k / 60),
                  inner[1] + inner[2] * math.sin(a0 + (a1 - a0) * k / 60)) for k in range(61)]
    p.poly(outer_pts + inner_pts)
    p.dot(-0.45, 0.12, 0.07)
    p.arc(-0.42, -0.12, 0.16, 0.12, 200, 330)


def fish(p):
    p.poly([(0.45, 0), (0.95, 0.42), (0.95, -0.42)])
    p.ellipse(-0.12, 0, 0.68, 0.46)
    p.dot(-0.48, 0.1, 0.08)
    p.arc(-0.1, 0, 0.18, 0.3, -60, 60)
    p.arc(-0.78, -0.08, 0.1, 0.08, 200, 340)


def bee(p):
    p.ellipse(-0.15, 0.48, 0.28, 0.33)
    p.ellipse(0.25, 0.48, 0.28, 0.33)
    p.poly([(0.58, 0.08), (0.92, -0.05), (0.58, -0.18)])
    rx, ry = 0.68, 0.45
    p.ellipse(0, -0.05, rx, ry)
    for x in (0.05, 0.32):
        h = ry * math.sqrt(1 - (x / rx) ** 2)
        p.line(x, -0.05 - h, x, -0.05 + h)
    p.face(-0.38, -0.05, 0.3)
    p.line(-0.5, 0.35, -0.65, 0.75)
    p.dot(-0.65, 0.77, 0.07)


def mouse(p):
    p.circle(-0.52, 0.42, 0.32)
    p.circle(0.52, 0.42, 0.32)
    p.circle(0, -0.12, 0.6)
    p.face(0, 0.0, 0.55, smile=False)
    p.dot(0, -0.22, 0.09)
    p.arc(0, -0.42, 0.15, 0.1, 200, 340)
    for s in (-1, 1):
        p.line(s * 0.2, -0.25, s * 0.85, -0.15)
        p.line(s * 0.2, -0.3, s * 0.85, -0.42)


def cheese(p):
    p.poly([(-0.9, -0.55), (0.9, -0.55), (0.9, 0.35), (-0.9, -0.05)])
    p.poly([(-0.9, -0.05), (0.9, 0.35), (0.55, 0.7)])
    p.circle(0.35, -0.22, 0.14)
    p.circle(-0.3, -0.32, 0.1)
    p.circle(0.68, 0.08, 0.08)


def rocket(p):
    p.poly([(0, -0.62), (-0.15, -0.95), (0, -0.8), (0.15, -0.95)])
    p.poly([(-0.3, -0.25), (-0.62, -0.62), (-0.3, -0.55)])
    p.poly([(0.3, -0.25), (0.62, -0.62), (0.3, -0.55)])
    nose = _pts_ellipse(0, 0.25, 0.3, 0.72, 0, 180, 30)
    p.poly([(0.3, -0.6)] + nose + [(-0.3, -0.6)])
    p.circle(0, 0.22, 0.14)


def car(p):
    body = [(-0.95, -0.4), (0.95, -0.4), (0.95, 0.0), (0.55, 0.05), (0.3, 0.45),
            (-0.4, 0.45), (-0.6, 0.05), (-0.95, 0.0)]
    p.poly(body)
    p.poly([(0.22, 0.08), (0.42, 0.08), (0.25, 0.36), (0.05, 0.36)])
    p.poly([(-0.05, 0.08), (-0.45, 0.08), (-0.32, 0.36), (-0.05, 0.36)])
    p.circle(-0.5, -0.45, 0.22)
    p.circle(0.5, -0.45, 0.22)


def boat(p):
    p.line(0, -0.35, 0, 0.95)
    p.poly([(0.08, 0.9), (0.08, -0.2), (0.75, -0.2)])
    p.poly([(-0.08, 0.7), (-0.08, -0.2), (-0.55, -0.2)])
    p.poly([(-0.9, -0.35), (0.9, -0.35), (0.6, -0.72), (-0.6, -0.72)])
    wave = [(-0.95 + 0.1 * i, -0.88 + 0.05 * math.sin(i * math.pi / 2)) for i in range(20)]
    p.poly(wave, close=False, fill=False)


def island(p):
    p.poly(_pts_ellipse(0, -0.55, 0.85, 0.35, 0, 180, 40))
    trunk = [(0.0 + 0.12 * math.sin(t / 10 * 1.2), -0.3 + 0.1 * t) for t in range(11)]
    p.poly(trunk, close=False, fill=False)
    tx, ty = trunk[-1]
    for a0, a1, cx in ((20, 160, -0.35), (20, 160, 0.35)):
        p.arc(tx + cx, ty - 0.1, 0.38, 0.22, a0, a1)
    p.arc(tx, ty + 0.05, 0.25, 0.25, 10, 170)
    wave = [(-0.95 + 0.1 * i, -0.72 + 0.05 * math.sin(i * math.pi / 2)) for i in range(20)]
    p.poly(wave, close=False, fill=False)


def bunny(p):
    p.ellipse(-0.25, 0.48, 0.17, 0.45)
    p.ellipse(0.25, 0.48, 0.17, 0.45)
    p.line(-0.25, 0.2, -0.25, 0.7)
    p.line(0.25, 0.2, 0.25, 0.7)
    p.circle(0, -0.3, 0.55)
    p.face(0, -0.25, 0.5, smile=False)
    p.dot(0, -0.38, 0.07)
    p.arc(-0.08, -0.48, 0.08, 0.08, 200, 360)
    p.arc(0.08, -0.48, 0.08, 0.08, 180, 340)


def carrot(p):
    for a in (-35, 0, 35):
        r = math.radians(90 + a)
        p.ellipse(0.32 * math.cos(r), 0.55 + 0.25 * math.sin(r), 0.12, 0.28)
    body = [(-0.32, 0.5), (0.32, 0.5), (0.04, -0.95), (-0.04, -0.95)]
    p.poly(body)
    for y, w in ((0.15, 0.13), (-0.25, 0.1), (-0.55, 0.07)):
        p.line(-w, y, w * 0.4, y - 0.05)


def bird(p):
    p.poly([(0.55, 0.1), (0.95, 0.3), (0.95, -0.1)])
    p.circle(0, 0, 0.6)
    p.poly([(-0.55, 0.15), (-0.92, 0.05), (-0.55, -0.08)])
    p.poly(_pts_ellipse(0.12, -0.05, 0.3, 0.2, 180, 360, 30) + [(0.42, 0.05)])
    p.dot(-0.22, 0.22, 0.08)
    p.line(-0.1, -0.6, -0.15, -0.9)
    p.line(0.15, -0.6, 0.15, -0.9)


def nest(p):
    for x in (-0.35, 0.0, 0.35):
        p.ellipse(x, 0.05, 0.22, 0.3)
    bowl = _pts_ellipse(0, 0.0, 0.9, 0.65, 180, 360, 40)
    p.poly(bowl)
    for k in range(3):
        y = -0.15 - 0.15 * k
        p.arc(0, y + 0.3, 0.75 - 0.12 * k, 0.3, 230, 310)


def puppy(p):
    p.circle(0, -0.05, 0.6)
    p.ellipse(-0.6, 0.0, 0.2, 0.42)
    p.ellipse(0.6, 0.0, 0.2, 0.42)
    p.face(0, 0.05, 0.5, smile=False)
    p.ellipse(0, -0.18, 0.11, 0.08, gray=BLACK)
    p.arc(0, -0.38, 0.17, 0.12, 200, 340)


def bone(p):
    shapes = [("e", (-0.68, 0.18, 0.22, 0.22)), ("e", (-0.68, -0.18, 0.22, 0.22)),
              ("e", (0.68, 0.18, 0.22, 0.22)), ("e", (0.68, -0.18, 0.22, 0.22)),
              ("p", [(-0.7, -0.15), (0.7, -0.15), (0.7, 0.15), (-0.7, 0.15)])]
    p.union(shapes)


def snail(p):
    body = [(-0.95, -0.6), (0.8, -0.6), (0.9, -0.3), (0.75, -0.25), (0.6, -0.45), (-0.95, -0.45)]
    p.poly(body)
    p.circle(-0.1, 0.0, 0.55)
    pts = [(-0.1 + 0.5 * (1 - t / 3.2 / math.pi) * math.cos(t),
            0.0 + 0.5 * (1 - t / 3.2 / math.pi) * math.sin(t)) for t in [k * 0.15 for k in range(66)]]
    p.poly(pts, close=False, fill=False)
    p.line(0.8, -0.3, 0.9, 0.05)
    p.dot(0.9, 0.07, 0.07)
    p.dot(0.78, -0.4, 0.06)


def leaf(p):
    up = [(x, 0.45 * math.sin(math.pi * (x + 0.85) / 1.7)) for x in [-0.85 + 1.7 * k / 40 for k in range(41)]]
    p.poly(up + [(x, -y) for x, y in reversed(up)])
    p.line(-0.95, -0.1, 0.85, 0)
    for x in (-0.4, 0.0, 0.4):
        p.line(x, 0, x + 0.2, 0.25)
        p.line(x, 0, x + 0.2, -0.25)


def frog(p):
    p.circle(-0.35, 0.35, 0.25)
    p.circle(0.35, 0.35, 0.25)
    p.ellipse(0, -0.15, 0.75, 0.5)
    p.circle(-0.35, 0.35, 0.25)
    p.circle(0.35, 0.35, 0.25)
    p.dot(-0.35, 0.37, 0.1)
    p.dot(0.35, 0.37, 0.1)
    p.arc(0, -0.15, 0.45, 0.25, 200, 340)


def lilypad(p):
    pts = _pts_ellipse(0, -0.2, 0.9, 0.55, 15, 345, 60)
    p.poly([(0, -0.2)] + pts)
    p.line(0, -0.2, -0.5, -0.3)
    p.line(0, -0.2, -0.3, -0.6)
    p.circle(0.15, 0.25, 0.13)
    for a in (60, 120, 0, 180):
        r = math.radians(a)
        p.ellipse(0.15 + 0.2 * math.cos(r), 0.3 + 0.12 * math.sin(r), 0.12, 0.09)
    p.circle(0.15, 0.3, 0.09)


def kite(p):
    tail = [(0.0 + 0.15 * math.sin(k * 0.8), -0.25 - 0.07 * k) for k in range(11)]
    p.poly(tail, close=False, fill=False)
    for k in (3, 7):
        x, y = tail[k]
        p.poly([(x, y), (x - 0.15, y + 0.08), (x - 0.15, y - 0.08)])
        p.poly([(x, y), (x + 0.15, y + 0.08), (x + 0.15, y - 0.08)])
    kpts = [(0, 0.95), (0.45, 0.4), (0, -0.25), (-0.45, 0.4)]
    p.poly(kpts)
    p.line(0, 0.95, 0, -0.25)
    p.line(-0.45, 0.4, 0.45, 0.4)


def cloud(p):
    p.union([("e", (-0.5, -0.15, 0.38, 0.38)), ("e", (0.05, 0.12, 0.5, 0.5)),
             ("e", (0.55, -0.15, 0.36, 0.36)),
             ("p", [(-0.5, -0.53), (0.55, -0.53), (0.55, -0.1), (-0.5, -0.1)])])
    p.face(0.02, -0.08, 0.4)


ICONS = {f.__name__: f for f in (star, heart, house, flower, sun, moon, fish, bee, mouse,
                                  cheese, rocket, car, boat, island, bunny, carrot, bird,
                                  nest, puppy, bone, snail, leaf, frog, lilypad, kite, cloud)}


def draw_icon(c, name, cx, cy, size, lw=4):
    p = Pen(c, cx, cy, size, lw)
    try:
        ICONS[name](p)
    finally:
        p.done()


# start icon, goal icon, prompt
STORY_PAIRS = [
    ("bee", "flower", "Help the bee find the flower!"),
    ("mouse", "cheese", "Help the mouse get the cheese!"),
    ("rocket", "moon", "Fly the rocket to the moon!"),
    ("car", "house", "Drive the car home!"),
    ("boat", "island", "Sail the boat to the island!"),
    ("bunny", "carrot", "Help the bunny find the carrot!"),
    ("bird", "nest", "Help the bird fly to its nest!"),
    ("puppy", "bone", "Help the puppy find the bone!"),
    ("snail", "leaf", "Help the snail reach the leaf!"),
    ("frog", "lilypad", "Hop the frog to the lily pad!"),
    ("kite", "cloud", "Fly the kite up to the cloud!"),
    ("fish", "heart", "Help the fish find a friend!"),
    ("sun", "star", "Help the sun say hello to the star!"),
]
