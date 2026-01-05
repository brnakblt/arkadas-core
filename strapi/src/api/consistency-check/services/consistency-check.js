'use strict';

module.exports = ({ strapi }) => ({
    async validateStudent(studentId) {
        const issues = [];

        // 1. Fetch Active Services (BÖP vs PKT)
        const bops = await strapi.entityService.findMany('api::bireysel-ogretim-plani.bireysel-ogretim-plani', {
            filters: { student: studentId, status: { $ne: 'completed' } },
            sort: 'baslangicTarihi:asc'
        });

        const pkts = await strapi.entityService.findMany('api::performans-kayit.performans-kayit', {
            filters: { student: studentId },
            sort: 'baslangicTarihi:asc'
        });

        // 2. Logic: Check if every Active BÖP has a corresponding PKT entry or if dates align
        // Simplified logic: Check if BÖP date exists in PKT ranges
        for (const bop of bops) {
            const bopDate = new Date(bop.baslangicTarihi).getTime();

            const hasCoverage = pkts.some(pkt => {
                const start = new Date(pkt.baslangicTarihi).getTime();
                const end = new Date(pkt.bitisTarihi).getTime();
                return bopDate >= start && bopDate <= end;
            });

            if (!hasCoverage) {
                issues.push({
                    type: 'MISSING_PKT',
                    message: `Planlanan tarih (${bop.baslangicTarihi}) için Performans Kaydı bulunamadı.`,
                    bopId: bop.id
                });
            }
        }

        return issues;
    }
});
