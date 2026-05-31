require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function main() {
  try {
    const migrationPath = path.join(__dirname, '../src/lib/db/migrations/0005_large_doctor_doom.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statement-breakpoint if drizzle uses that
    const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Running ${statements.length} statements...`);
    
    for (const stmt of statements) {
      console.log(`Executing: ${stmt.substring(0, 50)}...`);
      await sql.unsafe(stmt);
    }
    
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

main();
