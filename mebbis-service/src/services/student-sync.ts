/**
 * Arkadaş MEBBIS Service - Student Sync Service
 * 
 * Handles student data synchronization between local system and MEBBIS.
 * Migrated from FormOgrenciCekim.cs
 */

import { MebbisAutomationService, MEBBIS_PAGES } from './mebbis-automation';
import { Ogrenci, OgrenciRapor, OgrenciOkul } from '../types';
import { logger } from '../utils/logger';

/**
 * Student sync result
 */
export interface StudentSyncResult {
    success: boolean;
    syncedCount: number;
    failedCount: number;
    students: Ogrenci[];
    errors: string[];
}

/**
 * Student Sync Service
 * 
 * Fetches and synchronizes student data from MEBBIS.
 */
export class StudentSyncService {
    private mebbis: MebbisAutomationService;
    private strapiUrl: string;
    private strapiToken: string;
    private tenantId: number;

    constructor(mebbis: MebbisAutomationService, tenantId: number) {
        this.mebbis = mebbis;
        this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
        this.strapiToken = process.env.STRAPI_API_TOKEN || '';
        this.tenantId = tenantId;
    }

    /**
     * Fetch all students from MEBBIS
     */
    async fetchStudentsFromMebbis(): Promise<Ogrenci[]> {
        try {
            logger.info('Fetching students from MEBBIS...');

            await this.mebbis.navigateTo(MEBBIS_PAGES.ENGELLI_BIREY_MODULU);
            await this.mebbis.waitForPageReady();

            // Navigate to student list
            await this.mebbis.click('#menuOgrenciListesi');
            await this.mebbis.waitForPageReady();

            // Get all students from the table
            const students = await this.parseStudentTable();

            logger.info(`Found ${students.length} students in MEBBIS`);
            return students;
        } catch (error) {
            logger.error('Error fetching students from MEBBIS:', error);
            throw error;
        }
    }

    /**
     * Parse student data from MEBBIS table
     */
    private async parseStudentTable(): Promise<Ogrenci[]> {
        const students: Ogrenci[] = [];

        // Execute in page context to parse table data
        const tableData = await this.mebbis.executeScript<Array<{
            tcKimlikNo: string;
            ad: string;
            soyad: string;
            babaAdi: string;
            kayitTarihi: string;
        }>>(`
      const rows = document.querySelectorAll('#grdOgrenciListesi tr:not(:first-child)');
      const data = [];
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          data.push({
            tcKimlikNo: cells[0]?.textContent?.trim() || '',
            ad: cells[1]?.textContent?.trim() || '',
            soyad: cells[2]?.textContent?.trim() || '',
            babaAdi: cells[3]?.textContent?.trim() || '',
            kayitTarihi: cells[4]?.textContent?.trim() || '',
          });
        }
      });
      return data;
    `);

        for (const row of tableData) {
            if (row.tcKimlikNo) {
                students.push({
                    id: '', // Will be assigned by Strapi
                    tcKimlikNo: row.tcKimlikNo,
                    ad: row.ad,
                    soyad: row.soyad,
                    babaAdi: row.babaAdi,
                    kayitTarihi: this.parseTurkishDate(row.kayitTarihi),
                });
            }
        }

        return students;
    }

    /**
     * Fetch detailed student information including report data
     */
    async fetchStudentDetails(tcKimlikNo: string): Promise<Ogrenci | null> {
        try {
            logger.info(`Fetching details for student: ${tcKimlikNo}`);

            // Navigate to student search
            await this.mebbis.navigateTo(MEBBIS_PAGES.ENGELLI_BIREY_MODULU);
            await this.mebbis.fillField('#txtTcKimlik', tcKimlikNo);
            await this.mebbis.click('#btnAra');
            await this.mebbis.waitForPageReady();

            // Check if student found
            const found = await this.mebbis.elementExists('#pnlOgrenciBilgileri');
            if (!found) {
                logger.warn(`Student not found: ${tcKimlikNo}`);
                return null;
            }

            // Parse student info
            const student = await this.parseStudentDetails();

            // Fetch report information
            student.raporBilgisi = await this.fetchReportInfo(tcKimlikNo);

            // Fetch school information
            student.okulBilgisi = await this.fetchSchoolInfo(tcKimlikNo);

            return student;
        } catch (error) {
            logger.error(`Error fetching student details for ${tcKimlikNo}:`, error);
            return null;
        }
    }

