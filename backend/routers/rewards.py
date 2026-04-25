"""Rewards and points transactions API."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import PointsTransaction, User
from schemas import PointsTransactionResponse

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("/points-transactions", response_model=list[PointsTransactionResponse])
def list_points_transactions(
    user_id: Optional[str] = Query(None),
    pet_id: Optional[str] = Query(None),
    kind: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(PointsTransaction)
    if user_id:
        stmt = stmt.where(PointsTransaction.user_id == user_id)
    if pet_id:
        stmt = stmt.where(PointsTransaction.pet_id == pet_id)
    if kind:
        stmt = stmt.where(PointsTransaction.kind == kind)
    stmt = stmt.order_by(PointsTransaction.created_at.desc()).offset(offset).limit(limit)
    rows = db.scalars(stmt).all()
    return [PointsTransactionResponse.model_validate(row) for row in rows]
