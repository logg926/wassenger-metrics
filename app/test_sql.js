const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testUpdate() {
  try {
    const client = await pool.connect();
    console.log("Connected.");

    const updateTime = new Date();
    const count = 100;
    const key = 'performance';

    console.log("Testing UPSERT...");
    await client.query(
        `INSERT INTO cache_metadata (key, last_updated, total_messages) 
         VALUES ($1, $3, $2) 
         ON CONFLICT (key) DO UPDATE SET last_updated = $3, total_messages = $2`,
        [key, count, updateTime]
    );
    console.log("UPSERT successful.");

    client.release();
  } catch (err) {
    console.error("UPSERT failed:", err);
  } finally {
    await pool.end();
  }
}

testUpdate();
