import postgres from "postgres";
import fs from "fs";
import 'dotenv/config';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const query = fs.readFileSync("src/lib/db/migrations/0009_add_categories.sql", "utf-8");
  await sql.unsafe(query);
  console.log("Migration successful");
  process.exit(0);
}
main();
