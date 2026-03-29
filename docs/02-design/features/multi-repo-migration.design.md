# Design: Monorepo to Multi-Repo Migration

## 1. Overview
This design specifies the operational steps to split the current `arkadasozelegitim` monorepo into independent, specialized repositories. The architecture will follow the "Core + Clients + SDK" pattern to ensure high modularity and scalability.

## 2. Repository Breakdown

### 2.1. `arkadas-core` (The Server)
- **Content:** 
    - `strapi/` (Backend)
    - `api/opencv/` (AI Service)
    - `docker/` (Infrastructure configs)
    - `scripts/` (Maintenance/Setup scripts)
    - `docker-compose.yml` (The Master orchestrator)
    - `Makefile` (System management)
- **Role:** Handles data persistence, business logic, AI processing, and service orchestration.

### 2.2. `arkadas-web` (The Main Frontend)
- **Content:** `web/` directory.
- **Role:** Independent Next.js application. Communicates with `arkadas-core` via REST/GraphQL.

### 2.3. `arkadas-sdk` (The Connector)
- **Content:** 
    - Shared TypeScript interfaces (from `strapi/types` and `web/src/types`).
    - API client wrappers (Axios/Fetch instances).
    - Validation schemas (Zod).
- **Distribution:** Private NPM package or Git Submodule.

### 2.4. `arkadas-android` & `arkadas-ios` (Mobile Clients)
- **Android:** Fork of `nextcloud/android` with Arkadaş ERP branding and SDK integration.
- **iOS:** Fork of `nextcloud/ios` with Arkadaş ERP branding.

## 3. Migration Workflow (The "Surgical Split")

### 3.1. Prescription for Splitting
We will use `git filter-repo` to ensure each new repository retains its relevant commit history while becoming lightweight.

1.  **Preparation:** Clone the monorepo for each target repository.
2.  **Web Split:** 
    ```bash
    git filter-repo --subdirectory-filter web/
    ```
3.  **Core Split:**
    - Keep: `strapi/`, `api/`, `docker/`, `scripts/`, root config files.
    - Remove: `web/`, `mobile/`, `docs/01-plan/`, etc.

### 3.2. Dependency Management
- Client repositories (`web`, `mobile`) will add `arkadas-sdk` as a dependency.
- `arkadas-core` will publish its API schema to `arkadas-sdk` automatically on build.

## 4. Orchestration & Deployment

### 4.1. Centralized Docker
The `arkadas-core` repository will remain the "System Controller." 
Its `docker-compose.yml` will be updated to use:
- **Local Source:** For `strapi` and `ai-service` (Development).
- **Remote Images:** For `arkadas-web` (Production).

### 4.2. Secret Management (Infisical)
Infisical project folders will be restructured to match the new repo names:
- `/arkadas-core/`
- `/arkadas-web/`
- `/arkadas-mobile/`

## 5. Success Metrics
- **Build Isolation:** `arkadas-web` can build successfully without `strapi` files being present.
- **Modularity:** A change in the Android app does not trigger CI for the Backend.
- **Synchronization:** The SDK ensures type safety between `core` and `web` across repos.
