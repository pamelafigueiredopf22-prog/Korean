#!/usr/bin/env python3
"""Cross-book check + summary: no fingerprint shared by two registry files, and every
book's latest QA report passed. Writes output/QA-SUMMARY.md."""
import glob
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
seen, clashes = {}, []
for f in sorted(glob.glob(os.path.join(ROOT, "registry", "*.json"))):
    for fp in json.load(open(f)):
        if fp in seen:
            clashes.append((fp, seen[fp], os.path.basename(f)))
        seen[fp] = os.path.basename(f)
lines = ["# QA summary – all books", "",
         f"Cross-book duplicate check: {len(seen)} puzzles/designs registered, "
         f"{'NO duplicates' if not clashes else f'{len(clashes)} DUPLICATES'} across books.", ""]
ok_all = not clashes
for q in sorted(glob.glob(os.path.join(ROOT, "output", "*-QA.txt"))):
    txt = open(q).read()
    ok = "ALL CHECKS PASSED" in txt
    ok_all &= ok
    lines += [f"## {os.path.basename(q)[:-7]} – {'PASS' if ok else 'FAIL'}", "", "```", txt.strip(), "```", ""]
open(os.path.join(ROOT, "output", "QA-SUMMARY.md"), "w").write("\n".join(lines))
print("\n".join(lines[:3]))
print("EVERY BOOK PASSED" if ok_all else "SOMETHING FAILED")
