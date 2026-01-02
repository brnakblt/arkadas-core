# Arkadaş Özel Eğitim ERP - Developer Guide

Welcome to the development guide for the Arkadaş Özel Eğitim Monorepo. This project integrates Strapi (CMS), Next.js (Web), Expo (Mobile), and Python (AI Services) into a unified platform for special education management.

## 📁 Project Structure

This is a TurboRepo monorepo.

*   **`web`**: Next.js 14 application (Teacher/Parent Dashboard).
*   **`mobile`**: Expo / React Native application (Parent App).
*   **`strapi`**: Headless CMS & Source of Truth (Postgres).
*   **`mebbis-service`**: Node.js/Express service for MEBBIS automation.
*   **`ai-service`**: FastAPI Python service for Face Recognition & LLM features.
*   **`scripts`**: Utility scripts for setup, maintenance, and backup.

---

## 🚀 Getting Started

### Prerequisites

*   **Node.js**: v20+ (Managed via `nvm` recommended).
*   **Docker & Docker Compose**: Essential for database and backend services.
*   **Python**: v3.11+ (For AI Service).
*   **Git**: Version control.
*   **Infisical CLI**: For secret management (Installed automatically by setup script if on Linux).

### Initial Setup

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd arkadasozelegitim
    ```

2.  **Install Dependencies**:
    Dependencies are managed at the root level via npm workspaces.
    ```bash
    npm install
    ```

3.  **Setup Infisical (Secret Management)**:
    We use Infisical to manage secrets centrally. Run the setup script to install the CLI and configure the project.
    ```bash
    bash scripts/setup_infisical.sh
    ```
    *Follow the on-screen prompts to login and select the project.*

4.  **Start Docker Infrastructure**:
    Before running apps, ensure databases (Postgres, Redis) are up.
    ```bash
    npm run dev:docker
    ```

5.  **Run Development Mode**:
    This starts all services (Web, Strapi, Mobile, AI) in parallel.
    ```bash
    npm run dev
    ```

6.  **Seed Initial Data (Students & Staff)**:
    Required for the first run. Populates database from Excel/XML files.
    ```bash
    cd strapi
    npm run script scripts/seed_xml.js
    ```
    *Note: Ensure `web/public/excel/ogrencilistesi.xml` and `personellistesi.xml` are present. These files are git-ignored for privacy.*

---

## 🛠️ Development Workflow

### Useful Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the full stack (Web, Strapi, AI, Mobile, Mebbis). |
| `npm run dev:web` | Start only the Next.js Web App. |
| `npm run dev:mobile` | Start the Expo Mobile App. |
| `npm run build` | Build all applications using Turbo. |
| `npm run lint` | Lint all applications. |
| `npm run reset` | **DANGER**: Wipes all databases and resets the project to fresh state. |
| `npm run stop` | Stops all Docker containers and running processes. |

### Mobile Development (Expo)

*   **Running**: `npm run dev:mobile` starts the Metro Bundler.
*   **Android/iOS**: Press `a` or `i` in the terminal to open the emulator.
*   **Troubleshooting**:
    *   If you see `ReactCurrentDispatcher` or duplicates, run `npm install --legacy-peer-deps` and restart.
    *   If you see `EACCES` errors, ensure Metro is ignoring the `databases/` folder (fixed in `metro.config.js`).

### AI Development (Python)

*   The AI service runs on port `8000`.
*   Swagger Docs: `http://localhost:8000/docs`.
*   Dependency Management: `ai-service/requirements.txt`.
*   **IEP Generator**: Requires `OPENAI_API_KEY` in `.env`.

---

## 🔧 Troubleshooting

### 1. `ECONNREFUSED` Errors
*   **Cause**: Docker containers (Postgres/Redis) are not running or healthy.
*   **Fix**: Run `npm run dev:docker` and wait for "healthy" status. Check `docker ps`.

### 2. Metro Bundler "Permission Denied"
*   **Cause**: Metro trying to watch Docker-locked database folders.
*   **Fix**: Already configured in `mobile/metro.config.js` to exclude `databases/`.

### 3. Strapi "Vite Cache" Errors
*   **Cause**: React version mismatch or corrupt `.strapi` folder.
*   **Fix**: Run `npm run stop` then `rm -rf strapi/.strapi strapi/build`.

---

## 📦 Deployment & Backups

### Automated Backups
*   **Script**: `scripts/verify_backup.sh`
*   **Usage**: Run manually or via CI to verify database backup/restore integrity.

### CI/CD
*   GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push:
    *   Linting
    *   Unit Tests (`vitest`)
    *   E2E Tests (`playwright`)
    *   Backup Verification
    *   Build Verification

---

## 📝 Scripts Reference

*   `scripts/setup_arch.sh`: Setup script for Arch Linux env (User specific).
*   `scripts/setup_ubuntu_server.sh`: Provisioning script for Ubuntu VPS.
*   `scripts/generate_envs.sh`: Secure secret generation.
*   `scripts/verify_backup.sh`: Disaster recovery testing.
