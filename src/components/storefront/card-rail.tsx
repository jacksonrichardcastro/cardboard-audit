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
    <div className="w-full space-y-4 -mx-4 md:mx-0 w-[calc(100%+32px)] md:w-full">
      <div className="flex items-center justify-between px-4 md:px-0">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        </div>
        {seeAllHref && seeAllHref !== "#" && (
          <Link 
            href={seeAllHref} 
            className="text-sm font-medium text-primary hover:underline flex items-center group"
          >
            See all
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* Horizontal scrolling strip locking Fanatics collect swiping grids */}
      <div className="w-full overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-px-4 md:scroll-px-0">
        <div className="flex gap-3 w-max px-4 md:px-0">
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
                </div>
                <div className="p-2 space-y-1">
                  <h3 className="text-sm font-medium line-clamp-1 text-foreground" title={listing.title}>
                    {listing.title}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {listing.discountType && listing.discountAmount ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground line-through">
                          ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-base font-semibold text-primary">
                            ${((listing.discountType === 'percent' 
                              ? listing.priceCents * (1 - (listing.discountAmount || 0) / 10000)
                              : listing.discountType === 'dollar'
                              ? Math.max(0, listing.priceCents - (listing.discountAmount || 0))
                              : listing.priceCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className="bg-primary/20 border border-primary/50 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider whitespace-nowrap">
                            {listing.discountType === 'percent' 
                              ? `${listing.discountAmount / 100}% OFF` 
                              : `$${(listing.discountAmount / 100).toFixed(0)} OFF`}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base font-semibold text-foreground">
                        ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {listing.grade ? `${listing.gradingCompany} ${listing.grade}` : listing.condition}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <div className="w-1 shrink-0 md:hidden" />
        </div>
      </div>
    </div>
  );
}
