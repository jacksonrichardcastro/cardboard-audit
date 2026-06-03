import postgres_lib from 'postgres';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const sql = postgres_lib(process.env.DATABASE_URL!, { ssl: 'require' });
  const result = await sql`
    SELECT prosrc FROM pg_proc WHERE proname = 'requesting_user_id';
  `;
  console.log(result);
  await sql.end();
}
main().catch(console.error);
