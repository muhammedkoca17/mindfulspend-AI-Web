# Veri Analizi ve Model Egitimi Notlari

## Kullanilan Veri Setleri
- **customer_shopping_data.csv**: 99,457 satir, TRY, Istanbul AVM verileri, 2021-2023
- **online_retail_II.csv**: 1M+ satir, GBP→TRY (x40), RFM egitimi icin kullanildi
- **market_sales.xlsx**: 611K satir, 9K+ Turk urunu, urun katalogu referansi
- **cards_data.csv**: 6,146 kart bilgisi (BIN, tip, limit)
- **users_data.csv**: 2,000 kullanici demografik verisi
- **turkey_bin_list.json**: 1,875 Turk banka BIN numarasi

## Model Mimarisi
| Model | Tip | Dosya | Hedef |
|-------|-----|-------|-------|
| Impulsive Model | XGBoost Classifier | impulsive_model.joblib | Durtusal alisveris tahmini |
| Budget Risk Model | XGBoost Regressor | budget_risk_model.joblib | Butce asim riski (0-1) |
| Nudge Model | XGBoost Classifier | nudge_model.joblib | Nudge kabul tahmini |

## Ozellik Listesi (15 feature)
hour, day_of_week, is_weekend, is_night, is_high_value, is_essential,
deviation_from_avg, r_score, f_score, m_score, rfm_score, age, quantity, price, amount_try

## Sentetik Etiket Stratejisi
Behavioral labels (impulsive_score, nudge_accepted, budget_risk) gercek dunyada
mevcut degildir. **Rule-Augmented Synthetic Labeling** yontemi kullanildi:

- **impulsive_score**: temporal (gece=+0.30, hafta sonu=+0.20) + categorical
  (zorunlu olmayan=+0.40) + monetary (yuksek harcama=+0.30)
- **nudge_accepted**: impulsive_score'a dayali olasiliksal simulasyon
  (dusuk risk → %80 kabul, orta → %50, yuksek → %30)
- **budget_risk**: harcama sapmasi + miktar yuzdeligi + temporal + kategori bazli kompozit skor

Referans: Thaler & Sunstein (2008), Nudge Theory.

## RFM Segmentasyon
- **Champion** (rfm >= 4.0): En degerli musteriler
- **Loyal** (rfm >= 3.0): Sadik musteriler
- **At Risk** (rfm >= 2.0): Risk altindaki musteriler
- **Churning** (rfm < 2.0): Kayip riski yuksek

## Test Sonuclari
`backend/data/03_processed/model_metrics.json` dosyasina bakin.

## Pipeline Calistirma
```bash
cd backend
python scripts/build_training_data.py   # Step 1-2: EDA + Temizlik
python scripts/feature_engineering.py    # Step 3: Feature Engineering
python scripts/train_xgboost.py          # Step 4-7: Egitim + Metrikler
```
