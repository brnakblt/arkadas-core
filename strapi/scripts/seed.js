'use strict';

const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');
const crypto = require('crypto');
const mime = require('mime-types');

// Map "Kan Grubu" from Turkish to Enum
const BLOOD_TYPE_MAP = {
    'A RH+': 'A_positive', 'A RH +': 'A_positive', 'A(+)': 'A_positive',
    'A RH-': 'A_negative', 'A RH -': 'A_negative', 'A(-)': 'A_negative',
    'B RH+': 'B_positive', 'B RH +': 'B_positive', 'B(+)': 'B_positive',
    'B RH-': 'B_negative', 'B RH -': 'B_negative', 'B(-)': 'B_negative',
    'AB RH+': 'AB_positive', 'AB RH +': 'AB_positive', 'AB(+)': 'AB_positive',
    'AB RH-': 'AB_negative', 'AB RH -': 'AB_negative', 'AB(-)': 'AB_negative',
    '0 RH+': 'O_positive', '0 RH +': 'O_positive', '0(+)': 'O_positive',
    '0 RH-': 'O_negative', '0 RH -': 'O_negative', '0(-)': 'O_negative',
};

const GENDER_MAP = {
    'Erkek': 'male',
    'Kız': 'female',
};

const DISABILITY_LEVEL_MAP = {
    'Hafif': 'mild',
    'Orta': 'moderate',
    'Ağır': 'severe',
    'Çok Ağır': 'profound',
};

// Helper for Turkish char conversion and normalization
const turkishToEnglish = (str) => {
    if (!str) return '';
    return str
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U').replace(/ü/g, 'u')
        .replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/İ/g, 'I').replace(/ı/g, 'i')
        .replace(/Ö/g, 'O').replace(/ö/g, 'o')
        .replace(/Ç/g, 'C').replace(/ç/g, 'c');
};

const normalizeString = (str) => {
    if (!str) return '';
    return turkishToEnglish(str)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};

const generateUsername = (first, last) => {
    const raw = `${first}${last}`;
    return normalizeString(raw);
};

async function parseXmlFile(filePath) {
    const parser = new xml2js.Parser({ explicitArray: false });
    const xmlData = await fs.readFile(filePath, 'utf8');
    const result = await parser.parseStringPromise(xmlData);

    let worksheet = result['Workbook']?.['ss:Worksheet'] || result['Workbook']?.['Worksheet'];
    if (Array.isArray(worksheet)) worksheet = worksheet[0];

    let table = worksheet?.['Table'] || worksheet?.['ss:Table'];
    if (Array.isArray(table)) table = table[0];

    let rows = table?.['Row'] || table?.['ss:Row'];
    if (!rows) return [];

    return rows;
}

function getRowData(row) {
    let cells = row['Cell'] || row['ss:Cell'];
    if (!cells) return [];
    if (!Array.isArray(cells)) cells = [cells];

    const rowData = [];
    let currentIndex = 1;

    cells.forEach(cell => {
        const cellIndex = parseInt(cell['$']?.['ss:Index'] || cell['$']?.['Index'] || currentIndex);
        // Fill gaps
        while (currentIndex < cellIndex) {
            rowData[currentIndex] = '';
            currentIndex++;
        }

        let data = cell['Data'] || cell['ss:Data'];
        if (typeof data === 'object' && data['_']) data = data['_'];
        if (typeof data !== 'string' && typeof data !== 'number') data = '';

        rowData[currentIndex] = String(data).trim();
        currentIndex++;
    });

    return rowData;
}

// Manual upload to bypass Service complexity
async function manualUpload(filePath) {
    if (!fs.existsSync(filePath)) return null;

    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';
    const hash = crypto.randomBytes(16).toString('hex');
    const destName = `${hash}${ext}`;

    // Ensure upload dir exists
    const uploadDir = path.resolve(__dirname, '../public/uploads');
    await fs.ensureDir(uploadDir);

    const destPath = path.join(uploadDir, destName);
    await fs.copy(filePath, destPath);

    const fileEntry = await strapi.db.query('plugin::upload.file').create({
        data: {
            name: fileName,
            alternativeText: fileName,
            caption: fileName,
            width: 0, // Should read dimensions but fine for seed
            height: 0,
            formats: null,
            hash: hash,
            ext: ext,
            mime: mimeType,
            size: stats.size / 1000,
            url: `/uploads/${destName}`,
            previewUrl: null,
            provider: 'local',
            provider_metadata: null,
            folderPath: '/',
        }
    });

    return fileEntry;
}

