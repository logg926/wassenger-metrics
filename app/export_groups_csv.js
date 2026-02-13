const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const token = process.env.WASSENGER_TOKEN;

async function exportGroups() {
    if (!token) {
        console.error("No token in .env");
        return;
    }

    try {
        const devices = await axios.get('https://api.wassenger.com/v1/devices', {
            headers: { Token: token }
        });
        const deviceId = devices.data[0].id;
        console.log("Device ID:", deviceId);

        let allGroups = [];
        let page = 0;
        let hasMore = true;

        console.log("Fetching group list...");

        while (hasMore) {
            process.stdout.write(`Fetching page ${page}... `);
            const res = await axios.get(`https://api.wassenger.com/v1/chat/${deviceId}/chats`, {
                headers: { Token: token },
                params: { size: 100, page: page, sort: 'date:desc' }
            });

            const chats = res.data;
            if (chats.length === 0) {
                hasMore = false;
                console.log("Done.");
                break;
            }

            const groups = chats.filter(c => c.id.endsWith('@g.us')).map(c => ({
                id: c.id,
                name: c.name || 'Unknown Group'
            }));

            allGroups = allGroups.concat(groups);
            console.log(`Found ${groups.length} groups.`);

            if (chats.length < 100) hasMore = false;
            else page++;
        }

        console.log(`\nTotal Groups Found: ${allGroups.length}`);

        // Write to CSV
        const csvHeader = 'group_id,group_name\n';
        const csvRows = allGroups.map(g => `${g.id},"${g.name.replace(/"/g, '""')}"`).join('\n');
        
        fs.writeFileSync('groups.csv', csvHeader + csvRows);
        console.log("✅ Successfully exported to groups.csv");

    } catch (e) {
        console.error("\nError:", e.message);
    }
}

exportGroups();
