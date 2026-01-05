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

class SftpGoService {
    constructor(baseUrl, adminUser, adminPassword) {
        this.baseUrl = baseUrl;
        this.adminUser = adminUser;
        this.adminPassword = adminPassword;
        this.token = null;
    }

    async authenticate() {
        try {
            const authString = Buffer.from(`${this.adminUser}:${this.adminPassword}`).toString('base64');
            const res = await fetch(`${this.baseUrl}/api/v2/token`, {
                method: 'GET',
                headers: { 'Authorization': `Basic ${authString}` }
            });

            if (!res.ok) {
                console.error(`   SFTPGo Auth Error: ${res.status}`);
                return false;
            }

            const data = await res.json();
            this.token = data.access_token;
            return true;
        } catch (e) {
            console.error(`   SFTPGo Not Reachable: ${e.message}`);
            return false;
        }
    }

    async createGroup(name, description) {
        if (!this.token) return;

        try {
            const check = await fetch(`${this.baseUrl}/api/v2/groups/${name}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (check.ok) return; // Group exists

            const groupData = {
                name,
                description,
                permissions: {
                    "/": ["*"]
                }
            };

            const res = await fetch(`${this.baseUrl}/api/v2/groups`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupData)
            });

            if (res.ok) {
                console.log(`   + SFTPGo Group created: ${name}`);
            }
        } catch (e) {
            console.error(`   SFTPGo Group Failed (${name}):`, e.message);
        }
    }

    async createUser(username, password, email, description, group) {
        if (!this.token) return;

        // Check if user exists
        try {
            // Optimistically try create, update if fails? Or check first?
            // "check first" is safer for logs
            const check = await fetch(`${this.baseUrl}/api/v2/users/${username}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const userData = {
                username,
                password,
                email,
                status: 1,
                description,
                home_dir: `/srv/sftpgo/data/${username}`,
                permissions: {}, // Inherit from group or default
                filesystem: {
                    provider: 0 // Local
                }
            };

            if (group) {
                // SFTPGo v2 uses 'groups' array of structs
                userData.groups = [{ name: group, type: 1 }]; // 1 = Primary
            }

            const method = check.ok ? 'PUT' : 'POST';
            const url = check.ok
                ? `${this.baseUrl}/api/v2/users/${username}`
                : `${this.baseUrl}/api/v2/users`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!res.ok) {
                const txt = await res.text();
                // console.error(`   SFTPGo User Error (${username}): ${txt}`); 
            }
        } catch (e) {
            console.error(`   SFTPGo User Sync Failed (${username}):`, e.message);
        }
    }
}

async function seedStudents(xmlPath, authenticatedRole, sftpGoService) {
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

            // Sync to SFTPGo
            if (sftpGoService) {
                await sftpGoService.createUser(
                    targetUsername,
                    raw.tckn, // Password = TCKN
                    `${raw.studentNo}@arkadas.com.tr`,
                    `Student: ${row[4]} ${row[5]}`,
                    'students'
                );
            }

        } catch (err) {
            console.error(`Error processing student row ${i}:`, err);
        }
    }
}

async function seedPersonnel(xmlPath, authenticatedRole, teamImagesDir, sftpGoService) {
    console.log('🚀 Seeding Personnel from XML...');
    if (!fs.existsSync(xmlPath)) return;

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

            // Helper for Turkish Title Case
            const toTitleCase = (str) => {
                if (!str) return '';
                return str.toLocaleLowerCase('tr-TR').split(' ').map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)).join(' ');
            };

            const fullName = toTitleCase(`${name} ${last}`.trim());
            const targetUsername = generateUsername(name, last);
            const normalizedName = normalizeString(fullName);

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

            // Sync to SFTPGo
            if (sftpGoService) {
                await sftpGoService.createUser(
                    targetUsername,
                    tckn, // Password = TCKN
                    `${empNo || tckn}@arkadas.com.tr`,
                    `Staff: ${fullName}`,
                    'teachers'
                );
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

async function seedAdmin(sftpGoService) {
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

        // Sync to SFTPGo
        if (sftpGoService) {
            await sftpGoService.createUser(
                'admin',
                process.env.SFTPGO_ADMIN_PASSWORD || 'Strapi123!',
                email,
                'Super Admin User',
                'admins'
            );
        }
    } catch (error) {
        console.error('   ❌ Could not seed admin user:', error.message);
    }
}

