require('dotenv').config();
const axios = require('axios');

async function discover() {
    const token = process.env.WASSENGER_TOKEN;
    const headers = { 'Token': token };

    try {
        console.log('--- 1. 查找可用設備 (Devices) ---');
        const devRes = await axios.get('https://api.wassenger.com/v1/devices', { headers });
        const devices = devRes.data;
        console.log(`找到 ${devices.length} 個設備。`);

        for (const dev of devices) {
            console.log(`
設備: ${dev.alias || '未命名'} (ID: ${dev.id})`);
            console.log(`狀態: ${dev.session.status}, 方案: ${dev.billing.subscription.plan}`);

            console.log(`--- 2. 嘗試抓取該設備的 Inbound 訊息 ---`);
            const msgRes = await axios.get('https://api.wassenger.com/v1/messages', {
                headers,
                params: { device: dev.id, limit: 50 }
            });

            const msgs = msgRes.data;
            const inbound = msgs.filter(m => m.flow === 'inbound' || m.fromMe === false);
            console.log(`抓取到 ${msgs.length} 則訊息，其中 Inbound 有 ${inbound.length} 則。`);

            if (inbound.length > 0) {
                console.log('成功！發現 Inbound 訊息樣本:', inbound[0].body || inbound[0].message);
            } else {
                console.log('警告：該設備依然抓不到 Inbound 訊息。');
            }
        }

        if (devices.length === 0) {
            console.log('錯誤：帳號下找不到任何設備，請確認您的 WhatsApp 號碼已連結至 Wassenger。');
        }

    } catch (error) {
        console.error('偵測失敗:', error.response ? error.response.data : error.message);
    }
}

discover();
