"""POST /analyze — ML inference pipeline.

Flow:
  1. Persist the incoming transaction.
  2. Build features -> predict_all() returns impulsive + budget_risk + nudge prob.
  3. Compute live RFM for the user.
  4. Return structured analysis payload.
"""
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Transaction, User
from app.schemas.transaction import AnalyzeResponse, TransactionCreate, TransactionOut
from app.services.constants import MCC_MAP
from app.services.ml_predictor import (
    ModelNotTrainedError,
    is_models_ready,
    predict_all,
)
from app.services.rfm import compute_rfm_live

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
def analyze_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    if not is_models_ready():
        raise HTTPException(503, "ML models not trained yet. Run scripts/train_xgboost.py first.")

    spending_type = MCC_MAP.get(payload.mcc_code, (payload.category, "discretionary"))[1]
    occurred_at = payload.occurred_at or datetime.now(UTC).replace(tzinfo=None)

    # ---- 1. User historical stats (lightweight, no heavy DataFrame ops) ----
    past = (
        db.query(Transaction.amount)
        .filter(Transaction.user_id == payload.user_id)
        .order_by(Transaction.occurred_at.desc())
        .limit(100)
        .all()
    )
    amounts = [r.amount for r in past] if past else [payload.amount]
    user_avg = sum(amounts) / len(amounts)
    user_std = max((sum((a - user_avg) ** 2 for a in amounts) / max(len(amounts) - 1, 1)) ** 0.5, 1.0)

    # ---- 2. Live RFM ----
    rfm = compute_rfm_live(payload.user_id, db)

    # ---- 3. Build features and predict ----
    hour = occurred_at.hour if hasattr(occurred_at, 'hour') else 12
    dow = occurred_at.weekday() if hasattr(occurred_at, 'weekday') else 0

    features = {
        "hour": hour,
        "day_of_week": dow,
        "is_weekend": 1 if dow >= 5 else 0,
        "is_night": 1 if hour >= 22 else 0,
        "is_high_value": 1 if payload.amount > user_avg * 1.5 else 0,
        "is_essential": 1 if spending_type == "essential" else 0,
        "deviation_from_avg": (payload.amount - user_avg) / user_std,
        "r_score": rfm.r_score,
        "f_score": rfm.f_score,
        "m_score": rfm.m_score,
        "rfm_score": rfm.rfm_risk,
        "age": getattr(user, 'age', 30) or 30,
        "quantity": 1,
        "price": payload.amount,
        "amount_try": payload.amount,
    }

    try:
        ml_result = predict_all(features)
    except ModelNotTrainedError as exc:
        raise HTTPException(503, str(exc)) from exc

    proba = ml_result["impulsive_score"]
    is_impulsive = ml_result["is_impulsive"]

    # ---- 4. Persist the transaction ----
    tx = Transaction(
        user_id=payload.user_id,
        occurred_at=occurred_at,
        merchant=payload.merchant,
        category=payload.category,
        mcc_code=payload.mcc_code,
        amount=payload.amount,
        currency=payload.currency,
        spending_type=spending_type,
        is_impulsive=int(is_impulsive),
        risk_probability=round(proba, 4),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return AnalyzeResponse(
        transaction=TransactionOut.model_validate(tx),
        is_impulsive=bool(is_impulsive),
        risk_probability=round(proba, 4),
        rfm_segment=rfm.segment,
        rfm_risk=rfm.rfm_risk,
        contributing_factors=[
            {"feature": "is_essential", "contribution": round(features["is_essential"], 4)},
            {"feature": "hour", "contribution": round(features["hour"] / 24, 4)},
            {"feature": "amount_try", "contribution": round(min(features["deviation_from_avg"] / 3, 1), 4)},
        ],
    )