async function seedAppUser(authenticatedRole, sftpGoService) {
    console.log('🚀 Seeding App Admin User (Frontend)...');
    try {
        const email = process.env.STRAPI_ADMIN_EMAIL || 'barannakblut@gmail.com';
        const password = process.env.STRAPI_ADMIN_PASSWORD || 'Strapi123!';

        // Derive username from email (e.g. barannakblut) or use 'admin' if preferred.
        // The user asked for "admin credentials". Using 'admin' as username is cleaner usually,
        // but let's stick to email-based or 'admin-user' to avoid confusion with Panel Admin if identifiers overlap.
        // Actually, let's use the email prefix if possible, or fallback.
        const username = email.split('@')[0];

        // Ensure we check for ANY user with this email to avoid duplicates
        const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { email }
        });

        if (!existingUser) {
            await strapi.plugin('users-permissions').service('user').add({
                username,
                email,
                password,
                role: authenticatedRole.id, // Full permissions (Authenticated)
                confirmed: true,
                provider: 'local',
            });
            console.log(`   + App User created: ${email} / ${password.substring(0, 3)}***`);
        } else {
            // Update password to match Strapi Admin to keep them in sync
            // Also ensure role is authenticated
            await strapi.plugin('users-permissions').service('user').edit(existingUser.id, {
                password,
                role: authenticatedRole.id,
                confirmed: true
            });
            console.log(`   ~ App User sync completed: ${email}`);
        }

        // Sync to SFTPGo
        if (sftpGoService) {
            await sftpGoService.createUser(
                username,
                password,
                email,
                'App Admin User',
                'admins'
            );
        }
    } catch (e) {
        console.error('   ❌ Failed to seed App User:', e.message);
    }
}

// --- Content Seeding (Service, About, FAQ, Process) ---
async function setPublicPermissions(strapi) {
    if (!global.strapi) global.strapi = strapi; // specific fix for potential global usage
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
        // System Monitor (Dev Only)
        'api::system-monitor.system-monitor.getStats',
        'api::system-monitor.system-monitor.getHealth',
    ];
    for (const action of permissions) {
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: publicRole.id } });
        if (!existing) await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: publicRole.id } });
    }
    console.log('   Public permissions set.');
}

async function setAuthenticatedPermissions(strapi) {
    console.log('🚀 Setting Authenticated Permissions...');
    const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
    const permissions = [
        'api::student-profile.student-profile.find', 'api::student-profile.student-profile.findOne',
        'api::teacher-profile.teacher-profile.find', 'api::teacher-profile.teacher-profile.findOne',
        'api::appointment.appointment.find', 'api::appointment.appointment.findOne',
        'api::attendance-log.attendance-log.find', 'api::attendance-log.attendance-log.findOne',
        'api::attendance-log.attendance-log.create',
        'api::schedule.schedule.find', 'api::schedule.schedule.findOne',
        'api::rapor.rapor.find', 'api::rapor.rapor.findOne',
        'api::fatura.fatura.find', 'api::fatura.fatura.findOne',
        'api::hero.hero.find', 'api::hero.hero.findOne',
        'api::team-member.team-member.find', 'api::team-member.team-member.findOne',

        // User & Role Management (Requested for App Admin)
        'plugin::users-permissions.user.find', 'plugin::users-permissions.user.findOne', 'plugin::users-permissions.user.create', 'plugin::users-permissions.user.update', 'plugin::users-permissions.user.destroy', 'plugin::users-permissions.user.me',
        'plugin::users-permissions.role.find', 'plugin::users-permissions.role.findOne',

        // Plan Generator Service
        'api::plan-generator.plan-generator.generateBEP', 'api::plan-generator.plan-generator.generateBOP',


        // Consistency Check
        'api::consistency-check.consistency-check.check',

        // System Monitor
        'api::system-monitor.system-monitor.getStats',
        'api::system-monitor.system-monitor.getHealth',
    ];
    for (const action of permissions) {
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: authRole.id } });
        if (!existing) await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: authRole.id } });
    }
    console.log('   Authenticated permissions set.');
}

async function seedContent(strapi) {
    console.log('🚀 Checking Static Content...');
    // About
    const aboutCount = await strapi.db.query('api::about.about').count();
    if (aboutCount === 0) {
        console.log('   + Seeding About...');
        await strapi.entityService.create('api::about.about', {
            data: {
                title: 'Hakkımızda',
                publishedAt: new Date(),
                blocks: [{ __component: 'shared.rich-text', body: `2009 yılından itibaren **İzmir'de** özel eğitim alanında öncü hizmetler sunan merkezimiz, özel gereksinimli çocukların eğitim ve rehabilitasyon süreçlerinde ailelerin en güvenilir yol arkadaşıdır.` }]
            }
        });
    }

    // Services
    const serviceCount = await strapi.db.query('api::service.service').count();
    if (serviceCount === 0) {
        console.log('   + Seeding Services...');
        const services = [
            { title: 'Dil ve Konuşma Terapisi', description: 'Dil ve konuşma bozuklukları olan çocuklar için bireysel terapi.', icon: '💬', features: [{ text: 'Artikülasyon Terapisi' }, { text: 'Dil Gelişimi' }] },
            { title: 'Özel Eğitim', description: 'Bireysel eğitim planları ve akademik destek.', icon: '🧩', features: [{ text: 'Bireysel Eğitim Planı' }] },
            { title: 'Rehabilitasyon', description: 'Fiziksel ve bilişsel rehabilitasyon.', icon: '🤸', features: [{ text: 'Fizyoterapi' }] }
        ];
        for (const s of services) await strapi.entityService.create('api::service.service', { data: { ...s, publishedAt: new Date() } });
    }

    // Processes
    const processCount = await strapi.db.query('api::process.process').count();
    if (processCount === 0) {
        console.log('   + Seeding Processes...');
        const processes = [
            { number: '01', title: 'İlk Görüşme', description: 'Tanışma ve değerlendirme.', icon: '👥' },
            { number: '02', title: 'Planlama', description: 'Bireysel eğitim planı hazırlığı.', icon: '📋' },
            { number: '03', title: 'Eğitim', description: 'Eğitim sürecinin başlaması.', icon: '🚀' },
        ];
        for (const p of processes) await strapi.entityService.create('api::process.process', { data: { ...p, publishedAt: new Date() } });
    }

    // FAQ
    const faqCount = await strapi.db.query('api::faq.faq').count();
    if (faqCount === 0) {
        console.log('   + Seeding FAQs...');
        const faqs = [
            { question: 'Hangi yaş gruplarına hizmet veriyorsunuz?', answer: '0-18 yaş arası tüm çocuklara.' },
            { question: 'Nasıl kayıt olabilirim?', answer: 'İletişim sayfamızdan veya telefonla randevu alabilirsiniz.' }
        ];
        for (const f of faqs) await strapi.entityService.create('api::faq.faq', { data: { ...f, publishedAt: new Date() } });
    }
}

