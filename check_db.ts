import postgres from "postgres";
import { env } from "./src/env";

async function main() {
  const sql = postgres(env.DATABASE_URL);
  try {
    const users = await sql`SELECT id, email, role FROM users`;
    console.log("Users in remote DB:", users);
  } catch (error) {
    console.error(error);
  } finally {
    await sql.end();
  }
}
main();
