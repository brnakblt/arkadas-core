# Arkadaş ERP - Production Deployment Rehberi

> **Amaç**: Bu doküman, Arkadaş ERP sisteminin sıfırdan production ortamına kurulumunu 
> adım adım açıklar. Teknik bilgi seviyeniz ne olursa olsun takip edebilirsiniz.

---

## 📋 İçindekiler

1. [Ön Gereksinimler](#1-ön-gereksinimler)
2. [Sunucu Hazırlığı](#2-sunucu-hazırlığı)
3. [Docker Kurulumu](#3-docker-kurulumu)
4. [Uygulama Deployment](#4-uygulama-deployment)
5. [Domain ve SSL](#5-domain-ve-ssl)
6. [Yedekleme ve Bakım](#6-yedekleme-ve-bakım)
7. [Docker Registry Nedir?](#7-docker-registry-nedir)
8. [Sorun Giderme](#8-sorun-giderme)

---

## 1. Ön Gereksinimler

### Minimum Sunucu Gereksinimleri

| Kaynak | Minimum | Önerilen |
|--------|---------|----------|
| RAM | 8 GB | 16 GB |
| CPU | 4 çekirdek | 8 çekirdek |
| Disk | 50 GB SSD | 100 GB SSD |
| İşletim Sistemi | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Neden Bu Kaynaklar?

```
Servis Bazlı RAM Kullanımı:
├── PostgreSQL:     1-2 GB  (veritabanı)
├── Redis:          256 MB  (önbellek)
├── Strapi:         1 GB    (backend API)
├── Next.js Web:    1 GB    (frontend)
├── AI Service:     2 GB    (yapay zeka)
├── MEBBIS Service: 512 MB  (MEBBIS entegrasyonu)
└── Sistem:         2 GB    (işletim sistemi)
    ───────────────────
    TOPLAM:         ~8 GB minimum
```

---

## 2. Sunucu Hazırlığı

### 2.1 Sunucu Satın Alma

Önerilen sağlayıcılar:
- **Hetzner** (Avrupa, uygun fiyat, yüksek performans)
- **DigitalOcean** (kolay kullanım)
- **AWS/GCP** (kurumsal, ölçeklenebilir)
- **Türkiye**: Turhost, Radore

### 2.2 İlk Bağlantı

```bash
# Windows: PuTTY veya Windows Terminal
# Mac/Linux: Terminal

ssh root@SUNUCU_IP_ADRESI
```

### 2.3 Sistem Güncelleme

```bash
# Sistemi güncelle
apt update && apt upgrade -y

# Gerekli araçları kur
apt install -y curl wget git nano htop

# Yeni kullanıcı oluştur (root kullanma)
adduser arkadas
usermod -aG sudo arkadas

# Yeni kullanıcıya geç
su - arkadas
```

### 2.4 Firewall Ayarları

```bash
# UFW firewall aktif et
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable

# Kontrol et
sudo ufw status
```

---

## 3. Docker Kurulumu

### Docker Nedir?
Docker, uygulamaları "container" adı verilen izole paketler içinde çalıştırır.
Her container kendi ortamını taşır, böylece "benim bilgisayarımda çalışıyordu" 
problemi ortadan kalkar.

### Kurulum

```bash
# Docker'ın resmi kurulum scripti
curl -fsSL https://get.docker.com | sudo sh

# Kullanıcıyı docker grubuna ekle (sudo olmadan kullanmak için)
sudo usermod -aG docker $USER

# Oturumu yenile
newgrp docker

# Test et
docker run hello-world
```

Başarılı olursa "Hello from Docker!" mesajı görürsünüz.

---

## 4. Uygulama Deployment

### 4.1 Proje Dosyalarını İndir

```bash
# Proje klasörü oluştur
sudo mkdir -p /opt/arkadas-erp
sudo chown $USER:$USER /opt/arkadas-erp
cd /opt/arkadas-erp

# Private repo'dan çek (SSH key gerekli)
git clone git@github.com:brnakblt/arkadasozelegitim.git .
```

### 4.2 Environment Dosyalarını Ayarla

```bash
# Ana .env dosyası
cat > .env << 'EOF'
# Veritabanı
POSTGRES_USER=arkadas
POSTGRES_PASSWORD=GUCLU_BIR_SIFRE_OLUSTUR
POSTGRES_DB=arkadas_erp

# Uygulama
NODE_ENV=production
APP_URL=https://erp.arkadas.com.tr
EOF

# Strapi için
cat > strapi/.env << 'EOF'
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=arkadas_erp
DATABASE_USERNAME=arkadas
DATABASE_PASSWORD=GUCLU_BIR_SIFRE_OLUSTUR
JWT_SECRET=RASTGELE_32_KARAKTER
APP_KEYS=KEY1,KEY2,KEY3,KEY4
EOF

# Web için
cat > web/.env.local << 'EOF'
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
```

### 4.3 Servisleri Başlat

```bash
# Production compose dosyasıyla başlat
docker compose -f docker-compose.prod.yml up -d --build

# Durumu kontrol et
docker ps

# Logları izle
docker compose -f docker-compose.prod.yml logs -f
```

### 4.4 Çalıştığını Doğrula

```bash
# Her servisin çalışıp çalışmadığını kontrol et
curl http://localhost:3000        # Web: HTML dönmeli
curl http://localhost:1337/_health # Strapi: OK dönmeli
```

---

## 5. Domain ve SSL

### 5.1 DNS Ayarları

Domain sağlayıcınızda (Godaddy, Namecheap, vs):

```
A kaydı:    erp.arkadas.com.tr  →  SUNUCU_IP_ADRESI
CNAME:      www.erp.arkadas.com.tr → erp.arkadas.com.tr
```

### 5.2 Traefik ile Otomatik SSL

Traefik, Let's Encrypt'ten otomatik ücretsiz SSL sertifikası alır.

```bash
# Traefik klasörü
mkdir -p /opt/traefik && cd /opt/traefik

# Traefik yapılandırması
docker compose up -d
```

24-48 saat içinde DNS yayılır ve HTTPS aktif olur.

---

## 6. Yedekleme ve Bakım

### 6.1 Otomatik Yedekleme (Cron)

```bash
# Yedekleme scripti oluştur
cat > /opt/arkadas-erp/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/opt/backups

mkdir -p $BACKUP_DIR

# PostgreSQL yedekle
docker exec arkadas-erp-postgres-1 \
  pg_dump -U arkadas arkadas_erp > $BACKUP_DIR/db_$DATE.sql

# 7 günden eski yedekleri sil
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Yedekleme tamamlandı: $DATE"
EOF

chmod +x /opt/arkadas-erp/backup.sh

# Cron'a ekle (her gün gece 3'te)
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/arkadas-erp/backup.sh") | crontab -
```

### 6.2 Güncelleme

```bash
cd /opt/arkadas-erp
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 7. Docker Registry Nedir?

### Basit Açıklama

**Docker Registry** = Docker image'larının depolandığı yer (Docker için "app store" gibi)

Nasıl çalışır:
```
1. Geliştirici: Kodu yazar → Docker image oluşturur → Registry'ye yükler
2. Sunucu: Registry'den image'ı çeker → Container olarak çalıştırır
```

### Registry Türleri

| Registry | Açıklama | Fiyat |
|----------|----------|-------|
| **Docker Hub** | Docker'ın resmi registry'si | Public ücretsiz, private ücretli |
| **GitHub Packages** | GitHub entegreli | Repo ile birlikte |
| **Self-hosted** | Kendi sunucunuzda | Sunucu maliyeti |

### Neden Registry Kullanılır?

1. **Kaynak Kod Gizliliği**: Müşterilere kaynak kod vermeden sadece image verirsin
2. **Kolay Dağıtım**: `docker pull` ile anında indirilir
3. **Versiyon Kontrolü**: v1.0, v2.0 gibi etiketlerle yönetim

### Self-Hosted Registry Kurulumu (Private/Gizli)

```bash
# 1. Registry container'ı başlat
docker run -d \
  --name registry \
  --restart=always \
  -p 5000:5000 \
  -v /opt/registry:/var/lib/registry \
  registry:2

# 2. Image'ı etiketle
docker tag arkadas-web:latest localhost:5000/arkadas-web:v1.0

# 3. Registry'ye yükle
docker push localhost:5000/arkadas-web:v1.0

# 4. Başka sunucudan çek
# (o sunucuda) docker pull REGISTRY_IP:5000/arkadas-web:v1.0
```

### GitHub Container Registry (Önerilen)

Private GitHub repo ile birlikte ücretsiz gelir:

```bash
# 1. GitHub'a login ol
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 2. Image'ı etiketle
docker tag arkadas-web:latest ghcr.io/brnakblt/arkadas-web:v1.0

# 3. GitHub'a push et
docker push ghcr.io/brnakblt/arkadas-web:v1.0

# 4. Müşteri sunucusunda çek
docker pull ghcr.io/brnakblt/arkadas-web:v1.0
```

### Müşteriye Dağıtım Akışı

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Geliştirme  │ --> │   Registry   │ --> │ Müşteri Sunucu  │
│ Bilgisayarı │     │ (GitHub/Own) │     │                 │
│             │     │              │     │                 │
│ docker build│     │ Image depo-  │     │ docker pull     │
│ docker push │     │ lanır        │     │ docker run      │
└─────────────┘     └──────────────┘     └─────────────────┘

Müşteri SADECE docker-compose.yml dosyası alır
Kaynak kodu GÖREMEZ
```

---

## 8. Sorun Giderme

### Container Başlamıyor

```bash
# Logları kontrol et
docker logs CONTAINER_ADI

# Tüm container'ları listele (durmuş olanlar dahil)
docker ps -a

# Container'ı yeniden başlat
docker restart CONTAINER_ADI
```

### Port Çakışması

```bash
# Hangi port kullanımda?
sudo lsof -i :PORT_NUMARASI

# O process'i öldür
sudo kill -9 PID_NUMARASI
```

### Disk Dolu

```bash
# Docker cache temizle
docker system prune -a

# Kullanılmayan volume'ları sil
docker volume prune
```

### Veritabanı Hatası

```bash
# PostgreSQL logları
docker logs arkadas-erp-postgres-1

# Veritabanına bağlan
docker exec -it arkadas-erp-postgres-1 psql -U arkadas -d arkadas_erp
```

---

## 🔒 Private Repo Sonrası Git Push

Repo'yu private yaptıktan sonra:

```bash
# Push aynı şekilde çalışır
git add .
git commit -m "update"
git push origin main

# SSH key kullanıyorsan sorunsuz çalışır
# HTTPS kullanıyorsan GitHub token gerekir
```

**GitHub Token ile HTTPS:**
```bash
git remote set-url origin https://USERNAME:TOKEN@github.com/brnakblt/arkadasozelegitim.git
```

**SSH Key (Önerilen):**
```bash
# SSH key oluştur
ssh-keygen -t ed25519 -C "email@domain.com"

# Public key'i GitHub'a ekle: Settings > SSH Keys
cat ~/.ssh/id_ed25519.pub

# Remote'u SSH'a çevir
git remote set-url origin git@github.com:brnakblt/arkadasozelegitim.git
```

---

## 📞 Destek

Teknik destek için:
- E-posta: info@arkadas.com.tr
- Dokümantasyon: /docs klasörü

---

*Son Güncelleme: Aralık 2024*
