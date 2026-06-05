require('dotenv').config({path: '.env.local'});
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const sql = postgres(process.env.DATABASE_URL);
const migrationPath = path.join(__dirname, 'src/lib/db/migrations/0012_chief_sebastian_shaw.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

async function run() {
  try {
    // split by statement-breakpoint
    const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    for (const statement of statements) {
      console.log('Executing:', statement);
      await sql.unsafe(statement);
    }
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    process.exit(0);
  }
}

run();
