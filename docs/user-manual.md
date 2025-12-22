# Arkadaş ERP - Yönetici ve Kullanıcı El Kitabı

## 🚀 Giriş

Arkadaş Özel Eğitim Kurumu ERP sistemi, öğrenci takibi, MEBBİS entegrasyonu ve kurum yönetimi işlemlerini dijitalleştiren kapsamlı bir platformdur.

---

## 🖥️ Web Yönetim Paneli

### Yönetici Paneline Erişim

Panel adresi: `https://[alan-adi]/admin`
Giriş için yetkili yönetici hesabı gereklidir.

### 1. Sistem Ayarları (`/admin/ayarlar`)

Kurum genel ayarlarını buradan yapılandırabilirsiniz.

- **Genel Ayarlar:** Kurum adı, logo, iletişim bilgileri.
- **Güvenlik:** Parola politikaları, oturum süreleri.
- **Bildirimler:** SMS ve E-posta şablonları.

### 2. Kullanıcı Rolleri ve İzinler (`/admin/roller`)

Personel yetkilerini yönetmek için kullanılır.

- **Admin:** Tam yetki.
- **Öğretmen:** Sadece öğrenci takibi ve yoklama.
- **Veli:** Sadece kendi öğrencisinin verilerini görme.
- **Şoför:** Servis rotası ve konumu yönetimi.

### 3. Sistem Logları (`/admin/loglar`)

Sistemdeki tüm hareketleri izlemenizi sağlar.

- Hatalar, uyarılar ve kullanıcı girişleri loglanır.
- Tarih ve seviye (Info/Error/Warning) bazlı filtreleme yapılabilir.

### 4. Toplu Öğrenci İşlemleri (`/admin/ogrenciler`)

Çok sayıda öğrenci üzerinde hızlı işlem yapmak için kullanılır.

- **SMS Gönder:** Seçili öğrencilerin velilerine toplu SMS.
- **Durum Değiştir:** Aktif/Pasif/Mezun durum güncellemeleri.
- **Filtreleme:** Sınıf ve duruma göre hızlı seçim.

---

## 🎓 MEBBİS Entegrasyonu (`/dashboard/mebbis`)

MEBBİS işlemleri artık otomatikleştirilmiştir.

**Nasıl Kullanılır?**

1. **Kimlik Bilgileri:** İlk girişte MEBBİS TC Kimlik No ve Şifrenizi kasaya kaydedin (Güvenli, şifreli olarak saklanır).
2. **Servisler:**
   - **Öğrenci Senkronizasyonu:** MEBBİS'teki öğrenci listesini ERP'ye çeker.
   - **Eğitim Bilgi Girişi:** Günlük defter/eğitim verilerini MEBBİS'e işler.
   - **Fatura İşlemleri:** Kesilen faturaların MEBBİS onayını yapar.

---

## 📱 Mobil Uygulama (iOS / Android)

Saha personeli ve öğretmenler için geliştirilmiştir.

### Özellikler

- **Yoklama Al:** Sınıf listesi üzerinden hızlı yoklama.
- **QR ile Yoklama:** Öğrenci kimlik kartındaki QR kodu okutarak temassız giriş.
- **Servis Takip:** Şoförler için rota takibi ve veli bilgilendirme.
- **Çevrimdışı Mod:** İnternet olmasa bile yoklama alabilir, bağlantı gelince senkronize edebilirsiniz.

---

## 🔒 Güvenlik Uyarıları

- Şifrenizi kimseyle paylaşmayın.
- Admin panelinden işlem yaparken "Güvenli Çıkış" yapmayı unutmayın.
- Şüpheli bir durum (örn. tanınmayan giriş denemesi) fark ederseniz Sistem Yöneticisine bildirin.
