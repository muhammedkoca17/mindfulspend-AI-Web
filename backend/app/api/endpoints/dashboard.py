"""Dashboard analytics endpoints — spending breakdown, nudge success, goals, time risk."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone, date
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.endpoints.auth import get_current_user
from app.db.database import get_db
from app.db.models import Goal, Transaction, User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/spending-breakdown")
def spending_breakdown(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Last 30 days: essential vs discretionary totals."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    rows = (
        db.query(Transaction.spending_type, Transaction.amount)
        .filter(Transaction.user_id == user.id, Transaction.occurred_at >= cutoff)
        .all()
    )

    essential = sum(r.amount for r in rows if r.spending_type == "essential")
    discretionary = sum(r.amount for r in rows if r.spending_type == "discretionary")
    total = essential + discretionary

    return {
        "essential_total": round(essential, 2),
        "discretionary_total": round(discretionary, 2),
        "essential_pct": round(essential / total * 100, 1) if total > 0 else 0,
        "discretionary_pct": round(discretionary / total * 100, 1) if total > 0 else 0,
        "period_days": 30,
    }


@router.get("/nudge-success")
def nudge_success(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Weekly savings from accepted nudges on discretionary items."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    rows = (
        db.query(Transaction.occurred_at, Transaction.amount)
        .filter(
            Transaction.user_id == user.id,
            Transaction.occurred_at >= cutoff,
            Transaction.spending_type == "discretionary",
            Transaction.is_impulsive == 1,
        )
        .all()
    )

    weekly: dict[str, float] = defaultdict(float)
    for r in rows:
        if r.occurred_at:
            week = r.occurred_at.strftime("%G-W%V")
            weekly[week] += r.amount

    return [
        {"week": w, "saved_amount": round(amt, 2)}
        for w, amt in sorted(weekly.items())
    ]


@router.get("/goal-progress")
def goal_progress(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Progress on all user goals."""
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    result = []
    today = date.today()

    for g in goals:
        pct = round(g.current_amount / g.target_amount * 100, 1) if g.target_amount > 0 else 0
        days_left = (g.target_date - today).days if g.target_date else None
        result.append({
            "title": g.title,
            "target": g.target_amount,
            "current": g.current_amount,
            "pct": pct,
            "days_left": days_left,
            "category": g.category,
            "priority": g.priority,
        })

    return result


@router.get("/time-risk")
def time_risk(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Impulsive spending risk by hour of day."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    rows = (
        db.query(Transaction.occurred_at, Transaction.risk_probability)
        .filter(Transaction.user_id == user.id, Transaction.occurred_at >= cutoff)
        .all()
    )

    hourly: dict[int, list] = defaultdict(list)
    for r in rows:
        if r.occurred_at:
            h = r.occurred_at.hour
            hourly[h].append(r.risk_probability or 0.0)

    return [
        {
            "hour": h,
            "tx_count": len(risks),
            "avg_risk": round(sum(risks) / len(risks), 4) if risks else 0,
        }
        for h in range(24)
        for risks in [hourly.get(h, [])]
    ]

from app.db.models import FixedExpense

@router.get("/fixed-expenses")
def fixed_expenses(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """User's fixed expenses (invoices & subscriptions)."""
    expenses = db.query(FixedExpense).filter(FixedExpense.user_id == user.id).all()
    
    return [
        {
            "id": e.id,
            "name": e.name,
            "amount": e.amount,
            "category": e.category,
            "due_day": e.due_day
        }
        for e in expenses
    ]


from pydantic import BaseModel
from typing import Optional

class FixedExpenseCreate(BaseModel):
    name: str
    amount: float
    category: str = "Diğer"
    due_day: int = 1

class FixedExpenseUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    due_day: Optional[int] = None

@router.post("/fixed-expenses")
def create_fixed_expense(
    payload: FixedExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new fixed expense."""
    expense = FixedExpense(
        user_id=user.id,
        name=payload.name,
        amount=payload.amount,
        category=payload.category,
        due_day=payload.due_day,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"id": expense.id, "name": expense.name, "amount": expense.amount, "category": expense.category, "due_day": expense.due_day}


@router.patch("/fixed-expenses/{expense_id}")
def update_fixed_expense(
    expense_id: int,
    payload: FixedExpenseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update a fixed expense (price, due_day, name, category)."""
    expense = db.query(FixedExpense).filter(FixedExpense.id == expense_id, FixedExpense.user_id == user.id).first()
    if not expense:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Gider bulunamadı")
    
    if payload.name is not None:
        expense.name = payload.name
    if payload.amount is not None:
        expense.amount = payload.amount
    if payload.category is not None:
        expense.category = payload.category
    if payload.due_day is not None:
        expense.due_day = payload.due_day
    
    db.commit()
    db.refresh(expense)
    return {"id": expense.id, "name": expense.name, "amount": expense.amount, "category": expense.category, "due_day": expense.due_day}


@router.delete("/fixed-expenses/{expense_id}")
def delete_fixed_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete (cancel) a fixed expense."""
    expense = db.query(FixedExpense).filter(FixedExpense.id == expense_id, FixedExpense.user_id == user.id).first()
    if not expense:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Gider bulunamadı")
    
    db.delete(expense)
    db.commit()
    return {"detail": "Gider silindi"}

