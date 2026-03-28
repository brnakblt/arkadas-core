# Design Document - Remediation Feature

## 1. Objective
Ensure system stability, security, and architectural consistency by addressing identified technical debt and vulnerabilities.

## 2. Architecture Changes

### 2.1. Backend (Strapi)
- **SFTPGo Service:** Consolidated into `strapi/src/services/sftpgo-api.ts`. Added JWT expiration handling and `ensureAuth` logic.
- **2FA System:** Implemented `api/two-factor-auth` using `otplib` and `qrcode`. 
    - `POST /auth/2fa/setup`: Generates secret and QR code.
    - `POST /auth/2fa/verify`: Validates TOTP code and enables 2FA.
    - `POST /auth/2fa/disable`: Validates and disables 2FA.
- **Mebbis Compliance:** Moved domain logic from frontend to `api/mebbis-compliance`. Exposed endpoints for lesson and compensation validation.

### 2.2. Frontend (web)
- **Next.js:** Downgraded to `15.5.14` for production stability.
- **2FA UI:** Updated `TwoFactorProvider.tsx` to interface with real Strapi 2FA endpoints. Removed all mock/demo logic.
- **State Management:** Uninstalled `swr`. Standardized on TanStack Query (Note: Migration of existing components is required).
- **Testing:** Removed Jest. Standardized on Vitest.

### 2.3. AI Service (opencv)
- **Modularization:** Refactored `main.py` into a FastAPI application structure under `app/`.
- **FaceService:** Isolated face recognition logic. Fixed `np.fromstring` deprecation using `np.frombuffer`.

## 3. Security Design
- **TOTP:** Mandatory real-time validation for 2FA actions.
- **JWT:** Proactive token renewal for SFTPGo admin sessions.

## 4. Verification Plan
- [ ] Strapi v5 Admin: Check if admin login and content manager work.
- [ ] 2FA Flow: Setup, verify, and disable with a real TOTP app.
- [ ] SFTPGo Sync: Trigger a user sync and check SFTPGo logs.
- [ ] Next.js Build: Run `npm run build` in `web/` directory.
- [ ] OpenCV API: Test `/verify` endpoint with probe and reference images.
