/**
 * is-authenticated policy
 * Checks if user is authenticated via JWT
 */

import type { Strapi } from '@strapi/strapi';

export default async (policyContext: any, config: any, { strapi }: { strapi: Strapi }) => {
    if (policyContext.state.user) {
        return true;
    }

    return false;
};
