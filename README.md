# 🎓 Arkadaş Özel Eğitim ERP Sistemi

<div align="center">

**Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi** için geliştirilmiş kapsamlı kurumsal kaynak planlama sistemi.

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Strapi](https://img.shields.io/badge/Strapi-v5-4945FF?style=for-the-badge&logo=strapi&logoColor=white)](https://strapi.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)

</div>

---

## 🚀 Hızlı Başlangıç

Bu proje **Makefile** ile yönetilmektedir.

```bash
# 1. Environment dosyalarını oluştur
npm run setup:env

# 2. Projeyi sıfırdan başlat
make reset

# 3. İzleme servislerini başlat (Opsiyonel)
make monitoring

# 4. Geliştirme modunda başlat
make dev
```

---

## 🌐 Port Haritası

| Servis | Port | URL | Açıklama |
|--------|------|-----|----------|
| **Web** | 3000 | http://localhost:3000 | Next.js Frontend |
| **Strapi** | 1337 | http://localhost:1337/admin | CMS Admin Panel |
| **SFTPGo** | 8088 | http://localhost:8088 | Dosya Yönetimi |
| **Grafana** | 3001 | http://localhost:3001 | Metrikler & Dashboard |
| **Prometheus**| 9090 | http://localhost:9090 | Veri Toplama |
| **Alertmanager**| 9093 | http://localhost:9093 | Alarm Yönetimi |

---

## ✨ Özellikler

### 🔐 Güvenlik
- **Fail-Closed** kimlik doğrulama
- **Custom JWT Auth** (HTTP-Only Cookie)
- Login rate limiting ve IP bloklama
- Docker Scout ile otomatik güvenlik taraması (`make scan`)

### 🛠️ Altyapı
- **Otomatik Yedekleme:** DB ve Dosyalar (`make backup`)
- **Dosya Senkronizasyonu:** Strapi <-> SFTPGo entegrasyonu
- **İzleme:** Prometheus, Grafana, Alertmanager stack
- **CI/CD:** GitHub Actions entegrasyonu

### 📊 Raporlama
- Ek-4 Devam Takip Raporu
- Dönem sonu raporları
- PDF/Excel export

---

## 📁 Proje Yapısı

```
arkadasozelegitim/
├── web/              # Next.js 16 Frontend
├── strapi/           # Strapi v5 Backend CMS
├── scripts/          # Otomasyon Scriptleri
├── monitoring/       # Prometheus/Grafana Konfigürasyonu
├── docs/             # MkDocs Dokümantasyon
└── Makefile          # Proje Yönetim Komutları
```

---

## 🛠️ Make Komutları

Geliştirme ve bakım için `make` komutlarını kullanın:

| Komut | Açıklama |
|-------|----------|
| `make dev` | Geliştirme ortamını başlat |
| `make reset` | **DİKKAT:** Veritabanını siler ve yeniden kurar |
| `make backup` | Sistem yedeği alır (DB + Dosyalar) |
| `make restore` | Yedekten geri döner |
| `make monitoring` | İzleme servislerini başlatır |
| `make scan` | Güvenlik taraması yapar |
| `make lint` | Kod kalitesi kontrolü |

---

## 📦 Gereksinimler

| Yazılım | Önerilen |
|---------|----------|
| Node.js | 20.x+ |
| Docker | 24.x+ |
| Make | 4.x+ |

---

## 🔐 Environment & Secrets

### Kurulum sırasında
Script otomatik olarak güvenli şifreler oluşturur:
```bash
bash scripts/generate_envs.sh
```

### SFTPGo & Strapi Senkronizasyonu
Strapi üzerindeki "Personel" ve "Öğrenci" işlemleri otomatik olarak SFTPGo kullanıcılarını ve gruplarını günceller.

---

## 🐳 Docker Servisleri

Temel altyapıyı başlatmak için:
```bash
make docker-up
```


---

## 📖 Dokümantasyon

| Dosya | Açıklama |
|-------|----------|
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production kurulum |
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Geliştirme ortamı |
| [SECURITY_AUDIT_BASELINE.md](./SECURITY_AUDIT_BASELINE.md) | Güvenlik denetim raporu |

---

## 📄 Lisans

Bu proje **Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi** için özel olarak geliştirilmiştir.

---

<div align="center">

**🎓 Her Çocuk Özel ve Değerli! 🎓**

Made with ❤️ in Turkey

</div>
