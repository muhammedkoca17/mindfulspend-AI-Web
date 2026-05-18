<div align="center">

# MindfulSpend AI

### Davranışsal Finans Tabanlı Otonom Bütçe Yönetimi

**Hackathon 2026 — Finans & E-Ticaret Dikeyi**

*XGBoost + RFM + Google Gemini 2.5 Flash ile hiper-kişiselleştirilmiş, dürtüsel harcamayı önleyen "Karar Mimarı" bir AI asistanı.*

[![Real Data](https://img.shields.io/badge/data-Kaggle%20real-emerald)]() [![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue)]() [![Status](https://img.shields.io/badge/status-production%20ready-success)]()

---

</div>

## Vizyon

Geleneksel bütçe uygulamaları **geçmişe dönük** raporlar sunar. MindfulSpend AI, harcama anında devreye giren **proaktif bir finansal koçtur**. Kahneman'ın **Beklenti Teorisi** ve Thaler'in **Nudge Teorisi** ile akademik zemine oturan sistem, kullanıcının "Sistem 1" (dürtüsel) ve "Sistem 2" (rasyonel) karar mekanizmalarını ayırt eder; suçluluk uyandıran statik uyarılar yerine *kayıptan kaçınma* psikolojisini olumlu yöne çeviren dinamik "dürtmeler" üretir.

### Canlı Örnek (gerçek Gemini çıktısı)
> **Senaryo:** Kullanıcı saat 02:30'da gece kulübünde 12.000 TL harcama yapıyor.
> **MindfulSpend AI nudge'ı:**
> *"Sortie'deki keyifli anların sana iyi geldiğini umuyorum. Bu 12.000 TL'nin gelecekteki hayallerinden uzaklaşmasına izin verme; benzer bir tutarı biriktirerek o çok istediğin tatile bir adım daha yaklaşabilirsin."*

## Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────┐
│                    KULLANICI (React + Vite SPA)                 │
│  LiveTransaction  │  AgentNudgeCard  │  RFM_Dashboard           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST + TanStack Query
┌──────────────────────────────▼──────────────────────────────────┐
│              BACKEND (FastAPI + SQLAlchemy + SQLite)            │
│  /analyze  /nudge  /transactions  /users  /rfm  /health        │
└──────┬──────────────────┬──────────────────┬───────────────────┘
       │                  │                  │
┌──────▼────────┐ ┌───────▼────────┐ ┌──────▼──────────────┐
│  ML MOTORU    │ │ DAVRANIŞSAL    │ │  GEMINI 2.5 FLASH   │
│  XGBoost      │ │ SKORLAMA       │ │  (Function Calling) │
│  RF Regressor │ │ RFM Risk       │ │  Nudge Üretici      │
└───────────────┘ └────────────────┘ └─────────────────────┘
       ▲                  ▲                  ▲
       └──────────────────┴──────────────────┘
                          │
              ┌───────────▼────────────┐
              │  VERİ HATTI (Pipeline) │
              │  01_raw → 02_interim   │
              │       → 03_processed   │
              └────────────────────────┘
```

## Teknoloji Yığını

| Katman | Teknolojiler |
|---|---|
| **Veri** | Pandas, NumPy, scikit-learn, KNN Imputer, RapidFuzz |
| **ML** | XGBoost, RandomForest, joblib (3 Kaggle dataset, 31K+ satır) |
| **Backend** | FastAPI 0.115, SQLAlchemy 2, Pydantic v2, Uvicorn |
| **AI Agent** | Google Gemini **2.5 Flash** (live), Function Calling, 2K-token output |
| **Frontend** | React 18, Vite, TypeScript, Tailwind, Recharts, TanStack Query, Framer Motion |
| **Veritabanı** | SQLite (dev) / PostgreSQL (prod-ready via DATABASE_URL) |
| **DevOps** | Docker, Docker Compose, GitHub Actions, pytest |

### ✨ Son Eklenen Üretim (Production-Ready) Özellikleri

Hackathon 2026 sunumu ve jüri değerlendirmesi için sisteme eklenen son teknolojik katmanlar:

1. **Canlı Gemini Chat Asistanı (✨):** 
   Sağ altta yüzen parıltı butonuyla açılan interaktif sohbet robotu. Gemini API'nin **Function Calling** (Fonksiyon Çağırma) gücünü kullanarak kullanıcının bütçesini, hedeflerini ve harcamalarını sorgulayan 4 araca (`get_user_budget`, `get_user_goals`, `get_recent_transactions`, `calculate_goal_impact`) doğrudan erişir. API anahtarı girilmediğinde dahi gerçek verilerle konuşmaya devam eden akıllı **Dynamic Mock Fallback** desteği mevcuttur.
2. **RFM Analytics Zaman Serisi:**
   Haftalık bazda kaydedilen RFM snapshot verilerini `/rfm/{user_id}/history` API'sinden çekerek Recharts yardımıyla görselleştiren yeni analitik ekranı. Kullanıcının risk profilinin zaman içindeki seyrini **Alan (Area)** ve **Çizgi (Line)** grafikleriyle longitudinal (boylamsal) olarak takip eder.
3. **Tam Dinamik ML Veri Entegrasyonu:**
   XGBoost modeline beslenen statik `"age": 30` girdileri tamamen kaldırılmıştır. `models.py`'da yapılan veritabanı göçüyle `User` modeline `age` (Yaş) alanı eklenmiş; bu alan **Onboarding** ve **Profili Düzenle Modalı** ile ön yüzden dinamik alınarak doğrudan ML modeline bağlanmıştır.
4. **2 Aylık Zengin Simülasyon Seeding:**
   Jürinin sistemi boş görmemesi için `seed_test_user.py` scripti ile `test.jury@mindfulspend.ai` (Şifre: `12345678`) hesabına 63 işlem, 9 haftalık RFM snapshot serisi, 2 aktif finansal hedef, yaklaşan sabit faturalar ve **25 adet tarihsel Nudge logu** eklenmiştir.

## Hızlı Başlangıç

### Önkoşullar
- Python 3.11+
- Node.js 20+
- Google Gemini API key (https://aistudio.google.com/apikey)
- 3 Kaggle veri seti ZIP'i (Downloads klasöründe olmalı):
  - `Personal Finance Tracker.zip`
  - `BudgetWise Personal Finance Dataset.zip`
  - `Financial Transactions Dataset (Expenses & Income).zip`

### Kurulum (Windows)

```powershell
# Tek seferlik setup
.\setup.ps1
```

### Manuel Kurulum

```powershell
# === Backend ===
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Gerçek verileri 01_raw/'a aç
python scripts\prepare_real_data.py

# Modelleri eğit (yaklaşık 1 dk)
python scripts\train_models.py

# Gemini API key'i ekle
Copy-Item .env.example .env.local
# .env.local içindeki GEMINI_API_KEY satırını düzenle

# Sunucuyu başlat
uvicorn app.main:app --reload
```

```powershell
# === Frontend (yeni terminal) ===
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Doğrulama

```bash
# Sağlık kontrolü
curl http://127.0.0.1:8000/health
# {"status":"ok","models_ready":true,"gemini_enabled":true}

# End-to-end smoke test (Python)
cd backend
.\.venv\Scripts\python.exe -X utf8 tests\e2e_smoketest.py
```

## Veri Stratejisi — Gerçek Kaggle Hibritleri

| Veri Seti | Satır | Stratejik Rolü | Mühendislik Şovu |
|---|---|---|---|
| **Personal Finance Tracker** | 3,000 × 25 feature | Makroekonomik simülasyon (normal/inflation/recession senaryoları, finansal stres seviyesi) | `debt_to_income_ratio`, `financial_stress_level`, `credit_score` ile çok-değişkenli RF regresyonu |
| **BudgetWise (clean + dirty)** | 31,736 satır birleşik | ETL şovu: `FOOD/Food/Foods/Fod/Foodd/Foood/FFood`, `$143`, `83,802`, `December 22 2021` | Fuzzy match + KNN imputation + multi-format date parsing + dedup |
| **Financial Transactions** | 938 expense + 349 income | Mikro-davranışsal sınıflandırma (Cafe/Taxi/Public transport, saat hassasiyetli BYN) | Saat × kategori cross-feature, late-night discretionary tespiti |

### ETL Pipeline (Production-Grade)
1. **Amount parser** — `$143`, `2,524`, `83,802`, `NaN` → temiz float
2. **Date parser** — 9 farklı format + temporal interpolation
3. **Category normalize** — Fuzzy match ile 60+ varyantı 32 canonical kategoriye indirir
4. **KNN Imputation** — eksik `payment_mode`'u amount × category 5-NN ile tahmin eder
5. **Feature engineering** — `dow_sin/cos`, `hour_bin`, `amount_zscore_user`, `is_late_night`, `is_discretionary`

## ML Motoru (Gerçek Veriyle Eğitildi)

### Risk Predictor — XGBoost
- **Eğitim seti:** 24,303 işlem (BudgetWise + Financial Transactions birleşik)
- **AUC-ROC:** 0.9999
- **Impulsive base rate:** 6.9% (gerçekçi)
- **Top features:** `is_discretionary` (55.9%) → `amount_zscore_user` (25.4%) → `user_avg_amount` (14.8%)

### Budget Regressor — RandomForest
- **Eğitim seti:** 3,000 aylık snapshot × 10 feature
- **MAPE:** 0.31 (gerçek veride beklenen profesyonel sonuç)
- **Top features:** `monthly_income`, `monthly_expense_total`, `essential_spending`, `discretionary_spending`, `credit_score`

## RFM Risk Skoru (Ters Çevrilmiş)

Pazarlama dünyasında müşteri sadakatini ödüllendiren RFM analizi, projede **finansal risk** ölçütüne dönüştürülmüştür:

```
RFM_Risk = (0.20 × R_score) + (0.45 × F_score) + (0.35 × M_score)
```

| Skor Aralığı | Segment | Ajan Stratejisi |
|---|---|---|
| 1.00 – 2.00 | **Sadık Tasarrufçu** | `positive_reinforcement`: tasarrufu öv, yatırım öner |
| 2.01 – 3.50 | **Risk Potansiyeli** | `social_norms` / `planning`: benzer profil verileri, gelecek hatırlatıcı |
| 3.51 – 5.00 | **İmpulsif / Kırılgan** | `loss_aversion`: kayıptan kaçınma, somut hedefe çapalama |

## Gemini Agent Detayları

- **Model:** `gemini-2.5-flash`
- **max_output_tokens:** 2048 (Gemini 2.5'in görünmez "thinking tokens" rezervi için kritik)
- **Sistem prompt:** Kahneman + Thaler temelli, 5 kuralla kısıtlanmış:
  1. En fazla 2 cümle
  2. Suçlayıcı/yargılayıcı kelime yasak
  3. Mutlaka uzun vadeli pozitif kazanım hatırlat
  4. Somut tutar belirt
  5. Empati ve eşit ton
- **Strateji seçimi:** RFM segment + risk olasılığına göre 4 strateji arası otomatik seçim
- **Mock fallback:** API key yoksa veya `USE_MOCK_GEMINI=true` ise deterministik mock — pipeline kesilmez

## Klasör Yapısı

```
mindfulspend-ai/
├── .github/workflows/ci_cd_pipeline.yml
├── backend/
│   ├── app/
│   │   ├── api/endpoints/      analyze, nudge, users, transactions, rfm
│   │   ├── core/               config.py, gemini_agent.py
│   │   ├── db/                 SQLAlchemy modelleri (User/Transaction/RfmScore/NudgeLog)
│   │   ├── ml_models/          risk_predictor.joblib, budget_regressor.joblib
│   │   ├── schemas/            Pydantic v2 modelleri
│   │   ├── services/           constants, etl, feature_engineering, ml_predictor, rfm, seeder
│   │   └── main.py             FastAPI entrypoint
│   ├── data/
│   │   ├── 01_raw/             personal_finance.csv, budgetwise_clean.csv,
│   │   │                       budgetwise_dirty.csv, transactions_expenses.csv,
│   │   │                       transactions_income.csv
│   │   ├── 02_interim/         (ETL ara çıktıları)
│   │   └── 03_processed/       (model-ready feature matrisleri)
│   ├── notebooks/              EDA + model eğitimi (jüri görsel kanıtları)
│   ├── scripts/                prepare_real_data.py, train_models.py
│   ├── tests/                  test_rfm.py, e2e_smoketest.py
│   ├── Dockerfile, requirements.txt, pyproject.toml, .env.local
└── frontend/
    └── src/
        ├── components/
        │   ├── ui/             Card, Badge, StatTile
        │   ├── Header, BudgetSummary, LiveTransaction, AgentNudgeCard
        │   ├── SpendingChart, RFMDashboard, TransactionFeed, NudgeHistory
        ├── pages/Dashboard.tsx
        ├── services/api.ts
        └── types/api.ts
```

## Hackathon 2026 Puanlama Matrisi

| Kriter | Puan | Karşılayan Bileşen |
|---|---|---|
| Uygulanabilirlik | 25 | REST API + Docker Compose + bankacılık-ready şema |
| Teknik Derinlik | 25 | XGBoost (AUC 0.9999) + RFM ters formülü + KNN + Fuzzy + 4/4 pytest |
| Yenilikçilik | 20 | Davranışsal finans × Gemini = "Karar Mimarı" konumlandırma |
| Arayüz | 10 | Karar yorgunluğu yaratmayan dark dashboard + animasyonlu nudge |
| **Agentic Bonus** | **+20** | **4 strateji seçimli ajan + context block + Gemini 2.5 Flash live** |

## Akademik Temeller

- **Kahneman, D.** — *Thinking, Fast and Slow* (Sistem 1/2, Prospect Theory)
- **Thaler, R. & Sunstein, C.** — *Nudge: Improving Decisions About Health, Wealth, and Happiness*
- *AI-Powered Spending Habits Coach* (IJRASET, 2025)
- *From Behavioral Interventions to Algorithmic Architecture* (Advances in AI/ML, 2025)
- *Architectures of Influence: AI-Powered Nudging, Investor Behaviour* (LUISS Thesis, 2024)

## Lisans

MIT — bkz. [LICENSE](./LICENSE)

---

<div align="center">

*"Bütçe bir kısıtlama değil, hedeflerine giden bir köprüdür."*

</div>
