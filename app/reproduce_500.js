const { Pool } = require('pg');
const axios = require('axios');
// require('dotenv').config({ path: '../app/.env' });

const WASSENGER_TOKEN = process.env.WASSENGER_TOKEN;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const getCategory = (dateObj) => {
    const day = dateObj.getDay();
    const hour = dateObj.getHours();
    if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) return 'OFFICE';
    if (day === 0 || day === 6) return 'WEEKEND';
    return 'WEEKNIGHT';
};

const calculatePerformance = (messages) => {
    const chats = {};
    messages.forEach(m => {
        const chatId = m.chat || m.wid;
        if (!chats[chatId]) chats[chatId] = [];
        chats[chatId].push(m);
    });

    const performanceData = [];
    Object.keys(chats).forEach(chatId => {
        const sortedMsgs = chats[chatId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let firstInboundTime = null;

        for (const msg of sortedMsgs) {
            const msgDirection = msg.flow || msg.direction || (msg.fromMe ? 'out' : 'in');
            if (msgDirection === 'in' || msgDirection === 'inbound') {
                if (firstInboundTime === null) {
                    firstInboundTime = new Date(msg.date).getTime();
                }
            } else if ((msgDirection === 'out' || msgDirection === 'outbound') && firstInboundTime !== null) {
                const replyTime = new Date(msg.date).getTime();
                const diffSeconds = Math.floor((replyTime - firstInboundTime) / 1000);

                if (diffSeconds >= 0) {
                    performanceData.push({
                        timestamp: replyTime,
                        seconds: diffSeconds,
                        category: getCategory(new Date(replyTime)),
                        chatId,
                        messageId: msg.id
                    });
                }
                firstInboundTime = null;
            }
        }
    });
    return performanceData;
};

async function run() {
    try {
        console.log("Fetching fresh data from Wassenger...");
        if (!WASSENGER_TOKEN) throw new Error('Wassenger API token not configured.');

        const devicesRes = await axios.get('https://api.wassenger.com/v1/devices', {
            headers: { 'Token': WASSENGER_TOKEN }
        });
        const activeDevice = devicesRes.data.find(d => d.status === 'operative');
        if (!activeDevice) throw new Error('No operative device found.');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const afterDate = sevenDaysAgo.toISOString();

        const allMessages = [];
        let page = 0, hasMore = true;

        console.log(`Looping pages (after ${afterDate})...`);
        while (allMessages.length < 2000 && hasMore) {
            process.stdout.write(`Page ${page}... `);
            const res = await axios.get(`https://api.wassenger.com/v1/chat/${activeDevice.id}/messages`, {
                headers: { 'Token': WASSENGER_TOKEN },
                params: { size: 50, page, after: afterDate }
            });
            if (res.data.length > 0) {
                allMessages.push(...res.data);
                if (res.data.length < 50) hasMore = false; else page++;
            } else hasMore = false;
        }
        console.log(`
Fetched ${allMessages.length} messages.`);

        const processedData = calculatePerformance(allMessages);
        console.log(`Processed ${processedData.length} metrics.`);

        console.log("Syncing to DB...");
        const client = await pool.connect();
        
        try {
            // 2. Sync to DB (Upsert)
            for (const item of processedData) {
                await client.query(
                    `INSERT INTO performance_metrics (timestamp, seconds, category, chat_id, message_id) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT (message_id) DO NOTHING`,
                    [item.timestamp, item.seconds, item.category, item.chatId, item.messageId]
                );
            }

            // 3. Update metadata
            const updateTime = new Date();
            await client.query(
                `INSERT INTO cache_metadata (key, last_updated, total_messages) 
                 VALUES ($1, $3, $2) 
                 ON CONFLICT (key) DO UPDATE SET last_updated = $3, total_messages = $2`,
                ['performance', allMessages.length, updateTime]
            );
            console.log("DB Sync complete.");
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) console.error("Response:", error.response.data);
    } finally {
        await pool.end();
    }
}

run();
