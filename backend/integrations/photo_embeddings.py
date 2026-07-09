"""CLIP-эмбеддинги фото (опционально: pip install fastembed)."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_model = None
_model_failed = False

BACKEND_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BACKEND_DIR / "uploads"


def _get_model():
    global _model, _model_failed
    if _model_failed:
        return None
    if _model is not None:
        return _model
    try:
        from fastembed import ImageEmbedding

        _model = ImageEmbedding(model_name="Qdrant/clip-ViT-B-32-vision")
        logger.info("CLIP image embedding model loaded")
        return _model
    except Exception as e:
        _model_failed = True
        logger.warning("CLIP embeddings unavailable (install fastembed): %s", e)
        return None


def _resolve_photo_path(photo_url: str) -> Optional[Path]:
    if not photo_url:
        return None
    if photo_url.startswith("/uploads/"):
        rel = photo_url.removeprefix("/uploads/").lstrip("/")
        path = UPLOADS_DIR / rel
        return path if path.is_file() else None
    if photo_url.startswith("uploads/"):
        path = BACKEND_DIR / photo_url
        return path if path.is_file() else None
    return None


def compute_embedding_for_pet_photos(photos: list[str]) -> Optional[list[float]]:
    """Эмбеддинг первого доступного фото объявления."""
    model = _get_model()
    if model is None:
        return None
    for photo in photos or []:
        path = _resolve_photo_path(photo)
        if not path:
            continue
        try:
            vectors = list(model.embed([str(path)]))
            if not vectors:
                continue
            vec = vectors[0]
            return [float(x) for x in vec.tolist()]
        except Exception as e:
            logger.warning("Embedding failed for %s: %s", path, e)
    return None


def save_pet_embedding(pet_id: str) -> None:
    """Фоновая задача: посчитать и сохранить embedding для объявления."""
    from sqlalchemy import select

    from database import SessionLocal
    from models import Pet

    db = SessionLocal()
    try:
        pet = db.scalar(select(Pet).where(Pet.id == pet_id))
        if not pet or not pet.photos:
            return
        embedding = compute_embedding_for_pet_photos(pet.photos)
        if embedding is None:
            return
        pet.photo_embedding = embedding
        db.commit()
        logger.info("Saved photo embedding for pet %s", pet_id)
    except Exception as e:
        db.rollback()
        logger.exception("save_pet_embedding failed for %s: %s", pet_id, e)
    finally:
        db.close()
