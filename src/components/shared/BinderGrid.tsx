"use client";

import Link from "next/link";
import { Lock, Star } from "lucide-react";
import { setGrailListing } from "@/app/actions/profile";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export interface BinderGridProps {
  isOwner?: boolean;
  collectionValueCents?: number | null;
  // This prop designates which listing is the user's grail
  grailListingId?: number | null;
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

export function BinderGrid({ isOwner, collectionValueCents, grailListingId, listings }: BinderGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSetGrail = (e: React.MouseEvent, listingId: number) => {
    e.preventDefault(); // prevent navigation
    startTransition(async () => {
      try {
        await setGrailListing(listingId);
        router.refresh();
      } catch (err) {
        console.error("Failed to set grail", err);
      }
    });
  };

  // Confirmation #2: Binder defaults to private
  const isPrivate = true; // Hardcoded default-private for public view in V1

  if (listings.length === 0) {
    return (
      <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
        <p className="text-lg text-zinc-500">This binder is empty.</p>
      </div>
    );
  }

  // To simulate the grail being the top-middle slot, we can reorder the array.
  // We'll put the grail at index 2 (middle of a 5-column row).
  const grailListing = listings.find(l => l.id === grailListingId) || listings[0];
  const regularListings = listings.filter(l => l.id !== grailListing.id);
  
  // Create a display array where grail is injected at index 2 (if enough items exist)
  const displayListings = [...regularListings];
  if (displayListings.length >= 2) {
    displayListings.splice(2, 0, grailListing);
  } else {
    displayListings.unshift(grailListing);
  }

  return (
    <div className="space-y-8">
      {/* Binder Header & Collection Value (Private by default) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Online Binder</h2>
          <p className="text-sm text-zinc-500">Curated Collection Showcase</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-white/5">
          <Lock className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-400">
            {isPrivate ? "Private Value" : `$${((collectionValueCents || 0) / 100).toLocaleString()}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {displayListings.map((listing, idx) => {
          const isGrail = listing.id === grailListing.id;
          const photoUrl = (Array.isArray(listing.photos) && listing.photos.length > 0 && listing.photos[0] !== null) 
            ? listing.photos[0] 
            : 'https://placehold.co/400x550';
          
          return (
            <div 
              key={listing.id} 
              className={`relative flex flex-col group ${isGrail ? 'md:scale-110 md:z-10 mx-2' : ''}`}
            >
              
              {/* MVP Grail Toggle for Owners */}
              {isOwner && (
                <button 
                  onClick={(e) => handleSetGrail(e, listing.id)}
                  disabled={isPending}
                  className={`absolute top-2 right-2 z-30 p-2 rounded-md backdrop-blur-sm transition-all hover:scale-105 flex flex-col items-center gap-1 ${
                    grailListingId === listing.id 
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]' 
                      : 'bg-black/60 text-[#7C3AED] hover:bg-[#7C3AED]/20 border border-transparent hover:border-[#7C3AED]/50'
                  }`}
                  title={grailListingId === listing.id ? "Currently your Grail" : "Set as Grail"}
                >
                  <Star className="w-4 h-4" fill={grailListingId === listing.id ? "currentColor" : "none"} />
                  <span className="text-[9px] font-medium tracking-wider uppercase">
                    {grailListingId === listing.id ? "Your Grail" : "List as Grail"}
                  </span>
                </button>
              )}

              {/* V16 Grail Centerpiece Styling */}
              <div className={`relative aspect-[3/4] w-full rounded-lg overflow-hidden border transition-all duration-300 ${
                  isGrail 
                    ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)] bg-gradient-to-b from-[#D4AF37]/20 to-black' 
                    : 'border-white/10 bg-black group-hover:border-white/20'
                }`}
              >
                <img
                  src={photoUrl}
                  alt={listing.title}
                  className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-cover rounded-sm"
                  loading="lazy"
                />
              </div>

              {/* Grail Subtitle Label */}
              {isGrail && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black border border-[#D4AF37] px-3 py-1 rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20">
                  <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                    Alex's Grail
                  </span>
                </div>
              )}

              {/* Card Metadata */}
              <div className={`mt-4 px-1 space-y-1 ${isGrail ? 'mt-6 text-center' : ''}`}>
                <h3 className="text-xs font-semibold line-clamp-1 text-zinc-300" title={listing.title}>
                  {listing.title}
                </h3>
                <div className={`flex items-center ${isGrail ? 'justify-center' : 'justify-between'}`}>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {listing.grade ? `${listing.gradingCompany} ${listing.grade}` : listing.condition}
                  </p>
                  {!isGrail && (
                    <p className="text-xs font-bold text-white">
                      ${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
