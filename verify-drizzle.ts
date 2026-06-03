import { db } from './src/lib/db';
import { listings } from './src/lib/db/schema';

async function main() {
  const allListings = await db.select().from(listings).limit(5);
  console.log(`Successfully fetched ${allListings.length} listings using Drizzle.`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
