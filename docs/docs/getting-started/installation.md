# Kurulum Rehberi

Bu rehber, Arkadaş ERP sistemini geliştirme ortamınıza kurmanız için adım adım talimatlar içerir.

---

## Gereksinimler

| Yazılım | Minimum Sürüm | Önerilen |
|---------|---------------|----------|
| Node.js | 18.x | 20.x (LTS) |
| Python | 3.10 | 3.11 |
| Docker | 20.x | En son |
| Git | 2.x | En son |

---

## Hızlı Başlangıç

```bash
# 1. Repo klonla
git clone https://github.com/brnakblt/arkadasozelegitim.git
cd arkadasozelegitim

# 2. Node.js 20 kullan
nvm use  # .nvmrc dosyasından okur

# 3. Bağımlılıkları yükle
npm run install:all

# 4. Altyapıyı başlat (PostgreSQL + Redis)
docker compose up -d

# 5. Uygulamaları başlat
npm run dev:all
```

---

## Detaylı Kurulum

### 1. Node.js (NVM ile)

```bash
# NVM kurulumu
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Node.js 20 LTS kurulumu
nvm install 20
nvm use 20
```

### 2. Python (AI Service için)

```bash
cd ai-service
python3.11 -m venv venv
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
```

### 3. Docker (Minimal)

Sadece PostgreSQL ve Redis çalışır:

```bash
docker compose up -d
```

İsteğe bağlı SFTPGo:
```bash
docker compose --profile storage up -d
```

---

## Yapılandırma

### Ortam Değişkenleri

```bash
# Otomatik oluştur (Infisical entegrasyonu ile)
npm run setup:env
```

### Manuel Yapılandırma

**strapi/.env:**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=arkadas_erp
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password
```

**web/.env.local:**
```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

---

## Servisler

| Servis | Port | Açıklama |
|--------|------|----------|
| Web | 3000 | Next.js frontend |
| Strapi | 1337 | CMS backend |
| AI Service | 8000 | Yüz tanıma API |
| Mebbis Service | 4000 | MEBBİS entegrasyonu |
| PostgreSQL | 5432 | Veritabanı |
| Redis | 6379 | Cache/Queue |

---

## Sonraki Adımlar

- [İlk Adımlar](first-steps.md) - Sisteme giriş yapın
- [Hızlı Başlangıç](quickstart.md) - Temel özellikleri keşfedin
