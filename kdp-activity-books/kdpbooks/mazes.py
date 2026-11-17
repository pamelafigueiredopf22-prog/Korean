"""Maze generation, verification and drawing.

A maze is a graph of cells.  We carve a *spanning tree* of that graph
(randomised depth-first search / growing tree), which guarantees exactly one
route between any two cells.  verify() re-checks that independently of the
generator, and qa.audit_maze_pixels() re-reads every wall from the printed page.

Maze kinds:
  GridMaze    rectangular grid, optionally clipped to a silhouette (heart, star...)
  CircleMaze  concentric rings ("theta" maze), goal in the centre
"""
import math
import random
from collections import deque

from .registry import fingerprint


class Maze:
    def __init__(self, cells, potential, start, goal):
        self.cells = list(cells)
        self.potential = potential          # cell -> list of neighbour cells
        self.start, self.goal = start, goal
        self.open = {c: set() for c in self.cells}   # carved passages

    # ---- generation --------------------------------------------------
    def carve(self, rng, straight_bias=0.0, branchiness=0.0):
        """Growing-tree carve.  branchiness=0 is the classic recursive backtracker
        (long winding corridors); higher values pick a random cell from the
        stack more often, giving more side branches and dead ends.
        straight_bias in [0,1) makes corridors straighter (easier for small kids)."""
        root = rng.choice(self.cells)
        seen, stack, last_dir = {root}, [root], {root: None}
        while stack:
            if branchiness and rng.random() < branchiness:
                si = rng.randrange(len(stack))
            else:
                si = len(stack) - 1
            cur = stack[si]
            nbrs = [n for n in self.potential[cur] if n not in seen]
            if not nbrs:
                stack.pop(si)
                continue
            nxt = None
            if straight_bias and last_dir[cur] is not None and rng.random() < straight_bias:
                want = self.direction(cur, last_dir[cur])
                same = [n for n in nbrs if self.direction(cur, n) == want]
                if same:
                    nxt = same[0]
            nxt = nxt or rng.choice(nbrs)
            self.open[cur].add(nxt)
            self.open[nxt].add(cur)
            seen.add(nxt)
            last_dir[nxt] = cur
            stack.append(nxt)
        return self

    def direction(self, a, b):
        return None

    # ---- solving / checking ----------------------------------------
    def solve(self):
        prev, q = {self.start: None}, deque([self.start])
        while q:
            cur = q.popleft()
            if cur == self.goal:
                break
            for n in self.open[cur]:
                if n not in prev:
                    prev[n] = cur
                    q.append(n)
        path, cur = [], self.goal
        while cur is not None:
            path.append(cur)
            cur = prev.get(cur)
        return path[::-1]

    def count_solutions(self, limit=2):
        """Count simple paths start->goal (stops at `limit`). Independent of tree logic."""
        count = 0
        stack = [(self.start, {self.start})]
        while stack and count < limit:
            cur, visited = stack.pop()
            if cur == self.goal:
                count += 1
                continue
            for n in self.open[cur]:
                if n not in visited:
                    stack.append((n, visited | {n}))
        return count

    def dead_ends(self):
        return sum(1 for c in self.cells if len(self.open[c]) == 1)

    def verify(self):
        n_cells = len(self.cells)
        n_edges = sum(len(v) for v in self.open.values()) // 2
        reach, q = {self.start}, deque([self.start])
        while q:
            for n in self.open[q.popleft()]:
                if n not in reach:
                    reach.add(n)
                    q.append(n)
        for a, nb in self.open.items():
            for b in nb:
                assert a in self.open[b], "asymmetric passage"
                assert b in self.potential[a], "passage through a non-adjacent wall"
        return {
            "all_cells_reachable": len(reach) == n_cells,
            "is_tree": n_edges == n_cells - 1,
            "solutions": self.count_solutions(),
        }

    def ok(self):
        v = self.verify()
        return v["all_cells_reachable"] and v["is_tree"] and v["solutions"] == 1


