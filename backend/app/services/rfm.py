"""RFM scoring — supports both DataFrame-based (training) and live DB (inference).

Final RFM_Risk in [1.0, 5.0]:
   1-2   -> Sadik Tasarrufcu
   2-3.5 -> Risk Potansiyeli
   3.5-5 -> Impulsif / Kirilgan
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.services.constants import RFM_WEIGHTS, segment_for_score


@dataclass(frozen=True)
class RfmResult:
    recency_days: float
    frequency: int
    monetary: float
    r_score: int
    f_score: int
    m_score: int
    rfm_risk: float
    segment: str


def _quintile_score(value: float, breakpoints: list[float], reverse: bool = False) -> int:
    rank = 1
    for bp in breakpoints:
        if value > bp:
            rank += 1
    rank = min(rank, 5)
    return 6 - rank if reverse else rank


R_BREAKS = [3, 7, 14, 21]
F_BREAKS = [2, 5, 10, 18]
M_BREAKS = [500, 1500, 3000, 6000]


def compute_rfm(
    transactions: pd.DataFrame,
    *,
    reference_date: datetime | None = None,
    window_days: int = 30,
) -> RfmResult:
    """Compute RFM_Risk from a DataFrame (training/batch mode)."""
    if reference_date is None:
        reference_date = datetime.now(timezone.utc)

    df = transactions.copy()
    if df.empty:
        return RfmResult(
            recency_days=float(window_days), frequency=0, monetary=0.0,
            r_score=1, f_score=1, m_score=1, rfm_risk=1.0,
            segment=segment_for_score(1.0),
        )

    df["occurred_at"] = pd.to_datetime(df["occurred_at"], utc=True, errors="coerce")
    discretionary = df[df["spending_type"] == "discretionary"]

    window_start = reference_date - timedelta(days=window_days)
    in_window = discretionary[discretionary["occurred_at"] >= window_start]

    if discretionary.empty:
        recency = float(window_days)
    else:
        last_ts = discretionary["occurred_at"].max()
        recency = float((reference_date - last_ts).total_seconds() / 86_400)

    frequency = int(len(in_window))
    monetary = float(in_window["amount"].sum()) if not in_window.empty else 0.0

    r_score = _quintile_score(recency, R_BREAKS, reverse=True)
    f_score = _quintile_score(frequency, F_BREAKS)
    m_score = _quintile_score(monetary, M_BREAKS)

    rfm_risk = RFM_WEIGHTS["R"] * r_score + RFM_WEIGHTS["F"] * f_score + RFM_WEIGHTS["M"] * m_score
    rfm_risk = float(np.clip(rfm_risk, 1.0, 5.0))

    return RfmResult(
        recency_days=round(recency, 2), frequency=frequency,
        monetary=round(monetary, 2), r_score=r_score, f_score=f_score,
        m_score=m_score, rfm_risk=round(rfm_risk, 3),
        segment=segment_for_score(rfm_risk),
    )


def compute_rfm_live(user_id: int, db: Session, window_days: int = 90) -> RfmResult:
    """Compute RFM from LIVE database transactions for a single user."""
    from app.db.models import Transaction

    cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)

    rows = (
        db.query(Transaction.occurred_at, Transaction.amount, Transaction.spending_type)
        .filter(Transaction.user_id == user_id, Transaction.occurred_at >= cutoff)
        .all()
    )

    if not rows:
        return RfmResult(
            recency_days=float(window_days), frequency=0, monetary=0.0,
            r_score=1, f_score=1, m_score=1, rfm_risk=1.0,
            segment=segment_for_score(1.0),
        )

    now = datetime.now(timezone.utc)

    # Filter discretionary
    disc_rows = [r for r in rows if r.spending_type == "discretionary"]

    if disc_rows:
        last_ts = max(r.occurred_at for r in disc_rows)
        if last_ts.tzinfo is None:
            last_ts = last_ts.replace(tzinfo=timezone.utc)
        recency = (now - last_ts).total_seconds() / 86_400
    else:
        recency = float(window_days)

    frequency = len(disc_rows)
    monetary = sum(r.amount for r in disc_rows)

    r_score = _quintile_score(recency, R_BREAKS, reverse=True)
    f_score = _quintile_score(frequency, F_BREAKS)
    m_score = _quintile_score(monetary, M_BREAKS)

    rfm_risk = RFM_WEIGHTS["R"] * r_score + RFM_WEIGHTS["F"] * f_score + RFM_WEIGHTS["M"] * m_score
    rfm_risk = float(np.clip(rfm_risk, 1.0, 5.0))

    return RfmResult(
        recency_days=round(recency, 2), frequency=frequency,
        monetary=round(monetary, 2), r_score=r_score, f_score=f_score,
        m_score=m_score, rfm_risk=round(rfm_risk, 3),
        segment=segment_for_score(rfm_risk),
    )
