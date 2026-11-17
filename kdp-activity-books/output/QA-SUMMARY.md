# QA summary – all books

Cross-book duplicate check: 602 puzzles/designs registered, NO duplicates across books.

## book01-easy-mazes-vol1 – PASS

```
QA REPORT - Easy Mazes for Kids Ages 4-6 (book01-easy-mazes-vol1.pdf)
============================================================
[PASS] 60 mazes generated
[PASS] Every maze: all cells reachable
[PASS] Every maze: passages form a tree (no loops)
[PASS] Every maze: exactly one solution (path search)
[PASS] Every maze: exactly 2 border openings (start, finish)
[PASS] No duplicate mazes within this book or across other books  (60 mazes; 182 from other books checked; mirror images and near-copies (<40% walls different) rejected: 834)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (82 pages)
[PASS] All fonts embedded  (Lato-Bold, Lato-Regular, Sniglet-ExtraBold)
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (82 pages scanned at 100 dpi)
[PASS] Printed mazes match verified data (pixel re-read of every wall)  (60 maze pages re-read)
============================================================
ALL CHECKS PASSED
```

## book02-mazes-6-8-vol1 – PASS

```
QA REPORT - Mazes for Kids Ages 6-8 (book02-mazes-6-8-vol1.pdf)
============================================================
[PASS] Mix of maze types  (36 grid, 18 circle, 18 shape)
[PASS] 72 mazes generated
[PASS] Every maze: all cells reachable
[PASS] Every maze: passages form a tree (no loops)
[PASS] Every maze: exactly one solution (independent path search)
[PASS] Every maze: openings only at START (and FINISH for non-circular)
[PASS] No duplicate mazes within this book or across other books  (72 mazes; 170 from other books checked; exact/mirror/near-copies (<40% walls different) rejected and regenerated: 9)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (96 pages)
[PASS] All fonts embedded  (Lato-Bold, Lato-Regular, Sniglet-ExtraBold)
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (96 pages scanned at 100 dpi)
[PASS] Printed mazes match verified data (pixel re-read of every wall)  (72 maze pages re-read)
[PASS] Difficulty rises through the book (cells per maze, first->last quarter)  (avg 121 -> 178 -> 240 -> 322 cells)
============================================================
ALL CHECKS PASSED
```

## book03-wordsearch-kids-vol1 – PASS

```
QA REPORT - Word Search for Kids Ages 6-9 (book03-wordsearch-kids-vol1.pdf)
============================================================
[PASS] Word lists: no word hidden inside another, no palindromes, none blocklisted
[PASS] 50 puzzles generated
[PASS] Every listed word is in its grid
[PASS] Every word appears exactly once (all 8 directions searched)
[PASS] Words only run in the directions shown on the page
[PASS] No rude/unsuitable words anywhere in any grid (8 directions)  (82 blocked words screened)
[PASS] No duplicate puzzles within this book or across other books  (50 grids; 192 puzzles from other books checked)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (70 pages)
[PASS] All fonts embedded  (Lato-Bold, Lato-Regular, Sniglet-ExtraBold)
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (70 pages scanned at 100 dpi)
[PASS] Printed grids match generated grids (text extracted from PDF)  (50 puzzle pages checked)
============================================================
ALL CHECKS PASSED
```

## book04-wordsearch-teens-vol1 – PASS

```
QA REPORT - Word Search for Teens (book04-wordsearch-teens-vol1.pdf)
============================================================
[PASS] Word lists: no word hidden inside another, no palindromes, none blocklisted
[PASS] 60 puzzles generated  (1136 hidden words in total)
[PASS] Every listed word is in its grid
[PASS] Every word appears exactly once (all 8 directions searched)
[PASS] Words only run in the directions shown on the page
[PASS] Expert puzzles use all 8 directions, including backwards
[PASS] No rude/unsuitable words anywhere in any grid (8 directions)  (82 blocked words screened)
[PASS] No duplicate puzzles within this book or across other books  (60 grids; 182 puzzles from other books checked)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (80 pages)
[PASS] All fonts embedded  (Lato-Black, Lato-Bold, Lato-Regular)
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (80 pages scanned at 100 dpi)
[PASS] Printed grids match generated grids (text extracted from PDF)  (60 puzzle pages checked)
============================================================
ALL CHECKS PASSED
```

## book05-sudoku-kids-vol1 – PASS

```
QA REPORT - Sudoku for Kids (book05-sudoku-kids-vol1.pdf)
============================================================
[PASS] 100 puzzles generated  (36 of 4x4, 64 of 6x6)
[PASS] Every solution grid is a valid Sudoku
[PASS] Every puzzle has exactly one solution (exhaustive search)
[PASS] Every puzzle solvable by logic alone, no guessing (step-by-step solver)
[PASS] Gets harder: clues never increase within each section  (4x4: 11 -> 4 clues; 6x6: 22 -> 10 clues)
[PASS] No duplicate puzzles within this book or across other books (incl. digit-swapped and mirrored copies)  (100 puzzles; 242 from other books checked)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (68 pages)
[PASS] All fonts embedded  (Lato-Bold, Lato-Regular, Sniglet-ExtraBold)
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (68 pages scanned at 100 dpi)
[PASS] Printed digits match the verified puzzles and answers (PDF text re-read cell by cell)  (59 pages checked)
============================================================
ALL CHECKS PASSED
```