async function seedStudents(xmlPath, authenticatedRole) {
    console.log('🚀 Seeding Students from XML...');
    if (!fs.existsSync(xmlPath)) return;

    const rows = await parseXmlFile(xmlPath);
    let dataStartIndex = 0;

    // Header detection
    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const rowData = getRowData(rows[i]);
        if (rowData[3] && rowData[3].includes('ÖĞRENCİ NO') && rowData[6] && rowData[6].includes('KİMLİK')) {
            dataStartIndex = i + 1;
            break;
        }
    }
    if (dataStartIndex === 0) return console.error('❌ Student Header not found');

    const userService = strapi.plugin('users-permissions').service('user');

    for (let i = dataStartIndex; i < rows.length; i++) {
        try {
            const row = getRowData(rows[i]);
            if (!row[6]) continue;

            const raw = {
                studentNo: row[3],
                firstName: row[4],
                lastName: row[5],
                tckn: row[6],
                gender: row[7],
                disabilityType: row[8],
                bloodType: row[9],
                dob: row[10],
                phone: row[14],
                address: row[15],
            };

            if (!raw.tckn || raw.tckn.length !== 11) continue;

            const targetUsername = generateUsername(raw.firstName, raw.lastName);

            // 1. Create/Find User
            let user = await strapi.query('plugin::users-permissions.user').findOne({
                where: {
                    $or: [
                        { username: targetUsername },
                        { username: raw.tckn }
                    ]
                }
            });

            if (!user) {
                try {
                    user = await userService.add({
                        username: targetUsername,
                        email: `${raw.studentNo}@arkadas.com.tr`,
                        password: raw.tckn,
                        role: authenticatedRole.id,
                        confirmed: true,
                        provider: 'local',
                    });
                } catch (e) {
                    console.error(`   Failed to create student user ${targetUsername}:`, e.message);
                    continue;
                }
            } else if (user.username === raw.tckn) {
                await strapi.entityService.update('plugin::users-permissions.user', user.id, {
                    data: { username: targetUsername }
                });
            }

            // 2. Profile
            const parseDate = (d) => {
                if (!d) return null;
                const parts = d.split('.');
                if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                return null;
            };

            const profileData = {
                studentNumber: raw.studentNo,
                tckimlikno: raw.tckn,
                dateOfBirth: parseDate(raw.dob),
                gender: GENDER_MAP[raw.gender] || 'other',
                bloodType: BLOOD_TYPE_MAP[raw.bloodType] || null,
                disabilityType: raw.disabilityType,
                user: user.id,
            };

            const existingProfile = await strapi.db.query('api::student-profile.student-profile').findOne({ where: { tckimlikno: raw.tckn } });

            if (existingProfile) {
                await strapi.entityService.update('api::student-profile.student-profile', existingProfile.id, { data: profileData });
            } else {
                await strapi.entityService.create('api::student-profile.student-profile', { data: profileData });
            }

        } catch (err) {
            console.error(`Error processing student row ${i}:`, err);
        }
    }
}

