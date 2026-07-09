"""Подсказки по фото через Groq Vision API (опционально, нужен GROQ_API_KEY)."""
from __future__ import annotations

import base64
import json
import logging
import mimetypes
import os
import re
from pathlib import Path
from typing import Any, Optional

import httpx

from breed_catalog import match_breed_to_catalog, normalize_color_list

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

PROMPT = """Ты помощник сервиса поиска пропавших животных в Беларуси.
Сначала определи, подходит ли фото для объявления о питомце.
Ответь СТРОГО одним JSON-объектом без markdown:
{
  "is_animal": true | false,
  "reject_reason": null | "not_animal" | "unclear" | "too_far",
  "animal_type": "cat" | "dog" | "other" | null,
  "breed": "конкретная порода на русском или null",
  "colors": ["основной окрас"],
  "gender": "male" | "female" | "unknown" | null,
  "approximate_age": "less_2" | "more_2" | "unknown" | null,
  "age_years_estimate": число 0–30 или null,
  "description": "1–3 предложения на русском или null"
}

Правила:
- is_animal=false если на фото НЕТ животного (люди, предметы, еда, пейзаж, текст, скриншот, мем).
- reject_reason=not_animal — животного нет.
- reject_reason=unclear — животное есть, но не разобрать (темно, размыто, закрыто, виден лишь фрагмент).
- reject_reason=too_far — животное слишком далеко / занимает малую часть кадра.
- При is_animal=false: reject_reason обязателен, остальные поля null.
- При is_animal=true: breed конкретно; не пиши «крупная собака» вместо породы.
- colors: 1–3 окраса на русском.
- approximate_age: less_2 если явно щенок/котёнок или возраст до ~2 лет; more_2 если взрослый; unknown если неясно.
- age_years_estimate: примерный возраст в годах, если можно оценить по фото.
- Если порода неочевидна — breed: null."""


def _groq_api_key() -> Optional[str]:
    key = (os.getenv("GROQ_API_KEY") or "").strip()
    return key or None


def _groq_model() -> str:
    return (os.getenv("GROQ_VISION_MODEL") or DEFAULT_MODEL).strip() or DEFAULT_MODEL


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("JSON not found in model response")
    return json.loads(text[start : end + 1])


def _extract_uploads_filename(url: str) -> Optional[str]:
    if url.startswith("/uploads/"):
        return Path(url).name
    if "/uploads/" in url:
        after = url.split("/uploads/", 1)[1]
        return after.split("?")[0].split("#")[0] if after else None
    return None


def _file_to_data_url(path: Path) -> Optional[str]:
    if not path.is_file():
        return None
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    if not mime.startswith("image/"):
        mime = "image/jpeg"
    b64 = base64.standard_b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _normalize_image_input(image: str) -> Optional[str]:
    """Принимает data URL или путь/URL на /uploads/… и возвращает data URL."""
    image = (image or "").strip()
    if not image:
        return None
    if image.startswith("data:image"):
        return image

    uploads_name = _extract_uploads_filename(image)
    if uploads_name:
        data_url = _file_to_data_url(UPLOADS_DIR / uploads_name)
        if data_url:
            return data_url

    if image.startswith("http://") or image.startswith("https://"):
        try:
            with httpx.Client(timeout=20.0, follow_redirects=True) as client:
                resp = client.get(image)
                resp.raise_for_status()
            content_type = (resp.headers.get("content-type") or "image/jpeg").split(";", 1)[0].strip()
            if not content_type.startswith("image/"):
                content_type = "image/jpeg"
            b64 = base64.standard_b64encode(resp.content).decode("ascii")
            return f"data:{content_type};base64,{b64}"
        except Exception as e:
            logger.warning("Failed to fetch image URL for Groq: %s", e)
            return None

    return None


def _normalize_approximate_age(value: Any) -> Optional[str]:
    if value is None:
        return None
    if not isinstance(value, str):
        if isinstance(value, (int, float)):
            return "менее 2 года" if value < 2 else "более 2 года"
        return None
    v = value.strip().lower()
    if v in {"", "null", "none", "unknown", "неизвестно"}:
        return None
    if v in {"less_2", "young", "puppy", "kitten", "менее 2", "менее 2 года", "до 2"}:
        return "менее 2 года"
    if v in {"more_2", "adult", "senior", "более 2", "более 2 года", "взрослый"}:
        return "более 2 года"
    if "менее" in v or "щен" in v or "котён" in v or "котен" in v:
        return "менее 2 года"
    if "более" in v or "взросл" in v:
        return "более 2 года"
    return None


