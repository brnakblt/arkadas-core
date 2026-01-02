'use strict';

/**
 * Multi-Tenant Seeder
 * 
 * Automatically detects tenant folders in data/tenants/{slug}/
 * and seeds data for each tenant.
 * 
 * Folder Structure:
 *   data/tenants/arkadas/
 *     seed-assets/
 *       personellistesi.xls
 *       ogrencilistesi.xml
 *       (team member photos)
 *     uploads/
 *       (files to upload)
 *     config.json (optional tenant settings)
 */

const fs = require('fs-extra');
const path = require('path');

const TENANTS_DIR = path.resolve(__dirname, '../../../data/tenants');

/**
 * Get all tenant slugs from data/tenants directory
 */
async function discoverTenants() {
    const tenants = [];

    if (!await fs.pathExists(TENANTS_DIR)) {
        console.log('📁 No tenants directory found, creating...');
        await fs.ensureDir(TENANTS_DIR);
        return tenants;
    }

    const entries = await fs.readdir(TENANTS_DIR, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const tenantPath = path.join(TENANTS_DIR, entry.name);
            const hasSeeedAssets = await fs.pathExists(path.join(tenantPath, 'seed-assets'));
            const hasConfig = await fs.pathExists(path.join(tenantPath, 'config.json'));

            tenants.push({
                slug: entry.name,
                path: tenantPath,
                hasSeeedAssets,
                hasConfig,
            });
        }
    }

    return tenants;
}

/**
 * Create or get a tenant record
 */
async function ensureTenant(slug, tenantPath) {
    // Check if tenant exists
    let tenant = await strapi.db.query('api::tenant.tenant').findOne({
        where: { slug },
    });

    if (tenant) {
        console.log(`   ✓ Tenant "${slug}" already exists (ID: ${tenant.id})`);
        return tenant;
    }

    // Load config if available
    let config = { name: slug, displayName: slug };
    const configPath = path.join(tenantPath, 'config.json');
    if (await fs.pathExists(configPath)) {
        try {
            config = { ...config, ...JSON.parse(await fs.readFile(configPath, 'utf8')) };
        } catch (e) {
            console.warn(`   ⚠ Failed to parse config.json for ${slug}`);
        }
    }

    // Create tenant
    tenant = await strapi.db.query('api::tenant.tenant').create({
        data: {
            slug,
            name: config.name,
            displayName: config.displayName,
            subdomain: config.subdomain || slug,
            isActive: true,
            settings: config.settings || {},
        },
    });

    console.log(`   ✓ Created tenant "${slug}" (ID: ${tenant.id})`);
    return tenant;
}

/**
 * Get tenant's seed assets path
 */
function getTenantAssetPaths(tenantPath) {
    return {
        seedAssets: path.join(tenantPath, 'seed-assets'),
        uploads: path.join(tenantPath, 'uploads'),
        studentXml: path.join(tenantPath, 'seed-assets', 'ogrencilistesi.xml'),
        staffXml: path.join(tenantPath, 'seed-assets', 'personellistesi.xls'),
        staffXmlAlt: path.join(tenantPath, 'seed-assets', 'personellistesi.xml'),
    };
}

/**
 * Seed tenant from the main seeder with tenant context
 */
async function seedTenantData(tenant, tenantPath) {
    const paths = getTenantAssetPaths(tenantPath);

    console.log(`\n📦 Seeding data for tenant: ${tenant.slug}`);

    // Check what seed assets are available
    const hasStudents = await fs.pathExists(paths.studentXml);
    const hasStaff = await fs.pathExists(paths.staffXml) || await fs.pathExists(paths.staffXmlAlt);

    if (!hasStudents && !hasStaff) {
        console.log(`   ℹ No seed assets found for ${tenant.slug}`);
        return;
    }

    // Pass tenant context to main seeder functions
    // This is done by setting a global context
    global.currentTenant = tenant;

    try {
        // Import seed functions from main seed.js
        // The main seeder needs to be modified to use global.currentTenant
        console.log(`   → Found assets: students=${hasStudents}, staff=${hasStaff}`);

        // For now, just log what we found
        // TODO: Refactor main seed.js to accept tenant parameter

        if (hasStudents) {
            console.log(`   📋 Student data: ${paths.studentXml}`);
        }

        if (hasStaff) {
            const staffPath = await fs.pathExists(paths.staffXml) ? paths.staffXml : paths.staffXmlAlt;
            console.log(`   👥 Staff data: ${staffPath}`);
        }

    } finally {
        global.currentTenant = null;
    }
}

/**
 * Main entry point for multi-tenant seeding
 */
async function seedAllTenants() {
    console.log('\n🏢 Multi-Tenant Auto-Seeder\n');

    // Discover tenants
    const tenants = await discoverTenants();

    if (tenants.length === 0) {
        console.log('ℹ No tenant folders found in data/tenants/');
        console.log('  Create folders like: data/tenants/arkadas/seed-assets/');
        return;
    }

    console.log(`Found ${tenants.length} tenant(s): ${tenants.map(t => t.slug).join(', ')}`);

    // Seed each tenant
    for (const tenantInfo of tenants) {
        console.log(`\n━━━ Processing: ${tenantInfo.slug} ━━━`);

        // Ensure tenant record exists
        const tenant = await ensureTenant(tenantInfo.slug, tenantInfo.path);

        // Seed tenant data if assets exist
        if (tenantInfo.hasSeeedAssets) {
            await seedTenantData(tenant, tenantInfo.path);
        }
    }

    console.log('\n✅ Multi-tenant seeding complete!\n');
}

// Export for use by main seeder
module.exports = {
    discoverTenants,
    ensureTenant,
    seedAllTenants,
    getTenantAssetPaths,
    TENANTS_DIR,
};

// If run directly
if (require.main === module) {
    const path = require('path');

    async function main() {
        const { createStrapi } = require('@strapi/strapi');
        const app = await createStrapi({ distDir: path.resolve(__dirname, '..', 'dist') }).load();

        global.strapi = app;

        try {
            await seedAllTenants();
        } catch (err) {
            console.error('Multi-tenant seeding error:', err);
        }

        await app.destroy();
        process.exit(0);
    }

    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
