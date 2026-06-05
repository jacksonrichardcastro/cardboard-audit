require('dotenv').config({path: '.env.local'});
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./src/lib/db/schema');
const { eq, sql } = require('drizzle-orm');

async function test() {
  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });
  
  try {
    const profiles = await db.select().from(schema.profiles).where(sql`handle ILIKE '%aviii%'`);
    if (profiles.length === 0) {
      console.log("Profile not found");
      return;
    }
    const profile = profiles[0];
    
    console.log("Andy user_id:", profile.userId);
    
    const andyCategories = await db.select().from(schema.categories).where(eq(schema.categories.userId, profile.userId));
    console.log("Categories:");
    console.table(andyCategories);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

test();
