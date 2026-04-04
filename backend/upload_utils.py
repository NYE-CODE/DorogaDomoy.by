"""Shared helpers for saving uploaded images into /uploads."""
import base64
import uuid
from pathlib import Path

from fastapi import HTTPException

MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}

MAX_PHOTO_BYTES = 10 * 1024 * 1024


def save_data_image(data_url: str, uploads_dir: Path) -> str:
    if not data_url.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="Поддерживаются только изображения")

    try:
        header, encoded = data_url.split(",", 1)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Некорректный формат фото") from exc

    mime = header.split(";")[0].replace("data:", "")
    ext = MIME_TO_EXT.get(mime, ".jpg")
    raw = base64.b64decode(encoded)
    if len(raw) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="Фото слишком большое (макс. 10 МБ)")

    filename = f"{uuid.uuid4().hex}{ext}"
    (uploads_dir / filename).write_bytes(raw)
    return f"/uploads/{filename}"
