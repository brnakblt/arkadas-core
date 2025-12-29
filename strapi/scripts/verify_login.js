
const fetch = require('node-fetch');

async function verifyLogin() {
    const url = 'http://127.0.0.1:1337/api/auth/local';
    const body = {
        identifier: 'halilcetinkaya',
        password: '39148174052'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Login SUCCESS!');
            console.log('User:', data.user.username);
            console.log('Tenant:', data.user.tenant);

            // Check /users/me
            const meUrl = 'http://127.0.0.1:1337/api/users/me?populate=*';
            const meResponse = await fetch(meUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.jwt}`,
                    'Content-Type': 'application/json'
                }
            });

            if (meResponse.ok) {
                const meData = await meResponse.json();
                console.log('/users/me SUCCESS');
                console.log('Me Tenant:', meData.tenant);
            } else {
                console.log('/users/me FAILED');
                console.log('Status:', meResponse.status);
                const err = await meResponse.text();
                console.log('Error:', err);
            }

        } else {
            console.log('Login FAILED!');
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

verifyLogin();
