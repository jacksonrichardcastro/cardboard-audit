import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";
import { searchCatalog } from "../src/app/actions/search";

async function verify() {
  console.log("--- NAME NORMALIZED SAMPLE ---");
  const sample = await db.execute(sql`SELECT id, subject, name_normalized FROM catalog_cards WHERE name_normalized IS NOT NULL LIMIT 3;`);
  console.table(sample);

  console.log("\n--- TEST SEARCH RESULTS ---");
  
  const queries = [
    "Ohtani",
    "Freddie Freeman",
    "Ohtoni", // typo
    "Julio Rodríguez", // accented
    "Julio Rodriguez", // unaccented
    "Gold Rainbow Foil",
    "2026 Topps Series 2",
    "Tigers",
    "700" // Exact card number for Freddie Freeman
  ];

  for (const q of queries) {
    console.log(`\nQuery: "${q}"`);
    const results = await searchCatalog(q);
    if (results.sets.length > 0) {
      console.log(`  Sets: ${results.sets.map(s => s.name).join(', ')}`);
    }
    if (results.cards.length > 0) {
      console.log(`  Cards: ${results.cards.slice(0, 3).map(c => `${c.name} - ${c.team} (#${c.cardNumber})`).join(', ')}`);
    }
    if (results.parallels.length > 0) {
      console.log(`  Parallels: ${results.parallels.slice(0, 3).map(p => p.name).join(', ')}`);
    }
  }

  process.exit(0);
}

verify().catch(console.error);
