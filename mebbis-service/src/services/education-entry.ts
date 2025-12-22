/**
 * Arkadaş MEBBIS Service - Education Entry Service
 * 
 * Handles education information entry automation to MEBBIS.
 * Migrated from FormEgitimBilgisiGiris.cs
 */

import { MebbisAutomationService, MEBBIS_PAGES } from './mebbis-automation';
import { EgitimBilgiGiris, StatusType, SeansType, EgitimHedef } from '../types';
import { logger } from '../utils/logger';

/**
 * Result of an education entry submission
 */
export interface EducationEntryResult {
    success: boolean;
    entryId?: string;
    message: string;
    error?: string;
}

/**
 * Education Entry Service
 * 
 * Automates the submission of education records to MEBBIS.
 */
export class EducationEntryService {
    private mebbis: MebbisAutomationService;

    constructor(mebbis: MebbisAutomationService) {
        this.mebbis = mebbis;
    }

    /**
     * Submit a single education entry to MEBBIS
     */
    async submitEntry(entry: EgitimBilgiGiris): Promise<EducationEntryResult> {
        try {
            logger.info(`Submitting education entry for ${entry.ogrenciAdSoyad} on ${entry.tarih}`);

            // Navigate to education entry page
            await this.mebbis.navigateTo(MEBBIS_PAGES.EGITIM_BILGISI_GIRIS);
            await this.mebbis.waitForPageReady();

            // Check if this is a delete or create operation
            if (entry.durum === StatusType.Silinecek) {
                return await this.deleteEntry(entry);
            }

            // Fill student information
            await this.selectStudent(entry.ogrenciTcKimlikNo);

            // Fill educator information
            await this.selectEducator(entry.egitimciTcKimlikNo);

            // Fill date and time
            await this.fillDateTime(entry.tarih, entry.saat);

            // Select session type
            await this.selectSessionType(entry.seansTip);

            // Select classroom
            await this.selectClassroom(entry.derslikId);

            // Select program, module, section
            await this.selectProgram(entry.programId);
            await this.selectModule(entry.modulId);
            await this.selectSection(entry.bolumId);

            // Fill goals and behaviors
            await this.fillGoals(entry.hedefler);

            // Handle make-up session if applicable
            if (entry.telafi && entry.telafiAy && entry.telafiYil) {
                await this.fillMakeupInfo(entry.telafiAy, entry.telafiYil);
            }

            // Submit the form
            await this.submitForm();

            // Check result
            const success = await this.checkSubmissionResult();

            if (success) {
                logger.info(`Successfully submitted entry for ${entry.ogrenciAdSoyad}`);
                return {
                    success: true,
                    message: 'Eğitim bilgisi başarıyla aktarıldı',
                };
            } else {
                const errorMsg = await this.getErrorMessage();
                logger.error(`Failed to submit entry: ${errorMsg}`);
                return {
                    success: false,
                    message: 'Aktarma başarısız',
                    error: errorMsg,
                };
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Education entry error: ${errorMsg}`);
            return {
                success: false,
                message: 'Aktarma sırasında hata oluştu',
                error: errorMsg,
            };
        }
    }

    /**
     * Submit multiple education entries in batch
     */
    async submitBatch(
        entries: EgitimBilgiGiris[],
        onProgress?: (current: number, total: number, entry: EgitimBilgiGiris) => void,
        stopOnError = false
    ): Promise<Map<string, EducationEntryResult>> {
        const results = new Map<string, EducationEntryResult>();
        const total = entries.length;

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const entryKey = `${entry.ogrenciTcKimlikNo}_${entry.tarih}_${entry.saat}`;

            if (onProgress) {
                onProgress(i + 1, total, entry);
            }

            const result = await this.submitEntry(entry);
            results.set(entryKey, result);

            if (!result.success && stopOnError) {
                logger.warn('Stopping batch due to error');
                break;
            }

            // Small delay between submissions to avoid overwhelming the server
            await this.delay(1000);
        }

        return results;
    }

    /**
     * Delete an existing education entry
     */
    private async deleteEntry(entry: EgitimBilgiGiris): Promise<EducationEntryResult> {
        try {
            logger.info(`Deleting education entry for ${entry.ogrenciAdSoyad} on ${entry.tarih}`);

            // Navigate to view existing entries
            await this.mebbis.navigateTo(MEBBIS_PAGES.BIREY_EGITIM_LISTESI);
            await this.mebbis.waitForPageReady();

            // Search for the entry
            await this.mebbis.fillField('#txtTcKimlik', entry.ogrenciTcKimlikNo);
            await this.mebbis.fillField('#txtTarih', entry.tarih);
            await this.mebbis.click('#btnAra');
            await this.mebbis.waitForPageReady();

            // Find and delete the entry
            const deleteSelector = `tr[data-date="${entry.tarih}"][data-time="${entry.saat}"] .btn-sil`;
            const exists = await this.mebbis.elementExists(deleteSelector);

            if (!exists) {
                return {
                    success: false,
                    message: 'Silinecek kayıt bulunamadı',
                };
            }

            await this.mebbis.click(deleteSelector);

            // Confirm deletion
            await this.mebbis.waitForElement('.modal-confirm');
            await this.mebbis.click('.btn-confirm-yes');
            await this.mebbis.waitForPageReady();

            return {
                success: true,
                message: 'Kayıt başarıyla silindi',
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                message: 'Silme işlemi başarısız',
                error: errorMsg,
            };
        }
    }

    /**
     * Select student by TC Kimlik No
     */
    private async selectStudent(tcKimlikNo: string): Promise<void> {
        await this.mebbis.fillField('#txtOgrenciTc', tcKimlikNo);
        await this.mebbis.click('#btnOgrenciAra');
        await this.mebbis.waitForPageReady();
    }

    /**
     * Select educator by TC Kimlik No
     */
    private async selectEducator(tcKimlikNo: string): Promise<void> {
        await this.mebbis.fillField('#txtEgitimciTc', tcKimlikNo);
        await this.mebbis.click('#btnEgitimciAra');
        await this.mebbis.waitForPageReady();
    }

    /**
     * Fill date and time fields
     */
    private async fillDateTime(date: string, time: string): Promise<void> {
        // Format: DD.MM.YYYY for MEBBIS
        const formattedDate = this.formatDateForMebbis(date);
        await this.mebbis.fillField('#txtTarih', formattedDate);
        await this.mebbis.fillField('#txtSaat', time);
    }

    /**
     * Select session type (individual or group)
     */
    private async selectSessionType(type: SeansType): Promise<void> {
        const value = type === SeansType.Bireysel ? '1' : '2';
        await this.mebbis.selectOption('#ddlSeansTipi', value);
        await this.mebbis.waitForPageReady();
    }

    /**
     * Select classroom
     */
    private async selectClassroom(derslikId: string): Promise<void> {
        await this.mebbis.selectOption('#ddlDerslik', derslikId);
    }

    /**
     * Select education program
     */
    private async selectProgram(programId: string): Promise<void> {
        await this.mebbis.selectOption('#ddlProgram', programId);
        await this.mebbis.waitForPageReady();
    }

    /**
     * Select module within program
     */
    private async selectModule(modulId: string): Promise<void> {
        await this.mebbis.selectOption('#ddlModul', modulId);
        await this.mebbis.waitForPageReady();
    }

    /**
     * Select section within module
     */
    private async selectSection(bolumId: string): Promise<void> {
        await this.mebbis.selectOption('#ddlBolum', bolumId);
        await this.mebbis.waitForPageReady();
    }

    /**
     * Fill educational goals and behaviors
     */
    private async fillGoals(hedefler: EgitimHedef[]): Promise<void> {
        for (const hedef of hedefler) {
            // Select goal
            await this.mebbis.selectOption('#ddlHedef', hedef.hedefId);

            // Select behaviors for this goal
            for (const davranis of hedef.hedefDavranislar) {
                const checkboxSelector = `input[type="checkbox"][value="${davranis}"]`;
                const exists = await this.mebbis.elementExists(checkboxSelector);
                if (exists) {
                    await this.mebbis.click(checkboxSelector);
                }
            }

            // Add goal to list
            await this.mebbis.click('#btnHedefEkle');
            await this.delay(500);
        }
    }

    /**
     * Fill make-up session information
     */
    private async fillMakeupInfo(month: number, year: number): Promise<void> {
        await this.mebbis.selectOption('#ddlTelafiAy', month.toString());
        await this.mebbis.selectOption('#ddlTelafiYil', year.toString());
    }

    /**
     * Submit the education entry form
     */
    private async submitForm(): Promise<void> {
        await this.mebbis.click('#btnKaydet');
        await this.mebbis.waitForPageReady();
    }

    /**
     * Check if submission was successful
     */
    private async checkSubmissionResult(): Promise<boolean> {
        // Look for success message
        const successExists = await this.mebbis.elementExists('.alert-success, .mesaj-basarili');
        return successExists;
    }

    /**
     * Get error message from page
     */
    private async getErrorMessage(): Promise<string> {
        const errorText = await this.mebbis.getText('.alert-danger, .mesaj-hata, .error-message');
        return errorText || 'Bilinmeyen hata';
    }

    /**
     * Format ISO date to MEBBIS format (DD.MM.YYYY)
     */
    private formatDateForMebbis(isoDate: string): string {
        const date = new Date(isoDate);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Create an Education Entry Service instance
 */
export function createEducationEntryService(mebbis: MebbisAutomationService): EducationEntryService {
    return new EducationEntryService(mebbis);
}
