"""Pydantic schemas — transaction analyze / nudge / list responses."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TransactionCreate(BaseModel):
    user_id: int = Field(..., gt=0)
    merchant: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=64)
    mcc_code: str = Field(default="5999", max_length=8)
    amount: float = Field(..., gt=0)
    currency: str = Field(default="TRY", max_length=8)
    occurred_at: datetime | None = None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    merchant: str = ""
    category: str
    mcc_code: str = "5999"
    amount: float
    currency: str = "TRY"
    occurred_at: datetime
    spending_type: str = "discretionary"
    is_impulsive: int = 0
    risk_probability: float = 0.0
    item_name: str | None = None
    sub_category: str | None = None
    is_personal_entry: bool = False


class AnalyzeResponse(BaseModel):
    transaction: TransactionOut
    is_impulsive: bool
    risk_probability: float = Field(..., ge=0.0, le=1.0)
    rfm_segment: str
    rfm_risk: float
    contributing_factors: list[dict]


class NudgeRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    transaction_id: int | None = None
    risk_probability: float = Field(..., ge=0.0, le=1.0)
    rfm_segment: str
    context_overrides: dict | None = None


class NudgeResponse(BaseModel):
    strategy: Literal[
        "loss_aversion",
        "social_norms",
        "planning",
        "positive_reinforcement",
    ]
    nudge_text: str
    model: str
    latency_ms: int
    is_mock: bool = False


class RfmSummary(BaseModel):
    recency_days: float
    frequency: int
    monetary: float
    rfm_risk: float
    segment: str
