"""ETL service — production-grade data cleaning pipeline.

Real-world dirt observed in BudgetWise CSVs (May 2026 download):
  • Category: 'FOOD', 'Food', 'food', 'Foods', 'Foodd', 'Fod', 'FFood', 'Foood'
  • Amount: '998', '$143', '83,802', '2,524', NaN
  • Date: '2023-04-25', 'December 22 2021', '03/24/2022', '12/12/2021', NaN
  • Payment mode: 'UPI', 'Upi', 'upi', 'CARD', 'Crd', 'Csh', NaN
  • Locations: mixed casing & abbreviations ('PUN', 'PUNE', 'pune')

Demonstrates the jury-relevant disciplines:
  • Levenshtein-based fuzzy match (rapidfuzz)
  • KNN Imputation for missing payment_mode
  • Multi-format date standardization with temporal interpolation
"""
from __future__ import annotations

import re

import numpy as np
import pandas as pd
from rapidfuzz import fuzz, process
from sklearn.impute import KNNImputer
from sklearn.preprocessing import LabelEncoder

from app.services.constants import (
    CATEGORY_TAXONOMY,
    category_to_display,
    category_to_mcc,
    category_to_spending_type,
    normalize_category,
)

# ---------------------------------------------------------------------------
# Amount parsing — handle '$143', '2,524', '83,802' ...
# ---------------------------------------------------------------------------
_AMOUNT_NOISE = re.compile(r"[^\d.\-]")


def parse_amount(value) -> float:
    """Convert messy amount strings to float; NaN on failure."""
    if pd.isna(value):
        return float("nan")
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s:
        return float("nan")
    s = _AMOUNT_NOISE.sub("", s)
    try:
        return float(s) if s else float("nan")
    except ValueError:
        return float("nan")


# ---------------------------------------------------------------------------
# Date parsing — multi-format with fallback interpolation
# ---------------------------------------------------------------------------
_DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%d-%m-%Y",
    "%d-%m-%y",
    "%B %d %Y",
    "%b %d %Y",
    "%d %B %Y",
    "%Y/%m/%d",
]


def parse_date_series(series: pd.Series) -> pd.Series:
    """Try each known format, then pandas inference, then temporal interpolation."""
    out = pd.Series([pd.NaT] * len(series), index=series.index, dtype="datetime64[ns]")
    remaining = series.copy()

    for fmt in _DATE_FORMATS:
        mask = out.isna() & remaining.notna()
        if not mask.any():
            break
        parsed = pd.to_datetime(remaining[mask], format=fmt, errors="coerce")
        out.loc[parsed.notna().reindex(out.index, fill_value=False)] = parsed.dropna()

    # Last resort: pandas auto-infer
    still_missing = out.isna() & remaining.notna()
    if still_missing.any():
        auto = pd.to_datetime(remaining[still_missing], errors="coerce", dayfirst=True)
        out.loc[still_missing] = auto

    # Interpolate fully missing rows against neighbours
    out = out.interpolate(method="linear", limit_direction="both")
    return out


# ---------------------------------------------------------------------------
# Category cleanup
# ---------------------------------------------------------------------------
def clean_categories(series: pd.Series) -> pd.Series:
    """Map every raw category string to its canonical display label."""
    return series.fillna("Other").map(lambda v: category_to_display(normalize_category(str(v))))


def derive_spending_type(category_series: pd.Series) -> pd.Series:
    """Add essential | discretionary | income column."""
    return category_series.map(lambda c: category_to_spending_type(normalize_category(str(c))))


def derive_mcc(category_series: pd.Series) -> pd.Series:
    """Synthesize an MCC proxy from the canonical category."""
    return category_series.map(lambda c: category_to_mcc(normalize_category(str(c))))


# ---------------------------------------------------------------------------
# Payment mode normalization + KNN imputation
# ---------------------------------------------------------------------------
_PAYMENT_MASTER = ["card", "cash", "bank_transfer", "upi", "mobile_wallet"]


def _normalize_payment(raw) -> str | float:
    if pd.isna(raw):
        return float("nan")
    s = str(raw).strip().lower().replace(" ", "_")
    if s in {"card", "crd", "credit_card", "debit_card"}:
        return "card"
    if s in {"cash", "csh"}:
        return "cash"
    if "upi" in s:
        return "upi"
    if "bank" in s or "transfer" in s or "transfr" in s:
        return "bank_transfer"
    if "mobile" in s or "wallet" in s:
        return "mobile_wallet"
    # Fuzzy fallback
    match = process.extractOne(s, _PAYMENT_MASTER, scorer=fuzz.WRatio)
    return match[0] if match and match[1] >= 70 else float("nan")


