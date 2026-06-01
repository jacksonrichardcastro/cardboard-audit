import { db } from './src/lib/db';
import { profiles } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function run() {
  const pre = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, 'buyer-alex'));
  console.log("Pre-UPDATE handle for buyer-alex:", pre);
  
  await db.execute(sql`UPDATE profiles SET handle = 'alexthegrader' WHERE user_id = 'buyer-alex'`);
  
  const post = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, 'buyer-alex'));
  console.log("Post-UPDATE handle for buyer-alex:", post);
  
  process.exit(0);
}

run().catch(console.error);
