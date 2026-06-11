import { db } from "./src/lib/db/index";
import { storefronts, profiles } from "./src/lib/db/schema";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Q5 Refined: Blast radius check (profiles.handle != storefronts.handle AND is_default_for_user = true)");
  const q5 = await db.execute(sql`
    SELECT 
      p.handle as profile_handle, 
      s.handle as storefront_handle, 
      p.user_id,
      s.id as storefront_id
    FROM profiles p
    JOIN storefronts s ON p.user_id = s.user_id
    WHERE LOWER(p.handle) != LOWER(s.handle)
    AND s.is_default_for_user = true
  `);
  console.log(q5);

  process.exit(0);
}
run();
