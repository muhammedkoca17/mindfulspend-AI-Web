"""Lazy-loaded ML model wrappers — singleton inference clients.

Three models:
  - impulsive_model: XGBClassifier (is this purchase impulsive?)
  - budget_risk_model: XGBRegressor (budget overrun risk 0-1)
  - nudge_model: XGBClassifier (will user accept a nudge?)

Models are loaded once on first call and cached in module state.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.core.config import settings

log = logging.getLogger(__name__)

# Module-level singletons
_impulsive_model = None
_budget_model = None
_nudge_model = None
_feature_columns: list[str] | None = None


class ModelNotTrainedError(RuntimeError):
    """Raised when the .joblib artifact is missing on disk."""


def _model_path(name: str) -> Path:
    return settings.models_dir / f"{name}.joblib"


def _load_feature_columns() -> list[str]:
    global _feature_columns
    if _feature_columns is None:
        path = settings.models_dir / "feature_columns.json"
        if path.exists():
            _feature_columns = json.loads(path.read_text())
        else:
            _feature_columns = [
                "hour", "day_of_week", "is_weekend", "is_night", "is_high_value",
                "is_essential", "deviation_from_avg", "r_score", "f_score", "m_score",
                "rfm_score", "age", "quantity", "price", "amount_try",
            ]
    return _feature_columns


def _load(name: str):
    path = _model_path(name)
    if not path.exists():
        raise ModelNotTrainedError(
            f"{name}.joblib not found at {path}. "
            "Run `python scripts/train_xgboost.py` first."
        )
    model = joblib.load(path)
    log.info("Loaded %s from %s", name, path)
    return model


def load_impulsive_model():
    global _impulsive_model
    if _impulsive_model is None:
        _impulsive_model = _load("impulsive_model")
    return _impulsive_model


def load_budget_model():
    global _budget_model
    if _budget_model is None:
        _budget_model = _load("budget_risk_model")
    return _budget_model


def load_nudge_model():
    global _nudge_model
    if _nudge_model is None:
        _nudge_model = _load("nudge_model")
    return _nudge_model


def _build_feature_row(features: dict) -> pd.DataFrame:
    """Build a single-row DataFrame with the correct feature columns."""
    cols = _load_feature_columns()
    row = {c: features.get(c, 0.0) for c in cols}
    return pd.DataFrame([row])


def predict_all(features: dict) -> dict[str, Any]:
    """Run all three models on a single transaction's features.

    Parameters
    ----------
    features : dict
        Must contain keys matching feature_columns.json
        (hour, day_of_week, is_weekend, is_essential, amount_try, etc.)

    Returns
    -------
    dict with:
        impulsive_score : float   – raw probability 0-1
        is_impulsive    : bool    – threshold >= 0.5
        budget_risk     : float   – predicted 0-1
        nudge_acceptance_prob : float – probability user accepts nudge
    """
    X = _build_feature_row(features)

    imp_model = load_impulsive_model()
    imp_proba = float(imp_model.predict_proba(X)[0][1])

    bud_model = load_budget_model()
    bud_risk = float(np.clip(bud_model.predict(X)[0], 0.0, 1.0))

    nud_model = load_nudge_model()
    nud_proba = float(nud_model.predict_proba(X)[0][1])

    return {
        "impulsive_score": round(imp_proba, 4),
        "is_impulsive": imp_proba >= 0.5,
        "budget_risk": round(bud_risk, 4),
        "nudge_acceptance_prob": round(nud_proba, 4),
    }


def get_user_rfm(user_id: str, db) -> dict:
    """Compute live RFM from the transactions table in the database.

    Falls back to the static CSV lookup if DB query returns nothing.
    """
    from datetime import datetime

    from sqlalchemy import text

    query = text("""
        SELECT
            occurred_at,
            amount,
            COUNT(*) OVER () AS total_txns
        FROM transactions
        WHERE user_id = :uid AND amount > 0
        ORDER BY occurred_at DESC
    """)

    rows = db.execute(query, {"uid": user_id}).fetchall()

    if not rows:
        # Fallback: static lookup
        csv_path = settings.models_dir / "rfm_lookup.csv"
        if csv_path.exists():
            lookup = pd.read_csv(csv_path, dtype={"customer_id": str})
            match = lookup[lookup["customer_id"] == str(user_id)]
            if not match.empty:
                r = match.iloc[0]
                return {
                    "rfm_score": float(r["rfm_score"]),
                    "segment": str(r["segment"]),
                    "source": "csv_lookup",
                }
        return {"rfm_score": 2.5, "segment": "at_risk", "source": "default"}

    now = datetime.utcnow()
    last_date = rows[0][0] if rows[0][0] else now
    recency_days = (now - last_date).days if hasattr(last_date, 'days') or isinstance(last_date, datetime) else 30
    frequency = int(rows[0][2]) if rows else 0
    monetary = sum(float(r[1]) for r in rows)

    # Simple score: normalize to 1-5 with heuristic thresholds
    r_score = 5 if recency_days <= 7 else 4 if recency_days <= 30 else 3 if recency_days <= 90 else 2 if recency_days <= 180 else 1
    f_score = min(5, max(1, frequency // 5))
    m_score = 5 if monetary > 10000 else 4 if monetary > 5000 else 3 if monetary > 1000 else 2 if monetary > 100 else 1

    rfm_score = (r_score + f_score + m_score) / 3.0
    segment = (
        "champion" if rfm_score >= 4.0 else
        "loyal" if rfm_score >= 3.0 else
        "at_risk" if rfm_score >= 2.0 else
        "churning"
    )

    return {
        "recency_days": recency_days,
        "frequency": frequency,
        "monetary": round(monetary, 2),
        "r_score": r_score,
        "f_score": f_score,
        "m_score": m_score,
        "rfm_score": round(rfm_score, 2),
        "segment": segment,
        "source": "live_db",
    }


def is_models_ready() -> bool:
    """Check if all three model files exist on disk."""
    return all(
        _model_path(n).exists()
        for n in ("impulsive_model", "budget_risk_model", "nudge_model")
    )
