const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    const client = await pool.connect();
    console.log("Connected to DB. Adding contact_name column...");
    
    await client.query(`
      ALTER TABLE performance_metrics 
      ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
    `);
    
    console.log("Migration successful.");
    client.release();
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
