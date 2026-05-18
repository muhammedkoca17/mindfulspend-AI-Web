"""
MindfulSpend AI - Step 4-5: Train XGBoost Models + Feature Importance
"""
import json
import warnings
from pathlib import Path
from datetime import date
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, f1_score, accuracy_score, mean_squared_error, mean_absolute_error
from xgboost import XGBClassifier, XGBRegressor
import joblib

warnings.filterwarnings('ignore')
np.random.seed(42)

BASE = Path(__file__).resolve().parent.parent
PROCESSED = BASE / "data" / "03_processed"
INTERIM = BASE / "data" / "02_interim"
MODELS = BASE / "app" / "ml_models"
MODELS.mkdir(parents=True, exist_ok=True)

print("STEP 4: TRAINING XGBOOST MODELS")

# Load features
df = pd.read_csv(PROCESSED / "features_ready.csv")
print(f"  Loaded: {df.shape[0]} rows")

# Fix budget_risk: composite rule-based score (like impulsive_score)
# Uses: deviation_from_avg, is_high_value, amount percentile, temporal patterns
amt_pct = df['amount_try'].rank(pct=True).values
br = np.zeros(len(df))
br += 0.25 * df['is_high_value'].values               # spending above 1.5x avg
br += 0.25 * (df['deviation_from_avg'].clip(0, 3) / 3).values  # deviation normalized
br += 0.20 * (amt_pct > 0.75).astype(float)             # top 25% spender
br += 0.15 * df['is_weekend'].values                    # weekend overspend tendency
br += 0.15 * (1 - df['is_essential'].values)            # discretionary spending
br += np.random.normal(0, 0.05, len(df))                # noise for realism
df['budget_risk'] = np.clip(br, 0.0, 1.0)
print(f"  budget_risk: mean={df['budget_risk'].mean():.3f}, std={df['budget_risk'].std():.3f}")

# Feature columns
FEATURES = ['hour', 'day_of_week', 'is_weekend', 'is_night', 'is_high_value',
            'is_essential', 'deviation_from_avg', 'r_score', 'f_score', 'm_score',
            'rfm_score', 'age', 'quantity', 'price', 'amount_try']

# Ensure all exist
for c in FEATURES:
    if c not in df.columns:
        df[c] = 0

X = df[FEATURES].fillna(0)
y_imp = (df['impulsive_score'] > 0.5).astype(int)
y_budget = df['budget_risk'].values
y_nudge = df['nudge_accepted'].astype(int)

# Split 70/15/15
X_train, X_temp, yi_tr, yi_te = train_test_split(X, y_imp, test_size=0.3, random_state=42, stratify=y_imp)
X_val, X_test, yi_val, yi_test = train_test_split(X_temp, yi_te, test_size=0.5, random_state=42, stratify=yi_te)

# Budget & nudge targets aligned with same indices
yb_tr = y_budget[X_train.index]
yb_val = y_budget[X_val.index]
yb_test = y_budget[X_test.index]
yn_tr = y_nudge[X_train.index]
yn_val = y_nudge[X_val.index]
yn_test = y_nudge[X_test.index]

print(f"  Split: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")
print(f"  Impulsive positive rate: {y_imp.mean():.1%}")

# --- Model 1: Impulsive Classifier ---
print("\n  [4a] Training Impulsive Classifier...")
pos_w = (yi_tr == 0).sum() / max((yi_tr == 1).sum(), 1)
m1 = XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1,
                   scale_pos_weight=pos_w, eval_metric='auc',
                   random_state=42, n_jobs=-1, verbosity=0)
m1.fit(X_train, yi_tr, eval_set=[(X_val, yi_val)], verbose=False)

auc_tr = roc_auc_score(yi_tr, m1.predict_proba(X_train)[:,1])
auc_val = roc_auc_score(yi_val, m1.predict_proba(X_val)[:,1])
auc_test = roc_auc_score(yi_test, m1.predict_proba(X_test)[:,1])
joblib.dump(m1, MODELS / "impulsive_model.joblib")
print(f"  Impulsive AUC train={auc_tr:.4f} val={auc_val:.4f} test={auc_test:.4f}")

# --- Model 2: Budget Risk Regressor ---
print("\n  [4b] Training Budget Risk Regressor...")
m2 = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.1,
                  random_state=42, n_jobs=-1, verbosity=0)
m2.fit(X_train, yb_tr, eval_set=[(X_val, yb_val)], verbose=False)

pred_b = m2.predict(X_test)
rmse = np.sqrt(mean_squared_error(yb_test, pred_b))
mae = mean_absolute_error(yb_test, pred_b)
joblib.dump(m2, MODELS / "budget_risk_model.joblib")
print(f"  Budget Risk RMSE={rmse:.4f} MAE={mae:.4f}")

# --- Model 3: Nudge Acceptance Classifier ---
print("\n  [4c] Training Nudge Classifier...")
m3 = XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.1,
                   random_state=42, n_jobs=-1, verbosity=0, eval_metric='auc')
m3.fit(X_train, yn_tr, eval_set=[(X_val, yn_val)], verbose=False)

nudge_auc = roc_auc_score(yn_test, m3.predict_proba(X_test)[:,1])
nudge_f1 = f1_score(yn_test, m3.predict(X_test))
joblib.dump(m3, MODELS / "nudge_model.joblib")
print(f"  Nudge AUC={nudge_auc:.4f} F1={nudge_f1:.4f}")

# --- RFM Lookup ---
rfm = pd.read_csv(INTERIM / "rfm_scores.csv")
rfm[['customer_id','rfm_score','segment']].to_csv(MODELS / "rfm_lookup.csv", index=False)
print(f"\n  RFM lookup saved: {rfm.shape[0]} customers")

# --- Feature columns ---
json.dump(FEATURES, open(MODELS / "feature_columns.json", "w"))

# --- Step 5: Feature Importance ---
print("\nSTEP 5: FEATURE IMPORTANCE")
fi = {}
for name, model in [("impulsive_model", m1), ("budget_risk_model", m2), ("nudge_model", m3)]:
    imp = dict(zip(FEATURES, model.feature_importances_.tolist()))
    imp_sorted = sorted(imp.items(), key=lambda x: x[1], reverse=True)
    fi[name] = {k: round(v, 4) for k, v in imp_sorted}
    top5 = imp_sorted[:5]
    print(f"  Top 5 [{name}]: {', '.join(f'{k}={v:.3f}' for k,v in top5)}")

json.dump(fi, open(PROCESSED / "feature_importance.json", "w"), indent=2)

# --- Step 7: Metrics JSON ---
metrics = {
    "impulsive_model": {"auc_train": round(auc_tr, 4), "auc_val": round(auc_val, 4), "auc_test": round(auc_test, 4)},
    "budget_risk_model": {"rmse": round(rmse, 4), "mae": round(mae, 4)},
    "nudge_model": {"auc": round(nudge_auc, 4), "f1": round(nudge_f1, 4)},
    "training_data": {
        "total_rows": len(df),
        "date_trained": str(date.today()),
        "datasets_used": ["customer_shopping_data.csv", "online_retail_II.csv"]
    }
}
json.dump(metrics, open(PROCESSED / "model_metrics.json", "w"), indent=2)

print("\n" + "=" * 50)
print("STEPS 4-5-7 DONE")
print(f"  Models: {list(MODELS.glob('*.joblib'))}")
print(f"  Metrics: {PROCESSED / 'model_metrics.json'}")
print("=" * 50)
