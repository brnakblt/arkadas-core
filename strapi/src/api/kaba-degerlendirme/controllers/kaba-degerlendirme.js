'use strict';

/**
 * kaba-degerlendirme controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::kaba-degerlendirme.kaba-degerlendirme', ({ strapi }) => ({
    /**
     * Generate Kaba Değerlendirme from MEBBIS data
     * Fetches student performance and needs from MEBBIS automatically
     */
    async generateFromMebbis(ctx) {
        const { studentId, donem } = ctx.request.body;

        if (!studentId || !donem) {
            return ctx.badRequest('studentId ve donem parametreleri gerekli');
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

            // Call MEBBIS service to fetch performance data
            const mebbisUrl = process.env.MEBBIS_SERVICE_URL || 'http://localhost:4000';
            const tenantId = student.tenant?.id;

            // Fetch report from MEBBIS service
            const reportResponse = await fetch(
                `${mebbisUrl}/api/students/${student.tcKimlikNo || student.studentNumber}/report?tenantId=${tenantId}`,
                {
                    headers: {
                        'X-API-Key': process.env.MEBBIS_SERVICE_API_KEY || '',
                    },
                }
            );

            if (!reportResponse.ok) {
                throw new Error('MEBBIS verisi çekilemedi');
            }

            const mebbisData = await reportResponse.json();

            // Create Kaba Değerlendirme from MEBBIS data
            const kabaDegerlendirme = await strapi.entityService.create(
                'api::kaba-degerlendirme.kaba-degerlendirme',
                {
                    data: {
                        student: studentId,
                        donem,
                        degerlendirmeTarihi: new Date().toISOString().split('T')[0],
                        performanslar: mebbisData.data?.raporBilgisi || {},
                        ihtiyaclar: this.extractIhtiyaclar(mebbisData.data),
                        gelisimAlanlari: this.extractGelisimAlanlari(mebbisData.data),
                        createdFromMebbis: true,
                        status: 'draft',
                        tenant: tenantId,
                    },
                }
            );

            return ctx.send({
                success: true,
                message: 'Kaba değerlendirme MEBBIS verilerinden oluşturuldu',
                data: kabaDegerlendirme,
            });
        } catch (error) {
            strapi.log.error('generateFromMebbis error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Extract needs from MEBBIS data
     */
    extractIhtiyaclar(data) {
        // Parse MEBBIS disability/needs data
        const ihtiyaclar = [];

        if (data?.raporBilgisi?.engelGrubu) {
            ihtiyaclar.push({
                alan: 'Engel Grubu',
                ihtiyac: data.raporBilgisi.engelGrubu,
            });
        }

        return ihtiyaclar;
    },

    /**
     * Extract development areas from MEBBIS data
     */
    extractGelisimAlanlari(data) {
        return {
            bilisselGelisim: { durum: 'degerlendirilmedi' },
            dilVeIletisim: { durum: 'degerlendirilmedi' },
            sosyalDuygusalGelisim: { durum: 'degerlendirilmedi' },
            motorGelisim: { durum: 'degerlendirilmedi' },
            ozBakimBecerileri: { durum: 'degerlendirilmedi' },
        };
    },
}));
