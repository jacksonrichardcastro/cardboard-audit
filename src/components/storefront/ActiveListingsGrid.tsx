"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export interface ActiveListingsGridProps {
  isOwner?: boolean;
  listings: {
    id: number;
    title: string;
    priceCents: number;
    grade: string | null;
    gradingCompany: string | null;
    condition: string;
    photos: string[];
  }[];
}

export function ActiveListingsGrid({ isOwner, listings }: ActiveListingsGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();



  if (listings.length === 0) {
    return (
      <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
        <p className="text-lg text-zinc-500">No active listings right now. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {listings.map((listing) => {
        const photoUrl = (Array.isArray(listing.photos) && listing.photos.length > 0 && listing.photos[0] !== null) 
          ? listing.photos[0] 
          : 'https://placehold.co/400x550';
        
        return (
          <div key={listing.id} className={`group relative rounded-xl overflow-hidden bg-[#111111] border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300 mx-auto w-[65%]`}>

            <Link href={`/listings/${listing.id}`} className="block">
              <div className="relative aspect-[5/7] w-full overflow-hidden bg-black">
                <img
                  src={photoUrl}
                  alt={listing.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <h3 className="text-xs md:text-sm font-medium line-clamp-1 text-zinc-300 mb-2">
                  {listing.title}
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm md:text-base font-bold text-white">
                    ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] md:text-xs text-zinc-500 truncate ml-2">
                    {listing.grade ? `${listing.gradingCompany} ${listing.grade}` : listing.condition}
                  </p>
                </div>
              </div>
            </Link>
            
            {/* STRICT V16 CONFIRMATION: BIN + Offer Flow (No "Bid Now") */}
            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
              <Button size="sm" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold">
                Buy Now
              </Button>
              <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold">
                Make Offer
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  );
}
