import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';
async function run() {
  const users = await db.execute(sql`SELECT * FROM profiles LIMIT 5`);
  console.log(users);
  process.exit(0);
}
run();
