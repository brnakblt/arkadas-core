const MEBBIS_URL = process.env.MEBBIS_URL || 'http://localhost:4000';

async function testSync() {
    console.log('--- MEBBIS Sync Verification ---');
    const testTCKN = '12345678901';
    
    console.log(`Requesting data for TCKN: ${testTCKN}...`);
    try {
        const response = await fetch(`${MEBBIS_URL}/api/v1/sync/pull-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tckn: testTCKN })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ MEBBIS Sync Successful!');
            console.log('Extracted Data:', JSON.stringify(result.data, null, 2));
        } else {
            console.error('❌ MEBBIS Sync Failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Failed to connect to MEBBIS service:', error.message);
    }
}

testSync();
