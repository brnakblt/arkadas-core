import { getTenantCredentials, redis } from '../utils/tenant';

// Mock logger
jest.mock('../utils/logger', () => ({
    logger: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock global fetch
const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch;

describe('getTenantCredentials', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.STRAPI_URL = 'http://localhost:1337';
        process.env.STRAPI_API_TOKEN = 'test-token';
    });

    // Since we are using the REAL redis instance (but it will fail if it tries to connect to real redis),
    // we MUST spy on its methods to prevent actual network calls.
    // However, redis tries to connect on instantiation.
    // If the test env doesn't have a redis, it might error or warn. 
    // Ideally we mock the redis module to return a "fake" client that we can spy on.

    // But since we just exported 'redis', we can spy on it.

    it('should return cached credentials if available', async () => {
        // Spy on the exported redis instance methods
        const getSpy = jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify({ username: 'cached', password: 'pass' }));

        const config = await getTenantCredentials('1');

        expect(getSpy).toHaveBeenCalledWith('tenant:1:credentials');
        expect(config).toEqual({ username: 'cached', password: 'pass' });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch from Strapi if not in cache', async () => {
        const getSpy = jest.spyOn(redis, 'get').mockResolvedValue(null);
        const setSpy = jest.spyOn(redis, 'set').mockResolvedValue('OK');

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    attributes: {
                        mebbisUsername: 'strapi-user',
                        mebbisPassword: 'strapi-pass',
                    },
                },
            }),
        });

        const config = await getTenantCredentials('2');

        expect(getSpy).toHaveBeenCalledWith('tenant:2:credentials');
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:1337/api/tenants/2',
            expect.objectContaining({
                headers: {
                    Authorization: 'Bearer test-token',
                },
            })
        );
        expect(config).toEqual({ username: 'strapi-user', password: 'strapi-pass' });
        expect(setSpy).toHaveBeenCalled();
    });

    it('should throw error if Strapi returns error', async () => {
        jest.spyOn(redis, 'get').mockResolvedValue(null);
        mockFetch.mockResolvedValue({
            ok: false,
            statusText: 'Not Found',
        });

        await expect(getTenantCredentials('999')).rejects.toThrow('Failed to fetch tenant credentials: Not Found');
    });

    it('should throw error if tenantId contains invalid characters (SSRF protection)', async () => {
        await expect(getTenantCredentials('../evil')).rejects.toThrow('Invalid Tenant ID format');
        await expect(getTenantCredentials('tenant/1')).rejects.toThrow('Invalid Tenant ID format');
    });

    it('should throw error if mebbisPassword is missing', async () => {
        jest.spyOn(redis, 'get').mockResolvedValue(null);
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    attributes: {
                        mebbisUsername: 'no-pass',
                        mebbisPassword: null,
                    },
                },
            }),
        });

        await expect(getTenantCredentials('3')).rejects.toThrow('MEBBIS password not found');
    });

    afterAll(() => {
        // Clean up redis connection to prevent open handles
        redis.disconnect();
    });
});
