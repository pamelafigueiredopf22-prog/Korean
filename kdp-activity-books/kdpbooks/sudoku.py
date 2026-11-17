"""Sudoku generation, solving, grading and drawing for 4x4, 6x6 and 9x9.

Two independent checks are used on every puzzle:
  * count_solutions(): exhaustive backtracking search -> must be exactly 1
  * LogicSolver: solves like a person (no guessing); it must reach the same
    grid, and the hardest technique it needs sets the difficulty grade.
"""
import itertools

from reportlab.lib.units import inch

from . import layout as L
from .registry import fingerprint

BOXES = {4: (2, 2), 6: (2, 3), 9: (3, 3)}      # (box rows, box cols)


class Geometry:
    def __init__(self, n):
        self.n = n
        self.br, self.bc = BOXES[n]
        self.units = []
        for r in range(n):
            self.units.append([r * n + c for c in range(n)])
        for c in range(n):
            self.units.append([r * n + c for r in range(n)])
        for R in range(0, n, self.br):
            for C in range(0, n, self.bc):
                self.units.append([(R + i) * n + C + j for i in range(self.br) for j in range(self.bc)])
        self.peers = [set() for _ in range(n * n)]
        self.cell_units = [[] for _ in range(n * n)]
        for u in self.units:
            for i in u:
                self.cell_units[i].append(u)
                self.peers[i].update(x for x in u if x != i)

    def box_of(self, i):
        r, c = divmod(i, self.n)
        return (r // self.br) * (self.n // self.bc) + c // self.bc


_GEOS = {}


def geo(n):
    if n not in _GEOS:
        _GEOS[n] = Geometry(n)
    return _GEOS[n]


# ----------------------------------------------------------------------
# exhaustive solver (bitmask backtracking, most-constrained cell first)
# ----------------------------------------------------------------------
def count_solutions(grid, n, limit=2, rng=None, collect=None):
    g = geo(n)
    full = (1 << n) - 1
    grid = list(grid)
    count = 0

    def cands(i):
        used = 0
        for p in g.peers[i]:
            if grid[p]:
                used |= 1 << (grid[p] - 1)
        return full & ~used

    for i in range(n * n):         # givens must not clash
        if grid[i] and any(grid[p] == grid[i] for p in g.peers[i]):
            return 0

    def rec():
        nonlocal count
        best, best_m, best_c = None, None, n + 1
        for i in range(n * n):
            if not grid[i]:
                m = cands(i)
                k = bin(m).count("1")
                if k < best_c:
                    best, best_m, best_c = i, m, k
                    if k <= 1:
                        break
        if best is None:
            count += 1
            if collect is not None and not collect:
                collect.append(list(grid))
            return count >= limit
        if best_c == 0:
            return False
        digits = [d + 1 for d in range(n) if best_m >> d & 1]
        if rng:
            rng.shuffle(digits)
        for d in digits:
            grid[best] = d
            if rec():
                return True
        grid[best] = 0
        return False

    rec()
    return count


def random_solution(rng, n):
    out = []
    count_solutions([0] * (n * n), n, limit=1, rng=rng, collect=out)
    return out[0]


# ----------------------------------------------------------------------
# human-style logic solver for grading
# ----------------------------------------------------------------------
TECHNIQUES = ["naked single", "hidden single", "pointing / box-line", "naked pair",
              "hidden pair", "naked triple", "x-wing"]


class LogicSolver:
    def __init__(self, grid, n):
        self.n, self.g = n, geo(n)
        self.grid = list(grid)
        self.c = [set() if v else set(range(1, n + 1)) for v in grid]
        for i, v in enumerate(grid):
            if v:
                self._place(i, v, init=True)
        self.used = set()

    def _place(self, i, v, init=False):
        self.grid[i] = v
        self.c[i] = set()
        for p in self.g.peers[i]:
            self.c[p].discard(v)

    def step(self):
        n, g, c = self.n, self.g, self.c
        for i in range(n * n):                                     # naked single
            if not self.grid[i] and len(c[i]) == 1:
                self._place(i, next(iter(c[i])))
                return 0
        for u in g.units:                                          # hidden single
            for d in range(1, n + 1):
                spots = [i for i in u if d in c[i]]
                if len(spots) == 1 and not self.grid[spots[0]]:
                    self._place(spots[0], d)
                    return 1
        changed = False                                            # pointing / box-line
        boxes = g.units[2 * n:]
        lines = g.units[:2 * n]
        for b in boxes:
            for d in range(1, n + 1):
                spots = [i for i in b if d in c[i]]
                if len(spots) < 2:
                    continue
                for ln in lines:
                    if all(s in ln for s in spots):
                        for x in ln:
                            if x not in b and d in c[x]:
                                c[x].discard(d)
                                changed = True
        for ln in lines:
            for d in range(1, n + 1):
                spots = [i for i in ln if d in c[i]]
                if len(spots) < 2:
                    continue
                for b in boxes:
                    if all(s in b for s in spots):
                        for x in b:
                            if x not in ln and d in c[x]:
                                c[x].discard(d)
                                changed = True
        if changed:
            return 2
        for size, tech in ((2, 3), (3, 5)):                        # naked pair / triple
            for u in g.units:
                cells = [i for i in u if 2 <= len(c[i]) <= size]
                for combo in itertools.combinations(cells, size):
                    union = set().union(*(c[i] for i in combo))
                    if len(union) == size:
                        for x in u:
                            if x not in combo and c[x] & union:
                                c[x] -= union
                                changed = True
                if changed:
                    return tech
        for u in g.units:                                          # hidden pair
            pos = {d: [i for i in u if d in c[i]] for d in range(1, n + 1)}
            for d1, d2 in itertools.combinations(range(1, n + 1), 2):
                if len(pos[d1]) == 2 and pos[d1] == pos[d2]:
                    for i in pos[d1]:
                        if c[i] - {d1, d2}:
                            c[i] &= {d1, d2}
                            changed = True
            if changed:
                return 4
        for d in range(1, n + 1):                                  # x-wing (rows and cols)
            for lines_a, lines_b in ((g.units[:n], g.units[n:2 * n]), (g.units[n:2 * n], g.units[:n])):
                pos = []
                for k, ln in enumerate(lines_a):
                    spots = [i for i in ln if d in c[i]]
                    if len(spots) == 2:
                        pos.append((k, spots))
                for (k1, s1), (k2, s2) in itertools.combinations(pos, 2):
                    cross1 = [lb for lb in lines_b if s1[0] in lb and s2[0] in lb]
                    cross2 = [lb for lb in lines_b if s1[1] in lb and s2[1] in lb]
                    if cross1 and cross2:
                        for lb in (cross1[0], cross2[0]):
                            for x in lb:
                                if x not in s1 + s2 and d in c[x]:
                                    c[x].discard(d)
                                    changed = True
                if changed:
                    return 6
        return None

    def solve(self):
        while 0 in self.grid:
            t = self.step()
            if t is None:
                return False
            self.used.add(t)
        return True

    @property
    def level(self):
        return max(self.used) if self.used else 0


# ----------------------------------------------------------------------
class Sudoku:
    def __init__(self, n, solution, givens):
        self.n, self.solution, self.givens = n, solution, givens

    def verify(self):
        n, g = self.n, geo(self.n)
        sol_ok = all(sorted(self.solution[i] for i in u) == list(range(1, n + 1)) for u in g.units)
        consistent = all(not v or v == self.solution[i] for i, v in enumerate(self.givens))
        unique = count_solutions(self.givens, n, limit=2) == 1
        ls = LogicSolver(self.givens, n)
        logic_ok = ls.solve() and ls.grid == self.solution
        return {"valid_solution": sol_ok, "givens_match": consistent, "unique": unique,
                "logic_solves": logic_ok, "level": ls.level,
                "clues": sum(1 for v in self.givens if v)}

    def canonical(self):
        """Relabel digits by first appearance so a digit-swapped copy of a puzzle
        gets the same fingerprint (a disguised duplicate)."""
        order = {}
        for v in self.solution:
            order.setdefault(v, len(order) + 1)
        return tuple(order[v] if v else 0 for v in self.givens)

    def fingerprint(self):
        return fingerprint("sudoku", self.n, tuple(self.givens))

    def claim_in(self, reg, where):
        t = self.canonical()
        n = self.n
        transposed = tuple(t[c * n + r] for r in range(n) for c in range(n)) if n in (4, 9) else None
        alts = [fingerprint("sudoku-canon", n, t)]
        if transposed:
            # relabel the transposed grid too
            sol_t = [self.solution[c * n + r] for r in range(n) for c in range(n)]
            giv_t = [self.givens[c * n + r] for r in range(n) for c in range(n)]
            alts.append(fingerprint("sudoku-canon", n, Sudoku(n, sol_t, giv_t).canonical()))
        return reg.claim(self.fingerprint(), where, alt_fps=tuple(alts))


def make_sudoku(rng, n, target_clues, max_level=1, min_level=0, symmetric=False, tries=400):
    """Remove clues from a random full grid while the solution stays unique,
    until target_clues remain; keep it only if its logic grade is in range."""
    for _ in range(tries):
        sol = random_solution(rng, n)
        givens = list(sol)
        order = list(range(n * n))
        rng.shuffle(order)
        for i in order:
            if sum(1 for v in givens if v) <= target_clues:
                break
            j = n * n - 1 - i
            pair = [i, j] if symmetric and j != i else [i]
            if any(not givens[k] for k in pair):
                continue
            keep = [givens[k] for k in pair]
            for k in pair:
                givens[k] = 0
            if count_solutions(givens, n, 2) != 1:
                for k, v in zip(pair, keep):
                    givens[k] = v
                continue
            ls = LogicSolver(givens, n)
            if not ls.solve() or ls.level > max_level:
                for k, v in zip(pair, keep):
                    givens[k] = v
        clues = sum(1 for v in givens if v)
        if clues > target_clues + (1 if symmetric else 0):
            continue
        ls = LogicSolver(givens, n)
        if ls.solve() and min_level <= ls.level <= max_level:
            return Sudoku(n, sol, givens)
    raise RuntimeError(f"no {n}x{n} sudoku with {target_clues} clues, level {min_level}-{max_level}")


# ----------------------------------------------------------------------
def draw_sudoku(c, s, x, y, size, show_solution=False, font=None, thick=None, thin=None,
                given_frac=0.58, answer_gray=0.45):
    """Square grid with bottom-left (x, y) and side `size`."""
    n = s.n
    g = geo(n)
    cell = size / n
    font = font or L.BODY_BOLD
    thick = thick or max(2.0, size * 0.012)
    thin = thin or max(0.6, size * 0.003)
    c.saveState()
    c.setLineCap(2)
    for k in range(n + 1):
        box_line_v = k % g.bc == 0
        box_line_h = k % g.br == 0
        c.setLineWidth(thick if box_line_v else thin)
        c.line(x + k * cell, y, x + k * cell, y + size)
        c.setLineWidth(thick if box_line_h else thin)
        c.line(x, y + size - k * cell, x + size, y + size - k * cell)
    fs = cell * given_frac
    for i in range(n * n):
        r, col = divmod(i, n)
        cx, cy = x + (col + 0.5) * cell, y + size - (r + 0.5) * cell - fs * 0.36
        if s.givens[i]:
            c.setFont(font, fs)
            c.setFillGray(0)
            c.drawCentredString(cx, cy, str(s.givens[i]))
        elif show_solution:
            c.setFont(L.BODY, fs)
            c.setFillGray(answer_gray)
            c.drawCentredString(cx, cy, str(s.solution[i]))
    c.restoreState()
