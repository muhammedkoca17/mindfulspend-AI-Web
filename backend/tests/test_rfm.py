"""Smoke tests for the RFM scoring module."""
from datetime import UTC, datetime, timedelta

import pandas as pd

from app.services.constants import RFM_WEIGHTS
from app.services.rfm import compute_rfm


def test_empty_history_is_lowest_risk():
    result = compute_rfm(pd.DataFrame(columns=["occurred_at", "amount", "spending_type"]))
    assert result.rfm_risk == 1.0
    assert result.segment == "Sadık Tasarrufçu"


def test_weights_sum_to_one():
    assert abs(sum(RFM_WEIGHTS.values()) - 1.0) < 1e-9


def test_high_frequency_pushes_to_impulsive():
    now = datetime.now(UTC)
    rows = [
        {
            "occurred_at": now - timedelta(hours=i),
            "amount": 800.0,
            "spending_type": "discretionary",
        }
        for i in range(25)
    ]
    result = compute_rfm(pd.DataFrame(rows), reference_date=now)
    assert result.segment == "İmpulsif / Kırılgan"
    assert result.rfm_risk >= 3.5


def test_only_essential_spending_stays_safe():
    now = datetime.now(UTC)
    rows = [
        {
            "occurred_at": now - timedelta(days=i),
            "amount": 200.0,
            "spending_type": "essential",
        }
        for i in range(20)
    ]
    result = compute_rfm(pd.DataFrame(rows), reference_date=now)
    assert result.segment == "Sadık Tasarrufçu"
    assert result.frequency == 0
