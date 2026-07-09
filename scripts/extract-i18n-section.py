"""Extract a top-level i18n section from translations.ts into a locales module."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSLATIONS = ROOT / "src" / "shared" / "i18n" / "translations.ts"


def extract_object_block(text: str, marker: str) -> tuple[str, int, int]:
    """Return block content inside `{ ... }` after marker, and start/end line indices (1-based)."""
    # Require top-level section opener `    key: {` (not nested string keys like `      myPets:`)
    pattern = re.compile(rf"^{re.escape(marker)} \{{\n?", re.MULTILINE)
    m = pattern.search(text)
    if not m:
        raise ValueError(f"Marker not found: {marker!r}")
    idx = m.start()

    brace_start = text.find("{", idx)
    if brace_start == -1:
        raise ValueError(f"No opening brace after {marker!r}")

    depth = 0
    i = brace_start
    while i < len(text):
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                inner = text[brace_start + 1 : i]
                start_line = text[: brace_start + 1].count("\n") + 1
                end_line = text[: i + 1].count("\n") + 1
                return inner, start_line, end_line
        i += 1

    raise ValueError(f"Unbalanced braces for {marker!r}")


def dedent_block(block: str, spaces: int = 2) -> str:
    prefix = " " * spaces
    lines = []
    for line in block.splitlines():
        if line.startswith(prefix):
            lines.append(line[spaces:])
        else:
            lines.append(line)
    return "\n".join(lines).strip("\n")


def extract_section(key: str, source: Path | None = None) -> dict[str, str]:
    text = (source or TRANSLATIONS).read_text(encoding="utf-8")
    locales: dict[str, str] = {}
    for locale in ("ru", "be", "en"):
        marker = f"  {locale}:"
        locale_idx = text.find(marker)
        if locale_idx == -1:
            raise ValueError(f"Locale {locale} not found")
        sub = text[locale_idx:]
        inner, _, _ = extract_object_block(sub, f"    {key}:")
        locales[locale] = dedent_block(inner)
    return locales


def write_locale_module(key: str, locales: dict[str, str], comment: str) -> Path:
    camel = "".join(part[:1].upper() + part[1:] for part in key.split("-"))
    if key[0].islower():
        export_name = f"{key}Locales"
    else:
        export_name = f"{key}Locales"

    out = ROOT / "src" / "shared" / "i18n" / f"{key}.ts"
    parts = [
        f"/** {comment} (ru / be / en). */",
        f"export const {export_name} = {{",
    ]
    for locale in ("ru", "be", "en"):
        parts.append(f"  {locale}: {{")
        for line in locales[locale].splitlines():
            parts.append(line)
        parts.append("  },")
    parts.append("} as const;")
    parts.append("")
    out.write_text("\n".join(parts), encoding="utf-8")
    return out


def wire_translations(key: str, export_name: str | None = None) -> None:
    export_name = export_name or f"{key}Locales"
    text = TRANSLATIONS.read_text(encoding="utf-8")

    import_line = f"import {{ {export_name} }} from './{key}';"
    if import_line not in text:
        anchor = "import { adminPanelLocales } from './admin-panel';"
        text = text.replace(anchor, f"{anchor}\n{import_line}")

    for locale in ("ru", "be", "en"):
        marker = f"  {locale}:"
        locale_idx = text.find(marker)
        sub = text[locale_idx:]
        inner, start, end = extract_object_block(sub, f"    {key}:")
        # compute absolute positions in full text
        abs_start = locale_idx + sub.find(f"    {key}:")
        abs_inner_start = locale_idx + sub.find("{", sub.find(f"    {key}:"))
        abs_end = locale_idx + sub.find("}", sub.find(f"    {key}:"))
        # re-extract with full text for accurate replacement
        full_inner, full_start, full_end = extract_object_block(text[locale_idx:], f"    {key}:")
        block_start = locale_idx + text[locale_idx:].find(f"    {key}:")
        block_end = locale_idx + text[locale_idx:].find("}", text[locale_idx:].find(f"    {key}:"))
        # use line-based replacement instead
        lines = text.splitlines(keepends=True)
        # find line index of `    {key}:` within locale - scan all
        pass

    # Line-by-line replacement tracking current locale
    lines = text.splitlines(keepends=True)
    out_lines: list[str] = []
    current_locale: str | None = None
    i = 0
    while i < len(lines):
        line = lines[i]
        lm = re.match(r"^  (ru|be|en): \{", line)
        if lm:
            current_locale = lm.group(1)
        m = re.match(rf"^    {re.escape(key)}: \{{", line)
        if m:
            if current_locale is None:
                raise ValueError(f"Could not determine locale for {key} at line {i + 1}")
            locale = current_locale
            depth = 0
            started = False
            while i < len(lines):
                cur = lines[i]
                if "{" in cur:
                    depth += cur.count("{")
                    started = True
                if "}" in cur:
                    depth -= cur.count("}")
                i += 1
                if started and depth <= 0:
                    break
            out_lines.append(f"    {key}: {export_name}.{locale},\n")
            continue
        out_lines.append(line)
        i += 1

    TRANSLATIONS.write_text("".join(out_lines), encoding="utf-8")


def main() -> None:
    key = sys.argv[1]
    comments = {
        "landing": "Landing page strings",
        "match": "Pet match / swipe strings",
        "myPets": "My pets profile strings",
        "petForm": "Pet ad form strings",
        "petDetail": "Pet detail page strings",
    }
    comment = comments.get(key, f"{key} strings")
    locales = extract_section(key)
    path = write_locale_module(key, locales, comment)
    wire_translations(key)
    new_lines = len(TRANSLATIONS.read_text(encoding="utf-8").splitlines())
    print(f"extracted {key} -> {path.name}, translations.ts now {new_lines} lines")


if __name__ == "__main__":
    main()
