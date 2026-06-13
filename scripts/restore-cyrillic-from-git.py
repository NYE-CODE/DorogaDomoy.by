# -*- coding: utf-8 -*-
"""Restore corrupted Cyrillic from clean git versions."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FILE_PAIRS = [
    ("pages/PetDetailPage.tsx", "src/pages/PetDetailPage.tsx"),
    ("pages/SearchPage.tsx", "src/pages/SearchPage.tsx"),
    ("pages/ShelterPetDetailPage.tsx", "src/pages/ShelterPetDetailPage.tsx"),
    ("components/profile-page.tsx", "components/profile-page.tsx"),
]

CYRILLIC = re.compile(r"[\u0400-\u04FF\u2014\u00ab\u00bb·]")


def normalize(line: str) -> str:
    line = CYRILLIC.sub("?", line)
    line = re.sub(r"\?+", "?", line)
    return line


def is_corrupted(line: str) -> bool:
    if "?" not in line:
        return False
    if CYRILLIC.search(line):
        return False
    return any(q in line for q in ("'", '"', "`", "{/*", "//", "/*"))


def git_show(path: str) -> str:
    return subprocess.check_output(
        ["git", "show", f"HEAD:{path}"],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
    )


def fix_file(git_path: str, tgt_path: str) -> int:
    git_lines = git_show(git_path).splitlines()
    tgt_file = ROOT / tgt_path
    if not tgt_file.exists():
        print(f"skip missing {tgt_path}")
        return 0

    tgt_text = tgt_file.read_text(encoding="utf-8", errors="replace")
    tgt_lines = tgt_text.splitlines()
    changed = 0

    for gl in git_lines:
        if not CYRILLIC.search(gl):
            continue
        g_norm = normalize(gl)
        for i, tl in enumerate(tgt_lines):
            if not is_corrupted(tl):
                continue
            if normalize(tl) != g_norm:
                continue
            if tl != gl:
                tgt_lines[i] = gl
                changed += 1
            break

    if changed:
        newline = "\n" if tgt_text.endswith("\n") else ""
        tgt_file.write_text("\n".join(tgt_lines) + newline, encoding="utf-8")
    print(f"{tgt_path}: {changed} lines fixed")
    return changed


def main() -> None:
    total = 0
    for git_path, tgt_path in FILE_PAIRS:
        total += fix_file(git_path, tgt_path)
    print(f"total: {total}")


if __name__ == "__main__":
    main()
