# MindfulSpend RFM (Recency, Frequency, Monetary) Aşaması A'dan Z'ye Kapsamlı Rapor (GÜNCELLENDİ)

Bu rapor, MindfulSpend projesinin RFM görselleştirme ve analiz aşamasının tamamlanan özelliklerini ve jüri sunumu için hazırlanan canlı test altyapısını açıklamaktadır.

---

## 1. RFM Nedir ve Bu Bölümün Amacı Ne?
**RFM (Recency, Frequency, Monetary)** e-ticaret ve pazarlamada müşterileri segmentlere ayırmak (gruplamak) için kullanılan küresel bir standarttır. Biz bunu **Davranışsal Finans** için yeniden tasarladık.

*   **R (Recency - Yenilik):** Kullanıcı en son ne zaman "isteğe bağlı" (zorunlu olmayan) bir harcama yaptı?
*   **F (Frequency - Sıklık):** Kullanıcı belirli bir zaman diliminde kaç kere isteğe bağlı harcama yaptı?
*   **M (Monetary - Parasal Değer):** Bu isteğe bağlı harcamaların toplam tutarı nedir?

**Amacımız:** Kullanıcının finansal olarak ne kadar "kırılgan" veya "dürtüsel" (impulsif) olduğunu matematiksel olarak kanıtlamak ve onu "Sadık Tasarrufçu", "Risk Potansiyeli" veya "İmpulsif / Kırılgan" olarak etiketlemektir.

---

## 2. Mimari ve Dosya Yapısı (Tamamlanan Aşama)

Sistemimiz hem backend hem de frontend tarafında jüriye sunum yapılabilecek tam entegre, dinamik bir yapıya kavuşturulmuştur:

### Arka Plan (Backend)
1.  **`backend/app/services/rfm.py` (RFM Hesaplama Motoru):** 
    Veritabanına bağlanır, kullanıcının `spending_type = "discretionary"` harcamalarını çeker ve ağırlıklarla çarparak genel bir `rfm_risk` skoru (1.0 - 5.0) çıkarır.
2.  **`backend/app/api/endpoints/rfm.py` (Yeni Geçmiş Servisi):**
    Jüri için zamanla değişen bir grafik çizebilmemiz için `/rfm/{user_id}/history` API ucu (endpoint) eklendi. Bu servis, kullanıcının geçmişe dönük haftalık RFM puanlarını kronolojik olarak döndürür. SQLite uyumluluğu için saat dilimi çakışmaları düzeltilmiş ve Windows Türkçe karakter sorunları giderilmiştir.

### Ön Yüz (Frontend)
1.  **`frontend/src/pages/RfmAnalytics.tsx` (RFM Sayfası):**
    Sol menüye "RFM Analizi" sekmesi olarak eklenen yepyeni, gösterişli ve dinamik bir arayüzdür.
    *   **Segment Durumu:** Jüriyi büyülemek amacıyla canlı göstergeler (Radial Bar) ve risk segment etiketi ile gösterilir.
    *   **RFM Risk Skoru Alan Grafiği (Area Chart):** Son 2 aydaki davranışsal risk gelişimini (güvenli yeşil bölgeden tehlikeli kırmızı bölgeye geçiş) gösterir.
    *   **R / F / M Bileşen Skorları Çizgi Grafiği (Line Chart):** Yenilik, Sıklık ve Parasal değer skorlarının haftalık bazda ayrı ayrı seyrini gösterir.
2.  **`frontend/src/services/api.ts`:**
    Backend'deki `/rfm/{user_id}/history` API ucunu frontend'e bağlayan `getRfmHistory` çağrısı entegre edilmiştir.

---

## 3. Canlı Jüri Test Hesabı ve 2 Aylık Veri Simülasyonu
Jüriye yapılacak sunumun canlı ve etkileyici durması için özel bir veri tohumlama (`seed_test_user.py`) senaryosu çalıştırılmıştır:

*   **E-posta Adresi:** `test.jury@mindfulspend.ai`
*   **Şifre:** `12345678`
*   **Veri Dağılımı (62 İşlem):**
    *   **Hafta 1-3 (Phase 1):** Kullanıcı çok tutumlu, sadece temel ihtiyaç harcamaları yapıyor. Puanı düşük, segmenti: **"Sadık Tasarrufçu"**.
    *   **Hafta 4-5 (Phase 2):** Ara sıra giyim, kafe ve restoran harcamaları ekleniyor. Davranışsal değişim başlıyor, segment: **"Risk Potansiyeli"**'ne geçiyor.
    *   **Hafta 6-8 (Phase 3):** Yoğun lüks harcamalar (Apple Store, PlayStation vb.) ekleniyor. RFM skoru tavan yapıyor ve segment: **"İmpulsif / Kırılgan"** oluyor.
*   Bu zengin veri sayesinde jüri, arayüzdeki zaman çizelgesinde harcama alışkanlıklarının zamanla nasıl bozulduğunu ve yapay zekanın bunu nasıl anında yakaladığını görebilmektedir.

---

## 4. Testler ve Doğrulama
*   Backend dizinindeki otomatik birim ve duman testleri (`pytest`) başarıyla çalıştırılmıştır.
*   4 adet testin tamamı sorunsuz geçmiş (**Passed**) ve veritabanı tohumlama işlemi doğrulanmıştır.
*   Frontend `tsc` (TypeScript compiler) derleme testinden derleme hatasız başarıyla geçmiştir.

---

## 5. Yapay Zeka'nın (AI) Buradaki Rolü
RFM hesaplamasının kendisi veritabanı analiziyken, **Yapay Zeka (Gemini), bu analiz çıktısını kullanır.**
*   Eğer kullanıcının canlı segmenti **"İmpulsif / Kırılgan"** ise, Gemini *Loss Aversion (Kayıptan Kaçınma)* veya *Planning (Planlama)* durtme stratejilerini seçerek kullanıcının sepetindeki isteğe bağlı ürünleri hedefleriyle ilişkilendirir.
*   Jüri test hesabında bu durumun tam olarak nasıl çalıştığı sepet sayfasında başarıyla simüle edilebilir. Sayfa üzerinde dinamik uyarılar tetiklenmektedir.

---

> [!NOTE]  
> RFM aşaması başarıyla tamamlanmış ve tam entegrasyonu sağlanmıştır. Bir sonraki aşamada **Yapay Zeka Dinamik Veri Entegrasyonu (Statik Veriye Son)** başlığına geçiyoruz. Arka planda sabit gönderilen `age: 30` gibi değerleri arayüz ve onboarding üzerinden kullanıcıdan alarak dinamik hale getireceğiz.
