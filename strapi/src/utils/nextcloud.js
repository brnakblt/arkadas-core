'use strict';

/**
 * Nextcloud Integration Utility for Strapi
 * Handles Provisioning (OCS API) and File Operations (WebDAV)
 */
class NextcloudService {
    constructor(url, adminUser, adminPass) {
        this.baseUrl = (url || process.env.NEXTCLOUD_URL || 'http://localhost:8088').replace(/\/$/, '');
        this.adminUser = adminUser || process.env.NEXTCLOUD_ADMIN_USER || 'admin';
        this.adminPass = adminPass || process.env.NEXTCLOUD_ADMIN_PASSWORD;
        this.ocsBase = `${this.baseUrl}/ocs/v1.php/cloud`;
    }

    getAuthHeader() {
        return {
            'Authorization': `Basic ${Buffer.from(`${this.adminUser}:${this.adminPass}`).toString('base64')}`,
            'OCS-APIRequest': 'true',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    async ocsRequest(endpoint, method = 'GET', body = null) {
        try {
            const url = `${this.ocsBase}${endpoint}`;
            const options = {
                method,
                headers: this.getAuthHeader()
            };
            
            if (body && (method === 'POST' || method === 'PUT')) {
                // Nextcloud OCS API sometimes prefers URL encoded or specific JSON formats
                options.body = JSON.stringify(body);
            }

            const res = await fetch(url, options);
            if (!res.ok && res.status !== 404) {
                const err = await res.text();
                console.error(`[Nextcloud] OCS Error (${res.status}): ${err}`);
                return null;
            }

            if (res.status === 204) return { success: true };
            const data = await res.json();
            return data.ocs;
        } catch (e) {
            console.error(`[Nextcloud] OCS Request Failed (${endpoint}):`, e.message);
            return null;
        }
    }

    /**
     * Ensure a user exists in Nextcloud
     */
    async syncUser(params) {
        const { username, password, email, deleteUser = false } = params;
        if (!username) return;

        if (deleteUser) {
            await this.ocsRequest(`/users/${username}`, 'DELETE');
            return;
        }

        // Check if user exists
        const existing = await this.ocsRequest(`/users/${username}`);
        
        if (existing && existing.data && existing.data.displayname) {
            // Update existing user (email, quota, etc.)
            if (email) {
                await this.ocsRequest(`/users/${username}`, 'PUT', { key: 'email', value: email });
            }
            if (password) {
                await this.ocsRequest(`/users/${username}`, 'PUT', { key: 'password', value: password });
            }
            return { success: true, method: 'PUT' };
        } else {
            // Create new user
            const result = await this.ocsRequest('/users', 'POST', {
                userid: username,
                password: password || 'arkadas-default-pass',
                email: email || `${username}@arkadas.com.tr`
            });
            
            // By default, create a home folder via WebDAV if needed (Nextcloud does this on first login)
            return result;
        }
    }

    async ensureGroup(groupName) {
        const res = await this.ocsRequest('/groups', 'POST', { groupid: groupName });
        return res;
    }

    async addUserToGroup(username, groupName) {
        const res = await this.ocsRequest(`/users/${username}/groups`, 'POST', { groupid: groupName });
        return res;
    }

    /**
     * WebDAV Methods (Basic implementation using fetch)
     */
    async webdavRequest(path, method = 'PROPFIND', body = null, headers = {}) {
        const url = `${this.baseUrl}/remote.php/dav/files/${this.adminUser}${path}`;
        const options = {
            method,
            headers: {
                ...this.getAuthHeader(),
                ...headers
            }
        };
        if (body) options.body = body;

        try {
            const res = await fetch(url, options);
            return res;
        } catch (e) {
            console.error(`[Nextcloud] WebDAV Failed (${path}):`, e.message);
            return null;
        }
    }

    async createFolder(path) {
        return await this.webdavRequest(path, 'MKCOL');
    }
}

module.exports = NextcloudService;