def _normalize_age_years_estimate(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        years = int(round(float(value)))
    except (TypeError, ValueError):
        return None
    if years < 0 or years > 30:
        return None
    return years


def _normalize_gender(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return None
    v = value.strip().lower()
    if v in {"male", "m", "самец", "самец.", "кобель"}:
        return "male"
    if v in {"female", "f", "самка", "сука"}:
        return "female"
    return None


def _normalize_animal_type(value: Any) -> Optional[str]:
    if value is None:
        return None
    if not isinstance(value, str):
        return None
    v = value.strip().lower()
    if v in {"", "null", "none", "unknown"}:
        return None
    if v in {"cat", "dog", "other"}:
        return v
    if "кош" in v or "cat" in v:
        return "cat"
    if "соб" in v or "dog" in v:
        return "dog"
    return "other"


def _photo_reject_error(parsed: dict[str, Any]) -> Optional[str]:
    """Код ошибки, если фото не подходит для AI-подсказки."""
    is_animal = parsed.get("is_animal")
    if is_animal is False:
        reason = str(parsed.get("reject_reason") or "not_animal").strip().lower()
        if reason in {"unclear", "too_far", "blurry", "dark", "multiple_animals"}:
            return "photo_unclear"
        return "not_animal"
    if is_animal is True:
        return None
    # Совместимость: модель могла не вернуть is_animal
    reason = str(parsed.get("reject_reason") or "").strip().lower()
    if reason in {"not_animal", "no_animal"}:
        return "not_animal"
    if reason in {"unclear", "too_far", "blurry", "dark"}:
        return "photo_unclear"
    return None


def analyze_pet_photo(image_data_url: str) -> dict[str, Any]:
    """
    Анализ фото. Возвращает dict с полями animal_type, breed, colors, notes, ai_available.
    При отсутствии ключа — ai_available=False без исключения.
    """
    api_key = _groq_api_key()
    if not api_key:
        return {"ai_available": False, "colors": []}

    image_data_url = _normalize_image_input(image_data_url) or ""
    if not image_data_url.startswith("data:image"):
        return {"ai_available": False, "colors": [], "error": "invalid_image"}

    try:
        header, b64 = image_data_url.split(",", 1)
    except ValueError:
        return {"ai_available": False, "colors": [], "error": "invalid_image"}

    mime = "image/jpeg"
    if ";" in header:
        mime = header.split(":", 1)[1].split(";", 1)[0].strip() or mime

    payload = {
        "model": _groq_model(),
        "temperature": 0.05,
        "max_tokens": 400,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64}"},
                    },
                ],
            }
        ],
    }

    try:
        with httpx.Client(timeout=45.0) as client:
            resp = client.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        content = data["choices"][0]["message"]["content"]
        parsed = _extract_json(content)
        reject_error = _photo_reject_error(parsed)
        if reject_error:
            return {"ai_available": False, "colors": [], "error": reject_error}

        colors = parsed.get("colors") or []
        if not isinstance(colors, list):
            colors = []
        colors = [str(c).strip() for c in colors if str(c).strip()][:3]
        color_keys = normalize_color_list(colors)
        breed_raw = parsed.get("breed")
        breed_str = str(breed_raw).strip() if breed_raw else None
        if breed_str and breed_str.lower() in {"null", "none", "неизвестно", "unknown"}:
            breed_str = None
        animal_type = _normalize_animal_type(parsed.get("animal_type"))
        if not animal_type:
            return {"ai_available": False, "colors": [], "error": "photo_unclear"}
        breed_matched = match_breed_to_catalog(breed_str, animal_type) if breed_str else None
        gender = _normalize_gender(parsed.get("gender"))
        approximate_age = _normalize_approximate_age(parsed.get("approximate_age"))
        age_years_estimate = _normalize_age_years_estimate(parsed.get("age_years_estimate"))
        if not approximate_age and age_years_estimate is not None:
            approximate_age = "менее 2 года" if age_years_estimate < 2 else "более 2 года"
        desc_raw = parsed.get("description") or parsed.get("notes")
        description_str = str(desc_raw).strip() if desc_raw else None
        if description_str and description_str.lower() in {"null", "none", "неизвестно", "unknown"}:
            description_str = None
        return {
            "ai_available": True,
            "animal_type": animal_type,
            "breed": breed_matched or breed_str,
            "colors": color_keys or colors,
            "gender": gender,
            "approximate_age": approximate_age,
            "age_years_estimate": age_years_estimate,
            "description": description_str,
            "notes": description_str,
        }
    except Exception as e:
        logger.warning("Groq vision analyze failed: %s", e)
        return {"ai_available": False, "colors": [], "error": "analyze_failed"}
