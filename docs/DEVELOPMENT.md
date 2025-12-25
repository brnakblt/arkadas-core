# Development Setup Guide

Welcome to the development guide for **Arkadaş Özel Eğitim ERP**. This document will guide you through setting up your local environment from scratch.

## Prerequisites

Before starting, ensure you have the following installed:

*   **Docker** & **Docker Compose** (v2.0+)
*   **Node.js** (v18 or v20 LTS)
*   **Git**

### Optional but Recommended
*   **Infisical CLI**: For managing secrets locally (or use `.env` files).
*   **TablePlus** or **DBeaver**: For database inspection.

---

## 1. Initial Setup

### Clone the Repository
```bash
git clone <repository-url>
cd arkadasozelegitim
```

### Configure Environment Variables
We use **Infisical** for secret management, but for local development, you can create a `.env` file in the root directory if you don't have the SDK configured locally.

**Create `.env`:**
```bash
cp .env.example .env
```
*(If `.env.example` doesn't exist, create one based on `docker-compose.yml` defaults)*

**Required Variables for Infisical (if used):**
```bash
export INFISICAL_CLIENT_ID="<your-client-id>"
export INFISICAL_CLIENT_SECRET="<your-client-secret>"
export INFISICAL_PROJECT_ID="<your-project-id>"
```

---

## 2. Running the Application

 We use Docker Compose to spin up all services (Postgres, Redis, Strapi, Web, AI Service, Mebbis Service).

### Start Development Environment
```bash
npm run dev:docker
```
*This command starts the `core` profile services (Postgres, Redis).*

To start **ALL** services (including apps):
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Access Points
*   **Web App**: [http://localhost:3000](http://localhost:3000)
*   **Strapi Admin**: [http://localhost:1337/admin](http://localhost:1337/admin)
*   **Mebbis Service**: [http://localhost:4000](http://localhost:4000)
*   **AI Service**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **Uptime Kuma**: [http://localhost:3001](http://localhost:3001) (if enabled)
*   **Dozzle (Logs)**: [http://localhost:8888](http://localhost:8888)

---

## 3. Database Management

### Resetting the Database
If you need a completely fresh start (wiping all data):
```bash
./scripts/reset_docker.sh
```
*Warning: This deletes all docker volumes!*

### Port Conflicts
*   **Redis**: Mapped to host port `6380` to avoid conflicts with local Redis instances.
*   **Postgres**: Mapped to host port `5432`.

---

## 4. Testing

### Run All Tests
```bash
./scripts/run-tests.sh
```

### Web Unit Tests
```bash
cd web
npm run test:unit
```

### E2E Tests (Playwright)
```bash
cd web
npx playwright test --project=chromium
```

---

## 5. Troubleshooting

*   **"React not found"**: Run `npm install` in `web/` to link dependencies.
*   **Port 5432/6379 in use**: Check if you have local Postgres/Redis running (`sudo systemctl status postgresql`) or use the `scripts/reset_docker.sh` script.
