# 🚀 MindfulSpend AI — Onboarding (Kayıt & Kurulum) Modülü Çalışma Mantığı Raporu

Onboarding modülü, kullanıcının sisteme ilk giriş yaptığı anda davranışsal finans analizlerinin (RFM, XGBoost ve Gemini) sağlıklı yapılabilmesi için temel demografik ve finansal bilgilerin toplandığı kritik bir kapıdır.

---

## 1. Modülün Genel Amacı ve Önemi
Yapay zeka modellerinin kişiye özel tahminler yapabilmesi için statik varsayımlar yerine kullanıcının **gerçek** bütçesini, yaşını, sabit faturalarını ve hayallerini (hedeflerini) bilmesi gerekir. Onboarding modülü, kullanıcının bütçe profilini sıfırdan kurar ve onboarding tamamlanmadan kullanıcının Dashboard'a veya markete girmesine izin vermez (güvenlik ve veri bütünlüğü bariyeri).

---

## 2. Ön Yüz (Frontend) Adımları ve Arayüz Akışı

Onboarding süreci `Onboarding.tsx` dosyasında yönetilir ve tam **4 adımdan (Step)** oluşur:

### 1. Adım: Gelir ve Yaş Sorgulama (Step 1)
*   **Toplanan Veriler:** Aylık Net Maaş (₺) ve Kullanıcı Yaşı.
*   **Önemi:** Maaş, bütçe kullanım skorunun tabanını oluşturur. Yaş ise, XGBoost modelinin impulsif harcama tahminleri için kullandığı en önemli özniteliklerden (features) biridir.
*   **Arayüz:** Büyük fontlu, 3D input alanları ve lüks mor renk vurguları.

### 2. Adım: Sabit Giderler (Step 2)
*   **Toplanan Veriler:** Kullanıcının her ay ödemek zorunda olduğu faturalar, kira veya abonelikler (Gider adı, Tutarı, Kategorisi ve Ayın hangi günü ödendiği).
*   **Önemi:** Bu giderlerin toplamı, kullanıcının "Net Harcanabilir Gelirini" (Disposable Income) belirler. Asistan harcanabilir bütçeye göre uyarı verir.
*   **Arayüz:** Dinamik satır ekleme/çıkarma ("Gider Ekle") butonlarıyla son derece esnek bir tablo.

### 3. Adım: İlk Birikim Hedefi (Step 3)
*   **Toplanan Veriler:** Birikim hedefi başlığı (örn: Acil Durum Fonu), Hedef Tutar, Hedef Tarih, Kategori (Acil Durum, Ev, Araba, Tatil) ve Öncelik derecesi.
*   **Önemi:** Dürtüsel harcama anında Gemini'nin kullanıcıyı vazgeçirmek için "çapalayacağı" (somut olarak hatırlatacağı) birikim hedefi burada kurulur.

### 4. Adım: Davranışsal Finans Risk Seçimi (Step 4)
*   **Toplanan Veriler:** Kullanıcının harcama tarzına göre kendi seçtiği risk profili:
    *   **Tutumlu / Muhafazakar (Conservative):** Harcama yaparken çok düşünen.
    *   **Dengeli (Moderate):** Planlı harcayan.
    *   **Dürtüsel / Har vurup harman savuran (Impulsive):** Alışverişte kendini tutamayan.
*   **Önemi:** Gemini'nin kullanıcıyla kuracağı empati dilinin tonunu belirler.

---

## 3. Arka Plan (Backend) API Entegrasyonu ve Veri Yapısı

Kullanıcı 4. adımı tamamlayıp "Sistemi Kur" butonuna bastığında, frontend arka plandaki `/onboarding/complete` (POST) API ucuna aşağıdaki Pydantic şemasını gönderir:

```json
{
  "monthly_salary": 45000.0,
  "age": 28,
  "fixed_expenses": [
    {
      "name": "Kira",
      "amount": 12000.0,
      "category": "housing",
      "due_day": 1
    }
  ],
  "goals": [
    {
      "title": "Acil Durum Fonu",
      "target_amount": 50000.0,
      "current_amount": 0.0,
      "target_date": "2026-12-31",
      "category": "emergency",
      "priority": 1
    }
  ],
  "risk_profile": "moderate"
}
```

### Backend İşleyiş Mantığı (`onboarding.py`):
1. **Kullanıcı Güncelleme:** Giriş yapmış kullanıcının `monthly_salary`, `age`, `risk_profile` ve `onboarding_completed=True` alanları veritabanında güncellenir.
2. **Sabit Giderlerin Kaydı:** Payload içerisindeki her bir sabit gider `FixedExpense` tablosuna `user_id` ile ilişkilendirilerek tek tek kaydedilir.
3. **Hedefin Kaydı:** Birikim hedefi `Goal` tablosuna başlangıç birikim tutarı `0 TL` olacak şekilde eklenir.
4. **Veritabanı Commiti:** Tüm işlemler tek bir veritabanı transaction'ı içinde gerçekleştirilir. Hata alınırsa `rollback` yapılarak veri kirliliği önlenir.

---

## 4. Onboarding Tamamlandığında Tetiklenen Sistemler
Onboarding başarıyla tamamlandığı an sistemde aşağıdaki zincirleme reaksiyonlar tetiklenir:
*   **Token Yenileme:** Kullanıcı verileri güncellenerek JWT token yenilenir ve kullanıcı doğrudan `/dashboard` sayfasına yönlendirilir.
*   **İlk RFM Skorlama:** Sistem kullanıcının geçmiş harcaması olmadığı için ilk RFM skorunu güvenli yedek olarak **"Sadık Tasarrufçu" (Risk: 1.00)** segmentiyle başlatır.
*   **Yapay Zeka Hazırlığı:** Gemini Chat ve Nudge motorları, onboarding ile girilen maaş, yaş ve hedefleri belleklerine alarak canlı asistan hizmeti sunmaya anında hazır hale gelir.
