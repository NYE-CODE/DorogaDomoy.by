"""Анализ до N фото и агрегация результатов Groq Vision."""
from __future__ import annotations

from collections import Counter
from typing import Any

from integrations.groq_vision import analyze_pet_photo
from distinctive_marks import normalize_distinctive_marks

MAX_ANALYZE_PHOTOS = 3


def _dedupe_images(images: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in images:
        img = (raw or "").strip()
        if not img or img in seen:
            continue
        seen.add(img)
        out.append(img)
        if len(out) >= MAX_ANALYZE_PHOTOS:
            break
    return out


def _majority(values: list[str | None]) -> str | None:
    filtered = [v for v in values if v]
    if not filtered:
        return None
    return Counter(filtered).most_common(1)[0][0]


def _merge_colors(rows: list[dict[str, Any]]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for row in rows:
        for color in row.get("colors") or []:
            key = str(color).strip()
            if not key or key in seen:
                continue
            seen.add(key)
            merged.append(key)
    return merged[:6]


def _pick_description(rows: list[dict[str, Any]]) -> str | None:
    candidates: list[str] = []
    for row in rows:
        for key in ("description", "notes"):
            text = row.get(key)
            if isinstance(text, str) and text.strip():
                candidates.append(text.strip())
    if not candidates:
        return None
    return max(candidates, key=len)


def _pick_breed(rows: list[dict[str, Any]], animal_type: str | None) -> str | None:
    breeds = [str(r.get("breed")).strip() for r in rows if r.get("breed")]
    breeds = [b for b in breeds if b]
    if not breeds:
        return None
    if animal_type:
        same_type = [
            str(r.get("breed")).strip()
            for r in rows
            if r.get("breed") and r.get("animal_type") == animal_type
        ]
        if same_type:
            breeds = [b for b in same_type if b]
    return Counter(breeds).most_common(1)[0][0]


def _merge_distinctive_marks(rows: list[dict[str, Any]]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for row in rows:
        for mark in normalize_distinctive_marks(row.get("distinctive_marks")):
            key = mark.lower()
            if key in seen:
                continue
            seen.add(key)
            merged.append(mark)
    return merged[:8]


def merge_analyze_results(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Сливает до MAX_ANALYZE_PHOTOS ответов analyze_pet_photo."""
    if not results:
        return {"ai_available": False, "colors": [], "error": "invalid_image"}

    ok = [r for r in results if r.get("ai_available")]
    if not ok:
        for err in ("not_animal", "photo_unclear", "invalid_image", "analyze_failed"):
            if any(r.get("error") == err for r in results):
                return {"ai_available": False, "colors": [], "error": err}
        if any(not r.get("error") for r in results):
            return {"ai_available": False, "colors": [], "error": None}
        return {"ai_available": False, "colors": [], "error": "analyze_failed"}

    animal_type = _majority([r.get("animal_type") for r in ok])
    gender = _majority([r.get("gender") for r in ok if r.get("gender") in {"male", "female"}])
    approximate_age = _majority([r.get("approximate_age") for r in ok])

    age_estimates = [r.get("age_years_estimate") for r in ok if r.get("age_years_estimate") is not None]
    age_years_estimate = None
    if age_estimates:
        age_years_estimate = round(sum(age_estimates) / len(age_estimates))

    description = _pick_description(ok)
    return {
        "ai_available": True,
        "animal_type": animal_type,
        "breed": _pick_breed(ok, animal_type),
        "colors": _merge_colors(ok),
        "gender": gender,
        "approximate_age": approximate_age,
        "age_years_estimate": age_years_estimate,
        "description": description,
        "notes": description,
        "distinctive_marks": _merge_distinctive_marks(ok),
    }


def analyze_pet_photos(images: list[str]) -> dict[str, Any]:
    """До MAX_ANALYZE_PHOTOS кадров → один агрегированный результат."""
    resolved = _dedupe_images(images)
    if not resolved:
        return {"ai_available": False, "colors": [], "error": "invalid_image"}
    if len(resolved) == 1:
        return analyze_pet_photo(resolved[0])
    return merge_analyze_results([analyze_pet_photo(img) for img in resolved])
