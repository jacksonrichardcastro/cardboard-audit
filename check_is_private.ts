import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string, { prepare: false });

  try {
    const result = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'is_private';`;
    console.log("Query result:", result);
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await sql.end();
  }
}

main();