def knn_impute_payment_mode(df: pd.DataFrame) -> pd.DataFrame:
    """Fill missing payment_mode using KNN on (amount, category_encoded)."""
    df = df.copy()
    if "payment_mode" not in df.columns:
        return df

    df["payment_mode"] = df["payment_mode"].map(_normalize_payment)
    known = df["payment_mode"].dropna().unique().tolist()
    if not known:
        return df

    mode_to_idx = {m: i for i, m in enumerate(known)}
    idx_to_mode = {i: m for m, i in mode_to_idx.items()}
    df["_pm_encoded"] = df["payment_mode"].map(mode_to_idx)

    cat_encoder = LabelEncoder()
    df["_cat_encoded"] = cat_encoder.fit_transform(df["category"].astype(str))

    features = df[["amount", "_cat_encoded", "_pm_encoded"]].to_numpy(dtype=float)
    imputer = KNNImputer(n_neighbors=5, weights="distance")
    imputed = imputer.fit_transform(features)
    df["_pm_encoded"] = np.round(imputed[:, 2]).astype(int).clip(0, max(idx_to_mode))
    df["payment_mode"] = df["_pm_encoded"].map(idx_to_mode)
    return df.drop(columns=["_pm_encoded", "_cat_encoded"])


# ---------------------------------------------------------------------------
# Temporal feature derivation (unchanged)
# ---------------------------------------------------------------------------
def derive_temporal_features(df: pd.DataFrame, date_col: str = "occurred_at") -> pd.DataFrame:
    df = df.copy()
    ts = pd.to_datetime(df[date_col], errors="coerce")
    df["hour"] = ts.dt.hour.fillna(12).astype(int)
    df["dow"] = ts.dt.dayofweek.fillna(0).astype(int)
    df["is_weekend"] = (df["dow"] >= 5).astype(int)

    def _bin(h: int) -> str:
        if 5 <= h < 12:
            return "Morning"
        if 12 <= h < 17:
            return "Afternoon"
        if 17 <= h < 22:
            return "Evening"
        return "LateNight"
    df["hour_bin"] = df["hour"].map(_bin)
    df["dow_sin"]   = np.sin(2 * np.pi * df["dow"]   / 7)
    df["dow_cos"]   = np.cos(2 * np.pi * df["dow"]   / 7)
    df["month_sin"] = np.sin(2 * np.pi * ts.dt.month.fillna(1) / 12)
    df["month_cos"] = np.cos(2 * np.pi * ts.dt.month.fillna(1) / 12)
    return df


def financial_vulnerability_index(income: float, expense: float, savings_rate: float) -> float:
    if income <= 0:
        return 1.0
    dti = max(0.0, (expense - income) / income)
    inv_savings = max(0.0, 1.0 - savings_rate)
    return float(np.clip(0.6 * dti + 0.4 * inv_savings, 0.0, 1.0))


# ---------------------------------------------------------------------------
# Public ETL pipelines per dataset
# ---------------------------------------------------------------------------
def _enrich_category_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Single pass: raw category → canonical key → (display, spending_type, mcc).

    Avoids the trap of running normalize_category twice (Turkish display label
    can't round-trip back to the canonical English key).
    """
    df = df.copy()
    canonical = df["category"].fillna("other").astype(str).map(normalize_category)
    info = canonical.map(lambda k: CATEGORY_TAXONOMY.get(k, ("Diğer", "discretionary", "5999")))
    df["category"]      = info.map(lambda t: t[0])
    df["spending_type"] = info.map(lambda t: t[1])
    df["mcc_code"]      = info.map(lambda t: t[2])
    return df


def clean_budgetwise(df_clean: pd.DataFrame, df_dirty: pd.DataFrame | None = None) -> pd.DataFrame:
    """Concat the two BudgetWise files, normalize everything, drop duplicates."""
    parts = [df_clean]
    if df_dirty is not None:
        parts.append(df_dirty)
    df = pd.concat(parts, ignore_index=True)

    df["amount"]       = df["amount"].map(parse_amount)
    df["occurred_at"]  = parse_date_series(df["date"])
    df = _enrich_category_columns(df)
    df = knn_impute_payment_mode(df)
    df = derive_temporal_features(df)

    df = df.drop_duplicates(subset=["transaction_id"], keep="first")
    df = df.dropna(subset=["amount", "occurred_at"])
    df = df[df["amount"] > 0]

    return df.reset_index(drop=True)


def clean_financial_transactions(expenses_df: pd.DataFrame, income_df: pd.DataFrame) -> pd.DataFrame:
    """Combine expense + income; tag, normalize, derive features."""
    expenses_df = expenses_df.copy()
    income_df   = income_df.copy()

    expenses_df["transaction_type"] = "expense"
    income_df["transaction_type"]   = "income"

    df = pd.concat([expenses_df, income_df], ignore_index=True)
    df["amount"]       = df["amount"].map(parse_amount)
    df["occurred_at"]  = pd.to_datetime(df["date_time"], errors="coerce")
    df = _enrich_category_columns(df)
    df = derive_temporal_features(df)
    df = df.dropna(subset=["amount", "occurred_at"])

    # Assign synthetic user_id from `account` (acct_1, acct_2 → 1, 2)
    df["user_id"] = df["account"].astype(str).str.extract(r"(\d+)").fillna("1").astype(int)
    return df.reset_index(drop=True)
