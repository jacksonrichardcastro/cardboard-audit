const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query("SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5");
  console.log(res.rows);
  pool.end();
}
run();
