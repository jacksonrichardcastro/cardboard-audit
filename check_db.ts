import postgres from "postgres";
import { env } from "@/env";

async function main() {
  const sql = postgres(env.DATABASE_URL);
  try {
    const columns = await sql`SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'presence_status'`;
    console.log("Column Info:", columns);
    
    const profile = await sql`SELECT user_id, handle, presence_status FROM profiles LIMIT 1`;
    console.log("Spot-check Profile:", profile);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
  }
}

main();
