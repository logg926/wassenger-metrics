import { NextResponse } from 'next/server';
import axios from 'axios';
import pool, { initDb } from './db';

const WASSENGER_TOKEN = process.env.WASSENGER_TOKEN;
const EXCLUDED_CHATS = (process.env.EXCLUDED_CHATS || '').split(',').map(s => s.trim()).filter(Boolean);
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

const getCategory = (dateObj: Date) => {
    const day = dateObj.getDay();
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    
    // Office hours: Monday to Friday (1-5)
    if (day >= 1 && day <= 5) {
        const timeInMinutes = hour * 60 + minute;
        const startMinutes = 9 * 60 + 30; // 09:30
        const endMinutes = 18 * 60 + 30;  // 18:30
        
        if (timeInMinutes >= startMinutes && timeInMinutes < endMinutes) {
            return 'OFFICE';
        }
    }
    
    // Weekends: Saturday and Sunday
    if (day === 0 || day === 6) {
        return 'WEEKEND';
    }
    
    // Weeknights: Monday to Friday, outside office hours
    return 'WEEKNIGHT';
};

const calculatePerformance = (messages: any[], excludedIds: string[], chatMap: Record<string, string>) => {
    const chats: { [key: string]: any[] } = {};
    messages.forEach(m => {
        const chatId = m.chat || m.wid;
        if (!chats[chatId]) chats[chatId] = [];
        chats[chatId].push(m);
    });

    const performanceData: any[] = [];
    const pendingMessages: any[] = [];

    Object.keys(chats).forEach(chatId => {
        // Skip excluded chats (staff numbers, internal groups)
        if (excludedIds.includes(chatId)) {
            return;
        }

        const sortedMsgs = chats[chatId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let firstInboundTime: number | null = null;
        let currentInboundContactName: string | null = null; 
        let currentInboundBody: string | null = null;
        
        // Helper to get name
        const getContactName = (msg: any) => {
            const senderName = msg.meta?.notifyName || msg.from || 'Unknown';
            if (chatId.includes('@g.us')) {
                const groupName = chatMap[chatId] || 'Unknown Group';
                // Return "GroupName - SenderName"
                return `${groupName} - ${senderName}`;
            }
            return senderName;
        };

        // Check for pending reply (last message is inbound)
        const lastMsg = sortedMsgs[sortedMsgs.length - 1];
        const lastDirection = lastMsg.flow || lastMsg.direction || (lastMsg.fromMe ? 'out' : 'in');
        
        if (lastDirection === 'in' || lastDirection === 'inbound') {
            pendingMessages.push({
                messageId: lastMsg.id,
                chatId: chatId,
                timestamp: new Date(lastMsg.date).getTime(),
                body: lastMsg.body || '(No content)',
                contactName: getContactName(lastMsg)
            });
        }

        for (const msg of sortedMsgs) {
            const msgDirection = msg.flow || msg.direction || (msg.fromMe ? 'out' : 'in');
            if (msgDirection === 'in' || msgDirection === 'inbound') {
                if (firstInboundTime === null) {
                    firstInboundTime = new Date(msg.date).getTime();
                    currentInboundContactName = getContactName(msg);
                    currentInboundBody = msg.body || '(No content)';
                }
            } else if ((msgDirection === 'out' || msgDirection === 'outbound') && firstInboundTime !== null) {
                const replyTime = new Date(msg.date).getTime();
                const diffSeconds = Math.floor((replyTime - firstInboundTime) / 1000);

                if (diffSeconds >= 0) {
                    // Debug log to check body capture
                    if (!currentInboundBody) console.log('Warning: Empty body for chat', chatId);
                    
                    performanceData.push({
                        // USE INBOUND TIME for timestamp/category
                        timestamp: firstInboundTime, 
                        seconds: diffSeconds,
                        category: getCategory(new Date(firstInboundTime)), 
                        chatId,
                        messageId: msg.id,
                        contactName: currentInboundContactName,
                        body: currentInboundBody
                    });
                }
                firstInboundTime = null;
                currentInboundContactName = null;
                currentInboundBody = null;
            }
        }
    });
    return { performanceData, pendingMessages };
};

export async function GET(request: Request) {
    try {
        await initDb();
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('force') === 'true';

        // 1. Fetch exclusion list from DB
        const excludedResult = await pool.query('SELECT chat_id FROM excluded_chats');
        const excludedIds = excludedResult.rows.map(row => row.chat_id);

        // 2. Check metadata for last update
        const metaResult = await pool.query('SELECT last_updated FROM cache_metadata WHERE key = $1', ['performance']);
        const lastUpdated = metaResult.rows[0]?.last_updated;
        const now = new Date();
        const shouldFetch = forceRefresh || !lastUpdated || (now.getTime() - new Date(lastUpdated).getTime() > CACHE_DURATION_MS);

        if (shouldFetch) {
            console.log('Fetching fresh data from Wassenger and syncing to DB...');
            if (!WASSENGER_TOKEN) throw new Error('Wassenger API token not configured.');

            const devicesRes = await axios.get('https://api.wassenger.com/v1/devices', {
                headers: { 'Token': WASSENGER_TOKEN }
            });
            const activeDevice = devicesRes.data.find((d: any) => d.status === 'operative');
            if (!activeDevice) throw new Error('No operative device found.');

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const afterDate = sevenDaysAgo.toISOString();

            const allMessages: any[] = [];
            const groupIds = new Set<string>();
            let page = 0, hasMore = true;

            while (allMessages.length < 2000 && hasMore) {
                const res = await axios.get(`https://api.wassenger.com/v1/chat/${activeDevice.id}/messages`, {
                    headers: { 'Token': WASSENGER_TOKEN },
                    params: { size: 50, page, after: afterDate }
                });
                if (res.data.length > 0) {
                    const msgs = res.data;
                    allMessages.push(...msgs);
                    
                    msgs.forEach((m: any) => {
                        const chatId = m.chat || m.wid;
                        if (chatId && chatId.includes('@g.us')) {
                            groupIds.add(chatId);
                        }
                    });

                    if (msgs.length < 50) hasMore = false; else page++;
                } else hasMore = false;
            }

            const chatMap: Record<string, string> = {};
            if (groupIds.size > 0) {
                try {
                    const chatsRes = await axios.get(`https://api.wassenger.com/v1/chat/${activeDevice.id}/chats`, {
                        headers: { 'Token': WASSENGER_TOKEN },
                        params: { size: 100, sort: 'date:desc' } 
                    });
                    
                    chatsRes.data.forEach((c: any) => {
                        if (c.name) chatMap[c.id] = c.name;
                    });
                } catch (err) {
                    console.error('Failed to fetch chat details:', err);
                }
            }

            const { performanceData, pendingMessages } = calculatePerformance(allMessages, excludedIds, chatMap);

            // 3. Sync Performance Data to DB (Upsert)
            for (const item of performanceData) {
                await pool.query(
                    `INSERT INTO performance_metrics (timestamp, seconds, category, chat_id, message_id, contact_name, body) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) 
                     ON CONFLICT (message_id) DO UPDATE SET 
                        contact_name = EXCLUDED.contact_name, 
                        body = EXCLUDED.body,
                        timestamp = EXCLUDED.timestamp,
                        category = EXCLUDED.category`,
                    [item.timestamp, item.seconds, item.category, item.chatId, item.messageId, item.contactName, item.body]
                );
            }

            // 4. Sync Pending Messages (Truncate & Insert)
            await pool.query('DELETE FROM pending_messages');
            for (const item of pendingMessages) {
                await pool.query(
                    `INSERT INTO pending_messages (message_id, chat_id, timestamp, body, contact_name) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [item.messageId, item.chatId, item.timestamp, item.body, item.contactName]
                );
            }

            // 5. Update metadata
            const updateTime = new Date();
            await pool.query(
                `INSERT INTO cache_metadata (key, last_updated, total_messages) 
                 VALUES ($1, $3, $2) 
                 ON CONFLICT (key) DO UPDATE SET last_updated = $3, total_messages = $2`,
                ['performance', allMessages.length, updateTime]
            );
        }

        // 6. Query Data for Response
        const sevenDaysAgoTs = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        let metricsQuery = 'SELECT timestamp, seconds, category, contact_name, body, chat_id FROM performance_metrics WHERE timestamp >= $1';
        let pendingQuery = 'SELECT message_id, chat_id, timestamp, body, contact_name FROM pending_messages';
        const params = [sevenDaysAgoTs];

        if (excludedIds.length > 0) {
            // Dynamically build the NOT IN clause placeholders ($2, $3, ...)
            const placeholders = excludedIds.map((_, i) => `$${i + 2}`).join(',');
            metricsQuery += ` AND chat_id NOT IN (${placeholders})`;
            
            // Pending query needs separate placeholder indices ($1, $2...)
            const pendingPlaceholders = excludedIds.map((_, i) => `$${i + 1}`).join(',');
            pendingQuery += ` WHERE chat_id NOT IN (${pendingPlaceholders})`;
            
            params.push(...excludedIds);
        }

        metricsQuery += ' ORDER BY timestamp ASC';
        pendingQuery += ' ORDER BY timestamp DESC';

        const metricsResult = await pool.query(metricsQuery, params);
        const pendingResult = await pool.query(pendingQuery, excludedIds.length > 0 ? excludedIds : []);

        return NextResponse.json({
            messages: metricsResult.rows.map(r => ({
                timestamp: Number(r.timestamp),
                seconds: r.seconds,
                category: r.category,
                contactName: r.contact_name,
                body: r.body,
                chatId: r.chat_id
            })),
            pending: pendingResult.rows.map(r => ({
                messageId: r.message_id,
                chatId: r.chat_id,
                timestamp: Number(r.timestamp),
                body: r.body,
                contactName: r.contact_name
            })),
            excludedChats: excludedIds,
            lastUpdated: shouldFetch ? now.toISOString() : lastUpdated
        });

    } catch (error: any) {
        console.error('API Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
