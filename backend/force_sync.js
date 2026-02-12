const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
async function forceSync() {
try {
console.log('--- Triggering Device Sync ---');
const res = await axios.get('https://api.wassenger.com/v1/devices/691aeb1dc2ec875f268bf342/sync', { 
    headers: { 'Token': process.env.WASSENGER_TOKEN } 
});
console.log('Sync Command Sent Success:', res.data.status || 'Success');
console.log('Waiting 5 seconds for sync to process...');
await new Promise(resolve => setTimeout(resolve, 5000));
const res2 = await axios.get('https://api.wassenger.com/v1/devices/691aeb1dc2ec875f268bf342', { 
    headers: { 'Token': process.env.WASSENGER_TOKEN } 
});
console.log('Updated Last Message At:', res2.data.metrics.lastMessageAt);
} catch (e) { console.log('Error:', e.response ? e.response.status : e.message); }
}
forceSync();
