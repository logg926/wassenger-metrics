const dayjs = require('dayjs');

/**
 * 根據 Wassenger 標準邏輯計算績效
 * 邏輯：Find Inbound -> Find next Outbound -> Calculate difference
 */
function calculatePerformance(messages) {
    const chats = {};
    
    // 1. 分組
    messages.forEach(m => {
        const chatId = m.chat || m.wid || m.phone;
        if (!chats[chatId]) chats[chatId] = [];
        chats[chatId].push(m);
    });

    const performanceData = [];

    // 2. 計算每個會話的響應時間
    Object.keys(chats).forEach(chatId => {
        // 確保時間順序（由舊到新）
        const sortedMsgs = chats[chatId].sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf());
        
        let pendingInboundTime = null;

        sortedMsgs.forEach(msg => {
            // 判斷方向 (優先使用 direction 欄位，相容 flow 或 fromMe)
            const isInbound = msg.direction === 'in' || msg.flow === 'inbound' || (msg.fromMe === false && !msg.deliveryStatus);
            const isOutbound = msg.direction === 'out' || msg.flow === 'outbound' || msg.fromMe === true || !!msg.agent;

            if (isInbound) {
                // 如果這是第一個提問，或者之前的提問已經回覆了，才記錄新提問時間
                // （這符合「從第一個未回答的訊息開始計算」的標準）
                if (pendingInboundTime === null) {
                    pendingInboundTime = dayjs(msg.createdAt).valueOf();
                }
            } else if (isOutbound && pendingInboundTime !== null) {
                // 找到對應的客服回覆
                const replyTime = dayjs(msg.createdAt).valueOf();
                const diffSeconds = Math.floor((replyTime - pendingInboundTime) / 1000);
                
                if (diffSeconds >= 0) {
                    performanceData.push({
                        timestamp: replyTime,
                        seconds: diffSeconds,
                        category: getCategory(dayjs(msg.createdAt))
                    });
                }

                // 重置狀態，等待下一個客戶提問
                pendingInboundTime = null;
            }
        });
    });

    return performanceData.sort((a, b) => a.timestamp - b.timestamp);
}

function getCategory(dateObj) {
    const day = dateObj.day();
    const hour = dateObj.hour();
    const isWeekend = (day === 0 || day === 6);
    if (isWeekend) return 'WEEKEND';
    if (hour >= 9 && hour < 18) return 'OFFICE';
    return 'WEEKNIGHT';
}

module.exports = { calculatePerformance };
