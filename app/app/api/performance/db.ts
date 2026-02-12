import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function initDb() {
  const client = await pool.connect();
  try {
    // Create the table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        seconds INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL,
        chat_id VARCHAR(100),
        message_id VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS pending_messages (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(100) UNIQUE,
        chat_id VARCHAR(100),
        timestamp BIGINT NOT NULL,
        body TEXT,
        contact_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS cache_metadata (
        key VARCHAR(50) PRIMARY KEY,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_messages INTEGER
      );
    `);
  } finally {
    client.release();
  }
}

export default pool;
