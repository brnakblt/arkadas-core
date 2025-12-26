# 📋 Yoklama Sistemi

Öğrenci devam takibini dijital olarak yönetin.

## Yoklama Alma

### Manuel Yoklama

1. **Yoklama** modülüne gidin
2. Tarih ve sınıfı seçin
3. Her öğrenci için durum belirleyin:
   - ✅ Geldi
   - ❌ Gelmedi
   - 🏥 Raporlu
   - ⏰ Geç kaldı
4. **Kaydet** butonuna tıklayın

### Otomatik Yoklama (Yüz Tanıma)

BKDS entegrasyonu ile:

1. Öğrenci giriş kapısından geçer
2. Yüz tanıma kamerası algılar
3. Sistem otomatik yoklama kaydı oluşturur
4. Veli bilgilendirilir

## Yoklama Durumları

| Durum | Açıklama | Fatura Etkisi |
|-------|----------|---------------|
| Geldi | Normal katılım | Ücret alınır |
| Gelmedi | Mazeretsiz devamsızlık | Ücret alınır |
| Raporlu | Sağlık raporu var | Ücret alınmaz |
| Telafi | Telafi dersi | Ücret alınmaz |

## Raporlar

### Günlük Rapor

- Bugün gelen/gelmeyen öğrenci sayısı
- Devam yüzdesi
- Geç kalan öğrenciler

### Aylık Rapor

- Öğrenci bazlı devam özeti
- Devamsızlık istatistikleri
- MEB formatında rapor çıktısı

## Bildirimler

Sistem otomatik olarak:

- Velilere giriş/çıkış bildirimi gönderir
- Devamsızlık durumunda uyarı mesajı atar
- Haftalık devam özeti paylaşır

!!! tip "İpucu"
    Toplu yoklama için "Tümünü Geldi İşaretle" butonunu kullanabilirsiniz.
