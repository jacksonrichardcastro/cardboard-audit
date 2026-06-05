require('dotenv').config({path: '.env.local'});
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./src/lib/db/schema');
const { eq } = require('drizzle-orm');

async function test() {
  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });
  
  try {
    const userId = "user_2l7T2PzB1i2ZJz8zL8zZ8zZ8zZ8"; // Fake ID, just to test query syntax
    console.log("Testing findMany...");
    const existing = await db.query.categories.findMany({
      where: eq(schema.categories.userId, userId),
      orderBy: (c, { desc }) => [desc(c.displayOrder)]
    });
    console.log("findMany successful", existing);
    
    // We won't insert to avoid messing up DB, but we can check if syntax is right
    console.log("Query syntax is valid.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

test();