# ======================================================================
# Rectangular grid (optionally clipped to a silhouette)
# ======================================================================
class GridMaze(Maze):
    kind = "grid"

    def __init__(self, cols, rows, start_col=None, goal_col=None, mask=None, mask_name=None,
                 start=None, goal=None):
        self.cols, self.rows = cols, rows
        self.mask, self.mask_name = mask, mask_name
        cells = [(r, c) for r in range(rows) for c in range(cols) if self.active((r, c))]
        pot = {}
        for r, c in cells:
            pot[(r, c)] = [(r + dr, c + dc) for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1))
                           if self.active((r + dr, c + dc))]
        # start opening in the top wall of `start`, goal opening in the bottom wall of `goal`
        start = start or (0, start_col)
        goal = goal or (rows - 1, goal_col)
        super().__init__(cells, pot, start, goal)

    def active(self, cell):
        r, c = cell
        if not (0 <= r < self.rows and 0 <= c < self.cols):
            return False
        return self.mask is None or cell in self.mask

    def direction(self, a, b):
        return (b[0] - a[0], b[1] - a[1])

    def signature(self, mirror=False):
        """Bit string of every internal wall (1 = open) + start/goal columns."""
        C, R = self.cols, self.rows
        f = (lambda col: C - 1 - col) if mirror else (lambda col: col)
        bits = []
        for r in range(R):
            for col in range(C - 1):     # walls between (r,col) and (r,col+1)
                a, b = (r, f(col)), (r, f(col + 1))
                if self.active(a) and self.active(b):
                    bits.append("1" if b in self.open[a] else "0")
        for r in range(R - 1):
            for col in range(C):
                a, b = (r, f(col)), (r + 1, f(col))
                if self.active(a) and self.active(b):
                    bits.append("1" if b in self.open[a] else "0")
        return "".join(bits) + f"|{f(self.start[1])}|{f(self.goal[1])}"

    def fingerprint(self, mirror=False):
        if self.mask is None:
            return fingerprint("grid", self.cols, self.rows, self.signature(mirror))
        return fingerprint("shape", self.mask_name, self.cols, self.rows, self.signature(mirror))

    def sig_key(self):
        return f"grid{self.cols}x{self.rows}" if self.mask is None else \
            f"shape-{self.mask_name}-{self.cols}x{self.rows}"

    def claim_in(self, reg, where, min_diff=0.4):
        sig = self.signature().split("|")[0]
        return reg.claim(self.fingerprint(), where, alt_fps=(self.fingerprint(True),),
                         sig=sig, sig_key=self.sig_key(), min_diff=min_diff)

    # ---- geometry --------------------------------------------------
    def edge_walls(self):
        """Every edge touching an active cell -> (is_wall, is_border).
        Keys: ('h', y, x) = horizontal edge on grid line y under column x;
              ('v', x, y) = vertical edge on grid line x beside row y."""
        out = {}
        for y in range(self.rows + 1):
            for x in range(self.cols):
                a, b = (y - 1, x), (y, x)
                A, B = self.active(a), self.active(b)
                if not (A or B):
                    continue
                if A and B:
                    out[("h", y, x)] = (b not in self.open[a], False)
                else:
                    opening = (b == self.start and not A) or (a == self.goal and not B)
                    out[("h", y, x)] = (not opening, True)
        for x in range(self.cols + 1):
            for y in range(self.rows):
                a, b = (y, x - 1), (y, x)
                A, B = self.active(a), self.active(b)
                if not (A or B):
                    continue
                out[("v", x, y)] = ((b not in self.open[a]) if (A and B) else True, not (A and B))
        return out

    def wall_segments(self):
        """Merged wall segments in cell units (origin top-left, y down)."""
        ew = self.edge_walls()
        horiz, vert = [], []
        for y in range(self.rows + 1):
            run = None
            for x in range(self.cols + 1):
                wall = x < self.cols and ew.get(("h", y, x), (False,))[0]
                if wall and run is None:
                    run = x
                if not wall and run is not None:
                    horiz.append((y, run, x)); run = None
        for x in range(self.cols + 1):
            run = None
            for y in range(self.rows + 1):
                wall = y < self.rows and ew.get(("v", x, y), (False,))[0]
                if wall and run is None:
                    run = y
                if not wall and run is not None:
                    vert.append((x, run, y)); run = None
        return horiz, vert

    def border_openings(self):
        return sum(1 for wall, border in self.edge_walls().values() if border and not wall)

    def probes(self, geo):
        """(pdf_x, pdf_y, expect_wall) at the midpoint of every edge."""
        cell, ox, oy = geo["cell"], geo["ox"], geo["oy_top"]
        out = []
        for (k, a, b), (wall, _) in self.edge_walls().items():
            if k == "h":
                out.append((ox + (b + 0.5) * cell, oy - a * cell, wall))
            else:
                out.append((ox + a * cell, oy - (b + 0.5) * cell, wall))
        return out

    def path_points(self, P):
        path = self.solve()
        pts = [P(path[0][1] + 0.5, path[0][0] - 0.35)]
        pts += [P(c + 0.5, r + 0.5) for r, c in path]
        pts.append(P(path[-1][1] + 0.5, path[-1][0] + 1.35))
        return pts


