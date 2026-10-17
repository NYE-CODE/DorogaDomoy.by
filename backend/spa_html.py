"""Загрузка shell SPA (dist/index.html) для подстановки SEO-меты."""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path

from seo_meta import FALLBACK_SHELL

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent


def _candidate_index_paths() -> list[Path]:
    paths: list[Path] = []
    env = (os.getenv("FRONTEND_DIST") or "").strip()
    if env:
        base = Path(env)
        paths.append(base / "index.html" if base.is_dir() else base)
    paths.extend(
        [
            REPO_ROOT / "dist" / "index.html",
            Path("/var/www/dorogadomoy/dist/index.html"),
            Path("/var/www/dorogadomoy/index.html"),
        ]
    )
    return paths


@lru_cache(maxsize=4)
def load_spa_shell(mtime_key: float = 0.0) -> str:
    """Читает index.html. mtime_key сбрасывает кэш при обновлении файла."""
    del mtime_key  # только для ключа кэша
    for path in _candidate_index_paths():
        try:
            if path.is_file():
                text = path.read_text(encoding="utf-8")
                if "<html" in text.lower():
                    logger.info("SPA shell loaded from %s", path)
                    return text
        except OSError as exc:
            logger.warning("Cannot read SPA shell %s: %s", path, exc)
    logger.warning("SPA shell not found — using fallback HTML (set FRONTEND_DIST)")
    return FALLBACK_SHELL


def get_spa_shell() -> str:
    for path in _candidate_index_paths():
        try:
            if path.is_file():
                mtime = path.stat().st_mtime
                return load_spa_shell(mtime)
        except OSError:
            continue
    return load_spa_shell(0.0)
