import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`ALTER TABLE "profiles" ADD COLUMN "hidden_badges" json DEFAULT '[]'::json;`);
  console.log("Migration applied.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
