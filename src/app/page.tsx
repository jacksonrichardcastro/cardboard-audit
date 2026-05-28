import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Flame } from "lucide-react";
import { SearchBar } from "@/components/storefront/search-bar";
import { CardRail } from "@/components/storefront/card-rail";
import { getTrendingListings } from "@/lib/db/queries/listings";
import { FilterSidebar } from "@/components/storefront/filter-sidebar";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
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
  
  // Clean mapping standardizing Postgres arrays dynamically safely to existing UI constraints
  const listingsData = dbListings.map((d: any) => ({
    id: d.id,
    title: d.title,
    category: d.category as any,
    subcategory: "Other",
    condition: d.condition,
    grade: d.grade || undefined,
    gradingCompany: d.gradingCompany,
    priceCents: d.priceCents,
    photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
    sellerBusinessName: d.sellerName,
    createdAt: new Date().toISOString(),
    sport: d.sport || "",
    listingType: d.listingType || "BUY_IT_NOW",
    gradeTier: d.gradeTier || "Raw / Ungraded",
    era: d.era || "Modern (2010+)"
  }));

  // "Recently added" - sorted natively via DB query ordering (first 16)
  const recentListings = listingsData.slice(0, 16);

  // Recommendations Engine integration
  const { userId } = await auth();
  const prefs = await getUserPreferences();
  const rawRecommended = await getRecommendedListings(userId, 20);
  
  const recommendedMapped = rawRecommended.map((d: any) => ({
    id: d.id,
    title: d.title,
    category: d.category as any,
    subcategory: "Other",
    condition: d.condition,
    grade: d.grade || undefined,
    gradingCompany: d.gradingCompany,
    priceCents: d.priceCents,
    photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
    sellerBusinessName: d.sellerName,
    createdAt: new Date().toISOString(),
    sport: d.sport || "",
    listingType: d.listingType || "BUY_IT_NOW",
    gradeTier: d.gradeTier || "Raw / Ungraded",
    era: d.era || "Modern (2010+)"
  }));

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
    const activeListings = await db.select({ count: count() }).from(listings).where(eq(listings.status, 'ACTIVE'));
    const total = activeListings[0]?.count ?? 0;
    displayText = `${total.toLocaleString()} cards available right now`;
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-black/60 border-b border-white/5 pt-16 pb-8">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x400/000/111?text=+')] opacity-20 bg-cover bg-center -z-20" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-6">
          <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30 py-1.5 px-4 rounded-full text-sm">
            <ShieldCheck className="w-4 h-4 mr-2 inline" /> Every seller, hand-vetted.
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
        <Badge className="bg-slate-800/40 text-slate-300 border border-white/5 hover:bg-slate-800/60 py-1.5 px-4 rounded-full text-xs font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-[#7C3AED] mr-2 animate-pulse"></span>
          {displayText}
        </Badge>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
