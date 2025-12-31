/**
 * SFTPGo REST API Service
 * Client for managing users and folders via SFTPGo REST API
 * @see https://docs.sftpgo.com/latest/rest-api/
 */

interface SFTPGoUser {
    id?: number;
    username: string;
    status: number; // 1 = active, 0 = disabled
    home_dir: string;
    permissions: Record<string, string[]>;
    password?: string;
    email?: string;
    description?: string;
    created_at?: number;
    updated_at?: number;
}

interface SFTPGoFolder {
    id?: number;
    name: string;
    mapped_path: string;
    description?: string;
    users?: string[];
}

interface SFTPGoAuthResponse {
    access_token: string;
    expires_at: string;
}

class SFTPGoApiService {
    private baseUrl: string;
    private adminUser: string;
    private adminPassword: string;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor() {
        this.baseUrl = process.env.SFTPGO_URL || 'http://localhost:8082';
        this.adminUser = process.env.SFTPGO_ADMIN_USER || 'admin';
        this.adminPassword = process.env.SFTPGO_ADMIN_PASSWORD || 'changeme';
    }

    /**
     * Authenticate and get access token
     */
    private async authenticate(): Promise<string> {
        // Check if we have a valid token
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }

        const response = await fetch(`${this.baseUrl}/api/v2/token`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${this.adminUser}:${this.adminPassword}`).toString('base64'),
            },
        });

        if (!response.ok) {
            throw new Error(`SFTPGo authentication failed: ${response.statusText}`);
        }

        const data: SFTPGoAuthResponse = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(data.expires_at);

        return this.accessToken;
    }

    /**
     * Make authenticated API request
     */
    private async request<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: unknown
    ): Promise<T> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/api/v2${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`SFTPGo API error (${response.status}): ${error}`);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    /**
     * Create a new user
     */
    async createUser(
        username: string,
        password: string,
        options?: {
            email?: string;
            homeDir?: string;
            quotaBytes?: number;
        }
    ): Promise<SFTPGoUser> {
        const homeDir = options?.homeDir || `/srv/sftpgo/data/${username}`;

        const user: Partial<SFTPGoUser> = {
            username,
            password,
            status: 1,
            home_dir: homeDir,
            email: options?.email,
            permissions: {
                '/': ['*'], // Full access to home directory
            },
        };

        if (options?.quotaBytes) {
            (user as Record<string, unknown>).quota_size = options.quotaBytes;
        }

        return this.request<SFTPGoUser>('/users', 'POST', user);
    }

    /**
     * Get user by username
     */
    async getUser(username: string): Promise<SFTPGoUser | null> {
        try {
            return await this.request<SFTPGoUser>(`/users/${username}`);
        } catch {
            return null;
        }
    }

    /**
     * Update user
     */
    async updateUser(username: string, updates: Partial<SFTPGoUser>): Promise<SFTPGoUser> {
        return this.request<SFTPGoUser>(`/users/${username}`, 'PUT', updates);
    }

    /**
     * Delete user
     */
    async deleteUser(username: string): Promise<void> {
        await this.request<void>(`/users/${username}`, 'DELETE');
    }

    /**
     * Enable user
     */
    async enableUser(username: string): Promise<SFTPGoUser> {
        return this.updateUser(username, { status: 1 });
    }

    /**
     * Disable user
     */
    async disableUser(username: string): Promise<SFTPGoUser> {
        return this.updateUser(username, { status: 0 });
    }

    /**
     * List all users
     */
    async listUsers(): Promise<SFTPGoUser[]> {
        return this.request<SFTPGoUser[]>('/users');
    }

    /**
     * Create virtual folder
     */
    async createFolder(name: string, mappedPath: string): Promise<SFTPGoFolder> {
        return this.request<SFTPGoFolder>('/folders', 'POST', {
            name,
            mapped_path: mappedPath,
        });
    }

    /**
     * Get folder
     */
    async getFolder(name: string): Promise<SFTPGoFolder | null> {
        try {
            return await this.request<SFTPGoFolder>(`/folders/${name}`);
        } catch {
            return null;
        }
    }

    /**
     * Delete folder
     */
    async deleteFolder(name: string): Promise<void> {
        await this.request<void>(`/folders/${name}`, 'DELETE');
    }

    /**
     * Get server status
     */
    async getStatus(): Promise<{ active_connections: number; uptime_ms: number }> {
        return this.request<{ active_connections: number; uptime_ms: number }>('/status');
    }
}

// Singleton instance
let sftpgoService: SFTPGoApiService | null = null;

export function getSFTPGoService(): SFTPGoApiService {
    if (!sftpgoService) {
        sftpgoService = new SFTPGoApiService();
    }
    return sftpgoService;
}

export default SFTPGoApiService;
