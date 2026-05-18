"""
MindfulSpend AI - Step 3: Feature Engineering (Vectorized, no .apply freeze)
"""
import warnings
from pathlib import Path
import pandas as pd
import numpy as np

warnings.filterwarnings('ignore')
np.random.seed(42)

BASE = Path(__file__).resolve().parent.parent
INTERIM = BASE / "data" / "02_interim"
PROCESSED = BASE / "data" / "03_processed"
PROCESSED.mkdir(parents=True, exist_ok=True)

print("STEP 3: FEATURE ENGINEERING")

# Load
shop = pd.read_csv(INTERIM / "shopping_clean.csv", parse_dates=['invoice_date'])
print(f"  Loaded: {shop.shape[0]} rows")

# --- RFM ---
ref_date = shop['invoice_date'].max() + pd.Timedelta(days=1)
rfm = shop.groupby('customer_id').agg(
    recency_days=('invoice_date', lambda x: (ref_date - x.max()).days),
    frequency=('invoice_no', 'nunique'),
    monetary=('amount_try', 'sum')
).reset_index()

for col, rev in [('recency_days', True), ('frequency', False), ('monetary', False)]:
    sn = col[0] + '_score'
    rfm[sn] = pd.qcut(rfm[col].rank(method='first'), q=5, labels=[1,2,3,4,5]).astype(int)
    if rev:
        rfm[sn] = 6 - rfm[sn]

rfm['rfm_score'] = (rfm['r_score'] + rfm['f_score'] + rfm['m_score']) / 3.0
rfm['segment'] = pd.cut(rfm['rfm_score'], bins=[0, 2, 3, 4, 5.1],
                         labels=['churning', 'at_risk', 'loyal', 'champion'])
rfm.to_csv(INTERIM / "rfm_scores.csv", index=False)
print(f"  RFM: {rfm['segment'].value_counts().to_dict()}")

# --- User stats (vectorized) ---
user_avg = shop.groupby('customer_id')['amount_try'].mean().rename('avg_amount')
user_std = shop.groupby('customer_id')['amount_try'].std().fillna(1).rename('std_amount')

shop = shop.merge(user_avg, on='customer_id')
shop = shop.merge(user_std, on='customer_id')
shop = shop.merge(rfm[['customer_id','r_score','f_score','m_score','rfm_score']], on='customer_id')

# --- Transaction features (VECTORIZED, no apply) ---
shop['deviation_from_avg'] = (shop['amount_try'] - shop['avg_amount']) / shop['std_amount'].replace(0,1)
shop['is_night'] = (shop['hour'] >= 22).astype(int)
shop['is_high_value'] = (shop['amount_try'] > shop['avg_amount'] * 1.5).astype(int)

# --- Synthetic labels (VECTORIZED) ---
imp = np.zeros(len(shop))
imp += 0.30 * shop['is_night'].values
imp += 0.20 * shop['is_weekend'].values
imp += 0.40 * (1 - shop['is_essential'].values)
imp += 0.30 * shop['is_high_value'].values
shop['impulsive_score'] = np.minimum(imp, 1.0)

# Nudge accepted (vectorized random)
rng = np.random.random(len(shop))
nudge = np.where(shop['impulsive_score'] < 0.4, (rng < 0.80).astype(int),
         np.where(shop['impulsive_score'] < 0.7, (rng < 0.50).astype(int),
                  (rng < 0.30).astype(int)))
shop['nudge_accepted'] = nudge

# Budget risk
dev = shop['deviation_from_avg'].values
shop['budget_risk'] = np.where(dev > 0, np.minimum(dev / 3.0, 1.0), 0.0)

# Encode
shop['gender_encoded'] = (shop['gender'].str.lower() == 'male').astype(int) if 'gender' in shop.columns else 0
pay_map = {'Cash': 0, 'Credit Card': 1, 'Debit Card': 2}
shop['payment_encoded'] = shop['payment_method'].map(pay_map).fillna(0).astype(int) if 'payment_method' in shop.columns else 0

shop.to_csv(PROCESSED / "features_ready.csv", index=False)

print(f"  impulsive_score: {shop['impulsive_score'].mean():.2f} +/- {shop['impulsive_score'].std():.2f}")
print(f"  nudge_accepted rate: {shop['nudge_accepted'].mean():.1%}")
print(f"  budget_risk mean: {shop['budget_risk'].mean():.3f}")
print(f"  Saved: features_ready.csv ({shop.shape[0]} rows)")
print("STEP 3 DONE")
