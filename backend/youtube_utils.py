"""Parse and validate YouTube URLs for guide videos."""
from __future__ import annotations

import re

_YOUTUBE_ID_RE = re.compile(
    r"(?:youtube\.com/(?:watch\?(?:[^&\s]+&)*v=|embed/|shorts/)|youtu\.be/)([a-zA-Z0-9_-]{11})"
)


def parse_youtube_video_id(url: str) -> str:
    raw = (url or "").strip()
    if not raw:
        raise ValueError("Укажите ссылку на YouTube")
    m = _YOUTUBE_ID_RE.search(raw)
    if not m:
        raise ValueError("Некорректная ссылка YouTube (youtube.com или youtu.be)")
    return m.group(1)


def youtube_embed_url(video_id: str) -> str:
    return f"https://www.youtube-nocookie.com/embed/{video_id}"


def youtube_thumbnail_url(video_id: str) -> str:
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
