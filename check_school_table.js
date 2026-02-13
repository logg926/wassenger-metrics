const axios = require('axios');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkSchoolTable() {
    try {
        const response = await axios.get(`${supabaseUrl}/rest/v1/school?select=*&limit=1`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        console.log("School Table Sample:", response.data[0]);
    } catch (e) {
        console.error(e.message);
    }
}

checkSchoolTable();
