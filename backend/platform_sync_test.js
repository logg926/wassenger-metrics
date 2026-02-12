require('dotenv').config();
const axios = require('axios');
async function syncTest() {
    const token = process.env.WASSENGER_TOKEN;
    const headers = { 'Token': token };
    const devId = '691aeb1dc2ec875f268bf342';
    console.log('--- Platform Enterprise Sync Test ---');
    try {
        const r1 = await axios.get('https://api.wassenger.com/v1/messages', { headers, params: { device: devId, limit: 100 } });
        console.log('1. Messages total:', r1.data.length);
    } catch (e) { console.log('1 failed'); }
    try {
        const r2 = await axios.get('https://api.wassenger.com/v1/messages', { headers, params: { device: devId, flow: 'inbound', limit: 50 } });
        console.log('2. Inbound total:', r2.data.length);
    } catch (e) { console.log('2 failed'); }
    try {
        const r3 = await axios.get('https://api.wassenger.com/v1/chats', { headers, params: { device: devId, limit: 10 } });
        console.log('3. Chats total:', r3.data.length);
        if (r3.data.length > 0) {
            const c = r3.data[0];
            console.log('Latest Chat:', c.name || c.wid);
            console.log('Stats:', JSON.stringify(c.stats));
        }
    } catch (e) { console.log('3 failed'); }
}
syncTest();
