const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'messages.json');

// 初始化檔案
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function saveMessage(msg) {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        // 避免重複存入（根據 Wassenger 的訊息 ID）
        if (msg.id && data.find(m => m.id === msg.id)) return;
        
        data.push(msg);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Database Error:', e.message);
    }
}

function getAllMessages() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
        return [];
    }
}

module.exports = { saveMessage, getAllMessages };
