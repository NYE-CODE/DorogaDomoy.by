"""Reports API."""
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Report, Pet, User
from schemas import ReportCreate, ReportUpdate, ReportResponse
from auth import get_current_user_required, require_admin

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
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(Report)
    if status:
        q = q.filter(Report.status == status)
    if reason:
        q = q.filter(Report.reason == reason)
    reports = q.order_by(Report.created_at.desc()).all()
    return [report_to_response(r) for r in reports]


@router.post("", response_model=ReportResponse, status_code=201)
def create_report(
    data: ReportCreate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == data.pet_id).first()
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
    db.add(report)
    db.commit()
    db.refresh(report)
    return report_to_response(report)


@router.patch("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: str,
    data: ReportUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    if data.status:
        report.status = data.status
        report.reviewed_at = datetime.utcnow()
        report.reviewed_by = "admin"
    if data.resolution:
        report.resolution = data.resolution
    db.commit()
    db.refresh(report)
    return report_to_response(report)


@router.delete("/{report_id}", status_code=204)
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    db.delete(report)
    db.commit()
    return None
