import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const [j] = await sql`SELECT user_id FROM storefronts WHERE handle = 'jacksons'`;
  const sf = await sql`SELECT id, handle, user_id FROM storefronts WHERE user_id = ${j.user_id}`;
  console.log('Jacksons user_id:', j.user_id);
  console.log('Storefronts:', sf);
  process.exit(0);
}
run().catch(console.error);
