import IORedis from 'ioredis';
jest.mock('ioredis');

import { getTenantCredentials } from '../utils/tenant';

// Mock fetch
global.fetch = jest.fn();

describe('getTenantCredentials', () => {
    let mockRedis: any;

    beforeAll(() => {
        // Access the instance created in tenant.ts
        // Since tenant.ts is imported after mock, the constructor was the mock
        const MockRedis = IORedis as unknown as jest.Mock;
        mockRedis = MockRedis.mock.instances[0];
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset specific mock implementations if needed, but keep the instance
        process.env.STRAPI_URL = 'http://localhost:1337';
        process.env.STRAPI_API_TOKEN = 'test-token';
    });

    it('should return cached credentials if available', async () => {
        const cachedConfig = { username: 'cached-user', password: 'cached-pass' };
        mockRedis.get.mockResolvedValue(JSON.stringify(cachedConfig));

        const config = await getTenantCredentials('1');

        expect(mockRedis.get).toHaveBeenCalledWith('tenant:1:credentials');
        expect(config).toEqual(cachedConfig);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch from Strapi if not in cache', async () => {
        mockRedis.get.mockResolvedValue(null);

        (global.fetch as jest.Mock).mockResolvedValue({
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

        expect(mockRedis.get).toHaveBeenCalledWith('tenant:2:credentials');
        expect(fetch).toHaveBeenCalledWith('http://localhost:1337/api/tenants/2', expect.any(Object));
        expect(config).toEqual({ username: 'strapi-user', password: 'strapi-pass' });
        expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should throw error if tenantId is missing', async () => {
        await expect(getTenantCredentials('')).rejects.toThrow('Tenant ID is required');
    });

    it('should throw error if Strapi returns error', async () => {
        mockRedis.get.mockResolvedValue(null);
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            statusText: 'Not Found',
        });

        await expect(getTenantCredentials('999')).rejects.toThrow('Failed to fetch tenant credentials: Not Found');
    });
});
