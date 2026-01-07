
const { createClient } = require("webdav");
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const NEXTCLOUD_URL = envConfig.NEXT_PUBLIC_NEXTCLOUD_URL || "http://localhost:8080";
const NEXTCLOUD_USER = envConfig.NEXTCLOUD_USER || "admin";
const NEXTCLOUD_PASSWORD = envConfig.NEXTCLOUD_PASSWORD || "admin";

async function getShareLink() {
    const authHeader = 'Basic ' + Buffer.from(`${NEXTCLOUD_USER}:${NEXTCLOUD_PASSWORD}`).toString('base64');
    const fullPath = `/ArkadasUsers/${NEXTCLOUD_USER}/test-document.docx`;
    
    console.log(`Creating share for ${fullPath}...`);

    const body = new URLSearchParams();
    body.append('path', fullPath);
    body.append('shareType', '3'); // 3 = Public link
    body.append('permissions', '15'); // Edit

    try {
        const response = await fetch(`${NEXTCLOUD_URL}/ocs/v1.php/apps/files_sharing/api/v1/shares?format=json`, {
            method: 'POST',
            headers: {
                'OCS-APIRequest': 'true',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': authHeader
            },
            body: body
        });

        const data = await response.json();
        if (data.ocs?.meta?.status === 'failure') {
             // Try getting existing share
             const checkRes = await fetch(`${NEXTCLOUD_URL}/ocs/v1.php/apps/files_sharing/api/v1/shares?path=${encodeURIComponent(fullPath)}&reshares=true&format=json`, {
                headers: { 'OCS-APIRequest': 'true', 'Authorization': authHeader }
            });
            const checkData = await checkRes.json();
            const existing = checkData.ocs.data.find(s => s.share_type === 3);
            if (existing) {
                console.log(existing.url);
                return;
            }
            console.error("Failed to create share:", data.ocs.meta.message);
        } else {
            console.log(data.ocs.data.url);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

getShareLink();
