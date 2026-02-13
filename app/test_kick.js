const axios = require('axios');
require('dotenv').config({ path: '.env' });

const token = process.env.WASSENGER_TOKEN;
const groupId = '120363422580544268@g.us';
const participantId = '85297936462@c.us';

async function testKick() {
    if (!token) return;
    const devices = await axios.get('https://api.wassenger.com/v1/devices', { headers: { Token: token } });
    const deviceId = devices.data[0].id;

    console.log(`Kicking ${participantId} from ${groupId}...`);

    // Strategy 7: New discovered path from specification
    // Path: /v1/devices/{deviceId}/groups/{groupId}/participants
    // Body: ["+phone_or_id"]
    try {
        console.log("Strategy 7: DELETE /v1/devices/{deviceId}/groups/{groupId}/participants");
        const res = await axios.delete(`https://api.wassenger.com/v1/devices/${deviceId}/groups/${groupId}/participants`, {
            headers: { Token: token },
            data: [participantId] // Body is an array of IDs
        });
        console.log("✅ Success (Strategy 7):", res.status);
    } catch (e) {
        console.log(`❌ Strategy 7 Failed: ${e.response?.status} - ${e.response?.data?.message}`);
        if (e.response) console.log("Response Data:", e.response.data);
    }
}

testKick();
