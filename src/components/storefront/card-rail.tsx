"use client";

import { MockListing } from "@/lib/mock/listings";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface CardRailProps {
  title: string;
  listings: MockListing[];
  seeAllHref?: string;
}

export function CardRail({ title, listings, seeAllHref }: CardRailProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-4 md:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <Link 
          href={seeAllHref || "#"} 
          className="text-sm font-medium text-primary hover:underline flex items-center group"
        >
          See all
          <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Horizontal scrolling strip locking Fanatics collect swiping grids */}
      <div className="w-full overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 md:px-8">
        <div className="flex gap-3 w-max">
          {listings.map((listing) => (
            <Link 
              key={listing.id} 
              href={`/listing/${listing.id}`} 
              className="snap-start shrink-0 w-44 block"
            >
              <div className="rounded-md overflow-hidden bg-card border border-border/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 cursor-pointer">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-900">
                  <img
                    src={listing.photoUrl}
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
          ))}
        </div>
      </div>
    </div>
  );
}
