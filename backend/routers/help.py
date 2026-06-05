"""Секция «Как нам помочь» на лендинге — публичная конфигурация и CRUD для админа."""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import HelpDonationTier, PlatformSettings
from platform_settings import get_setting_value
from schemas import (
    HelpDonationTierCreate,
    HelpDonationTierResponse,
    HelpDonationTierUpdate,
    HelpLandingResponse,
    HelpVolunteerUrlUpdate,
)
from ttl_cache import invalidate_settings_cache
from url_safety import sanitize_external_url_for_public

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/help", tags=["help"])

def _tier_response(row: HelpDonationTier) -> HelpDonationTierResponse:
    return HelpDonationTierResponse(
        id=row.id,
        label=row.label,
        payment_url=row.payment_url,
        sort_order=row.sort_order or 0,
    )


@router.get("", response_model=HelpLandingResponse)
def get_help_landing(db: Session = Depends(get_db)):
    raw_volunteer = get_setting_value(db, "help_volunteer_url", "")
    volunteer_url = sanitize_external_url_for_public(raw_volunteer, allow_empty=True)
    if raw_volunteer.strip() and not volunteer_url:
        logger.warning("help: отброшена недопустимая volunteer_url из БД")

    safe_tiers: list[HelpDonationTierResponse] = []
    rows = db.scalars(
        select(HelpDonationTier).order_by(
            HelpDonationTier.sort_order.asc(),
            HelpDonationTier.id.asc(),
        )
    ).all()
    for row in rows:
        safe_payment = sanitize_external_url_for_public(row.payment_url)
        if not safe_payment:
            logger.warning(
                "help: отброшен tier id=%s с недопустимой payment_url",
                row.id,
            )
            continue
        safe_tiers.append(
            HelpDonationTierResponse(
                id=row.id,
                label=row.label,
                payment_url=safe_payment,
                sort_order=row.sort_order or 0,
            )
        )

    return HelpLandingResponse(
        volunteer_url=volunteer_url,
        donation_tiers=safe_tiers,
    )

@router.patch("/volunteer-url")
def update_volunteer_url(
    data: HelpVolunteerUrlUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    row = db.scalar(select(PlatformSettings).where(PlatformSettings.key == "help_volunteer_url"))
    if row:
        row.value = data.volunteer_url
    else:
        db.add(PlatformSettings(key="help_volunteer_url", value=data.volunteer_url))
    db.commit()
    invalidate_settings_cache()
    return {"volunteer_url": data.volunteer_url}


@router.post("/donation-tiers", response_model=HelpDonationTierResponse, status_code=201)
def create_donation_tier(
    data: HelpDonationTierCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    row = HelpDonationTier(
        id=str(uuid.uuid4()),
        label=data.label.strip(),
        payment_url=data.payment_url.strip(),
        sort_order=data.sort_order,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _tier_response(row)


@router.patch("/donation-tiers/{tier_id}", response_model=HelpDonationTierResponse)
def update_donation_tier(
    tier_id: str,
    data: HelpDonationTierUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    row = db.scalar(select(HelpDonationTier).where(HelpDonationTier.id == tier_id))
    if not row:
        raise HTTPException(status_code=404, detail="Вариант поддержки не найден")
    if data.label is not None:
        row.label = data.label.strip()
    if data.payment_url is not None:
        row.payment_url = data.payment_url.strip()
    if data.sort_order is not None:
        row.sort_order = data.sort_order
    db.commit()
    db.refresh(row)
    return _tier_response(row)


@router.delete("/donation-tiers/{tier_id}", status_code=204)
def delete_donation_tier(
    tier_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    row = db.scalar(select(HelpDonationTier).where(HelpDonationTier.id == tier_id))
    if not row:
        raise HTTPException(status_code=404, detail="Вариант поддержки не найден")
    db.delete(row)
    db.commit()
    return None
