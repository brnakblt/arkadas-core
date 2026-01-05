const fetch = require('node-fetch'); // Requires node-fetch or native fetch in Node 18+

const API_URL = process.env.API_URL || 'http://localhost:1337';
const TOKEN = process.env.API_TOKEN || '';

async function checkHealth() {
    try {
        const headers = TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};

        console.log(`\n🔍 Checking System Health at ${API_URL}...`);
        const start = Date.now();
        const res = await fetch(`${API_URL}/api/system-monitor/health`, { headers });
        const latency = Date.now() - start;

        if (res.ok) {
            const data = await res.json();
            console.log(`\n✅ API Online (${latency}ms)`);
            console.log(`   Database: ${data.database === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}`);
            console.log(`   Redis:    ${data.redis === 'connected' ? '🟢 Connected' : '⚪ ' + data.redis}`);
            console.log(`   Uptime:   ${(data.uptime / 3600).toFixed(2)} hours`);
        } else {
            console.log(`\n❌ API Error: ${res.status} ${res.statusText}`);
        }
    } catch (e) {
        console.log(`\n❌ Connection Failed: ${e.message}`);
    }
}

async function checkStats() {
    try {
        const headers = TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};

        const res = await fetch(`${API_URL}/api/system-monitor/stats`, { headers });

        if (res.ok) {
            const data = await res.json();
            console.log(`\n📊 System Resources:`);
            console.log(`   CPU:    ${data.cpu.load}% Load (${data.cpu.cores} Cores)`);
            const usedMemGB = (data.memory.used / 1024 / 1024 / 1024).toFixed(1);
            const totalMemGB = (data.memory.total / 1024 / 1024 / 1024).toFixed(1);
            console.log(`   Memory: ${usedMemGB} GB / ${totalMemGB} GB Used`);

            console.log(`\n💾 Disk Usage:`);
            data.disk.filter(d => d.size > 0).forEach(d => {
                console.log(`   ${d.mount}: ${d.use}% (${(d.used / 1024 / 1024 / 1024).toFixed(1)} GB used)`);
            });
        }
    } catch (e) {
        // Silent failure for stats if health failed
    }
}

(async () => {
    await checkHealth();
    await checkStats();
    console.log('\n');
})();
