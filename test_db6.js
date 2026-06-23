import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const [j] = await sql`SELECT user_id FROM storefronts WHERE handle = 'jacksons'`;
  const active = await sql`SELECT id FROM listings WHERE seller_id = ${j.user_id} AND status = 'active'`;
  const stripe = await sql`SELECT stripe_account_id FROM users WHERE id = ${j.user_id}`;
  console.log('Jacksons active listings:', active.length);
  console.log('Jacksons stripe_account_id:', stripe[0]?.stripe_account_id);
  process.exit(0);
}
run().catch(console.error);
