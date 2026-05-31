import postgres from "postgres";
import { env } from "@/env";

async function main() {
  const sql = postgres(env.DATABASE_URL);
  try {
    console.log("Adding presence_status column to profiles...");
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS presence_status VARCHAR(20) NOT NULL DEFAULT 'online';`;
    console.log("Successfully altered schema.");
  } catch (error) {
    console.error("Error altering schema:", error);
  } finally {
    await sql.end();
  }
}

main();
