import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const authenticateRequest = (req: Request, res: Response, next: NextFunction) => {
    // Skip auth for health check if it's handled globally, but here we apply it per route usually.
    // However, if applied globally, we might want to exclude /health.
    if (req.path === '/health') {
        return next();
    }

    const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');
    const serviceKey = process.env.MEBBIS_SERVICE_API_KEY;

    if (!serviceKey) {
        logger.warn('MEBBIS_SERVICE_API_KEY not configured, allowing request (INSECURE)');
        return next();
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
