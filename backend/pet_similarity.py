"""Поиск похожих объявлений lost ↔ found (rule-based + опционально CLIP-эмбеддинги)."""
from __future__ import annotations

import math
import re
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Pet

OPPOSITE_STATUS = {"searching": "found", "found": "searching"}

DEFAULT_RADIUS_KM = 15.0
MAX_RADIUS_KM = 50.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _bbox_delta(radius_km: float, lat: float) -> tuple[float, float]:
    dlat = radius_km / 111.0
    cos_lat = max(math.cos(math.radians(lat)), 0.01)
    dlng = radius_km / (111.0 * cos_lat)
    return dlat, dlng


def _normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value.strip().lower())


def _breed_matches(a: Optional[str], b: Optional[str]) -> bool:
    na, nb = _normalize_text(a), _normalize_text(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    return na in nb or nb in na


def _colors_overlap(a: list, b: list) -> bool:
    sa = {_normalize_text(c) for c in (a or []) if c}
    sb = {_normalize_text(c) for c in (b or []) if c}
    if not sa or not sb:
        return False
    return bool(sa & sb)


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(x * y for x, y in zip(vec_a, vec_b))
    na = math.sqrt(sum(x * x for x in vec_a))
    nb = math.sqrt(sum(y * y for y in vec_b))
    if na <= 0 or nb <= 0:
        return 0.0
    return max(0.0, min(1.0, dot / (na * nb)))


def _score_candidate(
    source: Pet,
    candidate: Pet,
    *,
    radius_km: float,
) -> tuple[float, Optional[float], list[str]]:
    reasons: list[str] = []
    score = 0.0
    distance_km: Optional[float] = None

    if source.location_lat and source.location_lng and candidate.location_lat and candidate.location_lng:
        distance_km = haversine_km(
            source.location_lat,
            source.location_lng,
            candidate.location_lat,
            candidate.location_lng,
        )
        if distance_km <= radius_km:
            proximity = max(0.0, 1.0 - distance_km / radius_km)
            score += 30.0 * proximity
            if distance_km <= 3:
                reasons.append("very_nearby")
            elif distance_km <= 8:
                reasons.append("nearby")
            else:
                reasons.append("same_area")
        elif _normalize_text(source.city) and _normalize_text(source.city) == _normalize_text(candidate.city):
            score += 12.0
            reasons.append("same_city")
    elif _normalize_text(source.city) and _normalize_text(source.city) == _normalize_text(candidate.city):
        score += 18.0
        reasons.append("same_city")

    if _breed_matches(source.breed, candidate.breed):
        score += 15.0
        reasons.append("same_breed")

    if _colors_overlap(source.colors or [], candidate.colors or []):
        score += 12.0
        reasons.append("same_color")

    src_emb = getattr(source, "photo_embedding", None) or []
    cand_emb = getattr(candidate, "photo_embedding", None) or []
    if src_emb and cand_emb:
        visual = _cosine_similarity(src_emb, cand_emb)
        if visual >= 0.55:
            score += 25.0 * visual
            reasons.append("visual_similarity")

    score += 25.0  # базовый вес: противоположный статус + тот же тип
    return score, distance_km, reasons


def find_similar_pets(
    db: Session,
    source_pet: Pet,
    *,
    limit: int = 10,
    radius_km: float = DEFAULT_RADIUS_KM,
) -> list[dict]:
    """Возвращает список {pet, score, distance_km, reasons}."""
    if (source_pet.pet_scope or "lost_found") != "lost_found":
        return []

    matching_status = OPPOSITE_STATUS.get(source_pet.status or "")
    if not matching_status:
        return []

    radius_km = max(1.0, min(radius_km, MAX_RADIUS_KM))
    stmt = select(Pet).where(
        Pet.id != source_pet.id,
        Pet.pet_scope == "lost_found",
        Pet.status == matching_status,
        Pet.animal_type == source_pet.animal_type,
        Pet.is_archived.is_(False),
        Pet.moderation_status == "approved",
    )

    if source_pet.location_lat is not None and source_pet.location_lng is not None:
        dlat, dlng = _bbox_delta(radius_km, source_pet.location_lat)
        stmt = stmt.where(
            Pet.location_lat.between(source_pet.location_lat - dlat, source_pet.location_lat + dlat),
            Pet.location_lng.between(source_pet.location_lng - dlng, source_pet.location_lng + dlng),
        )
    elif source_pet.city:
        stmt = stmt.where(Pet.city.ilike(f"%{source_pet.city.strip()}%"))

    candidates = db.scalars(stmt).all()
    ranked: list[dict] = []
    for cand in candidates:
        item_score, dist, reasons = _score_candidate(source_pet, cand, radius_km=radius_km)
        if dist is not None and dist > radius_km:
            if not (_normalize_text(source_pet.city) and _normalize_text(source_pet.city) == _normalize_text(cand.city)):
                continue
        ranked.append(
            {
                "pet": cand,
                "score": round(item_score, 2),
                "distance_km": round(dist, 2) if dist is not None else None,
                "reasons": reasons,
            }
        )

    ranked.sort(key=lambda x: (-x["score"], x["distance_km"] if x["distance_km"] is not None else 9999))
    return ranked[: max(1, min(limit, 30))]
