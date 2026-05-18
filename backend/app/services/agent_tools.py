"""Tool functions that Gemini Agent can call to retrieve user financial data.

These are the "eyes and hands" of the agent — it uses these to make informed
decisions based on real user data, not generic advice.

Each function returns a structured dict that gets injected into Gemini's context.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import FixedExpense, Goal, Transaction, User
from app.services.categories import get_category_label, is_discretionary


def get_user_financial_state(db: Session, user_id: int) -> dict:
    """Get user's current financial snapshot.

    Agent uses this to understand: budget capacity, risk profile, spending pressure.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "Kullanici bulunamadi"}

    # Monthly fixed expenses total
    fixed_total = (
        db.query(func.sum(FixedExpense.amount))
        .filter(FixedExpense.user_id == user_id, FixedExpense.is_active.is_(True))
        .scalar()
        or 0.0
    )

    # This month's spending
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_spending = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.occurred_at >= month_start,
        )
        .scalar()
        or 0.0
    )

    disposable = user.monthly_salary - fixed_total
    remaining = disposable - month_spending

    # Days left in month
    if now.month == 12:
        next_month_start = now.replace(year=now.year + 1, month=1, day=1)
    else:
        next_month_start = now.replace(month=now.month + 1, day=1)
    days_left = (next_month_start - now).days

    return {
        "user_name": user.full_name,
        "monthly_salary": user.monthly_salary,
        "fixed_expenses_total": round(fixed_total, 2),
        "disposable_income": round(disposable, 2),
        "month_spending_so_far": round(month_spending, 2),
        "remaining_budget": round(remaining, 2),
        "budget_usage_percent": (
            round(month_spending / disposable * 100, 1) if disposable > 0 else 0
        ),
        "risk_profile": user.risk_profile,
        "days_left_in_month": days_left,
    }


def get_recent_transactions(db: Session, user_id: int, days: int = 30) -> dict:
    """Get user's recent transactions grouped by category.

    Agent uses this to spot patterns: frequent discretionary spending, unusual amounts.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.occurred_at >= cutoff)
        .order_by(Transaction.occurred_at.desc())
        .limit(50)
        .all()
    )

    # Group by category
    by_category: dict[str, dict] = {}
    total = 0.0
    discretionary_total = 0.0

    for tx in transactions:
        cat = tx.category or "diger"
        label = get_category_label(cat)
        if label not in by_category:
            by_category[label] = {
                "amount": 0.0,
                "count": 0,
                "is_discretionary": is_discretionary(cat),
            }
        by_category[label]["amount"] += tx.amount
        by_category[label]["count"] += 1
        total += tx.amount
        if is_discretionary(cat):
            discretionary_total += tx.amount

    return {
        "period_days": days,
        "total_transactions": len(transactions),
        "total_amount": round(total, 2),
        "discretionary_amount": round(discretionary_total, 2),
        "discretionary_percent": (
            round(discretionary_total / total * 100, 1) if total > 0 else 0
        ),
        "by_category": {
            k: {
                "amount": round(v["amount"], 2),
                "count": v["count"],
                "is_discretionary": v["is_discretionary"],
            }
            for k, v in sorted(
                by_category.items(), key=lambda x: x[1]["amount"], reverse=True
            )
        },
        "recent_items": [
            {
                "item": tx.item_name or tx.merchant or tx.category,
                "amount": tx.amount,
                "date": (
                    tx.occurred_at.strftime("%d.%m.%Y")
                    if tx.occurred_at
                    else None
                ),
                "category": get_category_label(tx.category or "diger"),
            }
            for tx in transactions[:10]
        ],
    }


def get_user_goals(db: Session, user_id: int) -> dict:
    """Get user's financial goals with progress.

    Agent uses this for motivational nudges: "X more TL to reach your vacation goal!"
    """
    goals = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.priority).all()

    return {
        "goals_count": len(goals),
        "goals": [
            {
                "title": g.title,
                "target": g.target_amount,
                "current": g.current_amount,
                "remaining": round(g.target_amount - g.current_amount, 2),
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
        ],
    }


def get_spending_by_category(db: Session, user_id: int, days: int = 30) -> dict:
    """Detailed category breakdown for budget analysis.

    Agent uses this to identify: overspending categories, saving opportunities.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)

    results = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .filter(Transaction.user_id == user_id, Transaction.occurred_at >= cutoff)
        .group_by(Transaction.category)
        .all()
    )

    categories = []
    for r in results:
        cat = r.category or "diger"
        categories.append(
            {
                "category": get_category_label(cat),
                "category_key": cat,
                "total": round(float(r.total), 2),
                "count": r.count,
                "is_discretionary": is_discretionary(cat),
            }
        )

    categories.sort(key=lambda x: x["total"], reverse=True)
    return {"period_days": days, "categories": categories}


def get_fixed_expenses(db: Session, user_id: int) -> dict:
    """Get user's recurring fixed expenses."""
    expenses = (
        db.query(FixedExpense)
        .filter(FixedExpense.user_id == user_id, FixedExpense.is_active.is_(True))
        .all()
    )

    return {
        "total": round(sum(e.amount for e in expenses), 2),
        "count": len(expenses),
        "expenses": [
            {
                "name": e.name,
                "amount": e.amount,
                "category": e.category,
                "due_day": e.due_day,
            }
            for e in expenses
        ],
    }


def build_full_context(db: Session, user_id: int) -> dict:
    """Build the complete agent context from all data sources.

    This is the single entry point for gathering all user data for the agent.
    """
    financial_state = get_user_financial_state(db, user_id)
    recent_tx = get_recent_transactions(db, user_id, days=30)
    goals = get_user_goals(db, user_id)
    spending = get_spending_by_category(db, user_id, days=30)
    fixed = get_fixed_expenses(db, user_id)

    return {
        **financial_state,
        "discretionary_percent": recent_tx.get("discretionary_percent", 0),
        "discretionary_amount": recent_tx.get("discretionary_amount", 0),
        "by_category": recent_tx.get("by_category", {}),
        "recent_items": recent_tx.get("recent_items", []),
        "goals": goals.get("goals", []),
        "spending_categories": spending.get("categories", []),
        "fixed_expenses": fixed.get("expenses", []),
    }
