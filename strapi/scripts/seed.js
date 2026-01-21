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

    // Dynamic Header detection
    let headerRow = [];
    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const rowData = getRowData(rows[i]);
        if (rowData.some(c => c && c.toString().includes('ÖĞRENCİ NO')) && rowData.some(c => c && c.toString().includes('KİMLİK'))) {
            dataStartIndex = i + 1;
            headerRow = rowData;
            break;
        }
    }
    if (dataStartIndex === 0) return console.error('❌ Student Header not found');

    const idxStudentNo = headerRow.findIndex(c => c && c.includes('ÖĞRENCİ NO'));
    const idxFirstName = headerRow.findIndex(c => c && c === 'ADI');
    const idxLastName = headerRow.findIndex(c => c && c === 'SOYADI'); // Exact match due to "AD SOYAD" usually being together or separate. My XML has "ADI" and "SOYADI".
    // Wait, my XML has "AD SOYAD" in one col? No, checked XML: "ADI", "SOYADI" are separate.
    // XML: SIRA, NO, AD SOYAD, ÖĞRENCİ NO, ADI, SOYADI, T.C. KİMLİK NO...

    // Safety check just in case
    const idxTCKN = headerRow.findIndex(c => c && c.includes('KİMLİK'));

    if (idxStudentNo === -1 || idxTCKN === -1) return console.error('❌ Critical student columns missing');

    const userService = strapi.plugin('users-permissions').service('user');

    for (let i = dataStartIndex; i < rows.length; i++) {
        try {
            const row = getRowData(rows[i]);
            const tckn = row[idxTCKN];
            if (!tckn) continue;

            const raw = {
                studentNo: row[idxStudentNo],
                firstName: idxFirstName !== -1 ? row[idxFirstName] : '',
                lastName: idxLastName !== -1 ? row[idxLastName] : '',
                tckn: tckn,
                gender: row[headerRow.findIndex(c => c === 'CİNSİYETİ')] || '',
                disabilityType: row[headerRow.findIndex(c => c === 'TANI')] || '',
                bloodType: row[headerRow.findIndex(c => c === 'KAN GRUBU')] || '',
                dob: row[headerRow.findIndex(c => c.includes('DOĞUM'))] || '',
                phone: row[headerRow.findIndex(c => c.includes('VELİ TEL'))] || '',
                address: row[headerRow.findIndex(c => c === 'ADRES')] || '',
            };

            // Fallback for names if split cols missing but "AD SOYAD" exists?
            // My XML has ADI and SOYADI.

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

            // Sync to V2 Student Model
            const v2Data = {
                fullName: `${raw.firstName} ${raw.lastName}`,
                tcIdentity: raw.tckn,
                birthDate: parseDate(raw.dob),
                diagnosis: raw.disabilityType,
                status: 'ACTIVE',
                studentNumber: raw.studentNo,
            };

            const existingV2 = await strapi.db.query('api::student.student').findOne({ where: { tcIdentity: raw.tckn } });
            if (existingV2) {
                await strapi.entityService.update('api::student.student', existingV2.id, { data: v2Data });
            } else {
                await strapi.entityService.create('api::student.student', { data: { ...v2Data, publishedAt: new Date() } });
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
    const allStaff = await strapi.db.query('api::personnel.personnel').findMany();
    const staffMap = {};
    allStaff.forEach(s => { if (s.fullName) staffMap[normalizeString(s.fullName)] = s; });

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

            // Map XML Title to Article 7 Enum
            const mapToArticle7Enum = (t) => {
                const lower = t.toLowerCase();
                if (lower.includes('kurum müdürü')) return 'KURUM_MUDURU';
                if (lower.includes('müdür yardımcısı')) return 'MUDUR_YARDIMCISI';
                if (lower.includes('rehber öğretmen') || lower.includes('psikolojik danışman')) return 'REHBER_OGRETMEN';
                if (lower.includes('psikolog')) return 'PSIKOLOG';
                if (lower.includes('fizyoterapist')) return 'FIZYOTERAPIST';
                if (lower.includes('odyolog') || lower.includes('işitme')) return 'ODYOLOG';
                if (lower.includes('sosyal hizmet')) return 'SOSYAL_HIZMET_UZMANI';
                if (lower.includes('ergo')) return 'ERGO_TERAPIST';
                if (lower.includes('çocuk gelişim')) return 'COCUK_GELISIM_UZMANI';
                if (lower.includes('öğretmen')) return 'OZEL_EGITIM_OGRETMENI';
                return 'DIGER_PERSONEL';
            };

            const personnelTitle = mapToArticle7Enum(title);

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

            // 2. Removed TeamMember (Deprecated)
            // Was: api::team-member.team-member


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

            // Sync to V2 Personnel Model
            const v2StaffData = {
                fullName: fullName,
                specialty: formattedTitle,
                title: personnelTitle,
                status: 'ACTIVE',
                email: `${empNo || tckn}@arkadas.com.tr`,
                phone: null, // Not in XML usually, or parse if available
                performanceScore: 100,
            };
            if (imageId) v2StaffData.avatarUrl = `/uploads/${availableImages.find(f => f.startsWith(targetUsername))}`; // Simplistic URL assumption or fetch properly

            const existingV2Staff = await strapi.db.query('api::personnel.personnel').findOne({ where: { email: v2StaffData.email } });
            if (existingV2Staff) {
                await strapi.entityService.update('api::personnel.personnel', existingV2Staff.id, { data: v2StaffData });
            } else {
                await strapi.entityService.create('api::personnel.personnel', { data: { ...v2StaffData, publishedAt: new Date() } });
            }

        } catch (e) {
            console.error(`Error processing staff row ${i}:`, e.message);
        }
    }
}

