## 🌐 Deployment to a Home Server (Laptop)

If you are using a laptop (Ubuntu) as your production server and want to avoid port conflicts with existing services (like `lila.arkadasozelegitim.com` on Windows), follow this path.

### 1. Install Docker & Coolify
Follow the standard Docker installation for Ubuntu. Then install Coolify to manage your deployments via GitHub.
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 2. Bypass Port Forwarding (Cloudflare Tunnels)
Since Port 80/443 might be in use by other office systems, use a tunnel.

1. **Install cloudflared:**
   ```bash
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
   sudo dpkg -i cloudflared.deb
   ```

2. **Setup Tunnel:**
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create arkadas-prod
   cloudflared tunnel route dns arkadas-prod arkadasozelegitim.com
   ```

3. **Configure the Tunnel to point to your Web container:**
   Edit the config or run:
   ```bash
   cloudflared tunnel run --url http://localhost:3000 arkadas-prod
   ```

### 3. Coolify Workflow
1. Connect your GitHub.
2. Point the project to `main` branch.
3. Use `docker-compose.prod.yml` (located in root).
4. Coolify will build and restart services on every `git push`.

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
| SFTPGo | 512 MB |
| Infisical | 512 MB |
| **Toplam** | **~8-10 GB** |

---

## 🏢 Multi-Tenant Mimarisi

### Shared Instance Model
Bu sistem **tek deployment** ile birden fazla kurumu destekler. Her kurum (tenant) aynı uygulamayı ve veritabanını paylaşır, ancak veriler **row-level security** ile tamamen izole edilir.

```
┌──────────────────────────────────────────────────────────────┐
│                     PRODUCTION SUNUCU                        │
│                                                              │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  Strapi + Web + Mobile API                            │ │
│   │  (Tenant middleware ile izolasyon)                    │ │
│   └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  PostgreSQL (Tek veritabanı)                          │ │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│   │  │ Kurum A  │ │ Kurum B  │ │ Kurum C  │  ...         │ │
│   │  │ tenant=1 │ │ tenant=2 │ │ tenant=3 │              │ │
│   │  └──────────┘ └──────────┘ └──────────┘              │ │
│   └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Veri İzolasyonu
- **beforeFindMany**: Tüm sorgulara `WHERE tenant_id = X` eklenir
- **beforeCreate**: Yeni kayıtlara otomatik `tenant_id` atanır
- **beforeUpdate/Delete**: Sadece kendi tenant'ının verisini değiştirebilir

### Avantajlar
- ✅ Tek deployment, düşük maliyet
- ✅ Merkezi bakım ve güncelleme
- ✅ Tenant sayısı arttıkça sadece RAM/CPU ekle
- ✅ Ayrı env dosyası gerekmez

---

## 💾 Disk ve RAID Yapılandırması

### Önerilen Disk Yapısı

| Mount Point | RAID | Disk Sayısı | Boyut | Açıklama |
|-------------|------|-------------|-------|----------|
| `/` | RAID 1 | 2x SSD | 100 GB | İşletim sistemi + Docker |
| `/var/lib/postgresql` | RAID 10 | 4x SSD | 200+ GB | PostgreSQL verileri |
| `/backups` | RAID 1 veya NAS | 2x HDD | 500+ GB | Yedekler |

### RAID Kurulumu (mdadm)

```bash
# RAID 1 oluştur (OS için)
sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sda /dev/sdb

# RAID 10 oluştur (Database için)
sudo mdadm --create /dev/md1 --level=10 --raid-devices=4 /dev/sdc /dev/sdd /dev/sde /dev/sdf

# RAID yapısını kaydet
sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
sudo update-initramfs -u

# Dosya sistemi oluştur
sudo mkfs.ext4 /dev/md0
sudo mkfs.ext4 /dev/md1

# Mount pointler
sudo mkdir -p /mnt/database
sudo mount /dev/md1 /mnt/database

# fstab'a ekle (kalıcı mount)
echo '/dev/md1 /var/lib/postgresql ext4 defaults 0 2' | sudo tee -a /etc/fstab
```

### PostgreSQL Docker Volume Ayarı

```yaml
# docker-compose.prod.yml
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data  # RAID 10
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

### Tenant Başına Disk Kullanımı Tahmini

| Tenant Boyutu | Öğrenci Sayısı | Tahmini Disk |
|---------------|----------------|--------------|
| Küçük | 10-50 | 1-5 GB |
| Orta | 50-200 | 5-20 GB |
| Büyük | 200+ | 20-50 GB |

> **Not**: 10 tenant ile başlayacaksanız minimum 200 GB PostgreSQL alanı ayırın.

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
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory-policy noeviction
    volumes:
      - redis_data:/data
    ports:
      - "6380:6379"

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

---

## 🔒 Closed Source (Kapalı Kaynak) Dönüşümü

### Neden Closed Source?

- 🛡️ Ticari yazılım olarak satış
- 🔐 Kaynak kodunu gizleme
- 📋 Lisans yönetimi
- 💼 Kurumsal müşterilere özel dağıtım

### Adım 1: GitHub Repository'yi Private Yap

```bash
# GitHub Settings > General > Danger Zone
# "Change repository visibility" > "Make private"

