import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    UPDATE users SET is_founding_seller = true 
    WHERE id = 'user_3EeT9Hy8NCqV1ZdMI6KBrWUAngO';
  `);
  console.log("Admin account (jacksons-binder) flagged as founding seller.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
