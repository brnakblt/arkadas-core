
/**
 * Get the Strapi URL from environment variables
 * @param path Path to append to URL
 * @returns Full URL
 */
export function getStrapiURL(path = '') {
    return `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${path}`;
}

/**
 * Helper to make API calls to Strapi
 * @param path API path
 * @param authToken Optional JWT token
 * @param options Fetch options
 */
export async function fetchAPI(path: string, authToken?: string, options: RequestInit = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...options.headers,
    };

    const response = await fetch(getStrapiURL(path), {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`An error occurred please try again`);
    }

    const data = await response.json();
    return data;
}
