'use strict';

const fs = require('fs-extra');
const path = require('path');
// const xlsx = require('xlsx'); // Removed Excel dependency

// Manual category mapping
// Update this object to override specific team members
const MANUAL_CATEGORIES = {
  // 'FILENAME_WITHOUT_EXTENSION': 'Category Name',
  // Example:
  // 'PINARSELCUK': 'Özel Eğitim Alanı Uzmanı', // Explicitly set
  // 'SOMEONEELSE': 'Kurum Müdürü',
};

// Default category for everyone else
const DEFAULT_CATEGORY = "Özel Eğitim Alanı Uzmanı";

// Helper to upload files manually
async function uploadFile(filepath, name) {
  try {
    const sharp = require('sharp');
    const crypto = require('crypto');

    // 1. Get Metadata
    const buffer = await fs.readFile(filepath);
    const metadata = await sharp(buffer).metadata();
    const hash = crypto.createHash('md5').update(name + Date.now()).digest('hex');
    const ext = '.webp';
    const fileName = `${hash}${ext}`;

    // 2. Ensure Upload Dir
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    await fs.ensureDir(uploadDir);

    // 3. Copy File
    const destPath = path.join(uploadDir, fileName);
    await fs.copy(filepath, destPath);

    console.log(`   + Copied to: ${destPath}`);

    // 4. Create DB Entry
    const fileEntry = await strapi.db.query('plugin::upload.file').create({
      data: {
        name: name,
        alternativeText: name,
        caption: name,
        width: metadata.width,
        height: metadata.height,
        formats: null, // Skip formats generation for seed
        hash: hash,
        ext: ext,
        mime: 'image/webp',
        size: (metadata.size / 1024).toFixed(2), // KB
        url: `/uploads/${fileName}`,
        provider: 'local',
        folderPath: '/',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return fileEntry;
  } catch (e) {
    console.error(`Failed to upload ${name}:`, e.message);
    return null;
  }
}

async function seedAdmin() {
  try {
    const roleQuery = strapi.db.query('admin::role');
    const userQuery = strapi.db.query('admin::user');

    const superAdminRole = await roleQuery.findOne({ where: { code: 'strapi-super-admin' } });
    if (!superAdminRole) return;

    const adminsCount = await userQuery.count();
    if (adminsCount > 0) {
      console.log('✅ Admin user already exists.');
      await seedApiTokens();
      return;
    }

    console.log('🚀 Seeding Super Admin user...');

    const email = process.env.STRAPI_ADMIN_EMAIL || 'admin@arkadas.com.tr';
    const password = process.env.STRAPI_ADMIN_PASSWORD || 'Strapi123!';
    const hashedPassword = await strapi.admin.services.auth.hashPassword(password);

    await userQuery.create({
      data: {
        username: 'admin',
        email,
        password: hashedPassword,
        firstname: 'Super',
        lastname: 'Admin',
        roles: [superAdminRole.id],
        isActive: true,
        blocked: false,
      }
    });

    console.log(`✅ Admin created: ${email}`);
    await seedApiTokens();
  } catch (error) {
    console.error('❌ Could not seed admin user:', error);
  }
}

async function seedUsers() {
  console.log('🚀 Seeding Authenticated Users...');
  try {
    const userPlugin = strapi.plugin('users-permissions');
    const userService = userPlugin.service('user');

    // Find Authenticated Role
    const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    if (!authenticatedRole) {
      console.error('❌ Authenticated role not found!');
      return;
    }

    const demoUserEmail = 'ozgur@arkadas.com.tr';

    // Check if user exists (using db query to be safe)
    const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: demoUserEmail }
    });

    if (!existingUser) {
      try {
        await userService.add({
          username: 'ozgur',
          email: demoUserEmail,
          password: 'Password123!',
          role: authenticatedRole.id,
          confirmed: true,
          blocked: false,
          provider: 'local'
        });
        console.log(`✅ User created: ${demoUserEmail} (Password123!)`);
      } catch (createError) {
        console.error('❌ Error creating user via service:', createError);
      }
    } else {
      console.log(`✅ User already exists: ${demoUserEmail}`);
    }

  } catch (err) {
    console.error('❌ Failed to seed users:', err);
  }
}

