/**
 * Arkadaş MEBBIS Automation Service
 * 
 * Core automation service using Playwright for headless browser automation.
 * Replaces the WebView2-based automation from the original C# application.
 */

import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { logger } from '../utils/logger';
import { withRetry, RetryOptions } from '../utils/retry';
import {
    MebbisError,
    MebbisAuthError,
    MebbisSessionError,
    MebbisTimeoutError,
    MebbisNetworkError,
    MebbisElementError,
    MebbisNavigationError,
    toMebbisError,
} from '../utils/errors';

/**
 * MEBBIS Page URLs
 */
export const MEBBIS_PAGES = {
    LOGIN: 'https://mebbis.meb.gov.tr/Login.aspx',
    MAIN: 'https://mebbis.meb.gov.tr/Kullanici/UygulamaListesi.aspx',
    ENGELLI_BIREY_MODULU: 'https://mebbis.meb.gov.tr/OzelEgitim/Anasayfa.aspx',
    EGITIM_BILGISI_GIRIS: 'https://mebbis.meb.gov.tr/OzelEgitim/EgitimBilgisiGiris.aspx',
    EGITIM_PLANI_GORUNTULEME: 'https://mebbis.meb.gov.tr/OzelEgitim/EgitimPlaniGoruntuleme.aspx',
    PERSONEL_EGITIM_LISTESI: 'https://mebbis.meb.gov.tr/OzelEgitim/PersonelGoreEgitimListesi.aspx',
    BIREY_EGITIM_LISTESI: 'https://mebbis.meb.gov.tr/OzelEgitim/BireyGoreEgitimListesi.aspx',
    DEVAMSIZLIK_GIRIS: 'https://mebbis.meb.gov.tr/OzelEgitim/DevamsizlikGiris.aspx',
    TELAFI_DERS_SAYISI: 'https://mebbis.meb.gov.tr/OzelEgitim/TelafiDersSayisi.aspx',
    MEIS_GIRISI: 'https://mebbis.meb.gov.tr/OzelEgitim/MEISGirisi.aspx',
    OKUL_IZIN_GIRISI: 'https://mebbis.meb.gov.tr/OzelEgitim/OkulIzinGirisi.aspx',
    BEP_PKT: 'https://mebbis.meb.gov.tr/OzelEgitim/BEP/PerformansKayitFormu.aspx',
    BEP_GELISIM_IZLEME: 'https://mebbis.meb.gov.tr/OzelEgitim/BEP/GelisimIzlemeFormu.aspx',
    BEP_PORTFOLYO_KONTROL: 'https://mebbis.meb.gov.tr/OzelEgitim/BEP/PortfolyoKontrolListesi.aspx',
    FATURA_ONAY: 'https://mebbis.meb.gov.tr/OzelEgitim/FaturaOnay.aspx',
    FATURA_RED: 'https://mebbis.meb.gov.tr/OzelEgitim/FaturaRed.aspx',
    RAM_RANDEVU: 'https://mebbis.meb.gov.tr/OzelEgitim/RamRandevu.aspx',
} as const;

/**
 * Configuration for MEBBIS automation
 */
export interface MebbisConfig {
    username: string;
    password: string;
    headless: boolean;
    timeout: number;
    /** Retry configuration for operations */
    retry?: RetryOptions;
}

/**
 * Default retry configuration for MEBBIS operations
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 15000,
    backoffMultiplier: 2,
    jitter: true,
};

/**
 * MEBBIS Automation Service
 * 
 * Provides methods for automating interactions with the MEBBIS portal.
 */
export class MebbisAutomationService {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private config: MebbisConfig;
    private isLoggedIn = false;
    private retryOptions: RetryOptions;
    private loginAttempts = 0;
    private readonly MAX_LOGIN_ATTEMPTS = 3;

