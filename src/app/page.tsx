import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Clock, ArrowRight, LayoutGrid, Tag, PackageSearch, Zap, Flame, Calendar, ChevronRight, ShieldCheck } from "lucide-react";
import { TickerPill } from "@/components/shared/TickerPill";
import { SearchBar } from "@/components/storefront/search-bar";
import { CardRail } from "@/components/storefront/card-rail";
import { getTrendingListings } from "@/lib/db/queries/listings";
import { FilterSidebar } from "@/components/storefront/filter-sidebar";
import { db } from "@/lib/db";
import { listings, profiles, itemPhotos } from "@/lib/db/schema";
import { eq, count, inArray, sql } from "drizzle-orm";
import { FiltersDrawer } from "@/components/storefront/FiltersDrawer";
import { ActiveFilterChips } from "@/components/storefront/ActiveFilterChips";
import { auth } from "@clerk/nextjs/server";
import { getRecommendedListings } from "@/lib/recommendations/score";
import { getUserPreferences } from "@/app/actions/preferences";
import { ForYouClient } from "@/components/recommendations/ForYouClient";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  
  const dbListings = await getTrendingListings({
    sport: searchParams.sport,
    listing_type: searchParams.listing_type,
    grade: searchParams.grade,
    era: searchParams.era,
    price: searchParams.price
  });
  
  const hardcodedIds = [61, 62, 67, 64, 65, 66, 63, 68, 69];
  
  const rawTrendingListings = await db.select({
    id: listings.id,
    title: listings.title,
    priceCents: listings.priceCents,
    grade: listings.grade,
    gradingCompany: listings.gradingCompany,
    condition: listings.condition,
    discountType: listings.discountType,
    discountAmount: listings.discountAmount,
    discountActiveUntil: listings.discountActiveUntil,
    photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
    sellerBusinessName: profiles.businessName,
  })
  .from(listings)
  .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
  .where(inArray(listings.id, hardcodedIds));

  const recentListings = hardcodedIds.map(id => {
    const d = rawTrendingListings.find(l => l.id === id);
    if (!d) return null;
    return {
      id: d.id.toString(),
      title: d.title,
      category: "Sports" as any,
      subcategory: "Other",
      condition: d.condition,
      grade: d.grade || undefined,
      gradingCompany: d.gradingCompany || undefined,
      priceCents: d.priceCents,
      discountType: d.discountType || undefined,
      discountAmount: d.discountAmount || undefined,
      discountActiveUntil: d.discountActiveUntil || undefined,
      photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
      sellerBusinessName: d.sellerBusinessName,
      createdAt: new Date().toISOString(),
      sport: "",
      listingType: "BUY_IT_NOW" as any,
      gradeTier: "Raw / Ungraded",
      era: "Modern (2010+)"
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  // Recommendations Engine integration (Hardcoded Featured Listings)
  const { userId } = await auth();
  const prefs = await getUserPreferences();
  
  const featuredIds = [75, 74, 77, 78, 79, 70, 71, 72, 76];
  
  const rawFeaturedListings = await db.select({
    id: listings.id,
    title: listings.title,
    priceCents: listings.priceCents,
    grade: listings.grade,
    gradingCompany: listings.gradingCompany,
    condition: listings.condition,
    discountType: listings.discountType,
    discountAmount: listings.discountAmount,
    discountActiveUntil: listings.discountActiveUntil,
    photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
    sellerBusinessName: profiles.businessName,
    sport: listings.sport,
    listingType: listings.listingType,
    gradeTier: listings.gradeTier,
    era: listings.era,
    category: listings.category
  })
  .from(listings)
  .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
  .where(inArray(listings.id, featuredIds));

  const recommendedMapped = featuredIds.map(id => {
    const d = rawFeaturedListings.find(l => l.id === id);
    if (!d) return null;
    return {
      id: d.id.toString(),
      title: d.title,
      category: d.category as any,
      subcategory: "Other",
      condition: d.condition,
      grade: d.grade || undefined,
      gradingCompany: d.gradingCompany || undefined,
      priceCents: d.priceCents,
      discountType: d.discountType || undefined,
      discountAmount: d.discountAmount || undefined,
      discountActiveUntil: d.discountActiveUntil || undefined,
      photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
      sellerBusinessName: d.sellerBusinessName,
      createdAt: new Date().toISOString(),
      sport: d.sport || "",
      listingType: d.listingType || "BUY_IT_NOW",
      gradeTier: d.gradeTier || "Raw / Ungraded",
      era: d.era || "Modern (2010+)"
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const hasPreferences = !!(prefs && prefs.sportCategories && prefs.sportCategories.length > 0);
  const isPersonalized = userId && hasPreferences;
  const isSkipState = userId && !hasPreferences;

  const LAUNCH_DATE = new Date('2026-05-31T00:00:00Z');
  const now = new Date();
  const isPreLaunch = now < LAUNCH_DATE;

  let displayText: string;
  if (isPreLaunch) {
    const daysUntilLaunch = Math.ceil((LAUNCH_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    displayText = `Launching May 31, 2026 · ${daysUntilLaunch} days`;
  } else {
    // Post-launch: query real activity from DB
    const activeListings = await db.select({ count: count() }).from(listings).where(eq(listings.status, 'active'));
    const total = activeListings[0]?.count ?? 0;
    displayText = `${total.toLocaleString()} cards available right now`;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      {/* Ambient background glow */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(80% 50% at 50% 0%, rgba(124, 58, 237, 0.45) 0%, rgba(124, 58, 237, 0.20) 30%, rgba(0, 0, 0, 0) 70%)'
        }}
      />
      
      <div className="relative z-10 pb-16">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-black/60 border-b border-white/5 pt-16 pb-8">
          <div className="absolute inset-0 bg-[url('https://placehold.co/1920x400/000/111?text=+')] opacity-20 bg-cover bg-center -z-20" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-6">
          <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30 py-1 px-3 rounded-full text-sm">
            Beta Mode <Flame className="w-4 h-4 ml-1.5 inline text-[#7C3AED]" />
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent pb-2">
            Find Your Holy Grail.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            By the hobby. For the hobby. Shop highly vetted sellers with 100% transparency.
          </p>
          
          <SearchBar />
        </div>
      </div>

      {/* Live Stat Element Buffer Zone */}
      <div className="flex justify-center pt-6 pb-10">
        <TickerPill />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
        {/* Mobile Filters Drawer & Active Chips Row */}
        <div className="md:hidden mb-4 space-y-3">
          <div className="flex items-center">
            <FiltersDrawer />
          </div>
          <ActiveFilterChips />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Persistent Desktop Sidebar */}
          <div className="hidden md:block w-40 shrink-0">
            <FilterSidebar />
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0 space-y-8">
            <div className="hidden md:block mb-4">
              <ActiveFilterChips />
            </div>

            {/* Horizontal Dashboard Rails */}
            <CardRail 
              title={dbListings.length > 0 ? "Trending" : "No Results"} 
              icon={dbListings.length > 0 ? <Flame className="w-6 h-6 text-violet-600 fill-violet-600" /> : undefined}
              listings={recentListings} 
              seeAllHref="#" 
            />
            
            <div className="pt-8">
              {isSkipState && (
                <div className="mb-4">
                  <ForYouClient />
                </div>
              )}
              {recommendedMapped.length > 0 && (
                <CardRail 
                  title={isPersonalized ? "Recommended for You" : "Featured Listings"} 
                  listings={recommendedMapped} 
                  seeAllHref="/for-you" 
                />
              )}
              
              <div className="mt-8 flex items-center justify-between p-4 bg-violet-600/20 border border-violet-500/20 rounded-xl cursor-not-allowed group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-600/30 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Marketplace categories coming soon..</h3>
                    <p className="text-sm text-violet-300 group-hover:text-violet-200 transition-colors">More ways to explore</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-violet-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
