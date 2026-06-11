import { db } from "./src/lib/db/index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("--- Step 1: Preview COUNT ---");
  const countRes = await db.execute(sql`
    SELECT COUNT(*) as recoverable_count
    FROM storefronts s
    LEFT JOIN profiles p ON p.user_id = s.user_id
    WHERE (s.bio IS NULL OR s.bio = '')
      AND p.bio IS NOT NULL 
      AND p.bio != '';
  `);
  console.log(countRes);

  console.log("\n--- Step 1: Preview Output (up to 60 rows) ---");
  const rowsRes = await db.execute(sql`
    SELECT 
      s.id as storefront_id,
      s.handle,
      s.user_id,
      s.bio as current_storefront_bio,
      p.bio as profile_bio_to_restore,
      s.is_default_for_user,
      LENGTH(p.bio) as profile_bio_length
    FROM storefronts s
    LEFT JOIN profiles p ON p.user_id = s.user_id
    WHERE (s.bio IS NULL OR s.bio = '')
      AND p.bio IS NOT NULL 
      AND p.bio != ''
    ORDER BY s.is_default_for_user DESC, LENGTH(p.bio) DESC
    LIMIT 60;
  `);
  console.log(rowsRes);

  process.exit(0);
}
run();
