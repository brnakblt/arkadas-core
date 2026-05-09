/**
 * Mobile Authentication Controller
 * 
 * Provides JWT-based authentication with refresh tokens for mobile apps
 */

import type { Core } from '@strapi/strapi';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Token configuration
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

interface TokenPayload {
    id: number;
    email: string;
    tenantId?: number;
}

export default {
    /**
     * Mobile login - returns access and refresh tokens
     * POST /api/auth/mobile/login
     */
    async login(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const { identifier, password, deviceToken, platform, deviceName } = ctx.request.body;

        if (!identifier || !password) {
            return ctx.badRequest('Identifier and password are required');
        }

        try {
            // Use Strapi's DB Query for robust filtering
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: {
                    $or: [{ email: identifier }, { username: identifier }],
                },
                populate: ['role'], // Ensure we have the password field (it's available by default on findOne unless excluded)
            });

            if (!user || !user.password) {
                return ctx.unauthorized('Invalid credentials');
            }

            // Verify password
            const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
                password,
                user.password
            );

            if (!validPassword) {
                return ctx.unauthorized('Invalid credentials');
            }

            if (user.blocked) {
                return ctx.unauthorized('Account is blocked');
            }

            // Get user's tenant
            const fullUser = await strapi.entityService.findOne(
                'plugin::users-permissions.user',
                user.id,
                { populate: ['tenant', 'role'] as any }
            );

            const tenant = (fullUser as any)?.tenant;
            const role = (fullUser as any)?.role;

            // Generate tokens
            const accessToken = generateAccessToken({
                id: user.id,
                email: user.email,
                tenantId: tenant?.id,
            });

            const refreshToken = generateRefreshToken();
            const refreshExpiry = new Date();
            refreshExpiry.setDate(refreshExpiry.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

            // Store refresh token in database
            await strapi.db.query('api::device-token.device-token').create({
                data: {
                    token: refreshToken, // Using token field for refresh token
                    platform: platform || 'android',
                    deviceName: deviceName || 'Unknown Device',
                    deviceId: deviceToken || crypto.randomUUID(),
                    user: user.id,
                    tenant: tenant?.id,
                    isActive: true,
                    lastUsedAt: new Date(),
                },
            });

            // Create audit log
            try {
                await strapi.db.query('api::audit-log.audit-log').create({
                    data: {
                        action: 'login',
                        entityType: 'mobile-auth',
                        userId: user.id,
                        ipAddress: ctx.request.ip,
                        timestamp: new Date(),
                        success: true,
                        metadata: { platform, deviceName },
                    },
                });
            } catch {
                // Don't fail login if audit fails
            }

            return {
                accessToken,
                refreshToken,
                expiresIn: 900, // 15 minutes in seconds
                refreshExpiresIn: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: role?.type,
                    tenant: tenant?.slug,
                },
            };
        } catch (error) {
            strapi.log.error('Mobile login error:', error);
            return ctx.internalServerError('Login failed');
        }
    },

    /**
     * Refresh access token
     * POST /api/auth/mobile/refresh
     */
    async refresh(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const { refreshToken } = ctx.request.body;

        if (!refreshToken) {
            return ctx.badRequest('Refresh token is required');
        }

        try {
            // Find the refresh token
            const tokenRecord = await strapi.db.query('api::device-token.device-token').findOne({
                where: { token: refreshToken, isActive: true },
                populate: ['user', 'tenant'],
            });

            if (!tokenRecord) {
                return ctx.unauthorized('Invalid refresh token');
            }

            const user = tokenRecord.user;
            if (!user) {
                return ctx.unauthorized('User not found');
            }

            // Generate new access token
            const accessToken = generateAccessToken({
                id: user.id,
                email: user.email,
                tenantId: tokenRecord.tenant?.id,
            });

            // Update last used
            await strapi.db.query('api::device-token.device-token').update({
                where: { id: tokenRecord.id },
                data: { lastUsedAt: new Date() },
            });

            return {
                accessToken,
                expiresIn: 900,
            };
        } catch (error) {
            strapi.log.error('Token refresh error:', error);
            return ctx.internalServerError('Token refresh failed');
        }
    },

    /**
     * Logout - invalidate refresh token
     * POST /api/auth/mobile/logout
     */
    async logout(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const { refreshToken } = ctx.request.body;

        if (!refreshToken) {
            return ctx.badRequest('Refresh token is required');
        }

        try {
            await strapi.db.query('api::device-token.device-token').updateMany({
                where: { token: refreshToken },
                data: { isActive: false },
            });

            return { success: true };
        } catch (error) {
            strapi.log.error('Logout error:', error);
            return ctx.internalServerError('Logout failed');
        }
    },

    /**
     * Get current user info (mobile-optimized)
     * GET /api/auth/mobile/me
     */
    async me(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized();
        }

        const fullUser = await strapi.entityService.findOne(
            'plugin::users-permissions.user',
            user.id,
            { populate: ['tenant', 'role'] as any }
        );

        const tenant = (fullUser as any)?.tenant;
        const role = (fullUser as any)?.role;

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: role?.type,
            tenant: {
                id: tenant?.id,
                slug: tenant?.slug,
                name: tenant?.name,
            },
        };
    },
};

/**
 * Generate short-lived access token
 */
function generateAccessToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

/**
 * Generate secure refresh token
 */
function generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
}
