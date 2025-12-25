'use strict';

/**
 * bireysel-egitim-plani controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::bireysel-egitim-plani.bireysel-egitim-plani', ({ strapi }) => ({
    /**
     * Generate BEP from Kaba Değerlendirme
     * Alt basamaklar kaba değerlendirmeden otomatik gelir
     */
    async generateFromKaba(ctx) {
        const { kabaDegerlendirmeId, baslangicTarihi, bitisTarihi } = ctx.request.body;

        if (!kabaDegerlendirmeId) {
            return ctx.badRequest('kabaDegerlendirmeId parametresi gerekli');
        }

        try {
            // Get Kaba Değerlendirme
            const kabaDegerlendirme = await strapi.entityService.findOne(
                'api::kaba-degerlendirme.kaba-degerlendirme',
                kabaDegerlendirmeId,
                { populate: ['student', 'tenant'] }
            );

            if (!kabaDegerlendirme) {
                return ctx.notFound('Kaba değerlendirme bulunamadı');
            }

            // Generate alt basamaklar from ihtiyaclar
            const altBasamaklar = this.generateAltBasamaklar(kabaDegerlendirme.ihtiyaclar);

            // Create BEP
            const bep = await strapi.entityService.create(
                'api::bireysel-egitim-plani.bireysel-egitim-plani',
                {
                    data: {
                        student: kabaDegerlendirme.student?.id,
                        kabaDegerlendirme: kabaDegerlendirmeId,
                        donem: kabaDegerlendirme.donem,
                        baslangicTarihi: baslangicTarihi || new Date().toISOString().split('T')[0],
                        bitisTarihi: bitisTarihi || this.calculateEndDate(),
                        altBasamaklar,
                        uzunVadeliAmaclar: [],
                        kisaVadeliAmaclar: [],
                        status: 'draft',
                        tenant: kabaDegerlendirme.tenant?.id,
                    },
                }
            );

            return ctx.send({
                success: true,
                message: 'BEP kaba değerlendirmeden oluşturuldu',
                data: bep,
            });
        } catch (error) {
            strapi.log.error('generateFromKaba error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Generate alt basamaklar (sub-goals) from needs
     */
    generateAltBasamaklar(ihtiyaclar) {
        const altBasamaklar = [];

        if (Array.isArray(ihtiyaclar)) {
            ihtiyaclar.forEach((ihtiyac, index) => {
                altBasamaklar.push({
                    id: index + 1,
                    alan: ihtiyac.alan || 'Genel',
                    hedef: ihtiyac.ihtiyac || '',
                    basamaklar: [],
                    durum: 'baslanmadi',
                    ilerleme: 0,
                });
            });
        }

        return altBasamaklar;
    },

    /**
     * Calculate default end date (3 months from now)
     */
    calculateEndDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        return date.toISOString().split('T')[0];
    },
}));
