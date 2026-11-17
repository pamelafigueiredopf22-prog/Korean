# KDP Activity Books

A standalone project, separate from the language-learning app in the rest of this repo.
It generates print-ready KDP interiors with code only: no AI images, no clip art, and
only OFL-licensed fonts (Sniglet, Lato) (see `fonts/OFL-*.txt`).

## Build
```bash
pip install -r requirements.txt          # needs poppler-utils for QA
python build.py book01                    # Vol. 1 -> output/book01-easy-mazes-vol1.pdf
python build.py book02                    # Mazes ages 6-8 (square, circle, shape)
python build.py book03                    # Word Search for Kids 6-9
python build.py book04                    # Word Search for Teens
python build.py book05                    # Sudoku for Kids (4x4, 6x6)
python build.py book06                    # Sudoku for Teens (9x9, ~6 min: hard puzzles are graded)
python build.py book07                    # Mandala Coloring for Teens
python build.py book08                    # Geometric Pattern Coloring
python build.py book09                    # Bold & Easy Shapes Coloring (ages 3-6)
python build.py book10                    # Italian-English Word Search for Kids
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
| `kdpbooks/mazes.py`  | spanning-tree maze generator (square, circle, shape-clipped), solver, verifier, renderer |
| `kdpbooks/mazebook.py` | reusable maze-book pages (puzzle page, answers, certificate) + maze QA |
| `kdpbooks/registry.py` | fingerprints of every puzzle ever built; blocks duplicates, mirror images and near-copies across all books and volumes |
| `kdpbooks/wordsearch.py` | word-search placement, exactly-once check, rude-word screen (EN/IT `blocklist.py`) |
| `kdpbooks/sudoku.py` | sudoku generator, exhaustive uniqueness solver, human-technique grader |
| `kdpbooks/mandala.py` / `patterns.py` | procedural mandalas and geometric/op-art patterns |
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

## QA performed for the other books
- **Word searches:** every word appears exactly once (all 8 directions searched), only in the directions printed on the page; no rude words in any direction (English, plus Italian for Book 10); no word hidden inside another; printed letters re-read from the PDF text.
- **Sudoku:** exhaustive search confirms exactly one solution; a step-by-step solver using only human techniques must solve it with no guessing, and the hardest technique it needs sets the level; digit-swapped and transposed copies count as duplicates; printed digits re-read cell by cell.
- **Coloring books:** every coloring page is followed by a blank page; every enclosed area is measured from the rendered page and almost none may be too small to colour (1.2 mm for teen books, 3 mm for ages 3-6).

## Making another volume
`python build.py bookNN --volume 2` uses a new random seed and the registry rejects anything already
used in any book or volume. Fixed-design books (8 geometric, 9 bold shapes, 10 Italian) also need
new design lists or vocabulary for a Vol. 2; the build stops with a clear message if a design repeats.
