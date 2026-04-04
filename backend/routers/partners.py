"""Partners API (Наши партнеры) — для лендинга и админ-панели."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Partner
from schemas import PartnerCreate, PartnerUpdate, PartnerResponse
from auth import require_admin


router = APIRouter(prefix="/partners", tags=["partners"])


def _to_response(p: Partner) -> PartnerResponse:
    return PartnerResponse(
        id=p.id,
        logo_url=p.logo_url,
        name=p.name,
        link=p.link,
    )


@router.get("", response_model=list[PartnerResponse])
def list_partners(db: Session = Depends(get_db)):
    """Публичный список партнёров — для секции «Наши партнеры» на лендинге."""
    items = db.scalars(select(Partner)).all()
    return [_to_response(p) for p in items]


@router.post("", response_model=PartnerResponse)
def create_partner(
    data: PartnerCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    """Создать партнёра (только админ)."""
    p = Partner(
        id=str(uuid.uuid4()),
        logo_url=data.logo_url and data.logo_url.strip() or None,
        name=data.name.strip(),
        link=data.link and data.link.strip() or None,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.patch("/{partner_id}", response_model=PartnerResponse)
def update_partner(
    partner_id: str,
    data: PartnerUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    """Обновить партнёра (только админ)."""
    p = db.scalar(select(Partner).where(Partner.id == partner_id))
    if not p:
        raise HTTPException(status_code=404, detail="Партнёр не найден")
    if data.logo_url is not None:
        p.logo_url = data.logo_url.strip() if data.logo_url else None
    if data.name is not None:
        p.name = data.name.strip()
    if data.link is not None:
        p.link = data.link.strip() if data.link else None
    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.delete("/{partner_id}", status_code=204)
def delete_partner(
    partner_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    """Удалить партнёра (только админ)."""
    p = db.scalar(select(Partner).where(Partner.id == partner_id))
    if not p:
        raise HTTPException(status_code=404, detail="Партнёр не найден")
    db.delete(p)
    db.commit()
