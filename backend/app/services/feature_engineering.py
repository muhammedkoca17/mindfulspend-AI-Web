"""Feature engineering — shared between training and live inference.

Single source of truth so train-time and serve-time features stay aligned.

Two modes:
  - build_features(df): vectorized batch (training)
  - build_realtime_features(cart_items, user, db): single request (inference)
"""
from __future__ import annotations

from datetime import datetime, timezone

import numpy as np
import pandas as pd

from app.services.constants import (
    category_to_mcc,
    category_to_spending_type,
    normalize_category,
)

# Legacy feature columns (used by build_features for backward compat)
FEATURE_COLUMNS = [
    "amount",
    "hour",
    "is_weekend",
    "dow_sin",
    "dow_cos",
    "is_discretionary",
    "is_late_night",
    "amount_zscore_user",
    "user_avg_amount",
]

# XGBoost model feature columns (from train_xgboost.py)
ML_FEATURE_COLUMNS = [
    "hour", "day_of_week", "is_weekend", "is_night", "is_high_value",
    "is_essential", "deviation_from_avg", "r_score", "f_score", "m_score",
    "rfm_score", "age", "quantity", "price", "amount_try",
]


def _hour_to_bin(h: int) -> int:
    if 5  <= h < 12: return 0
    if 12 <= h < 17: return 1
    if 17 <= h < 22: return 2
    return 3


def _derive_spending_type(row) -> str:
    explicit = row.get("spending_type")
    if isinstance(explicit, str) and explicit in {"essential", "discretionary", "income"}:
        return explicit
    cat = row.get("category", "")
    return category_to_spending_type(normalize_category(str(cat)))


def _derive_mcc(row) -> str:
    explicit = row.get("mcc_code")
    if isinstance(explicit, str) and explicit.strip() and explicit != "nan":
        return explicit
    cat = row.get("category", "")
    return category_to_mcc(normalize_category(str(cat)))


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Vectorized feature construction from cleaned transactions (batch/training)."""
    out = df.copy()

    ts_col = "occurred_at" if "occurred_at" in out.columns else "date_time"
    ts = pd.to_datetime(out[ts_col], errors="coerce")
    out["hour"] = ts.dt.hour.fillna(12).astype(int)
    out["dow"]  = ts.dt.dayofweek.fillna(0).astype(int)
    out["is_weekend"] = (out["dow"] >= 5).astype(int)
    out["dow_sin"] = np.sin(2 * np.pi * out["dow"] / 7)
    out["dow_cos"] = np.cos(2 * np.pi * out["dow"] / 7)
    out["hour_bin"] = out["hour"].map(_hour_to_bin)
    out["is_late_night"] = ((out["hour"] >= 22) | (out["hour"] < 4)).astype(int)

    if "spending_type" not in out.columns:
        out["spending_type"] = out.apply(_derive_spending_type, axis=1)
    if "mcc_code" not in out.columns:
        out["mcc_code"] = out.apply(_derive_mcc, axis=1)

    out["is_discretionary"] = (out["spending_type"] == "discretionary").astype(int)

    user_avg = out.groupby("user_id")["amount"].transform("mean")
    user_std = out.groupby("user_id")["amount"].transform("std").replace(0, 1).fillna(1)
    out["user_avg_amount"] = user_avg.fillna(out["amount"])
    out["amount_zscore_user"] = ((out["amount"] - user_avg) / user_std).fillna(0)

    return out


def build_features_single(transaction: dict, user_history_df: pd.DataFrame) -> pd.DataFrame:
    """Single-transaction feature build for live inference (legacy)."""
    pending = pd.DataFrame([transaction])
    full = pd.concat([user_history_df, pending], ignore_index=True)
    enriched = build_features(full)
    return enriched.iloc[[-1]][FEATURE_COLUMNS]


def build_realtime_features(cart_items, user, db) -> dict:
    """Build ML feature dict from live cart + user + DB data.

    Returns a dict matching ML_FEATURE_COLUMNS keys, ready for predict_all().
    """
    from app.db.models import Transaction
    from app.services.rfm import compute_rfm_live

    now = datetime.now(timezone.utc)
    hour = now.hour
    dow = now.weekday()

    # Cart aggregates
    total = sum(item.total_price for item in cart_items)
    qty = sum(item.quantity for item in cart_items)
    price_avg = total / max(qty, 1)
    essential_count = sum(1 for item in cart_items if item.product.is_essential)
    is_essential = 1 if essential_count > len(cart_items) / 2 else 0

    # User historical stats (lightweight query)
    past = (
        db.query(Transaction.amount)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.occurred_at.desc())
        .limit(100)
        .all()
    )
    amounts = [r.amount for r in past] if past else [total]
    user_avg = sum(amounts) / len(amounts)
    if len(amounts) > 1:
        user_std = max((sum((a - user_avg) ** 2 for a in amounts) / (len(amounts) - 1)) ** 0.5, 1.0)
    else:
        user_std = 1.0

    deviation = (total - user_avg) / user_std
    is_high_value = 1 if total > user_avg * 1.5 else 0

    # Live RFM
    rfm = compute_rfm_live(user.id, db)

    return {
        "hour": hour,
        "day_of_week": dow,
        "is_weekend": 1 if dow >= 5 else 0,
        "is_night": 1 if hour >= 22 else 0,
        "is_high_value": is_high_value,
        "is_essential": is_essential,
        "deviation_from_avg": round(deviation, 4),
        "r_score": rfm.r_score,
        "f_score": rfm.f_score,
        "m_score": rfm.m_score,
        "rfm_score": rfm.rfm_risk,
        "age": 30,
        "quantity": qty,
        "price": round(price_avg, 2),
        "amount_try": round(total, 2),
    }
