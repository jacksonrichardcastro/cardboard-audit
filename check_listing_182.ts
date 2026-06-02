import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string, { prepare: false });

  try {
    const listing = await sql`
      SELECT l.*, c.title as card_title, c.year as card_year, c.card_number as card_card_number, c.set as card_set
      FROM listings l
      JOIN cards c ON c.id = l.card_id
      WHERE l.id = 182;
    `;
    console.log("Listing 182 DB row:", listing);
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await sql.end();
  }
}

main();
