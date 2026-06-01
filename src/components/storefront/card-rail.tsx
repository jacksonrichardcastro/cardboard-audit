"use client";

import { MockListing } from "@/lib/mock/listings";
import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";

interface CardRailProps {
  title: string;
  icon?: React.ReactNode;
  listings: MockListing[];
  seeAllHref?: string;
}

export function CardRail({ title, icon, listings, seeAllHref }: CardRailProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        </div>
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
              href={`/listings/${listing.id}`} 
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
                  {listing.discountType && listing.discountAmount && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-sm border border-white/10 flex items-center gap-1 z-10 pointer-events-none">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px] font-bold text-white">
                        {listing.discountType === 'percent' 
                          ? `${listing.discountAmount / 100}% OFF` 
                          : `$${(listing.discountAmount / 100).toFixed(0)} OFF`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  <h3 className="text-sm font-medium line-clamp-1 text-foreground" title={listing.title}>
                    {listing.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {listing.discountType && listing.discountAmount && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <p className={`text-base font-semibold ${listing.discountType ? "text-primary" : "text-foreground"}`}>
                        ${((listing.discountType === 'percent' 
                          ? listing.priceCents * (1 - (listing.discountAmount || 0) / 10000)
                          : listing.discountType === 'dollar'
                          ? Math.max(0, listing.priceCents - (listing.discountAmount || 0))
                          : listing.priceCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
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
