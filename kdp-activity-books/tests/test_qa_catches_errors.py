"""Prove the QA checks can fail: feed them deliberately broken puzzles."""
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from kdpbooks.mazes import make_grid_maze  # noqa: E402
from kdpbooks.registry import Registry      # noqa: E402


def test_loop_gives_two_solutions():
    m = make_grid_maze(random.Random(7), 6, 6)
    assert m.ok()
    path = set(m.solve())
    # knock down one wall between a path cell and an off-path neighbour that also
    # connects back to the path -> creates a loop around part of the route
    for a in m.cells:
        for b in m.potential[a]:
            if b not in m.open[a]:
                m.open[a].add(b); m.open[b].add(a)
                if m.count_solutions() == 2:
                    assert not m.ok()
                    return
                m.open[a].discard(b); m.open[b].discard(a)
    raise AssertionError("no loop found")


def test_registry_rejects_duplicates_and_mirrors():
    reg = Registry("selftest", 99)
    reg.taken.clear(); reg.taken_sigs.clear()
    m = make_grid_maze(random.Random(3), 7, 7)
    assert m.claim_in(reg, "a")
    assert not m.claim_in(reg, "b")                     # exact copy
    mirror = type(m)(m.cols, m.rows, m.cols - 1 - m.start[1], m.cols - 1 - m.goal[1])
    for (r, c), nb in m.open.items():
        for (r2, c2) in nb:
            mirror.open[(r, m.cols - 1 - c)].add((r2, m.cols - 1 - c2))
    assert not mirror.claim_in(reg, "c")                # mirror image


if __name__ == "__main__":
    test_loop_gives_two_solutions()
    test_registry_rejects_duplicates_and_mirrors()
    print("QA self-tests passed")