# Veya yeni private repo oluştur
gh repo create arkadasozelegitim-enterprise --private
git remote set-url origin git@github.com:yourusername/arkadasozelegitim-enterprise.git
git push -u origin main
```

### Adım 2: .gitignore Güncelle

```bash
# .gitignore'a ekle:
echo "
# Build outputs
/web/.next/
/web/out/
/strapi/build/
/strapi/dist/
*.tsbuildinfo

# Environment files (zaten olmalı)
.env
.env.local
.env.production

# Lisans dosyaları
LICENSE*
license*
" >> .gitignore
```

### Adım 3: Lisans Dosyasını Değiştir

```bash
# Mevcut LICENSE'ı kaldır
rm LICENSE

# Proprietary lisans oluştur
cat << 'EOF' > LICENSE
Arkadaş ERP - Proprietary Software License

Copyright (c) 2024 Arkadaş Özel Eğitim. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, 
distribution, modification, public display, or public performance of 
this software, via any medium, is strictly prohibited.

For licensing inquiries, contact: info@arkadas.com.tr
EOF
```

### Adım 4: Pre-built Docker Images Dağıtımı

Müşterilere kaynak kod yerine Docker image'ları dağıt:

```bash
# Private Docker Registry kur
docker run -d -p 5000:5000 --name registry registry:2

# Image'ları build et
docker build -t registry.arkadas.com.tr/arkadas-web:v1.0 ./web
docker build -t registry.arkadas.com.tr/arkadas-strapi:v1.0 ./strapi
docker build -t registry.arkadas.com.tr/arkadas-ai:v1.0 ./ai-service

# Registry'ye push et
docker push registry.arkadas.com.tr/arkadas-web:v1.0
docker push registry.arkadas.com.tr/arkadas-strapi:v1.0
docker push registry.arkadas.com.tr/arkadas-ai:v1.0
```

### Adım 5: Müşteri için docker-compose (Kaynak Kodsuz)

```yaml
# customer-docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: arkadas
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: arkadas_erp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  strapi:
    image: registry.arkadas.com.tr/arkadas-strapi:v1.0
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: arkadas_erp
      DATABASE_USERNAME: arkadas
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      REDIS_HOST: redis
    ports:
      - "1337:1337"
    depends_on:
      - postgres
      - redis

  web:
    image: registry.arkadas.com.tr/arkadas-web:v1.0
    environment:
      NEXT_PUBLIC_STRAPI_URL: http://strapi:1337
    ports:
      - "3000:3000"
    depends_on:
      - strapi

volumes:
  postgres_data:
  redis_data:
```

### Adım 6: Lisans Doğrulama Sistemi (Opsiyonel)

```typescript
// lib/license.ts - Uygulama içi lisans kontrolü
import crypto from 'crypto';

interface License {
  tenantId: string;
  maxUsers: number;
  expiresAt: Date;
  features: string[];
}

const LICENSE_PUBLIC_KEY = process.env.LICENSE_PUBLIC_KEY!;

export function verifyLicense(licenseKey: string): License | null {
  try {
    const [payload, signature] = licenseKey.split('.');
    const data = Buffer.from(payload, 'base64').toString('utf8');
    
    const isValid = crypto.verify(
      'sha256',
      Buffer.from(data),
      LICENSE_PUBLIC_KEY,
      Buffer.from(signature, 'base64')
    );

    if (!isValid) return null;

    const license: License = JSON.parse(data);
    
    // Süre kontrolü
    if (new Date(license.expiresAt) < new Date()) {
      console.error('Lisans süresi dolmuş');
      return null;
    }

    return license;
  } catch (error) {
    console.error('Lisans doğrulama hatası:', error);
    return null;
  }
}
```

### Adım 7: Kaynak Kod Obfuscation (JavaScript)

```bash
# terser ile minify et
npm install -g terser

# Next.js build zaten minify eder, ekstra:
find .next -name "*.js" -exec terser {} -o {} --compress --mangle \;


# Yada webpack-obfuscator kullan:
npm install --save-dev javascript-obfuscator
```

### Dağıtım Yöntemleri Karşılaştırması

| Yöntem | Güvenlik | Kolaylık | Maliyet |
|--------|----------|----------|---------|
| Private Git Repo | ⭐⭐ | ⭐⭐⭐ | Düşük |
| Docker Images | ⭐⭐⭐ | ⭐⭐⭐ | Orta |
| Obfuscated Build | ⭐⭐⭐⭐ | ⭐⭐ | Düşük |
| SaaS (Multi-tenant) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Yüksek |

### Önerilen Strateji

1. **Geliştirme**: Private GitHub repository
2. **Test/Staging**: Docker Compose
3. **Production**: Pre-built Docker images
4. **Kurumsal**: Lisans doğrulama + SaaS

---

## 📋 Checklist: Closed Source Dönüşümü

- [ ] GitHub repo'yu private yap
- [ ] LICENSE dosyasını değiştir
- [ ] Docker registry kur
- [ ] Pre-built image'ları oluştur
- [ ] Müşteri docker-compose hazırla
- [ ] (Opsiyonel) Lisans doğrulama sistemi ekle
- [ ] Dökümantasyon (sadece kurulum, kaynak yok)
