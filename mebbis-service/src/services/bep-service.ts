/**
 * Arkadaş MEBBIS Service - BEP (Bireyselleştirilmiş Eğitim Programı) Service
 * 
 * Handles BEP form submissions to MEBBIS:
 * - Performance Record Form (EK-4)
 * - Development Monitoring Form (EK-5)
 * - Portfolio Checklist (EK-6)
 * 
 * Migrated from FormBEPPerformansKayit.cs, FormBEPGelisimIzleme.cs, FormBEPPortfolyoKontrolListesi.cs
 */

import { MebbisAutomationService, MEBBIS_PAGES } from './mebbis-automation';
import {
    BepOgrenciListesi,
    BepPerformansKayit,
    BepGelisimIzleme,
    BepPortfolyoKontrol,
    BepBolum,
    BepHedef,
    BepDeger,
} from '../types';
import { logger } from '../utils/logger';

/**
 * BEP submission result
 */
export interface BepSubmissionResult {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * BEP Service
 * 
 * Handles BEP form automation in MEBBIS.
 */
export class BepService {
    private mebbis: MebbisAutomationService;

    constructor(mebbis: MebbisAutomationService) {
        this.mebbis = mebbis;
    }

    // ============================================================================
    // Student List Operations
    // ============================================================================

    /**
     * Get students eligible for Performance Record Form (EK-4)
     */
    async getPerformanceRecordStudents(donem: string): Promise<BepOgrenciListesi[]> {
        return this.getBepStudentList(MEBBIS_PAGES.BEP_PKT, donem);
    }

    /**
     * Get students eligible for Development Monitoring Form (EK-5)
     */
    async getDevelopmentMonitoringStudents(donem: string): Promise<BepOgrenciListesi[]> {
        return this.getBepStudentList(MEBBIS_PAGES.BEP_GELISIM_IZLEME, donem);
    }

    /**
     * Get students eligible for Portfolio Checklist (EK-6)
     */
    async getPortfolioChecklistStudents(donem: string): Promise<BepOgrenciListesi[]> {
        return this.getBepStudentList(MEBBIS_PAGES.BEP_PORTFOLYO_KONTROL, donem);
    }

    /**
     * Generic method to get BEP student list
     */
    private async getBepStudentList(pageUrl: string, donem: string): Promise<BepOgrenciListesi[]> {
        try {
            logger.info(`Fetching BEP student list from: ${pageUrl}`);

            await this.mebbis.navigateTo(pageUrl);
            await this.mebbis.waitForPageReady();

            // Set period filter
            const [year, month] = donem.split('-');
            await this.mebbis.selectOption('#ddlYil', year);
            await this.mebbis.selectOption('#ddlAy', month);
            await this.mebbis.click('#btnListele');
            await this.mebbis.waitForPageReady();

            // Parse student list
            const students = await this.parseBepStudentTable();
            logger.info(`Found ${students.length} students`);
            return students;
        } catch (error) {
            logger.error('Error fetching BEP student list:', error);
            throw error;
        }
    }

    /**
     * Parse BEP student table
     */
    private async parseBepStudentTable(): Promise<BepOgrenciListesi[]> {
        const tableData = await this.mebbis.executeScript<BepOgrenciListesi[]>(`
      const rows = document.querySelectorAll('#grdOgrenciListesi tr:not(:first-child)');
      const data = [];
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          data.push({
            ogrenciId: row.getAttribute('data-id') || '',
            tcKimlikNo: cells[0]?.textContent?.trim() || '',
            adSoyad: cells[1]?.textContent?.trim() || '',
            programId: cells[2]?.getAttribute('data-program-id') || '',
            programAdi: cells[2]?.textContent?.trim() || '',
            aylikFormDurumu: cells[3]?.textContent?.trim() || '',
          });
        }
      });
      return data;
    `);

        return tableData.filter(s => s.tcKimlikNo);
    }

    // ============================================================================
    // Performance Record Form (EK-4) - Performans Kayıt Formu
    // ============================================================================

    /**
     * Submit Performance Record Form (EK-4)
     */
    async submitPerformanceRecord(record: BepPerformansKayit): Promise<BepSubmissionResult> {
        try {
            logger.info(`Submitting EK-4 for student: ${record.ogrenciId}`);

            await this.mebbis.navigateTo(MEBBIS_PAGES.BEP_PKT);
            await this.mebbis.waitForPageReady();

            // Select student
            await this.selectBepStudent(record.ogrenciId, record.programId);

            // Fill each section
            for (const bolum of record.bolumler) {
                await this.fillPerformanceSection(bolum);
            }

            // Submit form
            await this.mebbis.click('#btnKaydet');
            await this.mebbis.waitForPageReady();

            // Check result
            const success = await this.checkBepResult();

            if (success) {
                logger.info('EK-4 submitted successfully');
                return {
                    success: true,
                    message: 'Performans Kayıt Formu başarıyla aktarıldı',
                };
            } else {
                const error = await this.getErrorMessage();
                logger.error(`EK-4 submission failed: ${error}`);
                return {
                    success: false,
                    message: 'Aktarma başarısız',
                    error,
                };
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`EK-4 submission error: ${errorMsg}`);
            return {
                success: false,
                message: 'Aktarma sırasında hata oluştu',
                error: errorMsg,
            };
        }
    }

