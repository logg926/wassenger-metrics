const axios = require('axios');
require('dotenv').config({ path: '.env' });

const token = process.env.WASSENGER_TOKEN;
const referenceGroupName = "巫筆 Trial X 聖母玫瑰書院";

async function getInternalStaff() {
    if (!token) return console.error("No token.");

    try {
        const devices = await axios.get('https://api.wassenger.com/v1/devices', { headers: { Token: token } });
        const deviceId = devices.data[0].id;

        // 1. Find Reference Group
        console.log(`Finding reference group: "${referenceGroupName}"...`);
        let refChat = null;
        let page = 0;
        
        while (!refChat && page < 10) {
            const res = await axios.get(`https://api.wassenger.com/v1/chat/${deviceId}/chats`, {
                headers: { Token: token },
                params: { size: 100, page, sort: 'date:desc' }
            });
            refChat = res.data.find(c => c.name && c.name.includes(referenceGroupName));
            page++;
        }

        if (!refChat) return console.error("Reference group not found.");

        // 2. Get Participants
        const res = await axios.get(`https://api.wassenger.com/v1/chat/${deviceId}/chats/${refChat.id}`, {
            headers: { Token: token }
        });

        const staff = res.data.group.participants.map(p => ({
            id: p.id,
            phone: p.phone || p.id.split('@')[0],
            name: p.contact?.name || p.contact?.displayName || "Unknown"
        }));

        console.log(`
Identified ${staff.length} Internal Staff from reference group:`);
        console.table(staff);

        // 3. Save Staff List for next step
        const fs = require('fs');
        fs.writeFileSync('internal_staff.json', JSON.stringify(staff.map(s => s.id), null, 2));
        console.log("Saved staff IDs to 'internal_staff.json'");

    } catch (e) {
        console.error(e.message);
    }
}

getInternalStaff();
