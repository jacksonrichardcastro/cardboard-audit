require('dotenv').config({path: '.env.local'});
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./src/lib/db/schema');
const { eq, sql } = require('drizzle-orm');

async function test() {
  const sqlCon = postgres(process.env.DATABASE_URL);
  const db = drizzle(sqlCon, { schema });
  
  try {
    const profiles = await db.select().from(schema.profiles).limit(50);
    console.log("Profiles:", profiles.map(p => p.handle));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

test();
