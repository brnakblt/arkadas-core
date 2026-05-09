'use strict';

/**
 * MEBBIS Sync Service
 * Connects Strapi to the Python Scraper (Port 4000)
 */

module.exports = ({ strapi }) => ({
    async pullStudentFromMebbis(tckn) {
        const MEBBIS_URL = process.env.MEBBIS_URL || 'http://mebbis:4000';
        
        try {
            console.log(`[MEBBIS Sync] Triggering pull for TCKN: ${tckn}`);
            const response = await fetch(`${MEBBIS_URL}/api/v1/sync/pull-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tckn })
            });

            if (!response.ok) {
                throw new Error(`MEBBIS Service returned ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            // Logic to update local student/report data would go here
            return result.data;
        } catch (error) {
            strapi.log.error(`[MEBBIS Sync] Failed: ${error.message}`);
            throw error;
        }
    },

    async pushDailyPlanToMebbis(date) {
        // Logic to fetch confirmed sessions and push them
        strapi.log.info(`[MEBBIS Sync] Daily push scheduled for ${date}`);
        return { success: true };
    }
});
