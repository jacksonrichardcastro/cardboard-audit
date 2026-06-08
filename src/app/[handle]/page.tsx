import { notFound, redirect } from "next/navigation";
import { RESERVED_HANDLES } from "@/lib/reserved-handles";
import { db } from "@/lib/db";
import { QuickUploadModal } from "@/components/sell/QuickUploadModal";
import { profiles, listings, users, cards, itemPhotos, categories, handleHistory } from "@/lib/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { SellerHero } from "@/components/shared/SellerHero";
import { ActiveListingsGrid } from "@/components/storefront/ActiveListingsGrid";
import { BinderGrid } from "@/components/shared/BinderGrid";
import { auth } from "@clerk/nextjs/server";
import { getPossessiveName } from "@/lib/utils/formatters";
import { Lock, Plus, ListTree, Settings, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderCustomizer } from "@/components/shared/HeaderCustomizer";
import { CosmosBackground } from "@/components/marketplace/CosmosBackground";
import { StorefrontControls } from "@/components/storefront/StorefrontControls";
import { BinderValueToggle } from "@/components/shared/binder-value-toggle";
import { FiltersDrawer } from "@/components/storefront/FiltersDrawer";
import { ActiveFilterChips } from "@/components/storefront/ActiveFilterChips";
import { CategoryRows } from "@/components/storefront/CategoryRows";
import { like, lte, gte, between } from "drizzle-orm";

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const handleLower = params.handle.toLowerCase();
  
  if (RESERVED_HANDLES.has(handleLower)) {
    return {};
  }

  const [profileRecord] = await db.select({
    profile: profiles,
    accountType: users.accountType,
    storefrontLayout: users.storefrontLayout,
    isFoundingSeller: users.isFoundingSeller
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
      url: `https://trax.cards/${seller.handle}`,
      siteName: 'Trax',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} on Trax`,
      description,
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
    accountType: users.accountType,
    storefrontLayout: users.storefrontLayout,
    isFoundingSeller: users.isFoundingSeller
  })
  .from(profiles)
  .innerJoin(users, eq(profiles.userId, users.id))
  .where(sql`lower(${profiles.handle}) = ${handleLower}`)
  .limit(1);

  if (!profileRecord || profileRecord.profile.approvalStatus === "rejected") {
    // Check handle history for old handles
    const historyEntry = await db.query.handleHistory.findFirst({
      where: sql`LOWER(${handleHistory.oldHandle}) = ${handleLower}`,
      orderBy: desc(handleHistory.changedAt),
    });
    
    if (historyEntry) {
      const currentProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, historyEntry.userId)
      });
      if (currentProfile?.handle) {
        redirect(`/${currentProfile.handle}`);
      }
    }
    
    notFound();
  }
  const seller = profileRecord.profile;
  const isSellerLayout = profileRecord.accountType === "seller" && seller.kycStatus === "verified";
  const storefrontLayout = profileRecord.storefrontLayout;
  
  console.log(`[Cache Bust] seller.isFoundingSeller for ${handleLower} =`, profileRecord.isFoundingSeller);
  
  const currentTab = searchParams.tab || (isSellerLayout ? "active-listings" : "collection");

  const activeConditions = [
    eq(listings.sellerId, seller.userId),
    inArray(listings.status, ["active", "pending_marketplace_activation"])
  ];

  if (searchParams.sport) {
    if (searchParams.sport === 'tcg' || searchParams.sport === 'non-sport') {
      activeConditions.push(like(listings.sport, `${searchParams.sport}%`));
    } else {
      activeConditions.push(eq(listings.sport, searchParams.sport));
    }
  }
  
  if (searchParams.listing_type) {
    activeConditions.push(eq(listings.listingType, searchParams.listing_type));
  }

  if (searchParams.grade) {
    const gradeMap: Record<string, string> = {
      'psa-10': 'PSA 10',
      'psa-9': 'PSA 9',
      'other-graded': 'Other Graded',
      'raw': 'Raw / Ungraded'
    };
    if (gradeMap[searchParams.grade]) {
      activeConditions.push(eq(listings.gradeTier, gradeMap[searchParams.grade]));
    }
  }

  if (searchParams.era) {
    activeConditions.push(eq(listings.era, searchParams.era));
  }

  if (searchParams.price) {
    if (searchParams.price === 'under-50') activeConditions.push(lte(listings.priceCents, 5000));
    else if (searchParams.price === '50-200') activeConditions.push(between(listings.priceCents, 5000, 20000));
    else if (searchParams.price === '200-1000') activeConditions.push(between(listings.priceCents, 20000, 100000));
    else if (searchParams.price === '1000-5000') activeConditions.push(between(listings.priceCents, 100000, 500000));
    else if (searchParams.price === '5000-plus') activeConditions.push(gte(listings.priceCents, 500000));
  }

  // Fetch active listings for Storefront / Active Listings tab
  const activeListings = await db.select({
      id: listings.id,
      cardId: listings.cardId,
      title: listings.title,
      priceCents: listings.priceCents,
      grade: listings.grade,
      gradingCompany: listings.gradingCompany,
      condition: listings.condition,
      discountType: listings.discountType,
      discountAmount: listings.discountAmount,
      discountActiveUntil: listings.discountActiveUntil,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE item_photos.card_id = listings.card_id), '[]'::json)`,
    })
    .from(listings)
    .where(and(...activeConditions))
    .orderBy(desc(listings.createdAt));

  // Fetch unfiltered active listings for the header strip fallback
  const unfilteredActiveListings = await db.select({
      id: listings.id,
      cardId: listings.cardId,
      title: listings.title,
      priceCents: listings.priceCents,
      grade: listings.grade,
      gradingCompany: listings.gradingCompany,
      condition: listings.condition,
      discountType: listings.discountType,
      discountAmount: listings.discountAmount,
      discountActiveUntil: listings.discountActiveUntil,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE item_photos.card_id = listings.card_id), '[]'::json)`,
    })
    .from(listings)
    .where(and(eq(listings.sellerId, seller.userId), inArray(listings.status, ["active", "pending_marketplace_activation"])))
    .orderBy(desc(listings.createdAt));

  // Fetch binder cards (all cards owned by the user, or linked to their listings)
  const rawBinderCards = await db.select({
      id: cards.id,
      title: cards.title,
      category: cards.category,
      grade: cards.grade,
      gradingCompany: cards.gradingCompany,
      condition: cards.condition,
      priceCents: listings.priceCents,
      listingId: listings.id,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE item_photos.card_id = cards.id), '[]'::json)`,
    })
    .from(cards)
    .leftJoin(listings, eq(cards.id, listings.cardId))
    .where(
      sql`${cards.ownerId} = ${seller.userId} OR (${listings.sellerId} = ${seller.userId} AND ${listings.deletedAt} IS NULL)`
    )
    .orderBy(desc(cards.createdAt));

  // Deduplicate in case a card has multiple listings
  const binderCards = Array.from(new Map(rawBinderCards.map(c => [c.id, c])).values());

  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, seller.userId),
    orderBy: (c) => [c.displayOrder],
    with: {
      memberships: true
    }
  });

  const isOwner = seller.userId === userId;
  const isPreview = searchParams.preview === "true";
  const displayAsOwner = isOwner && !isPreview;
  const sellerName = seller.displayName || seller.businessName || "Seller";
  const possessiveName = getPossessiveName(sellerName, isOwner);
  const grailId = seller.grailCardId || (binderCards.length > 0 ? binderCards[0].id : null);
  
  const theme = seller.storefrontTheme || 'trax-default';
  const themeScope = seller.storefrontThemeScope || 'storefront-only';
  
  let pendingCategoryCount = 0;
  if (displayAsOwner && storefrontLayout === "categories") {
    const categorizedCardIds = new Set();
    userCategories.forEach(c => {
      if (c.memberships) {
        c.memberships.forEach((m: any) => categorizedCardIds.add(m.cardId));
      }
    });
    pendingCategoryCount = binderCards.filter(c => !categorizedCardIds.has(c.id)).length;
  }
  
  const tabs = isSellerLayout 
    ? [
        { id: "storefront", label: "Storefront", possessive: "Storefront" },
        { id: "binder", label: pendingCategoryCount > 0 ? (
          <span className="flex items-center gap-1.5">
            Binder
            <span className="bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#7C3AED] px-1.5 py-[1px] rounded font-bold text-[10px] leading-none">{pendingCategoryCount} waiting</span>
          </span>
        ) : "Binder", possessive: "Binder" },
        { id: "ratings", label: "Ratings", possessive: "Ratings" },
        { id: "blog", label: "Blog", possessive: "Blog" }
      ]
    : [
        { id: "collection", label: pendingCategoryCount > 0 ? (
          <span className="flex items-center gap-1.5">
            Collection
            <span className="bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#7C3AED] px-1.5 py-[1px] rounded font-bold text-[10px] leading-none">{pendingCategoryCount} waiting</span>
          </span>
        ) : "Collection", possessive: "Binder" },
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
  } else if (unfilteredActiveListings.length > 0) {
    heroCardsData = unfilteredActiveListings;
  } else {
    heroCardsData = binderCards;
  }

  // Programmatic diverse alternating selector for hero strip
  const seenTitles = new Set();
  const dedupedHeroCardsData: any[] = [];
  for (const c of heroCardsData) {
    const baseTitle = c.title.split('#')[0].split('(')[0].trim().toLowerCase();
    if (!seenTitles.has(baseTitle)) {
      seenTitles.add(baseTitle);
      dedupedHeroCardsData.push(c);
    }
  }

  // Alternate them manually to prevent any clumping
  const alternatingCards: any[] = [];
  const demoCategories: Record<string, any[]> = { "Sports": [], "TCG": [], "Other": [] };
  dedupedHeroCardsData.forEach(c => {
    const cat = c.category || "Other";
    if (!demoCategories[cat]) demoCategories[cat] = [];
    demoCategories[cat].push(c);
  });
  
  let added = true;
  while (added) {
    added = false;
    for (const key of Object.keys(demoCategories)) {
      if (demoCategories[key].length > 0) {
        alternatingCards.push(demoCategories[key].shift());
        added = true;
      }
    }
  }

  const formattedHeroCards = alternatingCards.slice(0, 19).map(item => ({
    id: item.id.toString(),
    url: (item.photos && item.photos[0]) ? item.photos[0] : 'https://placehold.co/300x400/1a1a1a/333333?text=PSA+10',
    title: item.title || "Unknown Card",
    activeListingId: item.cardId ? item.id : item.listingId
  }));

  return (
    <div className={`min-h-screen bg-black text-white selection:bg-[#7C3AED]/30 relative ${theme === 'trax-cosmos' && themeScope === 'profile-wide' ? 'overflow-hidden' : ''}`}>
      {/* Ambient background glow */}
      {theme === "trax-default" && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(80% 50% at 50% 0%, rgba(124, 58, 237, 0.45) 0%, rgba(124, 58, 237, 0.20) 30%, rgba(0, 0, 0, 0) 70%)'
          }}
        />
      )}
      {theme === "trax-cosmos" && themeScope === "profile-wide" && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <CosmosBackground />
        </div>
      )}
      <div className="relative z-10">
        <SellerHero 
          name={sellerName}
          handle={seller.handle || ''}
          bio={seller.bio}
          avatarUrl={seller.profilePhotoUrl}
          headerStyle={seller.headerStyle}
          bannerImageUrl={seller.bannerImageUrl}
          isOwner={displayAsOwner}
          sellerId={seller.userId}
          badges={(seller.badges as string[]) || []}
          isFoundingSeller={profileRecord.isFoundingSeller}
          identityVerified={seller.identityVerified}
          hiddenBadges={(seller.hiddenBadges as string[]) || []}
          presenceStatus={seller.presenceStatus}
          locationCity={seller.locationCity}
          locationState={seller.locationState}
          heroCards={formattedHeroCards}
          transparentBackground={theme === 'trax-cosmos' && themeScope === 'profile-wide'}
          customizerNode={
            displayAsOwner ? (
              <HeaderCustomizer 
                cards={binderCards} 
                selectedIds={headerIds}
                headerStyle={seller.headerStyle || 'cards'}
                bannerImageUrl={seller.bannerImageUrl}
                triggerNode={
                  <button className="absolute top-2 right-2 z-50 flex items-center justify-center w-11 h-11 bg-black/60 text-zinc-300 hover:text-white rounded-full hover:bg-black/80 transition-all backdrop-blur-sm shadow-md border border-white/10" title="Customize Header">
                    <Pencil className="w-5 h-5" /> 
                  </button>
                }
              />
            ) : null
          }
        />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        
        {isOwner && (
          <div id="storefront-controls-wrapper" className="flex justify-end pt-4 relative z-50">
            <StorefrontControls layout={storefrontLayout as "grid" | "categories"} sellerId={seller.userId} sellerHandle={seller.handle || ''} isPreview={isPreview} cards={binderCards} headerIds={headerIds as number[]} theme={theme} themeScope={themeScope} />
          </div>
        )}



        {/* Navigation Tabs Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/10 mb-6 mt-0 pt-6 md:pt-8 gap-4 relative">
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

          <div className="pb-4 flex items-center z-10 gap-2">
            {displayAsOwner && currentTab !== "blog" && currentTab !== "ratings" && (
              <QuickUploadModal />
            )}
            <FiltersDrawer />
            <BinderValueToggle isOwner={displayAsOwner} />
          </div>
        </div>

        {/* Tab Content Areas */}
        <div className={`relative min-h-[400px] ${theme === 'trax-cosmos' && themeScope === 'storefront-only' ? 'overflow-hidden' : ''}`}>
          {theme === "trax-cosmos" && themeScope === "storefront-only" && (
            <div className="absolute inset-0 z-0 -mx-4 md:-mx-8">
              <CosmosBackground />
            </div>
          )}
          <div className="relative z-10">
          {(currentTab === "storefront" || currentTab === "active-listings") && (
            <ActiveFilterChips />
          )}

          {(currentTab === "collection" || (currentTab === "binder" && !seller.binderPrivate)) && (
            storefrontLayout === "categories" && userCategories.length > 0 ? (
              <CategoryRows 
                categories={userCategories} 
                cards={binderCards} 
                isOwner={displayAsOwner} 
                sellerName={sellerName}
                tab="binder"
                allBinderCards={binderCards}
              />
            ) : (
              <BinderGrid 
                isOwner={displayAsOwner}
                sellerName={sellerName}
                cards={binderCards} 
                activeListings={activeListings as any}
                grailCardId={grailId}
              />
            )
          )}

          {currentTab === "binder" && seller.binderPrivate && !displayAsOwner && (
            <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
              <Lock className="w-8 h-8 text-zinc-500 mx-auto mb-4" />
              <p className="text-lg text-zinc-400">{sellerName}'s binder is private.</p>
            </div>
          )}

          {currentTab === "binder" && seller.binderPrivate && displayAsOwner && (
            <div className="mb-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-200 text-sm flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Your binder is currently private. Only you can see this tab.
            </div>
          )}

          {currentTab === "binder" && seller.binderPrivate && displayAsOwner && (
            <BinderGrid 
              isOwner={displayAsOwner}
              sellerName={sellerName}
              cards={binderCards} 
              activeListings={activeListings}
              grailCardId={grailId}
            />
          )}

          {(currentTab === "storefront" || currentTab === "active-listings") && activeListings.length > 0 && (
            storefrontLayout === "categories" && userCategories.length > 0 ? (
              <CategoryRows 
                categories={userCategories} 
                cards={activeListings as any[]} 
                isOwner={displayAsOwner}
                sellerName={sellerName}
                tab="storefront"
                allBinderCards={binderCards}
              />
            ) : (
              <ActiveListingsGrid 
                isOwner={displayAsOwner}
                listings={activeListings as any} 
              />
            )
          )}

          {(currentTab === "storefront" || currentTab === "active-listings") && activeListings.length === 0 && (
            storefrontLayout === "categories" && userCategories.length > 0 ? (
              <CategoryRows 
                categories={userCategories} 
                cards={[]} 
                isOwner={displayAsOwner}
                sellerName={sellerName}
                tab="storefront"
                allBinderCards={binderCards}
              />
            ) : (
              <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5 flex flex-col items-center">
                <p className="text-lg text-zinc-500 mb-2">No listings yet. Draft your first listing to get started.</p>
                {!isSellerLayout && <p className="text-sm text-zinc-600">Want to sell on Trax? Upgrade to a Seller account.</p>}
              </div>
            )
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
        </div>
      </main>
      </div>
    </div>
  );
}