async function seedPersonnel(xmlPath, authenticatedRole) {
    console.log('🚀 Seeding Personnel from XML...');
    if (!fs.existsSync(xmlPath)) return;

    const teamImagesDir = path.resolve(__dirname, '../../web/public/team-member');
    // Pre-scan images
    const availableImages = fs.existsSync(teamImagesDir) ? fs.readdirSync(teamImagesDir) : [];

    const rows = await parseXmlFile(xmlPath);
    let dataStartIndex = 0;

    // Header detection
    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const rowData = getRowData(rows[i]);
        if (rowData.some(c => c && c.toString().includes('PERSONEL NO'))) {
            dataStartIndex = i + 1;
            break;
        }
    }
    if (dataStartIndex === 0) return console.error("❌ Personnel Header not found");

    const headerRow = getRowData(rows[dataStartIndex - 1]);
    const idxName = headerRow.indexOf('ADI');
    const idxLast = headerRow.indexOf('SOYADI');
    const idxTitle = headerRow.indexOf('ÜNVANI');
    const idxTCKN = headerRow.indexOf('T.C. KİMLİK NO');
    const idxEmpNo = headerRow.indexOf('PERSONEL NO');

    if (idxName === -1 || idxTCKN === -1) return console.error("❌ Critical personnel columns missing");

    const userService = strapi.plugin('users-permissions').service('user');
    const allStaff = await strapi.db.query('api::team-member.team-member').findMany();
    const staffMap = {};
    allStaff.forEach(s => { if (s.name) staffMap[normalizeString(s.name)] = s; });

    for (let i = dataStartIndex; i < rows.length; i++) {
        try {
            const row = getRowData(rows[i]);
            const name = row[idxName];
            const last = row[idxLast];
            const tckn = row[idxTCKN];
            const empNo = row[idxEmpNo];
            const title = row[idxTitle] || 'Personel';

            if (!name || !tckn || tckn.length !== 11) continue;

            const fullName = `${name} ${last}`.trim().toUpperCase();
            const targetUsername = generateUsername(name, last);
            const normalizedName = normalizeString(fullName);

            // Helper for Turkish Title Case
            const toTitleCase = (str) => {
                if (!str) return '';
                return str.toLocaleLowerCase('tr-TR').split(' ').map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)).join(' ');
            };

            const formattedTitle = toTitleCase(title);
            let formattedCategory = formattedTitle;

            // Smart Category Mapping
            if (formattedTitle.toLowerCase().includes('müdür') || formattedTitle.toLowerCase().includes('kurucu')) {
                formattedCategory = 'Yönetim';
            } else if (formattedTitle.toLowerCase().includes('psikolog')) {
                formattedCategory = 'Psikolog';
            } else if (formattedTitle.toLowerCase().includes('fizyoterapist')) {
                formattedCategory = 'Fizyoterapist';
            } else if (formattedTitle.toLowerCase().includes('dil ve konuşma')) {
                formattedCategory = 'Dil ve Konuşma Terapisti';
            } else if (formattedTitle.toLowerCase().includes('öğretmen')) {
                // Keep specific teacher types if needed, or group? 
                // User didn't ask to group all teachers, but "Özel Eğitim Alanı Öğretmeni" is fine as is.
                // But let's keep default behavior for others.
                formattedCategory = formattedTitle;
            }

            // 1. Handle Image
            let imageId = null;
            const imageFile = availableImages.find(f => f.startsWith(targetUsername + '.')); // .webp or others
            if (imageFile) {
                const imagePath = path.join(teamImagesDir, imageFile);
                try {
                    const up = await manualUpload(imagePath);
                    if (up) imageId = up.id;
                } catch (e) { console.error(`   Failed img ${imageFile}: ${e.message}`); }
            }

            // 2. Create/Update TeamMember (Public)
            if (!staffMap[normalizedName]) {
                await strapi.entityService.create('api::team-member.team-member', {
                    data: {
                        name: fullName,
                        title: formattedTitle,
                        category: formattedCategory,
                        image: imageId,
                        publishedAt: new Date(),
                        order: i
                    }
                });
                console.log(`   + Staff TeamMember: ${fullName} (${formattedTitle})`);
            } else {
                // Force update category/title and image if present
                const dataToUpdate = {
                    title: formattedTitle,
                    category: formattedCategory,
                };
                if (imageId) dataToUpdate.image = imageId;

                await strapi.entityService.update('api::team-member.team-member', staffMap[normalizedName].id, {
                    data: dataToUpdate
                });
                console.log(`   ~ Staff Updated: ${fullName} (${formattedTitle})`);
            }

            // 3. Create User + TeacherProfile (Internal)
            let user = await strapi.query('plugin::users-permissions.user').findOne({ where: { username: targetUsername } });

            if (!user) {
                try {
                    user = await userService.add({
                        username: targetUsername,
                        email: `${empNo || tckn}@arkadas.com.tr`,
                        password: tckn,
                        role: authenticatedRole.id,
                        confirmed: true,
                        provider: 'local',
                    });
                } catch (e) {
                    console.error(`   Failed to create staff user ${targetUsername}:`, e.message);
                    continue;
                }
            }

            // Check TeacherProfile
            const existingProfile = await strapi.db.query('api::teacher-profile.teacher-profile').findOne({ where: { tckimlikno: tckn } });

            if (!existingProfile) {
                await strapi.entityService.create('api::teacher-profile.teacher-profile', {
                    data: {
                        employeeNumber: empNo || tckn,
                        tckimlikno: tckn,
                        specialization: formattedTitle,
                        user: user.id,
                    }
                });
                console.log(`   + TeacherProfile: ${fullName}`);
            }

        } catch (e) {
            console.error(`Error processing staff row ${i}:`, e.message);
        }
    }
}

