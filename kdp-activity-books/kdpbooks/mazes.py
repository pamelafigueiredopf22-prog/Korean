"""Maze generation, verification and drawing.

A maze is a graph of cells.  We carve a *spanning tree* of that graph
(randomised depth-first search), which guarantees exactly one route between
any two cells.  verify() re-checks that independently of the generator.
"""
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
    def carve(self, rng, straight_bias=0.0):
        """Randomised DFS ("recursive backtracker").  straight_bias in [0,1)
        makes corridors longer/straighter (easier for small children)."""
        root = rng.choice(self.cells)
        seen, stack, last_dir = {root}, [root], {root: None}
        while stack:
            cur = stack[-1]
            nbrs = [n for n in self.potential[cur] if n not in seen]
            if not nbrs:
                stack.pop()
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
        """Overridden by geometry; used only for straight_bias."""
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
# Rectangular grid
# ======================================================================
class GridMaze(Maze):
    def __init__(self, cols, rows, start_col, goal_col):
        self.cols, self.rows = cols, rows
        cells = [(r, c) for r in range(rows) for c in range(cols)]
        pot = {}
        for r, c in cells:
            pot[(r, c)] = [(r + dr, c + dc) for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1))
                           if 0 <= r + dr < rows and 0 <= c + dc < cols]
        # start opening in the top wall, goal opening in the bottom wall
        super().__init__(cells, pot, (0, start_col), (rows - 1, goal_col))

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
                bits.append("1" if b in self.open[a] else "0")
        for r in range(R - 1):
            for col in range(C):
                bits.append("1" if (r + 1, f(col)) in self.open[(r, f(col))] else "0")
        return "".join(bits) + f"|{f(self.start[1])}|{f(self.goal[1])}"

    def fingerprint(self, mirror=False):
        return fingerprint("grid", self.cols, self.rows, self.signature(mirror))

    def claim_in(self, reg, where, min_diff=0.4):
        sig = self.signature().split("|")[0]
        return reg.claim(self.fingerprint(), where, alt_fps=(self.fingerprint(True),),
                         sig=sig, sig_key=f"grid{self.cols}x{self.rows}", min_diff=min_diff)

    # ---- geometry --------------------------------------------------
    def wall_segments(self):
        """Return merged wall segments in cell units, origin top-left, y down.
        Border openings: top of start cell, bottom of goal cell."""
        R, C = self.rows, self.cols
        horiz = []   # (y, x0, x1)
        for y in range(R + 1):
            run = None
            for x in range(C):
                if y == 0:
                    wall = (0, x) != self.start
                elif y == R:
                    wall = (R - 1, x) != self.goal
                else:
                    wall = (y, x) not in self.open[(y - 1, x)]
                if wall and run is None:
                    run = x
                if not wall and run is not None:
                    horiz.append((y, run, x)); run = None
            if run is not None:
                horiz.append((y, run, C))
        vert = []    # (x, y0, y1)
        for x in range(C + 1):
            run = None
            for y in range(R):
                wall = x in (0, C) or (y, x) not in self.open[(y, x - 1)]
                if wall and run is None:
                    run = y
                if not wall and run is not None:
                    vert.append((x, run, y)); run = None
            if run is not None:
                vert.append((x, run, R))
        return horiz, vert

    def border_openings(self):
        horiz, vert = self.wall_segments()
        covered = 0
        for y, x0, x1 in horiz:
            if y in (0, self.rows):
                covered += x1 - x0
        for x, y0, y1 in vert:
            if x in (0, self.cols):
                covered += y1 - y0
        return 2 * (self.rows + self.cols) - covered


def make_grid_maze(rng, cols, rows, straight_bias=0.3, min_path_frac=0.25):
    """Generate a verified grid maze whose solution is not trivially short."""
    for _ in range(200):
        sc = rng.randrange(cols)
        gc = rng.randrange(cols)
        m = GridMaze(cols, rows, sc, gc).carve(rng, straight_bias)
        if len(m.solve()) >= max(rows + 1, min_path_frac * cols * rows) and m.ok():
            return m
    raise RuntimeError("could not build maze")


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
        path = m.solve()
        c.setStrokeGray(sol_gray)
        c.setLineWidth(sol_w or cell * 0.38)
        p = c.beginPath()
        p.moveTo(*P(path[0][1] + 0.5, -0.35))
        for r, col in path:
            p.lineTo(*P(col + 0.5, r + 0.5))
        p.lineTo(*P(path[-1][1] + 0.5, m.rows + 0.35))
        c.drawPath(p, stroke=1, fill=0)
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
        "start_xy": P(m.start[1] + 0.5, 0), "goal_xy": P(m.goal[1] + 0.5, m.rows),
    }
