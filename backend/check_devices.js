require('dotenv').config();
const axios = require('axios');
async function check() {
    const token = process.env.WASSENGER_TOKEN;
    try {
        const devicesRes = await axios.get('https://api.wassenger.com/v1/devices', { headers: { 'Token': token } });
        console.log('Devices found:', devicesRes.data.length);
        if (devicesRes.data.length > 0) {
            const devId = devicesRes.data[0].id;
            const msgsRes = await axios.get('https://api.wassenger.com/v1/messages', { 
                headers: { 'Token': token }, 
                params: { device: devId, limit: 50 } 
            });
            const msgs = msgsRes.data;
            const inbound = msgs.filter(m => m.flow === 'inbound' || (m.fromMe === false && !m.deliveryStatus));
            console.log(`Results for device ${devId}:`);
            console.log(`Total: ${msgs.length}, Inbound: ${inbound.length}`);
            if (inbound.length > 0) console.log('Inbound Sample:', inbound[0].body || inbound[0].message);
        }
    } catch (e) { console.error(e.message); }
}
check();
