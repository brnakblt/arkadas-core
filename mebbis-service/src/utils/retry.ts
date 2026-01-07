/**
 * MEBBIS Service Retry Utility
 * 
 * Provides exponential backoff retry mechanism for browser automation operations.
 */

import { isRetryableError } from './errors';
import { logger } from './logger';

/**
 * Retry configuration options
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Initial delay in milliseconds (default: 1000) */
    initialDelayMs?: number;
    /** Maximum delay in milliseconds (default: 30000) */
    maxDelayMs?: number;
    /** Backoff multiplier (default: 2) */
    backoffMultiplier?: number;
    /** Add jitter to prevent thundering herd (default: true) */
    jitter?: boolean;
    /** Custom function to determine if error is retryable */
    shouldRetry?: (error: unknown) => boolean;
    /** Callback for each retry attempt */
    onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
    /** Operation name for logging */
    operationName?: string;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'signal' | 'onRetry' | 'shouldRetry' | 'operationName'>> = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    multiplier: number,
    jitter: boolean
): number {
    let delay = initialDelay * Math.pow(multiplier, attempt - 1);
    delay = Math.min(delay, maxDelay);

    if (jitter) {
        // Add random jitter between 0-25% of the delay
        delay = delay * (1 + Math.random() * 0.25);
    }

    return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds with abort support
 */
async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new Error('Operation aborted'));
            return;
        }

        const timeoutId = setTimeout(resolve, ms);

        if (signal) {
            const abortHandler = () => {
                clearTimeout(timeoutId);
                reject(new Error('Operation aborted'));
            };
            signal.addEventListener('abort', abortHandler, { once: true });
        }
    });
}

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @example
 * const result = await withRetry(
 *   async () => await page.click('#submitBtn'),
 *   { maxAttempts: 5, operationName: 'click submit button' }
 * );
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const operationName = config.operationName || 'operation';
    const shouldRetry = config.shouldRetry || isRetryableError;

    let lastError: unknown;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            // Check if aborted before attempt
            if (config.signal?.aborted) {
                throw new Error('Operation aborted');
            }

            return await fn();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            if (attempt >= config.maxAttempts) {
                logger.error(`${operationName}: All ${config.maxAttempts} attempts failed`, { error });
                break;
            }

            if (!shouldRetry(error)) {
                logger.warn(`${operationName}: Non-retryable error, failing immediately`, { error });
                break;
            }

            // Calculate delay
            const delayMs = calculateDelay(
                attempt,
                config.initialDelayMs,
                config.maxDelayMs,
                config.backoffMultiplier,
                config.jitter
            );

            logger.info(`${operationName}: Attempt ${attempt} failed, retrying in ${delayMs}ms...`, {
                attempt,
                error: error instanceof Error ? error.message : String(error),
            });

            // Call onRetry callback if provided
            if (config.onRetry) {
                config.onRetry(attempt, error, delayMs);
            }

            // Wait before retrying
            await sleep(delayMs, config.signal);
        }
    }

    throw lastError;
}

/**
 * Create a retry wrapper with preset options
 * 
 * @example
 * const retryWithTimeout = createRetry({ maxAttempts: 5, maxDelayMs: 10000 });
 * const result = await retryWithTimeout(() => fetchData());
 */
export function createRetry(defaultOptions: RetryOptions): <T>(fn: () => Promise<T>, options?: RetryOptions) => Promise<T> {
    return <T>(fn: () => Promise<T>, options?: RetryOptions) => {
        return withRetry(fn, { ...defaultOptions, ...options });
    };
}

/**
 * Retry decorator for class methods
 * 
 * @example
 * class MyService {
 *   @Retryable({ maxAttempts: 3 })
 *   async fetchData() { ... }
 * }
 */
export function Retryable(options: RetryOptions = {}): MethodDecorator {
    return function (
        _target: object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: unknown[]) {
            return withRetry(
                () => originalMethod.apply(this, args),
                { ...options, operationName: String(propertyKey) }
            );
        };

        return descriptor;
    };
}

/**
 * Result type for tryWithRetry (no-throw variant)
 */
export type RetryResult<T> =
    | { success: true; data: T; attempts: number }
    | { success: false; error: unknown; attempts: number };

/**
 * Non-throwing variant of withRetry
 * 
 * @example
 * const result = await tryWithRetry(() => fetchData());
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export async function tryWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<RetryResult<T>> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let attempts = 0;

    try {
        // Track attempts
        const result = await withRetry(fn, {
            ...options,
            onRetry: (attempt, error, delayMs) => {
                attempts = attempt;
                options.onRetry?.(attempt, error, delayMs);
            },
        });
        return { success: true, data: result, attempts: attempts + 1 };
    } catch (error) {
        return { success: false, error, attempts: config.maxAttempts };
    }
}
