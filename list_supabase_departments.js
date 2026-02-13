const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function listDepartments() {
    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing credentials.");
        return;
    }

    try {
        console.log("Fetching departments with school names...");
        // Updated column: school(school_name)
        const response = await axios.get(`${supabaseUrl}/rest/v1/department?select=*,school:school_id(school_name)`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        const data = response.data;
        console.log(`Found ${data.length} records.`);

        if (data.length === 0) return;

        // Flatten the data for CSV
        const flattenedData = data.map(row => {
            const { school, ...rest } = row;
            return {
                ...rest,
                school_name: school ? school.school_name : 'Unknown School'
            };
        });

        // Generate CSV
        const headers = Object.keys(flattenedData[0]);
        const csvContent = [
            headers.join(','),
            ...flattenedData.map(row => 
                headers.map(field => {
                    const val = row[field] === null ? '' : row[field];
                    return `"${String(val).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        fs.writeFileSync('supabase_departments.csv', csvContent);
        console.log("✅ Successfully exported to supabase_departments.csv");

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) console.error("Details:", error.response.data);
    }
}

listDepartments();
