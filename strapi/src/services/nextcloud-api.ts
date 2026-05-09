/**
 * Nextcloud Provisioning API Service (Replaces SFTPGo)
 * Client for managing users and groups via Nextcloud OCS API
 */

interface NextcloudUser {
    id: string;
    displayname: string;
    email: string;
    groups: string[];
    quota: string;
}

class NextcloudApiService {
    private baseUrl: string;
    private adminUser: string;
    private adminPassword: string;

    constructor() {
        this.baseUrl = (process.env.NEXTCLOUD_URL || 'http://localhost:8088').replace(/\/$/, '');
        this.adminUser = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
        this.adminPassword = process.env.NEXTCLOUD_ADMIN_PASSWORD || 'changeme';
    }

    private async request<T>(endpoint: string, method: string = 'GET', body: any = null): Promise<T> {
        const url = `${this.baseUrl}/ocs/v1.php/cloud${endpoint}`;
        const headers: any = {
            'Authorization': `Basic ${Buffer.from(`${this.adminUser}:${this.adminPassword}`).toString('base64')}`,
            'OCS-APIRequest': 'true',
            'Accept': 'application/json',
        };

        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });

        if (!response.ok && response.status !== 404) {
            const error = await response.text();
            throw new Error(`Nextcloud API error (${response.status}): ${error}`);
        }

        if (response.status === 404) {
            return null as T;
        }

        const data = await response.json();
        return data.ocs;
    }

    async syncUser(params: { username: string; password?: string; email?: string; deleteUser?: boolean }): Promise<any> {
        const { username, password, email, deleteUser = false } = params;

        if (deleteUser) {
            return this.request(`/users/${username}`, 'DELETE');
        }

        const existing = await this.request<any>(`/users/${username}`);
        
        if (existing && existing.data && existing.data.displayname) {
            if (email) await this.request(`/users/${username}`, 'PUT', { key: 'email', value: email });
            if (password) await this.request(`/users/${username}`, 'PUT', { key: 'password', value: password });
            return { success: true };
        } else {
            return this.request('/users', 'POST', {
                userid: username,
                password: password || 'arkadas-default-pass',
                email: email || `${username}@arkadas.com.tr`
            });
        }
    }

    async ensureGroup(groupName: string): Promise<any> {
        return this.request('/groups', 'POST', { groupid: groupName });
    }

    async addUserToGroup(username: string, groupName: string): Promise<any> {
        return this.request(`/users/${username}/groups`, 'POST', { groupid: groupName });
    }
}

let nextcloudService: NextcloudApiService | null = null;

export function getNextcloudService(): NextcloudApiService {
    if (!nextcloudService) {
        nextcloudService = new NextcloudApiService();
    }
    return nextcloudService;
}

// Export as dummy for backward compatibility if needed by other services
export const getSFTPGoService = getNextcloudService;

export default NextcloudApiService;
