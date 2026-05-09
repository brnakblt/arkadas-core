const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL || 'http://localhost:8088';
const ADMIN_USER = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.NEXTCLOUD_ADMIN_PASSWORD;

async function verify() {
    console.log(`Verifying Nextcloud at ${NEXTCLOUD_URL}...`);
    const auth = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
    
    try {
        const response = await fetch(`${NEXTCLOUD_URL}/ocs/v1.php/cloud/users/${ADMIN_USER}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'OCS-APIRequest': 'true',
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Nextcloud API is accessible!');
            console.log('Admin User Info:', JSON.stringify(data.ocs.data, null, 2));
        } else {
            const text = await response.text();
            console.error(`❌ Nextcloud API error (${response.status}): ${text}`);
        }
    } catch (error) {
        console.error('❌ Failed to connect to Nextcloud:', error.message);
    }
}

verify();
