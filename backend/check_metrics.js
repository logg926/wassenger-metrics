const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
async function checkMetrics() {
try {
const res = await axios.get('https://api.wassenger.com/v1/devices/691aeb1dc2ec875f268bf342', { headers: { 'Token': process.env.WASSENGER_TOKEN } });
console.log('--- DEVICE METRICS ---');
console.log('Unread Messages:', res.data.metrics.unreadMessages);
console.log('Total Contacts:', res.data.metrics.contacts);
console.log('Last Message At:', res.data.metrics.lastMessageAt);
console.log('Last Message Body:', res.data.metrics.lastMessageBody);
} catch (e) { console.log('Error:', e.message); }
}
checkMetrics();
