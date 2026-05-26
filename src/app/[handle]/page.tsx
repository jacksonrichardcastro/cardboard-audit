import { notFound } from "next/navigation";
import { RESERVED_HANDLES } from "@/lib/reserved-handles";
import { db } from "@/lib/db";
import { sellers, listings } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { SellerHero } from "@/components/shared/SellerHero";
import { ActiveListingsGrid } from "@/components/storefront/ActiveListingsGrid";
import { BinderGrid } from "@/components/shared/BinderGrid";
import { auth } from "@clerk/nextjs/server";
import { getPossessiveName } from "@/lib/utils/formatters";
import { Lock } from "lucide-react";

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const handleLower = params.handle.toLowerCase();
  
  if (RESERVED_HANDLES.has(handleLower)) {
    return {};
  }

  const [seller] = await db.select().from(sellers).where(sql`lower(${sellers.handle}) = ${handleLower}`).limit(1);
  
  if (!seller || seller.approvalStatus !== "approved") {
    return {};
  }

  const displayName = seller.displayName || seller.businessName;
  const description = seller.bio ? seller.bio : `${displayName}'s card collection on Trax.`;

  return {
    title: `${displayName} (@${seller.handle}) — Trax`,
    description,
    openGraph: {
      title: `${displayName} on Trax`,
      description,
      images: seller.profilePhotoUrl ? [seller.profilePhotoUrl] : [],
    },
  };
}

export default async function SellerStorePage(props: Props) {
  const { userId } = await auth();
  const params = await props.params;
  const searchParams = await props.searchParams;
  const handleLower = params.handle.toLowerCase();
  
  // Default to collection tab if none specified
  const currentTab = searchParams.tab || "collection"; 

  if (RESERVED_HANDLES.has(handleLower)) {
    notFound();
  }

  const [seller] = await db.select().from(sellers).where(sql`lower(${sellers.handle}) = ${handleLower}`).limit(1);

  if (!seller || seller.approvalStatus !== "approved") {
    notFound();
  }

  const activeListings = await db.select({
      id: listings.id,
      title: listings.title,
      priceCents: listings.priceCents,
      grade: listings.grade,
      gradingCompany: listings.gradingCompany,
      condition: listings.condition,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM listing_photos WHERE listing_id = ${listings.id}), '[]'::json)`,
    })
    .from(listings)
    .where(and(
      eq(listings.sellerId, seller.userId),
      eq(listings.status, "ACTIVE")
    ))
    .orderBy(desc(listings.createdAt));

  const isOwner = seller.userId === userId;
  const sellerName = seller.displayName || seller.businessName;
  const possessiveName = getPossessiveName(sellerName, isOwner);
  const grailId = seller.grailListingId || (activeListings.length > 0 ? activeListings[0].id : null);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#7C3AED]/30 relative">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#7C3AED]/10 via-black to-black opacity-50 z-0" />
      
      <div className="relative z-10">
        <SellerHero 
          name={sellerName}
          handle={seller.handle || ''}
          bio={seller.bio}
          avatarUrl={seller.profilePhotoUrl}
          headerStyle={seller.headerStyle}
          bannerImageUrl={seller.bannerImageUrl}
          isOwner={isOwner}
          sellerId={seller.userId}
        // Passing the listings photos to the background shelf if they exist
        heroCards={activeListings.slice(0, 8).map(l => ({ 
          id: l.id.toString(), 
          url: (l.photos && l.photos[0]) ? l.photos[0] : 'https://placehold.co/300x400/1a1a1a/333333?text=PSA+10' 
        }))}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
        
        {/* Navigation Tabs Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/10 mb-8 mt-4 gap-4 relative">
          <nav className="flex items-center gap-6 overflow-x-auto pb-[-1px] scrollbar-hide relative z-10">
            <Link 
              href={`/${seller.handle}?tab=collection`}
              className={`pb-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${currentTab === 'collection' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Collection
            </Link>
            <Link 
              href={`/${seller.handle}?tab=active-listings`}
              className={`pb-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${currentTab === 'active-listings' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Active Listings
            </Link>
            <Link 
              href={`/${seller.handle}?tab=ratings`}
              className={`pb-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${currentTab === 'ratings' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Ratings
            </Link>
            <Link 
              href={`/${seller.handle}?tab=blog`}
              className={`pb-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${currentTab === 'blog' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Blog
            </Link>
          </nav>
          
          {/* Center Dynamic Title (Visible on larger screens to prevent crowding) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 hidden lg:block pointer-events-none">
            <h2 className="text-xl font-[family-name:var(--font-display)] font-light tracking-[0.1em] uppercase text-white">
              {currentTab === 'collection' ? `${possessiveName} Binder` : 
               currentTab === 'active-listings' ? `${possessiveName} Listings` :
               currentTab === 'ratings' ? `${possessiveName} Ratings` :
               `${possessiveName} Blog`}
            </h2>
          </div>

          <div className="pb-4 flex items-center z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-white/5">
              <Lock className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-400">
                {isOwner ? `$${(2450000 / 100).toLocaleString()}` : "Private Value"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Content Areas */}
        <div className="min-h-[400px]">
          {currentTab === "collection" && (
            <BinderGrid 
              isOwner={isOwner}
              sellerName={sellerName}
              listings={activeListings} 
              grailListingId={grailId}
            />
          )}

          {currentTab === "active-listings" && (
            <ActiveListingsGrid 
              isOwner={isOwner}
              grailListingId={grailId}
              listings={activeListings} 
            />
          )}

          {currentTab === "ratings" && (
            <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
              <p className="text-lg text-zinc-500">Ratings coming soon.</p>
            </div>
          )}

          {currentTab === "blog" && (
            <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
              <p className="text-lg text-zinc-500">Blog posts coming soon.</p>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
