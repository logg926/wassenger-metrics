const fs = require('fs');
const path = require('path');

// Helper to parse CSV simply
function parseCSV(filePath, idColumn, nameColumn) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',');
    
    const results = [];
    
    // Find column indices
    const idIndex = headers.findIndex(h => h.trim() === idColumn);
    const nameIndex = nameColumn ? headers.findIndex(h => h.trim() === nameColumn) : -1;
    
    // Manual parsing to handle basic quotes
    for (let i = 1; i < lines.length; i++) {
        let row = lines[i];
        
        // Basic split - purely assuming no commas inside quotes for simplicity
        // or just use regex match
        const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        
        if (!columns) continue;

        // Clean quotes
        const cleanCols = columns.map(c => c.replace(/^"|"$/g, '').trim());
        
        // Because regex match might behave differently on indices depending on empty cols
        // Let's use a simpler split if structure is simple
        const simpleCols = row.split(',');
        
        // Prefer simple split if quotes aren't heavy, otherwise index matching is hard without a library
        // Let's rely on simple split for IDs since they don't have commas
        
        const id = simpleCols[idIndex] ? simpleCols[idIndex].replace(/"/g, '').trim() : null;
        let name = 'Unknown';
        
        if (nameIndex > -1 && simpleCols[nameIndex]) {
             name = simpleCols[nameIndex].replace(/"/g, '').trim();
        }
        
        if (id && id !== 'null' && id !== '') {
            results.push({ id, name });
        }
    }
    return results;
}

// 1. Load Wassenger Groups
const wassengerGroups = parseCSV('app/groups.csv', 'group_id', 'group_name');
const wassengerMap = new Map(wassengerGroups.map(g => [g.id, g.name]));

// 2. Load Supabase Departments
const supabaseGroups = parseCSV('supabase_departments.csv', 'group_id', 'school_name');
const supabaseMap = new Map(supabaseGroups.map(g => [g.id, g.name]));

console.log(`\n--- Analysis ---`);
console.log(`Total Wassenger Groups: ${wassengerMap.size}`);
console.log(`Total Supabase Linked Groups: ${supabaseMap.size}`);

// 3. Compare: In Wassenger but NOT in Supabase
const notInSupabase = [];
wassengerMap.forEach((name, id) => {
    if (!supabaseMap.has(id)) {
        notInSupabase.push({ id, name });
    }
});

// 4. Compare: In Supabase but NOT in Wassenger
const notInWassenger = [];
supabaseMap.forEach((name, id) => {
    if (!wassengerMap.has(id)) {
        notInWassenger.push({ id, name });
    }
});

console.log(`\n1. Found in Wassenger (WhatsApp) but NOT linked in Supabase: ${notInSupabase.length}`);
if (notInSupabase.length > 0) {
    console.log(`Sample (first 5):`);
    notInSupabase.slice(0, 5).forEach(g => console.log(` - ${g.name} (${g.id})`));
    // Save to file
    fs.writeFileSync('missing_in_supabase.csv', 'group_id,group_name\n' + notInSupabase.map(g => `${g.id},"${g.name}"`).join('\n'));
    console.log(`(Full list saved to missing_in_supabase.csv)`);
}

console.log(`\n2. Linked in Supabase but NOT found in Wassenger (Inactive/Left?): ${notInWassenger.length}`);
if (notInWassenger.length > 0) {
    console.log(`Sample (first 5):`);
    notInWassenger.slice(0, 5).forEach(g => console.log(` - ${g.name} (${g.id})`));
    // Save to file
    fs.writeFileSync('missing_in_wassenger.csv', 'group_id,school_name\n' + notInWassenger.map(g => `${g.id},"${g.name}"`).join('\n'));
    console.log(`(Full list saved to missing_in_wassenger.csv)`);
}
