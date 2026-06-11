import { db } from "./src/lib/db/index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("--- Step 2: Bio Recovery UPDATE ---");
  const s2 = await db.execute(sql`
    UPDATE storefronts s
    SET bio = p.bio, updated_at = NOW()
    FROM profiles p
    WHERE p.user_id = s.user_id
      AND (s.bio IS NULL OR s.bio = '')
      AND p.bio IS NOT NULL
      AND p.bio != ''
      AND s.is_default_for_user = true
    RETURNING s.id, s.handle, LEFT(s.bio, 50) as restored_bio_preview;
  `);
  console.log(s2);

  console.log("\n--- Step 3: Andy theme_scope backfill ---");
  const s3 = await db.execute(sql`
    UPDATE storefronts
    SET theme_scope = 'profile-wide', updated_at = NOW()
    WHERE handle = 'av3-collectibles'
    RETURNING id, handle, theme, theme_scope;
  `);
  console.log(s3);

  process.exit(0);
}
run();
