
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { createStrapi } = require('@strapi/strapi');

const STUDENT_FILE = '../../web/public/files/ogrencilistesi.xls';
const PERSONNEL_FILE = '../../web/public/files/personellistesi.xls';

function parseHtmlXls(filePath, headerRowIndex = 1) {
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const table = dom.window.document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tr'));

    if (rows.length <= headerRowIndex) return [];

    const headers = Array.from(rows[headerRowIndex].querySelectorAll('td')).map(td => td.textContent.trim());
    const data = [];

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td'));
        if (cells.length === 0) continue;

        const rowObj = {};
        cells.forEach((cell, index) => {
            if (headers[index]) {
                rowObj[headers[index]] = cell.textContent.trim();
            }
        });
        if (Object.keys(rowObj).length > 0 && rowObj[headers[0]]) {
            data.push(rowObj);
        }
    }
    return data;
}

function normalizeDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
}

function cleanTurkishChars(text) {
    const map = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
        'Ç': 'C', 'Ğ': 'G', 'I': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
    };
    return text.replace(/[çğıİöşüÇĞIÖŞÜ]/g, (match) => map[match] || match);
}

// Improved Uniqueness Check: Check Username AND Email
async function findUniqueUsername(baseUsername, domain, existingUserId = null) {
    let username = baseUsername;
    let counter = 0;

    while (true) {
        const email = `${username}@${domain}`;

        // Find ANY user colliding on username or email
        const users = await strapi.db.query('plugin::users-permissions.user').findMany({
            where: {
                $or: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        // Check if collision is someone ELSE
        const collision = users.find(u => u.id !== existingUserId); // strict inequality for ID? ID is usually int.

        if (!collision) return username;

        counter++;
        username = `${baseUsername}${counter}`;
    }
}

async function seed() {
    const app = await createStrapi({ distDir: './dist' }).load();

    try {
        console.log('--- Starting Seed (Final Robust) ---');

        let targetTenant = await strapi.db.query('api::tenant.tenant').findOne({
            where: { name: 'Arkadas' }
        });

        if (!targetTenant) {
            console.log('Creating Arkadas tenant...');
            targetTenant = await strapi.entityService.create('api::tenant.tenant', {
                data: { name: 'Arkadas', domain: 'arkadas.arkadasozelegitim.com.tr' }
            });
        }

        // Cleanup old tenant
        const oldTenant = await strapi.db.query('api::tenant.tenant').findOne({
            where: { name: 'Merkez Okul' }
        });
        if (oldTenant) {
            await strapi.entityService.delete('api::tenant.tenant', oldTenant.id);
        }

        // Get Authenticated Role
        const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
            where: { type: 'authenticated' }
        });
        console.log(`Using Role: ${authenticatedRole.name} (ID: ${authenticatedRole.id})`);

        console.log(`Using Tenant: ${targetTenant.name} (ID: ${targetTenant.id})`);

        // PERSONNEL
        console.log('\nProcessing Personnel...');
        const personnelData = parseHtmlXls(path.join(__dirname, PERSONNEL_FILE));

        for (const p of personnelData) {
            try {
                const firstName = p['ADI'];
                const lastName = p['SOYADI'];
                const employeeNo = p['PERSONEL NO'];
                const tc = p['T.C. KİMLİK NO'];

                if (!firstName || !lastName || !employeeNo) continue;

                const fullName = `${firstName} ${lastName}`;
                const cleanName = cleanTurkishChars(firstName + lastName).toLowerCase().replace(/\s/g, '');

                // Lookup
                let user = null;
                const existingProfile = await strapi.db.query('api::teacher-profile.teacher-profile').findOne({
                    where: { employeeNumber: employeeNo },
                    populate: ['user']
                });

                if (existingProfile && existingProfile.user) {
                    user = existingProfile.user;
                } else {
                    const cleanNameOld = cleanTurkishChars(firstName + lastName + employeeNo).toLowerCase().replace(/\s/g, '');
                    const oldEmail = `${cleanNameOld}@arkadas.com`;
                    const baseEmailCheck = `${cleanName}@arkadas.com`;

                    user = await strapi.db.query('plugin::users-permissions.user').findOne({
                        where: {
                            $or: [
                                { email: oldEmail },
                                { email: baseEmailCheck }
                            ]
                        }
                    });
                }

                const finalUsername = await findUniqueUsername(cleanName, 'arkadas.com', user ? user.id : null);
                const finalEmail = `${finalUsername}@arkadas.com`;
                const password = tc ? String(tc).trim() : 'password123';

                if (user) {
                    // Update
                    await strapi.entityService.update('plugin::users-permissions.user', user.id, {
                        data: {
                            username: finalUsername,
                            email: finalEmail,
                            password: password,
                            provider: 'local',
                            role: authenticatedRole.id,
                            tenant: targetTenant.id
                        }
                    });
                    if (existingProfile) {
                        await strapi.entityService.update('api::teacher-profile.teacher-profile', existingProfile.id, {
                            data: { tenant: targetTenant.id }
                        });
                    }
                    console.log(`Updated Personnel: ${fullName} -> ${finalUsername}`);
                } else {
                    // Create
                    user = await strapi.entityService.create('plugin::users-permissions.user', {
                        data: {
                            username: finalUsername,
                            email: finalEmail,
                            password: password,
                            confirmed: true,
                            blocked: false,
                            provider: 'local',
                            role: authenticatedRole.id,
                            userType: 'teacher',
                            tenant: targetTenant.id
                        }
                    });

                    if (!existingProfile) {
                        await strapi.entityService.create('api::teacher-profile.teacher-profile', {
                            data: {
                                employeeNumber: employeeNo,
                                specialization: p['ÜNVANI'] || 'General',
                                department: p['GÖREVİ'] || 'Education',
                                hireDate: normalizeDate(p['KAYIT TARİHİ']),
                                user: user.id,
                                tenant: targetTenant.id
                            }
                        });
                    }
                    console.log(`Created Personnel: ${fullName} -> ${finalUsername}`);
                }
            } catch (err) {
                console.error(`Error processing personnel ${p['ADI']} ${p['SOYADI']}:`, err.message);
            }
        }

        // STUDENTS
        console.log('\nProcessing Students...');
        const studentData = parseHtmlXls(path.join(__dirname, STUDENT_FILE), 2);

        for (const s of studentData) {
            try {
                const firstName = s['ADI'];
                const lastName = s['SOYADI'];
                const studentNo = s['ÖĞRENCİ NO'];
                const tc = s['T.C. KİMLİK NO'];

                if (!firstName || !lastName || !studentNo) continue;

                const fullName = `${firstName} ${lastName}`;
                const cleanName = cleanTurkishChars(firstName + lastName).toLowerCase().replace(/\s/g, '');

                // Lookup
                let user = null;
                const existingProfile = await strapi.db.query('api::student-profile.student-profile').findOne({
                    where: { studentNumber: studentNo },
                    populate: ['user']
                });

                if (existingProfile && existingProfile.user) {
                    user = existingProfile.user;
                } else {
                    const cleanNameOld = cleanTurkishChars(firstName + lastName + studentNo).toLowerCase().replace(/\s/g, '');
                    const oldEmail = `${cleanNameOld}@student.arkadas.com`;
                    const baseEmailCheck = `${cleanName}@student.arkadas.com`;

                    user = await strapi.db.query('plugin::users-permissions.user').findOne({
                        where: {
                            $or: [
                                { email: oldEmail },
                                { email: baseEmailCheck }
                            ]
                        }
                    });
                }

                const finalUsername = await findUniqueUsername(cleanName, 'student.arkadas.com', user ? user.id : null);
                const finalEmail = `${finalUsername}@student.arkadas.com`;
                const password = tc ? String(tc).trim() : 'password123';

                if (user) {
                    await strapi.entityService.update('plugin::users-permissions.user', user.id, {
                        data: {
                            username: finalUsername,
                            email: finalEmail,
                            password: password,
                            provider: 'local',
                            role: authenticatedRole.id,
                            tenant: targetTenant.id
                        }
                    });
                    console.log(`Updating existing student tenant: ${finalEmail}`);
                    await strapi.entityService.update('plugin::users-permissions.user', user.id, {
                        data: {
                            tenant: targetTenant.id,
                            provider: 'local',
                            role: authenticatedRole.id
                        }
                    });
                    if (existingProfile) {
                        await strapi.entityService.update('api::student-profile.student-profile', existingProfile.id, {
                            data: { tenant: targetTenant.id }
                        });
                    }
                    console.log(`Updated Student: ${fullName} -> ${finalUsername}`);
                } else {
                    // Create User (Student)
                    user = await strapi.entityService.create('plugin::users-permissions.user', {
                        data: {
                            username: finalUsername,
                            email: finalEmail,
                            password: password,
                            confirmed: true,
                            provider: 'local',
                            role: authenticatedRole.id,
                            userType: 'parent', // FALLBACK
                            tenant: targetTenant.id
                        }
                    });

                    if (!existingProfile) {
                        await strapi.entityService.create('api::student-profile.student-profile', {
                            data: {
                                studentNumber: studentNo,
                                dateOfBirth: normalizeDate(s['DOĞUM TARİHİ']),
                                gender: s['CİNSİYETİ'] === 'Erkek' ? 'male' : (s['CİNSİYETİ'] === 'Kız' ? 'female' : 'other'),
                                enrollmentDate: normalizeDate(s['KAYIT TARİHİ']),
                                user: user.id,
                                tenant: targetTenant.id
                            }
                        });
                    }
                    console.log(`Created Student: ${fullName} -> ${finalUsername}`);
                }
            } catch (err) {
                console.error(`Error processing student ${s['ADI']} ${s['SOYADI']}:`, err.message);
            }
        }

        console.log('--- Credentials Updated (Robust) ---');

    } catch (error) {
        console.error('Seed Error:', error);
    } finally {
        app.destroy();
    }
}

seed();
