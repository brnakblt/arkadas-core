# Deployment Rehberi

Bu belge, Arkadaş Özel Eğitim ERP sisteminin production ortamına kurulumunu açıklar.

## 📋 Gereksinimler

### Sunucu

| Kaynak | Minimum | Önerilen |
|--------|---------|----------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Disk | 100 GB SSD | 500 GB SSD |
| OS | Ubuntu 22.04 | Ubuntu 24.04 |

### Yazılım

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+ (PostGIS)
- Redis 7+
- NGINX

## 🚀 Hızlı Kurulum

### 1. Repository Klonla

```bash
git clone https://github.com/your-org/arkadasozelegitim.git
cd arkadasozelegitim
```

### 2. Environment Dosyaları

```bash
# Strapi
cp strapi/.env.example strapi/.env

# Web
cp web/.env.example web/.env.local
```

### 3. Docker ile Başlat

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 Manuel Kurulum

### PostgreSQL + PostGIS

```bash
# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib postgis

# Veritabanı oluştur
sudo -u postgres createuser -P erp_user
sudo -u postgres createdb -O erp_user erp_db

# PostGIS etkinleştir
sudo -u postgres psql -d erp_db -c "CREATE EXTENSION postgis;"
```

### Redis

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
```

### Strapi Backend

```bash
cd strapi

# Dependencies
npm ci --production

# Environment
cat > .env << EOF
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-token-salt
ADMIN_JWT_SECRET=your-admin-secret
JWT_SECRET=your-jwt-secret

DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=erp_db
DATABASE_USERNAME=erp_user
DATABASE_PASSWORD=your-password
EOF

# Build & Start
npm run build
NODE_ENV=production npm start
```

### Next.js Web

```bash
cd web

# Dependencies
npm ci

# Environment
cat > .env.local << EOF
NEXT_PUBLIC_STRAPI_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
EOF

# Build
npm run build

# Start (PM2 ile)
pm2 start npm --name "web" -- start
```

### AI Servisi

```bash
cd ai-service

# Virtual environment
python3 -m venv venv
source venv/bin/activate

# Dependencies
pip install -r requirements.txt

# Start (Gunicorn ile)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🔧 NGINX Konfigürasyonu

```nginx
# /etc/nginx/sites-available/erp

upstream strapi {
    server 127.0.0.1:1337;
}

upstream web {
    server 127.0.0.1:3000;
}

# API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://strapi;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Web
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🔐 SSL Sertifikası

```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx

# Sertifika al
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Otomatik yenileme
sudo systemctl enable certbot.timer
```

## 📊 PM2 Process Manager

```bash
# Kurulum
npm install -g pm2

# Ecosystem dosyası
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'strapi',
      cwd: './strapi',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'web',
      cwd: './web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'ai-service',
      cwd: './ai-service',
      script: './venv/bin/gunicorn',
      args: '-w 4 -b 0.0.0.0:5000 app:app'
    }
  ]
};
EOF

# Başlat
pm2 start ecosystem.config.js

# Kaydet ve startup ekle
pm2 save
pm2 startup
```

## 🐳 Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: erp_db
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  strapi:
    build: ./strapi
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_NAME: erp_db
      DATABASE_USERNAME: erp_user
      DATABASE_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - postgres
      - redis
    restart: always

  web:
    build: ./web
    environment:
      NEXT_PUBLIC_STRAPI_URL: ${STRAPI_URL}
    depends_on:
      - strapi
    restart: always

  ai-service:
    build: ./ai-service
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/letsencrypt
    depends_on:
      - strapi
      - web
    restart: always

volumes:
  postgres_data:
```

## ✅ Deployment Checklist

- [ ] PostgreSQL + PostGIS kuruldu
- [ ] Redis kuruldu
- [ ] SSL sertifikaları alındı
- [ ] Environment değişkenleri ayarlandı
- [ ] Strapi build edildi
- [ ] Web build edildi
- [ ] AI servisi çalışıyor
- [ ] NGINX konfigüre edildi
- [ ] PM2/Docker çalışıyor
- [ ] Firewall kuralları ayarlandı
- [ ] Backup sistemi kuruldu
- [ ] Monitoring aktif

## 🔄 Güncelleme

```bash
# Pull latest
git pull origin main

# Rebuild
npm run build --workspaces

# Restart
pm2 restart all
```

## 🆘 Sorun Giderme

### Strapi başlamıyor

```bash
# Logları kontrol et
pm2 logs strapi

# Database bağlantısını test et
psql -h localhost -U erp_user -d erp_db
```

### 502 Bad Gateway

```bash
# Servislerin çalıştığını kontrol et
pm2 status

# NGINX config test
sudo nginx -t
```
