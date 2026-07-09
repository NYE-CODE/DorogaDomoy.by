"""Split src/shared/i18n/match.ts into per-section modules under match/."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "shared" / "i18n" / "match.ts"
OUT_DIR = ROOT / "src" / "shared" / "i18n" / "match"

LOCALES = ("ru", "be", "en")

SECTION_KEYS = [
    "cta",
    "seo",
    "quiz",
    "swipe",
    "complete",
    "noResults",
    "card",
    "profile",
    "reasons",
    "toasts",
]


def export_name(key: str) -> str:
    return f"match{key[:1].upper()}{key[1:]}Locales"


def find_locale_blocks(text: str) -> dict[str, str]:
    blocks: dict[str, str] = {}
    for locale in LOCALES:
        pattern = re.compile(rf"^  {locale}: \{{\n", re.MULTILINE)
        m = pattern.search(text)
        if not m:
            raise ValueError(f"Locale block not found: {locale}")
        brace_start = text.find("{", m.start())
        depth = 0
        i = brace_start
        while i < len(text):
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    blocks[locale] = text[brace_start + 1 : i]
                    break
            i += 1
        else:
            raise ValueError(f"Unbalanced locale block: {locale}")
    return blocks


def extract_key_block(locale_body: str, key: str) -> str:
    pattern = re.compile(rf"^    {re.escape(key)}: \{{\n?", re.MULTILINE)
    m = pattern.search(locale_body)
    if not m:
        raise ValueError(f"Key not found: {key}")

    brace_start = locale_body.find("{", m.start())
    if brace_start == -1:
        raise ValueError(f"No opening brace for key: {key}")

    depth = 0
    i = brace_start
    while i < len(locale_body):
        ch = locale_body[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return locale_body[brace_start : i + 1]
        i += 1
    raise ValueError(f"Unbalanced braces for key: {key}")


def dedent_object_block(block: str) -> str:
    stripped = block.strip()
    if stripped.startswith("{") and stripped.endswith("}"):
        inner = stripped[1:-1].strip()
        if "\n" not in inner:
            return inner

    lines = stripped.splitlines()
    if not lines:
        return block
    if lines[0].strip() == "{":
        lines = lines[1:]
    if lines and lines[-1].strip() == "}":
        lines = lines[:-1]
    out: list[str] = []
    for line in lines:
        if line.startswith("    "):
            out.append(line[2:])
        else:
            out.append(line)
    return "\n".join(out)


def write_section_module(key: str, per_locale: dict[str, str]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    name = export_name(key)
    path = OUT_DIR / f"{key}.ts"

    parts = [
        f"/** Match — `{key}` (ru / be / en). */",
        f"export const {name} = {{",
    ]
    for locale in LOCALES:
        parts.append(f"  {locale}: {{")
        for line in per_locale[locale].splitlines():
            parts.append(line)
        parts.append("  },")
    parts.append("} as const;")
    parts.append("")
    path.write_text("\n".join(parts), encoding="utf-8")
    return path


def write_composer() -> None:
    imports = []
    ru_lines = ["  ru: {"]
    be_lines = ["  be: {"]
    en_lines = ["  en: {"]

    for key in SECTION_KEYS:
        name = export_name(key)
        imports.append(f"import {{ {name} }} from './match/{key}';")
        ru_lines.append(f"    {key}: {name}.ru,")
        be_lines.append(f"    {key}: {name}.be,")
        en_lines.append(f"    {key}: {name}.en,")

    ru_lines.append("  },")
    be_lines.append("  },")
    en_lines.append("  },")

    content = "\n".join(
        [
            "/** Pet match / swipe strings (ru / be / en) — композиция из модулей match/*. */",
            *imports,
            "",
            "export const matchLocales = {",
            *ru_lines,
            *be_lines,
            *en_lines,
            "} as const;",
            "",
        ]
    )
    SOURCE.write_text(content, encoding="utf-8")


def main() -> None:
    text = SOURCE.read_text(encoding="utf-8")
    locale_blocks = find_locale_blocks(text)

    for key in SECTION_KEYS:
        per_locale: dict[str, str] = {}
        for locale in LOCALES:
            raw = extract_key_block(locale_blocks[locale], key)
            per_locale[locale] = dedent_object_block(raw)
        path = write_section_module(key, per_locale)
        lines = len(path.read_text(encoding="utf-8").splitlines())
        print(f"  {key}.ts ({lines} lines)")

    write_composer()
    composer_lines = len(SOURCE.read_text(encoding="utf-8").splitlines())
    print(f"composer match.ts ({composer_lines} lines)")


if __name__ == "__main__":
    main()
