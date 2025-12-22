/**
 * Arkadaş MEBBIS Service - Invoice Service
 * 
 * Handles invoice creation and approval in MEBBIS.
 * Migrated from FormFaturaOlusturma.cs and FormFaturaOnaylama.cs
 */

import { MebbisAutomationService, MEBBIS_PAGES } from './mebbis-automation';
import { MebFatura, CreateFaturaRequest, FaturaInfo, DonemOgrenci } from '../types';
import { logger } from '../utils/logger';

/**
 * Invoice creation result
 */
export interface InvoiceResult {
    success: boolean;
    invoiceInfo?: FaturaInfo;
    message: string;
    error?: string;
}

/**
 * Invoice list result
 */
export interface InvoiceListResult {
    success: boolean;
    invoices: MebFatura[];
    total: number;
}

/**
 * Invoice Service
 * 
 * Handles invoice operations in MEBBIS.
 */
export class InvoiceService {
    private mebbis: MebbisAutomationService;

    constructor(mebbis: MebbisAutomationService) {
        this.mebbis = mebbis;
    }

    /**
     * Get students for invoice creation in a specific period
     */
    async getInvoiceCandidates(donem: string): Promise<DonemOgrenci[]> {
        try {
            logger.info(`Fetching invoice candidates for period: ${donem}`);

            await this.mebbis.navigateTo(MEBBIS_PAGES.FATURA_ONAY);
            await this.mebbis.waitForPageReady();

            // Set period filter
            const [year, month] = donem.split('-');
            await this.mebbis.selectOption('#ddlYil', year);
            await this.mebbis.selectOption('#ddlAy', month);
            await this.mebbis.click('#btnListele');
            await this.mebbis.waitForPageReady();

            // Parse the invoice candidates table
            const candidates = await this.parseInvoiceCandidatesTable();

            logger.info(`Found ${candidates.length} invoice candidates`);
            return candidates;
        } catch (error) {
            logger.error('Error fetching invoice candidates:', error);
            throw error;
        }
    }

    /**
     * Parse invoice candidates from table
     */
    private async parseInvoiceCandidatesTable(): Promise<DonemOgrenci[]> {
        const candidates: DonemOgrenci[] = [];

        const tableData = await this.mebbis.executeScript<Array<{
            ogrenciId: string;
            tcKimlikNo: string;
            adSoyad: string;
            bireyselDersSayisi: number;
            grupDersSayisi: number;
            bireyselTelafiSayisi: number;
            grupTelafiSayisi: number;
        }>>(`
      const rows = document.querySelectorAll('#grdFaturaListesi tr:not(:first-child)');
      const data = [];
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 7) {
          data.push({
            ogrenciId: row.getAttribute('data-id') || '',
            tcKimlikNo: cells[0]?.textContent?.trim() || '',
            adSoyad: cells[1]?.textContent?.trim() || '',
            bireyselDersSayisi: parseInt(cells[2]?.textContent?.trim() || '0'),
            grupDersSayisi: parseInt(cells[3]?.textContent?.trim() || '0'),
            bireyselTelafiSayisi: parseInt(cells[4]?.textContent?.trim() || '0'),
            grupTelafiSayisi: parseInt(cells[5]?.textContent?.trim() || '0'),
          });
        }
      });
      return data;
    `);

        for (const row of tableData) {
            if (row.tcKimlikNo) {
                candidates.push(row);
            }
        }

        return candidates;
    }

