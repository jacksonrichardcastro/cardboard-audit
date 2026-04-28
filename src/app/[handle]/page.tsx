import { notFound } from "next/navigation";
import { RESERVED_HANDLES } from "@/lib/reserved-handles";
import { db } from "@/lib/db";
import { sellers, listings } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ handle: string }>;
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
  const params = await props.params;
  const handleLower = params.handle.toLowerCase();

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

  const memberSince = seller.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header Block */}
      <div className="border-b border-white/10 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 flex flex-col items-center text-center">
          {seller.profilePhotoUrl ? (
            <img src={seller.profilePhotoUrl} alt="Profile" className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover mb-6 border-4 border-background" />
          ) : (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-violet-600 flex items-center justify-center text-5xl md:text-6xl font-bold mb-6 border-4 border-background">
              {(seller.displayName || seller.businessName).charAt(0).toUpperCase()}
            </div>
          )}
          
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            {seller.displayName || seller.businessName}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">@{seller.handle}</p>
          
          {seller.bio && (
            <p className="max-w-xl text-foreground mb-6">{seller.bio}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {seller.locationCity && (
              <span>{seller.locationCity}{seller.locationState ? `, ${seller.locationState}` : ''}</span>
            )}
            {seller.locationCity && <span>•</span>}
            <span>Member since {memberSince}</span>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Active Listings</h2>
          <span className="bg-primary/20 text-primary py-1 px-3 rounded-full text-sm font-medium">
            {activeListings.length} {activeListings.length === 1 ? 'card' : 'cards'}
          </span>
        </div>

        {activeListings.length === 0 ? (
          <div className="text-center py-24 bg-card/30 rounded-xl border border-white/10">
            <p className="text-lg text-muted-foreground">No active listings right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeListings.map((listing) => {
              const photoUrl = (Array.isArray(listing.photos) && listing.photos.length > 0 && listing.photos[0] !== null) ? listing.photos[0] : 'https://placehold.co/400x550';
              
              return (
                <Link 
                  key={listing.id} 
                  href={`/listings/${listing.id}`} 
                  className="block"
                >
                  <div className="rounded-md overflow-hidden bg-card border border-border/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 cursor-pointer">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-900">
                      <img
                        src={photoUrl}
                        alt={listing.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        draggable={false}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                        }}
                      />
                    </div>
                    <div className="p-2 space-y-1">
                      <h3 className="text-sm font-medium line-clamp-1 text-foreground" title={listing.title}>
                        {listing.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-foreground">
                          ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground truncate ml-2">
                          {listing.grade ? `${listing.gradingCompany} ${listing.grade}` : listing.condition}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
