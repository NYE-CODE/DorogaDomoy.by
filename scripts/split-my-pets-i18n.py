"""Split src/shared/i18n/myPets.ts into modules under my-pets/."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "shared" / "i18n" / "myPets.ts"
OUT_DIR = ROOT / "src" / "shared" / "i18n" / "my-pets"

LOCALES = ("ru", "be", "en")

NESTED_KEYS = ("ownerProfile", "form")

FILE_BY_KEY = {
    "ownerProfile": "owner-profile",
    "form": "form",
}


def export_name(suffix: str) -> str:
    if suffix == "list":
        return "myPetsListLocales"
    if suffix == "ownerProfile":
        return "myPetsOwnerProfileLocales"
    if suffix == "form":
        return "myPetsFormLocales"
    raise ValueError(suffix)


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


def extract_list_block(locale_body: str) -> str:
    marker = "    ownerProfile:"
    idx = locale_body.find(marker)
    if idx == -1:
        raise ValueError("ownerProfile marker not found for list extraction")
    body = locale_body[:idx].strip()
    if body.endswith(","):
        body = body[:-1]
    return body


def dedent_object_block(block: str) -> str:
    stripped = block.strip()
    if stripped.startswith("{") and stripped.endswith("}"):
        inner = stripped[1:-1].strip()
        if "\n" not in inner:
            return inner

    lines = stripped.splitlines()
    if lines and lines[0].strip() == "{":
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


def write_list_module(per_locale: dict[str, str]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / "list.ts"
    parts = [
        "/** My pets — list & actions (ru / be / en). */",
        f"export const {export_name('list')} = {{",
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


def write_nested_module(key: str, per_locale: dict[str, str]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    file_stem = FILE_BY_KEY[key]
    name = export_name(key)
    path = OUT_DIR / f"{file_stem}.ts"
    parts = [
        f"/** My pets — `{key}` (ru / be / en). */",
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
    content = "\n".join(
        [
            "/** My pets profile strings (ru / be / en) — композиция из модулей my-pets/*. */",
            "import { myPetsFormLocales } from './my-pets/form';",
            "import { myPetsListLocales } from './my-pets/list';",
            "import { myPetsOwnerProfileLocales } from './my-pets/owner-profile';",
            "",
            "export const myPetsLocales = {",
            "  ru: {",
            "    ...myPetsListLocales.ru,",
            "    ownerProfile: myPetsOwnerProfileLocales.ru,",
            "    form: myPetsFormLocales.ru,",
            "  },",
            "  be: {",
            "    ...myPetsListLocales.be,",
            "    ownerProfile: myPetsOwnerProfileLocales.be,",
            "    form: myPetsFormLocales.be,",
            "  },",
            "  en: {",
            "    ...myPetsListLocales.en,",
            "    ownerProfile: myPetsOwnerProfileLocales.en,",
            "    form: myPetsFormLocales.en,",
            "  },",
            "} as const;",
            "",
        ]
    )
    SOURCE.write_text(content, encoding="utf-8")


def main() -> None:
    text = SOURCE.read_text(encoding="utf-8")
    locale_blocks = find_locale_blocks(text)

    list_per_locale: dict[str, str] = {}
    for locale in LOCALES:
        list_per_locale[locale] = extract_list_block(locale_blocks[locale])
    path = write_list_module(list_per_locale)
    print(f"  list.ts ({len(path.read_text(encoding='utf-8').splitlines())} lines)")

    for key in NESTED_KEYS:
        per_locale: dict[str, str] = {}
        for locale in LOCALES:
            raw = extract_key_block(locale_blocks[locale], key)
            per_locale[locale] = dedent_object_block(raw)
        path = write_nested_module(key, per_locale)
        print(f"  {FILE_BY_KEY[key]}.ts ({len(path.read_text(encoding='utf-8').splitlines())} lines)")

    write_composer()
    print(f"composer myPets.ts ({len(SOURCE.read_text(encoding='utf-8').splitlines())} lines)")


if __name__ == "__main__":
    main()
