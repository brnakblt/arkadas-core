# Arkadaş ERP Production Deployment Guide

> **Hedef**: Sıfırdan sunucu kurulumu, Infisical ile secret yönetimi, ve production deployment

---

## 📊 Kaynak Gereksinimleri

### Minimum (10-20 öğrenci)
| Kaynak | Miktar |
|--------|--------|
| **RAM** | 8 GB |
| **CPU** | 4 vCPU |
| **Disk** | 50 GB SSD |

### Önerilen (50+ öğrenci)
| Kaynak | Miktar |
|--------|--------|
| **RAM** | 16 GB |
| **CPU** | 8 vCPU |
| **Disk** | 100 GB SSD |

### Servis Bazlı RAM Kullanımı
| Servis | RAM |
|--------|-----|
| PostgreSQL | 1-2 GB |
| Redis | 256-512 MB |
| Strapi | 512 MB - 1 GB |
| Next.js Web | 512 MB - 1 GB |
| AI Service | 1-2 GB |
| MEBBIS Service | 512 MB |
| OnlyOffice | 2 GB |
| Nextcloud | 512 MB |
| Infisical | 512 MB |
| **Toplam** | **~8-10 GB** |

---

## 🖥️ Adım 1: İşletim Sistemi Seçimi

### Önerilen: Ubuntu Server 22.04 LTS
- Uzun süreli destek (2027'ye kadar)
- Docker için en iyi uyumluluk
- Kolay yönetim

### Alternatifler:
- **Debian 12**: Daha minimal, stabil
- **Rocky Linux 9**: RHEL tabanlı, enterprise

### Kurulum Notları:
```bash
# ISO indir: https://ubuntu.com/download/server
# Minimal kurulum seç
# OpenSSH Server kur
# Disk: LVM kullan (sonra genişletebilirsin)
```

---

## 🌐 Adım 2: Ağ Yapılandırması

### Senaryo: Windows PC (IIS) Port 80'de
Aynı ağda Windows IIS port 80 kullanıyor. Çözümler:

#### Seçenek A: Farklı Port (Basit)
```
Windows IIS    → :80 (mevcut)
Linux Sunucu   → :8080 (Traefik) → :443 (HTTPS)
```

#### Seçenek B: Farklı IP (Önerilen)
```
Windows IIS    → 192.168.1.10:80
Linux Sunucu   → 192.168.1.20:80, :443
```

#### Seçenek C: Reverse Proxy Windows'ta
```
IIS ARR → Linux Sunucu (subdomain bazlı)
erp.domain.com → Linux:3000
```

### Firewall Kuralları
```bash
# UFW kurulum
sudo apt update && sudo apt install -y ufw

# Temel portlar
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 1337/tcp    # Strapi (geçici, test için)

# Aktif et
sudo ufw enable
```

### Statik IP Ayarı
```yaml
# /etc/netplan/00-installer-config.yaml
network:
  version: 2
  ethernets:
    enp0s3:
      addresses:
        - 192.168.1.20/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```
```bash
sudo netplan apply
```

---

## 🐳 Adım 3: Docker Kurulumu

```bash
# Eski versiyonları kaldır
sudo apt remove docker docker-engine docker.io containerd runc

# Gerekli paketler
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Repository ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker kur
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER
newgrp docker

# Test
docker run hello-world
```

---

## 🔐 Adım 4: Infisical Kurulumu (Self-Hosted)

### Docker Compose ile Infisical
```bash
# Infisical dizini
mkdir -p /opt/infisical && cd /opt/infisical

# docker-compose.yml oluştur
cat << 'EOF' > docker-compose.yml
version: "3.9"
services:
  infisical:
    image: infisical/infisical:latest
    ports:
      - "8200:8080"
    environment:
      - ENCRYPTION_KEY=0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f  # 32 hex karakter
      - JWT_SIGNUP_SECRET=change-me-signup
      - JWT_REFRESH_SECRET=change-me-refresh
      - JWT_AUTH_SECRET=change-me-auth
      - JWT_MFA_SECRET=change-me-mfa
      - JWT_SERVICE_SECRET=change-me-service
      - MONGO_URL=mongodb://mongo:27017/infisical
      - REDIS_URL=redis://redis:6379
      - SITE_URL=https://secrets.yourdomain.com
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  mongo_data:
EOF

# Başlat
docker compose up -d

# Test: http://sunucu-ip:8200
```

### Infisical CLI Kurulumu
```bash
# Binary indir
curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | sudo -E bash
sudo apt install -y infisical

# Login
infisical login --domain=https://secrets.yourdomain.com
```

---

## 📦 Adım 5: Arkadaş ERP Deployment

### 5.1 Proje Dosyalarını Kopyala
```bash
# Sunucuda
mkdir -p /opt/arkadas-erp && cd /opt/arkadas-erp

# Git ile çek (önerilen)
git clone https://github.com/brnakblt/arkadasozelegitim.git .

# Veya rsync ile
# rsync -avz --exclude='node_modules' --exclude='.git' . user@sunucu:/opt/arkadas-erp/
```

### 5.2 Infisical ile Secret Inject
```bash
# .infisical.json oluştur
cat << 'EOF' > .infisical.json
{
  "workspaceId": "YOUR_WORKSPACE_ID",
  "defaultEnvironment": "prod"
}
EOF

# Secret'ları çek ve .env yaz
infisical export --env=prod > .env
infisical export --env=prod --path=/strapi > strapi/.env
infisical export --env=prod --path=/web > web/.env.local
infisical export --env=prod --path=/ai-service > ai-service/.env
infisical export --env=prod --path=/mebbis-service > mebbis-service/.env
```

### 5.3 Production Docker Compose
```bash
# Production compose dosyası
cat << 'EOF' > docker-compose.prod.yml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --save 60 1
    volumes:
      - redis_data:/data

  strapi:
    build: ./strapi
    restart: always
    environment:
      NODE_ENV: production
    env_file: ./strapi/.env
    ports:
      - "1337:1337"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  web:
    build: ./web
    restart: always
    env_file: ./web/.env.local
    ports:
      - "3000:3000"
    depends_on:
      - strapi

  ai-service:
    build: ./ai-service
    restart: always
    env_file: ./ai-service/.env
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy

  mebbis-service:
    build: ./mebbis-service
    restart: always
    env_file: ./mebbis-service/.env
    ports:
      - "4000:4000"
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
EOF

# Deploy
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🔒 Adım 6: SSL/HTTPS (Traefik)

```bash
# Traefik dizini
mkdir -p /opt/traefik && cd /opt/traefik

# docker-compose.yml
cat << 'EOF' > docker-compose.yml
version: "3.9"

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@arkadas.com.tr"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    labels:
      - "traefik.http.routers.dashboard.rule=Host(`traefik.yourdomain.com`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$..."
    restart: unless-stopped

networks:
  default:
    external: true
    name: arkadas-net
EOF

docker compose up -d
```

---

## ✅ Adım 7: Doğrulama

```bash
# Servisleri kontrol et
docker ps

# Health check
curl http://localhost:3000          # Web
curl http://localhost:1337/_health  # Strapi
curl http://localhost:8000/health   # AI
curl http://localhost:4000/health   # MEBBIS

# Logları izle
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🔄 Bakım Komutları

```bash
# Güncelleme
cd /opt/arkadas-erp
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Yedekleme
docker exec postgres pg_dump -U postgres arkadas_erp > backup_$(date +%Y%m%d).sql

# Rollback
docker compose -f docker-compose.prod.yml down
git checkout PREVIOUS_TAG
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📞 Sonraki Adımlar

1. [ ] Domain satın al (örn: `erp.arkadas.com.tr`)
2. [ ] DNS kayıtlarını ayarla
3. [ ] SSL sertifikası al (Traefik otomatik yapar)
4. [ ] Infisical'da secret'ları oluştur
5. [ ] İlk deployment'ı yap
6. [ ] Strapi admin hesabı oluştur
7. [ ] Monitoring kur (Uptime Kuma önerilir)
