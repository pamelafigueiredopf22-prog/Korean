"""Word-search generation, verification and drawing."""
import string
import unicodedata

from reportlab.lib.units import inch

from . import layout as L
from .blocklist import blocklist
from .registry import fingerprint

DIRS = {"E": (0, 1), "S": (1, 0), "SE": (1, 1), "NE": (-1, 1),
        "W": (0, -1), "N": (-1, 0), "NW": (-1, -1), "SW": (1, -1)}
ALL8 = list(DIRS)


def grid_text(word):
    """'Sea Star' -> 'SEASTAR'; accents removed (È -> E)."""
    s = unicodedata.normalize("NFD", word.upper())
    return "".join(ch for ch in s if ch in string.ascii_uppercase)


class WordSearch:
    def __init__(self, size, words, dirs, rows=None):
        self.cols, self.rows = size, rows or size
        self.words = list(words)                       # display forms
        self.keys = [grid_text(w) for w in self.words]
        self.dirs = list(dirs)
        self.grid = None
        self.placed = {}                               # key -> (r, c, dir)

    # ---- building ------------------------------------------------------
    def _cells(self, key, r, c, d):
        dr, dc = DIRS[d]
        return [(r + dr * i, c + dc * i) for i in range(len(key))]

    def _try_place(self, rng, g, key, overlap_pref):
        options = []
        for d in self.dirs:
            for r in range(self.rows):
                for c in range(self.cols):
                    cells = self._cells(key, r, c, d)
                    if not all(0 <= rr < self.rows and 0 <= cc < self.cols for rr, cc in cells):
                        continue
                    ok, shared = True, 0
                    for ch, (rr, cc) in zip(key, cells):
                        cur = g[rr][cc]
                        if cur is None:
                            continue
                        if cur != ch:
                            ok = False
                            break
                        shared += 1
                    if ok and shared < len(key):
                        options.append((shared, r, c, d))
        if not options:
            return None
        if rng.random() < overlap_pref:
            best = max(o[0] for o in options)
            if best:
                options = [o for o in options if o[0] == best]
        # balance directions so every allowed direction is actually used
        used = [p[2] for p in self.placed.values()]
        least = min(self.dirs, key=lambda d: (used.count(d), rng.random()))
        pref = [o for o in options if o[3] == least]
        if pref and rng.random() < 0.6:
            options = pref
        return rng.choice(options)

    def build(self, rng, fill_letters=string.ascii_uppercase, overlap_pref=0.35,
              bad_words=None, attempts=400):
        bad = bad_words or blocklist()
        order = sorted(range(len(self.keys)), key=lambda i: -len(self.keys[i]))
        for _ in range(attempts):
            g = [[None] * self.cols for _ in range(self.rows)]
            self.placed = {}
            ok = True
            for i in order:
                key = self.keys[i]
                pick = self._try_place(rng, g, key, overlap_pref)
                if pick is None:
                    ok = False
                    break
                _, r, c, d = pick
                for ch, (rr, cc) in zip(key, self._cells(key, r, c, d)):
                    g[rr][cc] = ch
                self.placed[key] = (r, c, d)
            if not ok:
                continue
            for _fill in range(30):
                self.grid = [[ch or rng.choice(fill_letters) for ch in row] for row in g]
                if self.check(bad)["ok"]:
                    return self
        raise RuntimeError(f"could not build word search {self.cols}x{self.rows} {self.keys}")

    # ---- verification ----------------------------------------------------
    def lines(self):
        """Every maximal line of letters in all 8 directions with its cells."""
        out = []
        for d, (dr, dc) in DIRS.items():
            for r in range(self.rows):
                for c in range(self.cols):
                    pr, pc = r - dr, c - dc
                    if 0 <= pr < self.rows and 0 <= pc < self.cols:
                        continue          # not a line start
                    cells = []
                    rr, cc = r, c
                    while 0 <= rr < self.rows and 0 <= cc < self.cols:
                        cells.append((rr, cc))
                        rr += dr
                        cc += dc
                    out.append((d, "".join(self.grid[a][b] for a, b in cells), cells))
        return out

    def find(self, key, lines=None):
        """All placements of key in any of the 8 directions (palindromes counted once)."""
        hits = set()
        for d, text, cells in lines or self.lines():
            start = text.find(key)
            while start != -1:
                hits.add((frozenset(cells[start:start + len(key)]), d))
                start = text.find(key, start + 1)
        uniq = {}
        for cells, d in hits:
            uniq.setdefault(cells, d)
        return [(cells, d) for cells, d in uniq.items()]

    def check(self, bad_words):
        lines = self.lines()
        missing, multiple, wrong_dir = [], [], []
        for key in self.keys:
            hits = self.find(key, lines)
            if not hits:
                missing.append(key)
            elif len(hits) > 1:
                multiple.append(key)
            else:
                cells, d = hits[0]
                r, c, pd = self.placed[key]
                if set(self._cells(key, r, c, pd)) != cells:
                    wrong_dir.append(key)
        placed_runs = [set(self._cells(k, *self.placed[k])) for k in self.keys]
        rude = []
        for bw in bad_words:
            if len(bw) > max(self.rows, self.cols):
                continue
            for cells, d in self.find(bw, lines):
                # allowed only if it lies completely inside a listed word (e.g. "PEA" in "PEAR")
                if not any(cells <= run for run in placed_runs):
                    rude.append(bw)
        return {"ok": not (missing or multiple or wrong_dir or rude), "missing": missing,
                "multiple": multiple, "wrong_dir": wrong_dir, "rude": sorted(set(rude))}

    def fingerprint(self):
        return fingerprint("wordsearch", self.cols, self.rows, tuple("".join(r) for r in self.grid))

    def claim_in(self, reg, where):
        # word-set fingerprint as the "near-duplicate" alt: the same word list
        # in the same grid size is never reused in a different puzzle
        alt = fingerprint("ws-words", self.cols, self.rows, tuple(sorted(self.keys)))
        return reg.claim(self.fingerprint(), where, alt_fps=(alt,))


