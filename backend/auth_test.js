const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');

async function authTest() {
    const token = process.env.WASSENGER_TOKEN;
    const deviceId = '691aeb1dc2ec875f268bf342';

    // 測試不同的 Auth 方式
    const configs = [
        { name: 'Header: Token', headers: { 'Token': token } },
        { name: 'Header: Authorization', headers: { 'Authorization': token } },
        { name: 'Query: token', params: { token: token } }
    ];

    console.log('--- Authentication Strategy Test ---');

    for (const config of configs) {
        try {
            // 嘗試抓取對話列表，這是 Platform 方案的核心
            const res = await axios.get('https://api.wassenger.com/v1/chats', {
                ...config,
                params: { ...(config.params || {}), device: deviceId, limit: 1 }
            });
            console.log(`✅ [${config.name}] Success! Found chats.`);
            return; // 只要有一個成功就停下
        } catch (e) {
            console.log(`❌ [${config.name}] Failed: ${e.response ? e.response.status : e.message}`);
        }
    }
}
authTest();
