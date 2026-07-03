"""Защищённые cron-эндпоинты (вызов с сервера по расписанию)."""
import os

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from listing_lifecycle import run_listing_lifecycle

router = APIRouter(prefix="/internal/cron", tags=["internal-cron"])

CRON_SECRET = os.getenv("CRON_SECRET", "")


def _verify_cron_secret(x_cron_secret: str | None = Header(None, alias="X-Cron-Secret")) -> None:
    if not CRON_SECRET or x_cron_secret != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/listing-lifecycle")
def listing_lifecycle_cron(
    _: None = Depends(_verify_cron_secret),
    db: Session = Depends(get_db),
):
    """Напоминания за 3 и 1 день до истечения + автоархивация объявлений."""
    return run_listing_lifecycle(db)
