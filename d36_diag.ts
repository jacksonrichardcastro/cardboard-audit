import { db } from "./src/lib/db/index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("\n--- Query 5: Andy's storefront ---");
  const q5 = await db.execute(sql`
    SELECT id, handle, theme, theme_scope, is_default_for_user, 
           header_customization_ids, hidden_badges, 
           avatar_url, display_name, bio,
           created_at, updated_at
    FROM storefronts 
    WHERE handle = 'av3-collectibles';
  `);
  console.log(q5);

  console.log("\n--- Query 6: Population baseline ---");
  const q6 = await db.execute(sql`
    SELECT 
      COUNT(*) FILTER (WHERE theme IS NULL OR theme = '') as null_theme_count,
      COUNT(*) FILTER (WHERE theme_scope IS NULL OR theme_scope = '') as null_scope_count,
      COUNT(*) FILTER (WHERE bio IS NULL OR bio = '') as null_bio_count,
      COUNT(*) FILTER (WHERE display_name IS NULL OR display_name = '') as null_display_count,
      COUNT(*) as total_storefronts
    FROM storefronts;
  `);
  console.log(q6);

  console.log("\n--- Query 7: Storefronts missing theme/scope ---");
  const q7 = await db.execute(sql`
    SELECT id, handle, display_name, theme, theme_scope, created_at
    FROM storefronts
    WHERE theme IS NULL OR theme = '' OR theme_scope IS NULL OR theme_scope = ''
    ORDER BY created_at DESC;
  `);
  console.log(q7);

  process.exit(0);
}
run();
