import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Updating is_founding_seller for Jackson...");
  
  await db.execute(sql`
    UPDATE users SET is_founding_seller = true 
    WHERE LOWER(email) = 'jacksonrichardcastro@gmail.com';
  `);
  
  console.log("Done.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
