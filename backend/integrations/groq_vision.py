"""Подсказки по фото через Groq Vision API (опционально, нужен GROQ_API_KEY)."""
from __future__ import annotations

import base64
import json
import logging
import os
import re
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

PROMPT = """Ты помощник сервиса поиска пропавших животных в Беларуси.
По фото определи только то, что видно. Ответь СТРОГО одним JSON-объектом без markdown:
{
  "animal_type": "cat" | "dog" | "other",
  "breed": "кратко на русском или null",
  "colors": ["основные окрасы на русском"],
  "notes": "1 короткое предложение или null"
}
Если не уверен в породе — breed: null. colors — не больше 3 элементов."""


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
        "temperature": 0.1,
        "max_tokens": 300,
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
        breed = parsed.get("breed")
        breed_str = str(breed).strip() if breed else None
        if breed_str and breed_str.lower() in {"null", "none", "неизвестно", "unknown"}:
            breed_str = None
        notes = parsed.get("notes")
        notes_str = str(notes).strip() if notes else None
        return {
            "ai_available": True,
            "animal_type": _normalize_animal_type(parsed.get("animal_type")),
            "breed": breed_str,
            "colors": colors,
            "notes": notes_str,
        }
    except Exception as e:
        logger.warning("Groq vision analyze failed: %s", e)
        return {"ai_available": False, "colors": [], "error": "analyze_failed"}
