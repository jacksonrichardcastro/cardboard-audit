import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  const res = await db.execute(sql`SELECT id, user_id, handle, display_name, bio, avatar_url, theme, theme_scope, created_at, updated_at FROM storefronts WHERE LOWER(handle) LIKE '%superstrike%';`);
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
