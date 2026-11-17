"""Automatic print-readiness checks run on every finished PDF."""
import os
import re
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image

from .layout import PAGE_W, PAGE_H, SAFE

DPI = 100


class Report:
    def __init__(self, title):
        self.title, self.rows = title, []

    def check(self, name, passed, detail=""):
        self.rows.append((name, bool(passed), detail))
        return passed

    @property
    def all_passed(self):
        return all(p for _, p, _ in self.rows)

    def text(self):
        out = [f"QA REPORT - {self.title}", "=" * 60]
        for name, p, d in self.rows:
            out.append(f"[{'PASS' if p else 'FAIL'}] {name}" + (f"  ({d})" if d else ""))
        out.append("=" * 60)
        out.append("ALL CHECKS PASSED" if self.all_passed else "SOME CHECKS FAILED")
        return "\n".join(out)


def pdf_info(path):
    txt = subprocess.run(["pdfinfo", path], capture_output=True, text=True, check=True).stdout
    pages = int(re.search(r"Pages:\s+(\d+)", txt).group(1))
    w, h = map(float, re.search(r"Page size:\s+([\d.]+) x ([\d.]+)", txt).groups())
    return pages, w, h


def fonts_embedded(path):
    txt = subprocess.run(["pdffonts", path], capture_output=True, text=True, check=True).stdout
    rows = txt.strip().splitlines()[2:]
    names, bad = [], []
    for r in rows:
        parts = r.split()
        names.append(parts[0])
        # columns: name type [encoding] emb sub uni object ID
        emb = parts[-5]
        if emb != "yes":
            bad.append(parts[0])
    return names, bad


def render_pages(path, dpi=DPI):
    tmp = tempfile.mkdtemp()
    subprocess.run(["pdftoppm", "-r", str(dpi), "-gray", path, os.path.join(tmp, "p")], check=True)
    files = sorted(os.listdir(tmp), key=lambda f: int(re.search(r"(\d+)", f).group(1)))
    try:
        for f in files:
            yield np.array(Image.open(os.path.join(tmp, f)))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def margin_violations(img, dpi=DPI, safe_in=SAFE / 72.0, thresh=200):
    m = int(round(safe_in * dpi)) - 1   # 1px tolerance for anti-aliasing
    dark = img < thresh
    band = dark.copy()
    band[m:-m, m:-m] = False
    return int(band.sum())


def audit_maze_pixels(img, maze, geo, dpi=DPI):
    """Re-read the printed maze from pixels and compare with the verified data.
    maze.probes(geo) gives the midpoint of every potential wall and whether a
    wall must be there; a 3x3 pixel patch darker than 50% grey = wall printed.
    Returns the number of mismatches (0 = the page shows exactly the maze we verified)."""
    s = dpi / 72.0
    H = img.shape[0]
    bad = 0
    for xp, yp, expect_wall in maze.probes(geo):
        x, y = int(round(xp * s)), int(round(H - yp * s))
        printed_wall = img[y - 1:y + 2, x - 1:x + 2].min() < 128
        bad += printed_wall != expect_wall
    return bad


def standard_checks(rep, path, page_roles, min_pages=60, max_pages=100,
                    page_hook=None, coloring=False):
    """Checks every book shares.  page_hook(page_no, img) -> extra checks."""
    pages, w, h = pdf_info(path)
    rep.check("Trim size 8.5 x 11 in", abs(w - PAGE_W) < 0.5 and abs(h - PAGE_H) < 0.5,
              f"{w/72:.2f} x {h/72:.2f} in")
    rep.check(f"Page count even and within {min_pages}-{max_pages}",
              pages % 2 == 0 and min_pages <= pages <= max_pages, f"{pages} pages")
    names, bad = fonts_embedded(path)
    rep.check("All fonts embedded", not bad and names,
              ", ".join(sorted(set(n.split('+')[-1] for n in names))))
    if coloring:
        ok = all(page_roles[i + 1] == "blank" for i, r in enumerate(page_roles) if r == "coloring")
        rep.check("Every coloring page backed by a blank page", ok)
    violations = []
    for i, img in enumerate(render_pages(path)):
        n = margin_violations(img)
        if n:
            violations.append(f"p{i+1}:{n}px")
        if page_hook:
            page_hook(i + 1, img)
    rep.check("Nothing inside the 0.5 in safe margin (rendered-pixel scan)", not violations,
              "; ".join(violations[:8]) or f"{pages} pages scanned at {DPI} dpi")
    return pages


def pdf_words(path, page):
    """Words on a page with their centres in PDF points (y up)."""
    import html
    out = subprocess.run(["pdftotext", "-bbox", "-f", str(page), "-l", str(page), path, "-"],
                         capture_output=True, text=True, check=True).stdout
    words = []
    for m in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', out):
        x0, y0, x1, y1 = map(float, m.groups()[:4])
        words.append(((x0 + x1) / 2, PAGE_H - (y0 + y1) / 2, html.unescape(m.group(5))))
    return words


def audit_sudoku_print(path, page, placements, solution_shown=False):
    """placements: [(sudoku, x, y, size)]. Every given (and, on answer pages, every
    solution digit) must be printed in its own cell, and nothing else inside the grid."""
    words = pdf_words(path, page)
    bad = 0
    for s, x, y, size in placements:
        n = s.n
        cell = size / n
        found = {}
        for wx, wy, t in words:
            if x < wx < x + size and y < wy < y + size:
                col, row = int((wx - x) // cell), int((y + size - wy) // cell)
                found[row * n + col] = t
        for i in range(n * n):
            want = s.givens[i] or (s.solution[i] if solution_shown else 0)
            got = found.get(i)
            if (str(want) if want else None) != got:
                bad += 1
    return bad
