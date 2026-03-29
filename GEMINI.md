# Arkadaş Özel Eğitim ERP - Gemini CLI Mandates

This file defines the foundational instructions and technical standards for the Arkadaş Özel Eğitim ERP project.

## Project Overview
- **Core Goal:** Comprehensive ERP system for a Special Education and Rehabilitation Center.
- **Motto:** "Her Çocuk Özel ve Değerli!"
- **Architecture:** 
  - **Frontend:** Next.js 16 (App Router, Tailwind CSS, TypeScript) - Port 3000
  - **Backend/CMS:** Strapi v5 (PostgreSQL) - Port 1337
  - **Mobile:** React Native (Expo) - Port 8082
  - **AI Service:** Python 3.13 (FastAPI/OpenCV) - Port 8000
  - **Storage:** Nextcloud (WebDAV) - Port 8088
  - **Infrastructure:** Docker Compose, Makefile management, Redis/BullMQ Queue.

## Engineering Standards

### 1. General Workflow
- **Mandatory:** Use `/pdca` workflow for all new features.
- **Validation:** Always verify changes by running `make lint` or service-specific tests.
- **Security:** Never hardcode secrets. Use `.env` files. Reference `scripts/generate_envs.sh`.

### 2. Frontend (web/)
- **Stack:** Next.js 16, TypeScript, Tailwind CSS, Lucide React icons.
- **Convention:** Use App Router. Components should be functional and modular.
- **Style:** Clean, accessible, and responsive (Mobile-first).

### 3. Backend (strapi/)
- **Stack:** Strapi v5, TypeScript.
- **Convention:** Follow Strapi v5 patterns. Integrated with Nextcloud OCS/WebDAV and BullMQ.
- **Integration:** Maintain sync with Nextcloud for user file management.

### 4. AI & Python (api/opencv)
- **Stack:** Python 3.13, OpenCV, FastAPI.
- **Focus:** Document processing, image recognition (OpenCV), and AI-driven BEP (Bireyselleştirilmiş Eğitim Programı) generation.

### 5. Mobile (mobile/)
- **Stack:** React Native, Expo, TypeScript.
- **Focus:** Parent/Teacher portal.

### 6. AI Assistant Directives
- **Proactive Tooling:** Always use external tools, skills, MCP servers, and the `gemini-cli` when needed. Actively use system tools (`nvm`, `node`, `npm`, `python`, `pip`) and project `dev` scripts.
- **Context Gathering:** On new chats, always read the `conductor/` directory and inspect `git diff` or recent logs to understand where the codebase left off.
- **Code Quality:** Always write high-quality, robust code. "Okay, it works fine" is NOT acceptable. Do not write code with issues.
- **KISS Principle:** Keep solutions simple and straightforward. Avoid over-engineering or making things complex.
- **Documentation:** Always use comments generously to explain logic.
- **Clarification:** Always ask questions when needed instead of making assumptions.

## Operational Mandates
- **Context:** Always refer to `docs/ARCHITECTURE.md` and `docs/DEVELOPMENT.md` for deep context.
- **Maintenance:** Use `make backup` before significant database schema changes.
- **Testing:** Add E2E tests for critical flows in `web/e2e`.

## Port Map Reference
- Web: 3000
- Strapi: 1337
- AI: 8000
- Mebbis: 4000 (Internal service for Mebbis integration)
- Mobile: 8082
