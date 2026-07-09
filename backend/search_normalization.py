"""Прагматичная нормализация поисковых запросов (без NLP)."""
from __future__ import annotations

from typing import Optional

# Синонимы → канонический animal_type (cat | dog | other).
# Только для матча по Pet.animal_type; свободный текст description не переписываем.
ANIMAL_TYPE_SYNONYMS: dict[str, str] = {
    # cat
    "кот": "cat",
    "кошка": "cat",
    "котик": "cat",
    "кошечка": "cat",
    "котёнок": "cat",
    "котенок": "cat",
    "кіт": "cat",
    "котэ": "cat",
    "cat": "cat",
    "kitten": "cat",
    # dog
    "собака": "dog",
    "пёс": "dog",
    "пес": "dog",
    "пёсик": "dog",
    "песик": "dog",
    "щенок": "dog",
    "щен": "dog",
    "собачка": "dog",
    "сабака": "dog",
    "dog": "dog",
    "puppy": "dog",
    # other
    "другое": "other",
    "іншае": "other",
    "other": "other",
}


def normalize_search_query(raw: Optional[str]) -> str:
    """Нижний регистр + trim; пустая строка если нет текста."""
    if raw is None:
        return ""
    return str(raw).strip().lower()


def resolve_animal_type_from_search(raw: Optional[str]) -> Optional[str]:
    """Если весь запрос — известный синоним вида животного, вернуть cat|dog|other."""
    q = normalize_search_query(raw)
    if not q:
        return None
    return ANIMAL_TYPE_SYNONYMS.get(q)
