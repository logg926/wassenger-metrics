const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { calculatePerformance } = require('./processor');
const { saveMessage, getAllMessages } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 0. 新增 AWS Proxy 路由：避免前端直接對接 AWS 產生 CORS 問題
app.get('/api/cloud-sync', async (req, res) => {
    try {
        console.log('Proxying request to AWS Cloud...');
        const AWS_URL = 'https://gj6m4nujm6.execute-api.ap-southeast-2.amazonaws.com/default/WassengerMonitor';
        const response = await axios.get(AWS_URL);
        res.json(response.data);
    } catch (error) {
        console.error('Cloud Proxy Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch from AWS Cloud via Proxy' });
    }
});

// 1. 提供前端頁面服務 (根目錄)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend.html'));
});

// 2. Webhook 接收端點：即時存入本地資料庫
app.post('/webhook', (req, res) => {
    const event = req.body;
    
    if (event.data && event.data.id) {
        const msg = {
            id: event.data.id,
            wid: event.data.chat?.id || event.data.wid || event.data.from || event.data.to,
            message: event.data.body,
            direction: event.data.flow === 'inbound' ? 'in' : 'out',
            createdAt: event.data.date || new Date().toISOString(),
            agent: event.data.agent || null
        };
        
        saveMessage(msg);
        console.log(`[Webhook] Saved ${msg.direction} message from ${msg.wid}`);
    }
    
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3001;
const WASSENGER_TOKEN = process.env.WASSENGER_TOKEN;

// 3. API：讀取本地資料庫並計算績效
app.get('/api/performance', async (req, res) => {
    try {
        console.log('Reading messages from local database...');
        let rawMessages = getAllMessages();
        
        // 可選：如果你還想嘗試合併 API 數據（防止有時候沒收到 Webhook）
        try {
            const response = await axios.get('https://api.wassenger.com/v1/messages', {
                headers: { 'Token': WASSENGER_TOKEN },
                params: { limit: 100 }
            });
            // 合併並去重
            const apiMsgs = response.data.map(m => ({
                id: m.id,
                wid: m.wid || m.chat,
                message: m.message,
                direction: m.direction || (m.fromMe ? 'out' : 'in'),
                createdAt: m.createdAt,
                agent: m.agent
            }));
            
            apiMsgs.forEach(m => {
                if (!rawMessages.find(rm => rm.id === m.id)) {
                    rawMessages.push(m);
                }
            });
        } catch (e) {
            console.log('Wassenger API fallback skipped.');
        }

        console.log(`Processing total ${rawMessages.length} messages...`);
        const processedData = calculatePerformance(rawMessages);
        res.json(processedData);

    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch data from Wassenger' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