    /**
     * Parse student details from the detail page
     */
    private async parseStudentDetails(): Promise<Ogrenci> {
        const details = await this.mebbis.executeScript<{
            tcKimlikNo: string;
            ad: string;
            soyad: string;
            babaAdi: string;
            kayitTarihi: string;
        }>(`
      return {
        tcKimlikNo: document.querySelector('#lblTcKimlik')?.textContent?.trim() || '',
        ad: document.querySelector('#lblAd')?.textContent?.trim() || '',
        soyad: document.querySelector('#lblSoyad')?.textContent?.trim() || '',
        babaAdi: document.querySelector('#lblBabaAdi')?.textContent?.trim() || '',
        kayitTarihi: document.querySelector('#lblKayitTarihi')?.textContent?.trim() || '',
      };
    `);

        return {
            id: '',
            tcKimlikNo: details.tcKimlikNo,
            ad: details.ad,
            soyad: details.soyad,
            babaAdi: details.babaAdi,
            kayitTarihi: this.parseTurkishDate(details.kayitTarihi),
        };
    }

    /**
     * Fetch student report (disability assessment) information
     */
    private async fetchReportInfo(tcKimlikNo: string): Promise<OgrenciRapor | undefined> {
        try {
            // Click on reports tab
            await this.mebbis.click('#tabRaporlar');
            await this.mebbis.waitForPageReady();

            const reportData = await this.mebbis.executeScript<{
                raporNo: string[];
                raporTarihi: string;
                engelGrubu: string;
                engelOrani: number;
            }>(`
        const rows = document.querySelectorAll('#grdRaporlar tr:not(:first-child)');
        const raporNo = [];
        let raporTarihi = '';
        let engelGrubu = '';
        let engelOrani = 0;
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const no = cells[0]?.textContent?.trim();
            if (no) raporNo.push(no);
            if (!raporTarihi) raporTarihi = cells[1]?.textContent?.trim() || '';
            if (!engelGrubu) engelGrubu = cells[2]?.textContent?.trim() || '';
            if (!engelOrani) engelOrani = parseInt(cells[3]?.textContent?.trim() || '0');
          }
        });
        
        return { raporNo, raporTarihi, engelGrubu, engelOrani };
      `);

            if (reportData.raporNo.length > 0) {
                return {
                    raporNo: reportData.raporNo,
                    raporTarihi: this.parseTurkishDate(reportData.raporTarihi),
                    engelGrubu: reportData.engelGrubu,
                    engelOrani: reportData.engelOrani,
                };
            }

            return undefined;
        } catch (error) {
            logger.warn(`Could not fetch report info: ${error}`);
            return undefined;
        }
    }

    /**
     * Fetch student school information
     */
    private async fetchSchoolInfo(tcKimlikNo: string): Promise<OgrenciOkul | undefined> {
        try {
            // Click on school tab
            await this.mebbis.click('#tabOkulBilgileri');
            await this.mebbis.waitForPageReady();

            const schoolData = await this.mebbis.executeScript<{
                okulAdi: string;
                sinif: string;
                okulTuru: string;
            }>(`
        return {
          okulAdi: document.querySelector('#lblOkulAdi')?.textContent?.trim() || '',
          sinif: document.querySelector('#lblSinif')?.textContent?.trim() || '',
          okulTuru: document.querySelector('#lblOkulTuru')?.textContent?.trim() || '',
        };
      `);

            if (schoolData.okulAdi) {
                return schoolData;
            }

            return undefined;
        } catch (error) {
            logger.warn(`Could not fetch school info: ${error}`);
            return undefined;
        }
    }

