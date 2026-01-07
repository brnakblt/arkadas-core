# Arkadaş Özel Eğitim ERP - Developer Guide

Welcome to the development guide for the Arkadaş Özel Eğitim Monorepo. This project integrates Strapi (CMS), Next.js (Web), Expo (Mobile), and Python (AI Services) into a unified platform for special education management.

## 📁 Project Structure

This is a TurboRepo monorepo.

| Directory | Description |
|-----------|-------------|
| `web/` | Next.js 16 Frontend (Teacher/Parent Dashboard) |
| `strapi/` | Strapi v5 CMS (Postgres backend) |
| `docs/` | MkDocs documentation |
| `scripts/` | Utility scripts |
| `scripts/` | Utility scripts |

---

## 🗄️ Database Architecture

A common question is: *"Doesn't Strapi have its own database?"*

**No, Strapi is a Headless CMS application, not a database.**

- **Strapi (The Application)**: It manages content types, API endpoints, and the admin interface. It's the logic layer.
- **PostgreSQL (The Storage)**: This is where the actual data lives. Strapi connects to Postgres to store and retrieve all content, users, and configurations.

Think of it this way: Strapi is the *librarian*, and PostgreSQL is the *library shelves*. Without the shelves (Postgres), the librarian (Strapi) has nowhere to put the books (Data).

---

## 🌐 Port Map

| Service | Port | URL |
|---------|------|-----|
| Web (Next.js) | 3000 | http://localhost:3000 |
| Strapi CMS | 1337 | http://localhost:1337/admin |
| PostgreSQL | 5432 | - |
| Redis | 6380 | - |
| SFTPGo | 8088 | http://localhost:8088 |

---

## 🚀 Getting Started

### Prerequisites

| Software | Minimum | Recommended |
|----------|---------|-------------|
| Node.js | 18.x | 22.x |
| Docker | 20.x | 24.x |
| RAM | 8 GB | 16 GB |

### Quick Setup

```bash
# 1. Clone
git clone <repo-url>
cd arkadasozelegitim

# 2. Install all dependencies
npm run install:all

# 3. Generate environment files
npm run setup:env

# 4. Reset and seed database
npm run reset

# 5. Start development
npm run dev
```

---

## 🛠️ NPM Commands

### Development
| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services |
| `npm run dev:strapi` | Strapi only |
| `npm run dev:web` | Next.js only |

### Build & Test
| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run tests |

### Management
| Command | Description |
|---------|-------------|
| `npm run reset` | **DANGER**: Wipe DB and reseed |
| `npm run stop` | Stop all services |
| `npm run setup:env` | Generate .env files |

---

---

## 🏗️ Architecture & Workflow

We use a dual-environment setup to ensure production stability while maintaining high development velocity.

### Environments
- **Development (Arch Linux Laptop):** Local machine where code is written, linted, and tested.
- **Production (Ubuntu Laptop - Home Server):** Dedicated hardware serving the app via Docker.

### The "Push-to-Deploy" Workflow
1. **Develop** locally on your Arch machine using `npm run dev`.
2. **Commit** and **Push** changes to the `main` branch on GitHub.
3. **Coolify** (running on your Ubuntu laptop) detects the push, pulls the code, and builds images.
4. **Cloudflare Tunnel** (running on your Ubuntu laptop) routes `arkadasozelegitim.com` to your local Docker stack.

---

## 🐳 Docker Services

### Core Infrastructure
```bash
docker compose up -d  # PostgreSQL, Redis, SFTPGo
```

### Production Stack
For production deployment, we use `docker-compose.prod.yml` which includes all application services. This is managed automatically by Coolify.

---

## 🌐 Network & Access

To avoid conflicts with existing services (like port 80/443 being used by other apps in the office), we use **Cloudflare Tunnels**.

- **Public URL:** `https://arkadasozelegitim.com`
- **Internal Mapping:** Tunnel points to `http://localhost:3000` (Web container).
- **Security:** No ports need to be opened on the office router.

---

## 🔐 Security

### Authentication
- **Fail-Closed**: Services reject requests if API key is not configured
- **Rate Limiting**: Login endpoint: 5 attempts/15 minutes
- **Tenant Isolation**: All data is tenant-scoped via `x-tenant-id`

---

## 🔧 Troubleshooting

### Redis Authentication Errors
Ensure `REDIS_PASSWORD` matches in:
- `.env` (Docker)
- `mebbis-service/.env`

### Port Conflicts
If port `80` or `443` is already taken on your network (e.g., by a Windows PC running another app), **do not use port forwarding**. Use the Cloudflare Tunnel setup described in [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## 📦 CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
- ✅ Linting
- ✅ TypeScript check
- ✅ Unit Tests (Vitest)
- ✅ E2E Tests (Playwright)
- ✅ Build Verification

---

## 📦 CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
- ✅ Linting
- ✅ TypeScript check
- ✅ Unit Tests (Vitest)
- ✅ E2E Tests (Playwright)
- ✅ Build Verification

---

## 📝 Scripts Reference

| Script | Description |
|--------|-------------|
| `scripts/setup_infisical.sh` | Infisical setup |
| `scripts/generate_envs.sh` | Generate .env files |
| `scripts/reset_project.sh` | Full reset with seed |
| `scripts/verify_backup.sh` | Backup verification |