def make_grid_maze(rng, cols, rows, straight_bias=0.3, min_path_frac=0.25, branchiness=0.0):
    """Generate a verified grid maze whose solution is not trivially short."""
    for _ in range(200):
        sc = rng.randrange(cols)
        gc = rng.randrange(cols)
        m = GridMaze(cols, rows, sc, gc).carve(rng, straight_bias, branchiness)
        if len(m.solve()) >= max(rows + 1, min_path_frac * cols * rows) and m.ok():
            return m
    raise RuntimeError("could not build maze")


def _largest_component(cells):
    cells, best = set(cells), set()
    while cells:
        seed = cells.pop()
        comp, q = {seed}, deque([seed])
        while q:
            r, c = q.popleft()
            for n in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if n in cells:
                    cells.discard(n); comp.add(n); q.append(n)
        best = max(best, comp, key=len)
    return best


def make_shape_maze(rng, shape_name, cols, rows, branchiness=0.25, min_path_frac=0.15):
    """Grid maze clipped to a silhouette from SHAPES."""
    test = SHAPES[shape_name]
    mask = set()
    for r in range(rows):
        for c in range(cols):
            x = (c + 0.5) / cols * 2 - 1
            y = (1 - (r + 0.5) / rows * 2) * SHAPE_ASPECT.get(shape_name, 1.0)
            if test(x, y):
                mask.add((r, c))
    mask = _largest_component(mask)
    # crop the grid to the silhouette so the shape fills the space it is given
    r0, c0 = min(r for r, _ in mask), min(c for _, c in mask)
    mask = {(r - r0, c - c0) for r, c in mask}
    rows, cols = max(r for r, _ in mask) + 1, max(c for _, c in mask) + 1
    top = min(r for r, _ in mask)
    bot = max(r for r, _ in mask)
    tops = sorted(c for r, c in mask if r == top)
    bots = sorted(c for r, c in mask if r == bot)
    for _ in range(200):
        start, goal = (top, rng.choice(tops)), (bot, rng.choice(bots))
        m = GridMaze(cols, rows, mask=mask, mask_name=shape_name, start=start, goal=goal)
        m.carve(rng, 0.0, branchiness)
        if len(m.solve()) >= min_path_frac * len(mask) and m.ok():
            return m
    raise RuntimeError("could not build shape maze")


