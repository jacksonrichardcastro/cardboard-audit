"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Flame, Edit2 } from "lucide-react";
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
    quantity?: number;
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
          <Link key={listing.id} href={`/listings/${listing.id}`} className={`group relative rounded-xl overflow-hidden bg-[#111111] border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300 mx-auto w-full block`}>

            <div className="relative aspect-[5/7] w-full overflow-hidden bg-black">
              <img
                src={photoUrl}
                alt={listing.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-2.5 text-center flex flex-col items-center">
              <h3 className="text-[11px] md:text-sm font-medium line-clamp-1 text-zinc-300 mb-1.5 w-full">
                {listing.title}
              </h3>
              <div className="flex flex-col gap-1 mb-2 w-full items-center">
                {listing.discountType && listing.discountAmount ? (
                  <div className="flex items-center justify-center gap-1.5 w-full">
                    <span className="text-[10px] md:text-[11px] text-zinc-500 line-through shrink-0">
                      ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <p className="text-sm md:text-[15px] font-bold text-[#7C3AED] shrink-0">
                      ${((listing.discountType === 'percent' 
                        ? listing.priceCents * (1 - (listing.discountAmount || 0) / 10000)
                        : listing.discountType === 'dollar'
                        ? Math.max(0, listing.priceCents - (listing.discountAmount || 0))
                        : listing.priceCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                    <div className="bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#7C3AED] text-[8px] md:text-[9px] font-bold px-1 py-0.5 rounded-sm uppercase tracking-wider whitespace-nowrap shrink-0">
                      {listing.discountType === 'percent' 
                        ? `${listing.discountAmount / 100}%` 
                        : `$${(listing.discountAmount / 100).toFixed(0)}`}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm md:text-[15px] font-bold text-white text-center w-full">
                    ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                {((listing.quantity || 1) > 1) && (
                  <span className="text-[9px] md:text-[10px] text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded-full mt-0.5">
                    {listing.quantity} available
                  </span>
                )}
                <p className="text-[10px] md:text-[11px] text-zinc-500 truncate w-full text-center">
                  {listing.grade ? `${listing.gradingCompany} ${listing.grade}` : listing.condition}
                </p>
              </div>
            </div>
            
            {/* STRICT V16 CONFIRMATION: BIN + Offer Flow (No "Bid Now") */}
            <div className="grid grid-cols-2 gap-2 px-2.5 pb-2.5">
              <Button onClick={(e) => handleAction(e, listing.id)} className="h-7 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1 sm:px-2 rounded z-20 relative">
                <span className="sm:hidden">Buy</span>
                <span className="hidden sm:inline">Buy Now</span>
              </Button>
              <Button onClick={(e) => handleAction(e, listing.id)} variant="outline" className="h-7 w-full border-white/10 bg-white/5 hover:bg-white/10 text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1 sm:px-2 rounded z-20 relative">
                <span className="sm:hidden">Offer</span>
                <span className="hidden sm:inline">Make Offer</span>
              </Button>
            </div>
          </Link>
        )
      })}
    </div>
  );
}
