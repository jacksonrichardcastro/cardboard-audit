"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Flame } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { RunDiscountModal } from "./RunDiscountModal";

export interface ActiveListingsGridProps {
  isOwner?: boolean;
  listings: {
    id: number;
    title: string;
    priceCents: number;
    grade: string | null;
    gradingCompany: string | null;
    condition: string;
    discountType?: string | null;
    discountAmount?: number | null;
    discountActiveUntil?: Date | null;
    photos: string[];
  }[];
}

export function ActiveListingsGrid({ isOwner, listings }: ActiveListingsGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isSignedIn } = useAuth();

  const handleAction = (e: React.MouseEvent, listingId: number) => {
    e.preventDefault();
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/listings/${listingId}`);
    } else {
      router.push(`/listings/${listingId}`);
    }
  };



  if (listings.length === 0) {
    return (
      <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
        <p className="text-lg text-zinc-500">No active listings right now. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
      {listings.map((listing) => {
        const photoUrl = (Array.isArray(listing.photos) && listing.photos.length > 0 && listing.photos[0] !== null) 
          ? listing.photos[0] 
          : 'https://placehold.co/400x550';
        
        return (
          <div key={listing.id} className={`group relative rounded-xl overflow-hidden bg-[#111111] border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300 mx-auto w-full`}>

            <Link href={`/listings/${listing.id}`} className="block">
              <div className="relative aspect-[5/7] w-full overflow-hidden bg-black">
                <img
                  src={photoUrl}
                  alt={listing.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5">
                <h3 className="text-[11px] md:text-sm font-medium line-clamp-1 text-zinc-300 mb-1.5">
                  {listing.title}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    {listing.discountType && listing.discountAmount && (
                      <span className="text-[10px] md:text-xs text-zinc-500 line-through">
                        ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    <p className={`text-sm md:text-[15px] font-bold ${listing.discountType ? "text-[#7C3AED]" : "text-white"}`}>
                      ${((listing.discountType === 'percent' 
                        ? listing.priceCents * (1 - (listing.discountAmount || 0) / 10000)
                        : listing.discountType === 'dollar'
                        ? Math.max(0, listing.priceCents - (listing.discountAmount || 0))
                        : listing.priceCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-zinc-500 truncate ml-1.5">
                    {listing.grade ? `${listing.gradingCompany} ${listing.grade}` : listing.condition}
                  </p>
                </div>
              </div>
            </Link>

            {isOwner && (
              <RunDiscountModal
                listingId={listing.id}
                listingPriceCents={listing.priceCents}
                currentType={listing.discountType}
                currentAmount={listing.discountAmount}
                currentUntil={listing.discountActiveUntil}
                triggerNode={
                  <button className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-md p-1.5 rounded-md border border-white/10 text-white z-20 transition-colors">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </button>
                }
              />
            )}
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
            
            {/* STRICT V16 CONFIRMATION: BIN + Offer Flow (No "Bid Now") */}
            <div className="grid grid-cols-2 gap-2 px-2.5 pb-2.5">
              <Button onClick={(e) => handleAction(e, listing.id)} className="h-7 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1 sm:px-2 rounded z-20 relative">
                Buy Now
              </Button>
              <Button onClick={(e) => handleAction(e, listing.id)} variant="outline" className="h-7 w-full border-white/10 bg-white/5 hover:bg-white/10 text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1 sm:px-2 rounded z-20 relative">
                Make Offer
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  );
}
