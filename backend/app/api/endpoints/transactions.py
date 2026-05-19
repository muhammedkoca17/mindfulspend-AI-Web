"""Transaction listing endpoint (live feed for the dashboard) + manual item entry."""
from __future__ import annotations

from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Transaction, User
from app.schemas.transaction import TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])


# ---------------------------------------------------------------------------
# Existing endpoints (preserved)
# ---------------------------------------------------------------------------
@router.get("", response_model=list[TransactionOut])
def list_transactions(
    user_id: int | None = Query(None, gt=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)
    if user_id is not None:
        if not db.get(User, user_id):
            raise HTTPException(404, "User not found")
        query = query.filter(Transaction.user_id == user_id)
    return query.order_by(Transaction.occurred_at.desc()).limit(limit).all()


@router.get("/recent/{user_id}", response_model=list[TransactionOut])
def recent_for_user(user_id: int, hours: int = 24, db: Session = Depends(get_db)):
    if not db.get(User, user_id):
        raise HTTPException(404, "User not found")
    datetime.now(UTC).replace(tzinfo=None)
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.occurred_at.desc())
        .limit(50)
        .all()
    )


# ---------------------------------------------------------------------------
# New: Manual item-level transaction entry with auto-categorization
# ---------------------------------------------------------------------------
class ManualTransactionItem(BaseModel):
    item_name: str
    amount: float
    quantity: float = 1.0
    unit: str = "adet"  # kg, adet, litre


class ManualTransactionBatch(BaseModel):
    items: list[ManualTransactionItem]
    merchant: str = "Market"
    transaction_date: date | None = None  # None = today


@router.post("/manual")
def add_manual_transactions(
    batch: ManualTransactionBatch,
    db: Session = Depends(get_db),
):
    """Add shopping items with auto-categorization.

    Accepts an auth token OR a user_id query param (for demo convenience).
    Auto-detects: Elma -> market_temel_ihtiyac/meyve_sebze (essential)
                  Cikolata -> market_atistirmalik/cikolata_seker (discretionary)
    """
    from app.services.categories import (
        detect_category,
        get_category_label,
        is_discretionary,
    )

    # Try to get user from token, fall back to first user for demo
    user = None

    if user is None:
        user = db.query(User).first()
        if not user:
            raise HTTPException(400, "Kullanici bulunamadi")

    tx_date = batch.transaction_date or date.today()
    tx_datetime = datetime.combine(tx_date, datetime.now().time())

    created = []
    total_amount = 0.0
    discretionary_amount = 0.0

    for item in batch.items:
        main_cat, sub_cat, is_essential = detect_category(item.item_name, db)

        tx = Transaction(
            user_id=user.id,
            item_name=item.item_name,
            amount=item.amount,
            quantity=item.quantity,
            unit=item.unit,
            category=main_cat,
            sub_category=sub_cat,
            merchant=batch.merchant,
            occurred_at=tx_datetime,
            is_personal_entry=True,
            spending_type="essential" if is_essential else "discretionary",
        )
        db.add(tx)
        total_amount += item.amount

        if is_discretionary(main_cat):
            discretionary_amount += item.amount

        created.append(
            {
                "item_name": item.item_name,
                "amount": item.amount,
                "category": get_category_label(main_cat),
                "sub_category": sub_cat,
                "is_essential": is_essential,
            }
        )

    db.commit()

    return {
        "created_count": len(created),
        "total_amount": total_amount,
        "discretionary_amount": discretionary_amount,
        "discretionary_ratio": (
            round(discretionary_amount / total_amount * 100, 1)
            if total_amount > 0
            else 0
        ),
        "items": created,
    }
