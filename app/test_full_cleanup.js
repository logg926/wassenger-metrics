const axios = require('axios');
require('dotenv').config({ path: '.env' });

const token = process.env.WASSENGER_TOKEN;
const testGroupId = '120363422580544268@g.us';
const staffToKick = ['85297936462@c.us', '85256871019@c.us'];

async function testFullCleanup() {
    if (!token) return;
    try {
        const devices = await axios.get('https://api.wassenger.com/v1/devices', { headers: { Token: token } });
        const deviceId = devices.data[0].id;

        console.log(`Starting Test Cleanup for Group: ${testGroupId}`);

        // 1. Kick Staff
        console.log("Step 1: Kicking staff...");
        try {
            await axios.delete(`https://api.wassenger.com/v1/devices/${deviceId}/groups/${testGroupId}/participants`, {
                headers: { Token: token },
                data: staffToKick
            });
            console.log("✅ Staff kicked.");
        } catch (e) {
            console.log(`ℹ️ Kick Note: ${e.response?.data?.message || e.message}`);
        }

        // 2. Leave Group (Using corrected endpoint)
        console.log("Step 2: Leaving group...");
        try {
            await axios.delete(`https://api.wassenger.com/v1/devices/${deviceId}/groups`, {
                headers: { Token: token },
                data: { id: testGroupId, remove: true }
            });
            console.log("✅ Left group successfully.");
        } catch (e) {
            console.log(`❌ Leave Failed: ${e.response?.data?.message || e.message}`);
            return; // Stop verification if leave failed
        }

        // 3. Verify
        console.log("Step 3: Verifying...");
        // Wait a bit for sync
        await new Promise(r => setTimeout(r, 2000));
        
        try {
            await axios.get(`https://api.wassenger.com/v1/chat/${deviceId}/chats/${testGroupId}`, {
                headers: { Token: token }
            });
            console.log("❌ FAILED: Device can still see the group! (Sync lag or leave failed)");
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log(`✅ VERIFIED: Group not found (404). Cleanup SUCCESS!`);
            } else {
                console.log(`⚠️ Unexpected verify error: ${e.message}`);
            }
        }

    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testFullCleanup();
