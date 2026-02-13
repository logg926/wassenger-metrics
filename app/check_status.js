const axios = require('axios');
require('dotenv').config({ path: '.env' });

async function check() {
    const res = await axios.get('https://api.wassenger.com/v1/devices', {
        headers: { Token: process.env.WASSENGER_TOKEN }
    });
    console.log(JSON.stringify(res.data, null, 2));
}
check();
