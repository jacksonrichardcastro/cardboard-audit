require('dotenv').config({path: '.env.local'});
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./src/lib/db/schema');

async function test() {
  const sqlCon = postgres(process.env.DATABASE_URL);
  const db = drizzle(sqlCon, { schema });
  
  try {
    const listings = await db.select({ id: schema.listings.id }).from(schema.listings).limit(1);
    console.log("Listing ID:", listings[0].id);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

test();
