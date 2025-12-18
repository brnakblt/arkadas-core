// Types for Nextcloud responses
export interface NextcloudUser {
    id: string;
    email?: string;
    displayname?: string; // OCS returns 'displayname' (all lowercase mostly) or 'display-name'
    enabled: boolean;
}

export interface NextcloudShare {
    id: string;
    share_type: number;
    uid_owner: string;
    displayname_owner: string;
    permissions: number;
    stime: number;
    parent: string | null;
    expiration: string | null;
    token: string | null;
    uid_file_owner: string;
    displayname_file_owner: string;
    path: string;
    item_type: string;
    mimetype: string;
    storage_id: string;
    storage: number;
    item_source: number;
    file_source: number;
    file_parent: number;
    share_with: string | null;
    share_with_displayname: string | null;
    url?: string; // For public links
}

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

export class NextcloudService {
    private baseUrl: string;
    private authHeader: string;

    constructor(baseUrl: string, username: string, appPassword?: string) {
        // Ensure baseUrl doesn't end with slash
        this.baseUrl = baseUrl.replace(/\/$/, '');
        // Create Basic Auth header
        this.authHeader = 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64');
    }

    private async fetchOCS<T>(endpoint: string, method: string = 'GET', body?: Record<string, string | number | boolean>): Promise<T> {
        const url = `${this.baseUrl}/ocs/v2.php${endpoint}`;
        const headers: Record<string, string> = {
            'Authorization': this.authHeader,
            'OCS-APIRequest': 'true',
            'Accept': 'application/json', // Prefer JSON
        };

        const options: RequestInit = {
            method,
            headers,
        };

        if (body) {
            if (typeof body === 'object') {
                // OCS often takes form data, but sometimes JSON. 
                // For standard OCS, form-urlencoded is safest for many endpoints, but let's try to support both or default to URLSearchParams
                const params = new URLSearchParams();
                for (const key in body) {
                    params.append(key, String(body[key]));
                }
                options.body = params;
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        }

        // Append format=json to URL
        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = `${url}${separator}format=json`;

        const response = await fetch(finalUrl, options);

        if (!response.ok) {
            // Try to read error message if possible
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
     * Get formatted usage report or other capabilities
     */
    async getCapabilities() {
        return this.fetchOCS('/cloud/capabilities');
    }

    /**
     * Create a new user
     */
    async createUser(userid: string, password?: string, email?: string, displayName?: string) {
        const body: Record<string, string> = { userid };
        if (password) body.password = password;
        if (email) body.email = email;
        if (displayName) body.displayName = displayName;

        return this.fetchOCS('/cloud/users', 'POST', body);
    }

    /**
     * Get user details
     */
    async getUser(userid: string): Promise<NextcloudUser> {
        return this.fetchOCS<NextcloudUser>(`/cloud/users/${userid}`);
    }

    /**
     * Create a share
     * shareType: 0 = user, 1 = group, 3 = public link, 4 = email
     */
    async createShare(path: string, shareType: number, shareWith?: string, permissions?: number) {
        const body: Record<string, string | number> = {
            path,
            shareType,
        };
        if (shareWith) body.shareWith = shareWith;
        if (permissions) body.permissions = permissions;

        return this.fetchOCS<NextcloudShare>('/apps/files_sharing/api/v1/shares', 'POST', body);
    }

    // --- WebDAV Helpers (using fetch) ---

    /**
     * List files in a directory using PROPFIND
     */
    async listFiles(path: string) {
        // Normalizing path
        const remotePath = `/remote.php/dav/files/${this.getUsernameFromAuth()}/${path.replace(/^\//, '')}`;
        const url = `${this.baseUrl}${remotePath}`;

        const response = await fetch(url, {
            method: 'PROPFIND',
            headers: {
                'Authorization': this.authHeader,
                'Depth': '1' // 1 for children, 0 for resource itself
            }
        });

        if (!response.ok) {
            throw new Error(`WebDAV Error ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        // Note: Parsing XML in JS/TS without a library can be verbose. 
        // Usually we use 'fast-xml-parser' or similar, but to keep it dependency-free we might do regex or simple parsing if simple.
        // For now, returning raw text or suggesting a parser is better.
        // Ideally, we should install 'fast-xml-parser' or 'xml2js'.
        return text;
    }

    /**
     * Upload a file
     */
    async uploadFile(path: string, content: Buffer | string | Blob) {
        const remotePath = `/remote.php/dav/files/${this.getUsernameFromAuth()}/${path.replace(/^\//, '')}`;
        const url = `${this.baseUrl}${remotePath}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': this.authHeader,
                'Content-Type': 'application/octet-stream'
            },
            body: content as unknown as RequestInit['body']
        });

        if (!response.ok) {
            throw new Error(`Upload Failed ${response.status}`);
        }
        return true;
    }

    /**
     * Helper to extract username from basic auth header for WebDAV paths
     */
    private getUsernameFromAuth(): string {
        try {
            const base64Part = this.authHeader.split(' ')[1];
            const decoded = Buffer.from(base64Part, 'base64').toString();
            return decoded.split(':')[0];
        } catch {
            return 'admin'; // fallback
        }
    }
}
