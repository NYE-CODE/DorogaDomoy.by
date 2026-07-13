"""Тесты сохранения data-URL изображений в /uploads."""
from pathlib import Path

import pytest
from fastapi import HTTPException

from upload_utils import persist_optional_image_url


def test_persist_keeps_upload_path(tmp_path: Path):
    assert persist_optional_image_url("/uploads/abc.jpg", tmp_path) == "/uploads/abc.jpg"


def test_persist_empty_becomes_none(tmp_path: Path):
    assert persist_optional_image_url(None, tmp_path) is None
    assert persist_optional_image_url("   ", tmp_path) is None


def test_persist_data_image_writes_file(tmp_path: Path):
    data_url = (
        "data:image/png;base64,"
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )
    path = persist_optional_image_url(data_url, tmp_path)
    assert path is not None
    assert path.startswith("/uploads/")
    filename = path.removeprefix("/uploads/")
    assert (tmp_path / filename).is_file()


def test_persist_rejects_non_image_data_url(tmp_path: Path):
    with pytest.raises(HTTPException) as ei:
        persist_optional_image_url("data:text/plain;base64,YQ==", tmp_path)
    assert ei.value.status_code == 400
