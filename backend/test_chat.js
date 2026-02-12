require('dotenv').config();
const axios = require('axios');
async function testChat() {
    try {
        const res = await axios.get('https://api.wassenger.com/v1/chat/messages', {
            headers: { 'Token': process.env.WASSENGER_TOKEN },
            params: { limit: 10 }
        });
        console.log('Success! Chat messages found:', res.data.length);
    } catch (e) {
        console.log('Failed:', e.response ? e.response.status : e.message);
    }
}
testChat();
