/**
 * Proxy Path Security — Whitelist/Blacklist
 *
 * Fail-Closed: Only allow paths starting with an allowed prefix
 * and not containing any blocked segment.
 */

const ALLOWED_PREFIXES = ['api/'];
const BLOCKED_SEGMENTS = ['admin', '_health', 'users-permissions', 'upload', 'content-manager', 'content-type-builder'];

export function isPathAllowed(path: string): boolean {
    const normalizedPath = path.toLowerCase();

    // Whitelist: must start with an allowed prefix
    if (!ALLOWED_PREFIXES.some(prefix => normalizedPath.startsWith(prefix))) {
        return false;
    }

    // Blacklist: must not contain any blocked segment
    if (BLOCKED_SEGMENTS.some(segment => normalizedPath.includes(segment))) {
        return false;
    }

    return true;
}
