import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const res = await db.execute(sql.raw(`
      SELECT
        (SELECT COUNT(*) FROM storefronts) AS storefronts_total,
        (SELECT COUNT(*) FROM storefronts WHERE is_default_for_user = true) AS storefronts_with_default,
        (SELECT COUNT(*) FROM listings WHERE storefront_id IS NULL) AS unassigned_listings,
        (SELECT COUNT(*) FROM categories WHERE storefront_id IS NULL) AS unassigned_categories,
        (SELECT COUNT(*) FROM handle_history WHERE storefront_id IS NULL) AS unassigned_handle_history,
        (SELECT COUNT(*) FROM users) AS total_users;
    `));
    console.log(res);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
