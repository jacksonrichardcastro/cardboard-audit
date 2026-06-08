import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`SELECT id, status, price_cents, title FROM listings WHERE status = 'draft'`);
  console.log("BEFORE DRAFTS:", res);
  const updateRes = await db.execute(sql`UPDATE listings SET price_cents = NULL WHERE status = 'draft' AND price_cents = 0 RETURNING id, status, price_cents`);
  console.log("UPDATED DRAFTS:", updateRes);
  const resAfter = await db.execute(sql`SELECT id, status, price_cents, title FROM listings WHERE status = 'draft'`);
  console.log("AFTER DRAFTS:", resAfter);
  process.exit(0);
}
run();
