import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Truncating listings table cascade...");
  const queryClient = postgres(env.DATABASE_URL);
  const db = drizzle(queryClient);

  try {
    await db.execute(sql`TRUNCATE TABLE listings CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE cards CASCADE;`);
    console.log("Successfully truncated listings and cards and all dependencies.");
  } catch (err) {
    console.error("Error truncating:", err);
  } finally {
    await queryClient.end();
  }
}

main();
