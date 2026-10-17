"""Отдача /uploads с долгим кэшем и уменьшенной копией для карточек (?w=)."""
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from PIL import Image

THUMB_WIDTHS = (256, 480, 640, 960, 1280)
CACHE_CONTROL = "public, max-age=31536000"


def ensure_thumb(src: Path, width: int) -> Path:
    """WebP не шире width. Повторный запрос берёт уже собранный файл."""
    dest_dir = src.parent / ".thumbs"
    dest_dir.mkdir(exist_ok=True)
    dest = dest_dir / f"w{width}-{src.stem}.webp"
    if dest.is_file() and dest.stat().st_mtime >= src.stat().st_mtime:
        return dest
    with Image.open(src) as image:
        image.thumbnail((width, width * 3), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        image.save(dest, "WEBP", quality=76, method=4)
    return dest


def register_upload_routes(app: FastAPI, uploads_dir: Path) -> None:
    root = uploads_dir.resolve()

    @app.get("/uploads/{filename}")
    def serve_upload(
        filename: str,
        w: int | None = Query(None),
    ):
        if (
            not filename
            or filename.startswith(".")
            or "/" in filename
            or "\\" in filename
            or ".." in filename
        ):
            raise HTTPException(status_code=404)
        src = (root / filename).resolve()
        if not str(src).startswith(str(root)) or not src.is_file():
            raise HTTPException(status_code=404)
        target = src
        media_type = None
        if w in THUMB_WIDTHS and src.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            target = ensure_thumb(src, w)
            media_type = "image/webp"
        return FileResponse(
            target,
            media_type=media_type,
            headers={"Cache-Control": CACHE_CONTROL},
        )