def pick_compatible(words, n):
    """First n words (in the given order) where no word hides inside another,
    forwards or backwards, and no palindromes. Returned alphabetically."""
    out = []
    for w in words:
        k = grid_text(w)
        if k == k[::-1]:
            continue
        clash = False
        for o in out:
            ko = grid_text(o)
            if k in ko or k[::-1] in ko or ko in k or ko[::-1] in k:
                clash = True
                break
        if not clash:
            out.append(w)
        if len(out) == n:
            break
    return sorted(out, key=grid_text)


def list_problems(words, bad_words):
    """Static checks on a word list: hidden substrings, palindromes, blocklisted words."""
    keys = [grid_text(w) for w in words]
    probs = []
    for a in keys:
        for b in keys:
            if a != b and (a in b or a[::-1] in b):
                probs.append(f"{a} hidden inside {b}")
        if a == a[::-1] and len(a) > 1:
            probs.append(f"{a} is a palindrome")
        if a in bad_words:
            probs.append(f"{a} is on the blocklist")
    if len(set(keys)) != len(keys):
        probs.append("duplicate word")
    return probs


# ======================================================================
# Drawing
# ======================================================================
def draw_grid(c, ws, x, y, w, h, max_cell=0.62 * inch, font=None, frame=True,
              answers=False, hl_gray=0.8, letter_frac=0.56):
    """Letters centred in (x,y,w,h). Returns geometry."""
    font = font or L.BODY_BOLD
    cell = min(w / ws.cols, h / ws.rows, max_cell)
    gw, gh = cell * ws.cols, cell * ws.rows
    ox, oy = x + (w - gw) / 2, y + h - (h - gh) / 2   # top-left

    def C(r, col):
        return ox + (col + 0.5) * cell, oy - (r + 0.5) * cell

    if frame:
        pad = cell * 0.25
        L.rounded_frame(c, ox - pad, oy - gh - pad, gw + 2 * pad, gh + 2 * pad,
                        r=min(18, cell * 0.6), lw=max(1.2, min(3, cell * 0.07)))
    if answers:
        c.saveState()
        c.setLineCap(1)
        c.setStrokeGray(hl_gray)
        c.setLineWidth(cell * 0.78)
        for key in ws.keys:
            r, col, d = ws.placed[key]
            dr, dc = DIRS[d]
            c.line(*C(r, col), *C(r + dr * (len(key) - 1), col + dc * (len(key) - 1)))
        c.setStrokeGray(0.35)
        c.setLineWidth(max(0.5, cell * 0.04))
        for key in ws.keys:          # thin outline so it reads in pure B&W too
            r, col, d = ws.placed[key]
            dr, dc = DIRS[d]
            _capsule(c, C(r, col), C(r + dr * (len(key) - 1), col + dc * (len(key) - 1)),
                     cell * 0.39)
        c.restoreState()
    size = cell * letter_frac
    c.setFont(font, size)
    c.setFillGray(0)
    for r in range(ws.rows):
        for col in range(ws.cols):
            cx, cy = C(r, col)
            c.drawCentredString(cx, cy - size * 0.35, ws.grid[r][col])
    return {"cell": cell, "ox": ox, "oy": oy, "w": gw, "h": gh}


