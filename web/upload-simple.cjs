
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

const client = createClient(`${NEXTCLOUD_URL}/remote.php/dav/files/${NEXTCLOUD_USER}/`, {
    username: NEXTCLOUD_USER,
    password: NEXTCLOUD_PASSWORD
});

async function run() {
    try {
        await client.createDirectory("/ArkadasUsers");
    } catch (e) {}
    try {
        await client.createDirectory(`/ArkadasUsers/${NEXTCLOUD_USER}`);
    } catch (e) {}

    const buffer = Buffer.from("Test content for DOCX");
    await client.putFileContents(`/ArkadasUsers/${NEXTCLOUD_USER}/test-document.docx`, buffer);
    console.log("Uploaded test-document.docx");
}

run();
