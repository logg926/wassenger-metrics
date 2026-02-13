const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const token = process.env.WASSENGER_TOKEN;

// Staff IDs to kick
const staffToKick = [
    '85297936462@c.us', // Gavin
    '85256871019@c.us'  // Log G
];

async function cleanupGroups() {
    if (!token) return console.error("No token.");

    const content = fs.readFileSync('internal_only_groups.csv', 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    const groups = [];

    // Parse CSV
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        const match = row.match(/^([^,]+),"(.*)"$/);
        if (match) {
            groups.push({ id: match[1], name: match[2] });
        } else {
            const parts = row.split(',');
            if (parts.length >= 2) groups.push({ id: parts[0], name: parts[1].replace(/"/g, '') });
        }
    }

    console.log(`Starting cleanup for ${groups.length} groups...`);
    
    // Get Device ID
    const devices = await axios.get('https://api.wassenger.com/v1/devices', { headers: { Token: token } });
    const deviceId = devices.data[0].id;

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        console.log(`\n[${i+1}/${groups.length}] Processing "${group.name}" (${group.id})...`);

        // 1. Kick Staff members
        try {
            process.stdout.write(`  - Kicking staff members... `);
            await axios.delete(`https://api.wassenger.com/v1/devices/${deviceId}/groups/${group.id}/participants`, {
                headers: { Token: token },
                data: staffToKick
            });
            console.log("✅");
        } catch (e) {
            if (e.response && (e.response.status === 404 || e.response.status === 400)) {
                console.log("Skipped (Not in group/Already kicked)");
            } else {
                console.log(`❌ Kick Failed: ${e.response?.data?.message || e.message}`);
            }
        }
        
        await new Promise(r => setTimeout(r, 500));

        // 2. Leave and Remove Group (Correct endpoint from spec)
        try {
            process.stdout.write(`  - Leaving and removing group... `);
            // Path: /v1/devices/{deviceId}/groups
            // Method: DELETE
            // Body: { id: "...", remove: true }
            await axios.delete(`https://api.wassenger.com/v1/devices/${deviceId}/groups`, {
                headers: { Token: token, 'Content-Type': 'application/json' },
                data: { id: group.id, remove: true }
            });
            console.log("✅ DONE");
        } catch (e) {
            if (e.response && (e.response.status === 404 || e.response.status === 400)) {
                 console.log("✅ (Already left/removed)");
            } else {
                 console.log(`❌ Leave Failed: ${e.response?.data?.message || e.message}`);
                 if (e.response?.status === 503) console.log("    (WhatsApp session offline?)");
            }
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\nCleanup Complete.");
}

cleanupGroups();
