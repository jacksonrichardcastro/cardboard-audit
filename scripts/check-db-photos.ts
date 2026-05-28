import { getTrendingListings } from "../src/lib/db/queries/listings";

async function main() {
  console.log("Fetching trending listings...");
  const listings = await getTrendingListings();
  console.log(`Found ${listings.length} listings`);
  
  for (let i = 0; i < 10 && i < listings.length; i++) {
    const l = listings[i];
    console.log(`Listing ${l.id} - ${l.title}:`);
    console.log(`  photos:`, l.photos);
  }
}

main().catch(console.error);
