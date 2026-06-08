import { auth } from "@clerk/nextjs/server";
import { getMarketplaceTrendingListings } from "@/lib/db/queries/homeListings";
import { Flame } from "lucide-react";
import { ActiveListingsGrid } from "@/components/storefront/ActiveListingsGrid";
import { CosmosBackground } from "@/components/marketplace/CosmosBackground";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trending | Trax",
  description: "Trending card recommendations on Trax.",
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default async function ForYouPage() {
  const { userId } = await auth();
  
  // Reuse the premium trending pool from home
  const pool = await getMarketplaceTrendingListings();
  const shuffledPool = shuffleArray(pool).slice(0, 15);

  // ActiveListingsGrid expects photos to be string[], which getMarketplaceTrendingListings provides
  // But let's map it to ensure type safety matches ActiveListingsGrid interface
  const listings = shuffledPool.map(l => ({
    id: l.id,
    title: l.title,
    priceCents: l.priceCents,
    grade: l.grade,
    gradingCompany: l.gradingCompany,
    condition: l.condition,
    discountType: l.discountType,
    discountAmount: l.discountAmount,
    discountActiveUntil: l.discountActiveUntil,
    photos: Array.isArray(l.photos) ? l.photos : []
  }));

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#7C3AED]/30">
      <div className="relative z-0 overflow-hidden min-h-screen">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <CosmosBackground />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12">
        
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2">
            <Flame className="w-8 h-8 text-violet-600 fill-violet-600" />
            <h1 className="text-4xl font-bold tracking-tight">
              Trending
            </h1>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length > 0 ? (
          <ActiveListingsGrid 
            listings={listings} 
            isOwner={false} 
          />
        ) : (
          <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
            <p className="text-lg text-zinc-500">No listings found.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
