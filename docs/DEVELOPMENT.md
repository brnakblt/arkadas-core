# Development Setup Guide

Welcome to the development guide for **Arkadaş Özel Eğitim ERP**. This document will guide you through setting up your local environment from scratch.

## Prerequisites

Before starting, ensure you have the following installed:

| Software | Minimum | Recommended |
|----------|---------|-------------|
| Node.js | 18.x | 22.x |
| Python | 3.10 | 3.13 |
| Docker | 20.x | 24.x |
| RAM | 8 GB | 16 GB |

### Optional but Recommended
- **Infisical CLI**: For managing secrets locally
- **TablePlus** or **DBeaver**: For database inspection

---

## 1. Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd arkadasozelegitim
npm run install:all

# 2. Setup Environment
npm run setup:env

# 3. Reset & Seed (WARNING: Wipes DB)
make reset

# 4. Start Development Stack
make dev
```

---

## 2. Port Map

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Web (Next.js) | 3000 | http://localhost:3000 | Frontend |
| Strapi CMS | 1337 | http://localhost:1337/admin | Backend CMS |
| AI Service | 8000 | http://localhost:8000/docs | FastAPI / OpenCV |
| Mebbis Service | 4000 | http://localhost:4000 | MEBBİS Automation |
| Mobile (Expo) | 8082 | - | Parent/Teacher App |
| Nextcloud Admin | 8088 | http://localhost:8088 | Storage Admin |
| Collabora Online | 9980 | http://localhost:9980 | Document Editing |
| PostgreSQL | 5432 | - | Database |
| Redis | 6380 | - | Caching (Mapped from 6379) |
| PBX (FreePBX) | 81 | http://localhost:81 | Communication |
| Docs (MkDocs) | 8001 | http://localhost:8001 | Documentation |

---

## 3. Running Services

### All Services
```bash
npm run dev
```

### Individual Services
```bash
npm run dev:strapi    # Strapi CMS (v5)
npm run dev:web       # Next.js Frontend (v16)
npm run dev:ai        # AI Service (Python 3.13)
npm run dev:mebbis    # MEBBIS Automation
npm run dev:mobile    # Expo Mobile (React Native)
npm run dev:docs      # MkDocs (port 8001)
```

---

## 4. Docker Services

### Core Infrastructure
```bash
docker compose up -d
```

### Optional: Monitoring Stack
```bash
make monitoring
# Access Grafana: http://localhost:3001
```

### Optional: Nextcloud File Storage
```bash
# Start Nextcloud
docker compose up -d nextcloud

# Access: http://localhost:8088
# Credentials: check NEXTCLOUD_ADMIN_* in .env
```

### Optional: PBX (FreePBX)
```bash
# Start FreePBX
docker compose -f docker-compose.pbx.yml up -d

# Access Admin: http://localhost:81
# Default Credentials: check .env
```

### View Logs
```bash
docker compose logs -f           # All services
docker compose logs -f postgres  # Specific service
```

---

## 5. Environment Variables

### With Infisical (Recommended)
```bash
bash scripts/setup_infisical.sh
```

### Manual Setup
```bash
npm run setup:env
```

This generates:
- `.env` - Root (Docker)
- `strapi/.env` - Strapi
- `web/.env.local` - Next.js
- `ai-service/.env` - Python AI
- `mebbis-service/.env` - Mebbis

---

## 6. Database Management

### Reset Everything
```bash
npm run reset
```

This will:
1. Stop and remove all containers
2. Delete database volumes
3. Regenerate environment files
4. Rebuild Strapi
5. Seed default data

### Direct Database Access
```bash
# PostgreSQL
psql -h localhost -p 5432 -U postgres -d arkadas_erp

# Redis
redis-cli -h localhost -p 6380 -a <REDIS_PASSWORD>
```

---

## 🏗️ Architecture & Workflow

We use a dual-environment setup:
- **Development (Arch Linux):** Where you code and test.
- **Production (Ubuntu Home Server):** Where the app is served via Docker.

### The "Push-to-Deploy" Workflow
1. Develop on Arch using `npm run dev`.
2. Push to `main` branch.
3. **Coolify** (on Ubuntu) auto-builds and deploys the `docker-compose.prod.yml` stack.
4. **Cloudflare Tunnel** (on Ubuntu) routes traffic securely without needing port-forwarding.

---

## 7. Testing

### All Tests
```bash
npm run test
```

### By Service
```bash
npm run test:web      # Next.js tests
npm run test:strapi   # Strapi build check
npm run test:ai       # Python pytest
npm run test:mebbis   # Mebbis tests
npm run test:mobile   # TypeScript check
```

### E2E Tests
```bash
npm run test:e2e
```

---

## 8. Troubleshooting

### Port Conflicts
```bash
# Find what's using a port
ss -tlnp | grep <PORT>

# Kill process on port
fuser -k <PORT>/tcp
```

### Redis Authentication
Ensure `REDIS_PASSWORD` matches in:
- `.env` (Docker)
- `mebbis-service/.env`

### Mobile Build Errors
```bash
cd mobile
npm install babel-plugin-module-resolver --save-dev
npx expo start -c  # Clear cache
```

### Strapi Build Fails
```bash
rm -rf strapi/.tmp strapi/dist strapi/.cache
npm run build:strapi
```

---

## 9. Common Commands

```bash
npm run dev           # Start all services
npm run stop          # Stop all services
npm run reset         # Full reset with seed
npm run lint          # Run linters
npm run typecheck     # TypeScript check
npm run build         # Production build
```
