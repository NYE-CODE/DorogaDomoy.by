# -*- coding: utf-8 -*-
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {".git", "node_modules", "dist", ".venv", "__pycache__", ".idea", "scripts"}
EXTS = {".tsx", ".ts", ".jsx", ".js"}


def scan() -> None:
    decode_err: list[str] = []
    fffd: list[tuple[str, int]] = []
    qmarks: list[tuple[str, int]] = []

    for dirpath, dirnames, filenames in ROOT.walk():
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for fn in filenames:
            if Path(fn).suffix.lower() not in EXTS:
                continue
            path = dirpath / fn
            rel = path.relative_to(ROOT).as_posix()
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                decode_err.append(rel)
                continue
            nf = text.count("\ufffd")
            nq = len(re.findall(r"\?\?\?+", text))
            if nf:
                fffd.append((rel, nf))
            if nq:
                qmarks.append((rel, nq))

    print(f"DECODE_ERR {len(decode_err)}")
    for r in decode_err:
        print(f"  {r}")
    print(f"FFFD {len(fffd)}")
    for r, n in sorted(fffd, key=lambda x: -x[1]):
        print(f"  {n:4d} {r}")
    print(f"??? {len(qmarks)}")
    for r, n in sorted(qmarks, key=lambda x: -x[1]):
        print(f"  {n:4d} {r}")


if __name__ == "__main__":
    scan()
