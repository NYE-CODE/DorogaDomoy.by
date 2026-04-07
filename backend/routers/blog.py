"""Блог: публичные список/статья, админ CRUD, автопост в Telegram при первой публикации."""
import logging
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session, load_only

from auth import require_admin
from database import get_db
from models import BlogCategory, BlogPost, User
from schemas import (
    BlogCategoryCreate,
    BlogCategoryResponse,
    BlogCategoryUpdate,
    BlogPostAdminResponse,
    BlogPostCreate,
    BlogPostListItem,
    BlogPostPublicResponse,
    BlogPostUpdate,
)
from platform_settings import get_setting_value
from integrations.telegram import publish_blog_post_to_telegram
from time_utils import utc_now
from ttl_cache import (
    blog_category_titles_get,
    blog_category_titles_set,
    invalidate_blog_category_titles_cache,
)

BLOG_CHAT_SETTING = "telegram_blog_chat_id"
BLOG_PUBLIC_USERNAME_SETTING = "telegram_blog_public_username"

logger = logging.getLogger(__name__)

SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")

router = APIRouter(prefix="/blog", tags=["blog"])


def _resolved_blog_chat_id(db: Session) -> str:
    s = (get_setting_value(db, BLOG_CHAT_SETTING, "") or "").strip()
    if s:
        return s
    return os.getenv("TELEGRAM_BLOG_CHAT_ID", "").strip()


def _resolved_blog_public_username(db: Session) -> str:
    s = (get_setting_value(db, BLOG_PUBLIC_USERNAME_SETTING, "") or "").strip().lstrip("@")
    if s:
        return s
    return os.getenv("TELEGRAM_BLOG_PUBLIC_USERNAME", "").strip().lstrip("@")


def _article_url(slug: str) -> str:
    return f"{SITE_URL.rstrip('/')}/blog/{slug}"


def _word_count(text: str) -> int:
    """Число слов без выделения списка (один проход по символам)."""
    n = 0
    in_word = False
    for ch in text:
        if ch.isspace():
            if in_word:
                n += 1
                in_word = False
        else:
            in_word = True
    if in_word:
        n += 1
    return n


def _reading_minutes(body_md: str) -> int:
    n = _word_count(body_md or "")
    return max(1, round(n / 200)) if n else 1


def _telegram_url(post: BlogPost) -> Optional[str]:
    if post.telegram_message_id is None:
        return None
    un = (post.telegram_channel_username or "").strip().lstrip("@")
    if not un:
        return None
    return f"https://t.me/{un}/{post.telegram_message_id}"


def _absolute_cover(cover: Optional[str]) -> Optional[str]:
    if not cover or not str(cover).strip():
        return None
    u = str(cover).strip()
    if u.startswith("http://") or u.startswith("https://"):
        return u
    if u.startswith("/"):
        return f"{SITE_URL.rstrip('/')}{u}"
    return u


def _category_titles_map(db: Session) -> dict[str, str]:
    hit = blog_category_titles_get()
    if hit is not None:
        return hit
    rows = db.scalars(
        select(BlogCategory).order_by(BlogCategory.sort_order, BlogCategory.slug),
    ).all()
    m = {r.slug: r.title for r in rows}
    blog_category_titles_set(m)
    return dict(m)


def _cat_title(titles: dict[str, str], slug: Optional[str]) -> str:
    s = (slug or "guides").strip() or "guides"
    return titles.get(s, s)


def _require_blog_category(db: Session, slug: str) -> str:
    s = (slug or "").strip() or "guides"
    if not db.scalar(select(BlogCategory).where(BlogCategory.slug == s)):
        raise HTTPException(status_code=422, detail=f"Категория не найдена: {s}")
    return s


def _to_public(post: BlogPost, titles: dict[str, str]) -> BlogPostPublicResponse:
    cat = post.category or "guides"
    data = {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "excerpt": post.excerpt,
        "body_md": post.body_md,
        "cover_image_url": post.cover_image_url,
        "meta_description": post.meta_description,
        "category": cat,
        "category_title": _cat_title(titles, cat),
        "published_at": post.published_at or post.created_at,
        "reading_minutes": _reading_minutes(post.body_md),
        "telegram_post_url": _telegram_url(post),
    }
    return BlogPostPublicResponse(**data)


