"""Financial goals management: CRUD operations."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.endpoints.auth import get_current_user
from app.db.database import get_db
from app.db.models import Goal, User

router = APIRouter(prefix="/goals", tags=["Goals"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class GoalCreate(BaseModel):
    title: str
    target_amount: float
    target_date: Optional[date] = None
    category: str = "other"
    priority: int = 1


class GoalUpdate(BaseModel):
    current_amount: Optional[float] = None
    target_amount: Optional[float] = None
    title: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/")
def list_goals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all user's financial goals with progress."""
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    return [
        {
            "id": g.id,
            "title": g.title,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "progress_percent": (
                round(g.current_amount / g.target_amount * 100, 1)
                if g.target_amount > 0
                else 0
            ),
            "target_date": g.target_date.isoformat() if g.target_date else None,
            "category": g.category,
            "priority": g.priority,
        }
        for g in goals
    ]


@router.post("/", status_code=201)
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new financial goal."""
    goal = Goal(user_id=user.id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "message": f"'{goal.title}' hedefi olusturuldu"}


@router.patch("/{goal_id}")
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update goal progress or details."""
    goal = (
        db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Hedef bulunamadi")

    if data.current_amount is not None:
        goal.current_amount = data.current_amount
    if data.target_amount is not None:
        goal.target_amount = data.target_amount
    if data.title is not None:
        goal.title = data.title
    db.commit()
    return {"message": "Hedef guncellendi"}


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a financial goal."""
    goal = (
        db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Hedef bulunamadi")

    db.delete(goal)
    db.commit()
    return {"message": f"'{goal.title}' hedefi silindi"}
