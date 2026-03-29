# Plan: Nextcloud Integration (Storage Migration from SFTPGo)

## 1. Objective
Replace the existing SFTPGo storage engine with a robust Nextcloud integration to provide enhanced file management, sharing, and synchronization capabilities for students, personnel, and administrative staff.

## 2. Technical Strategy

### 2.1. Infrastructure (Docker)
- **Service Replacement:** Remove `sftpgo` from `docker-compose.yml`.
- **New Service:** Add `nextcloud` and its database (MariaDB/PostgreSQL) to `docker-compose.yml`.
- **External Access:** Configure Traefik labels for Nextcloud to handle HTTPS and routing.

### 2.2. Backend (Strapi)
- **Service Migration:** Replace `strapi/src/utils/sftpgo.js` with a new `strapi/src/utils/nextcloud.js`.
- **API Client:** Implement a Nextcloud REST API and WebDAV client in Strapi to manage users, groups, and file operations.
- **Lifecycle Hooks:** Update `personnel` and `student` lifecycle hooks to use the new Nextcloud service for provisioning user folders and accounts.
- **VFS Layer:** Refactor `strapi/src/api/storage-file/services/vfs.js` to support Nextcloud as the primary storage provider.

### 2.3. Frontend (Web)
- **Direct Access:** Update any frontend components that interact with WebDAV directly (if any) to point to the new Nextcloud endpoints.
- **UI Integration:** Potentially integrate Nextcloud's external share links or embedded views for document management.

## 3. Implementation Phases

### Phase 1: Infrastructure Setup
1.  **Docker:** Add Nextcloud and MariaDB to `docker-compose.yml`.
2.  **Traefik:** Configure routing and SSL for `nextcloud.arkadas.com.tr`.
3.  **Environment:** Update `.env.reference` with Nextcloud credentials and URL.

### Phase 2: Backend Integration
1.  **Strapi Utility:** Create `strapi/src/utils/nextcloud.js` using `webdav` or axios for REST API calls.
2.  **User Sync:** Implement `syncUser` and `ensureGroup` equivalents for Nextcloud.
3.  **VFS Update:** Update the storage file service to route uploads/downloads through Nextcloud.

### Phase 3: Migration & Cleanup
1.  **Data Migration:** Create a script to migrate existing files from SFTPGo volumes to Nextcloud (if necessary).
2.  **Code Cleanup:** Remove all SFTPGo-related files, services, and configurations.
3.  **Docs:** Update `ARCHITECTURE.md` and `README.md`.

## 4. Testing & Verification
- **Provisioning:** Create a new student in Strapi and verify a Nextcloud account/folder is created.
- **File Ops:** Upload, list, and download files through the ERP and verify they appear in Nextcloud.
- **Permissions:** Verify that personnel can only access their assigned folders.

## 5. Success Criteria
- [ ] Nextcloud is fully operational and accessible.
- [ ] User provisioning (Students/Personnel) works seamlessly.
- [ ] All SFTPGo references are removed from the codebase.
- [ ] System stability is maintained (no regressions in file handling).
