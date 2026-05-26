import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { setGrailListing } from "@/app/actions/profile";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export interface ActiveListingsGridProps {
  isOwner?: boolean;
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

export function ActiveListingsGrid({ isOwner, grailListingId, listings }: ActiveListingsGridProps) {
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
          <div key={listing.id} className="group relative rounded-xl overflow-hidden bg-[#111111] border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300">
            
            {/* MVP Grail Toggle for Owners */}
            {isOwner && (
              <button 
                onClick={(e) => handleSetGrail(e, listing.id)}
                disabled={isPending}
                className={`absolute top-2 right-2 z-20 p-2 rounded-md backdrop-blur-sm transition-all hover:scale-105 flex flex-col items-center gap-1 ${
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

            <Link href={`/listings/${listing.id}`} className="block">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
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
