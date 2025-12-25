'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::donem-sonu-degerlendirme.donem-sonu-degerlendirme', ({ strapi }) => ({
    /**
     * Generate Dönem Sonu Değerlendirme from PKT
     * PKT'den otomatik oluşur
     */
    async generateFromPkt(ctx) {
        const { pktId } = ctx.request.body;

        if (!pktId) {
            return ctx.badRequest('pktId parametresi gerekli');
        }

        try {
            const pkt = await strapi.entityService.findOne(
                'api::performans-kayit.performans-kayit',
                pktId,
                { populate: ['student', 'bep', 'tenant'] }
            );

            if (!pkt) {
                return ctx.notFound('PKT bulunamadı');
            }

            // Calculate achievements from PKT evaluations
            const sonuclar = this.calculateResults(pkt);

            const donemSonu = await strapi.entityService.create(
                'api::donem-sonu-degerlendirme.donem-sonu-degerlendirme',
                {
                    data: {
                        pkt: pktId,
                        student: pkt.student?.id,
                        donem: pkt.donem,
                        degerlendirmeTarihi: new Date().toISOString().split('T')[0],
                        sonuclar,
                        ulasilan_Amaclar: sonuclar.ulasilan || [],
                        ulasilamayan_Amaclar: sonuclar.ulasilamayan || [],
                        status: 'draft',
                        tenant: pkt.tenant?.id,
                    },
                }
            );

            return ctx.send({
                success: true,
                message: 'Dönem sonu değerlendirmesi PKT\'den oluşturuldu',
                data: donemSonu,
            });
        } catch (error) {
            strapi.log.error('generateFromPkt error:', error);
            return ctx.internalServerError(error.message);
        }
    },

    /**
     * Calculate results from PKT evaluations
     */
    calculateResults(pkt) {
        const ulasilan = [];
        const ulasilamayan = [];

        if (pkt.degerlendirmeler && Array.isArray(pkt.degerlendirmeler)) {
            pkt.degerlendirmeler.forEach((d) => {
                if (d.durum === 'basarili' || d.durum === 'cok_iyi') {
                    ulasilan.push(d);
                } else if (d.durum === 'basarisiz') {
                    ulasilamayan.push(d);
                }
            });
        }

        return {
            ulasilan,
            ulasilamayan,
            genelBasari: pkt.genelDegerlendirme || 'gelisiyor',
            toplamModul: pkt.calismaModulleri?.length || 0,
        };
    },
}));
