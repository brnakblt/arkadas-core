/**
 * Nextcloud OCS API Service
 * Handles user creation, folder provisioning, and quota management
 */

interface OCSResponse<T> {
    ocs: {
        meta: {
            status: string;
            statuscode: number;
            message: string;
        };
        data: T;
    };
}

interface NextcloudUserData {
    id: string;
    enabled: boolean;
    storageLocation?: string;
    lastLogin?: number;
    backend?: string;
    subadmin?: string[];
    quota?: {
        free?: number;
        used?: number;
        total?: number;
        relative?: number;
        quota?: number | string;
    };
    email?: string;
    displayname?: string;
    phone?: string;
    address?: string;
    website?: string;
    twitter?: string;
    groups?: string[];
    language?: string;
    locale?: string;
}

export class NextcloudOCSService {
    private baseUrl: string;
    private authHeader: string;

    constructor() {
        const baseUrl = process.env.NEXTCLOUD_URL || 'http://localhost:8080';
        const username = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
        const password = process.env.NEXTCLOUD_ADMIN_PASSWORD || '';

        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    }

    /**
     * Make OCS API request
     */
    private async fetchOCS<T>(
        endpoint: string,
        method: string = 'GET',
        body?: Record<string, string>
    ): Promise<T> {
        const url = `${this.baseUrl}/ocs/v2.php${endpoint}`;
        const headers: Record<string, string> = {
            'Authorization': this.authHeader,
            'OCS-APIRequest': 'true',
            'Accept': 'application/json',
        };

        const options: RequestInit = {
            method,
            headers,
        };

        if (body) {
            const params = new URLSearchParams();
            for (const key in body) {
                params.append(key, body[key]);
            }
            options.body = params;
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = `${url}${separator}format=json`;

        const response = await fetch(finalUrl, options);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Nextcloud API Error ${response.status}: ${response.statusText} - ${text}`);
        }

        const json = await response.json() as OCSResponse<T>;

        if (json.ocs.meta.statuscode !== 100 && json.ocs.meta.statuscode !== 200) {
            throw new Error(`Nextcloud OCS Error ${json.ocs.meta.statuscode}: ${json.ocs.meta.message}`);
        }

        return json.ocs.data;
    }

    /**
     * Create a new Nextcloud user
     */
    async createUser(
        userid: string,
        password: string,
        email?: string,
        displayName?: string,
        groups?: string[]
    ): Promise<{ id: string }> {
        const body: Record<string, string> = { userid, password };
        if (email) body.email = email;
        if (displayName) body.displayName = displayName;
        if (groups && groups.length > 0) {
            body.groups = JSON.stringify(groups);
        }

        await this.fetchOCS('/cloud/users', 'POST', body);
        return { id: userid };
    }

    /**
     * Get user details
     */
    async getUser(userid: string): Promise<NextcloudUserData> {
        return this.fetchOCS<NextcloudUserData>(`/cloud/users/${encodeURIComponent(userid)}`);
    }

    /**
     * Check if user exists
     */
    async userExists(userid: string): Promise<boolean> {
        try {
            await this.getUser(userid);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Update user property
     */
    async updateUser(userid: string, key: string, value: string): Promise<void> {
        await this.fetchOCS(`/cloud/users/${encodeURIComponent(userid)}`, 'PUT', { key, value });
    }

    /**
     * Enable user
     */
    async enableUser(userid: string): Promise<void> {
        await this.fetchOCS(`/cloud/users/${encodeURIComponent(userid)}/enable`, 'PUT');
    }

    /**
     * Disable user
     */
    async disableUser(userid: string): Promise<void> {
        await this.fetchOCS(`/cloud/users/${encodeURIComponent(userid)}/disable`, 'PUT');
    }

    /**
     * Delete user
     */
    async deleteUser(userid: string): Promise<void> {
        await this.fetchOCS(`/cloud/users/${encodeURIComponent(userid)}`, 'DELETE');
    }

    /**
     * Get all users (paginated)
     */
    async getUsers(search?: string, limit?: number, offset?: number): Promise<{ users: string[] }> {
        let endpoint = '/cloud/users';
        const params: string[] = [];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (limit) params.push(`limit=${limit}`);
        if (offset) params.push(`offset=${offset}`);
        if (params.length > 0) {
            endpoint += '?' + params.join('&');
        }
        return this.fetchOCS<{ users: string[] }>(endpoint);
    }

    /**
     * Add user to group
     */
    async addUserToGroup(userid: string, groupid: string): Promise<void> {
        await this.fetchOCS(`/cloud/users/${encodeURIComponent(userid)}/groups`, 'POST', { groupid });
    }

    /**
     * Remove user from group
     */
    async removeUserFromGroup(userid: string, groupid: string): Promise<void> {
        await this.fetchOCS(`/cloud/users/${encodeURIComponent(userid)}/groups`, 'DELETE', { groupid });
    }

    /**
     * Create group
     */
    async createGroup(groupid: string): Promise<void> {
        await this.fetchOCS('/cloud/groups', 'POST', { groupid });
    }

    /**
     * Get all groups
     */
    async getGroups(): Promise<{ groups: string[] }> {
        return this.fetchOCS<{ groups: string[] }>('/cloud/groups');
    }

    // ===== WebDAV Operations =====

    /**
     * Create folder via WebDAV MKCOL
     */
    async createFolder(userid: string, folderPath: string): Promise<boolean> {
        const remotePath = `/remote.php/dav/files/${encodeURIComponent(userid)}/${folderPath.replace(/^\//, '')}`;
        const url = `${this.baseUrl}${remotePath}`;

        const response = await fetch(url, {
            method: 'MKCOL',
            headers: {
                'Authorization': this.authHeader,
            },
        });

        // 201 = Created, 405 = Already exists
        return response.status === 201 || response.status === 405;
    }

    /**
     * Check if folder exists via WebDAV PROPFIND
     */
    async folderExists(userid: string, folderPath: string): Promise<boolean> {
        const remotePath = `/remote.php/dav/files/${encodeURIComponent(userid)}/${folderPath.replace(/^\//, '')}`;
        const url = `${this.baseUrl}${remotePath}`;

        try {
            const response = await fetch(url, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': this.authHeader,
                    'Depth': '0',
                },
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Set user quota
     */
    async setQuota(userid: string, quotaBytes: number | 'none'): Promise<void> {
        const value = quotaBytes === 'none' ? 'none' : quotaBytes.toString();
        await this.updateUser(userid, 'quota', value);
    }
}

export default NextcloudOCSService;
