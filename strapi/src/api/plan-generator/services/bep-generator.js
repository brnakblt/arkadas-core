'use strict';

module.exports = ({ strapi }) => ({
    async generate(studentId, kabaDegerlendirmeId) {
        // 1. Fetch Kaba Değerlendirme
        const kaba = await strapi.entityService.findOne('api::kaba-degerlendirme.kaba-degerlendirme', kabaDegerlendirmeId, {
            populate: ['student']
        });

        if (!kaba) throw new Error('Kaba Değerlendirme not found');

        // 2. Filter Needs (Items marked as false/hayır or explicitly needed)
        // Assuming 'ihtiyaclar' is a JSON array of skill objects { skill: "...", success: false }
        // This logic relies on the structure of your JSON. Adapting to generic structure:
        const needs = kaba.ihtiyaclar.filter(item => item.success === false || item.need === true);

        // 3. Create Draft BEP
        const bepData = {
            student: studentId,
            kabaDegerlendirme: kabaDegerlendirmeId,
            donem: kaba.donem,
            baslangicTarihi: new Date(),
            bitisTarihi: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // +1 Year
            uzunVadeliAmaclar: needs.map(n => ({ description: `${n.skillArea} alanında gelişim sağlamak.` })),
            kisaVadeliAmaclar: needs.map(n => ({ description: `${n.skillName} becerisini kazanmak.`, targetDate: null })),
            altBasamaklar: needs.map(n => ({ skill: n.skillName, criteria: "%80 başarı", method: "Doğrudan Öğretim" })),
            status: 'draft',
            notes: "Otomatik oluşturuldu."
        };

        const createdBep = await strapi.entityService.create('api::bireysel-egitim-plani.bireysel-egitim-plani', {
            data: bepData
        });

        return createdBep;
    }
});
