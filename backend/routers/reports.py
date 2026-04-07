"""Reports API."""
import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Report, Pet, User
from schemas import ReportCreate, ReportUpdate, ReportResponse
from auth import get_current_user_required, require_admin
from time_utils import utc_now
from rate_limit import limiter

router = APIRouter(prefix="/reports", tags=["reports"])


def report_to_response(r: Report) -> ReportResponse:
    return ReportResponse(
        id=r.id,
        pet_id=r.pet_id,
        reporter_id=r.reporter_id,
        reporter_name=r.reporter_name,
        reason=r.reason,
        description=r.description,
        created_at=r.created_at,
        status=r.status,
        reviewed_by=r.reviewed_by,
        reviewed_at=r.reviewed_at,
        resolution=r.resolution,
    )


@router.get("", response_model=list[ReportResponse])
def list_reports(
    status: str | None = Query(None),
    reason: str | None = Query(None),
    limit: int | None = Query(None, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(Report)
    if status:
        stmt = stmt.where(Report.status == status)
    if reason:
        stmt = stmt.where(Report.reason == reason)
    stmt = stmt.order_by(Report.created_at.desc())
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    reports = db.scalars(stmt).all()
    return [report_to_response(r) for r in reports]


@router.post("", response_model=ReportResponse, status_code=201)
@limiter.limit("40/minute")
def create_report(
    request: Request,
    data: ReportCreate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.scalar(select(Pet).where(Pet.id == data.pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    report_id = "report-" + str(uuid.uuid4())[:8]
    report = Report(
        id=report_id,
        pet_id=data.pet_id,
        reporter_id=user.id,
        reporter_name=user.name,
        reason=data.reason,
        description=data.description,
        status="pending",
    )
    try:
        db.add(report)
        db.commit()
        db.refresh(report)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при создании жалобы: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось отправить жалобу. Попробуйте позже.",
        ) from e
    return report_to_response(report)


@router.patch("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: str,
    data: ReportUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    report = db.scalar(select(Report).where(Report.id == report_id))
    if not report:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    if data.status:
        report.status = data.status
        report.reviewed_at = utc_now()
        report.reviewed_by = admin.id
    if data.resolution:
        report.resolution = data.resolution
    try:
        db.commit()
        db.refresh(report)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при обновлении жалобы %s: %s", report_id, e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось обновить жалобу. Попробуйте позже.",
        ) from e
    return report_to_response(report)


@router.delete("/{report_id}", status_code=204)
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    report = db.scalar(select(Report).where(Report.id == report_id))
    if not report:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при удалении жалобы %s: %s", report_id, e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось удалить жалобу. Попробуйте позже.",
        ) from e
    return None
