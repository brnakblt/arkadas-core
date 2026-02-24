'use strict';

// Shared SFTPGo Service Utility
// Handles authentication and CRUD for Users/Groups

class SftpGoService {
    constructor() {
        this.baseUrl = process.env.SFTPGO_URL || 'http://localhost:8088';
        this.adminUser = process.env.SFTPGO_ADMIN_USER || 'admin';
        this.adminPassword = process.env.SFTPGO_ADMIN_PASSWORD;
        this.token = null;
    }

    async authenticate() {
        // If we have a token and it's not expired (basic check), verify or refresh?
        // For simple scripts/lifecycles, re-auth is safer
        try {
            if (!this.adminPassword) {
                console.warn('SFTPGO_ADMIN_PASSWORD not set, skipping sync.');
                return false;
            }

            const authString = Buffer.from(`${this.adminUser}:${this.adminPassword}`).toString('base64');
            const res = await fetch(`${this.baseUrl}/api/v2/token`, {
                method: 'GET',
                headers: { 'Authorization': `Basic ${authString}` }
            });

            if (!res.ok) {
                console.error(`SFTPGo Auth Error: ${res.status}`);
                return false;
            }

            const data = await res.json();
            this.token = data.access_token;
            return true;
        } catch (e) {
            console.error(`SFTPGo Not Reachable: ${e.message}`);
            return false;
        }
    }

    async ensureGroup(name, description) {
        if (!this.token && !(await this.authenticate())) return;

        try {
            const check = await fetch(`${this.baseUrl}/api/v2/groups/${name}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (check.ok) return; // Group exists

            const groupData = {
                name,
                description,
                permissions: { "/": ["*"] }
            };

            await fetch(`${this.baseUrl}/api/v2/groups`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupData)
            });
            console.log(`SFTPGo Group created: ${name}`);
        } catch (e) {
            console.error(`SFTPGo Group Failed (${name}):`, e.message);
        }
    }

    async syncUser({ username, password, email, description, group, deleteUser = false }) {
        if (!this.token && !(await this.authenticate())) return;
        if (!username) return;

        try {
            if (deleteUser) {
                await fetch(`${this.baseUrl}/api/v2/users/${username}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                console.log(`SFTPGo User deleted: ${username}`);
                return;
            }

            // Check existence
            const check = await fetch(`${this.baseUrl}/api/v2/users/${username}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const method = check.ok ? 'PUT' : 'POST';
            const url = check.ok
                ? `${this.baseUrl}/api/v2/users/${username}`
                : `${this.baseUrl}/api/v2/users`;

            const userData = {
                username,
                password, // Only updated if provided and not empty
                email: email || `${username}@arkadas.com.tr`,
                status: 1,
                description,
                home_dir: `/srv/sftpgo/data/${username}`,
                permissions: { "/": ["*"] },
                filesystem: { provider: 0 }
            };

            if (group) {
                userData.groups = [{ name: group, type: 1 }];
            }

            // If updating, maybe we don't want to change password if not provided?
            // But usually we sync everything. If password is null, SFTPGo might error or keep old.
            // Let's assume password is required for now or handled by caller.

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error(`SFTPGo Sync Error (${username}): ${txt}`);
            } else {
                console.log(`SFTPGo synced: ${username}`);
            }

        } catch (e) {
            console.error(`SFTPGo Sync Failed (${username}):`, e.message);
        }
    }
}

module.exports = SftpGoService;
