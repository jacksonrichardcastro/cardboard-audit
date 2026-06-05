import { auth } from "@clerk/nextjs/server";
import { getRecommendedListings } from "@/lib/recommendations/score";
import { getUserPreferences } from "@/app/actions/preferences";
import { Flame, ChevronRight } from "lucide-react";
import { ForYouClient } from "@/components/recommendations/ForYouClient";
import { ActiveListingsGrid } from "@/components/storefront/ActiveListingsGrid";
import { CosmosBackground } from "@/components/marketplace/CosmosBackground";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "For You — Trax",
  description: "Personalized card recommendations on Trax.",
};

export default async function ForYouPage() {
  const { userId } = await auth();
  const prefs = await getUserPreferences();
  
  // We use the recommendation engine for both Hot and For You
  const listings = await getRecommendedListings(userId, 30);
  
  const hasPreferences = !!(prefs && prefs.sportCategories && prefs.sportCategories.length > 0);
  
  const isLoggedOut = !userId;
  const isSkipState = userId && !hasPreferences;
  const isPersonalized = userId && hasPreferences;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#7C3AED]/30">
      <div className="relative overflow-hidden min-h-screen">
        <CosmosBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12">
        
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2">
            <Flame className="w-8 h-8 text-violet-600 fill-violet-600" />
            <h1 className="text-4xl font-bold tracking-tight">
              {isPersonalized ? "For You" : isSkipState ? "For You" : "Hot"}
            </h1>
          </div>
          <p className="text-zinc-400 text-lg">
            {isPersonalized 
              ? "Personalized for what you collect" 
              : "What's moving on Trax right now"}
          </p>
        </div>

        {/* Client component for modal and soft prompt state */}
        {!isPersonalized && userId && (
          <ForYouClient />
        )}

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