def _capsule(c, a, b, rad):
    import math
    (x1, y1), (x2, y2) = a, b
    ang = math.degrees(math.atan2(y2 - y1, x2 - x1))
    length = math.hypot(x2 - x1, y2 - y1)
    c.saveState()
    c.translate(x1, y1)
    c.rotate(ang)
    c.roundRect(-rad, -rad, length + 2 * rad, 2 * rad, rad, stroke=1, fill=0)
    c.restoreState()


def draw_direction_hint(c, x, y, dirs, size=16, label="Words go:"):
    """Little arrows showing which directions words run."""
    c.setFont(L.BODY_BOLD, 13)
    c.drawString(x, y - 4, label)
    x += c.stringWidth(label, L.BODY_BOLD, 13) + 10
    c.saveState()
    c.setLineWidth(2)
    c.setLineCap(1)
    c.setLineJoin(1)
    for d in dirs:
        dr, dc = DIRS[d]
        vx, vy = dc, -dr
        n = (vx * vx + vy * vy) ** 0.5
        vx, vy = vx / n, vy / n
        cx, cy = x + size / 2, y
        c.roundRect(x - 3, y - size / 2 - 3, size + 6, size + 6, 4, stroke=1, fill=0)
        x1, y1 = cx - vx * size * 0.35, cy - vy * size * 0.35
        x2, y2 = cx + vx * size * 0.35, cy + vy * size * 0.35
        c.line(x1, y1, x2, y2)
        px, py = -vy, vx
        h = size * 0.22
        p = c.beginPath()
        p.moveTo(x2, y2)
        p.lineTo(x2 - vx * h + px * h * 0.8, y2 - vy * h + py * h * 0.8)
        p.moveTo(x2, y2)
        p.lineTo(x2 - vx * h - px * h * 0.8, y2 - vy * h - py * h * 0.8)
        c.drawPath(p, stroke=1, fill=0)
        x += size + 14
    c.restoreState()


def draw_word_list(c, words, x, y, w, ncols, size=16, box=True, font=None, leading=1.7,
                   formatter=None):
    """Words in columns with tick boxes. Returns bottom y."""
    font = font or L.BODY_BOLD
    per = -(-len(words) // ncols)
    colw = w / ncols
    for i, word in enumerate(words):
        col, row = i // per, i % per
        xx = x + col * colw
        yy = y - row * size * leading
        if box:
            c.setLineWidth(1.5)
            c.rect(xx, yy - size * 0.1, size * 0.8, size * 0.8, stroke=1, fill=0)
            xx += size * 1.25
        text = formatter(word) if formatter else word.upper()
        fs = L.fit_size(text, font, size, colw - size * 1.4)
        c.setFont(font, fs)
        c.drawString(xx, yy, text)
    return y - per * size * leading