async function seedHero(imagesPath) {
    console.log('🚀 Seeding Hero...');
    const imagesDir = path.resolve(imagesPath);
    if (!fs.existsSync(imagesDir)) return console.error('❌ Hero images dir not found at ' + imagesDir);

    const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(`   Found ${files.length} images to sync.`);

    const uploadedIds = [];
    for (const f of files) {
        try {
            const up = await manualUpload(path.join(imagesDir, f));
            if (up) uploadedIds.push(up.id);
        } catch (e) {
            console.error(`   Failed to upload ${f}:`, e.message);
        }
    }

    if (uploadedIds.length === 0) return console.log('   No images uploaded.');

    let hero = await strapi.entityService.findMany('api::hero.hero', { populate: ['images'] });

    const heroData = {
        title: 'Arkadaş Özel Eğitim',
        subtitle: 'Sevgi ve İlgiyle...',
        description: 'Özel çocuklarımız için özel bir dünya.',
        images: uploadedIds, // Set images
        stats: [
            { label: 'Öğrenci', value: '500+' },
            { label: 'Uzman', value: '50+' },
            { label: 'Yıl Deneyim', value: '10+' },
        ],
        publishedAt: new Date(),
    };

    if (hero) {
        await strapi.entityService.update('api::hero.hero', hero.id, { data: heroData });
        console.log('   ~ Hero updated with gallery.');
    } else {
        await strapi.entityService.create('api::hero.hero', { data: heroData });
        console.log('   + Hero created.');
    }
}

async function seedAdmin() {
    console.log('🚀 Seeding Super Admin user...');
    try {
        const roleQuery = strapi.db.query('admin::role');
        const userQuery = strapi.db.query('admin::user');

        const superAdminRole = await roleQuery.findOne({ where: { code: 'strapi-super-admin' } });
        if (!superAdminRole) return console.log('   Super Admin role not found.');

        const adminsCount = await userQuery.count();
        if (adminsCount > 0) {
            console.log('   Admin user already exists.');
            return;
        }

        const email = process.env.STRAPI_ADMIN_EMAIL || 'admin@arkadas.com.tr';
        const password = process.env.STRAPI_ADMIN_PASSWORD || 'Strapi123!';

        if (!strapi.admin) {
            console.log('   strapi.admin service not available, skipping admin seed.');
            return;
        }

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

        console.log(`   + Admin created: ${email}`);
    } catch (error) {
        console.error('   ❌ Could not seed admin user:', error.message);
    }
}

async function seedAppUser(authenticatedRole) {
    console.log('🚀 Seeding App Admin User (Frontend)...');
    try {
        const email = process.env.STRAPI_ADMIN_EMAIL || 'barannakblut@gmail.com';
        const password = process.env.STRAPI_ADMIN_PASSWORD || 'Strapi123!';
        const username = 'barannakblut';

        const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email } });

        if (!user) {
            await strapi.plugin('users-permissions').service('user').add({
                username,
                email,
                password,
                role: authenticatedRole.id,
                confirmed: true,
                provider: 'local',
            });
            console.log(`   + App User created: ${email}`);
        } else {
            console.log(`   ~ App User already exists: ${email}`);
        }
    } catch (e) {
        console.error('   ❌ Failed to seed App User:', e.message);
    }
}

// --- Content Seeding (Service, About, FAQ, Process) ---
async function setPublicPermissions(strapi) {
    console.log('🚀 Setting Public Permissions...');
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
    const permissions = [
        'api::hero.hero.find', 'api::hero.hero.findOne',
        'api::service.service.find', 'api::service.service.findOne',
        'api::process.process.find', 'api::process.process.findOne',
        'api::faq.faq.find', 'api::faq.faq.findOne',
        'api::gallery.gallery.find', 'api::gallery.gallery.findOne',
        'api::about.about.find', 'api::about.about.findOne',
        'api::team-member.team-member.find', 'api::team-member.team-member.findOne',
    ];
    for (const action of permissions) {
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: publicRole.id } });
        if (!existing) await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: publicRole.id } });
    }
    console.log('   Public permissions set.');
}

