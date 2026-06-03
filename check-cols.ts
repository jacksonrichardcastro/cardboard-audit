import postgres_lib from 'postgres';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = postgres_lib(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  const result = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('users', 'cards', 'profiles') 
    AND column_name IN ('is_founding_seller', 'is_private', 'profile_setup_completed', 'welcome_modal_dismissed');
  `;
  console.log(result);
  await sql.end();
}
main().catch(console.error);
