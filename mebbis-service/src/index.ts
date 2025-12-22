/**
 * Arkadaş MEBBIS Service - Main Entry Point
 * 
 * Express server for the MEBBIS automation service.
 */

import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from './api/routes';
import { logger } from './utils/logger';
import './queues'; // Initialize background workers

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 4000;

// ============================================================================
// Middleware
// ============================================================================

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
        query: req.query,
        ip: req.ip,
    });
    next();
});

// ============================================================================
// Routes
// ============================================================================

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.json({
        name: 'Arkadaş MEBBIS Service',
        version: '1.0.0',
        description: 'MEBBIS automation service for special education centers',
        docs: '/api/docs',
        health: '/api/health',
    });
});

// API routes
app.use('/api', apiRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı',
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error:', err);

    res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// ============================================================================
// Server Start
// ============================================================================

const server = app.listen(PORT, () => {
    logger.info(`
╔════════════════════════════════════════════════════════════╗
║           Arkadaş MEBBIS Service Started                    ║
╠════════════════════════════════════════════════════════════╣
║  Port:        ${String(PORT).padEnd(44)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(44)}║
║  Redis:       ${(process.env.REDIS_URL || 'redis://localhost:6379').substring(0, 44).padEnd(44)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

export default app;
