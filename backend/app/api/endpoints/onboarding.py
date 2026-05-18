"""Onboarding: 4-step user setup.

Step 1: Monthly salary
Step 2: Fixed expenses (rent, bills, subscriptions)
Step 3: Financial goals (vacation, car, emergency fund)
Step 4: Risk profile assessment (saver / moderate / spender)
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.endpoints.auth import get_current_user
from app.db.database import get_db
from app.db.models import FixedExpense, Goal, User

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class FixedExpenseInput(BaseModel):
    name: str
    amount: float
    category: str = "other"  # housing, utilities, subscription, loan, insurance
    due_day: int = 1


class GoalInput(BaseModel):
    title: str
    target_amount: float
    target_date: Optional[date] = None
    category: str = "other"  # vacation, car, home, emergency, education, other
    priority: int = 1


class OnboardingPayload(BaseModel):
    monthly_salary: float
    fixed_expenses: list[FixedExpenseInput] = []
    goals: list[GoalInput] = []
    risk_profile: str = "moderate"  # saver, moderate, spender


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/complete")
def complete_onboarding(
    data: OnboardingPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Complete all 4 onboarding steps in one call."""
    if user.onboarding_completed:
        raise HTTPException(status_code=400, detail="Onboarding zaten tamamlanmis")

    if data.monthly_salary <= 0:
        raise HTTPException(status_code=400, detail="Aylik gelir 0'dan buyuk olmalidir")

    if data.risk_profile not in ("saver", "moderate", "spender"):
        raise HTTPException(
            status_code=400,
            detail="Risk profili: saver, moderate veya spender olmalidir",
        )

    # Step 1: Salary
    user.monthly_salary = data.monthly_salary
    user.risk_profile = data.risk_profile

    # Step 2: Fixed expenses
    for exp in data.fixed_expenses:
        db.add(
            FixedExpense(
                user_id=user.id,
                name=exp.name,
                amount=exp.amount,
                category=exp.category,
                due_day=exp.due_day,
            )
        )

    # Step 3: Goals
    for goal in data.goals:
        db.add(
            Goal(
                user_id=user.id,
                title=goal.title,
                target_amount=goal.target_amount,
                target_date=goal.target_date,
                category=goal.category,
                priority=goal.priority,
            )
        )

    # Step 4: Mark complete
    user.onboarding_completed = True
    db.commit()

    return {
        "success": True,
        "message": "Finansal profiliniz olusturuldu",
        "summary": {
            "monthly_salary": user.monthly_salary,
            "fixed_expenses_count": len(data.fixed_expenses),
            "fixed_expenses_total": sum(e.amount for e in data.fixed_expenses),
            "goals_count": len(data.goals),
            "risk_profile": user.risk_profile,
            "disposable_income": user.monthly_salary
            - sum(e.amount for e in data.fixed_expenses),
        },
    }


@router.get("/status")
def onboarding_status(user: User = Depends(get_current_user)):
    """Check if user has completed onboarding."""
    return {
        "onboarding_completed": user.onboarding_completed,
        "monthly_salary": user.monthly_salary,
        "risk_profile": user.risk_profile,
    }
