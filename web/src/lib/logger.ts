/**
 * Enhanced Logger for Arkadaş Özel Eğitim ERP
 * 
 * Features:
 * - Automatically masks TCKN (11 digit numbers)
 * - Masks Email addresses
 * - Masks Phone numbers
 * - Compliant with KVKK & MEB Logging Standards
 */

const PATTERNS = {
    TCKN: /\b[1-9][0-9]{10}\b/g,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    PHONE: /(\+90|0)?\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}/g,
    CREDIT_CARD: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
};

function redact(message: string): string {
    if (!message) return message;

    let sanitized = message;

    // Mask TCKN
    sanitized = sanitized.replace(PATTERNS.TCKN, '***********');

    // Mask Email (j***@gmail.com)
    sanitized = sanitized.replace(PATTERNS.EMAIL, (email) => {
        const [user, domain] = email.split('@');
        return `${user.charAt(0)}***@${domain}`;
    });

    // Mask Phone
    sanitized = sanitized.replace(PATTERNS.PHONE, '0 5** *** ** **');

    return sanitized;
}

const logger = {
    info: (message: string, meta?: any) => {
        const sanitizedMsg = redact(message);
        // In production, this would go to a file or log service (Elasticsearch/Graylog)
        // eslint-disable-next-line no-console
        console.log(`[INFO] ${new Date().toISOString()}: ${sanitizedMsg}`, meta || '');
    },

    error: (message: string, error?: any) => {
        const sanitizedMsg = redact(message);
        // eslint-disable-next-line no-console
        console.error(`[ERROR] ${new Date().toISOString()}: ${sanitizedMsg}`, error || '');
    },

    warn: (message: string, meta?: any) => {
        const sanitizedMsg = redact(message);
        // eslint-disable-next-line no-console
        console.warn(`[WARN] ${new Date().toISOString()}: ${sanitizedMsg}`, meta || '');
    },

    debug: (message: string, meta?: any) => {
        if (process.env.NODE_ENV === 'development') {
            const sanitizedMsg = redact(message);
            // eslint-disable-next-line no-console
            console.debug(`[DEBUG] ${new Date().toISOString()}: ${sanitizedMsg}`, meta || '');
        }
    }
};

export default logger;