async function seedContent(strapi) {
    console.log('🚀 Seeding Static Content...');
    // About
    await strapi.db.query('api::about.about').deleteMany({ where: {} });
    await strapi.entityService.create('api::about.about', {
        data: {
            title: 'Hakkımızda',
            publishedAt: new Date(),
            blocks: [{ __component: 'shared.rich-text', body: `2009 yılından itibaren **İzmir'de** özel eğitim alanında öncü hizmetler sunan merkezimiz, özel gereksinimli çocukların eğitim ve rehabilitasyon süreçlerinde ailelerin en güvenilir yol arkadaşıdır.` }]
        }
    });

    // Services
    await strapi.db.query('api::service.service').deleteMany({ where: {} });
    const services = [
        { title: 'Dil ve Konuşma Terapisi', description: 'Dil ve konuşma bozuklukları olan çocuklar için bireysel terapi.', icon: '💬', features: [{ text: 'Artikülasyon Terapisi' }, { text: 'Dil Gelişimi' }] },
        { title: 'Özel Eğitim', description: 'Bireysel eğitim planları ve akademik destek.', icon: '🧩', features: [{ text: 'Bireysel Eğitim Planı' }] },
        { title: 'Rehabilitasyon', description: 'Fiziksel ve bilişsel rehabilitasyon.', icon: '🤸', features: [{ text: 'Fizyoterapi' }] }
    ];
    for (const s of services) await strapi.entityService.create('api::service.service', { data: { ...s, publishedAt: new Date() } });

    // Processes
    await strapi.db.query('api::process.process').deleteMany({ where: {} });
    const processes = [
        { number: '01', title: 'İlk Görüşme', description: 'Tanışma ve değerlendirme.', icon: '👥' },
        { number: '02', title: 'Planlama', description: 'Bireysel eğitim planı hazırlığı.', icon: '📋' },
        { number: '03', title: 'Eğitim', description: 'Eğitim sürecinin başlaması.', icon: '🚀' },
    ];
    for (const p of processes) await strapi.entityService.create('api::process.process', { data: { ...p, publishedAt: new Date() } });

    // FAQ
    await strapi.db.query('api::faq.faq').deleteMany({ where: {} });
    const faqs = [
        { question: 'Hangi yaş gruplarına hizmet veriyorsunuz?', answer: '0-18 yaş arası tüm çocuklara.' },
        { question: 'Nasıl kayıt olabilirim?', answer: 'İletişim sayfamızdan veya telefonla randevu alabilirsiniz.' }
    ];
    for (const f of faqs) await strapi.entityService.create('api::faq.faq', { data: { ...f, publishedAt: new Date() } });

    console.log('   Static content seeded.');
}

async function seedGallery(strapi) {
    console.log('🚀 Seeding Gallery...');
    await strapi.db.query('api::gallery.gallery').deleteMany({ where: {} });

    try {
        const galleryItems = [
            { src: '1.webp', title: 'Bireysel Çalışmalar', category: 'Eğitim', alt: 'Bireysel çalışma ortamı' },
            { src: '2.webp', title: 'Özel Eğitim Sınıfları', category: 'Eğitim', alt: 'Sınıf ortamı' },
            { src: '3.webp', title: 'Eğitici Aktiviteler', category: 'Sosyal Aktivite', alt: 'Aktivite' },
            { src: '4.webp', title: 'Bireysel Eğitim', category: 'Eğitim', alt: 'Bireysel eğitim' },
            { src: '5.webp', title: 'Grup Çalışmaları', category: 'Sosyal Aktivite', alt: 'Grup çalışması' },
            { src: '6.webp', title: 'Aile Danışmanlığı', category: 'Danışmanlık', alt: 'Danışmanlık' },
        ];

        for (const item of galleryItems) {
            // Find image by name (uploaded by seedHero)
            const files = await strapi.documents('plugin::upload.file').findMany({
                filters: { name: { $contains: item.src } }
            });

            if (files && files.length > 0) {
                await strapi.entityService.create('api::gallery.gallery', {
                    data: {
                        title: item.title,
                        category: item.category,
                        alt: item.alt,
                        image: files[0].id,
                        publishedAt: new Date()
                    }
                });
            }
        }
        console.log('   Gallery seeded.');
    } catch (e) {
        console.error('   ❌ Failed to seed Gallery:', e.message);
    }
}


