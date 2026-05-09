# Tech Stack - Arkadaş Özel Eğitim ERP

This document details the technologies and versions used in the project.

## Frontend
- **Framework:** Next.js 16 (App Router)
- **State:** React Hooks / Context API / React Query
- **UI:** Tailwind CSS, Radix UI, Lucide Icons
- **E2E Testing:** Playwright / Vitest

## Backend (CMS)
- **Framework:** Strapi v5 (TypeScript)
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Auth:** Custom JWT with HTTP-Only Cookies

## Mobile
- **Framework:** React Native (Expo SDK 50+)
- **Language:** TypeScript
- **Navigation:** React Navigation

## AI & Services
- **Backend:** Python 3.13 (FastAPI)
- **Computer Vision:** OpenCV
- **Integration:** SFTPGo (WebDAV)
- **PBX:** Asterisk / FreePBX

## DevOps & Infrastructure
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Makefile
- **Monitoring:** Prometheus, Grafana, Loki
- **Secrets:** Infisical / `.env` files

## Security & Honesty
- **Policy:** [SECURITY_HONESTY_RULES.md](../docs/SECURITY_HONESTY_RULES.md)
- **PII Protection:** AES-256-GCM encryption at database level (Strapi + Postgres)
- **Ethics:** Mandatory human verification for AI-generated educational content (BEP)
- **Compliance:** KVKK (Turkey) & GDPR (General Principles)
