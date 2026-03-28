# Arkadaş ERP - Remediation Action Plan

## Objective
Address critical security, architectural, and technical debt issues identified in the system audit.

## Key Files & Context
- **Strapi:** `strapi/package.json`, `strapi/src/utils/sftpgo.js`, `strapi/src/api/auth/2fa` (to be created/verified)
- **Frontend:** `web/src/providers/TwoFactorProvider.tsx`, `web/src/lib/mebbis` (to be located)
- **AI Service:** `api/opencv/main.py`
- **Infrastructure:** `docker-compose.yml`, `Makefile`

## Implementation Plan

### Phase 1: Critical Security Fixes
1.  **Strapi v5 Migration (Finalization):**
    - [x] Update `package.json` (Done).
    - [x] Run migration scripts (Done - auto-migrated on start).
    - [x] Verify admin panel functionality (Done - Strapi starts successfully).
2.  **SFTPGo JWT Handling:**
    - Update `strapi/src/utils/sftpgo.js` to store `tokenExpiresAt`.
    - Add a check before every request to re-authenticate if the token is expired or missing.
3.  **Real TOTP Validation:**
    - Install `otplib` in Strapi.
    - Implement `POST /api/auth/2fa/verify` and `setup` in Strapi to perform actual TOTP validation.
    - Remove "demo" 6-digit acceptance in `web/src/providers/TwoFactorProvider.tsx`.

### Phase 2: High Priority Architectural Changes
1.  **Mebbis Logic Migration:**
    - Identify Mebbis domain logic in `web/src/lib`.
    - Create a Strapi service `mebbis-compliance` to host this logic.
    - Update the frontend to call the Strapi API instead of local lib.
2.  **Next.js Version Stabilization:**
    - Verify if Next.js 16 features are used. If unstable, downgrade to 15.1.7 as suggested.

### Phase 3: Technical Debt & Standardization
1.  **OpenCV Refactoring:**
    - Refactor `api/opencv/main.py` into a modular FastAPI structure (routers, services, models).
    - Add `requirements.txt`.
    - Fix `np.fromstring` deprecation.
2.  **Service Consolidation:**
    - Consolidate SFTPGo clients in `strapi/src/services/sftpgo-api.ts` and `strapi/src/utils/sftpgo.js`.
3.  **Test Runner Consolidation:**
    - Standardize on Vitest. Remove Jest configurations and dependencies.
4.  **State Management Standardization:**
    - Remove SWR from `web/package.json`.
    - Migrated SWR hooks to TanStack Query.

## Verification & Testing
- **Security:** Manual test of 2FA with an actual TOTP app (Google Authenticator).
- **Security:** Verify SFTPGo operations work after 1 hour (token expiry test).
- **Architecture:** Run E2E tests for Mebbis flows.
- **AI:** Run `pytest` on the refactored OpenCV service.
- **Consolidation:** Run `npm run build` and `make lint` across all workspaces.
