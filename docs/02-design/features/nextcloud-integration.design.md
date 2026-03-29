# Design: Nextcloud Integration (Storage Migration from SFTPGo)

## 1. Overview
The Nextcloud integration replaces SFTPGo as the primary storage engine for the Arkadaş ERP system. This change provides a more user-friendly interface for manual file management while maintaining programmatic access via WebDAV and a robust REST API for user provisioning and lifecycle management.

## 2. Infrastructure (Docker)

### 2.1. Service Configuration
We will use the official Nextcloud image alongside MariaDB for data persistence.

- **Nextcloud:** `nextcloud:latest` (FPM or Apache variant)
- **Database:** `mariadb:10.11`
- **Reverse Proxy:** Traefik will handle SSL termination and routing for `nextcloud.arkadas.com.tr`.

### 2.2. Docker Compose Snippet
```yaml
services:
  nextcloud-db:
    image: mariadb:10.11
    volumes:
      - nextcloud_db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${NEXTCLOUD_DB_ROOT_PASSWORD}
      - MYSQL_PASSWORD=${NEXTCLOUD_DB_PASSWORD}
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud

  nextcloud:
    image: nextcloud:latest
    depends_on:
      - nextcloud-db
    volumes:
      - nextcloud_data:/var/www/html
    environment:
      - MYSQL_PASSWORD=${NEXTCLOUD_DB_PASSWORD}
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_HOST=nextcloud-db
      - NEXTCLOUD_ADMIN_USER=${NEXTCLOUD_ADMIN_USER}
      - NEXTCLOUD_ADMIN_PASSWORD=${NEXTCLOUD_ADMIN_PASSWORD}
      - NEXTCLOUD_TRUSTED_DOMAINS=nextcloud.arkadas.com.tr
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nextcloud.rule=Host(`nextcloud.arkadas.com.tr`)"
      - "traefik.http.services.nextcloud.loadbalancer.server.port=80"
```

## 3. Backend Architecture (Strapi)

### 3.1. Nextcloud Utility (`strapi/src/utils/nextcloud.js`)
This class will wrap the Nextcloud Provisioning API and WebDAV operations.

- **Auth:** Basic Auth for Admin operations; User-specific WebDAV auth.
- **Methods:**
    - `ensureUser(username, password, email)`: Create or update a Nextcloud user.
    - `ensureGroup(groupName)`: Create a Nextcloud group.
    - `addUserToGroup(username, groupName)`: Assign users to groups for shared folder access.
    - `getUserQuota(username)`: Monitor storage usage.
    - `createFolder(path)`: Create directories via WebDAV.

### 3.2. Lifecycle Integration
Strapi lifecycles for `Personnel` and `Student` will trigger the Nextcloud service.

- **`afterCreate`:** Provision Nextcloud account, set initial quota, and create a private home folder.
- **`afterUpdate`:** Sync email or password changes (if applicable).
- **`afterDelete`:** Disable or delete the Nextcloud account and archive data.

### 3.3. VFS Layer Refactoring
The `storage-file` service will be updated to use the `webdav` library for all file operations.

- **Upload:** `PUT` file to `remote.php/dav/files/{user}/{path}`.
- **Download:** `GET` file from the same WebDAV endpoint.
- **Listing:** `PROPFIND` to retrieve directory contents.

## 4. API Specification (Internal)

### 4.1. Nextcloud REST API (Provisioning)
- **Base URL:** `https://nextcloud.arkadas.com.tr/ocs/v1.php/cloud`
- **Headers:** `OCS-APIRequest: true`, `Accept: application/json`

### 4.2. WebDAV (File Access)
- **Base URL:** `https://nextcloud.arkadas.com.tr/remote.php/dav/files/{username}`

## 5. Security & Migration

### 5.1. Authentication
- Strapi will use a dedicated "System Admin" account for Nextcloud provisioning.
- Users will access their files via the ERP using App Passwords or a secure backend proxy to avoid exposing their main Nextcloud credentials.

### 5.2. Migration Strategy
1. **Parallel Run:** Keep SFTPGo volumes readable while Nextcloud is being configured.
2. **Transfer Script:** Use a script to `rclone` or manually copy data from `./infra_data/sftpgo/data` to `./infra_data/nextcloud/data`.
3. **Database Update:** Update existing Strapi records to point to new Nextcloud paths.

## 6. Success Metrics
- **Performance:** File listing < 500ms for 100+ files.
- **Reliability:** 100% success rate in automatic user provisioning during student enrollment.
- **Ease of Use:** Administrators can use the Nextcloud web UI to audit and manage files directly.