async function seedHero(imagesPath) {
    console.log('🚀 Seeding Hero...');

    // Check images
    let uploadedIds = [];
    const imagesDir = path.resolve(imagesPath);
    if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
        console.log(`   Found ${files.length} images to sync.`);
        for (const f of files) {
            try {
                const up = await manualUpload(path.join(imagesDir, f));
                if (up) uploadedIds.push(up.id);
            } catch (e) {
                console.error(`   Failed to upload ${f}:`, e.message);
            }
        }
    } else {
        console.log('   Note: Hero images directory not found, skipping image upload.');
    }

    let hero = await strapi.entityService.findMany('api::hero.hero', { populate: ['images'] });

    const heroData = {
        title: 'Arkadaş Özel Eğitim',
        subtitle: 'Sevgi ve İlgiyle...',
        description: 'Özel çocuklarımız için özel bir dünya.',
        images: uploadedIds.length > 0 ? uploadedIds : (hero?.images?.map(i => i.id) || []), // Keep existing or use new
        stats: [
            { label: 'Öğrenci', value: '500+' },
            { label: 'Uzman', value: '50+' },
            { label: 'Yıl Deneyim', value: '10+' },
        ],
        publishedAt: new Date(),
    };

    if (hero) {
        await strapi.entityService.update('api::hero.hero', hero.id, { data: heroData });
        console.log('   ~ Hero updated.');
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
            // Update password to match Strapi Admin if already exists
            await strapi.plugin('users-permissions').service('user').edit(user.id, {
                password
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
    ];
    for (const action of permissions) {
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: authRole.id } });
        if (!existing) await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: authRole.id } });
    }
    console.log('   Authenticated permissions set.');
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
        // Migration: Simplified path, assuming data was moved or sticking to default
        // Checking paths relative to script location: strapi/scripts/../.. -> root
        const rootDataPath = path.resolve(__dirname, '../../data');

        // Use 'tenants/arkadas' as legacy data source if it exists, otherwise root
        // For now, let's assume the folder structure remained but we ignore the "tenant" model concept.
        let dataPath = path.join(rootDataPath, 'tenants/arkadas');
        if (!fs.existsSync(dataPath)) {
            dataPath = rootDataPath; // Fallback to root data if flattened
        }

        console.log(`\n🏢 Seeding data from: ${dataPath}`);

        // Default paths
        const studentXml = path.join(dataPath, 'seed/ogrencilistesi.xml');
        const staffXml = path.join(dataPath, 'seed/personellistesi.xml');
        const heroImages = path.join(dataPath, 'assets/hero/');
        const teamMemberImages = path.join(dataPath, 'assets/team/');

        console.log(`   📋 Students: ${fs.existsSync(studentXml) ? '✓' : '✗'} ${studentXml}`);
        console.log(`   👥 Personnel: ${fs.existsSync(staffXml) ? '✓' : '✗'} ${staffXml}`);

        const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });

        // Initialize SFTPGo Service
        const sftpGoService = new SftpGoService(
            'http://localhost:8088',
            'admin',
            process.env.SFTPGO_ADMIN_PASSWORD || process.env.STRAPI_ADMIN_PASSWORD || 'Strapi123!'
        );
        console.log('\n🔄 Initializing SFTPGo Sync...');
        if (await sftpGoService.authenticate()) {
            console.log('   ✓ SFTPGo Connected');
            await sftpGoService.createGroup('students', 'All Students');
            await sftpGoService.createGroup('teachers', 'All Staff Members');
            await sftpGoService.createGroup('admins', 'System Administrators');
        } else {
            console.log('   ⚠️ SFTPGo Connection Failed - specific users won\'t be synced.');
        }

        await seedAdmin(sftpGoService);
        await seedAppUser(authenticatedRole, sftpGoService);
        await setPublicPermissions(app);
        await setAuthenticatedPermissions(app);
        await seedContent(app);
        await seedStudents(studentXml, authenticatedRole, sftpGoService);
        await seedPersonnel(staffXml, authenticatedRole, teamMemberImages, sftpGoService);
        await seedHero(heroImages);
        await seedGallery(app);
        await seedApiToken(app);

        console.log(`\n✅ Seeding complete.`);

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
