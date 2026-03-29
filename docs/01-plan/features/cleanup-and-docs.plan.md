# Plan: Project Cleanup & Documentation Update

## 1. Objective
Consolidate the codebase by removing legacy components (SFTPGo), resolving logical redundancies, cleaning environment variables, and updating project documentation to reflect the current Nextcloud-based architecture and Attendance V2 features.

## 2. Technical Strategy

### 2.1. Code Cleanup (The "Logical Redundancy" Fix)
- **SFTPGo Removal:** Delete obsolete files:
    - `strapi/src/utils/sftpgo.js`
    - `strapi/src/services/sftpgo-api.ts`
    - `web/scripts/setup-sftpgo.ts`
    - `web/scripts/test-storage.ts` (if it still uses SFTPGo)
- **Service Consolidation:** Remove overlapping mock logic in `attendance-log` and `notification-hub` that was replaced by BullMQ workers.

### 2.2. Environment Variable Audit
- **Root `.env.reference`:** Remove all `SFTPGO_*` variables. Ensure `NEXTCLOUD_*` variables are correctly documented.
- **Strapi `.env.reference`:** Remove SFTPGo legacy keys.
- **Web `.env.reference`:** Update storage-related keys.

### 2.3. Documentation Refactoring
- **`README.md`:** Final check for any missed legacy references.
- **`docs/ARCHITECTURE.md`:** Update the storage layer section (SFTPGo -> Nextcloud) and the Biometric engine section.
- **`docs/DEVELOPMENT.md`:** Update local setup instructions to include Nextcloud initialization.
- **`GEMINI.md`:** Update the core mandates to reflect new service ports and architecture.

## 3. Implementation Phases

### Phase 1: File Deletion & Logic Cleanup
1.  Identify and remove all files containing "sftpgo" logic that are no longer imported.
2.  Clean up `package.json` scripts one last time.

### Phase 2: Environment Optimization
1.  Surgically remove unused keys from all `.env.reference` files.
2.  Verify that `generate_envs.sh` script is up to date.

### Phase 3: Documentation Sprint
1.  Update technical diagrams in `ARCHITECTURE.md`.
2.  Refresh setup guides in `DEVELOPMENT.md`.

## 4. Testing & Verification
- **Build Test:** Run `npm run build` across all workspaces to ensure no broken imports.
- **Lint Test:** Run `make lint` to ensure code cleanliness.
- **Seeding Test:** Ensure `npm run seed` still works with the cleaned environment.

## 5. Success Criteria
- [ ] Zero files related to SFTPGo remaining in `src/`.
- [ ] No unused storage-related environment variables in reference files.
- [ ] Documentation is 100% accurate relative to the current codebase.
- [ ] Project builds successfully without warnings.
