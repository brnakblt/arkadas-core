'use strict';

const fs = require('fs');

/**
 * Standalone SFTPGo Sync Utility for Seed and Lifecycles
 * Designed to work in both ESM and CJS environments without complex TS dependencies
 */
class SftpGoService {
    constructor(url, user, pass) {
        this.baseUrl = url || process.env.SFTPGO_URL || 'http://localhost:8088';
        this.adminUser = user || process.env.SFTPGO_ADMIN_USER || 'admin';
        this.adminPassword = pass || process.env.SFTPGO_ADMIN_PASSWORD;
        this.token = null;
        this.tokenExpiresAt = null;
    }

    async authenticate() {
        try {
            if (!this.adminPassword) {
                console.warn('[SFTPGo] Password not set, skipping auth.');
                return false;
            }

            const authString = Buffer.from(`${this.adminUser}:${this.adminPassword}`).toString('base64');
            const res = await fetch(`${this.baseUrl}/api/v2/token`, {
                method: 'GET',
                headers: { 'Authorization': `Basic ${authString}` }
            });

            if (!res.ok) {
                console.error(`[SFTPGo] Auth Error: ${res.status}`);
                return false;
            }

            const data = await res.json();
            this.token = data.access_token;
            this.tokenExpiresAt = data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + 3500 * 1000;
            return true;
        } catch (e) {
            console.error(`[SFTPGo] Not Reachable: ${e.message}`);
            return false;
        }
    }

    async ensureAuth() {
        const now = Date.now();
        if (!this.token || !this.tokenExpiresAt || now >= this.tokenExpiresAt - 30000) {
            return await this.authenticate();
        }
        return true;
    }

    async request(endpoint, method = 'GET', body = null) {
        if (!(await this.ensureAuth())) return null;

        try {
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            };
            if (body) options.body = JSON.stringify(body);

            const res = await fetch(`${this.baseUrl}/api/v2${endpoint}`, options);
            if (!res.ok && res.status !== 404) {
                const err = await res.text();
                throw new Error(`SFTPGo Error (${res.status}): ${err}`);
            }
            
            if (res.status === 204 || method === 'DELETE') return { success: true };
            return await res.json();
        } catch (e) {
            console.error(`[SFTPGo] Request Failed (${endpoint}):`, e.message);
            return null;
        }
    }

    async ensureGroup(name, description) {
        const existing = await this.request(`/groups/${name}`);
        if (existing && existing.name) return;

        await this.request('/groups', 'POST', {
            name,
            description: description || `Group ${name}`,
            permissions: { '/': ['*'] }
        });
    }

    async syncUser(params) {
        const { username, password, email, description, group, deleteUser = false } = params;
        if (!username) return;

        if (deleteUser) {
            await this.request(`/users/${username}`, 'DELETE');
            return;
        }

        const existing = await this.request(`/users/${username}`);
        const method = existing && existing.username ? 'PUT' : 'POST';
        const endpoint = method === 'PUT' ? `/users/${username}` : '/users';

        const userData = {
            username,
            status: 1,
            email: email || `${username}@arkadas.com.tr`,
            description: description || 'Synced from ERP',
            home_dir: `/srv/sftpgo/data/${username}`,
            permissions: { '/': ['*'] }
        };

        if (password) userData.password = password;
        if (group) userData.groups = [{ name: group, type: 1 }];

        await this.request(endpoint, method, userData);
    }
}

module.exports = SftpGoService;
