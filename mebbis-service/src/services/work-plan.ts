/**
 * Arkadaş MEBBIS Work Plan Service
 * 
 * Handles syncing work plans (İş Planları) to and from MEBBIS.
 * Covers: Daily plans, date range sync, plan corrections.
 */

import { MebbisAutomationService, MEBBIS_PAGES } from './mebbis-automation';
import { logger } from '../utils/logger';

/**
 * Work plan entry for MEBBIS sync
 */
export interface WorkPlanEntry {
    /** Student TC Kimlik No */
    tcKimlikNo: string;
    /** Educator TC Kimlik No */
    egitimciTcKimlik: string;
    /** Date of the plan (YYYY-MM-DD) */
    tarih: string;
    /** Start time (HH:MM) */
    baslangicSaati: string;
    /** End time (HH:MM) */
    bitisSaati: string;
    /** Module code */
    modulKodu: string;
    /** Session type: 'bireysel' | 'grup' */
    seansType: 'bireysel' | 'grup';
    /** Notes (optional) */
    aciklama?: string;
}

/**
 * Sync result for a single work plan entry
 */
export interface WorkPlanSyncResult {
    entry: WorkPlanEntry;
    success: boolean;
    mebbisId?: string;
    error?: string;
}

/**
 * Batch sync result
 */
export interface WorkPlanBatchResult {
    total: number;
    successful: number;
    failed: number;
    results: WorkPlanSyncResult[];
}

/**
 * Work Plan Service for MEBBIS integration
 */
export class WorkPlanService {
    private mebbis: MebbisAutomationService;

    constructor(mebbisService: MebbisAutomationService) {
        this.mebbis = mebbisService;
    }

    /**
     * Navigate to Education Plan Entry page
     */
    private async goToWorkPlanPage(): Promise<void> {
        await this.mebbis.navigateTo(MEBBIS_PAGES.EGITIM_BILGISI_GIRIS);
        await this.mebbis.waitForPageReady();
    }

    /**
     * Submit a single work plan entry to MEBBIS
     */
    async submitWorkPlan(entry: WorkPlanEntry): Promise<WorkPlanSyncResult> {
        logger.info(`Submitting work plan for ${entry.tcKimlikNo} on ${entry.tarih}`);

        try {
            await this.goToWorkPlanPage();

            // Fill student TC
            await this.mebbis.fillField('#txtBireyTCKimlik', entry.tcKimlikNo);

            // Trigger search/load student
            await this.mebbis.click('#btnAra');
            await this.mebbis.waitForPageReady();

            // Check if student found
            const errorExists = await this.mebbis.elementExists('.error-message');
            if (errorExists) {
                const errorText = await this.mebbis.getText('.error-message');
                return {
                    entry,
                    success: false,
                    error: errorText || 'Öğrenci bulunamadı',
                };
            }

            // Fill date
            await this.mebbis.fillField('#txtTarih', entry.tarih);

            // Select educator
            await this.mebbis.selectOption('#ddlPersonel', entry.egitimciTcKimlik);

            // Fill time
            await this.mebbis.fillField('#txtBaslangicSaati', entry.baslangicSaati);
            await this.mebbis.fillField('#txtBitisSaati', entry.bitisSaati);

            // Select module
            await this.mebbis.selectOption('#ddlModul', entry.modulKodu);

            // Select session type
            const seansValue = entry.seansType === 'bireysel' ? '1' : '2';
            await this.mebbis.selectOption('#ddlSeansTur', seansValue);

            // Optional notes
            if (entry.aciklama) {
                await this.mebbis.fillField('#txtAciklama', entry.aciklama);
            }

            // Submit form
            await this.mebbis.click('#btnKaydet');
            await this.mebbis.waitForPageReady();

            // Check for success message
            const successExists = await this.mebbis.elementExists('.success-message, .alert-success');
            if (successExists) {
                // Try to extract MEBBIS ID from success message
                const successText = await this.mebbis.getText('.success-message, .alert-success');
                const idMatch = successText?.match(/(\d+)/);

                logger.info(`Work plan submitted successfully for ${entry.tcKimlikNo}`);
                return {
                    entry,
                    success: true,
                    mebbisId: idMatch ? idMatch[1] : undefined,
                };
            }

            // Check for error
            const submitError = await this.mebbis.getText('.error-message, .alert-danger');
            return {
                entry,
                success: false,
                error: submitError || 'Kayıt işlemi başarısız',
            };

        } catch (error) {
            logger.error(`Work plan submission failed for ${entry.tcKimlikNo}:`, error);
            return {
                entry,
                success: false,
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
            };
        }
    }

