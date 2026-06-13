"""Видеогайды: категории и YouTube-ролики, публичный список и админ CRUD."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import GuideCategory, GuideVideo, User
from schemas import (
    GuideCategoryCreate,
    GuideCategoryResponse,
    GuideCategoryUpdate,
    GuideVideoAdminResponse,
    GuideVideoCreate,
    GuideVideoPublicResponse,
    GuideVideoUpdate,
)
from time_utils import utc_now
from youtube_utils import parse_youtube_video_id, youtube_embed_url, youtube_thumbnail_url

router = APIRouter(prefix="/guides", tags=["guides"])


def _category_titles_map(db: Session) -> dict[str, str]:
    rows = db.scalars(select(GuideCategory)).all()
    return {r.slug: r.title for r in rows}


def _require_guide_category(db: Session, slug: str) -> str:
    s = (slug or "").strip()
    row = db.scalar(select(GuideCategory).where(GuideCategory.slug == s))
    if not row:
        raise HTTPException(status_code=400, detail="Категория не найдена")
    return row.slug


def _to_public(row: GuideVideo, titles: dict[str, str]) -> GuideVideoPublicResponse:
    return GuideVideoPublicResponse(
        id=row.id,
        category=row.category,
        category_title=titles.get(row.category, row.category),
        title=row.title,
        description=row.description,
        youtube_url=row.youtube_url,
        video_id=row.video_id,
        embed_url=youtube_embed_url(row.video_id),
        thumbnail_url=youtube_thumbnail_url(row.video_id),
        sort_order=row.sort_order,
        published_at=row.published_at,
    )


def _to_admin(row: GuideVideo, titles: dict[str, str]) -> GuideVideoAdminResponse:
    base = _to_public(row, titles)
    return GuideVideoAdminResponse(
        **base.model_dump(),
        status=row.status,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("/categories", response_model=list[GuideCategoryResponse])
def list_guide_categories(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(GuideCategory).order_by(GuideCategory.sort_order, GuideCategory.slug),
    ).all()
    return list(rows)


@router.get("/videos", response_model=list[GuideVideoPublicResponse])
def list_published_videos(
    category: str | None = Query(None, max_length=40),
    db: Session = Depends(get_db),
):
    titles = _category_titles_map(db)
    stmt = (
        select(GuideVideo)
        .where(GuideVideo.status == "published")
        .order_by(GuideVideo.sort_order, desc(GuideVideo.published_at).nulls_last(), GuideVideo.created_at.desc())
    )
    if category:
        stmt = stmt.where(GuideVideo.category == category.strip())
    rows = db.scalars(stmt).all()
    return [_to_public(r, titles) for r in rows]


@router.get("/admin/videos", response_model=list[GuideVideoAdminResponse])
def admin_list_videos(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    titles = _category_titles_map(db)
    rows = db.scalars(
        select(GuideVideo).order_by(GuideVideo.sort_order, GuideVideo.updated_at.desc()),
    ).all()
    return [_to_admin(r, titles) for r in rows]


@router.post("/admin/categories", response_model=GuideCategoryResponse, status_code=201)
def admin_create_category(
    data: GuideCategoryCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.scalar(select(GuideCategory).where(GuideCategory.slug == data.slug)):
        raise HTTPException(status_code=400, detail="Такой slug уже занят")
    now = utc_now()
    row = GuideCategory(
        id=f"gc-{uuid.uuid4().hex[:12]}",
        slug=data.slug,
        title=data.title.strip(),
        sort_order=data.sort_order,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/admin/categories/{category_id}", response_model=GuideCategoryResponse)
def admin_update_category(
    category_id: str,
    data: GuideCategoryUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(GuideCategory).where(GuideCategory.id == category_id))
    if not row:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    if data.title is not None:
        row.title = data.title.strip()
    if data.sort_order is not None:
        row.sort_order = data.sort_order
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return row


@router.delete("/admin/categories/{category_id}", status_code=204)
def admin_delete_category(
    category_id: str,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(GuideCategory).where(GuideCategory.id == category_id))
    if not row:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    n = db.scalar(
        select(func.count()).select_from(GuideVideo).where(GuideVideo.category == row.slug),
    )
    if n and n > 0:
        raise HTTPException(
            status_code=409,
            detail="Нельзя удалить категорию: есть видео с этим slug. Сначала переназначьте или удалите видео.",
        )
    db.delete(row)
    db.commit()


@router.post("/admin/videos", response_model=GuideVideoAdminResponse, status_code=201)
def admin_create_video(
    data: GuideVideoCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    cat_slug = _require_guide_category(db, data.category)
    video_id = parse_youtube_video_id(data.youtube_url)
    now = utc_now()
    published_at = now if data.status == "published" else None
    row = GuideVideo(
        id=f"gv-{uuid.uuid4().hex[:12]}",
        category=cat_slug,
        title=data.title.strip(),
        description=(data.description.strip() if data.description else None) or None,
        youtube_url=data.youtube_url.strip(),
        video_id=video_id,
        sort_order=data.sort_order,
        status=data.status,
        published_at=published_at,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    titles = _category_titles_map(db)
    return _to_admin(row, titles)


@router.patch("/admin/videos/{video_id}", response_model=GuideVideoAdminResponse)
def admin_update_video(
    video_id: str,
    data: GuideVideoUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(GuideVideo).where(GuideVideo.id == video_id))
    if not row:
        raise HTTPException(status_code=404, detail="Видео не найдено")
    if data.category is not None:
        row.category = _require_guide_category(db, data.category)
    if data.title is not None:
        row.title = data.title.strip()
    if data.description is not None:
        row.description = data.description.strip() or None
    if data.youtube_url is not None:
        row.youtube_url = data.youtube_url.strip()
        row.video_id = parse_youtube_video_id(data.youtube_url)
    if data.sort_order is not None:
        row.sort_order = data.sort_order
    if data.status is not None:
        was_published = row.status == "published"
        row.status = data.status
        if data.status == "published" and not was_published and row.published_at is None:
            row.published_at = utc_now()
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    titles = _category_titles_map(db)
    return _to_admin(row, titles)


@router.delete("/admin/videos/{video_id}", status_code=204)
def admin_delete_video(
    video_id: str,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(GuideVideo).where(GuideVideo.id == video_id))
    if not row:
        raise HTTPException(status_code=404, detail="Видео не найдено")
    db.delete(row)
    db.commit()
