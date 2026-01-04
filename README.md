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

```bash
# 1. Bağımlılıkları kur
npm run install:all

# 2. Environment dosyalarını oluştur
npm run setup:env

# 3. Projeyi sıfırdan başlat (DB + Seed)
npm run reset

# 4. Geliştirme modunda başlat
npm run dev
```

---

## 🌐 Port Haritası

| Servis | Port | URL | Açıklama |
|--------|------|-----|----------|
| **Web** | 3000 | http://localhost:3000 | Next.js Frontend |
| **Strapi** | 1337 | http://localhost:1337/admin | CMS Admin Panel |
| **AI Service** | 8000 | http://localhost:8000/docs | Yüz Tanıma API |
| **Mebbis** | 4000 | http://localhost:4000/api | MEBBİS Otomasyon |
| **PostgreSQL** | 5432 | - | Veritabanı |
| **Redis** | 6380 | - | Cache & Queue |
| **OnlyOffice** | 8080 | http://localhost:8080 | Doküman Editörü |
| **Mobile** | 8085 | expo://localhost:8085 | Expo Dev Server |
| **SFTPGo** | 8088 | http://localhost:8088 | Dosya Yönetimi (opsiyonel) |

---

## ✨ Özellikler

### 🔐 Güvenlik
- **Fail-Closed** kimlik doğrulama (API key yoksa erişim yok)
- Login rate limiting (5 deneme/15 dakika)
- Redis şifreli bağlantı
- PII verileri AES-256 şifreleme
- RBAC yetkilendirme sistemi

### 📱 Mobil Uygulama
- Yüz tanıma ile yoklama
- Biyometrik giriş (Face ID / Touch ID)
- Offline çalışma desteği
- Push bildirimler
- Mesajlaşma

### 🤖 MEBBİS Entegrasyonu
- Öğrenci senkronizasyonu
- Eğitim bilgi girişi otomasyonu
- Fatura aktarımı
- BEP form otomasyonu

### 📊 Raporlama
- Ek-4 Devam Takip Raporu
- Dönem sonu raporları
- PDF/Excel export
- Kurum performans raporu

---

## 📁 Proje Yapısı

```
arkadasozelegitim/
├── web/              # Next.js 16 Frontend
├── strapi/           # Strapi v5 Backend CMS
├── mobile/           # React Native/Expo Mobil Uygulama
├── ai-service/       # Python/FastAPI Yüz Tanıma
├── mebbis-service/   # MEBBİS Otomasyon Servisi
├── docs/             # MkDocs Dokümantasyon
├── scripts/          # Yardımcı Scriptler
├── databases/        # Docker Volume Data
└── docker-compose.yml
```

---

## 🛠️ NPM Komutları

### Geliştirme
| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Tüm servisleri başlat |
| `npm run dev:strapi` | Sadece Strapi |
| `npm run dev:web` | Sadece Web |
| `npm run dev:mobile` | Sadece Mobile |
| `npm run dev:ai` | Sadece AI Service |
| `npm run dev:mebbis` | Sadece Mebbis |

### Build & Test
| Komut | Açıklama |
|-------|----------|
| `npm run build` | Production build |
| `npm run lint` | Lint kontrolü |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run test` | Testleri çalıştır |

### Yönetim
| Komut | Açıklama |
|-------|----------|
| `npm run reset` | DB sıfırla ve seed |
| `npm run stop` | Tüm servisleri durdur |
| `npm run setup:env` | Environment dosyaları oluştur |

---

## 📦 Gereksinimler

| Yazılım | Minimum | Önerilen |
|---------|---------|----------|
| Node.js | 18.x | 22.x |
| Python | 3.10 | 3.13 |
| Docker | 20.x | 24.x |
| RAM | 8 GB | 16 GB |

---

## 🔐 Environment & Secrets

### Infisical (Önerilen)
```bash
# Infisical kurulumu
bash scripts/setup_infisical.sh
```

### Manuel Kurulum
```bash
# Environment dosyalarını oluştur
npm run setup:env

# Her servis için .env dosyaları oluşturulur:
# - .env (root - Docker)
# - strapi/.env
# - web/.env.local
# - ai-service/.env
# - mebbis-service/.env
```

---

## � Docker Servisleri

### Core (Her zaman çalışır)
```bash
docker compose up -d
```

### Opsiyonel: SFTPGo
```bash
docker compose --profile storage up -d
# Admin: http://localhost:8088
```

---

## �📖 Dokümantasyon

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
