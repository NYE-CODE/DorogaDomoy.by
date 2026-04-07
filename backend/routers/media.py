"""Media articles API (СМИ о нас) — для лендинга и админ-панели."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import MediaArticle
from schemas import MediaArticleCreate, MediaArticleUpdate, MediaArticleResponse
from auth import require_admin


router = APIRouter(prefix="/media", tags=["media"])


def _to_response(m: MediaArticle) -> MediaArticleResponse:
    return MediaArticleResponse(
        id=m.id,
        logo_url=m.logo_url,
        title=m.title,
        published_at=m.published_at,
        link=m.link,
    )


@router.get("", response_model=list[MediaArticleResponse])
def list_articles(
    limit: Optional[int] = Query(None, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Публичный список статей СМИ — для секции «СМИ о нас» на лендинге."""
    stmt = select(MediaArticle).order_by(MediaArticle.published_at.desc())
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    items = db.scalars(stmt).all()
    return [_to_response(m) for m in items]


@router.post("", response_model=MediaArticleResponse)
def create_article(
    data: MediaArticleCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    """Создать статью (только админ)."""
    m = MediaArticle(
        id=str(uuid.uuid4()),
        logo_url=data.logo_url or None,
        title=data.title.strip(),
        published_at=data.published_at,
        link=data.link and data.link.strip() or None,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _to_response(m)


@router.patch("/{article_id}", response_model=MediaArticleResponse)
def update_article(
    article_id: str,
    data: MediaArticleUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    """Обновить статью (только админ)."""
    m = db.scalar(select(MediaArticle).where(MediaArticle.id == article_id))
    if not m:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    if data.logo_url is not None:
        m.logo_url = data.logo_url.strip() if data.logo_url else None
    if data.title is not None:
        m.title = data.title.strip()
    if data.published_at is not None:
        m.published_at = data.published_at
    if data.link is not None:
        m.link = data.link.strip() if data.link else None
    db.commit()
    db.refresh(m)
    return _to_response(m)


@router.delete("/{article_id}", status_code=204)
def delete_article(
    article_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    """Удалить статью (только админ)."""
    m = db.scalar(select(MediaArticle).where(MediaArticle.id == article_id))
    if not m:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    db.delete(m)
    db.commit()