def _to_admin(post: BlogPost, titles: dict[str, str]) -> BlogPostAdminResponse:
    cat = post.category or "guides"
    pub_at = post.published_at or post.created_at
    return BlogPostAdminResponse(
        id=post.id,
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        body_md=post.body_md,
        cover_image_url=post.cover_image_url,
        meta_description=post.meta_description,
        category=cat,
        category_title=_cat_title(titles, cat),
        published_at=pub_at,
        reading_minutes=_reading_minutes(post.body_md),
        telegram_post_url=_telegram_url(post),
        status=post.status,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author_id=post.author_id,
        telegram_message_id=post.telegram_message_id,
        telegram_channel_username=post.telegram_channel_username,
    )


def _to_list_item(post: BlogPost, titles: dict[str, str]) -> BlogPostListItem:
    cat = post.category or "guides"
    return BlogPostListItem(
        id=post.id,
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        cover_image_url=post.cover_image_url,
        category=cat,
        category_title=_cat_title(titles, cat),
        published_at=post.published_at or post.created_at,
        reading_minutes=_reading_minutes(post.body_md),
    )


async def _try_telegram_publish(db: Session, post: BlogPost) -> None:
    if post.status != "published":
        return
    if post.telegram_message_id is not None:
        return
    chat_id = _resolved_blog_chat_id(db)
    if not chat_id:
        logger.warning("Blog post %s: не задан чат Telegram для блога (админка или TELEGRAM_BLOG_CHAT_ID)", post.slug)
        return
    url = _article_url(post.slug)
    cover = _absolute_cover(post.cover_image_url)
    msg_id, err = await publish_blog_post_to_telegram(
        chat_id=chat_id,
        title=post.title,
        excerpt=post.excerpt,
        article_url=url,
        cover_image_url=cover,
    )
    if msg_id is not None:
        post.telegram_message_id = msg_id
        un = _resolved_blog_public_username(db)
        if un:
            post.telegram_channel_username = un
        db.commit()
        logger.info("Blog post %s published to Telegram message_id=%s", post.slug, msg_id)
    else:
        logger.warning("Blog post %s: Telegram publish skipped/failed: %s", post.slug, err)


@router.get("/categories", response_model=list[BlogCategoryResponse])
def list_blog_categories(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(BlogCategory).order_by(BlogCategory.sort_order, BlogCategory.slug),
    ).all()
    return list(rows)


