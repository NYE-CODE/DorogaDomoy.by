"""Нормализация и сравнение CLIP-эмбеддингов (один или несколько векторов на объявление)."""
from __future__ import annotations

import math
from typing import Any

MAX_EMBEDDING_PHOTOS = 3


def parse_photo_embeddings(raw: Any) -> list[list[float]]:
    """Поддерживает legacy: один вектор в JSON-массиве float."""
    if not raw or not isinstance(raw, list):
        return []
    if raw and isinstance(raw[0], (int, float)):
        return [[float(x) for x in raw]]
    out: list[list[float]] = []
    for item in raw:
        if not isinstance(item, list) or not item:
            continue
        try:
            out.append([float(x) for x in item])
        except (TypeError, ValueError):
            continue
    return out


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(x * y for x, y in zip(vec_a, vec_b))
    na = math.sqrt(sum(x * x for x in vec_a))
    nb = math.sqrt(sum(y * y for y in vec_b))
    if na <= 0 or nb <= 0:
        return 0.0
    return max(0.0, min(1.0, dot / (na * nb)))


def max_visual_similarity(source_raw: Any, candidate_raw: Any) -> float:
    """Максимальное косинусное сходство по всем парам фото source × candidate."""
    src_vecs = parse_photo_embeddings(source_raw)
    cand_vecs = parse_photo_embeddings(candidate_raw)
    if not src_vecs or not cand_vecs:
        return 0.0
    best = 0.0
    for a in src_vecs:
        for b in cand_vecs:
            best = max(best, cosine_similarity(a, b))
    return best
