const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkBody() {
  try {
    const client = await pool.connect();
    console.log("Checking performance_metrics for body content...");
    
    const res = await client.query(`
      SELECT id, contact_name, body 
      FROM performance_metrics 
      LIMIT 10
    `);
    
    console.table(res.rows.map(r => ({
        ID: r.id,
        Contact: r.contact_name,
        Body: r.body ? r.body.substring(0, 30) + '...' : 'NULL/EMPTY'
    })));

    client.release();
  } catch (err) {
    console.error("Check failed:", err);
  } finally {
    await pool.end();
  }
}

checkBody();
