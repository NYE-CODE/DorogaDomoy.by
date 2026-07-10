"""Нормализация и сравнение отличительных примет питомца (из Groq / формы)."""
from __future__ import annotations

import re
from typing import Any

from breed_catalog import normalize_text

MAX_MARKS = 8
MAX_MARK_LEN = 80


def normalize_distinctive_marks(raw: Any) -> list[str]:
    """Приводит ввод к списку коротких уникальных фраз (до MAX_MARKS)."""
    parts: list[str] = []
    if raw is None:
        return []
    if isinstance(raw, str):
        parts = re.split(r"[,;\n]+", raw)
    elif isinstance(raw, list):
        parts = [str(x) for x in raw]
    else:
        return []

    out: list[str] = []
    seen: set[str] = set()
    for part in parts:
        text = re.sub(r"\s+", " ", (part or "").strip())
        if len(text) < 3 or len(text) > MAX_MARK_LEN:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(text)
        if len(out) >= MAX_MARKS:
            break
    return out


def _mark_tokens(mark: str) -> set[str]:
    normalized = normalize_text(mark)
    return set(re.findall(r"[a-zа-яё0-9]{3,}", normalized))


def marks_overlap_score(marks_a: Any, marks_b: Any) -> tuple[float, list[str]]:
    """Возвращает (score 0..1, совпавшие приметы из первого списка)."""
    a = normalize_distinctive_marks(marks_a)
    b = normalize_distinctive_marks(marks_b)
    if not a or not b:
        return 0.0, []

    matched: list[str] = []
    used_b: set[int] = set()
    for ma in a:
        ma_norm = normalize_text(ma)
        ma_tokens = _mark_tokens(ma)
        for idx, mb in enumerate(b):
            if idx in used_b:
                continue
            mb_norm = normalize_text(mb)
            if ma_norm == mb_norm or ma_norm in mb_norm or mb_norm in ma_norm:
                matched.append(ma)
                used_b.add(idx)
                break
            mb_tokens = _mark_tokens(mb)
            if ma_tokens and mb_tokens:
                overlap = len(ma_tokens & mb_tokens) / min(len(ma_tokens), len(mb_tokens))
                if overlap >= 0.5:
                    matched.append(ma)
                    used_b.add(idx)
                    break

    if not matched:
        return 0.0, []
    score = len(matched) / max(len(a), len(b))
    return max(0.0, min(1.0, score)), matched
