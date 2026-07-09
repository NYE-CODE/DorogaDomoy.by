# -*- coding: utf-8 -*-
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {"node_modules", "dist", ".git", "scripts"}


def main() -> None:
    hits: list[str] = []
    for path in ROOT.rglob("*.tsx"):
        if any(s in path.parts for s in SKIP):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        rel = path.relative_to(ROOT).as_posix()
        for i, line in enumerate(text.splitlines(), 1):
            if "\ufffd" in line:
                hits.append(f"FFFD {rel}:{i}: {line.strip()[:120]}")
            if "icon: '??'" in line:
                hits.append(f"ICON {rel}:{i}: {line.strip()[:120]}")
            if re.search(r"^\s*\? \{t\.", line):
                hits.append(f"QMARK {rel}:{i}: {line.strip()[:120]}")
    out = ROOT / "_corrupt_scan.txt"
    out.write_text("\n".join(hits), encoding="utf-8")
    print(len(hits), "hits ->", out)


if __name__ == "__main__":
    main()
