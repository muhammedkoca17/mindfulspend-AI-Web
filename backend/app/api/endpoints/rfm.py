"""RFM scoring endpoint — used by the RFM_Dashboard component."""
from datetime import UTC, datetime

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import RfmScore, Transaction, User
from app.schemas.transaction import RfmSummary
from app.services.rfm import compute_rfm

router = APIRouter(prefix="/rfm", tags=["rfm"])


@router.get("/{user_id}", response_model=RfmSummary)
def get_rfm(user_id: int, persist: bool = True, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    txs = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    df = pd.DataFrame([
        {
            "occurred_at": t.occurred_at,
            "amount": t.amount,
            "spending_type": t.spending_type,
        }
        for t in txs
    ])
    result = compute_rfm(df, reference_date=datetime.now(UTC))

    if persist:
        record = RfmScore(
            user_id=user_id,
            recency_days=result.recency_days,
            frequency=result.frequency,
            monetary=result.monetary,
            r_score=result.r_score,
            f_score=result.f_score,
            m_score=result.m_score,
            rfm_risk=result.rfm_risk,
            segment=result.segment,
        )
        db.add(record)
        db.commit()

    return RfmSummary(
        recency_days=result.recency_days,
        frequency=result.frequency,
        monetary=result.monetary,
        rfm_risk=result.rfm_risk,
        segment=result.segment,
    )


@router.get("/{user_id}/history")
def rfm_history(user_id: int, db: Session = Depends(get_db)):
    """Return all historical RFM snapshots for a user, ordered by time.
    
    Used by the frontend to plot RFM progression charts showing how
    the user's financial behavior changed over weeks/months.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    records = (
        db.query(RfmScore)
        .filter(RfmScore.user_id == user_id)
        .order_by(RfmScore.computed_at.asc())
        .all()
    )

    return {
        "user_id": user_id,
        "count": len(records),
        "history": [
            {
                "computed_at": r.computed_at.isoformat() if r.computed_at else None,
                "recency_days": r.recency_days,
                "frequency": r.frequency,
                "monetary": r.monetary,
                "r_score": r.r_score,
                "f_score": r.f_score,
                "m_score": r.m_score,
                "rfm_risk": r.rfm_risk,
                "segment": r.segment,
            }
            for r in records
        ],
    }


@router.get("/segments/distribution")
def segment_distribution(db: Session = Depends(get_db)):
    """Aggregate segment breakdown for the dashboard heatmap."""
    counts = {"Sadık Tasarrufçu": 0, "Risk Potansiyeli": 0, "İmpulsif / Kırılgan": 0}
    latest_per_user = {}
    for r in db.query(RfmScore).order_by(RfmScore.computed_at.desc()).all():
        if r.user_id not in latest_per_user:
            latest_per_user[r.user_id] = r.segment
    for seg in latest_per_user.values():
        if seg in counts:
            counts[seg] += 1
    total = sum(counts.values()) or 1
    return {
        "total_users": total,
        "segments": [
            {"segment": k, "count": v, "ratio": round(v / total, 3)} for k, v in counts.items()
        ],
    }