    /**
     * Create an invoice for a student
     */
    async createInvoice(request: CreateFaturaRequest): Promise<InvoiceResult> {
        try {
            logger.info(`Creating invoice for ${request.adSoyad} - ${request.donem}`);

            await this.mebbis.navigateTo(MEBBIS_PAGES.FATURA_ONAY);
            await this.mebbis.waitForPageReady();

            // Find the student row
            await this.mebbis.fillField('#txtTcAra', request.tcKimlikNo);
            await this.mebbis.click('#btnAra');
            await this.mebbis.waitForPageReady();

            // Click create invoice button
            await this.mebbis.click(`#btnFaturaOlustur_${request.tcKimlikNo}`);
            await this.mebbis.waitForPageReady();

            // Fill invoice form
            await this.fillInvoiceForm(request);

            // Submit
            await this.mebbis.click('#btnKaydet');
            await this.mebbis.waitForPageReady();

            // Check result
            const success = await this.checkInvoiceResult();

            if (success) {
                const invoiceInfo = await this.getCreatedInvoiceInfo();
                logger.info(`Invoice created successfully: ${invoiceInfo?.belgeNo}`);
                return {
                    success: true,
                    invoiceInfo,
                    message: 'Fatura başarıyla oluşturuldu',
                };
            } else {
                const errorMsg = await this.getErrorMessage();
                logger.error(`Invoice creation failed: ${errorMsg}`);
                return {
                    success: false,
                    message: 'Fatura oluşturulamadı',
                    error: errorMsg,
                };
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Invoice creation error: ${errorMsg}`);
            return {
                success: false,
                message: 'Fatura oluşturma sırasında hata',
                error: errorMsg,
            };
        }
    }

    /**
     * Fill the invoice creation form
     */
    private async fillInvoiceForm(request: CreateFaturaRequest): Promise<void> {
        // Date and time
        await this.mebbis.fillField('#txtFaturaTarih', this.formatDateForMebbis(request.faturaTarih));
        if (request.faturaSaat) {
            await this.mebbis.fillField('#txtFaturaSaat', request.faturaSaat);
        }

        // Document serial and number
        if (request.belgeSeri) {
            await this.mebbis.fillField('#txtBelgeSeri', request.belgeSeri);
        }
        if (request.belgeNo) {
            await this.mebbis.fillField('#txtBelgeNo', request.belgeNo);
        }

        // Education type names
        await this.mebbis.fillField('#txtBireyselEgitimAd', request.bireyselEgitimAd);
        await this.mebbis.fillField('#txtGrupEgitimAd', request.grupEgitimAd);

        // Make-up session options
        if (request.telafiAyriOlustur) {
            await this.mebbis.click('#chkTelafiAyri');
        }
        if (request.telafiSondaOlustur) {
            await this.mebbis.click('#chkTelafiSonda');
        }

        // Lesson counts
        await this.mebbis.fillField('#txtBireyselDersSayisi', request.bireyselDersSayisi.toString());
        await this.mebbis.fillField('#txtGrupDersSayisi', request.grupDersSayisi.toString());
        await this.mebbis.fillField('#txtBireyselTelafiSayisi', request.bireyselTelafiDersSayisi.toString());
        await this.mebbis.fillField('#txtGrupTelafiSayisi', request.grupTelafiDersSayisi.toString());
    }

    /**
     * Approve pending invoices
     */
    async approvePendingInvoices(donem: string): Promise<{
        approved: number;
        failed: number;
        errors: string[];
    }> {
        const result = {
            approved: 0,
            failed: 0,
            errors: [] as string[],
        };

        try {
            logger.info(`Approving invoices for period: ${donem}`);

            await this.mebbis.navigateTo(MEBBIS_PAGES.FATURA_ONAY);
            await this.mebbis.waitForPageReady();

            // Set period filter
            const [year, month] = donem.split('-');
            await this.mebbis.selectOption('#ddlYil', year);
            await this.mebbis.selectOption('#ddlAy', month);
            await this.mebbis.click('#btnListele');
            await this.mebbis.waitForPageReady();

            // Find all pending invoices
            const pendingInvoices = await this.getPendingInvoiceIds();
            logger.info(`Found ${pendingInvoices.length} pending invoices`);

            for (const invoiceId of pendingInvoices) {
                try {
                    await this.approveInvoice(invoiceId);
                    result.approved++;
                } catch (error) {
                    result.failed++;
                    result.errors.push(`Failed to approve ${invoiceId}: ${error}`);
                }
            }

            logger.info(`Approval complete: ${result.approved} approved, ${result.failed} failed`);
            return result;
        } catch (error) {
            logger.error('Error approving invoices:', error);
            throw error;
        }
    }

    /**
     * Get IDs of pending invoices
     */
    private async getPendingInvoiceIds(): Promise<string[]> {
        return this.mebbis.executeScript<string[]>(`
      const buttons = document.querySelectorAll('.btn-onayla:not(.disabled)');
      return Array.from(buttons).map(btn => btn.getAttribute('data-id') || '');
    `);
    }

    /**
     * Approve a single invoice
     */
    private async approveInvoice(invoiceId: string): Promise<void> {
        await this.mebbis.click(`#btnOnayla_${invoiceId}`);
        await this.mebbis.waitForElement('.modal-confirm');
        await this.mebbis.click('.btn-confirm-yes');
        await this.mebbis.waitForPageReady();
    }

    /**
     * Reject an invoice
     */
    async rejectInvoice(invoiceId: string, reason: string): Promise<boolean> {
        try {
            logger.info(`Rejecting invoice: ${invoiceId}`);

            await this.mebbis.click(`#btnReddet_${invoiceId}`);
            await this.mebbis.waitForElement('.modal-reject');
            await this.mebbis.fillField('#txtRedNedeni', reason);
            await this.mebbis.click('.btn-reject-confirm');
            await this.mebbis.waitForPageReady();

            return true;
        } catch (error) {
            logger.error(`Failed to reject invoice ${invoiceId}:`, error);
            return false;
        }
    }

    /**
     * Get list of invoices for a period
     */
    async getInvoiceList(donem: string): Promise<InvoiceListResult> {
        try {
            await this.mebbis.navigateTo(MEBBIS_PAGES.FATURA_ONAY);
            await this.mebbis.waitForPageReady();

            const [year, month] = donem.split('-');
            await this.mebbis.selectOption('#ddlYil', year);
            await this.mebbis.selectOption('#ddlAy', month);
            await this.mebbis.click('#btnListele');
            await this.mebbis.waitForPageReady();

            const invoices = await this.parseInvoiceListTable();

            return {
                success: true,
                invoices,
                total: invoices.length,
            };
        } catch (error) {
            logger.error('Error fetching invoice list:', error);
            return {
                success: false,
                invoices: [],
                total: 0,
            };
        }
    }

    /**
     * Parse invoice list table
     */
    private async parseInvoiceListTable(): Promise<MebFatura[]> {
        const invoices: MebFatura[] = [];

        const tableData = await this.mebbis.executeScript<Array<{
            tcKimlikNo: string;
            adSoyad: string;
            bireyselDersSayisi: number;
            grupDersSayisi: number;
            faturaNo: string;
            faturaTutar: number;
        }>>(`
      const rows = document.querySelectorAll('#grdFaturalar tr:not(:first-child)');
      const data = [];
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
          data.push({
            tcKimlikNo: cells[0]?.textContent?.trim() || '',
            adSoyad: cells[1]?.textContent?.trim() || '',
            bireyselDersSayisi: parseInt(cells[2]?.textContent?.trim() || '0'),
            grupDersSayisi: parseInt(cells[3]?.textContent?.trim() || '0'),
            faturaNo: cells[4]?.textContent?.trim() || '',
            faturaTutar: parseFloat(cells[5]?.textContent?.replace(',', '.').trim() || '0'),
          });
        }
      });
      return data;
    `);

        for (const row of tableData) {
            if (row.tcKimlikNo) {
                invoices.push({
                    tcKimlikNo: row.tcKimlikNo,
                    adSoyad: row.adSoyad,
                    donem: '',
                    bireyselDersSayisi: row.bireyselDersSayisi,
                    grupDersSayisi: row.grupDersSayisi,
                    faturaNo: row.faturaNo,
                    faturaTutar: row.faturaTutar,
                });
            }
        }

        return invoices;
    }

    /**
     * Check if invoice was created successfully
     */
    private async checkInvoiceResult(): Promise<boolean> {
        const successExists = await this.mebbis.elementExists('.alert-success, .mesaj-basarili');
        return successExists;
    }

    /**
     * Get created invoice information
     */
    private async getCreatedInvoiceInfo(): Promise<FaturaInfo | undefined> {
        try {
            return await this.mebbis.executeScript<FaturaInfo>(`
        return {
          faturaTarih: document.querySelector('#lblFaturaTarih')?.textContent?.trim() || '',
          belgeSeri: document.querySelector('#lblBelgeSeri')?.textContent?.trim() || '',
          belgeNo: document.querySelector('#lblBelgeNo')?.textContent?.trim() || '',
          faturaTutar: parseFloat(document.querySelector('#lblTutar')?.textContent?.replace(',', '.').trim() || '0'),
        };
      `);
        } catch {
            return undefined;
        }
    }

    /**
     * Get error message from page
     */
    private async getErrorMessage(): Promise<string> {
        const errorText = await this.mebbis.getText('.alert-danger, .mesaj-hata');
        return errorText || 'Bilinmeyen hata';
    }

    /**
     * Format date for MEBBIS
     */
    private formatDateForMebbis(isoDate: string): string {
        const date = new Date(isoDate);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
}

/**
 * Create an Invoice Service instance
 */
export function createInvoiceService(mebbis: MebbisAutomationService): InvoiceService {
    return new InvoiceService(mebbis);
}