# ---- silhouettes in the box [-1,1]x[-1,1] (y up) ----------------------
def _in_poly(x, y, pts):
    inside = False
    for i in range(len(pts)):
        (x1, y1), (x2, y2) = pts[i], pts[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


_STAR = [(0.98 * math.cos(math.radians(90 + 36 * i)) * (1 if i % 2 == 0 else 0.56),
          0.98 * math.sin(math.radians(90 + 36 * i)) * (1 if i % 2 == 0 else 0.56) - 0.08)
         for i in range(10)]
_HOUSE = [(-0.78, -1), (0.78, -1), (0.78, 0.2), (1, 0.2), (0, 1), (-1, 0.2), (-0.78, 0.2)]
_TREE = [(-0.18, -1), (0.18, -1), (0.18, -0.72), (0.95, -0.72), (0.45, -0.2), (0.75, -0.2),
         (0.3, 0.35), (0.55, 0.35), (0, 1), (-0.55, 0.35), (-0.3, 0.35), (-0.75, -0.2),
         (-0.45, -0.2), (-0.95, -0.72), (-0.18, -0.72)]

SHAPES = {
    "heart": lambda x, y: ((1.14 * x) ** 2 + (1.12 * y + 0.12) ** 2 - 1) ** 3
                          - (1.14 * x) ** 2 * (1.12 * y + 0.12) ** 3 <= 0,
    "star": lambda x, y: _in_poly(x, y, _STAR),
    "house": lambda x, y: _in_poly(x, y, _HOUSE),
    "diamond": lambda x, y: abs(x) + abs(y) <= 1.0,
    "tree": lambda x, y: _in_poly(x, y, _TREE),
    # cloud and fish are defined in "true" proportions; SHAPE_ASPECT squashes the grid
    "fish": lambda x, y: ((x + 0.12) / 0.8) ** 2 + (y / 0.62) ** 2 <= 1
                         or (0.5 <= x <= 1.0 and abs(y) <= (x - 0.5) * 1.1),
    "cloud": lambda x, y: any((x - a) ** 2 + (y - b) ** 2 <= r * r for a, b, r in
                              ((-0.55, -0.18, 0.4), (0.04, 0.16, 0.52), (0.6, -0.16, 0.38)))
                          or (-0.55 <= x <= 0.6 and -0.58 <= y <= -0.3),
}
# rows = cols * aspect; the shape test receives y scaled to the true proportions
SHAPE_ASPECT = {"fish": 0.75, "cloud": 0.7}
SHAPE_LABELS = {"heart": "Heart", "star": "Star", "house": "House", "diamond": "Diamond",
                "tree": "Tree", "fish": "Fish", "cloud": "Cloud"}


def draw_grid_maze(c, m, x, y, w, h, lw, solution=False, sol_gray=0.62, sol_w=None):
    """Draw maze m centred in the box (x, y, w, h) [PDF coords, y up].
    Returns geometry dict for layout and QA."""
    cell = min(w / m.cols, h / m.rows)
    mw, mh = cell * m.cols, cell * m.rows
    ox, oy_top = x + (w - mw) / 2, y + h - (h - mh) / 2

    def P(cx, cy):          # cell units (y down) -> PDF points
        return ox + cx * cell, oy_top - cy * cell

    c.saveState()
    c.setLineCap(1)
    c.setLineJoin(1)
    if solution:
        _polyline(c, m.path_points(P), sol_gray, sol_w or cell * 0.38)
    c.setStrokeGray(0)
    c.setLineWidth(lw)
    horiz, vert = m.wall_segments()
    for yy, x0, x1 in horiz:
        c.line(*P(x0, yy), *P(x1, yy))
    for xx, y0, y1 in vert:
        c.line(*P(xx, y0), *P(xx, y1))
    c.restoreState()
    return {
        "cell": cell, "ox": ox, "oy_top": oy_top, "w": mw, "h": mh,
        "start_xy": P(m.start[1] + 0.5, m.start[0]), "goal_xy": P(m.goal[1] + 0.5, m.goal[0] + 1),
    }


def _polyline(c, pts, gray, width):
    c.setStrokeGray(gray)
    c.setLineWidth(width)
    p = c.beginPath()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    c.drawPath(p, stroke=1, fill=0)


# ======================================================================
# Circular ("theta") maze
# ======================================================================
class CircleMaze(Maze):
    """Ring 0 is a single centre cell (the goal) of radius `core` ring-units.
    Ring r >= 1 spans radii [core + r - 1, core + r] and has n[r] cells.
    The start is an opening in the outer wall."""
    kind = "circle"

    def __init__(self, rings, start_k, core=1.6, first_ring=None):
        self.rings, self.core = rings, core
        n = [1]
        n.append(first_ring or max(6, round(2 * math.pi * (core + 0.5) / 1.3)))
        for r in range(2, rings):
            mid = core + r - 0.5
            n.append(n[-1] * 2 if 2 * math.pi * mid / n[-1] > 2.0 else n[-1])
        self.n = n
        cells = [(0, 0)] + [(r, k) for r in range(1, rings) for k in range(n[r])]
        pot = {cell: [] for cell in cells}
        for r in range(1, rings):
            for k in range(n[r]):
                pot[(r, k)].append((r, (k + 1) % n[r]))
                pot[(r, k)].append((r, (k - 1) % n[r]))
                par = self.parent((r, k))
                pot[(r, k)].append(par)
                pot[par].append((r, k))
        pot = {k: list(dict.fromkeys(v)) for k, v in pot.items()}
        super().__init__(cells, pot, (rings - 1, start_k), (0, 0))

    def parent(self, cell):
        r, k = cell
        return (0, 0) if r == 1 else (r - 1, k * self.n[r - 1] // self.n[r])

    def inner(self, r):
        return 0 if r == 0 else self.core + r - 1

    def outer(self, r):
        return self.core + r

    def span(self, cell, rot=0.0):
        r, k = cell
        a = 360.0 / self.n[r]
        return rot + k * a, rot + (k + 1) * a

    def rotation(self):
        """Degrees that put the start cell's centre straight up (90 deg)."""
        a0, a1 = self.span(self.start)
        return 90 - (a0 + a1) / 2

    def direction(self, a, b):
        return None

    def signature(self):
        bits = []
        for r in range(1, self.rings):
            for k in range(self.n[r]):
                bits.append("1" if (r, (k + 1) % self.n[r]) in self.open[(r, k)] else "0")
                bits.append("1" if self.parent((r, k)) in self.open[(r, k)] else "0")
        return "".join(bits)

    def fingerprint(self):
        return fingerprint("circle", self.rings, tuple(self.n), self.start, self.signature())

    def claim_in(self, reg, where, min_diff=0.4):
        return reg.claim(self.fingerprint(), where, sig=self.signature(),
                         sig_key=f"circle{self.rings}-{self.n[1]}", min_diff=min_diff)

    def border_openings(self):
        return 1   # by construction: only the start cell's outer arc is omitted

    # ---- geometry ----------------------------------------------------
    def walls(self):
        """('arc', radius, a0, a1) and ('rad', angle, r0, r1) in ring units, unrotated."""
        out = []
        R = self.rings
        for r in range(1, R + 1):              # arc at the inner boundary of ring r
            radius = self.inner(r) if r < R else self.outer(R - 1)
            segs = []
            for k in range(self.n[r] if r < R else self.n[R - 1]):
                if r < R:
                    wall = self.parent((r, k)) not in self.open[(r, k)]
                    a0, a1 = self.span((r, k))
                else:
                    wall = (R - 1, k) != self.start
                    a0, a1 = self.span((R - 1, k))
                if wall:
                    if segs and abs(segs[-1][1] - a0) < 1e-9:
                        segs[-1][1] = a1
                    else:
                        segs.append([a0, a1])
            if len(segs) > 1 and abs(segs[0][0]) < 1e-9 and abs(segs[-1][1] - 360) < 1e-9:
                segs[0][0] = segs[-1][0] - 360
                segs.pop()
            out += [("arc", radius, a0, a1) for a0, a1 in segs]
        for r in range(1, R):
            for k in range(self.n[r]):
                if (r, (k + 1) % self.n[r]) not in self.open[(r, k)]:
                    out.append(("rad", self.span((r, k))[1], self.inner(r), self.outer(r)))
        return out

    def probes(self, geo):
        cx, cy, u, rot = geo["cx"], geo["cy"], geo["unit"], geo["rot"]

        def P(radius, ang):
            t = math.radians(ang + rot)
            return cx + radius * u * math.cos(t), cy + radius * u * math.sin(t)

        out = []
        for r in range(1, self.rings):
            for k in range(self.n[r]):
                a0, a1 = self.span((r, k))
                mid = (a0 + a1) / 2
                out.append((*P(self.inner(r), mid), self.parent((r, k)) not in self.open[(r, k)]))
                out.append((*P(self.inner(r) + 0.5, a1),
                            (r, (k + 1) % self.n[r]) not in self.open[(r, k)]))
        for k in range(self.n[self.rings - 1]):
            a0, a1 = self.span((self.rings - 1, k))
            out.append((*P(self.outer(self.rings - 1), (a0 + a1) / 2),
                        (self.rings - 1, k) != self.start))
        return out

    def path_points(self, P):
        """P(radius, angle_deg) -> pdf point.  Route stays inside open cells."""
        path = self.solve()

        def mid_r(cell):
            return 0 if cell[0] == 0 else self.inner(cell[0]) + 0.5

        def mid_a(cell):
            a0, a1 = self.span(cell)
            return (a0 + a1) / 2

        def arc(radius, a, b):
            d = (b - a + 180) % 360 - 180
            steps = max(2, int(abs(d) / 4))
            return [P(radius, a + d * i / steps) for i in range(1, steps + 1)]

        pts = [P(self.outer(self.rings - 1) + 0.45, mid_a(path[0])), P(mid_r(path[0]), mid_a(path[0]))]
        for a, b in zip(path, path[1:]):
            if b == (0, 0):
                pts.append(P(0, 0))
            elif a[0] == b[0]:
                pts += arc(mid_r(a), mid_a(a), mid_a(b))
            elif b[0] == a[0] - 1:          # inward: radial first, then along ring b
                pts.append(P(mid_r(b), mid_a(a)))
                pts += arc(mid_r(b), mid_a(a), mid_a(b))
            else:                           # outward: along ring a, then radial
                pts += arc(mid_r(a), mid_a(a), mid_a(b))
                pts.append(P(mid_r(b), mid_a(b)))
        return pts


def make_circle_maze(rng, rings, branchiness=0.2, core=1.6, min_path_frac=0.12):
    for _ in range(200):
        probe = CircleMaze(rings, 0, core)
        k = rng.randrange(probe.n[-1])
        m = CircleMaze(rings, k, core).carve(rng, 0.0, branchiness)
        if len(m.solve()) >= max(rings + 2, min_path_frac * len(m.cells)) and m.ok():
            return m
    raise RuntimeError("could not build circle maze")


def draw_circle_maze(c, m, x, y, w, h, lw, solution=False, sol_gray=0.62, sol_w=None):
    """Draw a circular maze centred in the box; start opening points straight up."""
    R = m.outer(m.rings - 1)
    unit = min(w, h) / 2 / R
    cx, cy = x + w / 2, y + h / 2
    rot = m.rotation()

    def P(radius, ang):
        t = math.radians(ang + rot)
        return cx + radius * unit * math.cos(t), cy + radius * unit * math.sin(t)

    c.saveState()
    c.setLineCap(1)
    c.setLineJoin(1)
    if solution:
        _polyline(c, m.path_points(P), sol_gray, sol_w or unit * 0.38)
    c.setStrokeGray(0)
    c.setLineWidth(lw)
    for wall in m.walls():
        if wall[0] == "arc":
            _, radius, a0, a1 = wall
            rr = radius * unit
            c.arc(cx - rr, cy - rr, cx + rr, cy + rr, a0 + rot, a1 - a0)
        else:
            _, ang, r0, r1 = wall
            c.line(*P(r0, ang), *P(r1, ang))
    c.restoreState()
    return {"cx": cx, "cy": cy, "unit": unit, "rot": rot, "radius": R * unit,
            "core": m.core * unit, "start_xy": (cx, cy + R * unit), "goal_xy": (cx, cy)}


def draw_maze(c, m, *a, **kw):
    return (draw_circle_maze if isinstance(m, CircleMaze) else draw_grid_maze)(c, m, *a, **kw)
