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

# 2. Geliştirme modunda başlat
npm run dev
```

**Servis Adresleri:**

| Servis | URL | Port |
|--------|-----|------|
| Web Frontend | http://localhost:3000 | 3000 |
| Strapi CMS | http://localhost:1337/admin | 1337 |
| AI Service | http://localhost:8000/docs | 8000 |
| MEBBIS Service | http://localhost:4000/api | 4000 |
| Mobile (Expo) | http://localhost:8082 | 8082 |

---

## ✨ Tamamlanan Özellikler

### ✅ Phase 1: MEBBIS Entegrasyonu
- İş Planı Aktarımı
- Eğitim Bilgi Girişi
- Öğrenci Rapor Çekme
- Modül Süreleri Çekme
- Fatura Aktarımı

### ✅ Phase 2: BEP Otomasyonu
- Kaba Değerlendirme
- Bireysel Eğitim Planı (BEP)
- Performans Kayıt Tablosu (PKT)
- Dönem Sonu Değerlendirme

### ✅ Phase 3: Planlama Sistemi
- Drag-drop haftalık planlama (`@dnd-kit`)
- Multi-user WebSocket senkronizasyonu
- Kural motoru (öğrenci/öğretmen limitleri)

### ✅ Phase 4: Fatura & Servis
- Fatura modülü (Strapi schema)
- Dönem bazlı otomatik fatura oluşturma
- MEBBIS senkronizasyonu
- PDF export

### ✅ Phase 5: Raporlama
- Ek-4 Raporu (Devam Takip)
- Dönem Sonu Raporu
- Öğrenci Gelişim Raporu
- Kurum Performans Raporu
- PDF/Excel/MEBBIS export

---

## 📁 Proje Yapısı

```
arkadasozelegitim/
├── strapi/           # Backend CMS (Strapi v5)
├── web/              # Frontend (Next.js 16)
├── mobile/           # Mobile App (React Native/Expo)
├── ai-service/       # AI Face Recognition (Python/FastAPI)
├── mebbis-service/   # MEBBIS Automation (Node.js)
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── databases/        # Docker volume data
```

---

## 🛠️ Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme modunda başlat |
| `npm run build` | Production build |
| `npm run lint` | Lint kontrolü |
| `npm run stop` | Tüm servisleri durdur |
| `npm run reset` | Docker container'ları sıfırla |

---

## 📦 Gereksinimler

| Yazılım | Minimum | Önerilen |
|---------|---------|----------|
| Node.js | 18.x | 22.x |
| Python | 3.10 | 3.13 |
| Docker | 20.x | 24.x |
| RAM | 8 GB | 16 GB |

---

## 📖 Dokümantasyon

| Dosya | Açıklama |
|-------|----------|
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production kurulum rehberi |
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Geliştirme ortamı |
| [DISASTER_RECOVERY.md](./docs/DISASTER_RECOVERY.md) | Felaket kurtarma |
| [INFISICAL_STRATEGY.md](./docs/INFISICAL_STRATEGY.md) | Secret yönetimi |

---

## 🔐 Environment Variables

Secret yönetimi için **Infisical** kullanılması önerilir:

```bash
# Infisical'dan secret sync
./scripts/sync_secrets.sh prod
```

Manuel kurulum için:
```bash
./scripts/generate_envs.sh
```

---

## 📄 Lisans

Bu proje **Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi** için özel olarak geliştirilmiştir.

---

<div align="center">

**🎓 Her Çocuk Özel ve Değerli! 🎓**

Made with ❤️ in Turkey

</div>
