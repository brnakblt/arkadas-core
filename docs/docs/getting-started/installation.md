# Kurulum Rehberi

Bu rehber, Arkadaş ERP sistemini geliştirme ortamınıza kurmanız için adım adım talimatlar içerir.

---

## Gereksinimler

| Yazılım | Minimum Sürüm | Önerilen |
|---------|---------------|----------|
| Node.js | 18.x | 22.x |
| Python | 3.10 | 3.11 |
| Docker | 20.x | En son |
| Git | 2.x | En son |

---

## Otomatik Kurulum

### Windows

```powershell
# PowerShell'i yönetici olarak açın
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Kurulum scriptini çalıştırın
.\setup_windows.ps1
```

### Linux / macOS

```bash
# Script'e çalıştırma izni verin
chmod +x setup_project.sh

# Kurulum scriptini çalıştırın
./setup_project.sh
```

### Arch Linux (Tam Kurulum)

```bash
# Root yetkisiyle çalıştırın
sudo ./setup_arch.sh
```

---

## Manuel Kurulum

### 1. Repoyu Klonlayın

```bash
git clone https://github.com/brnakblt/arkadasozelegitim.git
cd arkadasozelegitim
```

### 2. Node.js Kurun (NVM ile)

```bash
# NVM kurulumu
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Node.js 22 kurulumu
nvm install 22
nvm use 22
```

### 3. Bağımlılıkları Yükleyin

```bash
npm run install:all
```

### 4. Python Ortamını Kurun

```bash
cd ai-service
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
```

### 5. Ortam Değişkenlerini Ayarlayın

```bash
# Örnek dosyaları kopyalayın
cp strapi/.env.example strapi/.env
cp web/.env.example web/.env.local
cp ai-service/.env.example ai-service/.env
```

---

## Yapılandırma

### Strapi (.env)

```env
DATABASE_CLIENT=sqlite  # veya postgres
NEXTCLOUD_URL=http://localhost:8080
NEXTCLOUD_ADMIN_USER=admin
NEXTCLOUD_ADMIN_PASSWORD=your_password
```

### Web (.env.local)

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

---

## Docker Servisleri

Nextcloud, OnlyOffice ve diğer altyapı servisleri için:

```bash
npm run dev:docker
```

---

## Sonraki Adımlar

- [İlk Adımlar](first-steps.md) - Sisteme giriş yapın
- [Hızlı Başlangıç](quickstart.md) - Temel özellikleri keşfedin

---

!!! warning "Önemli"
    Production ortamında SQLite yerine PostgreSQL kullanmanız önerilir. Veritabanı yapılandırması için `strapi/config/database.ts` dosyasını düzenleyin.
