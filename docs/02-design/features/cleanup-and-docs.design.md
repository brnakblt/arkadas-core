# Design: Project Cleanup & Documentation Update

## 1. Overview
This design covers the systematic removal of legacy code, stabilization of environment configurations, and a comprehensive update of technical documentation. The goal is to ensure the project matches its current functional state (Nextcloud + Attendance V2) and is free of technical debt.

## 2. File Deletion Registry
The following files are identified as obsolete and will be scheduled for removal:

| File Path | Reason |
|-----------|--------|
| `strapi/src/utils/sftpgo.js` | Replaced by `nextcloud.js` |
| `strapi/src/services/sftpgo-api.ts` | Replaced by `nextcloud-api.ts` |
| `web/scripts/setup-sftpgo.ts` | Obsolete |
| `web/scripts/test-admin.ts` | Obsolete (references SFTPGo) |
| `web/scripts/test-storage.ts` | Obsolete (references SFTPGo) |
| `api/sftpgo/` | Directory no longer needed |

## 3. Logic Refactoring (Consolidation)

### 3.1. Strapi Services
- **`notification-hub`:** Remove any hardcoded mock checks that were used before BullMQ was implemented.
- **`attendance-log`:** Ensure that the ONLY way to sync is via the BullMQ queue established in Phase 2.

### 3.2. Environment Stabilization
Update `scripts/generate_envs.sh` to:
- Remove `SFTPGO_ADMIN_USER`, `SFTPGO_ADMIN_PASSWORD`.
- Add/Confirm `NEXTCLOUD_ADMIN_USER`, `NEXTCLOUD_ADMIN_PASSWORD`, `NEXTCLOUD_DB_PASSWORD`.
- Ensure `REDIS_PASSWORD` generation is present.

## 4. Documentation Strategy

### 4.1. `ARCHITECTURE.md` Updates
- **Storage Section:** Detail the Nextcloud OCS + WebDAV architecture.
- **Background Tasks:** Document the BullMQ -> Redis -> Worker flow.
- **Biometric Flow:** Include the 5-frame EAR + Movement variance algorithm.

### 4.2. `DEVELOPMENT.md` Updates
- **Setup:** Add a step for "Nextcloud Initial Login" or "Provisioning Admin via Script".
- **Tooling:** Document how to monitor queues using a Redis GUI or CLI.

### 4.3. `GEMINI.md` Updates
- **Port Map:** Update SFTPGo (8088) to Nextcloud (8088).
- **Mandates:** Re-verify that all architectural standards match the current v5 implementation.

## 5. Verification Plan
1.  **Dependency Check:** Run `grep -r "sftpgo" .` after deletion to ensure no imports remain.
2.  **Schema Check:** Verify Strapi starts without errors after removing service files.
3.  **Docs Check:** Ensure all links in `README.md` and `MkDocs` work.
