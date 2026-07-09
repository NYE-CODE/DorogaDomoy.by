"""Поиск похожих объявлений lost ↔ found (характеристики автора + опционально CLIP)."""
from __future__ import annotations

import math
import re
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from breed_catalog import breed_similarity, color_similarity, normalize_text
from models import Pet

OPPOSITE_STATUS = {"searching": "found", "found": "searching"}

DEFAULT_RADIUS_KM = 15.0
MAX_RADIUS_KM = 50.0
MIN_RELEVANCE_SCORE = 32.0


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


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(x * y for x, y in zip(vec_a, vec_b))
    na = math.sqrt(sum(x * x for x in vec_a))
    nb = math.sqrt(sum(y * y for y in vec_b))
    if na <= 0 or nb <= 0:
        return 0.0
    return max(0.0, min(1.0, dot / (na * nb)))


def _gender_match_score(source: Pet, candidate: Pet) -> float:
    sg = normalize_text(source.gender)
    cg = normalize_text(candidate.gender)
    if not sg or not cg or sg == "unknown" or cg == "unknown":
        return 0.0
    return 1.0 if sg == cg else -0.6


def _age_match_score(source: Pet, candidate: Pet) -> float:
    sa = normalize_text(source.approximate_age)
    ca = normalize_text(candidate.approximate_age)
    if not sa or not ca:
        return 0.0
    return 1.0 if sa == ca else 0.0


_DESC_STOP = frozenset(
    {
        "это", "или", "для", "при", "был", "была", "было", "были", "очень", "есть",
        "the", "and", "with", "that", "this", "from", "have", "been",
    }
)


def _description_tokens(text: str) -> set[str]:
    normalized = normalize_text(text)
    if not normalized:
        return set()
    words = re.findall(r"[a-zа-яё0-9]{4,}", normalized)
    return {w for w in words if w not in _DESC_STOP}


def _description_overlap_score(source: Pet, candidate: Pet) -> float:
    a = _description_tokens(source.description or "")
    b = _description_tokens(candidate.description or "")
    if not a or not b:
        return 0.0
    overlap = len(a & b) / max(len(a), len(b))
    return max(0.0, min(1.0, overlap))


def _is_relevant_match(
    source: Pet,
    *,
    score: float,
    breed_sim: float,
    color_sim: float,
    visual: float,
    distance_km: Optional[float],
    reasons: list[str],
) -> bool:
    if score < MIN_RELEVANCE_SCORE:
        return False

    has_breed = bool(normalize_text(source.breed))
    has_colors = bool(source.colors)

    strong_signal = (
        breed_sim >= 0.5
        or color_sim >= 0.34
        or visual >= 0.58
        or "visual_similarity" in reasons
    )

    if has_breed and breed_sim < 0.25:
        # Порода указана автором — без совпадения породы нужны цвет + близость или визуал
        strong_signal = (
            visual >= 0.62
            or (color_sim >= 0.34 and distance_km is not None and distance_km <= 6.0)
        )

    if has_breed and has_colors and breed_sim < 0.25 and color_sim < 0.34 and visual < 0.58:
        return False

    if not has_breed and not has_colors:
        # Только гео — показываем только очень близких
        return distance_km is not None and distance_km <= 4.0

    return strong_signal


def _score_candidate(
    source: Pet,
    candidate: Pet,
    *,
    radius_km: float,
) -> tuple[float, Optional[float], list[str], float, float, float]:
    reasons: list[str] = []
    score = 0.0
    distance_km: Optional[float] = None

    breed_sim = breed_similarity(source.breed, candidate.breed)
    color_sim = color_similarity(source.colors or [], candidate.colors or [])

    if breed_sim >= 0.95:
        score += 55.0
        reasons.append("same_breed")
    elif breed_sim >= 0.5:
        score += 35.0
        reasons.append("similar_breed")
    elif breed_sim > 0:
        score += 18.0
        reasons.append("related_breed")
    elif normalize_text(source.breed) and normalize_text(candidate.breed):
        score -= 28.0

    if color_sim >= 0.67:
        score += 28.0
        reasons.append("same_color")
    elif color_sim >= 0.34:
        score += 16.0
        reasons.append("similar_color")

    gender_delta = _gender_match_score(source, candidate)
    if gender_delta > 0:
        score += 10.0
        reasons.append("same_gender")
    elif gender_delta < 0:
        score -= 8.0

    if _age_match_score(source, candidate) > 0:
        score += 8.0
        reasons.append("same_age")

    desc_overlap = _description_overlap_score(source, candidate)
    if desc_overlap >= 0.2:
        score += 12.0 * desc_overlap
        reasons.append("similar_description")

    visual = 0.0
    src_emb = getattr(source, "photo_embedding", None) or []
    cand_emb = getattr(candidate, "photo_embedding", None) or []
    if src_emb and cand_emb:
        visual = _cosine_similarity(src_emb, cand_emb)
        if visual >= 0.55:
            score += 30.0 * visual
            reasons.append("visual_similarity")

    if source.location_lat and source.location_lng and candidate.location_lat and candidate.location_lng:
        distance_km = haversine_km(
            source.location_lat,
            source.location_lng,
            candidate.location_lat,
            candidate.location_lng,
        )
        if distance_km <= radius_km:
            proximity = max(0.0, 1.0 - distance_km / radius_km)
            # Гео — дополнительный фактор, не главный
            score += 18.0 * proximity
            if distance_km <= 2:
                reasons.append("very_nearby")
            elif distance_km <= 6:
                reasons.append("nearby")
            else:
                reasons.append("same_area")
        elif normalize_text(source.city) and normalize_text(source.city) == normalize_text(candidate.city):
            score += 6.0
            reasons.append("same_city")
    elif normalize_text(source.city) and normalize_text(source.city) == normalize_text(candidate.city):
        score += 8.0
        reasons.append("same_city")

    return score, distance_km, reasons, breed_sim, color_sim, visual


