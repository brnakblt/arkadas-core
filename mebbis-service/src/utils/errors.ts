/**
 * MEBBIS Service Custom Error Classes
 * 
 * Provides typed error handling with categorization for different failure modes.
 */

/**
 * Base error class for all MEBBIS-related errors
 */
export class MebbisError extends Error {
    public readonly code: string;
    public readonly isRetryable: boolean;
    public readonly context?: Record<string, unknown>;

    constructor(
        message: string,
        code: string,
        isRetryable: boolean = false,
        context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'MebbisError';
        this.code = code;
        this.isRetryable = isRetryable;
        this.context = context;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Authentication-related errors (invalid credentials, expired tokens)
 */
export class MebbisAuthError extends MebbisError {
    constructor(message: string = 'Kimlik doğrulama hatası', context?: Record<string, unknown>) {
        super(message, 'AUTH_ERROR', false, context);
        this.name = 'MebbisAuthError';
    }
}

/**
 * Session-related errors (session expired, requires re-login)
 */
export class MebbisSessionError extends MebbisError {
    constructor(message: string = 'Oturum süresi doldu', context?: Record<string, unknown>) {
        super(message, 'SESSION_ERROR', true, context);
        this.name = 'MebbisSessionError';
    }
}

/**
 * Timeout errors (page load, element wait)
 */
export class MebbisTimeoutError extends MebbisError {
    public readonly timeoutMs: number;

    constructor(
        message: string = 'İşlem zaman aşımına uğradı',
        timeoutMs: number = 30000,
        context?: Record<string, unknown>
    ) {
        super(message, 'TIMEOUT_ERROR', true, context);
        this.name = 'MebbisTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}

/**
 * Network connectivity errors
 */
export class MebbisNetworkError extends MebbisError {
    constructor(message: string = 'Ağ bağlantısı hatası', context?: Record<string, unknown>) {
        super(message, 'NETWORK_ERROR', true, context);
        this.name = 'MebbisNetworkError';
    }
}

/**
 * Validation errors (invalid input data)
 */
export class MebbisValidationError extends MebbisError {
    public readonly fields?: string[];

    constructor(
        message: string = 'Doğrulama hatası',
        fields?: string[],
        context?: Record<string, unknown>
    ) {
        super(message, 'VALIDATION_ERROR', false, context);
        this.name = 'MebbisValidationError';
        this.fields = fields;
    }
}

/**
 * Element not found errors (selector issues)
 */
export class MebbisElementError extends MebbisError {
    public readonly selector: string;

    constructor(
        selector: string,
        message: string = `Element bulunamadı: ${selector}`,
        context?: Record<string, unknown>
    ) {
        super(message, 'ELEMENT_ERROR', true, context);
        this.name = 'MebbisElementError';
        this.selector = selector;
    }
}

/**
 * Navigation errors (page load failures)
 */
export class MebbisNavigationError extends MebbisError {
    public readonly url: string;

    constructor(
        url: string,
        message: string = `Sayfa yüklenemedi: ${url}`,
        context?: Record<string, unknown>
    ) {
        super(message, 'NAVIGATION_ERROR', true, context);
        this.name = 'MebbisNavigationError';
        this.url = url;
    }
}

/**
 * Check if an error is a MEBBIS error
 */
export function isMebbisError(error: unknown): error is MebbisError {
    return error instanceof MebbisError;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    if (isMebbisError(error)) {
        return error.isRetryable;
    }

    // Check for common retryable error patterns
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('timeout') ||
            message.includes('network') ||
            message.includes('econnrefused') ||
            message.includes('econnreset') ||
            message.includes('socket hang up')
        );
    }

    return false;
}

/**
 * Convert a generic error to a typed MEBBIS error
 */
export function toMebbisError(error: unknown): MebbisError {
    if (isMebbisError(error)) {
        return error;
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('timeout')) {
            return new MebbisTimeoutError(error.message);
        }

        if (message.includes('network') || message.includes('econn')) {
            return new MebbisNetworkError(error.message);
        }

        if (message.includes('login') || message.includes('authentication')) {
            return new MebbisAuthError(error.message);
        }

        return new MebbisError(error.message, 'UNKNOWN_ERROR', false);
    }

    return new MebbisError(String(error), 'UNKNOWN_ERROR', false);
}
