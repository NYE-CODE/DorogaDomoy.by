"""Shared helpers for saving uploaded images into /uploads."""
import base64
import logging
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException

logger = logging.getLogger(__name__)

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

    try:
        uploads_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{ext}"
        (uploads_dir / filename).write_bytes(raw)
    except OSError as exc:
        logger.exception("Failed to write upload into %s", uploads_dir)
        raise HTTPException(
            status_code=503,
            detail="Не удалось сохранить изображение на сервере",
        ) from exc
    return f"/uploads/{filename}"


def delete_upload_url(url: str, uploads_dir: Path) -> None:
    """Remove a file previously saved under /uploads/…"""
    if not url.startswith("/uploads/"):
        return
    rel = url.removeprefix("/uploads/").lstrip("/").replace("\\", "/")
    if not rel or ".." in rel.split("/"):
        return
    try:
        (uploads_dir / rel).unlink(missing_ok=True)
    except OSError:
        logger.warning("Failed to delete upload %s", url, exc_info=True)


def persist_optional_image_url(url: Optional[str], uploads_dir: Path) -> Optional[str]:
    """data:image → /uploads/…; пустые → None; остальное (пути/URL) без изменений."""
    if url is None:
        return None
    u = str(url).strip()
    if not u:
        return None
    if u.startswith("data:image/"):
        return save_data_image(u, uploads_dir)
    if u.startswith("data:"):
        raise HTTPException(status_code=400, detail="Поддерживаются только изображения")
    return u


def replace_optional_image_url(
    old: Optional[str],
    new: Optional[str],
    uploads_dir: Path,
) -> Optional[str]:
    """Сохраняет новое изображение и удаляет старый /uploads файл при замене."""
    if new is None:
        return None
    persisted = persist_optional_image_url(new, uploads_dir)
    old_s = (old or "").strip()
    new_s = (persisted or "").strip()
    if old_s.startswith("/uploads/") and old_s != new_s:
        delete_upload_url(old_s, uploads_dir)
    return persisted
