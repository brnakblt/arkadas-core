import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const authenticateRequest = (req: Request, res: Response, next: NextFunction) => {
    // Skip auth for health check
    if (req.path === '/health') {
        return next();
    }

    const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');
    const serviceKey = process.env.MEBBIS_SERVICE_API_KEY;

    // SECURITY FIX: Fail-closed - reject requests if API key is not configured
    if (!serviceKey) {
        logger.error('CRITICAL: MEBBIS_SERVICE_API_KEY not configured. Rejecting all requests.');
        res.status(503).json({
            success: false,
            message: 'Service configuration error: API key not configured',
        });
        return;
    }

    if (!apiKey || apiKey !== serviceKey) {
        logger.warn(`Unauthorized access attempt from ${req.ip}`);
        res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid or missing API Key',
        });
        return;
    }

    next();
};
