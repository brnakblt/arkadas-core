/**
 * is-authenticated policy
 * Checks if user is authenticated via JWT
 */

import type { Core } from '@strapi/strapi';

export default async (policyContext: any, config: any, { strapi }: { strapi: Core.Strapi }) => {
    if (policyContext.state.user) {
        return true;
    }

    return false;
};
