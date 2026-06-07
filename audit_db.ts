import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== 1. FIND ACTUAL ADMIN ACCOUNT ===");
  const adminResult = await db.execute(sql`
    SELECT u.id, u.email, p.handle, p.display_name, u.is_founding_seller, u.created_at
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE LOWER(p.display_name) LIKE '%action jackson castro%'
       OR LOWER(p.display_name) LIKE '%jackson castro%'
    ORDER BY u.created_at;
  `);
  console.log(JSON.stringify(adminResult, null, 2));

  console.log("\n=== 2. REVERT jrc_test ===");
  await db.execute(sql`
    UPDATE users u
    SET is_founding_seller = false 
    FROM profiles p
    WHERE u.id = p.user_id AND p.handle = 'jrc_test';
  `);
  console.log("jrc_test reverted.");

  console.log("\n=== 3. AUDIT PRE-LAUNCH ACCOUNTS WITHOUT FLAG ===");
  const auditResult = await db.execute(sql`
    SELECT u.id, u.email, p.handle, p.display_name, u.is_founding_seller, u.created_at
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.is_founding_seller = false
      AND u.created_at < '2026-06-02'::timestamp
    ORDER BY u.created_at;
  `);
  console.log(JSON.stringify(auditResult, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
