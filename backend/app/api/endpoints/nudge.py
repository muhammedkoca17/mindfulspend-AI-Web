"""POST /nudge — Gemini Agent generates a behavioral nudge.

The frontend typically calls /analyze first, then passes the resulting
risk_probability and rfm_segment here. We also accept a transaction_id
so we can persist the nudge_log row tied to the original transaction.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.endpoints.auth import get_current_user
from app.core.config import settings
from app.core.gemini_agent import chat_with_gemini, generate_nudge
from app.db.database import get_db
from app.db.models import NudgeLog, Transaction, User
from app.schemas.transaction import NudgeRequest, NudgeResponse


class ChatRequest(BaseModel):
    message: str

router = APIRouter(prefix="/nudge", tags=["nudge"])


@router.post("", response_model=NudgeResponse)
def create_nudge(payload: NudgeRequest, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    tx: Transaction | None = None
    if payload.transaction_id is not None:
        tx = db.get(Transaction, payload.transaction_id)
        if tx and tx.user_id != payload.user_id:
            raise HTTPException(403, "Transaction does not belong to this user")

    context: dict = {
        "user_full_name": user.full_name,
        "monthly_income": user.monthly_income,
        "budget_goal": user.budget_goal,
        "financial_scenario": user.financial_scenario,
    }
    if tx:
        context.update({
            "merchant": tx.merchant,
            "category": tx.category,
            "amount": tx.amount,
            "currency": tx.currency,
        })
    if payload.context_overrides:
        context.update(payload.context_overrides)

    strategy, nudge_text, latency_ms, is_mock = generate_nudge(
        rfm_segment=payload.rfm_segment,
        risk_probability=payload.risk_probability,
        context=context,
    )

    log_row = NudgeLog(
        user_id=payload.user_id,
        transaction_id=payload.transaction_id,
        strategy=strategy,
        nudge_text=nudge_text,
        model="mock" if is_mock else settings.gemini_model,
        latency_ms=latency_ms,
    )
    db.add(log_row)
    db.commit()

    return NudgeResponse(
        strategy=strategy,
        nudge_text=nudge_text,
        model="mock" if is_mock else settings.gemini_model,
        latency_ms=latency_ms,
        is_mock=is_mock,
    )


@router.get("/history/{user_id}")
def nudge_history(user_id: int, limit: int = 20, db: Session = Depends(get_db)):
    if not db.get(User, user_id):
        raise HTTPException(404, "User not found")
    rows = (
        db.query(NudgeLog)
        .filter(NudgeLog.user_id == user_id)
        .order_by(NudgeLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "strategy": r.strategy,
            "nudge_text": r.nudge_text,
            "model": r.model,
            "latency_ms": r.latency_ms,
            "transaction_id": r.transaction_id,
        }
        for r in rows
    ]


@router.post("/cart-nudge")
def cart_nudge(
    cart_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Generate Gemini Function Calling nudge for cart checkout.
    Called after /cart/checkout returns needs_nudge=True.
    GeminiAgent reads real user data via 4 tools before generating message.
    """
    from datetime import date

    from sqlalchemy import func

    from app.core.gemini_agent import GeminiAgent
    from app.db.models import Cart, FixedExpense, Goal
    from app.services.categories import DISCRETIONARY_CATEGORIES

    cart = db.query(Cart).filter(
        Cart.id == cart_id,
        Cart.user_id == user.id,
    ).first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Build context
    total = essential = discretionary = 0
    disc_items = []

    for item in cart.items:
        is_disc = (
            item.product.category in DISCRETIONARY_CATEGORIES
            or not item.product.is_essential
        )
        total += item.total_price
        if is_disc:
            discretionary += item.total_price
            disc_items.append({
                "name": item.product.name,
                "price": round(item.total_price, 2),
            })
        else:
            essential += item.total_price

    # Goal impact
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    fixed_total = (
        db.query(func.sum(FixedExpense.amount))
        .filter(FixedExpense.user_id == user.id)
        .scalar() or 0
    )

    goal_impact = None
    if goals:
        g = goals[0]
        remaining = g.target_amount - g.current_amount
        days_left = (g.target_date - date.today()).days if g.target_date else 90
        daily_need = remaining / max(days_left, 1)
        goal_impact = {
            "goal_title": g.title,
            "days_delayed": round(discretionary / daily_need, 1) if daily_need > 0 else 0,
        }

    context = {
        "user_id": user.id,
        "cart_id": cart_id,
        "discretionary_amount": round(discretionary, 2),
        "discretionary_items": disc_items,
        "goal_impact": goal_impact,
        "budget_context": {
            "monthly_salary": user.monthly_salary,
            "fixed_expenses": round(fixed_total, 2),
            "disposable_income": round(user.monthly_salary - fixed_total, 2),
        },
    }

    agent = GeminiAgent()
    nudge_message = agent.generate_nudge(context, db=db)

    # Save nudge message to cart
    cart.nudge_message = nudge_message
    db.commit()

    return {
        "nudge_message": nudge_message,
        "discretionary_amount": round(discretionary, 2),
        "discretionary_items": disc_items,
        "goal_impact": goal_impact,
        "needs_nudge": discretionary > 0,
    }


@router.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Free-form chat with Gemini AI using Function Calling.

    The agent can query user budget, goals, and transactions
    to provide personalized financial advice.
    """
    try:
        reply = await chat_with_gemini(request.message, db, user.id)
        return {"reply": reply, "user_id": user.id}
    except Exception:
        return {"reply": "Bir hata olustu, lutfen tekrar dene.", "user_id": user.id}
