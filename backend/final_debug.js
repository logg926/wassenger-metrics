const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');

async function debug() {
    const token = process.env.WASSENGER_TOKEN;
    const headers = { 'Token': token };
    const deviceId = '691aeb1dc2ec875f268bf342';

    console.log('--- Platform Enterprise Forced Sync Discovery ---');

    // 我們對 Standard /v1/messages 測試不同的隱藏參數
    const scenarios = [
        { name: 'Default', params: { device: deviceId, limit: 100 } },
        { name: 'Force Sync', params: { device: deviceId, sync: true, limit: 100 } },
        { name: 'Source Chat', params: { device: deviceId, source: 'chat', limit: 100 } },
        { name: 'Flow Inbound', params: { device: deviceId, flow: 'inbound', limit: 100 } }
    ];

    for (const sc of scenarios) {
        try {
            const res = await axios.get('https://api.wassenger.com/v1/messages', { headers, params: sc.params });
            const inbound = res.data.filter(m => m.flow === 'inbound' || m.fromMe === false);
            console.log(`✅ Scenario [${sc.name}]: Success (${res.data.length} total, ${inbound.length} inbound)`);
            if (inbound.length > 0) {
                console.log(`   Sample Inbound: ${inbound[0].body || inbound[0].message}`);
            }
        } catch (e) {
            console.log(`❌ Scenario [${sc.name}]: Failed (${e.response ? e.response.status : e.message})`);
        }
    }
}
debug();
