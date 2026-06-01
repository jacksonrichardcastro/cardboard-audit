import { db } from "@/lib/db";
import { listings, profiles, itemPhotos } from "@/lib/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";
import { SearchBar } from "@/components/storefront/search-bar";
import { CardRail } from "@/components/storefront/card-rail";
import { Frown } from "lucide-react";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";

  let results: any[] = [];
  
  if (q.trim()) {
    const rawResults = await db.select({
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
      createdAt: listings.createdAt,
    })
    .from(listings)
    .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
    .where(and(
      eq(listings.status, "active"),
      ilike(listings.title, `%${q}%`)
    ))
    .orderBy(sql`created_at DESC`)
    .limit(50);

    results = rawResults.map(d => ({
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
    }));
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Search Catalog</h1>
        <div className="mb-12">
          <SearchBar />
        </div>

        {q ? (
          results.length > 0 ? (
            <CardRail 
              title={`Results for "${q}"`} 
              listings={results} 
            />
          ) : (
            <div className="text-center py-20 bg-zinc-950/50 rounded-xl border border-white/5">
              <Frown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No active listings found</h2>
              <p className="text-muted-foreground">Try adjusting your search terms.</p>
            </div>
          )
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            Enter a search term above to find cards.
          </div>
        )}
      </div>
    </div>
  );
}
