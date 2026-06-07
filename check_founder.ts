import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT u.id, u.email, u.is_founding_seller, p.handle 
    FROM users u 
    LEFT JOIN profiles p ON u.id = p.user_id 
    WHERE LOWER(u.email) = 'jacksonrichardcastro@gmail.com';
  `);
  
  console.log("=== DB SELECT RESULT ===");
  console.log(JSON.stringify(result, null, 2));
  console.log("========================");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