    /**
     * Fill a performance record section
     */
    private async fillPerformanceSection(bolum: BepBolum): Promise<void> {
        // Select section
        await this.mebbis.selectOption('#ddlBolum', bolum.bolumId);
        await this.mebbis.waitForPageReady();

        for (const hedef of bolum.hedefler) {
            // Select goal
            await this.mebbis.selectOption('#ddlHedef', hedef.hedefId);
            await this.mebbis.waitForPageReady();

            // Fill behavior values for each week
            for (const davranis of hedef.davranislar) {
                for (const deger of davranis.degerler) {
                    const inputSelector = `#txt_${davranis.davranisId}_hafta${deger.hafta}`;
                    await this.mebbis.fillField(inputSelector, deger.deger);
                }
            }
        }
    }

    // ============================================================================
    // Development Monitoring Form (EK-5) - Gelişim İzleme Özet Formu
    // ============================================================================

    /**
     * Submit Development Monitoring Form (EK-5)
     */
    async submitDevelopmentMonitoring(record: BepGelisimIzleme): Promise<BepSubmissionResult> {
        try {
            logger.info(`Submitting EK-5 for student: ${record.ogrenciId}`);

            await this.mebbis.navigateTo(MEBBIS_PAGES.BEP_GELISIM_IZLEME);
            await this.mebbis.waitForPageReady();

            // Select student
            await this.selectBepStudent(record.ogrenciId, record.programId);

            // Fill summary
            await this.mebbis.fillField('#txtOzet', record.ozet);

            // Fill each section
            for (const bolum of record.bolumler) {
                await this.fillDevelopmentSection(bolum);
            }

            // Submit form
            await this.mebbis.click('#btnKaydet');
            await this.mebbis.waitForPageReady();

            // Check result
            const success = await this.checkBepResult();

            if (success) {
                logger.info('EK-5 submitted successfully');
                return {
                    success: true,
                    message: 'Gelişim İzleme Formu başarıyla aktarıldı',
                };
            } else {
                const error = await this.getErrorMessage();
                return {
                    success: false,
                    message: 'Aktarma başarısız',
                    error,
                };
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                message: 'Aktarma sırasında hata oluştu',
                error: errorMsg,
            };
        }
    }

    /**
     * Fill a development monitoring section
     */
    private async fillDevelopmentSection(bolum: { bolumId: string; bolumAdi: string; aciklama: string }): Promise<void> {
        // Select section
        await this.mebbis.selectOption('#ddlBolum', bolum.bolumId);
        await this.mebbis.waitForPageReady();

        // Fill description
        const textareaSelector = `#txtAciklama_${bolum.bolumId}`;
        await this.mebbis.fillField(textareaSelector, bolum.aciklama);
    }

    // ============================================================================
    // Portfolio Checklist (EK-6) - Portfolyo Kontrol Listesi
    // ============================================================================

    /**
     * Submit Portfolio Checklist (EK-6)
     */
    async submitPortfolioChecklist(record: BepPortfolyoKontrol): Promise<BepSubmissionResult> {
        try {
            logger.info(`Submitting EK-6 for student: ${record.ogrenciId}`);

            await this.mebbis.navigateTo(MEBBIS_PAGES.BEP_PORTFOLYO_KONTROL);
            await this.mebbis.waitForPageReady();

            // Select student
            await this.selectBepStudent(record.ogrenciId, record.programId);

            // Fill each product
            for (const urun of record.urunler) {
                await this.fillPortfolioProduct(urun);
            }

            // Submit form
            await this.mebbis.click('#btnKaydet');
            await this.mebbis.waitForPageReady();

            // Check result
            const success = await this.checkBepResult();

            if (success) {
                logger.info('EK-6 submitted successfully');
                return {
                    success: true,
                    message: 'Portfolyo Kontrol Listesi başarıyla aktarıldı',
                };
            } else {
                const error = await this.getErrorMessage();
                return {
                    success: false,
                    message: 'Aktarma başarısız',
                    error,
                };
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                message: 'Aktarma sırasında hata oluştu',
                error: errorMsg,
            };
        }
    }

    /**
     * Fill a portfolio product entry
     */
    private async fillPortfolioProduct(urun: { urunId: string; urunAdi: string; tarih?: string; aciklama?: string }): Promise<void> {
        // Check the product checkbox
        const checkboxSelector = `#chkUrun_${urun.urunId}`;
        await this.mebbis.click(checkboxSelector);

        // Fill date if provided
        if (urun.tarih) {
            const dateSelector = `#txtTarih_${urun.urunId}`;
            await this.mebbis.fillField(dateSelector, this.formatDateForMebbis(urun.tarih));
        }

        // Fill description if provided
        if (urun.aciklama) {
            const descSelector = `#txtAciklama_${urun.urunId}`;
            await this.mebbis.fillField(descSelector, urun.aciklama);
        }
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Select a student for BEP form
     */
    private async selectBepStudent(ogrenciId: string, programId: string): Promise<void> {
        // Click on student row
        await this.mebbis.click(`tr[data-id="${ogrenciId}"]`);
        await this.mebbis.waitForPageReady();

        // Select program if different
        const currentProgram = await this.mebbis.executeScript<string>(
            `document.querySelector('#ddlProgram')?.value || ''`
        );

        if (currentProgram !== programId) {
            await this.mebbis.selectOption('#ddlProgram', programId);
            await this.mebbis.waitForPageReady();
        }
    }

    /**
     * Check if BEP form was submitted successfully
     */
    private async checkBepResult(): Promise<boolean> {
        const successExists = await this.mebbis.elementExists('.alert-success, .mesaj-basarili');
        return successExists;
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
 * Create a BEP Service instance
 */
export function createBepService(mebbis: MebbisAutomationService): BepService {
    return new BepService(mebbis);
}
