require('dotenv').config();
const axios = require('axios');

async function diagnose() {
    const token = '4e48531faff540886888b9debb61bd28efa6907e6d8933b318520c903ac74ddaf88bfc4f5c812816';
    try {
        const response = await axios.get('https://api.wassenger.com/v1/messages', {
            headers: { 'Token': token },
            params: { limit: 50 }
        });

        const messages = response.data;
        
        const outbound = messages.find(m => m.deliveryStatus);
        const inbound = messages.find(m => !m.deliveryStatus);

        console.log('--- 傳出訊息樣例 (客服) ---');
        console.log(outbound ? { id: outbound.id, createdAt: outbound.createdAt, wid: outbound.wid, hasDeliveryStatus: !!outbound.deliveryStatus } : '找不到');

        console.log('\n--- 傳入訊息樣例 (客戶) ---');
        console.log(inbound ? { id: inbound.id, createdAt: inbound.createdAt, wid: inbound.wid, hasDeliveryStatus: !!inbound.deliveryStatus } : '找不到');

    } catch (error) {
        console.error('失敗:', error.message);
    }
}
diagnose();
