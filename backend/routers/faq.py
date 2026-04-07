"""FAQ на лендинге — публичное чтение, CRUD для админа."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import FaqItem
from schemas import FaqItemCreate, FaqItemUpdate, FaqItemResponse
from auth import require_admin

router = APIRouter(prefix="/faq", tags=["faq"])


def _to_response(row: FaqItem) -> FaqItemResponse:
    return FaqItemResponse(
        id=row.id,
        question_ru=row.question_ru or "",
        question_be=row.question_be or "",
        question_en=row.question_en or "",
        answer_ru=row.answer_ru or "",
        answer_be=row.answer_be or "",
        answer_en=row.answer_en or "",
        sort_order=row.sort_order or 0,
    )


@router.get("", response_model=list[FaqItemResponse])
def list_faq(db: Session = Depends(get_db)):
    """Публичный список вопросов для лендинга (по порядку)."""
    rows = db.scalars(
        select(FaqItem).order_by(FaqItem.sort_order.asc(), FaqItem.id.asc())
    ).all()
    return [_to_response(r) for r in rows]


@router.post("", response_model=FaqItemResponse)
def create_faq_item(
    data: FaqItemCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    row = FaqItem(
        id=str(uuid.uuid4()),
        question_ru=(data.question_ru or "").strip(),
        question_be=(data.question_be or "").strip(),
        question_en=(data.question_en or "").strip(),
        answer_ru=(data.answer_ru or "").strip(),
        answer_be=(data.answer_be or "").strip(),
        answer_en=(data.answer_en or "").strip(),
        sort_order=data.sort_order,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.patch("/{item_id}", response_model=FaqItemResponse)
def update_faq_item(
    item_id: str,
    data: FaqItemUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    row = db.scalar(select(FaqItem).where(FaqItem.id == item_id))
    if not row:
        raise HTTPException(status_code=404, detail="FAQ не найден")
    if data.question_ru is not None:
        row.question_ru = data.question_ru.strip()
    if data.question_be is not None:
        row.question_be = data.question_be.strip()
    if data.question_en is not None:
        row.question_en = data.question_en.strip()
    if data.answer_ru is not None:
        row.answer_ru = data.answer_ru.strip()
    if data.answer_be is not None:
        row.answer_be = data.answer_be.strip()
    if data.answer_en is not None:
        row.answer_en = data.answer_en.strip()
    if data.sort_order is not None:
        row.sort_order = data.sort_order
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.delete("/{item_id}", status_code=204)
def delete_faq_item(
    item_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    row = db.scalar(select(FaqItem).where(FaqItem.id == item_id))
    if not row:
        raise HTTPException(status_code=404, detail="FAQ не найден")
    db.delete(row)
    db.commit()
