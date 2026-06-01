import { db } from './src/lib/db';
import { listings } from './src/lib/db/schema';
import { ilike } from 'drizzle-orm';

async function run() {
  const data = await db.select({ id: listings.id, title: listings.title, price: listings.priceCents }).from(listings);
  console.log("Found listings. Looking for matches...");

  const queries = [
    { title: 'LeBron James', priceApprox: 407020 },
    { title: 'Charizard', priceApprox: 401306 },
    { title: 'Aaron Judge', priceApprox: 27630 },
    { title: 'Pikachu Illustrator', priceApprox: 78543 },
    { title: 'Upper Deck', priceApprox: 440480 },
    { title: 'Neo Genesis', priceApprox: 372172 },
    { title: 'Bowman Chrome', priceApprox: 416227 },
    { title: 'Mewtwo', priceApprox: 371465 },
    { title: 'Michael Jordan', priceApprox: 294626 }
  ];

  for (const q of queries) {
    const matches = data.filter(d => 
      d.title.toLowerCase().includes(q.title.toLowerCase()) &&
      Math.abs(d.price - q.priceApprox) < 1000 // allow a few cents variation
    );
    console.log(`\nQuery: ${q.title} | ${q.priceApprox}`);
    if (matches.length > 0) {
      for (const m of matches) {
        console.log(`MATCH -> ID: ${m.id} | Title: ${m.title} | Price: ${m.price}`);
      }
    } else {
      console.log(`NO MATCHES FOUND!`);
      // Let's print closest prices for that title
      const allTitleMatches = data.filter(d => d.title.toLowerCase().includes(q.title.toLowerCase()));
      for (const m of allTitleMatches) {
        console.log(`Close -> ID: ${m.id} | Title: ${m.title} | Price: ${m.price}`);
      }
    }
  }
}

run().then(() => process.exit(0)).catch(console.error);