async function seedApiToken(strapi) {
    console.log('🚀 Seeding API Token...');
    const tokenService = strapi.service('admin::api-token');
    if (!tokenService) return console.error('   ❌ API Token service not found.');

    const tokenName = 'Full Access Token';

    // Check if exists
    const existing = await strapi.db.query('admin::api-token').findOne({ where: { name: tokenName } });
    let accessToken = existing ? existing.accessKey : null;

    if (!accessToken) {
        // Create new
        const token = await tokenService.create({
            name: tokenName,
            description: 'Generated by seed script for services',
            type: 'full-access',
            lifespan: null, // Unlimited
        });
        accessToken = token.accessKey;
        console.log('   + API Token created.');
    } else {
        console.log('   ~ API Token already exists.');
    }

    // Sync to Infisical
    if (accessToken) {
        try {
            const { execSync } = require('child_process');
            console.log('   Syncing token to Infisical...');

            const paths = ['/', '/ai-service', '/mebbis-service'];
            for (const p of paths) {
                execSync(`infisical secrets set --env dev --path "${p}" STRAPI_API_TOKEN="${accessToken}"`, { stdio: 'ignore' });
            }
            console.log('   ✅ Token synced to Infisical (Root, AI, Mebbis).');
        } catch (e) {
            console.error('   ❌ Failed to sync token to Infisical:', e.message);
        }
    }
}

async function main() {
    const { createStrapi } = require('@strapi/strapi');
    const app = await createStrapi({ distDir: path.resolve(__dirname, '..', 'dist') }).load();

    try {
        // Tenant slug from env or default
        const tenantSlug = process.env.DEFAULT_TENANT || 'arkadas';
        const tenantDataPath = path.resolve(__dirname, `../../data/tenants/${tenantSlug}`);
        const configPath = path.join(tenantDataPath, 'config.json');

        // Load tenant config
        if (!fs.existsSync(configPath)) {
            throw new Error(`Tenant config not found: ${configPath}`);
        }
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        console.log(`\n🏢 Seeding for tenant: ${config.displayName || tenantSlug}`);
        console.log(`   📁 Data path: ${tenantDataPath}`);

        // Resolve paths from config
        const studentXml = path.join(tenantDataPath, config.seed?.students || 'seed/ogrencilistesi.xml');
        const staffXml = path.join(tenantDataPath, config.seed?.personnelXml || config.seed?.personnel || 'seed/personellistesi.xml');
        const heroImages = path.join(tenantDataPath, config.seed?.heroImages || 'assets/hero/');
        const teamMemberImages = path.join(tenantDataPath, config.seed?.teamPhotos || 'assets/team/');

        console.log(`   📋 Students: ${fs.existsSync(studentXml) ? '✓' : '✗'} ${studentXml}`);
        console.log(`   👥 Personnel: ${fs.existsSync(staffXml) ? '✓' : '✗'} ${staffXml}`);

        const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });

        // Ensure tenant exists with full config
        let tenant = await strapi.db.query('api::tenant.tenant').findOne({ where: { slug: tenantSlug } });
        if (!tenant) {
            tenant = await strapi.db.query('api::tenant.tenant').create({
                data: {
                    slug: config.slug || tenantSlug,
                    name: config.name || tenantSlug,
                    displayName: config.displayName || tenantSlug,
                    subdomain: config.subdomain || tenantSlug,
                    isActive: true,
                    settings: config.settings || {},
                }
            });
            console.log(`   ✓ Created tenant: ${config.displayName || tenantSlug}`);
        }
        global.currentTenant = tenant;

        await seedAdmin();
        await seedAppUser(authenticatedRole);
        await setPublicPermissions(app);
        await seedContent(app);
        await seedStudents(studentXml, authenticatedRole);
        await seedPersonnel(staffXml, authenticatedRole);
        await seedHero(heroImages);
        await seedGallery(app);
        await seedApiToken(app);

        console.log(`\n✅ Seeding complete for: ${config.displayName || tenantSlug}`);

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
