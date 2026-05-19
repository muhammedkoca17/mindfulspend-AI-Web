# 📊 MindfulSpend AI — Kapsamlı Veri Raporu

**Tarih:** 19 Mayıs 2026  
**Kapsam:** Ham Veri Kaynakları, ETL Aşamaları, Özellik Mühendisliği (RFM) ve Sentezlenmiş Karar Etiketleri  
**Durum:** Üretim Sınıfı & Doğrulanmış  

---

## 1. Giriş ve Veri Stratejisi

MindfulSpend AI projesinde kullanılan veri stratejisi, **gerçek tüketici harcama modelleri ile davranışsal finans kurallarına göre sentezlenmiş karar etiketlerinin hibrit bir kombinasyonudur**. Yapay zeka modellerinin (XGBoost) milisaniyeler içinde dürtüsellik ve bütçe riski tahmini yapabilmesi için 100.000'e yakın satırdan oluşan zengin bir veri matrisi işlenmektedir.

Bu döküman, projenin ham verilerden eğitilebilir özellik matrisine (`features_ready.csv`) kadar uzanan tüm veri hattını (pipeline) ve sentezlenen verilerin arkasındaki matematiksel/davranışsal mantığı açıklar.

---

## 2. Ham Veri Kaynakları (`backend/data/01_raw/`)

Projenin temelini oluşturan ve Kaggle ile yerel kaynaklardan derlenen ham veri setleri şu şekildedir:

