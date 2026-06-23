import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const ids = [325, 331, 332, 333, 334, 338, 339, 323];
  const cards = await sql`SELECT id, title FROM cards WHERE id IN ${sql(ids)}`;
  console.log(cards);
  process.exit(0);
}
run().catch(console.error);