async function seedApiTokens() {
  try {
    const tokenService = strapi.admin.services['api-token'];
    if (!tokenService) return;

    const existing = await tokenService.list();
    const serviceTokenName = "MebbisServiceToken";

    if (!existing.find(t => t.name === serviceTokenName)) {
      const token = await tokenService.create({
        name: serviceTokenName,
        description: "Token for Services",
        type: 'full-access',
        lifespan: null
      });
      console.log(`✅ API Token created: ${token.accessKey}`);
      console.log(`⚠️  COPY TO STRAPI_API_TOKEN in Infisical`);
    }
  } catch (e) {
    console.error("Failed to seed API token:", e);
  }
}

async function seedTenant() {
  console.log('🚀 Seeding Tenants...');
  const tenantService = strapi.service('api::tenant.tenant');

  if (!tenantService) {
    console.log("Tenant service not found, skipping.");
    return null;
  }

  const existing = await strapi.db.query('api::tenant.tenant').findOne({ where: { domain: 'arkadas' } });
  if (existing) {
    console.log('✅ Tenant "Arkadaş" already exists.');
    return existing;
  }

  // Upload Tenant Logo
  const logoPath = path.join(__dirname, 'seed-assets', 'arkadas_logo.png');
  let logoId = null;

  if (fs.existsSync(logoPath)) {
    const logoEntry = await uploadFile(logoPath, 'arkadas_logo');
    if (logoEntry) {
      logoId = logoEntry.id;
      console.log('   + Tenant Logo uploaded');
    }
  }

  const tenant = await strapi.entityService.create('api::tenant.tenant', {
    data: {
      name: 'Arkadaş Özel Eğitim',
      domain: 'arkadas',
      contactEmail: 'cigliarkadasozelegitim@gmail.com',
      logo: logoId, // Attach logo
      publishedAt: new Date(),
    }
  });

  console.log('✅ Tenant created: Arkadaş Özel Eğitim');
  return tenant;
}

async function seedTeamMembers() {
  console.log('🚀 Seeding Team Members...');
  const assetDir = path.resolve(__dirname, 'seed-assets');
  if (!fs.existsSync(assetDir)) {
    console.log('⚠️ Seed assets not found, skipping team members.');
    return;
  }

  const files = fs.readdirSync(assetDir).filter(f => f.endsWith('.webp'));

  for (const file of files) {
    // 1. Filter out non-person files
    if (file.toLowerCase().includes('decor')) {
      console.log(`   - Skipping excluded file: ${file}`);
      continue;
    }

    const name = file.replace('.webp', '').replace(/[0-9]/g, '').replace(/_/g, ' '); // simple cleanup
    if (name.length < 3) continue; // skip numeric files like 1.webp

    const upperName = name.toUpperCase().trim();
    const rawNameKey = file.replace('.webp', '').toUpperCase().trim();

    const title = "Uzman"; // default title

    // 2. Determine Category (Manual or Default)
    let category = DEFAULT_CATEGORY;

    if (MANUAL_CATEGORIES[rawNameKey]) {
      category = MANUAL_CATEGORIES[rawNameKey];
    } else {
      // Try fuzzy match in manual keys just in case
      const key = Object.keys(MANUAL_CATEGORIES).find(k => k.includes(rawNameKey) || rawNameKey.includes(k));
      if (key) {
        category = MANUAL_CATEGORIES[key];
      }
    }

    const existing = await strapi.db.query('api::team-member.team-member').findOne({ where: { name: upperName } });
    if (existing) continue;

    const imageEntry = await uploadFile(path.join(assetDir, file), name);

    await strapi.entityService.create('api::team-member.team-member', {
      data: {
        name: upperName,
        title: title,
        image: imageEntry ? imageEntry.id : null,
        category: [category], // Wrap in array
        order: 1,
        publishedAt: new Date()
      }
    });
    console.log(`   + Team Member: ${upperName} (${category})`);
  }
  console.log('✅ Team Members seeded.');
}

