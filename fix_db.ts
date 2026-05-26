import postgres from "postgres";
import { env } from "./src/env";

async function main() {
  const sql = postgres(env.DATABASE_URL);
  try {
    console.log("Fixing approval status for alexthegrader...");
    await sql`UPDATE sellers SET approval_status = 'approved' WHERE handle = 'alexthegrader'`;
    console.log("Successfully fixed status.");
  } catch (error) {
    console.error(error);
  } finally {
    await sql.end();
  }
}
main();
