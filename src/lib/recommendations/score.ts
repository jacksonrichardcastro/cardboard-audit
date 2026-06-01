import { db } from "@/lib/db";
import { listings, userPreferences, viewHistory, profiles } from "@/lib/db/schema";
import { eq, desc, inArray, sql, and } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// ---------------------------------------------------------------------------
// V1 Beta Recommendation Engine Weights
// Note: Future iterations will move these to a database-backed config table
// or A/B testing framework (tracked in post-Beta backlog).
// ---------------------------------------------------------------------------
export const WEIGHTS = {
  preferenceMatch: 40,    // strongest single signal
  viewHistoryMatch: 25,   // pattern-based, layers on top of preferences
  freshness: 15,          // recency boost
  sellerTier: 10,         // trust/quality signal
  similarToViewed: 10,    // exploration based on recent browsing
};

export async function getRecommendedListings(userId: string | null, limit: number = 20) {
  // 1. Fetch active listings pool (e.g. up to 100 recent active listings)
  // We use unstable_cache for the base pool to keep it fast, then sort per user.
  // But wait, Drizzle doesn't require unstable_cache if we're ok with the DB hit,
  // let's just query it directly for now.
  const activeListings = await db.select({
      id: listings.id,
      title: listings.title,
      priceCents: listings.priceCents,
      grade: listings.grade,
      gradingCompany: listings.gradingCompany,
      condition: listings.condition,
      category: listings.category,
      sport: listings.sport,
      gradeTier: listings.gradeTier,
      era: listings.era,
      listingType: listings.listingType,
      discountType: listings.discountType,
      discountAmount: listings.discountAmount,
      discountActiveUntil: listings.discountActiveUntil,
      createdAt: listings.createdAt,
      sellerId: listings.sellerId,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
      sellerName: profiles.businessName,
      sellerBadges: profiles.badges,
    })
    .from(listings)
    .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
    .where(and(eq(listings.status, "active"), sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`))
    .orderBy(desc(listings.createdAt))
    .limit(100);

  if (!userId) {
    // Logged-out users: freshness + seller tier only
    return activeListings.map(listing => {
      const daysSinceListed = Math.max(0, Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      const freshnessScore = Math.max(0, WEIGHTS.freshness - daysSinceListed);
      
      const badges = (listing.sellerBadges as string[]) || [];
      let sellerScore = 0;
      if (badges.includes("verified")) sellerScore += 5;
      if (badges.includes("founding")) sellerScore += 3;
      if (badges.includes("ambassador")) sellerScore += 2;
      const sellerTierScore = Math.min(WEIGHTS.sellerTier, sellerScore);
      
      const totalScore = freshnessScore + sellerTierScore;
      return { ...listing, totalScore };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
  }

  // Auth'd user: Fetch preferences
  const [prefs] = await db.select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
    
  const preferredSports = (prefs?.sportCategories as string[]) || [];

  // Auth'd user: Fetch view history (last 20 views)
  const history = await db.select({
      listingId: viewHistory.listingId,
    })
    .from(viewHistory)
    .where(eq(viewHistory.userId, userId))
    .orderBy(desc(viewHistory.viewedAt))
    .limit(20);

  const viewedListingIds = Array.from(new Set(history.map(h => h.listingId).filter(Boolean))) as number[];
  
  let viewedListings: { id: number; sport: string | null; gradeTier: string | null; era: string | null; sellerId: string; }[] = [];
  if (viewedListingIds.length > 0) {
    viewedListings = await db.select({
      id: listings.id,
      sport: listings.sport,
      gradeTier: listings.gradeTier,
      era: listings.era,
      sellerId: listings.sellerId,
    })
    .from(listings)
    .where(inArray(listings.id, viewedListingIds));
  }

  const viewedSports = new Set(viewedListings.map(l => l.sport).filter(Boolean));
  const viewedGradeTiers = new Set(viewedListings.map(l => l.gradeTier).filter(Boolean));
  const viewedEras = new Set(viewedListings.map(l => l.era).filter(Boolean));
  const viewedSellers = new Set(viewedListings.map(l => l.sellerId).filter(Boolean));
  const last5ViewedListings = viewedListings.slice(0, 5);

  const ranked = activeListings.map(listing => {
    // 1. Preference match score
    let prefScore = 0;
    if (listing.sport) {
      if (preferredSports.includes(listing.sport)) {
        prefScore = WEIGHTS.preferenceMatch;
      } else {
        const parentCat = listing.sport.split('.')[0];
        if (preferredSports.includes(parentCat)) prefScore = WEIGHTS.preferenceMatch;
      }
    }

    // 2. View history match score
    let historyScore = 0;
    if (listing.sport && viewedSports.has(listing.sport)) historyScore += 10;
    if (listing.gradeTier && viewedGradeTiers.has(listing.gradeTier)) historyScore += 8;
    if (listing.era && viewedEras.has(listing.era)) historyScore += 7;
    historyScore = Math.min(WEIGHTS.viewHistoryMatch, historyScore);

    // 3. Freshness score
    const daysSinceListed = Math.max(0, Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    const freshnessScore = Math.max(0, WEIGHTS.freshness - daysSinceListed);

    // 4. Seller tier score
    const badges = (listing.sellerBadges as string[]) || [];
    let sellerScore = 0;
    if (badges.includes("verified")) sellerScore += 5;
    if (badges.includes("founding")) sellerScore += 3;
    if (badges.includes("ambassador")) sellerScore += 2;
    const sellerTierScore = Math.min(WEIGHTS.sellerTier, sellerScore);

    // 5. Similar-to-viewed score
    let similarScore = 0;
    if (viewedSellers.has(listing.sellerId)) similarScore += 5;
    const sameSportAndEra = last5ViewedListings.some(vl => vl.sport === listing.sport && vl.era === listing.era);
    if (sameSportAndEra) similarScore += 5;
    similarScore = Math.min(WEIGHTS.similarToViewed, similarScore);

    const totalScore = prefScore + historyScore + freshnessScore + sellerTierScore + similarScore;
    
    return { ...listing, totalScore };
  });

  return ranked.sort((a, b) => b.totalScore - a.totalScore).slice(0, limit);
}