def _compute_match_percent(
    source: Pet,
    candidate: Pet,
    *,
    breed_sim: float,
    color_sim: float,
    visual: float,
    distance_km: Optional[float],
    radius_km: float,
    desc_overlap: float,
) -> int:
    """Взвешенный процент совпадения 38–97.

    Порода и визуал весят больше, чем окрас в одиночку. Учитываются только факторы,
    для которых есть данные у обоих объявлений; веса перенормируются.
    """
    parts: list[tuple[float, float]] = []

    if normalize_text(source.breed) and normalize_text(candidate.breed):
        parts.append((32.0, max(0.0, min(1.0, breed_sim))))

    if visual > 0:
        parts.append((26.0, visual))

    if source.colors and candidate.colors:
        parts.append((18.0, max(0.0, min(1.0, color_sim))))

    if distance_km is not None:
        proximity = max(0.0, 1.0 - distance_km / radius_km)
        parts.append((14.0, proximity))
    elif (
        normalize_text(source.city)
        and normalize_text(source.city) == normalize_text(candidate.city)
    ):
        parts.append((10.0, 0.5))

    if (source.description or "").strip() and (candidate.description or "").strip() and desc_overlap > 0:
        parts.append((6.0, desc_overlap))

    sg = normalize_text(source.gender)
    cg = normalize_text(candidate.gender)
    if sg and cg and sg not in {"unknown", ""} and cg not in {"unknown", ""}:
        parts.append((2.0, 1.0 if sg == cg else 0.0))

    sa = normalize_text(source.approximate_age)
    ca = normalize_text(candidate.approximate_age)
    if sa and ca:
        parts.append((2.0, 1.0 if sa == ca else 0.0))

    if not parts:
        return 40

    total_weight = sum(weight for weight, _ in parts)
    blended = sum(weight * value for weight, value in parts) / total_weight
    return int(round(max(38, min(97, 38 + blended * 59))))


def find_similar_pets(
    db: Session,
    source_pet: Pet,
    *,
    limit: int = 10,
    radius_km: float = DEFAULT_RADIUS_KM,
) -> list[dict]:
    """Возвращает список {pet, score, match_percent, distance_km, reasons}."""
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
        item_score, dist, reasons, breed_sim, color_sim, visual = _score_candidate(
            source_pet, cand, radius_km=radius_km
        )
        if dist is not None and dist > radius_km:
            if not (normalize_text(source_pet.city) and normalize_text(source_pet.city) == normalize_text(cand.city)):
                continue
        if not _is_relevant_match(
            source_pet,
            score=item_score,
            breed_sim=breed_sim,
            color_sim=color_sim,
            visual=visual,
            distance_km=dist,
            reasons=reasons,
        ):
            continue
        desc_overlap = _description_overlap_score(source_pet, cand)
        match_percent = _compute_match_percent(
            source_pet,
            cand,
            breed_sim=breed_sim,
            color_sim=color_sim,
            visual=visual,
            distance_km=dist,
            radius_km=radius_km,
            desc_overlap=desc_overlap,
        )
        ranked.append(
            {
                "pet": cand,
                "score": round(item_score, 2),
                "match_percent": match_percent,
                "distance_km": round(dist, 2) if dist is not None else None,
                "reasons": reasons,
            }
        )

    ranked.sort(
        key=lambda x: (
            -x["match_percent"],
            -x["score"],
            x["distance_km"] if x["distance_km"] is not None else 9999,
        )
    )
    return ranked[: max(1, min(limit, 30))]
