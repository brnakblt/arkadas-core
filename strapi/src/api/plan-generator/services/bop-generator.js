'use strict';

module.exports = ({ strapi }) => ({
    async generate(bepId, startDate, period = 'daily') {
        // 1. Fetch BEP
        const bep = await strapi.entityService.findOne('api::bireysel-egitim-plani.bireysel-egitim-plani', bepId, {
            populate: ['student']
        });

        if (!bep) throw new Error('BEP not found');

        // 2. Distribute Modules over dates
        // Simple logic: Take "altBasamaklar" and create a plan for the target date
        const modules = bep.altBasamaklar || [];

        // Create one BÖP entry
        const bopData = {
            student: bep.student.id,
            bep: bepId,
            planType: period,
            baslangicTarihi: startDate || new Date(),
            plannedModules: modules, // Assign all modules for now (user refines later)
            status: 'draft',
            materials: ["Resimli kartlar", "Gerçek nesneler"] // Default placeholders
        };

        const createdBop = await strapi.entityService.create('api::bireysel-ogretim-plani.bireysel-ogretim-plani', {
            data: bopData
        });

        return createdBop;
    }
});
