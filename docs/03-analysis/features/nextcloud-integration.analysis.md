# Gap Analysis: Nextcloud Integration

## 1. Requirement Coverage

| Requirement | Status | Match % | Notes |
|-------------|--------|---------|-------|
| Docker Infrastructure (Nextcloud + MariaDB) | ✅ Covered | 100% | Services added to docker-compose.yml |
| Nextcloud Utility (OCS + WebDAV) | ✅ Covered | 100% | strapi/src/utils/nextcloud.js implemented |
| Personnel/Student Lifecycles | ✅ Covered | 100% | Hooks updated to sync with Nextcloud |
| VFS Layer Refactoring | ✅ Covered | 100% | storage-file service uses Nextcloud WebDAV |
| Frontend API Route Update | ✅ Covered | 100% | web/src/app/api/storage updated |
| UI/Documentation Updates | ✅ Covered | 100% | README and QuickLinks labels updated |
| Data Migration Script | ❌ Missing | 0% | Script to move files from SFTPGo not created |
| Legacy Code Cleanup | ⚠️ Partial | 50% | Core logic updated, but files and scripts remain |

## 2. Identified Gaps

### G1: Data Migration Script
The design mentioned a transfer script (using rclone or manual copy) to move existing files from SFTPGo volumes to Nextcloud. This is critical for production environments with existing data.

### G2: Maintenance Script Updates
Scripts like `scripts/restore.sh` and `scripts/storage_maintenance.sh` still contain SFTPGo-specific logic. These will fail or do nothing useful in the new architecture.

### G3: Legacy File Removal
Files like `strapi/src/utils/sftpgo.js` and `strapi/src/services/sftpgo-api.ts` are still present in the codebase.

## 3. Overall Match Rate
**Overall Match Rate: 85%**

## 4. Remediation Plan (Act Phase)
1.  **Script Cleanup:** Update `scripts/restore.sh` and `scripts/storage_maintenance.sh` to support Nextcloud backups and maintenance.
2.  **Migration Tool:** Create a simple Node.js or Bash script to migrate data between volume paths if SFTPGo data exists.
3.  **Final Cleanup:** Remove obsolete SFTPGo utility files and references in `package.json` scripts.