async function seedHero() {
  console.log('🚀 Seeding Hero...');
  try {
    const existing = await strapi.db.query('api::hero.hero').findOne();
    if (existing) {
      console.log('✅ Hero data already exists.');
      return;
    }

    // Default Hero data
    const heroData = {
      title: 'Her Çocuk\nÖzel ve Değerli',
      subtitle: 'Sevgiyle Büyütülen Umutlar, Uzmanlıkla Şekillenen Yarınlar',
      description: 'İzmir Çiğli’de, her bireyin potansiyelini en üst düzeye çıkarmak için sevgi, sabır ve bilimsel yöntemlerle çalışıyoruz.',
      stats: [
        { label: 'Yıllık Tecrübe', value: '15+' },
        { label: 'Uzman Kadro', value: '24' },
        { label: 'Mutlu Aile', value: '500+' },
        { label: 'Eğitim Alanı', value: '1200m²' }
      ],
      publishedAt: new Date(),
    };

    // Try to upload hero images if available
    const heroImagesDir = path.resolve(__dirname, 'seed-assets/hero');
    let imageIds = [];

    // If no hero specific folder, use some team members as placeholder or try to find logos
    // Ideally user should provide hero images. using logo for now if no specific image.
    const logoPath = path.join(__dirname, 'seed-assets', 'arkadas_logo.png');
    if (fs.existsSync(logoPath)) {
      const logoEntry = await uploadFile(logoPath, 'Hero Image');
      if (logoEntry) imageIds.push(logoEntry.id);
    }

    if (imageIds.length > 0) {
      heroData.images = imageIds;
    }

    await strapi.entityService.create('api::hero.hero', {
      data: heroData
    });
    console.log('✅ Hero data seeded.');

  } catch (err) {
    console.error('❌ Failed to seed Hero:', err);
  }
}

async function seedPermissions() {
  console.log('🚀 Seeding Permissions...');
  try {
    const roleService = strapi.plugin('users-permissions').service('role');
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) {
      console.error('❌ Public role not found!');
      return;
    }

    const permissionQuery = strapi.db.query('plugin::users-permissions.permission');

    const actionsToEnable = [
      'api::team-member.team-member.find',
      'api::team-member.team-member.findOne',
      'api::tenant.tenant.find',
      'api::tenant.tenant.findOne',
      'api::contact-message.contact-message.create',
      'api::hero.hero.find',
    ];

    for (const action of actionsToEnable) {
      const existing = await permissionQuery.findOne({
        where: {
          action: action,
          role: publicRole.id,
        }
      });

      if (!existing) {
        await permissionQuery.create({
          data: {
            action: action,
            role: publicRole.id,
          }
        });
        console.log(`   + Enabled public permission: ${action}`);
      }
    }

    console.log('✅ Permissions seeded (Public).');

    // Authenticated Role Permissions
    const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    if (authenticatedRole) {
      const authActions = [
        'api::nextcloud-sync.nextcloud-sync.find',
        'api::nextcloud-sync.nextcloud-sync.findOne',
        'api::nextcloud-sync.nextcloud-sync.status',
        'api::hero.hero.find', // Authenticated users should also see this
        'api::team-member.team-member.find',
        'api::team-member.team-member.findOne',
      ];

      for (const action of authActions) {
        const existing = await permissionQuery.findOne({
          where: {
            action: action,
            role: authenticatedRole.id,
          }
        });

        if (!existing) {
          await permissionQuery.create({
            data: {
              action: action,
              role: authenticatedRole.id,
            }
          });
          console.log(`   + Enabled authenticated permission: ${action}`);
        }
      }
    }
    console.log('✅ Permissions seeded (Authenticated).');

  } catch (err) {
    console.error('❌ Failed to seed permissions:', err);
  }
}

async function main() {
  const { createStrapi } = require('@strapi/strapi');

  // Initialize Strapi
  const app = await createStrapi({ distDir: path.resolve(__dirname, '..', 'dist') }).load();

  try {
    await seedAdmin();
    await seedUsers();

    const tenant = await seedTenant();
    if (tenant) {
      await seedPermissions();
      await seedTeamMembers();
      await seedHero(); // Add Hero seeding
    }
  } catch (err) {
    console.error("Seeding Error:", err);
  }

  await app.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
