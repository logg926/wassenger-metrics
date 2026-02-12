require('dotenv').config();
const axios = require('axios');
async function debugToken() {
    const token = process.env.WASSENGER_TOKEN;
    try {
        await axios.get('https://api.wassenger.com/v1/messages', { headers: { 'Token': token }, params: { limit: 1 } });
        console.log('Token is valid for /messages');
    } catch (e) {
        console.log('Error on /messages:', e.response ? e.response.status : e.message);
    }
    try {
        await axios.get('https://api.wassenger.com/v1/chats', { headers: { 'Token': token }, params: { limit: 1 } });
        console.log('Token is valid for /chats');
    } catch (e) {
        console.log('Error on /chats:', e.response ? e.response.status : e.message);
    }
}
debugToken();
