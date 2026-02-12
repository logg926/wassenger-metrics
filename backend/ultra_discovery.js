const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');

async function ultra() {
    const token = process.env.WASSENGER_TOKEN;
    const headers = { 'Token': token };
    const devId = '691aeb1dc2ec875f268bf342';

    console.log('--- Platform Enterprise Ultra Discovery ---');

    const paths = [
        `https://api.wassenger.com/v1/io/devices/${devId}/messages`,
        `https://api.wassenger.com/v1/chat/messages`,
        `https://api.wassenger.com/v1/io/messages`
    ];

    for (const p of paths) {
        try {
            console.log(`Testing: ${p}`);
            const res = await axios.get(p, { headers, params: { limit: 5 } });
            console.log(`   ✅ Success! Found ${res.data.length} items.`);
            const inbound = res.data.filter(m => m.flow === 'in' || m.flow === 'inbound' || m.fromMe === false);
            console.log(`   Inbound count: ${inbound.length}`);
        } catch (e) {
            console.log(`   ❌ Failed: ${e.response ? e.response.status : e.message}`);
        }
    }
}
ultra();
