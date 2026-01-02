'use strict';

const fs = require('fs');
const path = require('path');

// Helper for Turkish char conversion and normalization
const normalizeString = (str) => {
    return str
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U').replace(/ü/g, 'u')
        .replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/İ/g, 'I').replace(/ı/g, 'i')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};

async function main() {
    const { createStrapi } = require('@strapi/strapi');
    const app = await createStrapi({ distDir: path.resolve(__dirname, '..', 'dist') }).load();

    try {
        const allStaff = await strapi.db.query('api::team-member.team-member').findMany();
        console.log(`Checking ${allStaff.length} team members for duplicates...`);

        const groups = {};

        // Group by normalized name
        for (const staff of allStaff) {
            if (!staff.name) continue;
            const key = normalizeString(staff.name);
            if (!groups[key]) groups[key] = [];
            groups[key].push(staff);
        }

        for (const key in groups) {
            const entries = groups[key];
            if (entries.length > 1) {
                console.log(`Found ${entries.length} entries for "${key}" ("${entries[0].name}")`);

                entries.sort((a, b) => {
                    // Score based on title length/specificity
                    // Prefer specific titles over 'Uzman'
                    const scoreA = (a.title && a.title !== 'Uzman') ? 10 : 0;
                    const scoreB = (b.title && b.title !== 'Uzman') ? 10 : 0;

                    if (scoreA !== scoreB) return scoreB - scoreA; // higher score first
                    return b.id - a.id; // newer first
                });

                const keep = entries[0];
                const remove = entries.slice(1);

                console.log(`   Keeping: [${keep.id}] ${keep.name} (${keep.title})`);

                for (const r of remove) {
                    console.log(`   Deleting: [${r.id}] ${r.name} (${r.title})`);
                    await strapi.entityService.delete('api::team-member.team-member', r.id);
                }
            }
        }

        console.log('Deduplication complete.');

    } catch (err) {
        console.error("Error:", err);
    }

    await app.destroy();
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
