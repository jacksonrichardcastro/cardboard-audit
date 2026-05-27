const postgres = require('postgres');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const migration = fs.readFileSync('src/lib/db/migrations/0002_curly_pandemic.sql', 'utf8');
    // Remove the --> statement-breakpoint comments as they are not valid postgres
    const cleanMigration = migration.replace(/--> statement-breakpoint/g, '');
    await sql.unsafe(cleanMigration);
    console.log('Migration applied successfully');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await sql.end();
  }
}
run();
