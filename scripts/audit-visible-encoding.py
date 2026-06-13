# -*- coding: utf-8 -*-
"""Find user-visible corrupted strings (not in comments)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {".git", "node_modules", "dist", ".venv", "__pycache__", ".idea", "scripts"}


def strip_comments(line: str) -> str:
    s = line.strip()
    if s.startswith("//") or s.startswith("*") or s.startswith("/*") or s.startswith("{/*"):
        return ""
    return line


def main() -> None:
    hits: list[str] = []
    for dirpath, dirnames, filenames in ROOT.walk():
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for fn in filenames:
            if not fn.endswith((".tsx", ".ts")):
                continue
            path = dirpath / fn
            rel = path.relative_to(ROOT).as_posix()
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                hits.append(f"DECODE_ERR {rel}")
                continue
            for i, line in enumerate(text.splitlines(), 1):
                if "\ufffd" not in line and "???" not in line:
                    continue
                if not strip_comments(line):
                    continue
                hits.append(f"{rel}:{i}: {line.strip()[:160]}")

    out = ROOT / "_audit_visible_encoding.txt"
    out.write_text("\n".join(hits), encoding="utf-8")
    print(f"{len(hits)} visible hits -> {out}")


if __name__ == "__main__":
    main()
