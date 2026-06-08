import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`SELECT id, status, price_cents, title FROM listings WHERE status = 'draft'`);
  console.log("DRAFTS:");
  console.log(res);
  const updateRes = await db.execute(sql`UPDATE listings SET price_cents = NULL WHERE status = 'draft' AND price_cents = 0 RETURNING id, status, price_cents, title`);
  console.log("UPDATED:");
  console.log(updateRes);
  process.exit(0);
}
run();
