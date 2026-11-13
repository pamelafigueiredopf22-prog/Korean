"""Fingerprint registry so no puzzle/pattern is ever repeated within or across books.

registry/<book_id>-vol<N>.json holds the records of one built volume.
When a volume is (re)built, every *other* file is loaded as "taken".

Two levels of protection:
  * exact duplicates (including mirror images, via alt fingerprints)
  * near-duplicates: puzzles of the same kind/size whose structure signature
    differs in fewer than `min_diff` of positions are rejected too.
"""
import glob
import hashlib
import json
import os

from .layout import ROOT

REG_DIR = os.path.join(ROOT, "registry")


def fingerprint(*parts):
    h = hashlib.sha1()
    for p in parts:
        h.update(repr(p).encode())
        h.update(b"|")
    return h.hexdigest()


def _diff(a, b):
    return sum(x != y for x, y in zip(a, b)) / max(1, len(a))


class Registry:
    def __init__(self, book_id, volume):
        os.makedirs(REG_DIR, exist_ok=True)
        self.key = f"{book_id}-vol{volume}"
        self.path = os.path.join(REG_DIR, self.key + ".json")
        self.taken, self.taken_sigs = {}, {}
        for f in glob.glob(os.path.join(REG_DIR, "*.json")):
            if os.path.abspath(f) == os.path.abspath(self.path):
                continue
            with open(f) as fh:
                data = json.load(fh)
            for fp, rec in data.items():
                self.taken[fp] = rec["where"]
                if rec.get("sig"):
                    self.taken_sigs.setdefault(rec["sig_key"], []).append(rec["sig"])
        self.mine, self.my_sigs, self.alts = {}, {}, set()
        self.rejected_exact = 0
        self.rejected_near = 0

    def claim(self, fp, where, alt_fps=(), sig=None, sig_key=None, min_diff=0.0):
        """Record a new puzzle; return False if it (or a near copy) already exists."""
        everything = set(self.taken) | set(self.mine) | self.alts
        if fp in everything or any(a in everything for a in alt_fps):
            self.rejected_exact += 1
            return False
        if sig is not None and min_diff > 0:
            pool = self.taken_sigs.get(sig_key, []) + self.my_sigs.get(sig_key, [])
            if any(_diff(sig, s) < min_diff for s in pool if len(s) == len(sig)):
                self.rejected_near += 1
                return False
        self.mine[fp] = {"where": where}
        if sig is not None:
            self.mine[fp].update(sig=sig, sig_key=sig_key)
            self.my_sigs.setdefault(sig_key, []).append(sig)
        self.alts.update(alt_fps)
        return True

    def save(self):
        with open(self.path, "w") as fh:
            json.dump(self.mine, fh, indent=0, sort_keys=True)

    def verify_unique(self):
        """Final QA: no fingerprint shared with any other registered volume."""
        clashes = [fp for fp in self.mine if fp in self.taken]
        return len(self.mine), clashes
