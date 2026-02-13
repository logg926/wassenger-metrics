const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const token = process.env.WASSENGER_TOKEN;
const staffIds = new Set(JSON.parse(fs.readFileSync('internal_staff.json')));

async function scanGroups() {
    if (!token) return;

    // Load target groups (missing in supabase)
    const content = fs.readFileSync('missing_in_supabase.csv', 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    const groups = [];
    
    // Parse CSV simple (ignoring header)
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        // Match group_id,"group_name" pattern
        const match = row.match(/^([^,]+),"(.*)"$/);
        if (match) {
            groups.push({ id: match[1], name: match[2] });
        } else {
            // Fallback for simple names
            const parts = row.split(',');
            if (parts.length >= 2) groups.push({ id: parts[0], name: parts[1].replace(/"/g, '') });
        }
    }

    console.log(`Scanning ${groups.length} groups for internal-only status...`);
    console.log(`Staff List: ${Array.from(staffIds).join(', ')}`);

    const internalOnlyGroups = [];
    try {
        const devices = await axios.get('https://api.wassenger.com/v1/devices', { headers: { Token: token } });
        const deviceId = devices.data[0].id;

        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            process.stdout.write(`[${i+1}/${groups.length}] Checking ${group.name}... `);

            try {
                const res = await axios.get(`https://api.wassenger.com/v1/chat/${deviceId}/chats/${group.id}`, {
                    headers: { Token: token }
                });

                const participants = res.data.group?.participants || [];
                if (participants.length === 0) {
                    console.log("Empty/Unknown.");
                    continue;
                }

                // Check if every participant is a known staff member
                // Note: The API response 'id' usually matches 'staffIds' (e.g. 12345@c.us)
                const isInternal = participants.every(p => staffIds.has(p.id));
                
                if (isInternal) {
                    console.log("🚨 INTERNAL ONLY");
                    internalOnlyGroups.push(group);
                } else {
                    const outsiders = participants.filter(p => !staffIds.has(p.id)).length;
                    console.log(`Has ${outsiders} externals.`);
                }

                // Small delay to be nice to API
                await new Promise(r => setTimeout(r, 100));

            } catch (e) {
                console.log("Error fetching.");
            }
        }

        console.log(`\nFound ${internalOnlyGroups.length} Internal-Only Groups.`);
        
        const csvContent = 'group_id,group_name\n' + internalOnlyGroups.map(g => `${g.id},"${g.name}"`).join('\n');
        fs.writeFileSync('internal_only_groups.csv', csvContent);
            
        console.log("Saved to 'internal_only_groups.csv'");

    } catch (e) {
        console.error("Fatal Error:", e.message);
    }
}

scanGroups();
