"""Каталог пород и нормализация для AI-подсказок и поиска похожих."""
from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher
from typing import Optional

DOG_BREEDS = [
    "Акита-ину",
    "Американский стаффордширский терьер",
    "Бигль",
    "Бордер-колли",
    "Вельш-корги",
    "Восточно-европейская овчарка",
    "Далматин",
    "Доберман",
    "Йоркширский терьер",
    "Кавказская овчарка",
    "Лабрадор-ретривер",
    "Мопс",
    "Немецкая овчарка",
    "Немецкий шпиц",
    "Пудель",
    "Ротвейлер",
    "Сибирский хаски",
    "Сибирская лайка",
    "Русско-европейская лайка",
    "Такса",
    "Чихуахуа",
    "Шарпей",
]

CAT_BREEDS = [
    "Абиссинская",
    "Бенгальская",
    "Британская короткошёрстная",
    "Мейн-кун",
    "Невская маскарадная",
    "Ориентальная",
    "Персидская",
    "Русская голубая",
    "Сиамская",
    "Сибирская",
    "Сфинкс",
    "Шотландская вислоухая",
    "Экзотическая короткошёрстная",
]

# Синонимы → каноническое название из каталога
BREED_ALIASES: dict[str, str] = {
    "гси": "Немецкая овчарка",
    "gsd": "Немецкая овчарка",
    "german shepherd": "Немецкая овчарка",
    "deutscher schaferhund": "Немецкая овчарка",
    "лабрадор": "Лабрадор-ретривер",
    "labrador": "Лабрадор-ретривер",
    "хаски": "Сибирский хаски",
    "husky": "Сибирский хаски",
    "лайка": "Сибирская лайка",
    "шпиц": "Немецкий шпиц",
    "померанский шпиц": "Немецкий шпиц",
    "йорк": "Йоркширский терьер",
    "мейн кун": "Мейн-кун",
    "британец": "Британская короткошёрстная",
    "британская": "Британская короткошёрстная",
    "шотландская": "Шотландская вислоухая",
    "вислоухая": "Шотландская вислоухая",
}

PET_COLOR_KEYS = ("black", "white", "gray", "brown", "red", "mixed", "spotted", "striped")

COLOR_ALIASES: dict[str, str] = {
    "black": "black",
    "черный": "black",
    "чёрный": "black",
    "белый": "white",
    "white": "white",
    "серый": "gray",
    "сіры": "gray",
    "gray": "gray",
    "grey": "gray",
    "коричневый": "brown",
    "brown": "brown",
    "рыжий": "red",
    "red": "red",
    "ginger": "red",
    "пегий": "spotted",
    "пятнистый": "spotted",
    "spotted": "spotted",
    "полосатый": "striped",
    "striped": "striped",
    "tabby": "striped",
    "трехцветный": "mixed",
    "трёхцветный": "mixed",
    "mixed": "mixed",
    "смешанный": "mixed",
}


def normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    text = unicodedata.normalize("NFKC", value.strip().lower())
    text = text.replace("ё", "е")
    return re.sub(r"\s+", " ", text)


def _catalog_for_animal(animal_type: Optional[str]) -> list[str]:
    if animal_type == "dog":
        return DOG_BREEDS
    if animal_type == "cat":
        return CAT_BREEDS
    return DOG_BREEDS + CAT_BREEDS


def match_breed_to_catalog(raw: Optional[str], animal_type: Optional[str] = None) -> Optional[str]:
    """Сопоставить свободный текст породы с названием из каталога."""
    n = normalize_text(raw)
    if not n or n in {"null", "none", "неизвестно", "unknown", "дворняга", "метис", "микс"}:
        return None

    alias = BREED_ALIASES.get(n)
    if alias:
        return alias

    catalog = _catalog_for_animal(animal_type)
    norm_catalog = {normalize_text(b): b for b in catalog}

    if n in norm_catalog:
        return norm_catalog[n]

    for norm_name, canonical in norm_catalog.items():
        if n in norm_name or norm_name in n:
            return canonical

    best: tuple[float, str] | None = None
    for norm_name, canonical in norm_catalog.items():
        ratio = SequenceMatcher(None, n, norm_name).ratio()
        if ratio >= 0.78 and (best is None or ratio > best[0]):
            best = (ratio, canonical)
    return best[1] if best else None


def _breed_tokens(breed: str) -> set[str]:
    tokens = [t for t in re.split(r"[\s\-/,]+", normalize_text(breed)) if len(t) >= 5]
    return set(tokens)


def breed_similarity(a: Optional[str], b: Optional[str]) -> float:
    """0..1: насколько породы похожи (для скоринга lost↔found)."""
    na, nb = normalize_text(a), normalize_text(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    if na in nb or nb in na:
        return 0.92

    ca = match_breed_to_catalog(a)
    cb = match_breed_to_catalog(b)
    if ca and cb:
        cna, cnb = normalize_text(ca), normalize_text(cb)
        if cna == cnb:
            return 1.0
        if cna in cnb or cnb in cna:
            return 0.9

    ta, tb = _breed_tokens(na), _breed_tokens(nb)
    common = ta & tb
    if not common:
        return 0.0
    if common == {"овчарка"}:
        return 0.3
    return 0.45


def normalize_color_key(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    n = normalize_text(value)
    if n in PET_COLOR_KEYS:
        return n
    for prefix, key in COLOR_ALIASES.items():
        if n == prefix or n.startswith(prefix) or prefix in n:
            return key
    return None


def normalize_color_list(colors: list) -> list[str]:
    out: list[str] = []
    for item in colors or []:
        key = normalize_color_key(str(item))
        if key and key not in out:
            out.append(key)
    return out


def color_similarity(a: list, b: list) -> float:
    sa = set(normalize_color_list(a))
    sb = set(normalize_color_list(b))
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)
