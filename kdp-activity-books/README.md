# KDP Activity Books

A standalone project, separate from the language-learning app in the rest of this repo.
It generates print-ready KDP interiors with code only: no AI images, no clip art, and
only OFL-licensed fonts (see `fonts/OFL-*.txt`).

## Build
```bash
pip install -r requirements.txt          # needs poppler-utils for QA
python build.py book01                    # Vol. 1 -> output/book01-easy-mazes-vol1.pdf
python build.py book01 --volume 2         # a new volume with all-new puzzles
python build.py book01 --previews 5,34,64 # also export 150-dpi PNG previews
python tests/test_qa_catches_errors.py    # proves the QA checks can fail
```
Every build writes `output/<book>-vol<N>-QA.txt` and exits non-zero if any check fails.

## Layout
| Path | Purpose |
|---|---|
| `kdpbooks/layout.py` | 8.5x11 page geometry (0.75 in design margin, 0.5 in hard limit), fonts, shared front matter |
| `kdpbooks/icons.py`  | outline icons drawn in code (bee, rocket, frog, ...) |
| `kdpbooks/mazes.py`  | spanning-tree maze generator, solver, verifier, renderer |
| `kdpbooks/registry.py` | fingerprints of every puzzle ever built; blocks duplicates, mirror images and near-copies across all books and volumes |
| `kdpbooks/qa.py` | trim size, page count, fonts embedded, safe-margin pixel scan, printed-maze pixel audit |
| `books/bookNN_*.py` | one file per book: content plan + QA |
| `listings/` | suggested title, subtitle, 7 keyword phrases per book |
| `registry/` | **commit this**. It is how later volumes stay unique |

## QA performed for every maze book
- each maze is a spanning tree: every cell reachable, no loops, and an independent path search finds exactly one solution
- exactly two openings in the border
- each printed page is rasterised and every wall is re-read from the pixels, then compared with the verified data
- nothing printed inside the 0.5 in safe margin
- no duplicate or near-duplicate mazes (including mirror images) in this or any other book
