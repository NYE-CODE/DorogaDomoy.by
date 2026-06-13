# -*- coding: utf-8 -*-
"""Fix encoding issues across the project."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Files saved as Windows-1251 but should be UTF-8.
CP1251_FILES = [
    "src/pages/BlogListPage.tsx",
    "src/pages/FavoritesPage.tsx",
    "src/pages/GuidesPage.tsx",
    "src/pages/MyPetProfilePage.tsx",
    "src/pages/MyShelterPetCampaignPage.tsx",
    "src/pages/MyShelterPetsListPage.tsx",
    "src/pages/MyShelterPetsPage.tsx",
    "src/pages/MySheltersPage.tsx",
    "src/pages/MyShelterTeamPage.tsx",
    "src/pages/PublicPetProfilePage.tsx",
    "src/pages/ShelterDetailPage.tsx",
    "src/pages/UserProfilePage.tsx",
]

# Exact text replacements (old must match exactly in file).
TEXT_REPLACEMENTS: list[tuple[str, str, str]] = [
    (
        "components/admin-panel.tsx",
        "/** \ufffd\ufffd\ufffd\ufffd false \ufffd slug \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd \ufffd\ufffd \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd (\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd \ufffd\ufffd\ufffd\ufffd\ufffd \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd). */",
        "/** Если false — slug автогенерируется из заголовка (только новая статья). */",
    ),
    (
        "components/admin-panel.tsx",
        "{row.address ? ` \ufffd ${row.address}` : ''}",
        "{row.address ? ` · ${row.address}` : ''}",
    ),
    (
        "components/admin-panel.tsx",
        '<span className="text-muted-foreground/80">\ufffd</span>',
        '<span className="text-muted-foreground/80">—</span>',
    ),
    (
        "components/admin-panel.tsx",
        "{/* \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd + \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd */}",
        "{/* Вкладки + навигация */}",
    ),
    (
        "components/my-ads-page.tsx",
        "/** \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd \ufffd\ufffd\ufffd\ufffd\ufffd ff_instagram_boost_stories \ufffd \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd */",
        "/** Зависит от ff_instagram_boost_stories в профиле */",
    ),
    (
        "components/my-ads-page.tsx",
        '<span className="hidden text-muted-foreground sm:inline">\ufffd</span>',
        '<span className="hidden text-muted-foreground sm:inline">·</span>',
    ),
    (
        "components/my-ads-page.tsx",
        '<span className="shrink-0" aria-hidden>\ufffd</span>',
        '<span className="shrink-0" aria-hidden>·</span>',
    ),
]


def convert_cp1251_files() -> int:
    changed = 0
    for rel in CP1251_FILES:
        path = ROOT / rel
        if not path.exists():
            print(f"skip missing {rel}")
            continue
        raw = path.read_bytes()
        try:
            raw.decode("utf-8")
            print(f"already utf-8 {rel}")
            continue
        except UnicodeDecodeError:
            text = raw.decode("cp1251")
            path.write_text(text, encoding="utf-8", newline="\n")
            changed += 1
            print(f"converted cp1251->utf-8 {rel}")
    return changed


def apply_text_replacements() -> int:
    total = 0
    for rel, old, new in TEXT_REPLACEMENTS:
        path = ROOT / rel
        text = path.read_text(encoding="utf-8", errors="replace")
        count = text.count(old)
        if count:
            path.write_text(text.replace(old, new), encoding="utf-8", newline="\n")
            total += count
            print(f"replaced x{count} in {rel}")
        else:
            print(f"no match in {rel}: {old[:40]!r}...")
    return total


def main() -> None:
    n1 = convert_cp1251_files()
    n2 = apply_text_replacements()
    print(f"done: cp1251={n1}, replacements={n2}")


if __name__ == "__main__":
    main()
