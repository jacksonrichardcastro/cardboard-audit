import { notFound } from "next/navigation";
import { RESERVED_HANDLES } from "@/lib/reserved-handles";
import { db } from "@/lib/db";
import { sellers, listings } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { ProfileHeader } from "@/components/shared/ProfileHeader";
import { SellerHero } from "@/components/shared/SellerHero";
import { ActiveListingsGrid } from "@/components/storefront/ActiveListingsGrid";
import { BinderGrid } from "@/components/shared/BinderGrid";
import { auth } from "@clerk/nextjs/server";

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
  const grailId = seller.grailListingId || (activeListings.length > 0 ? activeListings[0].id : null);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#7C3AED]/30">
      <ProfileHeader />
      
      <SellerHero 
        name={seller.displayName || seller.businessName}
        handle={seller.handle || ''}
        bio={seller.bio}
        avatarUrl={seller.profilePhotoUrl}
        headerStyle={seller.headerStyle}
        bannerImageUrl={seller.bannerImageUrl}
        // Passing the listings photos to the background shelf if they exist
        heroCards={activeListings.slice(0, 8).map(l => ({ 
          id: l.id.toString(), 
          url: (l.photos && l.photos[0]) ? l.photos[0] : 'https://placehold.co/300x400/1a1a1a/333333?text=PSA+10' 
        }))}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
        
        {/* Navigation Tabs Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 mb-8 mt-4 gap-4">
          <nav className="flex items-center gap-6 overflow-x-auto pb-[-1px] scrollbar-hide">
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
          
          <div className="pb-4 flex items-center">
            <span className="text-xs md:text-sm font-medium text-zinc-400">
              Trusted by <span className="text-white">12,500+</span>
            </span>
          </div>
        </div>

        {/* Tab Content Areas */}
        <div className="min-h-[400px]">
          {currentTab === "collection" && (
            <BinderGrid 
              isOwner={isOwner}
              listings={activeListings} 
              grailListingId={grailId}
              collectionValueCents={isOwner ? 2450000 : 0} // Uses a hardcoded mock value for owner just for V1 prototype until tracker is integrated
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
  );
}
