/**
 * Mebbis Compliance Controller
 * Custom controller without a content type
 */

import mebbisComplianceService from '../services/mebbis-compliance';

export default {
    async validateLesson(ctx: any) {
        try {
            const { lesson, existingLessons } = ctx.request.body;
            const result = mebbisComplianceService.validateLesson(lesson, existingLessons);
            return ctx.send(result);
        } catch (err) {
            ctx.throw(500, err);
        }
    },

    async validateCompensation(ctx: any) {
        try {
            const { telafi, missedDate } = ctx.request.body;
            const result = mebbisComplianceService.validateCompensation(telafi, missedDate);
            return ctx.send(result);
        } catch (err) {
            ctx.throw(500, err);
        }
    },

    async calculateFeeIncrease(ctx: any) {
        try {
            const { ufeRate, tufeRate, basePrice } = ctx.request.body;
            const result = mebbisComplianceService.calculateFeeIncrease(ufeRate, tufeRate, basePrice);
            return ctx.send(result);
        } catch (err) {
            ctx.throw(500, err);
        }
    }
};
