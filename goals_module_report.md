# 🚀 MindfulSpend AI — Finansal Hedefler (Goals) Modülü Çalışma Mantığı Raporu

Finansal Hedefler Modülü, kullanıcının birikim motivasyonunu canlı tutan ve gereksiz harcama kararlarını ertelemesini sağlayan "çapa hedeflerini" yönetir.

---

## 1. Modülün Genel Amacı
Davranışsal ekonomide kullanıcıyı dürtüsel bir harcamadan vazgeçirmenin en etkili yolu, ona harcama yapma demektir (suçluluk uyandırır) veya yasaklamak değildir. En etkili yol, yapacağı harcamanın **uzun vadeli çok sevdiği somut bir hedefi (hayali) ne kadar geciktireceğini** ona canlı olarak göstermektir. Hedefler modülü, bu çapalama psikolojisinin matematiksel tabanını ve görsellerini yönetir.

---

## 2. Veritabanı Modeli ve Veri Yapısı (`Goal`)

Veritabanındaki `goals` tablosu (`models.py`) bir hedefin tüm özelliklerini barındırır:
*   `id`: Benzersiz hedef numarası (Primary Key).
*   `user_id`: Hedefin sahibi olan kullanıcı (Foreign Key).
*   `title`: Hedefin adı (örn: "Acil Durum Fonu", "Japonya Seyahati").
*   `target_amount`: Ulaşılması gereken toplam tutar (₺).
*   `current_amount`: Şu ana kadar biriktirilen tutar (₺).
*   `target_date`: Hedefe ulaşılmak istenen son tarih (Date).
*   `category`: Hedefin kategorisi (`emergency` | `vacation` | `investment` | `housing` | `vehicle` | `other`).
*   `priority`: Öncelik sıralaması (1: En yüksek, 2: Orta, 3: Düşük).
*   `created_at`: Hedefin oluşturulma tarihi.

---

## 3. Akıllı Nudge (Dürtme) Gecikme Matematiği

Kullanıcı Sanal Market'ten bir isteğe bağlı ürün alırken çalışan gecikme analizi şu formülle hesaplanır:

$$\text{Hedef Kalan Tutar} = \text{target\_amount} - \text{current\_amount}$$

$$\text{Kalan Gün Sayısı} = \text{target\_date} - \text{bugün}$$

$$\text{Günlük Birikim İhtiyacı} = \frac{\text{Hedef Kalan Tutar}}{\text{Kalan Gün Sayısı}}$$

$$\text{Hedef Gecikme Süresi (Gün)} = \frac{\text{Sepetteki İsteğe Bağlı Harcama Tutarı}}{\text{Günlük Birikim İhtiyacı}}$$

### Gerçek Hayat Örneği:
*   Kullanıcının **Japonya Tatili** hedefi var. Hedef tutar `25.000 TL`, biriken `5.000 TL`. Kalan ihtiyaç: `20.000 TL`.
*   Hedef tarihe tam **100 gün** var.
*   Bu durumda tatil hedefine ulaşmak için kullanıcının her gün kenara **200 TL** koyması gerekir.
*   Kullanıcı sepete **2.000 TL** değerinde lüks bir kahve makinesi ekledi.
*   Sistem anında hesaplar: 
    $$\text{Gecikme} = \frac{2000 \text{ TL}}{200 \text{ TL/gün}} = 10 \text{ gün!}$$
*   Gemini hemen modalı açar: *"Bu kahve makinesini alarak Japonya seyahatini tam 10 gün geciktireceksin. Kaçırma riskine değer mi?"*

---

## 4. Ön Yüz (Frontend) Görselleştirmeleri ve Yönetimi

Hedefler, ön yüzde `Goals.tsx` sayfasında ve Dashboard'da yönetilir:
*   **İlerleme Göstergesi (Radial Bar):** Recharts kütüphanesi kullanılarak, hedefin yüzde kaçının tamamlandığı renk geçişli dairesel grafiklerle gösterilir.
*   **Öncelik Vurgusu:** Yüksek öncelikli hedefler kırmızı/mor tonlarla, düşük öncelikliler yeşil tonlarla ayırt edilir.
*   **Kalan Gün Sayacı:** Hedef tarihe kalan gün sayısı anlık hesaplanarak kartlar üzerinde *"Son 85 gün"* şeklinde geri sayım yapar.
*   **Hedef Ekleme / Güncelleme / Silme:** Kullanıcı istediği an yeni bir birikim hedefi ekleyebilir, birikmiş parasını güncelleyebilir veya hedefini silebilir. Tüm bu talepler anında backend veritabanına kaydedilir.
