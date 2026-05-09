const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL || 'http://localhost:8088';
const NEXTCLOUD_ADMIN_USER = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
const NEXTCLOUD_ADMIN_PASSWORD = process.env.NEXTCLOUD_ADMIN_PASSWORD;

async function verify() {
    console.log('--- User Provisioning Verification (Public) ---');
    
    // 1. Create Personnel Record (Public Create enabled for testing)
    const testTCKN = '999' + Math.floor(Math.random() * 100000000);
    console.log(`Creating test personnel with TCKN: ${testTCKN}...`);
    const createRes = await fetch(`${STRAPI_URL}/api/personnels`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: {
                fullName: 'Sync Test Teacher',
                tcIdentity: testTCKN,
                email: `sync-test-${testTCKN}@arkadas.com.tr`,
                status: 'ACTIVE'
            }
        })
    });

    if (!createRes.ok) {
        const err = await createRes.text();
        console.error(`❌ Strapi Personnel Creation Failed (${createRes.status}): ${err}`);
        return;
    }
    console.log('✅ Strapi Personnel Created');

    // 2. Verify in Nextcloud
    console.log(`Verifying user ${testTCKN} in Nextcloud...`);
    const auth = Buffer.from(`${NEXTCLOUD_ADMIN_USER}:${NEXTCLOUD_ADMIN_PASSWORD}`).toString('base64');
    
    // Wait a bit for the async hook to finish (though Strapi hooks are usually sync unless specified)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const ncRes = await fetch(`${NEXTCLOUD_URL}/ocs/v1.php/cloud/users/${testTCKN}`, {
        headers: {
            'Authorization': `Basic ${auth}`,
            'OCS-APIRequest': 'true',
            'Accept': 'application/json'
        }
    });

    if (ncRes.ok) {
        const ncData = await ncRes.json();
        console.log('✅ Nextcloud User Verified!');
        console.log('User ID:', ncData.ocs.data.id);
        console.log('Groups:', ncData.ocs.data.groups);
    } else {
        const text = await ncRes.text();
        console.error(`❌ Nextcloud User Not Found (${ncRes.status}): ${text}`);
    }
}

verify();