    /**
     * Submit multiple work plan entries in batch
     */
    async submitBatch(entries: WorkPlanEntry[], stopOnError = false): Promise<WorkPlanBatchResult> {
        logger.info(`Starting batch submission of ${entries.length} work plans`);

        const results: WorkPlanSyncResult[] = [];
        let successful = 0;
        let failed = 0;

        for (const entry of entries) {
            const result = await this.submitWorkPlan(entry);
            results.push(result);

            if (result.success) {
                successful++;
            } else {
                failed++;
                if (stopOnError) {
                    logger.warn('Stopping batch due to error (stopOnError=true)');
                    break;
                }
            }
        }

        logger.info(`Batch complete: ${successful} successful, ${failed} failed`);

        return {
            total: entries.length,
            successful,
            failed,
            results,
        };
    }

    /**
     * Delete an existing work plan from MEBBIS
     */
    async deleteWorkPlan(mebbisId: string): Promise<boolean> {
        logger.info(`Deleting work plan: ${mebbisId}`);

        try {
            await this.goToWorkPlanPage();

            // Navigate to edit mode with the ID
            await this.mebbis.navigateTo(`${MEBBIS_PAGES.EGITIM_BILGISI_GIRIS}?id=${mebbisId}`);
            await this.mebbis.waitForPageReady();

            // Click delete button
            await this.mebbis.click('#btnSil');

            // Confirm deletion (handle ASP.NET confirm dialog)
            await this.mebbis.executeScript(`
                if (typeof __doPostBack === 'function') {
                    __doPostBack('btnSilOnay', '');
                }
            `);
            await this.mebbis.waitForPageReady();

            // Check for success
            const successExists = await this.mebbis.elementExists('.success-message, .alert-success');
            return successExists;

        } catch (error) {
            logger.error(`Failed to delete work plan ${mebbisId}:`, error);
            return false;
        }
    }

    /**
     * Correct a work plan (delete old + create new)
     */
    async correctWorkPlan(oldMebbisId: string, newEntry: WorkPlanEntry): Promise<WorkPlanSyncResult> {
        logger.info(`Correcting work plan ${oldMebbisId}`);

        // First delete the old entry
        const deleted = await this.deleteWorkPlan(oldMebbisId);
        if (!deleted) {
            return {
                entry: newEntry,
                success: false,
                error: `Eski kayıt silinemedi: ${oldMebbisId}`,
            };
        }

        // Then create new entry
        return await this.submitWorkPlan(newEntry);
    }

    /**
     * Fetch existing work plans for a date range from MEBBIS
     */
    async fetchWorkPlans(startDate: string, endDate: string): Promise<WorkPlanEntry[]> {
        logger.info(`Fetching work plans from ${startDate} to ${endDate}`);

        try {
            await this.mebbis.navigateTo(MEBBIS_PAGES.EGITIM_PLANI_GORUNTULEME);
            await this.mebbis.waitForPageReady();

            // Fill date range
            await this.mebbis.fillField('#txtBaslangicTarihi', startDate);
            await this.mebbis.fillField('#txtBitisTarihi', endDate);

            // Search
            await this.mebbis.click('#btnListele');
            await this.mebbis.waitForPageReady();

            // Extract table data
            const plans = await this.mebbis.executeScript<WorkPlanEntry[]>(`
                const rows = document.querySelectorAll('#gvListe tbody tr');
                return Array.from(rows).map(row => {
                    const cells = row.querySelectorAll('td');
                    return {
                        tcKimlikNo: cells[0]?.textContent?.trim() || '',
                        egitimciTcKimlik: cells[1]?.textContent?.trim() || '',
                        tarih: cells[2]?.textContent?.trim() || '',
                        baslangicSaati: cells[3]?.textContent?.trim() || '',
                        bitisSaati: cells[4]?.textContent?.trim() || '',
                        modulKodu: cells[5]?.textContent?.trim() || '',
                        seansType: cells[6]?.textContent?.includes('Bireysel') ? 'bireysel' : 'grup',
                        aciklama: cells[7]?.textContent?.trim() || '',
                    };
                });
            `);

            logger.info(`Fetched ${plans.length} work plans`);
            return plans;

        } catch (error) {
            logger.error('Failed to fetch work plans:', error);
            return [];
        }
    }
}

/**
 * Create Work Plan Service instance
 */
export function createWorkPlanService(mebbis: MebbisAutomationService): WorkPlanService {
    return new WorkPlanService(mebbis);
}
