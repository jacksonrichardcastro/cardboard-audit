import { getTrendingListings } from "@/lib/db/queries/listings";
import Link from "next/link";
import React from "react";

export default async function TrendingPage() {
  const dbListings = await getTrendingListings({});
  
  const listings = dbListings.map((d: any) => ({
    id: d.id,
    title: d.title,
    category: d.category as any,
    condition: d.condition,
    grade: d.grade || undefined,
    priceCents: d.priceCents,
    photoUrl: Array.isArray(d.photos) ? d.photos[0] : (d.photos as any || 'https://placehold.co/400x550'),
    gradingCompany: d.gradingCompany || undefined,
  }));

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Trending Now</h1>
        <p className="text-muted-foreground mt-2 text-lg">What's moving on the marketplace this week.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {listings.map((listing: any) => (
          <Link 
            key={listing.id} 
            href={`/listings/${listing.id}`} 
            className="block"
          >
            <div className="rounded-md overflow-hidden bg-card border border-border/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 cursor-pointer">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-900">
                <img
                  src={listing.photoUrl}
                  alt={listing.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  draggable={false}
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
                    {listing.grade ? `${listing.gradingCompany || ""} ${listing.grade}` : listing.condition}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
