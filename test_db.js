import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  const bofas = await sql`SELECT * FROM storefronts WHERE handle = 'bofascards'`;
  if (bofas.length > 0) {
    const userId = bofas[0].user_id;
    const all = await sql`SELECT handle FROM storefronts WHERE user_id = ${userId}`;
    console.log('bofascards storefront count:', all.length, all.map(a => a.handle));
  }

  const jacksons = await sql`SELECT * FROM storefronts WHERE handle = 'jacksons'`;
  if (jacksons.length > 0) {
    const userId = jacksons[0].user_id;
    const all = await sql`SELECT handle FROM storefronts WHERE user_id = ${userId}`;
    console.log('jacksons storefront count:', all.length, all.map(a => a.handle));
  }
  
  process.exit(0);
}
run().catch(console.error);
