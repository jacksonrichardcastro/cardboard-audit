import { db } from "./src/lib/db/index";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.execute(sql`
    UPDATE storefronts
    SET handle = 'av3-collectibles', updated_at = NOW()
    WHERE id = '79cfce5d-ab3e-4343-938a-66d5cdc6e1b3'
      AND is_default_for_user = true
    RETURNING id, handle, is_default_for_user;
  `);
  console.log("UPDATE RESULT:", result);
  process.exit(0);
}
run();
