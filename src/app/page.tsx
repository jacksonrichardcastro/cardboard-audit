import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { SearchBar } from "@/components/storefront/search-bar";
import { CardRail } from "@/components/storefront/card-rail";
import { getTrendingListings } from "@/lib/db/queries/listings";
import { FilterSidebar } from "@/components/storefront/filter-sidebar";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export default async function Home() {
  const dbListings = await getTrendingListings({});
  
  // Clean mapping standardizing Postgres arrays dynamically safely to existing UI constraints
  const listingsData = dbListings.map((d: any) => ({
    id: d.id,
    title: d.title,
    category: d.category as any,
    subcategory: "Other",
    condition: d.condition,
    grade: d.grade || undefined,
    priceCents: d.priceCents,
    photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
    sellerBusinessName: d.sellerName,
    createdAt: new Date().toISOString()
  }));

  // "Recommended for you" - simple stable slice
  const recommendedListings = listingsData.filter((l: any) => l.category === "TCG" || l.category === "Graded").slice(0, 10);
  
  // "Recently added" - sorted natively via DB query ordering
  const recentListings = listingsData.slice(0, 10);

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
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-black/60 border-b border-white/5 pt-16 pb-8">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x400/000/111?text=+')] opacity-20 bg-cover bg-center -z-20" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-6">
          <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30 py-1.5 px-4 rounded-full text-sm">
            <ShieldCheck className="w-4 h-4 mr-2 inline" /> Every seller, hand-vetted.
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
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

      <div className="space-y-8 py-4">
        <div className="px-4 md:px-8">
          <FilterSidebar />
        </div>

        {/* Horizontal Dashboard Rails */}
        <CardRail 
          title="Recommended for you" 
          listings={recommendedListings} 
          seeAllHref="/search?sort=recommended" 
        />
        
        <CardRail 
          title="Recently added" 
          listings={recentListings} 
          seeAllHref="/search?sort=newest" 
        />
      </div>
    </div>
  );
}
