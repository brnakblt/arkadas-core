
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const ADMIN_USER = process.env.SFTPGO_ADMIN_USER;
const ADMIN_PASS = process.env.SFTPGO_ADMIN_PASSWORD;
const ADMIN_API_URL = "http://localhost:8088/api/v2";

async function main() {
    console.log(`Checking Admin API at ${ADMIN_API_URL}...`);
    console.log(`User: ${ADMIN_USER}`);

    const auth = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');

    try {
        // Get Admin Token first? Or Basic Auth? SFTPGo Admin API supports Basic Auth.
        // Let's try getting token.
        const response = await fetch(`${ADMIN_API_URL}/token`, {
            headers: {
                "Authorization": `Basic ${auth}`
            }
        });

        if (!response.ok) {
            console.error("Failed to auth:", response.status, await response.text());
            return;
        }

        const data = await response.json();
        console.log("Admin Auth Successful!");
        console.log("Token:", data.access_token ? "Yes" : "No");

        // Now list users
        if (data.access_token) {
            const usersRes = await fetch(`${ADMIN_API_URL}/users`, {
                headers: {
                    "Authorization": `Bearer ${data.access_token}`
                }
            });
            const users = await usersRes.json();
            console.log("Users:", JSON.stringify(users, null, 2));
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
