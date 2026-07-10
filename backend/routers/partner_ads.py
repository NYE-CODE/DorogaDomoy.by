"""Partner ads API — баннеры спонсоров по слотам размещения."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import Partner, PartnerAd
from schemas import PartnerAdCreate, PartnerAdResponse, PartnerAdUpdate, PARTNER_AD_PLACEMENTS

router = APIRouter(prefix="/partner-ads", tags=["partner-ads"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _is_live(ad: PartnerAd, now: datetime) -> bool:
    if not ad.is_active:
        return False
    if ad.starts_at and now < ad.starts_at:
        return False
    if ad.ends_at and now > ad.ends_at:
        return False
    return True


def _placements_list(ad: PartnerAd) -> list[str]:
    raw = ad.placements
    return list(raw) if isinstance(raw, list) else []


def _to_response(ad: PartnerAd, partner_name: str | None = None) -> PartnerAdResponse:
    return PartnerAdResponse(
        id=ad.id,
        partner_id=ad.partner_id,
        partner_name=partner_name,
        title=ad.title,
        sponsor_label=ad.sponsor_label,
        image_desktop=ad.image_desktop,
        image_mobile=ad.image_mobile,
        link_url=ad.link_url,
        alt_text=ad.alt_text,
        placements=_placements_list(ad),
        priority=ad.priority or 0,
        starts_at=ad.starts_at,
        ends_at=ad.ends_at,
        is_active=bool(ad.is_active),
        created_at=ad.created_at,
    )


def _partner_names(db: Session, ads: list[PartnerAd]) -> dict[str, str]:
    ids = {ad.partner_id for ad in ads if ad.partner_id}
    if not ids:
        return {}
    rows = db.scalars(select(Partner).where(Partner.id.in_(ids))).all()
    return {p.id: p.name for p in rows}


@router.get("/placements")
def list_placements():
    """Список допустимых слотов (для админки)."""
    return sorted(PARTNER_AD_PLACEMENTS)


@router.get("/active", response_model=list[PartnerAdResponse])
def list_active_partner_ads(db: Session = Depends(get_db)):
    """Публичный список активных кампаний для клиентского кэша."""
    now = _utcnow()
    items = db.scalars(select(PartnerAd).order_by(PartnerAd.priority.desc(), PartnerAd.created_at.desc())).all()
    live = [ad for ad in items if _is_live(ad, now)]
    names = _partner_names(db, live)
    return [_to_response(ad, names.get(ad.partner_id) if ad.partner_id else None) for ad in live]


@router.get("", response_model=list[PartnerAdResponse])
def list_partner_ads_admin(
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    """Все кампании (только админ)."""
    items = db.scalars(select(PartnerAd).order_by(PartnerAd.created_at.desc())).all()
    names = _partner_names(db, items)
    return [_to_response(ad, names.get(ad.partner_id) if ad.partner_id else None) for ad in items]


@router.get("/by-placement", response_model=list[PartnerAdResponse])
def get_partner_ad_for_placement(
    placement: str = Query(...),
    db: Session = Depends(get_db),
):
    """Публично: лучшая кампания для одного слота."""
    if placement not in PARTNER_AD_PLACEMENTS:
        raise HTTPException(status_code=400, detail="Unknown placement")
    now = _utcnow()
    items = db.scalars(select(PartnerAd).order_by(PartnerAd.priority.desc(), PartnerAd.created_at.desc())).all()
    for ad in items:
        if not _is_live(ad, now):
            continue
        if placement not in _placements_list(ad):
            continue
        name = None
        if ad.partner_id:
            partner = db.scalar(select(Partner).where(Partner.id == ad.partner_id))
            name = partner.name if partner else None
        return [_to_response(ad, name)]
    return []

@router.post("", response_model=PartnerAdResponse)
def create_partner_ad(
    data: PartnerAdCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    if data.partner_id:
        partner = db.scalar(select(Partner).where(Partner.id == data.partner_id))
        if not partner:
            raise HTTPException(status_code=404, detail="Партнёр не найден")

    ad = PartnerAd(
        id=str(uuid.uuid4()),
        partner_id=data.partner_id,
        title=data.title.strip(),
        sponsor_label=data.sponsor_label.strip() if data.sponsor_label else None,
        image_desktop=data.image_desktop.strip(),
        image_mobile=data.image_mobile.strip() if data.image_mobile else None,
        link_url=data.link_url.strip(),
        alt_text=data.alt_text.strip() if data.alt_text else None,
        placements=data.placements,
        priority=data.priority,
        starts_at=data.starts_at,
        ends_at=data.ends_at,
        is_active=data.is_active,
        created_at=_utcnow(),
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    partner_name = None
    if ad.partner_id:
        partner = db.scalar(select(Partner).where(Partner.id == ad.partner_id))
        partner_name = partner.name if partner else None
    return _to_response(ad, partner_name)


@router.patch("/{ad_id}", response_model=PartnerAdResponse)
def update_partner_ad(
    ad_id: str,
    data: PartnerAdUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    ad = db.scalar(select(PartnerAd).where(PartnerAd.id == ad_id))
    if not ad:
        raise HTTPException(status_code=404, detail="Кампания не найдена")

    payload = data.model_dump(exclude_none=True)
    if "partner_id" in payload and payload["partner_id"]:
        partner = db.scalar(select(Partner).where(Partner.id == payload["partner_id"]))
        if not partner:
            raise HTTPException(status_code=404, detail="Партнёр не найден")

    for key, value in payload.items():
        if key in ("title", "sponsor_label", "image_desktop", "image_mobile", "link_url", "alt_text") and isinstance(
            value, str
        ):
            value = value.strip() or (None if key != "title" and key != "image_desktop" and key != "link_url" else value)
        setattr(ad, key, value)

    db.commit()
    db.refresh(ad)
    partner_name = None
    if ad.partner_id:
        partner = db.scalar(select(Partner).where(Partner.id == ad.partner_id))
        partner_name = partner.name if partner else None
    return _to_response(ad, partner_name)


@router.delete("/{ad_id}", status_code=204)
def delete_partner_ad(
    ad_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    ad = db.scalar(select(PartnerAd).where(PartnerAd.id == ad_id))
    if not ad:
        raise HTTPException(status_code=404, detail="Кампания не найдена")
    db.delete(ad)
    db.commit()
