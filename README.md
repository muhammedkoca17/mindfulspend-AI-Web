<div align="center">

# MindfulSpend AI

### Davranışsal Finans Tabanlı Otonom Bütçe Yönetimi

**Hackathon 2026 — Finans & E-Ticaret Dikeyi**

*XGBoost + RFM Risk Skorlama + Google Gemini 2.5 Flash ile hiper-kişiselleştirilmiş, dürtüsel harcamayı önleyen "Karar Mimarı" bir AI asistanı.*

[![Real Data](https://img.shields.io/badge/data-Kaggle%20real-emerald)]() [![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue)]() [![Status](https://img.shields.io/badge/status-production%20ready-success)]()

---

</div>

## 🌌 Vizyon

Geleneksel bütçe uygulamaları **geçmişe dönük** raporlar sunar. MindfulSpend AI, harcama anında devreye giren **proaktif bir finansal koçtur**. Kahneman'ın **Beklenti Teorisi** ve Thaler'in **Nudge (Dürtme) Teorisi** ile akademik zemine oturan sistem, kullanıcının "Sistem 1" (dürtüsel/duygusal) ve "Sistem 2" (rasyonel/analitik) karar mekanizmalarını ayırt eder; suçluluk uyandıran statik uyarılar yerine *kayıptan kaçınma* psikolojisini olumlu yöne çeviren dinamik "dürtmeler" üretir.

### 💬 Canlı Örnek (Gerçek Gemini Çıktısı)
> **Senaryo:** Kullanıcı gece saat 02:45'te bir teknoloji mağazasından veya kafeden 5.500 TL tutarında "isteğe bağlı" harcama yapmaya çalışıyor.
> **MindfulSpend AI Nudge'ı:**
> *"Bu 5.500 TL'yi onaylamak yerine 'Acil Durum Fonu' hedefine aktarırsan, hayalindeki güvenceye tam 8 gün daha erken ulaşacaksın. Bu dürtüsel harcamayı erteleyip hedefine bir adım daha yaklaşmak ister misin?"*

---

## 🏗️ Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────┐
│                    KULLANICI (React + Vite SPA)                 │
│  LiveTransaction  │  AgentNudgeCard  │  RFMDashboard             │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST + Axios (TanStack Query)
┌──────────────────────────────▼──────────────────────────────────┐
│              BACKEND (FastAPI + SQLAlchemy + SQLite)            │
│  /analyze  /nudge  /transactions  /goals  /rfm  /cart  /health  │
└──────┬──────────────────┬──────────────────┬───────────────────┘
       │                  │                  │
┌──────▼────────┐ ┌───────▼────────┐ ┌──────▼──────────────┐
│  ML MOTORU    │ │ DAVRANIŞSAL    │ │  GEMINI 2.5 FLASH   │
│  XGBoost      │ │ SKORLAMA       │ │  (Function Calling) │
│  Classifiers  │ │ RFM Risk       │ │  Nudge Üretici      │
└───────────────┘ └────────────────┘ └─────────────────────┘
       ▲                  ▲                  ▲
       └──────────────────┴──────────────────┘
                           │
             ┌─────────────▼─────────────┐
             │   GERÇEK VERİ HATTI       │
             │   01_raw → 02_interim     │
             │        → 03_processed     │
             └───────────────────────────┘
```

---

## 🛠️ Teknoloji Yığını

| Katman | Teknolojiler |
|---|---|
| **Veri ve ETL** | Pandas, NumPy, scikit-learn (KNN Imputer), RapidFuzz (Levenshtein Fuzzy Match) |
| **Makine Öğrenmesi (ML)** | XGBoost (Classifier & Regressor), joblib |
| **Backend API** | FastAPI 0.115, SQLAlchemy 2.0, Pydantic v2, Uvicorn |
| **AI Agent & LLM** | Google Gemini **2.5 Flash** (Function Calling & Canlı Araç Entegrasyonu) |
| **Frontend UI** | React 18, Vite, TypeScript, Tailwind CSS, Recharts (Dinamik Grafikler), Framer Motion |
| **Veritabanı** | SQLite (Geliştirme/Demo) / PostgreSQL Uyumlu |
| **CI/CD & Kalite** | GitHub Actions, PyTest, Ruff (Linter & Formatter) |

---

## 📊 1. Gerçek Veri Stratejisi

MindfulSpend AI, uydurma veriler yerine **gerçek tüketici harcama modelleri ve bankacılık BIN verilerinden oluşan hibrit bir veri kümesi** üzerinde eğitilmiştir. `backend/data/01_raw/` dizininde yer alan gerçek veri dosyaları şunlardır:

1.  **`customer_shopping_data.csv` (Müşteri Alışveriş Verisi):** 
    Türk tüketicilerinin demografik özelliklerini (yaş, cinsiyet), alışveriş konumlarını, harcama miktarlarını, ödeme yöntemlerini ve kategorilerini barındıran zengin veri tabanı.
2.  **`online_retail_II.csv` (Online Perakende Verisi):** 
    2009-2011 yılları arasındaki gerçek işlem satırları. GBP (İngiliz Sterlini) cinsinden olan fiyatlar, pipeline üzerinde `40.0` çarpanıyla güncel TRY değerine dönüştürülmüştür.
3.  **`market_sales.xlsx` (Süpermarket Satış Verisi):** 
    Süpermarket sepet yapıları ve temel gıda harcamalarının sıklık analizi için kullanılan Excel veri tabanı.
4.  **`cards_data.csv` & `users_data.csv`:** 
    Kullanıcıların kart tipleri (debit/credit), banka ilişkileri ve demografik bütçe profilleri.
5.  **`turkey_bin_list.json` (Türkiye BIN Listesi):** 
    Türkiye'deki tüm bankalara ait kart BIN numaraları, kart tipleri ve marka eşleşmeleri.
6.  **`lookups/` (`mcc_codes.json`, `product_category_map.json`, `subscription_prices.json`):** 
    Kategorilerin MCC (Merchant Category Code) karşılıkları, ürün eşleşmeleri ve abonelik fiyat basamakları.

---

## ⚙️ 2. Üretim Sınıfı ETL ve Özellik Mühendisliği Hattı

Hatalı ve kirli verileri temizleyip makine öğrenmesine hazır hale getiren 3 aşamalı veri hattımız `backend/scripts/` dizinindeki betiklerle otonom olarak çalışır:

### Adım 1 & 2: Keşifsel Veri Analizi ve Temizlik (`build_training_data.py`)
*   Ham verileri (`01_raw/`) okur ve detaylı veri profilleme yaparak `data/02_interim/eda_report.txt` keşif raporunu çıkarır.
*   `customer_shopping_data.csv` verilerini temizleyerek `shopping_clean.csv` oluşturur. Tarihleri normalize eder, harcama saatlerini ve hafta sonu etiketlerini türetir. Kategorileri **Temel İhtiyaç (Essential)** ve **İsteğe Bağlı (Discretionary)** olarak etiketleyip MCC kodlarını atar.
*   `online_retail_II.csv` verilerini temizleyerek `retail_clean.csv` oluşturur. Müşteri kimliği eksik satırları eler, fiyatları TRY'ye çevirir.

### Adım 3: Özellik Mühendisliği ve Davranışsal Profilleme (`feature_engineering.py`)
*   Kullanıcı bazlı **RFM (Recency, Frequency, Monetary)** puanlarını hesaplar. En son harcama yeniliği ($R$), sıklık ($F$) ve parasal hacim ($M$) değerlerini 1-5 puan aralığında ölçeklendirerek `rfm_scores.csv` olarak kaydeder.
*   **Vektörel Özellik Mühendisliği:** Kullanıcının geçmiş harcama ortalamasını (`avg_amount`) ve oynaklığını (`std_amount`) çıkarır. İşlemin bu ortalamadan sapma skorunu (`deviation_from_avg`), gece harcaması (`is_night`) ve yüksek hacimli harcama (`is_high_value`) durumlarını vektörel olarak hesaplar.
*   **Sentezlenmiş Karar Etiketleri:** Dürtüsellik skorunu (`impulsive_score`), bütçe riskini (`budget_risk`) ve kullanıcının dürtmelere verdiği yanıtı (`nudge_accepted`) matematiksel formüllerle sentezleyip `data/03_processed/features_ready.csv` dosyasına yazar.

---

## 🤖 3. XGBoost Tabanlı Yapay Zeka Karar Motoru

Sistemimiz, özellik mühendisliği aşamasında hazırlanan veri kümesi üzerinde eğitilen ve tekil işlemler için milisaniyeler seviyesinde çıkarım yapan **3 adet gelişmiş makine öğrenmesi modeli** barındırır (`backend/scripts/train_xgboost.py`):

1.  **Dürtüsellik Sınıflandırma Modeli (`impulsive_model` - XGBClassifier):**
    İşlemin yapıldığı saat, gün, temel/isteğe bağlı durumu ve harcama sapmasına bakarak harcamanın dürtüsel (impulsive) olup olmadığını tahmin eder.
2.  **Bütçe Risk Regresyon Modeli (`budget_risk_model` - XGBRegressor):**
    Harcamanın kullanıcının genel bütçe limitlerini aşma veya onu finansal strese sokma riskini (0.0 - 1.0 arası) tahmin eder.
3.  **Dürtme Kabul Modeli (`nudge_model` - XGBClassifier):**
    Kullanıcının o anki psikolojik durumuna ve harcama alışkanlığına göre atılacak bir tasarruf dürtmesini (nudge) kabul edip etmeyeceğini (sepeti boşaltıp boşaltmayacağını) öngörür.

*Eğitilen modeller `backend/app/ml_models/` dizinine `.joblib` formatında kaydedilir ve FastAPI sunucu açılışında **Singleton (Tekil Bellek)** olarak belleğe yüklenir.*

### Model Girdi Özellikleri (Features):
Modellerimiz çıkarım anında şu 15 temel dinamik özelliği kullanır:
`hour`, `day_of_week`, `is_weekend`, `is_night`, `is_high_value`, `is_essential`, `deviation_from_avg`, `r_score`, `f_score`, `m_score`, `rfm_score`, `age`, `quantity`, `price`, `amount_try`.

---

## 📈 4. Davranışsal Finans: Davranışsal RFM Risk Modeli

Pazarlama dünyasında "müşteri sadakatini" ödüllendiren klasik RFM formülünü, **finansal harcama riskini** ölçecek şekilde tersine çevirdik. Bir kullanıcının *isteğe bağlı (discretionary)* harcamalarındaki yenilik, sıklık ve tutar arttıkça finansal riski yükselir.

### Matematiksel Risk Formülü:
$$RFM\_Risk = (0.20 \times R\_score) + (0.45 \times F\_score) + (0.35 \times M\_score)$$

Burada her bir bileşen ($R, F, M$) 30 günlük hareketli pencerelerde 1 ile 5 arasında puanlanır. Hesaplanan genel `RFM_Risk` değeri (1.0 - 5.0) kullanıcının davranışsal finans segmentini belirler:

| Puan Aralığı | Davranışsal Segment | Yapay Zeka (Gemini) Dürtme Stratejisi |
|---|---|---|
| **1.00 – 2.00** | **Sadık Tasarrufçu** (Loyal Saver) | `positive_reinforcement` (Tasarrufu öv, birikimi yatırıma yönlendir) |
| **2.01 – 3.50** | **Risk Potansiyeli** (At-Risk Spender) | `social_norms` veya `planning` (Benzer harcama gruplarıyla kıyaslama, gelecek planlama) |
| **3.51 – 5.00** | **İmpulsif / Kırılgan** (Impulsive Spender) | `loss_aversion` (Uzun vadeli hedeflerle ilişkilendir, kayıptan kaçınma) |

---

## 🧠 5. Canlı Gemini Ajanı & Fonksiyon Çağırma (Function Calling)

Sistemimiz `gemini-2.5-flash` modelini proaktif bir ajan olarak konumlandırır. Sepet onaylama (checkout) ekranında Gemini, kullanıcının gerçek finansal verilerini sorgulamak ve analiz etmek için **otonom olarak 4 farklı fonksiyonu (aracı) çağırabilir**:

### Gemini Ajanının Kullanabildiği Fonksiyonlar (Tools):
1.  **`get_user_financial_state`**: Kullanıcının aylık net gelirini, sabit giderlerini ve risk profilini çeker.
2.  **`get_cart_analysis`**: Alışveriş sepetindeki temel ve isteğe bağlı ürünlerin tutar dağılımını hesaplar.
3.  **`get_user_goals`**: Kullanıcının biriktirmeye çalıştığı aktif finansal hedefleri listeler.
4.  **`calculate_goal_impact`**: Yapılacak isteğe bağlı harcamanın, kullanıcının hedefine ulaşmasını kaç gün geciktireceğini matematiksel olarak hesaplar.

### Güvenli Çevrimdışı Mod (Mock Fallback):
FastAPI sunucumuz, `GEMINI_API_KEY` tanımlanmamışsa veya `USE_MOCK_GEMINI=true` ise deterministik bir **Behavioral Mock Engine** devreye sokar. Bu sayede sunucu ve ön yüz akışı kesilmeden, aynı psikolojik kurallara uyan Türkçe dürtmeler üretilmeye devam eder.

---

## 💎 6. Premium Arayüz ve Sunum Katmanları

*   **RFM Zaman Serisi Analizi:** Kullanıcının son 2 aydaki finansal davranış değişimini kronolojik olarak gösteren, risk puanı seyrini (Area Chart) ve alt bileşen skorlarını (Line Chart) Recharts ile görselleştiren özel analitik ekranı.
*   **Sanal Market (Virtual Market):** Dürtüsel harcamanın harcama anında nasıl engellendiğini jüriye canlı göstermek için tasarlanan ürün sepeti ve checkout simülasyonu.
*   **Canlı Gemini Chat Asistanı (✨):** Ekranın sağ altında yer alan parıltılı asistan butonu. Kullanıcıyla canlı konuşur, bütçesini sorgular ve finansal hedeflerine ulaşması için öneriler sunar.

---

## 🚀 Hızlı Başlangıç ve Kurulum

### Önkoşullar
*   Python 3.11+
*   Node.js 20+

---

### 💻 1. Arka Plan (Backend) Kurulumu ve Modellerin Eğitimi

1.  **Gerekli kütüphaneleri kurun:**
    ```powershell
    cd backend
    python -m venv .venv
    .\.venv\Scripts\activate
    pip install -r requirements.txt
    ```

2.  **Gerçek verilerle ETL hattını çalıştırın ve modelleri eğitin:**
    ```powershell
    # Adım 1 & 2: Verileri oku, temizle ve ara veriyi oluştur
    python scripts/build_training_data.py

    # Adım 3: RFM hesapla ve makine öğrenmesi özellik matrisini hazırla
    python scripts/feature_engineering.py

    # Adım 4 & 5 & 7: 3 adet XGBoost modelini eğit, joblib olarak kaydet ve metrikleri bas
    python scripts/train_xgboost.py
    ```

3.  **Çevresel Değişkenleri Ayarlayın:**
    `backend/` altında bir `.env.local` dosyası oluşturun ve Gemini API anahtarınızı ekleyin (Yoksa mock mod otomatik devreye girer):
    ```env
    GEMINI_API_KEY=AIzaSy...
    DATABASE_URL=sqlite:///./data/mindfulspend.db
    ```

4.  **Jüri Canlı Simülasyon Hesabını Tohumlayın (Seeding):**
    Jürinin boş bir ekran görmemesi, son 2 aylık finansal geçmişin, 60+ işlemin ve zaman serisi grafiklerinin anında yüklenebilmesi için özel tohumlama scriptini çalıştırın:
    ```powershell
    python seed_test_user.py
    ```
    *   **Oluşturulan Giriş Bilgileri:**
        *   **E-posta:** `test.jury@mindfulspend.ai`
        *   **Şifre:** `12345678` *(Jüri kolaylığı için hem bu şifre hem de hash'lenmiş veritabanı şifresi eşzamanlı aktiftir!)*

5.  **FastAPI Sunucusunu Başlatın:**
    ```powershell
    uvicorn app.main:app --reload --port 8000
    ```

---

### 💻 2. Ön Yüz (Frontend) Kurulumu

Yeni bir terminal açarak:
```powershell
cd frontend
npm install
npm run dev
```
Uygulama tarayıcınızda **`http://localhost:5173`** adresinde açılacaktır.

---

### 🧪 3. Doğrulama ve Testler

*   **API Sağlık Kontrolü:** `http://localhost:8000/health` adresine tarayıcıdan gidin. Modellerin ve Gemini'ın aktiflik durumunu görün:
    `{"status":"ok","models_ready":true,"gemini_enabled":true}`
*   **Otomatik Testleri Çalıştırma:** Arka plandaki tüm RFM ve matematiksel doğrulamaları test etmek için:
    ```powershell
    cd backend
    .\.venv\Scripts\pytest
    ```

---

## 📁 Dosya ve Dizin Yapısı

```
mindfulspend-ai/
├── README.md                           # Ana Dökümantasyon (Şu an okuduğunuz dosya)
├── PROJECT_AUDIT_REPORT.md             # Teknik Kod Denetim Raporu
├── docker-compose.yml                  # Konteyner Orkestrasyonu
├── backend/
│   ├── app/
│   │   ├── api/endpoints/              # API uç noktaları (auth, analyze, goals, rfm, cart, products)
│   │   ├── core/                       # Uygulama ayarları (config.py) ve Canlı Gemini Ajanı (gemini_agent.py)
│   │   ├── db/                         # SQLAlchemy modelleri (User, Transaction, Goal, FixedExpense, RfmScore)
│   │   ├── ml_models/                  # Eğitilmiş Model .joblib dosyaları, RFM lookups ve feature_columns.json
│   │   ├── schemas/                    # Pydantic v2 veri şemaları (user.py, transaction.py)
│   │   ├── services/                   # Karar motorları (etl.py, feature_engineering.py, ml_predictor.py, rfm.py)
│   │   └── main.py                     # FastAPI Uygulama Giriş Noktası
│   ├── data/
│   │   ├── 01_raw/                     # Gerçek ham Kaggle veri setleri (shopping, retail, cards, bin_list vb.)
│   │   ├── 02_interim/                 # Temizlenmiş ara tablolar ve eda_report.txt
│   │   └── 03_processed/               # Eğitime hazır özellik matrisi (features_ready.csv)
│   ├── scripts/                        # Veri hattı ve model eğitim betikleri (build_training_data, train_xgboost vb.)
│   ├── tests/                          # Otomatik doğrulamalar ve birim testleri (test_rfm.py)
│   ├── seed_test_user.py               # 2 aylık jüri simülasyon verisini tohumlayan script
│   └── requirements.txt                # Python bağımlılıkları
└── frontend/
    ├── src/
    │   ├── components/                 # Arayüz bileşenleri (RFMDashboard, SpendingChart, StatTile, LiveTransaction)
    │   ├── pages/                      # Sayfa şablonları (Dashboard.tsx, RfmAnalytics.tsx, Login.tsx, Onboarding.tsx)
    │   ├── services/api.ts             # Axios API Entegrasyonu
    │   └── types/api.ts                # TypeScript Tip Tanımlamaları
    └── package.json                    # Ön yüz paketleri ve bağımlılıkları
```

---

## 📜 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](./LICENSE) dosyasına göz atabilirsiniz.

<div align="center">

*"Bütçe bir kısıtlama değil, hayallerinize giden otonom bir köprüdür."*

</div>
