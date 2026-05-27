import { notFound } from "next/navigation";
import { RESERVED_HANDLES } from "@/lib/reserved-handles";
import { db } from "@/lib/db";
import { profiles, listings, users, cards, itemPhotos } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { SellerHero } from "@/components/shared/SellerHero";
import { ActiveListingsGrid } from "@/components/storefront/ActiveListingsGrid";
import { BinderGrid } from "@/components/shared/BinderGrid";
import { auth } from "@clerk/nextjs/server";
import { getPossessiveName } from "@/lib/utils/formatters";
import { Lock } from "lucide-react";
import { HeaderCustomizer } from "@/components/shared/HeaderCustomizer";

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

  const [profileRecord] = await db.select({
    profile: profiles,
    accountType: users.accountType
  })
  .from(profiles)
  .innerJoin(users, eq(profiles.userId, users.id))
  .where(sql`lower(${profiles.handle}) = ${handleLower}`)
  .limit(1);
  
  if (!profileRecord || profileRecord.profile.approvalStatus === "rejected") {
    return {};
  }
  const seller = profileRecord.profile;

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
  
  const [profileRecord] = await db.select({
    profile: profiles,
    accountType: users.accountType
  })
  .from(profiles)
  .innerJoin(users, eq(profiles.userId, users.id))
  .where(sql`lower(${profiles.handle}) = ${handleLower}`)
  .limit(1);

  if (!profileRecord || profileRecord.profile.approvalStatus === "rejected") {
    notFound();
  }
  const seller = profileRecord.profile;
  const isSellerLayout = profileRecord.accountType === "seller" && seller.kycStatus === "verified";
  
  const currentTab = searchParams.tab || (isSellerLayout ? "storefront" : "collection");

  // Fetch active listings for Storefront / Active Listings tab
  const activeListings = await db.select({
      id: listings.id,
      cardId: listings.cardId,
      title: listings.title,
      priceCents: listings.priceCents,
      grade: listings.grade,
      gradingCompany: listings.gradingCompany,
      condition: listings.condition,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
    })
    .from(listings)
    .where(and(
      eq(listings.sellerId, seller.userId),
      eq(listings.status, "ACTIVE")
    ))
    .orderBy(desc(listings.createdAt));

  // Fetch binder cards
  const binderCards = await db.select({
      id: cards.id,
      title: cards.title,
      category: cards.category,
      grade: cards.grade,
      gradingCompany: cards.gradingCompany,
      condition: cards.condition,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${cards.id}), '[]'::json)`,
    })
    .from(cards)
    .where(eq(cards.ownerId, seller.userId))
    .orderBy(desc(cards.createdAt));

  const isOwner = seller.userId === userId;
  const sellerName = seller.displayName || seller.businessName;
  const possessiveName = getPossessiveName(sellerName, isOwner);
  const grailId = seller.grailCardId || (binderCards.length > 0 ? binderCards[0].id : null);
  
  const tabs = isSellerLayout 
    ? [
        { id: "storefront", label: "Storefront", possessive: "Storefront" },
        { id: "binder", label: "Binder", possessive: "Binder" },
        { id: "ratings", label: "Ratings", possessive: "Ratings" },
        { id: "blog", label: "Blog", possessive: "Blog" }
      ]
    : [
        { id: "collection", label: "Collection", possessive: "Binder" },
        { id: "active-listings", label: "Active Listings", possessive: "Listings" },
        { id: "ratings", label: "Ratings", possessive: "Ratings" },
        { id: "blog", label: "Blog", possessive: "Blog" }
      ];

  const currentTabInfo = tabs.find(t => t.id === currentTab) || tabs[0];

  // Derive hero shelf cards
  // User selected IDs in profile.headerCustomizationIds (if array)
  const headerIds = Array.isArray(seller.headerCustomizationIds) ? seller.headerCustomizationIds : [];
  
  // If owner customized, pick those from binder. Else fallback to top 8 active listings, else top 8 binder cards.
  let heroCardsData = [];
  if (headerIds.length > 0) {
    heroCardsData = binderCards.filter(c => headerIds.includes(c.id));
  } else if (activeListings.length > 0) {
    heroCardsData = activeListings;
  } else {
    heroCardsData = binderCards;
  }

  const formattedHeroCards = heroCardsData.slice(0, 8).map(item => ({
    id: item.id.toString(),
    url: (item.photos && item.photos[0]) ? item.photos[0] : 'https://placehold.co/300x400/1a1a1a/333333?text=PSA+10'
  }));

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
          heroCards={formattedHeroCards}
          customizerNode={isOwner ? <HeaderCustomizer cards={binderCards} selectedIds={headerIds as number[]} /> : undefined}
        />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        
        {/* Navigation Tabs Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/10 mb-6 mt-0 gap-4 relative">
          <nav className="flex items-center gap-6 overflow-x-auto pb-[-1px] scrollbar-hide relative z-10">
            {tabs.map((tab) => (
              <Link 
                key={tab.id}
                href={`/${seller.handle}?tab=${tab.id}`}
                className={`pb-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${currentTab === tab.id ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          
          {/* Center Dynamic Title (Visible on larger screens to prevent crowding) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 hidden lg:block pointer-events-none">
            <h2 className="text-xl font-[family-name:var(--font-display)] font-light tracking-[0.1em] uppercase text-white">
              {possessiveName} {currentTabInfo.possessive}
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
          {(currentTab === "collection" || (currentTab === "binder" && !seller.binderPrivate)) && (
            <BinderGrid 
              isOwner={isOwner}
              sellerName={sellerName}
              cards={binderCards} 
              activeListings={activeListings}
              grailCardId={grailId}
            />
          )}

          {currentTab === "binder" && seller.binderPrivate && !isOwner && (
            <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
              <Lock className="w-8 h-8 text-zinc-500 mx-auto mb-4" />
              <p className="text-lg text-zinc-400">{sellerName}'s binder is private.</p>
            </div>
          )}

          {currentTab === "binder" && seller.binderPrivate && isOwner && (
            <div className="mb-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-200 text-sm flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Your binder is currently private. Only you can see this tab.
            </div>
          )}

          {currentTab === "binder" && seller.binderPrivate && isOwner && (
            <BinderGrid 
              isOwner={isOwner}
              sellerName={sellerName}
              cards={binderCards} 
              activeListings={activeListings}
              grailCardId={grailId}
            />
          )}

          {(currentTab === "storefront" || currentTab === "active-listings") && activeListings.length > 0 && (
            <ActiveListingsGrid 
              isOwner={isOwner}
              listings={activeListings} 
            />
          )}

          {(currentTab === "storefront" || currentTab === "active-listings") && activeListings.length === 0 && (
            <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5 flex flex-col items-center">
              <p className="text-lg text-zinc-500 mb-2">No active listings...yet 👀</p>
              {!isSellerLayout && <p className="text-sm text-zinc-600">Want to sell on Trax? Upgrade to a Seller account.</p>}
            </div>
          )}

          {currentTab === "ratings" && (
            <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
              <p className="text-lg text-zinc-500">{isSellerLayout ? "No seller ratings yet." : "No buyer ratings."}</p>
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