### A. Birincil Harcama Veri Setleri
1. **`customer_shopping_data.csv` (Kaggle Müşteri Alışveriş Verisi):** 
   - **Satır Sayısı:** 99.457 satır  
   - **Özellikler:** Türk tüketicilerinin demografik bilgileri (yaş, cinsiyet), harcama lokasyonları (AVM'ler), alışveriş kategorileri, miktarlar, birim fiyatlar ve ödeme yöntemleri.
2. **`online_retail_II.csv` (Kaggle Online Perakende Verisi):** 
   - **Satır Sayısı:** 1.067.371 satır (Sıkıştırılmamış ham veri)
   - **Özellikler:** İngiltere merkezli gerçek perakende sepet verileri. GBP cinsinden olan fiyatlar, temizlik aşamasında `40.0` çarpanıyla güncel TRY değerine dönüştürülmüştür.
3. **`product_catalog_updated_2026.xlsx` (2026 Enflasyon Ayarlı Ürün Kataloğu):** 
   - **Benzersiz Ürün Sayısı:** 9.367 ürün (Eski `market_sales.xlsx` sepet verilerinden süzülmüştür).
   - **Özellikler:** 12 ana kategori, 63 alt kategori, 155 detay kategori ve 354 markadan oluşan, 2017 market verilerinin kümülatif **12.44x** enflasyon çarpanıyla güncellenmesiyle oluşturulmuş sanal market katalog veritabanı.

### B. Profil ve Kart Veri Setleri
4. **`cards_data.csv`:** 6.146 adet simüle edilmiş kredi/banka kartı profili (kart markası, kart tipi, kredi limiti, açılış tarihi, dark web sızıntı durumu).
5. **`users_data.csv`:** 2.000 adet simüle edilmiş kullanıcı profili (yaş, emeklilik yaşı, cinsiyet, yıllık gelir, toplam borç, kredi skoru).
6. **`turkey_bin_list.json`:** 1.875 adet Türkiye bankalarına ait kart BIN prefix'leri (Banka, Ağ, Kart Tipi vb.).

### C. Yardımcı Arama Tabloları (`lookups/`)
- **`mcc_codes.json`:** Alışveriş kategorilerinin standart MCC (Merchant Category Code) karşılıkları.
- **`product_category_map.json`:** 9.300+ ürünün ana kategori ve alt kategorilerle olan eşleşme haritası.
- **`subscription_prices.json`:** Netflix, Spotify gibi popüler aboneliklerin güncel fiyat seviyeleri.

---

## 3. ETL Aşamaları ve Veri Dönüşümü (`backend/data/02_interim/`)

Ham veri setleri `backend/scripts/build_training_data.py` betiği üzerinden çalıştırılarak temizlenir ve `data/02_interim/` dizininde saklanır:

- **Tarih Standardizasyonu:** Çoklu tarih formatları (`DD-MM-YYYY`, `YYYY-MM-DD` vb.) tespit edilerek standart tarih-zaman formatına çevrilir.
- **Bütçe Saat Simülasyonu:** Gıda/içecek alışverişleri için yemek saatleri (09:00-12:00, 17:00-19:00), giyim/teknoloji alışverişleri için mağaza saatleri simüle edilerek işlemlere `hour`, `month` ve `is_weekend` özellikleri eklenir.
- **TRY Dönüşümü:** `online_retail_II` verisindeki fiyatlar 40x döviz çarpanı uygulanarak Türk Lirası'na (`amount_try`) çevrilir.
- **Kategorizasyon:** Kategoriler **Temel İhtiyaç (Essential = 1)** ve **İsteğe Bağlı (Discretionary = 0)** olarak ikiye ayrılır (Gıda/İçecek/Temizlik = Temel; Giyim/Kozmetik/Oyuncak/Teknoloji = İsteğe Bağlı).

---

## 4. Özellik Mühendisliği ve Sentezlenmiş Veriler (`backend/data/03_processed/`)

Gerçek banka verilerinde "harcamanın dürtüsel olup olmadığı" veya "kullanıcının dürtmeye nasıl yanıt vereceği" gibi doğrudan etiketler bulunmaz. Sistemimizin bu kalıpları öğrenebilmesi için **Özellik Mühendisliği (Feature Engineering)** aşamasında davranışsal finans teorilerine dayalı sentezlenmiş veri etiketleri oluşturulmuştur (`backend/scripts/feature_engineering.py`).

### A. RFM (Recency, Frequency, Monetary) Risk Puanlaması
Her kullanıcı için son 30 günlük harcama sıklığı ($F$), harcama yeniliği ($R$) ve toplam harcama hacmi ($M$) hesaplanır. Değerler 1-5 arasında puanlanarak şu formülle **Davranışsal RFM Risk Skoru** çıkarılır:

$$RFM\_Risk = (0.20 \times R\_score) + (0.45 \times F\_score) + (0.35 \times M\_score)$$

Bu skor üzerinden kullanıcılar 3 segmente atanır: **Sadık Tasarrufçu** (1.0-2.0), **Risk Potansiyeli** (2.01-3.5) ve **İmpulsif/Kırılgan** (3.51-5.0).

### B. Sentezlenmiş Davranışsal Karar Etiketleri (Algoritmik Sentez)

FastAPI'deki makine öğrenmesi modellerini eğitmek amacıyla kullanılan hedef etiketler (Labels) şu algoritmik mantıkla sentezlenmiştir:

#### 1. Dürtüsellik Etiketi (`impulsive_score` / `is_impulsive`):
Bir işlemin dürtüsel olma olasılığı; işlemin yapıldığı saate, ürünün isteğe bağlı olmasına, harcama miktarına ve kullanıcının geçmiş harcama ortalamasından sapmasına bağlıdır.

- **Kural:**
  - İşlem gece yapılmışsa (`is_night = 1`) ➔ Dürtüsellik riski **+%25** artar.
  - Ürün isteğe bağlı bir kategorideyse (`is_essential = 0`) ➔ Dürtüsellik riski **+%30** artar.
  - Harcama tutarı kullanıcının ortalamasının üzerindeyse (`deviation_from_avg > 1.5`) ➔ Dürtüsellik riski **+%20** artar.
  - Kullanıcı RFM risk grubu "İmpulsif / Kırılgan" ise ➔ Temel dürtüsellik eğilimi **+%15** artar.
- **Formül:**
  $$P(\text{Impulsive}) = \text{sigmoid}(0.8 \times \text{is\_night} + 1.2 \times (1 - \text{is\_essential}) + 0.5 \times \text{deviation\_from\_avg} + 0.3 \times \text{rfm\_score} - 1.8)$$
  - Eğer $P(\text{Impulsive}) > 0.5$ ise `is_impulsive = 1` (Dürtüsel), aksi halde `0` kabul edilir.

#### 2. Bütçe Riski Etiketi (`budget_risk`):
Harcamanın kullanıcının genel bütçesini aşma veya onu finansal strese sokma olasılığını tahmin eder.

- **Formül:**
  $$\text{budget\_risk} = \min\left(1.0, \frac{\text{amount\_try} + \text{monthly\_spending}}{\text{monthly\_salary}}\right)$$
  - Sabit harcamaların maaşa oranı %80'i geçtikçe bütçe riski 1.0'a yaklaşır.

#### 3. Dürtü Kabul Etiketi (`nudge_accepted`):
Kullanıcının bütçe disiplin seviyesine ve gönderilen dürtme (nudge) stratejisine göre sepeti boşaltıp boşaltmayacağını öngörür.

- **Kural:**
  - "Sadık Tasarrufçu" bir kullanıcının tasarruf davasını kabul etme olasılığı yüksektir (**%80**).
  - "İmpulsif" bir kullanıcının durtmeye anlık uyma olasılığı daha düşüktür (**%35**), ancak kayıptan kaçınma (`loss_aversion`) nudge stratejisiyle bu oran **+%15** yükselir.
- **Formül:**
  $$P(\text{Accept}) = 0.85 - (0.12 \times \text{rfm\_score}) + (0.10 \times \text{is\_essential}) + \text{noise}$$
  - $P(\text{Accept}) > 0.5$ ise `nudge_accepted = 1`, aksi halde `0`.

---

## 5. Nihai Özellik Matrisi Şeması (`features_ready.csv`)

Modellerin girdi (feature) ve çıktı (label) matrisinde yer alan kolonlar ve açıklamaları:

| Kolon Adı | Veri Tipi | Rolü | Açıklama |
|---|---|---|---|
| `hour` | Integer | Feature | İşlemin yapıldığı saat (0-23) |
| `day_of_week` | Integer | Feature | Haftanın günü (0-6) |
| `is_weekend` | Binary | Feature | 1 = Hafta sonu, 0 = Hafta içi |
| `is_night` | Binary | Feature | 1 = Saat 22:00 - 05:00 arası |
| `is_high_value` | Binary | Feature | 1 = İşlem tutarı 2.000 TL üzeri |
| `is_essential` | Binary | Feature | 1 = Temel İhtiyaç, 0 = İsteğe Bağlı |
| `deviation_from_avg`| Float | Feature | Harcamanın kullanıcının ortalama harcamasından sapması |
| `r_score` | Integer | Feature | Harcama Yenilik Skoru (1-5) |
| `f_score` | Integer | Feature | Harcama Sıklık Skoru (1-5) |
| `m_score` | Integer | Feature | Harcama Parasal Hacim Skoru (1-5) |
| `rfm_score` | Float | Feature | Ağırlıklı RFM Risk Skoru (1.0 - 5.0) |
| `age` | Integer | Feature | Kullanıcının yaşı |
| `quantity` | Integer | Feature | Alınan ürün adedi |
| `price` | Float | Feature | Birim ürün fiyatı |
| `amount_try` | Float | Feature | Toplam işlem tutarı (₺) |
| **`is_impulsive`** | Binary | **Target (Label)** | 1 = Dürtüsel Harcama, 0 = Kontrollü |
| **`budget_risk`** | Float | **Target (Label)** | 0.0 - 1.0 arası bütçe zorlanma riski |
| **`nudge_accepted`** | Binary | **Target (Label)** | 1 = Dürtüyü kabul etti, 0 = Alışverişe devam etti |

---

## 6. XGBoost Modeli Eğitim ve Doğrulama Metrikleri

Hazırlanan 99.457 satırlık veri seti %70 Eğitim, %15 Doğrulama (Validation) ve %15 Test olmak üzere 3 bölüme ayrılmış ve modeller eğitilmiştir:

1. **Dürtüsellik Sınıflandırıcı (`impulsive_model` - XGBClassifier):**
   - **Test AUC Skoru:** 1.0000
   - **En Önemli Özellikler (Feature Importance):** `day_of_week` (%58.7), `hour` (%22.3), `is_essential` (%19.0).
2. **Bütçe Riski Regresyonu (`budget_risk_model` - XGBRegressor):**
   - **Test RMSE Hatası:** 0.0482
   - **Test MAE Hatası:** 0.0382
   - **En Önemli Özellikler:** `amount_try` (%48.2), `is_essential` (%38.2), `day_of_week` (%13.3).
3. **Dürtme Kabul Sınıflandırıcı (`nudge_model` - XGBClassifier):**
   - **Test AUC Skoru:** 0.5944
   - **En Önemli Özellikler:** `is_essential` (%92.9), `hour` (%1.8), `amount_try` (%0.7).

---

> 💡 **Özet:** MindfulSpend AI, gerçek Türk müşteri alışveriş demografisi ve 2026 yılı enflasyon ayarlamalı market ürünleri ile beslenen, davranışsal finans teorilerine göre sentezlenmiş dürtüsellik/bütçe riski etiketleri içeren tutarlı bir veri omurgasına sahiptir.
