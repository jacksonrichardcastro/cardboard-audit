import "dotenv/config";
import { getTrendingListings } from "../src/lib/db/queries/listings";
import { getRecommendedListings } from "../src/lib/recommendations/score";

async function main() {
  const trending = await getTrendingListings();
  const recommended = await getRecommendedListings(null, 5);
  
  console.log("TRENDING 0:", trending[0]?.photos);
  console.log("RECOMMENDED 0:", recommended[0]?.photos);
}

main().catch(console.error);
