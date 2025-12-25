'use strict';

/**
 * rapor controller
 * 
 * Generates various reports with PDF/Excel export capabilities.
 * Supports MEBBIS export for official documents.
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::rapor.rapor', ({ strapi }) => ({
    /**
     * Generate Ek-4 Report
     * Öğrenci Devam/Devamsızlık Takip Formu (MEB Ek-4)
     */
    async generateEk4(ctx) {
        const { studentId, donem, ay, yil, tenantId } = ctx.request.body;

        if (!studentId || !donem || !tenantId) {
            return ctx.badRequest('studentId, donem ve tenantId parametreleri gerekli');
        }

        try {
            // Get student info
            const student = await strapi.entityService.findOne(
                'api::student-profile.student-profile',
                studentId,
                { populate: ['tenant'] }
            );

            if (!student) {
                return ctx.notFound('Öğrenci bulunamadı');
            }

            // Get attendance data
            const attendanceLogs = await strapi.entityService.findMany(
                'api::attendance-log.attendance-log',
                {
                    filters: {
                        student: studentId,
                        // Add date filtering for ay/yil
                    },
                    sort: { date: 'asc' },
                }
            );

            // Calculate statistics
            const stats = this.calculateAttendanceStats(attendanceLogs);

            // Generate report content
            const icerik = {
                ogrenci: {
                    ad: student.firstName || student.ad,
                    soyad: student.lastName || student.soyad,
                    ogrenciNo: student.studentNumber,
                },
                donem,
                ay,
                yil,
                istatistikler: stats,
                detaylar: attendanceLogs.map(log => ({
                    tarih: log.date,
                    durum: log.status,
                    giris: log.checkIn,
                    cikis: log.checkOut,
                })),
            };

            // Create rapor record
            const rapor = await strapi.entityService.create(
                'api::rapor.rapor',
                {
                    data: {
                        raporTipi: 'ek4',
                        baslik: `Ek-4 - ${student.firstName} ${student.lastName} - ${ay}/${yil}`,
                        donem,
                        ay,
                        yil,
                        olusturmaTarihi: new Date(),
                        student: studentId,
                        icerik,
                        status: 'ready',
                        tenant: tenantId,
                    },
                }
            );

            return ctx.send({
                success: true,
                message: 'Ek-4 raporu oluşturuldu',
                data: rapor,
            });
        } catch (error) {
            strapi.log.error('generateEk4 error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Generate Dönem Sonu Report
     * Bireysel Eğitim Planı Dönem Sonu Değerlendirmesi
     */
    async generateDonemSonu(ctx) {
        const { studentId, donem, tenantId } = ctx.request.body;

        if (!studentId || !donem || !tenantId) {
            return ctx.badRequest('studentId, donem ve tenantId parametreleri gerekli');
        }

        try {
            const student = await strapi.entityService.findOne(
                'api::student-profile.student-profile',
                studentId,
                { populate: ['tenant'] }
            );

            if (!student) {
                return ctx.notFound('Öğrenci bulunamadı');
            }

            // Get BEP data
            const beps = await strapi.entityService.findMany(
                'api::bireysel-egitim-plani.bireysel-egitim-plani',
                {
                    filters: { student: studentId, donem },
                    populate: ['kabaDegerlendirme'],
                }
            );

            // Get PKT data
            const pkts = await strapi.entityService.findMany(
                'api::performans-kayit.performans-kayit',
                {
                    filters: { student: studentId, donem },
                }
            );

            // Calculate progress
            const ilerleme = this.calculateProgress(beps, pkts);

            const icerik = {
                ogrenci: {
                    ad: student.firstName || student.ad,
                    soyad: student.lastName || student.soyad,
                },
                donem,
                bepSayisi: beps.length,
                pktSayisi: pkts.length,
                ilerleme,
                bepDetaylari: beps.map(bep => ({
                    id: bep.id,
                    baslangic: bep.baslangicTarihi,
                    bitis: bep.bitisTarihi,
                    altBasamakSayisi: bep.altBasamaklar?.length || 0,
                    status: bep.status,
                })),
                genelDegerlendirme: this.getGenelDegerlendirme(pkts),
            };

            const rapor = await strapi.entityService.create(
                'api::rapor.rapor',
                {
                    data: {
                        raporTipi: 'donem_sonu',
                        baslik: `Dönem Sonu - ${student.firstName} ${student.lastName} - ${donem}`,
                        donem,
                        olusturmaTarihi: new Date(),
                        student: studentId,
                        icerik,
                        status: 'ready',
                        tenant: tenantId,
                    },
                }
            );

            return ctx.send({
                success: true,
                message: 'Dönem sonu raporu oluşturuldu',
                data: rapor,
            });
        } catch (error) {
            strapi.log.error('generateDonemSonu error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Generate Öğrenci Gelişim Report
     */
    async generateOgrenciGelisim(ctx) {
        const { studentId, baslangicTarihi, bitisTarihi, tenantId } = ctx.request.body;

        if (!studentId || !tenantId) {
            return ctx.badRequest('studentId ve tenantId parametreleri gerekli');
        }

        try {
            const student = await strapi.entityService.findOne(
                'api::student-profile.student-profile',
                studentId
            );

            if (!student) {
                return ctx.notFound('Öğrenci bulunamadı');
            }

            // Collect all related data
            const [beps, pkts, donemSonulari] = await Promise.all([
                strapi.entityService.findMany('api::bireysel-egitim-plani.bireysel-egitim-plani', {
                    filters: { student: studentId },
                }),
                strapi.entityService.findMany('api::performans-kayit.performans-kayit', {
                    filters: { student: studentId },
                }),
                strapi.entityService.findMany('api::donem-sonu-degerlendirme.donem-sonu-degerlendirme', {
                    filters: { student: studentId },
                }),
            ]);

            const icerik = {
                ogrenci: { ad: student.firstName, soyad: student.lastName },
                tarihAraligi: { baslangic: baslangicTarihi, bitis: bitisTarihi },
                toplamBep: beps.length,
                toplamPkt: pkts.length,
                toplamDonemSonu: donemSonulari.length,
                gelisimOzeti: this.summarizeProgress(beps, pkts, donemSonulari),
            };

            const rapor = await strapi.entityService.create('api::rapor.rapor', {
                data: {
                    raporTipi: 'ogrenci_gelisim',
                    baslik: `Öğrenci Gelişim - ${student.firstName} ${student.lastName}`,
                    baslangicTarihi,
                    bitisTarihi,
                    olusturmaTarihi: new Date(),
                    student: studentId,
                    icerik,
                    status: 'ready',
                    tenant: tenantId,
                },
            });

            return ctx.send({ success: true, data: rapor });
        } catch (error) {
            strapi.log.error('generateOgrenciGelisim error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Generate Kurum Performans Report
     */
    async generateKurumPerformans(ctx) {
        const { donem, ay, yil, tenantId } = ctx.request.body;

        if (!tenantId) {
            return ctx.badRequest('tenantId parametresi gerekli');
        }

        try {
            // Get counts
            const [students, teachers, schedules, invoices] = await Promise.all([
                strapi.entityService.findMany('api::student-profile.student-profile', {
                    filters: { tenant: tenantId },
                }),
                strapi.entityService.findMany('api::teacher-profile.teacher-profile', {
                    filters: { tenant: tenantId },
                }),
                strapi.entityService.findMany('api::schedule.schedule', {
                    filters: { tenant: tenantId },
                }),
                strapi.entityService.findMany('api::fatura.fatura', {
                    filters: { tenant: tenantId, donem },
                }),
            ]);

            const icerik = {
                donem,
                ay,
                yil,
                ogrenciSayisi: students.length,
                ogretmenSayisi: teachers.length,
                dersSayisi: schedules.length,
                faturaSayisi: invoices.length,
                toplamGelir: invoices.reduce((sum, f) => sum + (parseFloat(f.netTutar) || 0), 0),
            };

            const rapor = await strapi.entityService.create('api::rapor.rapor', {
                data: {
                    raporTipi: 'kurum_performans',
                    baslik: `Kurum Performans - ${donem || ''} ${ay || ''}/${yil || ''}`,
                    donem,
                    ay,
                    yil,
                    olusturmaTarihi: new Date(),
                    icerik,
                    status: 'ready',
                    tenant: tenantId,
                },
            });

            return ctx.send({ success: true, data: rapor });
        } catch (error) {
            strapi.log.error('generateKurumPerformans error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Download PDF
     */
    async downloadPdf(ctx) {
        const { id } = ctx.params;

        try {
            const rapor = await strapi.entityService.findOne('api::rapor.rapor', id, {
                populate: ['student', 'teacher', 'tenant'],
            });

            if (!rapor) {
                return ctx.notFound('Rapor bulunamadı');
            }

            const html = this.generateReportHtml(rapor);
            ctx.type = 'text/html';
            ctx.body = html;
        } catch (error) {
            strapi.log.error('downloadPdf error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Download Excel
     */
    async downloadExcel(ctx) {
        const { id } = ctx.params;

        try {
            const rapor = await strapi.entityService.findOne('api::rapor.rapor', id);

            if (!rapor) {
                return ctx.notFound('Rapor bulunamadı');
            }

            // Return JSON that can be converted to Excel client-side
            ctx.type = 'application/json';
            ctx.body = {
                baslik: rapor.baslik,
                raporTipi: rapor.raporTipi,
                olusturmaTarihi: rapor.olusturmaTarihi,
                icerik: rapor.icerik,
            };
        } catch (error) {
            strapi.log.error('downloadExcel error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Export to MEBBIS
     */
    async exportToMebbis(ctx) {
        const { id } = ctx.params;

        try {
            const rapor = await strapi.entityService.findOne('api::rapor.rapor', id, {
                populate: ['student', 'tenant'],
            });

            if (!rapor) {
                return ctx.notFound('Rapor bulunamadı');
            }

            const mebbisUrl = process.env.MEBBIS_SERVICE_URL || 'http://localhost:4000';

            const response = await fetch(`${mebbisUrl}/api/bep/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.MEBBIS_SERVICE_API_KEY || '',
                },
                body: JSON.stringify({
                    tenantId: rapor.tenant?.id,
                    raporTipi: rapor.raporTipi,
                    data: rapor.icerik,
                }),
            });

            if (!response.ok) {
                throw new Error('MEBBIS export failed');
            }

            await strapi.entityService.update('api::rapor.rapor', id, {
                data: { mebbisExported: true },
            });

            return ctx.send({ success: true, message: 'Rapor MEBBIS\'e aktarıldı' });
        } catch (error) {
            strapi.log.error('exportToMebbis error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    // Helper methods
    calculateAttendanceStats(logs) {
        const total = logs.length;
        const present = logs.filter(l => l.status === 'present').length;
        const absent = logs.filter(l => l.status === 'absent').length;
        const late = logs.filter(l => l.status === 'late').length;
        return { total, present, absent, late, devamOrani: total ? ((present / total) * 100).toFixed(1) : 0 };
    },

    calculateProgress(beps, pkts) {
        const tamamlanan = pkts.filter(p => p.genelDegerlendirme === 'basarili' || p.genelDegerlendirme === 'cok_iyi').length;
        return { toplam: pkts.length, tamamlanan, oran: pkts.length ? ((tamamlanan / pkts.length) * 100).toFixed(1) : 0 };
    },

    getGenelDegerlendirme(pkts) {
        if (!pkts.length) return 'veri_yok';
        const scores = { basarisiz: 1, gelisiyor: 2, basarili: 3, cok_iyi: 4 };
        const avg = pkts.reduce((sum, p) => sum + (scores[p.genelDegerlendirme] || 2), 0) / pkts.length;
        if (avg >= 3.5) return 'cok_iyi';
        if (avg >= 2.5) return 'basarili';
        if (avg >= 1.5) return 'gelisiyor';
        return 'basarisiz';
    },

    summarizeProgress(beps, pkts, donemSonulari) {
        return {
            bepIlerleme: this.calculateProgress(beps, pkts),
            donemSonuSayisi: donemSonulari.length,
            genelDurum: this.getGenelDegerlendirme(pkts),
        };
    },

    generateReportHtml(rapor) {
        const icerik = rapor.icerik || {};
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${rapor.baslik}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #1e40af; font-size: 24px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; color: #6b7280; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border: 1px solid #e5e7eb; text-align: left; }
        th { background: #f9fafb; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 12px; color: #6b7280; }
        .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 11px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${rapor.baslik}</h1>
        <p>Rapor Tipi: ${rapor.raporTipi?.toUpperCase()}</p>
    </div>
    <div class="meta">
        <span>Oluşturma: ${new Date(rapor.olusturmaTarihi).toLocaleDateString('tr-TR')}</span>
        <span>Dönem: ${rapor.donem || '-'}</span>
    </div>
    <div class="section">
        <h2>Özet</h2>
        <pre>${JSON.stringify(icerik, null, 2)}</pre>
    </div>
    <div class="footer">
        <p>Bu rapor ${rapor.tenant?.name || 'Arkadaş Özel Eğitim'} tarafından otomatik oluşturulmuştur.</p>
    </div>
</body>
</html>
        `;
    },
}));
