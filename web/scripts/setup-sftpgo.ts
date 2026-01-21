/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const ADMIN_USER = process.env.SFTPGO_ADMIN_USER;
const ADMIN_PASS = process.env.SFTPGO_ADMIN_PASSWORD;
const ADMIN_API_URL = "http://localhost:8088/api/v2";

const NEW_USER = "app-user";
const NEW_PASS = "arkadas-app-pass";

async function main() {
    console.log(`Setting up SFTPGo User: ${NEW_USER}...`);

    const auth = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');

    try {
        // 1. Get Token
        const tokenRes = await fetch(`${ADMIN_API_URL}/token`, {
            headers: { "Authorization": `Basic ${auth}` }
        });

        if (!tokenRes.ok) {
            console.error("Admin Auth Failed");
            return;
        }

        const { access_token } = await tokenRes.json();

        // 2. Create User
        // Check if exists first? API returns error if exists usually.
        const userPayload = {
            username: NEW_USER,
            password: NEW_PASS,
            status: 1, // 1 = Active
            home_dir: `/srv/sftpgo/data/${NEW_USER}`,
            uid: 0,
            gid: 0,
            permissions: {
                "/": ["*"]
            },
            filesystem: {
                provider: 0 // Local filesystem
            }
        };

        console.log("Creating/Updating user...");

        // Try creating
        let res = await fetch(`${ADMIN_API_URL}/users`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userPayload)
        });

        if (res.status === 409) {
            console.log("User exists, updating...");
            // For update, we might need ID or just PUT /users/username
            // SFTPGo API v2 usually supports PUT /users/{username}
            res = await fetch(`${ADMIN_API_URL}/users/${NEW_USER}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userPayload)
            });
        }

        if (res.ok) {
            console.log("User created/updated successfully!");
        } else {
            const err = await res.text();
            console.log("User action result:", res.status, err);
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
