"""Превью загруженного фото для карточки."""
import io
from pathlib import Path

from PIL import Image

from upload_files import ensure_thumb


def test_ensure_thumb_writes_webp_and_reuses_it(tmp_path: Path):
    src = tmp_path / "pet.jpg"
    image = Image.new("RGB", (1200, 800), (200, 80, 20))
    image.save(src, "JPEG", quality=90)

    first = ensure_thumb(src, 640)
    assert first.suffix == ".webp"
    assert first.is_file()
    assert first.stat().st_size < src.stat().st_size
    with Image.open(first) as thumb:
        assert thumb.size[0] <= 640

    stamped = first.stat().st_mtime
    again = ensure_thumb(src, 640)
    assert again == first
    assert again.stat().st_mtime == stamped


def test_ensure_thumb_keeps_png_alpha(tmp_path: Path):
    src = tmp_path / "mark.png"
    image = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
    buf = io.BytesIO()
    image.save(buf, "PNG")
    src.write_bytes(buf.getvalue())

    thumb = ensure_thumb(src, 256)
    with Image.open(thumb) as result:
        assert result.size[0] <= 256
