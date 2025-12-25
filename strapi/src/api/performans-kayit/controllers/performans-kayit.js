'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::performans-kayit.performans-kayit', ({ strapi }) => ({
    /**
     * Generate PKT from planning screen data
     * Çalışma saat ve modülleri planlama ekranından otomatik gelir
     */
    async generateFromPlanlama(ctx) {
        const { bepId, baslangicTarihi, bitisTarihi, planlamaData } = ctx.request.body;

        if (!bepId) {
            return ctx.badRequest('bepId parametresi gerekli');
        }

        try {
            const bep = await strapi.entityService.findOne(
                'api::bireysel-egitim-plani.bireysel-egitim-plani',
                bepId,
                { populate: ['student', 'tenant'] }
            );

            if (!bep) {
                return ctx.notFound('BEP bulunamadı');
            }

            // Create PKT with planning data
            const pkt = await strapi.entityService.create(
                'api::performans-kayit.performans-kayit',
                {
                    data: {
                        bep: bepId,
                        student: bep.student?.id,
                        donem: bep.donem,
                        baslangicTarihi: baslangicTarihi || bep.baslangicTarihi,
                        bitisTarihi: bitisTarihi || bep.bitisTarihi,
                        calismaModulleri: planlamaData?.moduller || [],
                        haftalikSaatler: planlamaData?.saatler || {},
                        degerlendirmeler: [],
                        genelDegerlendirme: 'gelisiyor',
                        tenant: bep.tenant?.id,
                    },
                }
            );

            return ctx.send({
                success: true,
                message: 'PKT planlama verilerinden oluşturuldu',
                data: pkt,
            });
        } catch (error) {
            strapi.log.error('generateFromPlanlama error:', error);
            return ctx.internalServerError(error.message);
        }
    },
}));