@router.get("/posts", response_model=list[BlogPostListItem])
def list_published_posts(
    limit: int | None = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    titles = _category_titles_map(db)
    stmt = (
        select(BlogPost)
        .options(
            load_only(
                BlogPost.id,
                BlogPost.slug,
                BlogPost.title,
                BlogPost.excerpt,
                BlogPost.cover_image_url,
                BlogPost.category,
                BlogPost.published_at,
                BlogPost.created_at,
                BlogPost.body_md,
            )
        )
        .where(BlogPost.status == "published")
        .order_by(desc(BlogPost.published_at).nulls_last(), BlogPost.created_at.desc())
    )
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    rows = db.scalars(stmt).all()
    return [_to_list_item(p, titles) for p in rows]


@router.get("/posts/{slug}", response_model=BlogPostPublicResponse)
def get_published_post(slug: str, db: Session = Depends(get_db)):
    post = db.scalar(select(BlogPost).where(BlogPost.slug == slug))
    if not post or post.status != "published":
        raise HTTPException(status_code=404, detail="Статья не найдена")
    titles = _category_titles_map(db)
    return _to_public(post, titles)


@router.get("/admin/posts", response_model=list[BlogPostAdminResponse])
def admin_list_posts(
    limit: int | None = Query(None, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    titles = _category_titles_map(db)
    stmt = select(BlogPost).order_by(BlogPost.updated_at.desc())
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    rows = db.scalars(stmt).all()
    return [_to_admin(p, titles) for p in rows]


@router.post("/admin/posts", response_model=BlogPostAdminResponse)
async def admin_create_post(
    data: BlogPostCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.scalar(select(BlogPost).where(BlogPost.slug == data.slug)):
        raise HTTPException(status_code=400, detail="Такой slug уже занят")
    cat_slug = _require_blog_category(db, data.category)
    now = utc_now()
    published_at = now if data.status == "published" else None
    post = BlogPost(
        id=f"bp-{uuid.uuid4().hex[:12]}",
        slug=data.slug,
        title=data.title.strip(),
        excerpt=(data.excerpt.strip() if data.excerpt else None) or None,
        body_md=data.body_md.strip(),
        cover_image_url=(data.cover_image_url.strip() if data.cover_image_url else None) or None,
        meta_description=(data.meta_description.strip() if data.meta_description else None) or None,
        category=cat_slug,
        status=data.status,
        published_at=published_at,
        created_at=now,
        updated_at=now,
        author_id=admin.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    await _try_telegram_publish(db, post)
    db.refresh(post)
    titles = _category_titles_map(db)
    return _to_admin(post, titles)


@router.patch("/admin/posts/{post_id}", response_model=BlogPostAdminResponse)
async def admin_update_post(
    post_id: str,
    data: BlogPostUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    post = db.scalar(select(BlogPost).where(BlogPost.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    if data.slug is not None and data.slug != post.slug:
        other = db.scalar(select(BlogPost).where(BlogPost.slug == data.slug, BlogPost.id != post_id))
        if other:
            raise HTTPException(status_code=400, detail="Такой slug уже занят")
        post.slug = data.slug
    if data.title is not None:
        post.title = data.title.strip()
    if data.excerpt is not None:
        post.excerpt = data.excerpt.strip() or None
    if data.body_md is not None:
        post.body_md = data.body_md.strip()
    if data.cover_image_url is not None:
        post.cover_image_url = data.cover_image_url.strip() or None
    if data.meta_description is not None:
        post.meta_description = data.meta_description.strip() or None
    if data.category is not None:
        post.category = _require_blog_category(db, data.category)
    if data.status is not None:
        if data.status == "published" and post.status != "published" and post.published_at is None:
            post.published_at = utc_now()
        post.status = data.status
    post.updated_at = utc_now()
    db.commit()
    db.refresh(post)
    await _try_telegram_publish(db, post)
    db.refresh(post)
    titles = _category_titles_map(db)
    return _to_admin(post, titles)


@router.post("/admin/posts/{post_id}/telegram", response_model=BlogPostAdminResponse)
async def admin_send_telegram(
    post_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Повторная отправка в Telegram, если при публикации не было message_id (например, не был настроен чат)."""
    post = db.scalar(select(BlogPost).where(BlogPost.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    if post.status != "published":
        raise HTTPException(status_code=400, detail="Сначала опубликуйте статью")
    if post.telegram_message_id is not None:
        raise HTTPException(status_code=400, detail="Пост уже отправлен в Telegram")
    await _try_telegram_publish(db, post)
    db.refresh(post)
    titles = _category_titles_map(db)
    return _to_admin(post, titles)


@router.post("/admin/categories", response_model=BlogCategoryResponse)
def admin_create_blog_category(
    data: BlogCategoryCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.scalar(select(BlogCategory).where(BlogCategory.slug == data.slug)):
        raise HTTPException(status_code=400, detail="Такой slug уже занят")
    now = utc_now()
    row = BlogCategory(
        id=f"bc-{uuid.uuid4().hex[:12]}",
        slug=data.slug,
        title=data.title.strip(),
        sort_order=data.sort_order,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    invalidate_blog_category_titles_cache()
    return row


@router.patch("/admin/categories/{category_id}", response_model=BlogCategoryResponse)
def admin_update_blog_category(
    category_id: str,
    data: BlogCategoryUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(BlogCategory).where(BlogCategory.id == category_id))
    if not row:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    if data.title is not None:
        row.title = data.title.strip()
    if data.sort_order is not None:
        row.sort_order = data.sort_order
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    invalidate_blog_category_titles_cache()
    return row


@router.delete("/admin/categories/{category_id}", status_code=204)
def admin_delete_blog_category(
    category_id: str,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(BlogCategory).where(BlogCategory.id == category_id))
    if not row:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    n = db.scalar(
        select(func.count()).select_from(BlogPost).where(BlogPost.category == row.slug),
    )
    if n and n > 0:
        raise HTTPException(
            status_code=409,
            detail="Нельзя удалить категорию: есть статьи с этим slug. Сначала переназначьте категорию у статей.",
        )
    db.delete(row)
    db.commit()
    invalidate_blog_category_titles_cache()


@router.delete("/admin/posts/{post_id}", status_code=204)
def admin_delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    post = db.scalar(select(BlogPost).where(BlogPost.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    db.delete(post)
    db.commit()
