'use strict';

/**
 * fatura controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::fatura.fatura', ({ strapi }) => ({
    /**
     * Generate invoices from a specific period
     * Calculates totals based on student sessions
     */
    async generateFromDonem(ctx) {
        const { donem, ay, yil, tenantId } = ctx.request.body;

        if (!donem || !ay || !yil || !tenantId) {
            return ctx.badRequest('donem, ay, yil ve tenantId parametreleri gerekli');
        }

        try {
            // Get all students for tenant
            const students = await strapi.entityService.findMany(
                'api::student-profile.student-profile',
                {
                    filters: { tenant: tenantId },
                    populate: ['tenant'],
                }
            );

            const createdInvoices = [];

            for (const student of students) {
                // Calculate sessions for this period (would integrate with schedule data)
                const toplamSaat = await this.calculateStudentHours(student.id, ay, yil);

                if (toplamSaat > 0) {
                    const birimFiyat = 100; // Default, could come from tenant config
                    const toplamTutar = toplamSaat * birimFiyat;
                    const kdvOrani = 0;
                    const kdvTutar = toplamTutar * (kdvOrani / 100);
                    const netTutar = toplamTutar + kdvTutar;

                    // Generate invoice number
                    const faturaNo = `FT-${yil}${String(ay).padStart(2, '0')}-${String(createdInvoices.length + 1).padStart(4, '0')}`;

                    const fatura = await strapi.entityService.create(
                        'api::fatura.fatura',
                        {
                            data: {
                                faturaNo,
                                student: student.id,
                                donem,
                                ay,
                                yil,
                                toplamSaat,
                                birimFiyat,
                                toplamTutar,
                                kdvOrani,
                                kdvTutar,
                                netTutar,
                                faturaTarihi: new Date().toISOString().split('T')[0],
                                status: 'draft',
                                tenant: tenantId,
                            },
                        }
                    );

                    createdInvoices.push(fatura);
                }
            }

            return ctx.send({
                success: true,
                message: `${createdInvoices.length} fatura oluşturuldu`,
                data: { invoices: createdInvoices, count: createdInvoices.length },
            });
        } catch (error) {
            strapi.log.error('generateFromDonem error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Calculate student hours for a period
     */
    async calculateStudentHours(studentId, ay, yil) {
        // This would query schedule/attendance data
        // For now, return a placeholder
        // In production, integrate with PKT or schedule collections
        try {
            const schedules = await strapi.entityService.findMany(
                'api::schedule.schedule',
                {
                    filters: {
                        student: studentId,
                        // Add date filtering based on ay/yil
                    },
                }
            );

            // Calculate total hours from schedules
            return schedules?.reduce((sum, s) => sum + (s.duration || 0) / 60, 0) || 0;
        } catch {
            return 0;
        }
    },

    /**
     * Sync invoice to MEBBIS
     */
    async syncToMebbis(ctx) {
        const { id } = ctx.params;

        try {
            const fatura = await strapi.entityService.findOne(
                'api::fatura.fatura',
                id,
                { populate: ['student', 'tenant'] }
            );

            if (!fatura) {
                return ctx.notFound('Fatura bulunamadı');
            }

            // Call MEBBIS service
            const mebbisUrl = process.env.MEBBIS_SERVICE_URL || 'http://localhost:4000';

            const response = await fetch(`${mebbisUrl}/api/invoices/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.MEBBIS_SERVICE_API_KEY || '',
                },
                body: JSON.stringify({
                    tenantId: fatura.tenant?.id,
                    faturaNo: fatura.faturaNo,
                    studentTcKimlik: fatura.student?.tcKimlikNo,
                    donem: fatura.donem,
                    toplamTutar: fatura.toplamTutar,
                }),
            });

            if (!response.ok) {
                throw new Error('MEBBIS sync failed');
            }

            const result = await response.json();

            // Update fatura with MEBBIS reference
            await strapi.entityService.update(
                'api::fatura.fatura',
                id,
                {
                    data: {
                        syncedToMebbis: true,
                        mebbisRefId: result.data?.mebbisId,
                        mebbisOnayTarihi: new Date(),
                        status: 'pending',
                    },
                }
            );

            return ctx.send({
                success: true,
                message: 'Fatura MEBBIS\'e aktarıldı',
                data: { mebbisId: result.data?.mebbisId },
            });
        } catch (error) {
            strapi.log.error('syncToMebbis error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Generate PDF for invoice
     */
    async generatePdf(ctx) {
        const { id } = ctx.params;

        try {
            const fatura = await strapi.entityService.findOne(
                'api::fatura.fatura',
                id,
                { populate: ['student', 'tenant'] }
            );

            if (!fatura) {
                return ctx.notFound('Fatura bulunamadı');
            }

            // Generate PDF HTML
            const html = this.generateInvoiceHtml(fatura);

            // In production, use puppeteer or a PDF service
            // For now, return HTML that can be converted client-side
            ctx.type = 'text/html';
            ctx.body = html;
        } catch (error) {
            strapi.log.error('generatePdf error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Generate invoice HTML template
     */
    generateInvoiceHtml(fatura) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Fatura ${fatura.faturaNo}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #2563eb; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; }
        .info-box h3 { margin: 0 0 10px 0; color: #374151; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .totals { text-align: right; }
        .totals .row { display: flex; justify-content: flex-end; margin: 5px 0; }
        .totals .label { width: 150px; }
        .totals .value { width: 100px; font-weight: 600; }
        .totals .grand-total { font-size: 1.2em; color: #2563eb; border-top: 2px solid #333; padding-top: 10px; }
        .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FATURA</h1>
        <p>Fatura No: <strong>${fatura.faturaNo}</strong></p>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>FATURA BİLGİLERİ</h3>
            <p><strong>Tarih:</strong> ${new Date(fatura.faturaTarihi).toLocaleDateString('tr-TR')}</p>
            <p><strong>Dönem:</strong> ${fatura.donem}</p>
            <p><strong>Ay/Yıl:</strong> ${fatura.ay}/${fatura.yil}</p>
        </div>
        <div class="info-box">
            <h3>ÖĞRENCİ BİLGİLERİ</h3>
            <p><strong>Ad Soyad:</strong> ${fatura.student?.firstName || ''} ${fatura.student?.lastName || ''}</p>
            <p><strong>Öğrenci No:</strong> ${fatura.student?.studentNumber || '-'}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Açıklama</th>
                <th>Miktar</th>
                <th>Birim Fiyat</th>
                <th>Tutar</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Özel Eğitim Hizmeti</td>
                <td>${fatura.toplamSaat || 0} Saat</td>
                <td>${Number(fatura.birimFiyat || 0).toFixed(2)} ₺</td>
                <td>${Number(fatura.toplamTutar || 0).toFixed(2)} ₺</td>
            </tr>
        </tbody>
    </table>

    <div class="totals">
        <div class="row">
            <span class="label">Ara Toplam:</span>
            <span class="value">${Number(fatura.toplamTutar || 0).toFixed(2)} ₺</span>
        </div>
        <div class="row">
            <span class="label">KDV (%${fatura.kdvOrani || 0}):</span>
            <span class="value">${Number(fatura.kdvTutar || 0).toFixed(2)} ₺</span>
        </div>
        <div class="row grand-total">
            <span class="label">GENEL TOPLAM:</span>
            <span class="value">${Number(fatura.netTutar || 0).toFixed(2)} ₺</span>
        </div>
    </div>

    <div class="footer">
        <p>Bu fatura ${fatura.tenant?.name || 'Özel Eğitim Kurumu'} tarafından düzenlenmiştir.</p>
        <p>Fatura Durumu: <strong>${fatura.status?.toUpperCase()}</strong></p>
    </div>
</body>
</html>
        `;
    },
}));
