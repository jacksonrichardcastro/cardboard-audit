import postgres from "postgres";
import { env } from "@/env";

async function main() {
  const sql = postgres(env.DATABASE_URL);
  try {
    const admin = await sql`SELECT user_id, handle, email FROM profiles JOIN users ON profiles.user_id = users.id WHERE handle = 'trax-founder' LIMIT 1`;
    console.log("Admin User:", admin);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
  }
}

main();