## book06-sudoku-teens-vol1 – PASS

```
QA REPORT - Sudoku for Teens (book06-sudoku-teens-vol1.pdf)
============================================================
[PASS] 100 puzzles generated  (25 easy, 30 medium, 25 hard, 20 expert)
[PASS] Every solution grid is a valid Sudoku
[PASS] Every puzzle has exactly one solution (exhaustive search)
[PASS] Every puzzle solvable by logic alone, no guessing
[PASS] Each level needs the techniques it is labelled with (graded by the logic solver)  (easy: 33-38 clues, hardest step 'hidden single'; medium: 29-33 clues, hardest step 'pointing / box-line'; hard: 26-29 clues, hardest step 'hidden pair'; expert: 24-27 clues, hardest step 'x-wing')
[PASS] Givens are rotationally symmetric (classic look)
[PASS] No duplicate puzzles within this book or across other books (incl. digit-swapped and transposed copies)  (100 puzzles; 502 from other books checked)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (74 pages)
[PASS] All fonts embedded  (Lato-Black, Lato-Bold, Lato-Regular)
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (74 pages scanned at 100 dpi)
[PASS] Printed digits match the verified puzzles and answers (PDF text re-read cell by cell)  (67 pages checked)
============================================================
ALL CHECKS PASSED
```

## book07-mandalas-teens-vol1 – PASS

```
QA REPORT - Mandala Coloring Book for Teens (book07-mandalas-teens-vol1.pdf)
============================================================
[PASS] 40 mandalas
[PASS] Varied symmetry  (12 different symmetries: 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24-fold)
[PASS] Every mandala different (exact recipe and motif-sequence skeleton both unique)
[PASS] No duplicate designs across other books  (442 designs from other books checked)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (86 pages)
[PASS] All fonts embedded  (Lato-Black, Lato-Bold, Lato-Regular)
[PASS] Every coloring page backed by a blank page
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (86 pages scanned at 100 dpi)
[PASS] Colorable areas: almost none too tiny to colour (< 1.2 mm)  (276-872 areas per page; 200 tiny of 21429 total)
============================================================
ALL CHECKS PASSED
```

## book08-geometric-vol1 – PASS

```
QA REPORT - Geometric Pattern Coloring Book (book08-geometric-vol1.pdf)
============================================================
[PASS] 40 designs  (15 tessellation, 17 tiles, 8 optical; 18 pattern families)
[PASS] Every design different (kind + parameters + seed fingerprint)
[PASS] No duplicate designs across other books/volumes  (482 designs from other books checked)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (86 pages)
[PASS] All fonts embedded  (Lato-Black, Lato-Bold, Lato-Regular)
[PASS] Every coloring page backed by a blank page
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (86 pages scanned at 100 dpi)
[PASS] Colorable areas: almost none too tiny to colour (< 1.2 mm)  (21-896 areas per page; 110 tiny of 11491 total; worst page 23: 25/606)
============================================================
ALL CHECKS PASSED
```

## book09-bold-shapes-vol1 – PASS

```
QA REPORT - Bold & Easy Shapes Coloring Book (book09-bold-shapes-vol1.pdf)
============================================================
[PASS] 40 coloring pages  (12 shapes, 22 pictures, 6 patterns)
[PASS] Every page different
[PASS] No duplicate pages across other books/volumes  (522 items from other books checked)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (84 pages)
[PASS] All fonts embedded  (Lato-Bold, Lato-Regular, Sniglet-ExtraBold, Sniglet-Regular)
[PASS] Every coloring page backed by a blank page
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (84 pages scanned at 100 dpi)
[PASS] Big spaces only: almost no area smaller than 3 x 3 mm  (4-34 areas per page; 5 small of 601; worst page 37 (2))
[PASS] Thick lines for little hands  (main outlines 7 pt, patterns 5-6 pt)
============================================================
ALL CHECKS PASSED
```

## book10-italian-wordsearch-vol1 – PASS

```
QA REPORT - Italian-English Word Search for Kids (book10-italian-wordsearch-vol1.pdf)
============================================================
[PASS] Word lists: no word hidden inside another, no palindromes, none blocklisted
[PASS] 40 puzzles generated  (402 Italian words; glossary 401 entries)
[PASS] Every listed word is in its grid
[PASS] Every word appears exactly once (all 8 directions searched)
[PASS] Words only run in the directions shown on the page
[PASS] No rude/unsuitable words in English OR Italian anywhere in any grid  (118 blocked words screened (EN + IT))
[PASS] Grid filler uses only the 21-letter Italian alphabet (no J K W X Y)
[PASS] No duplicate puzzles within this book or across other books  (40 grids; 562 puzzles from other books checked)
[PASS] Trim size 8.5 x 11 in  (8.50 x 11.00 in)
[PASS] Page count even and within 60-100  (60 pages)
[PASS] All fonts embedded  (Lato-Bold, Lato-Regular, Sniglet-ExtraBold)
[PASS] Nothing inside the 0.5 in safe margin (rendered-pixel scan)  (60 pages scanned at 100 dpi)
[PASS] Printed grids match generated grids (text extracted from PDF)  (40 puzzle pages checked)
============================================================
ALL CHECKS PASSED
```
