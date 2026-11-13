#!/usr/bin/env python3
"""Build a book interior:  python build.py book01 [--volume 2] [--previews 5,6,40]"""
import argparse
import importlib
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

BOOKS = {
    "book01": "books.book01_easy_mazes",
}


def previews(pdf, pages, out_dir, dpi=150):
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(pdf))[0]
    files = []
    for p in pages:
        stem = os.path.join(out_dir, f"{base}-p{p:03d}")
        subprocess.run(["pdftoppm", "-r", str(dpi), "-png", "-singlefile",
                        "-f", str(p), "-l", str(p), pdf, stem], check=True)
        files.append(stem + ".png")
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("book", choices=sorted(BOOKS))
    ap.add_argument("--volume", type=int, default=1)
    ap.add_argument("--previews", default="", help="comma-separated page numbers")
    a = ap.parse_args()
    mod = importlib.import_module(BOOKS[a.book])
    out = os.path.join(ROOT, "output")
    os.makedirs(out, exist_ok=True)
    pdf, rep, info = mod.build(a.volume, out)
    txt = rep.text()
    print(txt)
    with open(pdf.replace(".pdf", "-QA.txt"), "w") as fh:
        fh.write(txt + "\n")
    if a.previews:
        pages = [int(x) for x in a.previews.split(",")]
        for f in previews(pdf, pages, os.path.join(out, "previews")):
            print("preview:", f)
    sys.exit(0 if rep.all_passed else 1)


if __name__ == "__main__":
    main()
