import postgres_lib from 'postgres';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = postgres_lib(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  console.log("Applying migration...");
  await sql.unsafe(`ALTER TABLE "users" ADD COLUMN "is_founding_seller" boolean DEFAULT false NOT NULL;`);
  
  console.log("Running backfill...");
  const result = await sql.unsafe(`
    UPDATE users
    SET is_founding_seller = true
    WHERE LOWER(email) IN (
      'superiorparadigm@gmail.com', 'hiimwage@gmail.com', 'aviiicollectibles@gmail.com',
      'trey@dealercompassgroup.com', 'mattrennick89@gmail.com', 'cd3.cards@gmail.com',
      'terrapincards@gmail.com', 'patrick2e65@gmail.com', 'hobbychad@proton.me',
      'essantiago09@att.net', 'marty.truax@gmail.com', 'madmancardstx@gmail.com',
      'christiangarcia6610@gmail.com', 'rabermudez@gmail.com', 'rc_magnate@yahoo.com',
      'ckraker27@gmail.com', 'gotdemcards@gmail.com', 'abjeffcoat@gmail.com',
      'darin.bergmann@gmail.com', 'daniel.c.sturman@gmail.com', 'shuakop@gmail.com',
      'joeblemaire@gmail.com', 'sneakordz@gmail.com', 'junkforcozy@gmail.com',
      'cris.a.1996@hotmail.com', 'nadroj117@gmail.com', 'hitmachinesports@gmail.com',
      'rkgreen19@gmail.com', 'raptordelivery1@gmail.com', 'greenescardco@hotmail.com',
      'itsgreeny17@gmail.com', 'shophpm@gmail.com'
    );
  `);
  
  console.log(`Backfill updated ${result.count} rows.`);
  await sql.end();
}
main().catch(console.error);