async function seedGallery(strapi) {
    console.log('🚀 Checking Gallery...');
    const galleryCount = await strapi.db.query('api::gallery.gallery').count();

    if (galleryCount > 0) return;

    console.log('   + Seeding Gallery...');
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
    } catch (e) {
        console.error('   ❌ Failed to seed Gallery:', e.message);
    }
}


async function seedApiToken(strapi) {
    console.log('🚀 Checking API Token...');
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
    }

    // Sync to Infisical (always try to sync to ensure dev environment is consistent)
    if (accessToken) {
        try {
            const { execSync } = require('child_process');
            // Check if infisical is available to avoid error logs in environments without it
            try {
                execSync('which infisical', { stdio: 'ignore' });
            } catch {
                return;
            }

            // console.log('   Syncing token to Infisical...');
            const paths = ['/', '/ai-service', '/mebbis-service'];
            for (const p of paths) {
                execSync(`infisical secrets set --env dev --path "${p}" STRAPI_API_TOKEN="${accessToken}"`, { stdio: 'ignore' });
            }
        } catch (e) {
            // console.error('   ❌ Failed to sync token to Infisical:', e.message);
        }
    }
}

module.exports = async function seedAll(strapi) {
    // Set global strapi for helper functions that might rely on it (legacy support)
    global.strapi = strapi;

    try {
        // Tenant slug from env or default
        const tenantSlug = process.env.DEFAULT_TENANT || 'arkadas';
        const tenantDataPath = path.resolve(__dirname, `../../../data/tenants/${tenantSlug}`);
        const configPath = path.join(tenantDataPath, 'config.json');

        // Load tenant config
        if (!fs.existsSync(configPath)) {
            // Be silent if no config found, maybe not a tenant setup
            return;
        }
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        console.log(`\n🏢 Bootstrap Seeding for tenant: ${config.displayName || tenantSlug}`);

        // Resolve paths from config
        const studentXml = path.join(tenantDataPath, config.seed?.students || 'seed/ogrencilistesi.xml');
        const staffXml = path.join(tenantDataPath, config.seed?.personnelXml || config.seed?.personnel || 'seed/personellistesi.xml');
        const heroImages = path.join(tenantDataPath, config.seed?.heroImages || 'assets/hero/');
        const teamMemberImages = path.join(tenantDataPath, config.seed?.teamPhotos || 'assets/team/');

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

        // Initialize SFTPGo Service
        const sftpGoService = new SftpGoService(
            'http://localhost:8088',
            'admin',
            process.env.SFTPGO_ADMIN_PASSWORD || process.env.STRAPI_ADMIN_PASSWORD || 'Strapi123!'
        );

        // Optimistic auth check - silent failure usually okay for dev loop unless verbose
        if (await sftpGoService.authenticate()) {
            await sftpGoService.createGroup('students', 'All Students');
            await sftpGoService.createGroup('teachers', 'All Staff Members');
            await sftpGoService.createGroup('admins', 'System Administrators');
        }

        await seedAdmin(sftpGoService);
        await seedAppUser(authenticatedRole, sftpGoService);
        await setPublicPermissions(strapi);
        await setAuthenticatedPermissions(strapi);
        await seedContent(strapi);
        await seedStudents(studentXml, authenticatedRole, sftpGoService);
        await seedPersonnel(staffXml, authenticatedRole, teamMemberImages, sftpGoService);
        await seedHero(heroImages);
        await seedGallery(strapi);
        await seedApiToken(strapi);

        console.log(`✅ Seeding check complete.`);

    } catch (err) {
        console.error("Seeding Error:", err);
    }
};