    constructor(config: MebbisConfig) {
        this.config = config;
        this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...config.retry };
    }

    /**
     * Initialize the browser instance
     */
    async initialize(): Promise<void> {
        if (this.browser) {
            return;
        }

        logger.info('Initializing Playwright browser...');

        this.browser = await chromium.launch({
            headless: this.config.headless,
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            locale: 'tr-TR',
            timezoneId: 'Europe/Istanbul',
        });

        this.page = await this.context.newPage();
        this.page.setDefaultTimeout(this.config.timeout);

        logger.info('Browser initialized successfully');
    }

    /**
     * Close the browser instance
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
            this.isLoggedIn = false;
            logger.info('Browser closed');
        }
    }

    /**
     * Get the current page instance
     */
    private getPage(): Page {
        if (!this.page) {
            throw new MebbisError('Browser not initialized. Call initialize() first.', 'NOT_INITIALIZED', false);
        }
        return this.page;
    }

    /**
     * Execute an operation with retry logic
     */
    private async withOperation<T>(
        operationName: string,
        fn: () => Promise<T>,
        options?: Partial<RetryOptions>
    ): Promise<T> {
        return withRetry(fn, {
            ...this.retryOptions,
            ...options,
            operationName,
        });
    }

    /**
     * Login to MEBBIS portal with retry mechanism
     */
    async login(): Promise<boolean> {
        return withRetry(
            async () => {
                const page = this.getPage();
                this.loginAttempts++;

                try {
                    logger.info(`Navigating to MEBBIS login page (attempt ${this.loginAttempts})...`);
                    await page.goto(MEBBIS_PAGES.LOGIN);

                    // Wait for login form
                    await page.waitForSelector('#txtKullaniciAd', { state: 'visible' });

                    // Fill credentials
                    await page.fill('#txtKullaniciAd', this.config.username);
                    await page.fill('#txtSifre', this.config.password);

                    // Click login button
                    await page.click('#btnGiris');

                    // Wait for navigation to main page or error
                    await page.waitForNavigation({ waitUntil: 'networkidle' });

                    // Check if login was successful
                    const currentUrl = page.url();
                    if (currentUrl.includes('UygulamaListesi') || currentUrl.includes('Anasayfa')) {
                        this.isLoggedIn = true;
                        this.loginAttempts = 0;
                        logger.info('Login successful');
                        return true;
                    }

                    // Check for error message
                    const errorElement = await page.$('.error-message, .alert-danger');
                    if (errorElement) {
                        const errorText = await errorElement.textContent();
                        throw new MebbisAuthError(`Giriş başarısız: ${errorText}`);
                    }

                    throw new MebbisAuthError('Giriş başarısız: Bilinmeyen hata');
                } catch (error) {
                    const mebbisError = toMebbisError(error);

                    // Auth errors should not be retried
                    if (mebbisError instanceof MebbisAuthError) {
                        logger.error('Authentication failed:', mebbisError.message);
                        throw mebbisError;
                    }

                    // Timeout/network errors can be retried
                    logger.warn('Login attempt failed, may retry:', mebbisError.message);
                    throw mebbisError;
                }
            },
            {
                ...this.retryOptions,
                operationName: 'login',
                onRetry: (attempt, error) => {
                    logger.info(`Login retry attempt ${attempt + 1}`, {
                        error: error instanceof Error ? error.message : String(error),
                    });
                },
            }
        ).catch((error) => {
            logger.error('All login attempts failed:', error);
            return false;
        });
    }

    /**
     * Check if currently logged in
     */
    async checkLogin(): Promise<boolean> {
        if (!this.isLoggedIn) {
            return false;
        }

        const page = this.getPage();
        const currentUrl = page.url();

        // If on login page, not logged in
        if (currentUrl.includes('Login.aspx')) {
            this.isLoggedIn = false;
            return false;
        }

        return true;
    }

    /**
     * Navigate to a specific MEBBIS page with retry and session recovery
     */
    async navigateTo(pageUrl: string): Promise<void> {
        return withRetry(
            async () => {
                const page = this.getPage();

                // Ensure logged in
                if (!await this.checkLogin()) {
                    const success = await this.login();
                    if (!success) {
                        throw new MebbisAuthError('MEBBIS oturum açılamadı');
                    }
                }

                logger.info(`Navigating to: ${pageUrl}`);

                try {
                    await page.goto(pageUrl, { timeout: this.config.timeout });
                    await page.waitForLoadState('networkidle');
                } catch (error) {
                    throw new MebbisNavigationError(pageUrl, `Sayfa yüklenemedi: ${pageUrl}`);
                }

                // Check if redirected to login (session expired)
                const currentUrl = page.url();
                if (currentUrl.includes('Login.aspx')) {
                    this.isLoggedIn = false;
                    throw new MebbisSessionError('Oturum süresi doldu, yeniden giriş yapılıyor...');
                }
            },
            {
                ...this.retryOptions,
                operationName: `navigate to ${pageUrl}`,
            }
        );
    }

    /**
     * Navigate to Education Entry page
     */
    async goToEducationEntry(): Promise<void> {
        await this.navigateTo(MEBBIS_PAGES.EGITIM_BILGISI_GIRIS);
    }

    /**
     * Navigate to Invoice Approval page
     */
    async goToInvoiceApproval(): Promise<void> {
        await this.navigateTo(MEBBIS_PAGES.FATURA_ONAY);
    }

    /**
     * Navigate to BEP Performance Record page
     */
    async goToBepPerformance(): Promise<void> {
        await this.navigateTo(MEBBIS_PAGES.BEP_PKT);
    }

    /**
     * Get current page URL
     */
    getCurrentUrl(): string {
        return this.getPage().url();
    }

    /**
     * Check if on a specific page
     */
    isOnPage(pageUrl: string): boolean {
        const currentUrl = this.getCurrentUrl();
        return currentUrl.toLowerCase().includes(pageUrl.toLowerCase());
    }

    /**
     * Wait for page to be ready
     */
    async waitForPageReady(): Promise<void> {
        const page = this.getPage();
        await page.waitForLoadState('networkidle');
        // Wait for any loading spinners to disappear
        await page.waitForSelector('.loading, .spinner', { state: 'hidden' }).catch(() => { });
    }

    /**
     * Fill a form field by selector
     */
    async fillField(selector: string, value: string): Promise<void> {
        const page = this.getPage();
        await page.fill(selector, value);
    }

    /**
     * Select an option from a dropdown
     */
    async selectOption(selector: string, value: string): Promise<void> {
        const page = this.getPage();
        await page.selectOption(selector, value);
    }

    /**
     * Click an element with retry
     */
    async click(selector: string): Promise<void> {
        return this.withOperation(`click ${selector}`, async () => {
            const page = this.getPage();
            try {
                await page.click(selector);
            } catch (error) {
                throw new MebbisElementError(selector, `Element tıklanamadı: ${selector}`);
            }
        });
    }

    /**
     * Get text content of an element
     */
    async getText(selector: string): Promise<string | null> {
        const page = this.getPage();
        const element = await page.$(selector);
        return element ? element.textContent() : null;
    }

    /**
     * Execute JavaScript in page context
     */
    async executeScript<T>(script: string): Promise<T> {
        const page = this.getPage();
        return page.evaluate(script) as Promise<T>;
    }

    /**
     * Take a screenshot for debugging
     */
    async screenshot(path: string): Promise<void> {
        const page = this.getPage();
        await page.screenshot({ path, fullPage: true });
        logger.info(`Screenshot saved to: ${path}`);
    }

    /**
     * Wait for an element to appear with retry
     */
    async waitForElement(selector: string, timeout?: number): Promise<void> {
        return this.withOperation(`wait for ${selector}`, async () => {
            const page = this.getPage();
            try {
                await page.waitForSelector(selector, {
                    state: 'visible',
                    timeout: timeout || this.config.timeout
                });
            } catch (error) {
                throw new MebbisTimeoutError(
                    `Element bulunamadı: ${selector}`,
                    timeout || this.config.timeout
                );
            }
        });
    }

    /**
     * Check if element exists
     */
    async elementExists(selector: string): Promise<boolean> {
        const page = this.getPage();
        const element = await page.$(selector);
        return element !== null;
    }

    /**
     * Get all options from a select element
     */
    async getSelectOptions(selector: string): Promise<Array<{ value: string; text: string }>> {
        const page = this.getPage();
        return page.$$eval(`${selector} option`, (options) =>
            options.map((opt) => ({
                value: (opt as HTMLOptionElement).value,
                text: (opt as HTMLOptionElement).text,
            }))
        );
    }

    /**
     * Submit a form
     */
    async submitForm(formSelector: string): Promise<void> {
        const page = this.getPage();
        await page.evaluate((selector) => {
            const form = document.querySelector(selector) as HTMLFormElement;
            if (form) {
                form.submit();
            }
        }, formSelector);
        await page.waitForLoadState('networkidle');
    }

    /**
     * Handle ASP.NET postback
     */
    async doPostBack(eventTarget: string, eventArgument: string = ''): Promise<void> {
        const page = this.getPage();
        await page.evaluate(({ target, arg }) => {
            // @ts-expect-error ASP.NET global function
            if (typeof __doPostBack === 'function') {
                // @ts-expect-error ASP.NET global function  
                __doPostBack(target, arg);
            }
        }, { target: eventTarget, arg: eventArgument });
        await page.waitForLoadState('networkidle');
    }

    /**
     * Add event listener for page logs
     */
    onConsoleLog(callback: (message: string) => void): void {
        const page = this.getPage();
        page.on('console', (msg) => {
            callback(msg.text());
        });
    }
}

/**
 * Create a MEBBIS automation service instance
 */
export function createMebbisService(config: Partial<MebbisConfig> = {}): MebbisAutomationService {
    const fullConfig: MebbisConfig = {
        username: process.env.MEBBIS_USERNAME || '',
        password: process.env.MEBBIS_PASSWORD || '',
        headless: process.env.HEADLESS !== 'false',
        timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10),
        ...config,
    };

    return new MebbisAutomationService(fullConfig);
}
