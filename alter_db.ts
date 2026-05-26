import postgres from "postgres";
import { env } from "@/env";

async function main() {
  const sql = postgres(env.DATABASE_URL);
  try {
    console.log("Adding header_style and banner_image_url columns to sellers...");
    await sql`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS header_style VARCHAR(20) NOT NULL DEFAULT 'cards';`;
    await sql`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS banner_image_url TEXT;`;
    console.log("Successfully altered schema.");
  } catch (error) {
    console.error("Error altering schema:", error);
  } finally {
    await sql.end();
  }
}

main();