    /**
     * Sync students to Strapi
     */
    async syncToStrapi(students: Ogrenci[]): Promise<StudentSyncResult> {
        const result: StudentSyncResult = {
            success: true,
            syncedCount: 0,
            failedCount: 0,
            students: [],
            errors: [],
        };

        for (const student of students) {
            try {
                const synced = await this.upsertStudentInStrapi(student);
                if (synced) {
                    result.syncedCount++;
                    result.students.push(synced);
                } else {
                    result.failedCount++;
                    result.errors.push(`Failed to sync: ${student.tcKimlikNo}`);
                }
            } catch (error) {
                result.failedCount++;
                result.errors.push(`Error syncing ${student.tcKimlikNo}: ${error}`);
            }
        }

        result.success = result.failedCount === 0;
        return result;
    }

    /**
     * Upsert a student in Strapi
     */
    private async upsertStudentInStrapi(student: Ogrenci): Promise<Ogrenci | null> {
        try {
            // Check if student exists
            const existingResponse = await fetch(
                `${this.strapiUrl}/api/student-profiles?filters[tcKimlikNo][$eq]=${student.tcKimlikNo}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.strapiToken}`,
                    },
                }
            );

            const existingData = await existingResponse.json();

            const studentData = {
                tcKimlikNo: student.tcKimlikNo,
                firstName: student.ad,
                lastName: student.soyad,
                fatherName: student.babaAdi,
                registrationDate: student.kayitTarihi,
                tenant: this.tenantId,
                // Map additional fields as needed
            };

            let response: Response;

            if (existingData.data && existingData.data.length > 0) {
                // Update existing student
                const existingId = existingData.data[0].id;
                response = await fetch(
                    `${this.strapiUrl}/api/student-profiles/${existingId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${this.strapiToken}`,
                        },
                        body: JSON.stringify({ data: studentData }),
                    }
                );
            } else {
                // Create new student
                response = await fetch(
                    `${this.strapiUrl}/api/student-profiles`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${this.strapiToken}`,
                        },
                        body: JSON.stringify({ data: studentData }),
                    }
                );
            }

            if (!response.ok) {
                throw new Error(`Strapi API error: ${response.status}`);
            }

            const result = await response.json();
            return {
                ...student,
                id: result.data.id,
            };
        } catch (error) {
            logger.error(`Failed to sync student to Strapi: ${error}`);
            return null;
        }
    }

    /**
     * Full sync: fetch from MEBBIS and sync to Strapi
     */
    async fullSync(): Promise<StudentSyncResult> {
        logger.info('Starting full student sync...');

        // Fetch all students from MEBBIS
        const mebbisStudents = await this.fetchStudentsFromMebbis();

        // Fetch detailed info for each student
        const detailedStudents: Ogrenci[] = [];
        for (const student of mebbisStudents) {
            const details = await this.fetchStudentDetails(student.tcKimlikNo);
            if (details) {
                detailedStudents.push(details);
            }
            // Small delay to avoid overwhelming MEBBIS
            await this.delay(500);
        }

        // Sync to Strapi
        const result = await this.syncToStrapi(detailedStudents);

        logger.info(`Sync complete: ${result.syncedCount} synced, ${result.failedCount} failed`);
        return result;
    }

    /**
     * Parse Turkish date format (DD.MM.YYYY) to ISO string
     */
    private parseTurkishDate(dateStr: string): string {
        if (!dateStr) return '';

        const parts = dateStr.split('.');
        if (parts.length !== 3) return dateStr;

        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    /**
     * Sync all students (Alias for fullSync)
     */
    async syncAllStudents(): Promise<StudentSyncResult> {
        return this.fullSync();
    }

    /**
     * Sync a single student by TC Kimlik No
     */
    async syncStudent(tcKimlikNo: string): Promise<boolean> {
        try {
            logger.info(`Syncing single student: ${tcKimlikNo}`);

            // Fetch detailed info
            const details = await this.fetchStudentDetails(tcKimlikNo);

            if (!details) {
                logger.warn(`Student ${tcKimlikNo} not found in MEBBIS`);
                return false;
            }

            // Sync to Strapi
            const result = await this.upsertStudentInStrapi(details);

            return !!result;
        } catch (error) {
            logger.error(`Error syncing student ${tcKimlikNo}:`, error);
            throw error;
        }
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Create a Student Sync Service instance
 */
export function createStudentSyncService(mebbis: MebbisAutomationService, tenantId: number): StudentSyncService {
    return new StudentSyncService(mebbis, tenantId);
}
