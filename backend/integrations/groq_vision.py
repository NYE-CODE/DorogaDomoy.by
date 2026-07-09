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
По фото определи породу, окрас и пол. Ответь СТРОГО одним JSON-объектом без markdown и без пояснений вне JSON:
{
  "animal_type": "cat" | "dog" | "other",
  "breed": "конкретная порода на русском (например Немецкая овчарка, Лабрадор-ретривер, Сибирская лайка) или null если не уверен",
  "colors": ["основной окрас", "дополнительный"],
  "gender": "male" | "female" | "unknown",
  "notes": null
}

Правила:
- breed: укажи породу максимально конкретно; не пиши общие описания вместо породы («крупная собака», «пушистый кот» — запрещено).
- colors: 1–3 окраса на русском (чёрный, белый, рыжий, серый, коричневый, пегий, трёхцветный).
- gender: male/female если видно, иначе unknown.
- notes: всегда null (описания не нужны).
- Если порода неочевидна — breed: null, не выдумывай."""


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
    if not isinstance(value, str):
        return None
    v = value.strip().lower()
    if v in {"cat", "dog", "other"}:
        return v
    if "кош" in v or "cat" in v:
        return "cat"
    if "соб" in v or "dog" in v:
        return "dog"
    return "other"


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
        breed_matched = match_breed_to_catalog(breed_str, animal_type) if breed_str else None
        gender = _normalize_gender(parsed.get("gender"))
        return {
            "ai_available": True,
            "animal_type": animal_type,
            "breed": breed_matched or breed_str,
            "colors": color_keys or colors,
            "gender": gender,
            "notes": None,
        }
    except Exception as e:
        logger.warning("Groq vision analyze failed: %s", e)
        return {"ai_available": False, "colors": [], "error": "analyze_failed"}
