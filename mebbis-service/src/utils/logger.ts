/**
 * Arkadaş MEBBIS Service - Logger Utility
 * 
 * Winston-based logging for the MEBBIS automation service.
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp: ts, ...metadata }) => {
    let msg = `${ts} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
});

/**
 * Create logger instance
 */
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        // Console output
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            ),
        }),
        // File output for errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        // File output for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
        }),
    ],
});

/**
 * Log child for specific modules
 */
export const createModuleLogger = (moduleName: string) => {
    return logger.child({ module: moduleName });
};
